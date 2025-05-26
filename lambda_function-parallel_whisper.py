import json
import boto3
import os
from supabase import create_client, Client
import openai
from botocore.exceptions import ClientError
import time
import subprocess
import tempfile
import asyncio
import concurrent.futures
from typing import List, Dict, Tuple
from pydub import AudioSegment
import re

# Initialize AWS S3 client
s3_client = boto3.client('s3')
lambda_client = boto3.client('lambda')

# Initialize Supabase client
supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Get the ARN of the Note Generation Agent Lambda function
NOTE_GENERATOR_LAMBDA_ARN: str = os.environ.get("NOTE_GENERATOR_LAMBDA_ARN")

# Configuration
OPENAI_MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB in bytes
CHUNK_DURATION_MINUTES = 8  # Shorter chunks for better parallelization
MAX_PARALLEL_WORKERS = 5  # Limit concurrent API calls to avoid rate limiting
CHUNK_OVERLAP_SECONDS = 30  # Overlap between chunks to maintain context

def update_video_status(video_id: str, status: str, error_message: str = None):
    """Helper function to update video transcription status in Supabase."""
    print(f"Attempting to update video {video_id} status to: {status}")
    update_data = {'transcription_status': status}
    if error_message:
        update_data['error_message'] = error_message

    try:
        response = supabase.table('videos').update(update_data).eq('id', video_id).execute()
        if response.data is None or (isinstance(response.data, list) and len(response.data) == 0):
            print(f"Warning: Update video status for {video_id} to {status} might not have been successful.")
        else:
            print(f"Video {video_id} status updated to {status} successfully.")
    except Exception as e:
        print(f"Error updating video status for {video_id} to {status}: {e}")

def compress_audio_for_whisper(input_path: str, target_size_mb: float = 24.0) -> str:
    """
    Compress audio file to fit within OpenAI Whisper size limits.
    Optimized for speech recognition while maintaining quality.
    """
    try:
        print(f"Loading audio file for compression: {input_path}")
        
        # Load audio file
        audio = AudioSegment.from_file(input_path)
        
        # Get original file info
        original_size = os.path.getsize(input_path)
        original_size_mb = original_size / (1024 * 1024)
        duration_seconds = len(audio) / 1000.0
        
        print(f"Original file: {original_size_mb:.2f} MB, {duration_seconds:.1f} seconds")
        
        # If file is already small enough, return original
        if original_size_mb <= target_size_mb:
            print(f"File is already within size limit ({original_size_mb:.2f} MB <= {target_size_mb} MB)")
            return input_path
        
        # Calculate compression ratio needed
        compression_ratio = target_size_mb / original_size_mb
        print(f"Compression ratio needed: {compression_ratio:.2f}")
        
        # Optimize for speech recognition
        # Convert to mono (reduces size by ~50% for stereo files)
        if audio.channels > 1:
            print("Converting to mono")
            audio = audio.set_channels(1)
        
        # Set optimal sample rate for speech (16kHz is standard for Whisper)
        target_sample_rate = 16000
        if audio.frame_rate != target_sample_rate:
            print(f"Resampling from {audio.frame_rate} Hz to {target_sample_rate} Hz")
            audio = audio.set_frame_rate(target_sample_rate)
        
        # Determine bitrate based on compression needs
        if compression_ratio < 0.4:
            target_bitrate = "32k"
            print("Using aggressive compression (32k bitrate)")
        elif compression_ratio < 0.6:
            target_bitrate = "48k"
            print("Using moderate compression (48k bitrate)")
        else:
            target_bitrate = "64k"
            print("Using light compression (64k bitrate)")
        
        # Export with compression
        compressed_path = input_path.replace('.', '_compressed.')
        if not compressed_path.endswith('.mp3'):
            compressed_path = compressed_path.rsplit('.', 1)[0] + '.mp3'
        
        print(f"Exporting compressed audio to: {compressed_path}")
        audio.export(
            compressed_path,
            format="mp3",
            bitrate=target_bitrate,
            parameters=["-q:a", "2"]  # Good quality setting for MP3
        )
        
        # Check final size
        compressed_size = os.path.getsize(compressed_path)
        compressed_size_mb = compressed_size / (1024 * 1024)
        reduction_percent = ((original_size_mb - compressed_size_mb) / original_size_mb * 100)
        
        print(f"Compressed file: {compressed_size_mb:.2f} MB (reduction: {reduction_percent:.1f}%)")
        
        return compressed_path
        
    except Exception as e:
        print(f"Error compressing audio: {e}")
        print("Falling back to original file")
        return input_path

