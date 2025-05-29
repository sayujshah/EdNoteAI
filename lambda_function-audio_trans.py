import json
import os
import time
import concurrent.futures
from typing import List, Dict
import re

# Use AWS SDK that's already built into Lambda
import boto3
from botocore.exceptions import ClientError
print("[SUCCESS] Using built-in AWS SDK")

# Import other dependencies
try:
    from pydub import AudioSegment
    print("[SUCCESS] pydub imported successfully")
except ImportError as e:
    print(f"[ERROR] Failed to import pydub: {e}")
    raise

try:
    import openai
    print("[SUCCESS] OpenAI imported successfully")
except ImportError as e:
    print(f"[ERROR] Failed to import OpenAI: {e}")
    raise

try:
    from supabase import create_client, Client
    print("[SUCCESS] Supabase imported successfully")
except ImportError as e:
    print(f"[WARNING] Failed to import Supabase: {e}")
    # Continue without Supabase for testing
    create_client = None
    Client = None

# Configure FFmpeg and FFprobe paths for Lambda
FFMPEG_PATH = "/var/task/ffmpeg"
FFPROBE_PATH = "/var/task/ffprobe"

ffmpeg_available = os.path.exists(FFMPEG_PATH)
ffprobe_available = os.path.exists(FFPROBE_PATH)

if ffmpeg_available and ffprobe_available:
    AudioSegment.converter = FFMPEG_PATH
    AudioSegment.ffmpeg = FFMPEG_PATH
    AudioSegment.ffprobe = FFPROBE_PATH
    print(f"[SUCCESS] FFmpeg configured at: {FFMPEG_PATH}")
    print(f"[SUCCESS] FFprobe configured at: {FFPROBE_PATH}")
elif ffmpeg_available:
    print(f"[WARNING] FFmpeg found but FFprobe missing - audio processing may be limited")
    AudioSegment.converter = FFMPEG_PATH
    AudioSegment.ffmpeg = FFMPEG_PATH
elif ffprobe_available:
    print(f"[WARNING] FFprobe found but FFmpeg missing - audio processing may be limited")
    AudioSegment.ffprobe = FFPROBE_PATH
else:
    print("[WARNING] Neither FFmpeg nor FFprobe found - audio processing will be severely limited")

# Initialize clients
s3_client = boto3.client('s3')
lambda_client = boto3.client('lambda')

# Initialize Supabase client
supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_key: str = os.environ.get("SUPABASE_KEY")
if create_client and supabase_url and supabase_key:
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print("[SUCCESS] Supabase client initialized")
    except Exception as e:
        print(f"[WARNING] Failed to initialize Supabase: {e}")
        supabase = None
else:
    supabase = None
    print("[WARNING] Supabase not configured")

# Configuration
OPENAI_MAX_FILE_SIZE = 25 * 1024 * 1024
CHUNK_DURATION_MINUTES = 8
MAX_PARALLEL_WORKERS = 5
CHUNK_OVERLAP_SECONDS = 30

def update_video_status(video_id: str, status: str, error_message: str = None):
    """Update video status in Supabase."""
    if not supabase:
        print(f"Supabase not configured. Status: {video_id} -> {status}")
        return
    
    try:
        update_data = {'transcription_status': status}
        if error_message:
            update_data['error_message'] = error_message
        
        response = supabase.table('videos').update(update_data).eq('id', video_id).execute()
        print(f"Video {video_id} status updated to {status}")
    except Exception as e:
        print(f"Error updating video status: {e}")

