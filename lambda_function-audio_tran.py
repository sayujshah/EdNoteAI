import json
import boto3
import os
from supabase import create_client, Client
import openai # Using the openai library for transcription
from botocore.exceptions import ClientError # Import ClientError for AWS errors
import time

# Initialize AWS S3 client
s3_client = boto3.client('s3')
lambda_client = boto3.client('lambda') # Initialize Lambda client

# Initialize Supabase client
# Ensure SUPABASE_URL and SUPABASE_KEY environment variables are set in Lambda
supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_key: str = os.environ.get("SUPABASE_KEY") # Consider using a dedicated API key or service role key with caution
supabase: Client = create_client(supabase_url, supabase_key)

# Get the ARN of the Note Generation Agent Lambda function from environment variables
NOTE_GENERATOR_LAMBDA_ARN: str = os.environ.get("NOTE_GENERATOR_LAMBDA_ARN")

def update_video_status(video_id: str, status: str, error_message: str = None):
    """Helper function to update video transcription status in Supabase."""
    print(f"Attempting to update video {video_id} status to: {status}")
    update_data = {'transcription_status': status}
    if error_message:
        update_data['error_message'] = error_message # Assuming an error_message column exists

    try:
        response = supabase.table('videos').update(update_data).eq('id', video_id).execute()
        # Check if the update was successful (e.g., data is not empty for select(), or count > 0 for insert/update)
        # The update method with execute() might return data for the updated row(s) if select() is chained,
        # but here we are not chaining select(). Let's check for response.data being None or empty.
        if response.data is None or (isinstance(response.data, list) and len(response.data) == 0):
             print(f"Warning: Update video status for {video_id} to {status} might not have been successful. Response data is empty.")
             # Depending on supabase-py version, errors might be in response.error or raised as exceptions.
             # The outer except block should catch exceptions.
        else:
            print(f"Video {video_id} status updated to {status} successfully.")
    except Exception as e:
        print(f"An unexpected error occurred while updating video status for {video_id} to {status}: {e}")