def create_audio_chunks_with_overlap(input_path: str, chunk_duration_minutes: int = 8, overlap_seconds: int = 30) -> List[Dict]:
    """
    Create audio chunks with overlap using pydub for better context preservation.
    Returns list of chunk info with file paths and timing.
    """
    try:
        print(f"Creating audio chunks from: {input_path}")
        
        # Load audio file
        audio = AudioSegment.from_file(input_path)
        total_duration_ms = len(audio)
        total_duration_seconds = total_duration_ms / 1000.0
        
        print(f"Total audio duration: {total_duration_seconds:.2f} seconds ({total_duration_seconds/60:.2f} minutes)")
        
        chunk_duration_ms = chunk_duration_minutes * 60 * 1000  # Convert to milliseconds
        overlap_ms = overlap_seconds * 1000
        
        chunks = []
        chunk_index = 0
        start_ms = 0
        
        while start_ms < total_duration_ms:
            # Calculate end time for this chunk
            end_ms = min(start_ms + chunk_duration_ms, total_duration_ms)
            
            # Extract chunk with overlap
            chunk_audio = audio[start_ms:end_ms]
            
            # Skip very short chunks (less than 10 seconds)
            if len(chunk_audio) < 10000:  # 10 seconds in ms
                break
            
            # Save chunk to file
            chunk_path = f"/tmp/chunk_{chunk_index:03d}.mp3"
            chunk_audio.export(chunk_path, format="mp3", bitrate="64k")
            
            chunk_info = {
                'index': chunk_index,
                'path': chunk_path,
                'start_seconds': start_ms / 1000.0,
                'end_seconds': end_ms / 1000.0,
                'duration_seconds': len(chunk_audio) / 1000.0,
                'size_mb': os.path.getsize(chunk_path) / (1024 * 1024)
            }
            
            chunks.append(chunk_info)
            print(f"Chunk {chunk_index + 1}: {chunk_info['start_seconds']:.1f}s - {chunk_info['end_seconds']:.1f}s ({chunk_info['size_mb']:.2f} MB)")
            
            # Move to next chunk (with overlap)
            start_ms = end_ms - overlap_ms
            chunk_index += 1
            
            # Safety check to prevent infinite loops
            if chunk_index > 50:  # Max 50 chunks (400+ minutes)
                print("Warning: Maximum chunk limit reached")
                break
        
        print(f"Created {len(chunks)} chunks with {overlap_seconds}s overlap")
        return chunks
        
    except Exception as e:
        print(f"Error creating audio chunks: {e}")
        raise