def compress_audio_for_whisper(input_path: str, target_size_mb: float = 24.0) -> str:
    """Compress audio file for Whisper."""
    try:
        print(f"Loading audio file for compression: {input_path}")
        
        # Check file size first without loading audio
        original_size = os.path.getsize(input_path)
        original_size_mb = original_size / (1024 * 1024)
        
        print(f"Original file: {original_size_mb:.2f} MB")
        
        if original_size_mb <= target_size_mb:
            print("File already within size limit")
            return input_path
        
        # Try to load audio with error handling for missing ffprobe
        try:
            audio = AudioSegment.from_file(input_path)
        except Exception as audio_error:
            print(f"Failed to load audio with pydub (likely missing ffprobe): {audio_error}")
            print("Skipping compression - will attempt direct processing")
            return input_path
        
        # Optimize for speech
        if audio.channels > 1:
            print("Converting to mono")
            audio = audio.set_channels(1)
        
        print("Resampling to 16kHz")
        audio = audio.set_frame_rate(16000)
        
        # Determine compression level
        compression_ratio = target_size_mb / original_size_mb
        if compression_ratio < 0.4:
            bitrate = "32k"
        elif compression_ratio < 0.6:
            bitrate = "48k"
        else:
            bitrate = "64k"
        
        print(f"Compressing with bitrate: {bitrate}")
        compressed_path = input_path.replace('.', '_compressed.') + '.mp3'
        
        try:
            audio.export(compressed_path, format="mp3", bitrate=bitrate)
            compressed_size = os.path.getsize(compressed_path) / (1024 * 1024)
            print(f"Compressed to: {compressed_size:.2f} MB")
            return compressed_path
        except Exception as export_error:
            print(f"Failed to export compressed audio: {export_error}")
            print("Returning original file")
            return input_path
            
    except Exception as e:
        print(f"Compression failed: {e}")
        print("Returning original file")
        return input_path