def lambda_handler(event, context):
    """
    Lambda function to transcribe audio from S3 using OpenAI Whisper
    and save the result to Supabase, then trigger note generation.
    """
    print("Received event:", json.dumps(event)) # Add this print statement to see the full event

    video_id = None # Initialize video_id to None
    user_id = None # Initialize user_id to None
    s3_bucket = None # Initialize s3_bucket
    s3_key = None # Initialize s3_key
    
    try:
        # Parse event payload
        try:
            # Assuming the payload is a JSON string with s3Key, bucketName, and videoId
            payload = json.loads(event['body']) # If triggered by API Gateway proxy integration
            s3_bucket = payload['bucketName']
            s3_key = payload['s3Key']
            video_id = payload['videoId'] # Assuming videoId is passed in the payload
            user_id = payload['userId'] # Assuming userId is passed in the payload
            note_format = payload.get('noteFormat', 'Markdown') # Get note format, default to markdown
        except (KeyError, json.JSONDecodeError):
            # Handle direct invocation or different event structure
            s3_bucket = event.get('bucketName')
            s3_key = event.get('s3Key')
            video_id = event.get('videoId') # Assuming videoId is passed in the event
            user_id = event.get('userId') # Assuming userId is passed in the event
            note_format = event.get('noteFormat', 'Markdown') # Get note format, default to markdown
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

    # Check if this video is already being processed or completed
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

    # Update status to in_progress to prevent duplicate processing
    update_video_status(video_id, 'in_progress')

    # Define local path for downloading the audio file
    local_audio_path = f"/tmp/{os.path.basename(s3_key)}"

    try:
        # Check available disk space and file size
        try:
            file_info = s3_client.head_object(Bucket=s3_bucket, Key=s3_key)
            file_size = file_info['ContentLength']
            file_size_mb = file_size / (1024 * 1024)
            print(f"File size: {file_size_mb:.2f} MB")
            
            # Check if file is too large for Lambda /tmp (512MB limit)
            if file_size_mb > 400:  # Leave some buffer
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

        # Transcribe the audio file using OpenAI Whisper
        # Initialize OpenAI client with API key from environment variable
        openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

        print("Starting transcription with OpenAI Whisper...")
        transcription_start = time.time()
        
        with open(local_audio_path, "rb") as audio_file:
            # For large files, we might want to add timeout handling
            transcription = openai_client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file,
                response_format="text"  # Get plain text response
            )

        transcription_time = time.time() - transcription_start
        print(f"Transcription completed in {transcription_time:.2f} seconds")

        # Handle different response formats
        if hasattr(transcription, 'text'):
            transcription_text = transcription.text
        else:
            transcription_text = str(transcription)

        print(f"Transcription length: {len(transcription_text)} characters")
        print("Transcription preview:", transcription_text[:200] + "..." if len(transcription_text) > 200 else transcription_text)

        # Save the transcription result to Supabase
        # Create a new record in the 'transcripts' table
        # Assuming a 'transcripts' table with columns: id, video_id, content, segmented_content (JSONB), created_at
        # Check if a transcript already exists for this video_id
        existing_transcript = supabase.table('transcripts').select('id').eq('video_id', video_id).execute() # Removed .single()

        if existing_transcript.data: # Check if data is not empty
            # Update existing transcript
            print(f"Updating existing transcript for video_id: {video_id}")
            insert_transcript_response = supabase.table('transcripts').update({
                'content': transcription_text,
                # segmented_content will be populated by the note generation lambda
            }).eq('video_id', video_id).execute()
        else:
            # Insert new transcript
            print(f"Inserting new transcript for video_id: {video_id}")
            insert_transcript_response = supabase.table('transcripts').insert({
                'video_id': video_id,
                'content': transcription_text,
                # segmented_content will be populated by the note generation lambda
            }).execute()

        print(f"Raw transcription saved for video_id: {video_id}")

        # Clean up the temporary audio file
        try:
            os.remove(local_audio_path)
            print(f"Removed temporary file {local_audio_path}")
        except Exception as e:
            print(f"Warning: Could not remove temporary file: {e}")

        # --- Trigger Note Generation Lambda ---
        print(f"NOTE_GENERATOR_LAMBDA_ARN value: {NOTE_GENERATOR_LAMBDA_ARN}")
        if NOTE_GENERATOR_LAMBDA_ARN:
            print(f"Invoking Note Generation Lambda for video ID: {video_id}")
            try:
                invoke_response = lambda_client.invoke(
                    FunctionName=NOTE_GENERATOR_LAMBDA_ARN,
                    InvocationType='Event', # Use 'Event' for asynchronous invocation
                    Payload=json.dumps({ # Pass necessary info to the agent Lambda
                        'videoId': video_id,
                        'userId': user_id, # Pass user_id
                        'rawTranscript': transcription_text, # Pass the raw transcript
                        'noteFormat': note_format # Pass the note format
                        # TODO: Include visual context data if available
                    })
                )
                print(f"Note Generation Lambda invoked successfully for video ID: {video_id}")
                print(f"Invoke response status: {invoke_response.get('StatusCode', 'Unknown')}")

                # Update video status to indicate transcription is complete and note generation is starting
                update_video_status(video_id, 'completed')

            except ClientError as e:
                error_msg = f"AWS Client Error invoking Note Generation Lambda: {e}"
                print(error_msg)
                update_video_status(video_id, 'failed', error_msg)
                return {
                    'statusCode': 500,
                    'body': json.dumps(error_msg)
                }
            except Exception as e:
                error_msg = f"Unexpected error invoking Note Generation Lambda: {e}"
                print(error_msg)
                update_video_status(video_id, 'failed', error_msg)
                return {
                    'statusCode': 500,
                    'body': json.dumps(error_msg)
                }
        else:
            print("NOTE_GENERATOR_LAMBDA_ARN environment variable is not set. Skipping note generation.")
            # Update video status to 'completed' since transcription is done
            update_video_status(video_id, 'completed')

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transcription processed and note generation triggered successfully.',
                'videoId': video_id,
                'transcriptionLength': len(transcription_text),
                'processingTime': {
                    'download': f"{download_time:.2f}s",
                    'transcription': f"{transcription_time:.2f}s"
                }
            })
        }

    except openai.APIError as e:
        error_msg = f"OpenAI API Error: {e}"
        print(error_msg)
        update_video_status(video_id, 'failed', error_msg)
        return {
            'statusCode': 502,
            'body': json.dumps(error_msg)
        }
    except openai.APITimeoutError as e:
        error_msg = f"OpenAI API Timeout (file too large or API overloaded): {e}"
        print(error_msg)
        update_video_status(video_id, 'failed', error_msg)
        return {
            'statusCode': 504,
            'body': json.dumps(error_msg)
        }
    except Exception as e:
        error_msg = f"Error processing transcription: {e}"
        print(error_msg)
        update_video_status(video_id, 'failed', error_msg)
        return {
            'statusCode': 500,
            'body': json.dumps(error_msg)
        }
        