def transcribe_single_chunk(chunk_info: Dict, openai_client, chunk_number: int, total_chunks: int) -> Dict:
    """
    Transcribe a single audio chunk.
    Returns transcription result with metadata.
    """
    try:
        print(f"Transcribing chunk {chunk_number}/{total_chunks}: {chunk_info['path']}")
        
        # Check chunk size
        if chunk_info['size_mb'] > 25:
            print(f"Warning: Chunk {chunk_number} ({chunk_info['size_mb']:.2f} MB) exceeds OpenAI limit")
            return {
                'index': chunk_info['index'],
                'success': False,
                'text': f"[Chunk {chunk_number} too large to transcribe]",
                'start_seconds': chunk_info['start_seconds'],
                'end_seconds': chunk_info['end_seconds'],
                'error': 'File too large'
            }
        
        start_time = time.time()
        
        with open(chunk_info['path'], "rb") as audio_file:
            transcription = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        
        transcription_time = time.time() - start_time
        
        # Handle different response formats
        if hasattr(transcription, 'text'):
            text = transcription.text
        else:
            text = str(transcription)
        
        print(f"Chunk {chunk_number} transcribed in {transcription_time:.2f}s: {len(text)} characters")
        
        return {
            'index': chunk_info['index'],
            'success': True,
            'text': text,
            'start_seconds': chunk_info['start_seconds'],
            'end_seconds': chunk_info['end_seconds'],
            'transcription_time': transcription_time,
            'character_count': len(text)
        }
        
    except Exception as e:
        print(f"Error transcribing chunk {chunk_number}: {e}")
        return {
            'index': chunk_info['index'],
            'success': False,
            'text': f"[Error transcribing chunk {chunk_number}: {str(e)}]",
            'start_seconds': chunk_info['start_seconds'],
            'end_seconds': chunk_info['end_seconds'],
            'error': str(e)
        }

def transcribe_chunks_parallel(chunks: List[Dict], openai_client, max_workers: int = 5) -> List[Dict]:
    """
    Transcribe multiple chunks in parallel using ThreadPoolExecutor.
    """
    print(f"Starting parallel transcription of {len(chunks)} chunks with {max_workers} workers")
    
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all transcription tasks
        future_to_chunk = {
            executor.submit(transcribe_single_chunk, chunk, openai_client, i + 1, len(chunks)): chunk
            for i, chunk in enumerate(chunks)
        }
        
        # Collect results as they complete
        for future in concurrent.futures.as_completed(future_to_chunk):
            chunk = future_to_chunk[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                print(f"Chunk transcription failed: {e}")
                results.append({
                    'index': chunk['index'],
                    'success': False,
                    'text': f"[Transcription failed: {str(e)}]",
                    'start_seconds': chunk['start_seconds'],
                    'end_seconds': chunk['end_seconds'],
                    'error': str(e)
                })
    
    # Sort results by chunk index to maintain order
    results.sort(key=lambda x: x['index'])
    
    successful_chunks = sum(1 for r in results if r['success'])
    print(f"Parallel transcription completed: {successful_chunks}/{len(chunks)} chunks successful")
    
    return results

def merge_and_clean_transcriptions(transcription_results: List[Dict], overlap_seconds: int = 30) -> str:
    """
    Merge transcription results and clean up overlapping content.
    """
    print("Merging and cleaning transcription results...")
    
    if not transcription_results:
        return ""
    
    # Sort by start time to ensure proper order
    transcription_results.sort(key=lambda x: x['start_seconds'])
    
    merged_text = ""
    previous_end_text = ""
    
    for i, result in enumerate(transcription_results):
        if not result['success']:
            # Include error messages but mark them clearly
            merged_text += f"\n\n{result['text']}\n\n"
            continue
        
        current_text = result['text'].strip()
        
        if i == 0:
            # First chunk - use as is
            merged_text = current_text
            # Store last few words for overlap detection
            words = current_text.split()
            previous_end_text = " ".join(words[-10:]) if len(words) >= 10 else current_text
        else:
            # Find and remove overlap with previous chunk
            cleaned_text = remove_text_overlap(previous_end_text, current_text)
            
            # Add cleaned text
            if cleaned_text.strip():
                merged_text += " " + cleaned_text
            
            # Update previous end text for next iteration
            words = cleaned_text.split()
            previous_end_text = " ".join(words[-10:]) if len(words) >= 10 else cleaned_text
    
    # Final cleanup
    cleaned_transcript = clean_transcript_formatting(merged_text)
    
    print(f"Merged transcript: {len(cleaned_transcript)} characters")
    return cleaned_transcript

def remove_text_overlap(previous_text: str, current_text: str) -> str:
    """
    Remove overlapping text between consecutive chunks.
    """
    if not previous_text or not current_text:
        return current_text
    
    # Convert to lowercase for comparison
    prev_lower = previous_text.lower()
    curr_lower = current_text.lower()
    
    # Look for overlap - check last N words of previous against first N words of current
    prev_words = prev_lower.split()
    curr_words = curr_lower.split()
    original_curr_words = current_text.split()
    
    max_overlap_check = min(len(prev_words), len(curr_words), 15)  # Check up to 15 words
    
    for overlap_length in range(max_overlap_check, 2, -1):  # Start with longer overlaps
        prev_end = " ".join(prev_words[-overlap_length:])
        curr_start = " ".join(curr_words[:overlap_length])
        
        # Check for exact match or high similarity
        if prev_end == curr_start:
            # Found exact overlap - remove it from current text
            remaining_words = original_curr_words[overlap_length:]
            return " ".join(remaining_words)
        
        # Check for partial overlap (80% similarity)
        similarity = calculate_text_similarity(prev_end, curr_start)
        if similarity > 0.8:
            remaining_words = original_curr_words[overlap_length:]
            return " ".join(remaining_words)
    
    # No significant overlap found
    return current_text

def calculate_text_similarity(text1: str, text2: str) -> float:
    """
    Calculate similarity between two text strings.
    """
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union) if union else 0.0