def compress_with_ffmpeg_direct(input_path: str, target_size_mb: float = 24.0) -> str:
    """Compress audio using ffmpeg directly when pydub fails."""
    try:
        import subprocess
        
        original_size = os.path.getsize(input_path)
        original_size_mb = original_size / (1024 * 1024)
        
        print(f"Direct ffmpeg compression for {original_size_mb:.2f} MB file")
        
        if original_size_mb <= target_size_mb:
            print("File already within size limit")
            return input_path
        
        # Check if ffmpeg is available
        if not os.path.exists(FFMPEG_PATH):
            print("FFmpeg not available for direct compression")
            return input_path
        
        # Calculate target bitrate based on compression ratio needed
        compression_ratio = target_size_mb / original_size_mb
        if compression_ratio < 0.3:
            bitrate = "32k"
        elif compression_ratio < 0.5:
            bitrate = "48k"
        elif compression_ratio < 0.7:
            bitrate = "64k"
        else:
            bitrate = "96k"
        
        compressed_path = input_path.replace('.', '_ffmpeg_compressed.') + '.mp3'
        
        # FFmpeg command for aggressive compression optimized for speech
        ffmpeg_cmd = [
            FFMPEG_PATH,
            '-i', input_path,
            '-ac', '1',  # Convert to mono
            '-ar', '16000',  # 16kHz sample rate (optimal for Whisper)
            '-ab', bitrate,  # Audio bitrate
            '-f', 'mp3',  # Output format
            '-y',  # Overwrite output file
            compressed_path
        ]
        
        print(f"Running ffmpeg compression with bitrate {bitrate}...")
        print(f"Command: {' '.join(ffmpeg_cmd)}")
        
        # Run ffmpeg with timeout
        result = subprocess.run(
            ffmpeg_cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode == 0:
            if os.path.exists(compressed_path):
                compressed_size = os.path.getsize(compressed_path) / (1024 * 1024)
                reduction = ((original_size_mb - compressed_size) / original_size_mb) * 100
                print(f"FFmpeg compression successful: {compressed_size:.2f} MB ({reduction:.1f}% reduction)")
                
                if compressed_size <= target_size_mb:
                    return compressed_path
                else:
                    print(f"Compressed file still too large: {compressed_size:.2f} MB > {target_size_mb} MB")
                    # Try more aggressive compression
                    if bitrate != "32k":
                        print("Attempting more aggressive compression...")
                        os.remove(compressed_path)
                        return compress_with_ffmpeg_direct(input_path, target_size_mb * 0.8)  # Try for smaller target
                    else:
                        print("Already at minimum bitrate, returning compressed file anyway")
                        return compressed_path
            else:
                print("FFmpeg compression failed - output file not created")
                return input_path
        else:
            print(f"FFmpeg failed with return code {result.returncode}")
            print(f"Error output: {result.stderr}")
            return input_path
            
    except subprocess.TimeoutExpired:
        print("FFmpeg compression timed out")
        return input_path
    except Exception as e:
        print(f"Direct ffmpeg compression failed: {e}")
        return input_path

def create_audio_chunks_with_overlap(input_path: str, chunk_duration_minutes: int = 8, overlap_seconds: int = 30) -> List[Dict]:
    """Create overlapping audio chunks."""
    try:
        print(f"Creating chunks from: {input_path}")
        
        # Check if we have the necessary tools for chunking
        ffmpeg_available = os.path.exists(FFMPEG_PATH)
        ffprobe_available = os.path.exists(FFPROBE_PATH)
        
        if not (ffmpeg_available and ffprobe_available):
            print(f"Missing required tools - FFmpeg: {ffmpeg_available}, FFprobe: {ffprobe_available}")
            print("Falling back to single file processing")
            return create_single_chunk_fallback(input_path)
        
        # Try to load the audio file
        try:
            audio = AudioSegment.from_file(input_path)
        except Exception as audio_error:
            print(f"Failed to load audio file: {audio_error}")
            print("This is likely due to missing ffprobe or unsupported format")
            return create_single_chunk_fallback(input_path)
        
        total_duration_ms = len(audio)
        total_duration_seconds = total_duration_ms / 1000.0
        
        print(f"Total duration: {total_duration_seconds/60:.2f} minutes")
        
        # If file is short enough, don't chunk it
        if total_duration_seconds < chunk_duration_minutes * 60 * 1.5:  # 1.5x the chunk size
            print("File is short enough to process without chunking")
            return create_single_chunk_fallback(input_path)
        
        chunk_duration_ms = chunk_duration_minutes * 60 * 1000
        overlap_ms = overlap_seconds * 1000
        
        chunks = []
        chunk_index = 0
        start_ms = 0
        
        while start_ms < total_duration_ms:
            end_ms = min(start_ms + chunk_duration_ms, total_duration_ms)
            
            try:
                chunk_audio = audio[start_ms:end_ms]
                
                if len(chunk_audio) < 10000:  # Skip very short chunks
                    break
                
                chunk_path = f"/tmp/chunk_{chunk_index:03d}.mp3"
                chunk_audio.export(chunk_path, format="mp3", bitrate="64k")
                
                chunks.append({
                    'index': chunk_index,
                    'path': chunk_path,
                    'start_seconds': start_ms / 1000.0,
                    'end_seconds': end_ms / 1000.0,
                    'duration_seconds': len(chunk_audio) / 1000.0,
                    'size_mb': os.path.getsize(chunk_path) / (1024 * 1024)
                })
                
                print(f"Chunk {chunk_index + 1}: {start_ms/1000/60:.1f}-{end_ms/1000/60:.1f} min ({os.path.getsize(chunk_path) / 1024 / 1024:.2f} MB)")
                
            except Exception as chunk_error:
                print(f"Failed to create chunk {chunk_index}: {chunk_error}")
                # If we can't create chunks, fall back to single file
                if chunk_index == 0:  # If first chunk fails, give up on chunking
                    print("First chunk creation failed, falling back to single file processing")
                    return create_single_chunk_fallback(input_path)
                else:
                    print("Stopping chunk creation due to error")
                    break
            
            start_ms = end_ms - overlap_ms
            chunk_index += 1
            
            if chunk_index > 50:
                print("Maximum chunk limit reached")
                break
        
        if len(chunks) == 0:
            print("No chunks were created, falling back to single file processing")
            return create_single_chunk_fallback(input_path)
        
        print(f"Created {len(chunks)} chunks successfully")
        return chunks
        
    except Exception as e:
        print(f"Error creating chunks with pydub: {e}")
        print("Attempting fallback: single file processing")
        return create_single_chunk_fallback(input_path)

def create_single_chunk_fallback(input_path: str) -> List[Dict]:
    """Fallback method that processes the entire file as a single chunk."""
    try:
        file_size = os.path.getsize(input_path)
        file_size_mb = file_size / (1024 * 1024)
        
        print(f"Using single chunk fallback for {file_size_mb:.2f} MB file")
        
        processing_path = input_path
        
        if file_size_mb > 24:  # OpenAI Whisper limit
            print(f"File too large for single chunk processing: {file_size_mb:.2f} MB")
            print("Attempting compression before failing...")
            
            # Try to compress the file
            compressed_path = compress_with_ffmpeg_direct(input_path, 24.0)
            
            if compressed_path != input_path:
                # Compression was attempted, check the result
                compressed_size = os.path.getsize(compressed_path) / (1024 * 1024)
                if compressed_size <= 24:
                    print(f"Compression successful: {compressed_size:.2f} MB")
                    processing_path = compressed_path
                    file_size_mb = compressed_size
                else:
                    print(f"Compression insufficient: {compressed_size:.2f} MB still too large")
                    raise Exception(f"File size {compressed_size:.2f} MB still exceeds OpenAI limit after compression")
            else:
                print("Compression failed or not attempted")
                raise Exception(f"File size {file_size_mb:.2f} MB exceeds OpenAI limit and compression failed")
        
        chunks = [{
            'index': 0,
            'path': processing_path,
            'start_seconds': 0.0,
            'end_seconds': 0.0,  # Unknown duration
            'duration_seconds': 0.0,  # Unknown duration
            'size_mb': file_size_mb
        }]
        
        print("Single chunk fallback created successfully")
        return chunks
        
    except Exception as e:
        print(f"Fallback method also failed: {e}")
        raise

def transcribe_single_chunk(chunk_info: Dict, openai_client, chunk_number: int, total_chunks: int) -> Dict:
    """Transcribe a single chunk."""
    try:
        print(f"Transcribing chunk {chunk_number}/{total_chunks}")
        
        with open(chunk_info['path'], "rb") as audio_file:
            transcription = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        
        text = transcription.text if hasattr(transcription, 'text') else str(transcription)
        print(f"Chunk {chunk_number} completed: {len(text)} characters")
        
        return {
            'index': chunk_info['index'],
            'success': True,
            'text': text,
            'start_seconds': chunk_info['start_seconds'],
            'end_seconds': chunk_info['end_seconds']
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
    """Transcribe chunks in parallel."""
    print(f"Starting parallel transcription with {max_workers} workers")
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_chunk = {
            executor.submit(transcribe_single_chunk, chunk, openai_client, i + 1, len(chunks)): chunk
            for i, chunk in enumerate(chunks)
        }
        
        for future in concurrent.futures.as_completed(future_to_chunk):
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                chunk = future_to_chunk[future]
                print(f"Chunk transcription failed: {e}")
                results.append({
                    'index': chunk['index'],
                    'success': False,
                    'text': f"[Transcription failed: {str(e)}]",
                    'start_seconds': chunk['start_seconds'],
                    'end_seconds': chunk['end_seconds'],
                    'error': str(e)
                })
    
    results.sort(key=lambda x: x['index'])
    successful = sum(1 for r in results if r['success'])
    print(f"Parallel transcription completed: {successful}/{len(chunks)} chunks successful")
    
    return results

def merge_transcriptions(transcription_results: List[Dict]) -> str:
    """Merge transcription results with basic overlap handling."""
    if not transcription_results:
        return ""
    
    transcription_results.sort(key=lambda x: x['start_seconds'])
    merged_text = ""
    
    for i, result in enumerate(transcription_results):
        if not result['success']:
            merged_text += f"\n\n{result['text']}\n\n"
            continue
        
        current_text = result['text'].strip()
        if i == 0:
            merged_text = current_text
        else:
            # Simple merge - just add space between chunks
            merged_text += " " + current_text
    
    # Clean up multiple spaces
    merged_text = re.sub(r'\s+', ' ', merged_text)
    
    return merged_text.strip()

def cleanup_temp_files(file_paths: List[str]):
    """Clean up temporary files."""
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Removed: {file_path}")
        except Exception as e:
            print(f"Warning: Could not remove {file_path}: {e}")

def lambda_handler(event, context):
    """Main Lambda handler."""
    print("Received event:", json.dumps(event))
    
    try:
        # Test basic functionality
        if event.get('test') == 'basic_functionality':
            ffmpeg_available = os.path.exists(FFMPEG_PATH)
            ffprobe_available = os.path.exists(FFPROBE_PATH)
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Lambda function is working correctly',
                    'supabase_configured': supabase is not None,
                    'openai_available': True,
                    'pydub_available': True,
                    'ffmpeg_available': ffmpeg_available,
                    'ffprobe_available': ffprobe_available,
                    'ffmpeg_path': FFMPEG_PATH if ffmpeg_available else 'Not found',
                    'ffprobe_path': FFPROBE_PATH if ffprobe_available else 'Not found',
                    'boto3_version': boto3.__version__,
                    'using_builtin_aws_sdk': True
                })
            }
        
        # Parse event for actual processing
        try:
            if 'body' in event:
                payload = json.loads(event['body'])
            else:
                payload = event
            
            s3_bucket = payload['bucketName']
            s3_key = payload['s3Key']
            video_id = payload['videoId']
            user_id = payload['userId']
            note_format = payload.get('noteFormat', 'Markdown')
        except (KeyError, json.JSONDecodeError) as e:
            error_msg = f"Missing required parameters: {e}"
            return {'statusCode': 400, 'body': json.dumps(error_msg)}
        
        # Check for duplicate processing
        if supabase:
            try:
                existing_video = supabase.table('videos').select('transcription_status').eq('id', video_id).execute()
                if existing_video.data and len(existing_video.data) > 0:
                    current_status = existing_video.data[0]['transcription_status']
                    if current_status in ['in_progress', 'completed']:
                        return {
                            'statusCode': 200,
                            'body': json.dumps(f'Video already {current_status}')
                        }
            except Exception as e:
                print(f"Warning: Could not check existing video status: {e}")
        
        update_video_status(video_id, 'in_progress')
        
        # Download and process file
        local_audio_path = f"/tmp/{os.path.basename(s3_key)}"
        temp_files = [local_audio_path]
        
        try:
            # Check file size
            file_info = s3_client.head_object(Bucket=s3_bucket, Key=s3_key)
            file_size = file_info['ContentLength']
            file_size_mb = file_size / (1024 * 1024)
            
            print(f"File size: {file_size_mb:.2f} MB")
            
            if file_size_mb > 400:
                error_msg = f"File too large ({file_size_mb:.2f} MB)"
                update_video_status(video_id, 'failed', error_msg)
                return {'statusCode': 413, 'body': json.dumps(error_msg)}
            
            # Download file
            print("Downloading file from S3...")
            s3_client.download_file(s3_bucket, s3_key, local_audio_path)
            print(f"Downloaded to: {local_audio_path}")
            
            # Initialize OpenAI
            openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
            
            # Compress if needed
            processing_file = local_audio_path
            if file_size > OPENAI_MAX_FILE_SIZE:
                print("File exceeds OpenAI limit, compressing...")
                compressed_path = compress_with_ffmpeg_direct(local_audio_path)
                temp_files.append(compressed_path)
                processing_file = compressed_path
            
            # Create chunks
            print("Creating audio chunks...")
            chunks = create_audio_chunks_with_overlap(processing_file, CHUNK_DURATION_MINUTES, CHUNK_OVERLAP_SECONDS)
            for chunk in chunks:
                temp_files.append(chunk['path'])
            
            # Parallel transcription
            print("Starting parallel transcription...")
            transcription_results = transcribe_chunks_parallel(chunks, openai_client, MAX_PARALLEL_WORKERS)
            
            # Merge results
            print("Merging transcription results...")
            final_transcript = merge_transcriptions(transcription_results)
            
            print(f"Final transcript length: {len(final_transcript)} characters")
            
            # Save to Supabase
            if supabase:
                print("Saving transcript to Supabase...")
                existing_transcript = supabase.table('transcripts').select('id').eq('video_id', video_id).execute()
                if existing_transcript.data:
                    supabase.table('transcripts').update({'content': final_transcript}).eq('video_id', video_id).execute()
                else:
                    supabase.table('transcripts').insert({'video_id': video_id, 'content': final_transcript}).execute()
                print("Transcript saved successfully")
            
            # Cleanup
            cleanup_temp_files(temp_files)
            
            # Trigger note generation
            note_generator_arn = os.environ.get("NOTE_GENERATOR_LAMBDA_ARN")
            if note_generator_arn:
                print("Triggering note generation...")
                lambda_client.invoke(
                    FunctionName=note_generator_arn,
                    InvocationType='Event',
                    Payload=json.dumps({
                        'videoId': video_id,
                        'userId': user_id,
                        'rawTranscript': final_transcript,
                        'noteFormat': note_format
                    })
                )
                print("Note generation triggered")
            
            update_video_status(video_id, 'completed')
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Transcription completed successfully',
                    'videoId': video_id,
                    'transcriptionLength': len(final_transcript),
                    'chunksProcessed': len(chunks),
                    'successfulChunks': sum(1 for r in transcription_results if r['success'])
                })
            }
            
        except Exception as e:
            error_msg = f"Error processing transcription: {e}"
            print(error_msg)
            update_video_status(video_id, 'failed', error_msg)
            cleanup_temp_files(temp_files)
            return {'statusCode': 500, 'body': json.dumps(error_msg)}
            
    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        print(error_msg)
        return {'statusCode': 500, 'body': json.dumps(error_msg)}
