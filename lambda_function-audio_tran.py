import json
import boto3
import os
from supabase import create_client, Client
import openai # Using the openai library for transcription
from botocore.exceptions import ClientError # Import ClientError for AWS errors

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
        print("Error: Missing S3 bucket, key, video ID, or user ID in event payload.")
        # TODO: Update video status to 'failed' in Supabase
        return {
            'statusCode': 400,
            'body': json.dumps('Error: Missing S3 bucket, key, video ID, or user ID.')
        }

    print(f"Processing s3://{s3_bucket}/{s3_key} for video ID: {video_id}, user ID: {user_id}")

    # Define local path for downloading the audio file
    local_audio_path = f"/tmp/{os.path.basename(s3_key)}"

    try:
        # Download the audio file from S3
        s3_client.download_file(s3_bucket, s3_key, local_audio_path)
        print(f"Downloaded audio to {local_audio_path}")

        # Transcribe the audio file using OpenAI Whisper
        # Initialize OpenAI client with API key from environment variable
        openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

        with open(local_audio_path, "rb") as audio_file:
            transcription = openai_client.audio.transcriptions.create(model="whisper-1", file=audio_file)

        transcription_text = transcription.text
        print("Transcription complete.")
        print("Transcription:", transcription_text[:200] + "...") # Print first 200 chars

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
        os.remove(local_audio_path)
        print(f"Removed temporary file {local_audio_path}")

        # --- Trigger Note Generation Lambda ---
        print(f"NOTE_GENERATOR_LAMBDA_ARN value: {NOTE_GENERATOR_LAMBDA_ARN}")
        if NOTE_GENERATOR_LAMBDA_ARN:
            print(f"Invoking Note Generation Lambda for video ID: {video_id}")
            try:
                lambda_client.invoke(
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
                print(f"Note Generation Lambda invoked for video ID: {video_id}")

            except ClientError as e:
                print(f"AWS Client Error invoking Note Generation Lambda: {e}")
                update_video_status(video_id, 'note_generation_failed', f'AWS Client Error invoking Note Generation Lambda: {e}')
            except Exception as e:
                print(f"An unexpected error occurred invoking Note Generation Lambda: {e}")
                update_video_status(video_id, 'note_generation_failed', f'An unexpected error occurred invoking Note Generation Lambda: {e}')
        else:
            print("NOTE_GENERATOR_LAMBDA_ARN environment variable is not set. Skipping note generation.")
            # Update video status to 'transcribed_only' or similar
            update_video_status(video_id, 'transcribed_only')


        return {
            'statusCode': 200,
            'body': json.dumps('Transcription processed and note generation triggered successfully.')
        }

    except Exception as e:
        print(f"Error processing transcription: {e}")
        