def clean_transcript_formatting(text: str) -> str:
    """
    Clean up the merged transcript formatting.
    """
    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text)
    
    # Fix sentence boundaries
    text = re.sub(r'\s*\.\s*', '. ', text)
    text = re.sub(r'\s*\?\s*', '? ', text)
    text = re.sub(r'\s*!\s*', '! ', text)
    
    # Remove duplicate punctuation
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r'\?{2,}', '?', text)
    text = re.sub(r'!{2,}', '!', text)
    
    # Ensure proper capitalization after periods
    sentences = text.split('. ')
    cleaned_sentences = []
    for sentence in sentences:
        sentence = sentence.strip()
        if sentence:
            # Capitalize first letter
            sentence = sentence[0].upper() + sentence[1:] if len(sentence) > 1 else sentence.upper()
            cleaned_sentences.append(sentence)
    
    return '. '.join(cleaned_sentences)

def cleanup_temp_files(file_paths: List[str]):
    """Clean up temporary files."""
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Removed temporary file: {file_path}")
        except Exception as e:
            print(f"Warning: Could not remove {file_path}: {e}")

def lambda_handler(event, context):
    """
    Enhanced Lambda function with compression, chunking, and parallel Whisper transcription.
    """
    print("Received event:", json.dumps(event))

    video_id = None
    user_id = None
    s3_bucket = None
    s3_key = None
    
    try:
        # Parse event payload
        try:
            payload = json.loads(event['body'])
            s3_bucket = payload['bucketName']
            s3_key = payload['s3Key']
            video_id = payload['videoId']
            user_id = payload['userId']
            note_format = payload.get('noteFormat', 'Markdown')
        except (KeyError, json.JSONDecodeError):
            s3_bucket = event.get('bucketName')
            s3_key = event.get('s3Key')
            video_id = event.get('videoId')
            user_id = event.get('userId')
            note_format = event.get('noteFormat', 'Markdown')
    except Exception as e:
        print(f"Error parsing event: {e}")
        return {
            'statusCode': 400,
            'body': json.dumps(f'Error parsing event: {e}')
        }

    if not s3_bucket or not s3_key or not video_id or not user_id:
        error_msg = "Missing S3 bucket, key, video ID, or user ID in event payload."
        print(f"Error: {error_msg}")
        if video_id:
            update_video_status(video_id, 'failed', error_msg)
        return {
            'statusCode': 400,
            'body': json.dumps(f'Error: {error_msg}')
        }

    print(f"Processing s3://{s3_bucket}/{s3_key} for video ID: {video_id}, user ID: {user_id}")

    # Check if this video is already being processed
    try:
        existing_video = supabase.table('videos').select('transcription_status').eq('id', video_id).execute()
        if existing_video.data and len(existing_video.data) > 0:
            current_status = existing_video.data[0]['transcription_status']
            if current_status in ['in_progress', 'completed']:
                print(f"Video {video_id} is already {current_status}. Skipping processing.")
                return {
                    'statusCode': 200,
                    'body': json.dumps(f'Video already {current_status}. Skipping duplicate processing.')
                }
    except Exception as e:
        print(f"Warning: Could not check existing video status: {e}")

    # Update status to in_progress
    update_video_status(video_id, 'in_progress')

    # Define local paths
    local_audio_path = f"/tmp/{os.path.basename(s3_key)}"
    temp_files = [local_audio_path]

    try:
        # Check file size
        try:
            file_info = s3_client.head_object(Bucket=s3_bucket, Key=s3_key)
            file_size = file_info['ContentLength']
            file_size_mb = file_size / (1024 * 1024)
            print(f"File size: {file_size_mb:.2f} MB")
            
            # Check if file is too large for Lambda /tmp (512MB limit)
            if file_size_mb > 400:
                error_msg = f"File too large ({file_size_mb:.2f} MB) for Lambda processing. Maximum supported size is ~400MB."
                print(error_msg)
                update_video_status(video_id, 'failed', error_msg)
                return {
                    'statusCode': 413,
                    'body': json.dumps(error_msg)
                }
        except ClientError as e:
            error_msg = f"Could not get file info from S3: {e}"
            print(error_msg)
            update_video_status(video_id, 'failed', error_msg)
            return {
                'statusCode': 404,
                'body': json.dumps(error_msg)
            }

        # Download the audio file from S3
        print(f"Downloading {file_size_mb:.2f} MB file from S3...")
        start_time = time.time()
        s3_client.download_file(s3_bucket, s3_key, local_audio_path)
        download_time = time.time() - start_time
        print(f"Downloaded audio to {local_audio_path} in {download_time:.2f} seconds")

        # Initialize OpenAI client
        openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

        # Step 1: Compress audio if needed
        processing_file = local_audio_path
        if file_size > OPENAI_MAX_FILE_SIZE:
            print(f"File size ({file_size_mb:.2f} MB) exceeds OpenAI limit. Compressing...")
            compression_start = time.time()
            compressed_path = compress_audio_for_whisper(local_audio_path, target_size_mb=20.0)  # Leave room for chunking
            temp_files.append(compressed_path)
            compression_time = time.time() - compression_start
            print(f"Audio compression completed in {compression_time:.2f} seconds")
            processing_file = compressed_path

        # Step 2: Create chunks with overlap
        print("Creating audio chunks for parallel processing...")
        chunk_start = time.time()
        chunks = create_audio_chunks_with_overlap(
            processing_file, 
            chunk_duration_minutes=CHUNK_DURATION_MINUTES,
            overlap_seconds=CHUNK_OVERLAP_SECONDS
        )
        
        # Add chunk files to cleanup list
        for chunk in chunks:
            temp_files.append(chunk['path'])
        
        chunk_time = time.time() - chunk_start
        print(f"Created {len(chunks)} chunks in {chunk_time:.2f} seconds")

        # Step 3: Parallel transcription
        print("Starting parallel transcription...")
        transcription_start = time.time()
        transcription_results = transcribe_chunks_parallel(chunks, openai_client, MAX_PARALLEL_WORKERS)
        transcription_time = time.time() - transcription_start
        print(f"Parallel transcription completed in {transcription_time:.2f} seconds")

        # Step 4: Merge and clean transcriptions
        print("Merging and cleaning transcriptions...")
        merge_start = time.time()
        final_transcript = merge_and_clean_transcriptions(transcription_results, CHUNK_OVERLAP_SECONDS)
        merge_time = time.time() - merge_start
        print(f"Transcript merging completed in {merge_time:.2f} seconds")

        print(f"Final transcript length: {len(final_transcript)} characters")
        print("Transcript preview:", final_transcript[:300] + "..." if len(final_transcript) > 300 else final_transcript)

        # Save transcription to Supabase
        existing_transcript = supabase.table('transcripts').select('id').eq('video_id', video_id).execute()

        if existing_transcript.data:
            print(f"Updating existing transcript for video_id: {video_id}")
            supabase.table('transcripts').update({
                'content': final_transcript,
            }).eq('video_id', video_id).execute()
        else:
            print(f"Inserting new transcript for video_id: {video_id}")
            supabase.table('transcripts').insert({
                'video_id': video_id,
                'content': final_transcript,
            }).execute()

        print(f"Transcription saved for video_id: {video_id}")

        # Clean up temporary files
        cleanup_temp_files(temp_files)

        # Trigger Note Generation Lambda
        if NOTE_GENERATOR_LAMBDA_ARN:
            print(f"Invoking Note Generation Lambda for video ID: {video_id}")
            try:
                invoke_response = lambda_client.invoke(
                    FunctionName=NOTE_GENERATOR_LAMBDA_ARN,
                    InvocationType='Event',
                    Payload=json.dumps({
                        'videoId': video_id,
                        'userId': user_id,
                        'rawTranscript': final_transcript,
                        'noteFormat': note_format
                    })
                )
                print(f"Note Generation Lambda invoked successfully for video ID: {video_id}")
                print(f"Invoke response status: {invoke_response.get('StatusCode', 'Unknown')}")

                update_video_status(video_id, 'completed')

            except Exception as e:
                error_msg = f"Error invoking Note Generation Lambda: {e}"
                print(error_msg)
                update_video_status(video_id, 'failed', error_msg)
                return {
                    'statusCode': 500,
                    'body': json.dumps(error_msg)
                }
        else:
            print("NOTE_GENERATOR_LAMBDA_ARN not set. Skipping note generation.")
            update_video_status(video_id, 'completed')

        # Calculate success metrics
        successful_chunks = sum(1 for r in transcription_results if r['success'])
        total_processing_time = download_time + transcription_time + merge_time
        if file_size > OPENAI_MAX_FILE_SIZE:
            total_processing_time += compression_time

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Parallel transcription processed and note generation triggered successfully.',
                'videoId': video_id,
                'transcriptionLength': len(final_transcript),
                'processingStats': {
                    'totalChunks': len(chunks),
                    'successfulChunks': successful_chunks,
                    'parallelWorkers': MAX_PARALLEL_WORKERS,
                    'chunkDurationMinutes': CHUNK_DURATION_MINUTES,
                    'overlapSeconds': CHUNK_OVERLAP_SECONDS
                },
                'processingTime': {
                    'download': f"{download_time:.2f}s",
                    'compression': f"{compression_time:.2f}s" if file_size > OPENAI_MAX_FILE_SIZE else "0s",
                    'chunking': f"{chunk_time:.2f}s",
                    'transcription': f"{transcription_time:.2f}s",
                    'merging': f"{merge_time:.2f}s",
                    'total': f"{total_processing_time:.2f}s"
                },
                'compressed': file_size > OPENAI_MAX_FILE_SIZE,
                'chunked': True
            })
        }

    except openai.APIError as e:
        error_msg = f"OpenAI API Error: {e}"
        print(error_msg)
        update_video_status(video_id, 'failed', error_msg)
        cleanup_temp_files(temp_files)
        return {
            'statusCode': 502,
            'body': json.dumps(error_msg)
        }
    except Exception as e:
        error_msg = f"Error processing transcription: {e}"
        print(error_msg)
        update_video_status(video_id, 'failed', error_msg)
        cleanup_temp_files(temp_files)
        return {
            'statusCode': 500,
            'body': json.dumps(error_msg)
        } 