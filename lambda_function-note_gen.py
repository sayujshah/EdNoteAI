import json
import os
import boto3
from supabase import create_client, Client
from openai import OpenAI # Using the official OpenAI Python library

# Initialize Supabase client
# Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set as environment variables in Lambda
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# Initialize OpenAI client
# Ensure OPENAI_API_KEY environment variable is set in Lambda configuration
openai_api_key = os.environ.get("OPENAI_API_KEY")
openai_client = OpenAI(api_key=openai_api_key)

def update_video_status(video_id: str, status: str, error_message: str = None):
    """Helper function to update video transcription status in Supabase."""
    print(f"Attempting to update video {video_id} status to: {status}")
    update_data = {'transcription_status': status}
    if error_message:
        update_data['error_message'] = error_message # Assuming an error_message column exists

    try:
        # Use the service role key for this update
        response = supabase.table('videos').update(update_data).eq('id', video_id).execute()
        if response.data is None or (isinstance(response.data, list) and len(response.data) == 0):
             print(f"Warning: Update video status for {video_id} to {status} might not have been successful. Response data is empty.")
        else:
            print(f"Video {video_id} status updated to {status} successfully.")
    except Exception as e:
        print(f"An unexpected error occurred while updating video status for {video_id} to {status}: {e}")


def lambda_handler(event, context):
    print("Received note generation event:", json.dumps(event))

    video_id = None # Initialize video_id to None
    transcript_id = None # Initialize transcript_id to None
    try:
        # Extract data from the event payload sent by the transcription Lambda
        payload = event # Assuming the event is the payload JSON
        video_id = payload.get('videoId')
        user_id = payload.get('userId')
        # raw_transcript is no longer expected directly, we fetch it
        on_screen_text_data = payload.get('onScreenTextData') # Expect on-screen text data

        if not video_id or not user_id:
            print("Missing videoId or userId in payload.")
            # No video_id to update status if missing
            return {
                'statusCode': 400,
                'body': json.dumps('Missing videoId or userId')
            }

        print(f"Generating notes for video ID: {video_id} for user: {user_id}")

        # 1. Fetch the transcript text and transcript_id using the video_id
        # Assuming a one-to-one relationship between videos and transcripts
        # Use maybe_single() here as well, in case a video has no transcript (though less likely)
        transcript_response = supabase.table('transcripts').select('id, content').eq('video_id', video_id).maybe_single().execute()

        if transcript_response.data:
            transcript_id = transcript_response.data['id']
            raw_transcript = transcript_response.data['content']
            print(f"Fetched transcript for video {video_id}, transcript ID: {transcript_id}")
        else:
            print(f"No transcript found for video ID: {video_id}")
            update_video_status(video_id, 'note_generation_failed', f'No transcript found for video ID: {video_id}')
            return {
                'statusCode': 404,
                'body': json.dumps(f'No transcript found for video ID: {video_id}')
            }

        # --- First OpenAI Interaction: Generate Segmented Content (Structured JSON) ---
        # Use the existing prompt to generate structured JSON notes (this will be our segmented_content)
        segmentation_prompt = f"""
        You are an AI assistant specialized in generating academic-style notes from lecture transcripts and on-screen text.
        Your task is to take the provided raw transcript and on-screen text data and transform it into structured, academic notes.
        This should include:
        1.  **Concept Segmentation:** Break the transcript into logical sections based on the topics or concepts discussed.
        2.  **Key Points:** For each segment, identify and list the key points.
        3.  **Summaries:** Provide a concise summary for each segment.
        4.  **On-screen Text Integration:** Integrate the provided on-screen text into the relevant segments or as separate entries. Clearly indicate that this text appeared on screen (e.g., "On-screen: [Text]"). Try to align it contextually with the spoken content.
        5.  **Lecture Demonstrations:** If the transcript or on-screen text describes a demonstration (e.g., coding, experiment, diagram), provide a brief description of what was demonstrated.
        6.  **Structure:** Format the output clearly, perhaps using Markdown or a similar hierarchical structure. Include timestamps if available in the raw transcript or on-screen text data (design for it).

        Raw Transcript:
        {raw_transcript}

        On-screen Text Data (if available):
        {json.dumps(on_screen_text_data) if on_screen_text_data else "No on-screen text data provided."}

        Generate the academic notes in a structured JSON format with the following structure:
        {{
            "title": "Generated Notes Title (Infer from content)",
            "segments": [
                {{
                    "heading": "Segment Heading (Infer topic)",
                    "summary": "Concise summary of the segment.",
                    "key_points": ["Key point 1", "Key point 2", ...],
                    "on_screen_text": ["On-screen text excerpt 1", "On-screen text excerpt 2", ...], # List of relevant on-screen text excerpts
                    "demonstration_description": "Brief description of demonstration if applicable (optional)",
                    "start_time": 0, # Placeholder, ideally from transcript data
                    "end_time": -1   # Placeholder, ideally from transcript data
                }},
                ... other segments ...
            ],
            "generated_at": f"{context.invoked_function_arn}" # Example metadata
        }}
        Ensure the JSON is valid and can be parsed directly. Do not include any introductory or concluding text outside the JSON object.
        """

        print("Sending request to OpenAI for segmented content generation (structured JSON)...")
        segmentation_response = openai_client.chat.completions.create(
            model="gpt-4o-mini", # Or your preferred model
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates structured academic notes in JSON format, integrating on-screen text."},
                {"role": "user", "content": segmentation_prompt}
            ],
            response_format={ "type": "json_object" } # Request JSON object output
        )

        segmented_content_data = json.loads(segmentation_response.choices[0].message.content) # Parse the JSON string
        print("Generated segmented content (structured JSON) successfully.")

        # --- Second OpenAI Interaction: Generate Markdown Notes ---
        # Now, generate markdown notes from the segmented content
        markdown_prompt = f"""
        You are an AI assistant specialized in converting structured academic content into well-formatted markdown notes.
        Take the following structured content and convert it into readable academic notes using Markdown formatting.
        Focus on clarity, hierarchy (using headings, lists), and readability.

        Structured Content (JSON):
        {json.dumps(segmented_content_data, indent=2)}
        """

        print("Sending request to OpenAI for markdown notes generation...")
        markdown_response = openai_client.chat.completions.create(
             model="gpt-4o-mini", # Or your preferred model
             messages=[
                 {"role": "system", "content": "You are a helpful assistant that converts structured academic content into well-formatted markdown notes."},
                 {"role": "user", "content": markdown_prompt}
             ]
         )

        markdown_content = markdown_response.choices[0].message.content
        print("Generated markdown content successfully.")

        # --- Save to Supabase (notes table) ---
        # Insert a new record into the 'notes' table
        try:
            # Check if a note already exists for this transcript_id using maybe_single()
            existing_note_response = supabase.table('notes').select('id').eq('transcript_id', transcript_id).maybe_single().execute()

            if existing_note_response:
                # Update existing note
                note_id = existing_note_response.data['id']
                print(f"Note already exists for transcript {transcript_id}, updating note ID: {note_id}")
                update_response = supabase.table('notes').update({
                    'content': segmented_content_data, # Save segmented content (structured JSON)
                    'markdown_content': markdown_content # Save markdown content
                }).eq('id', note_id).execute()

            else:
                # Insert new note
                print(f"No existing note for transcript {transcript_id}, inserting new note.")
                insert_response = supabase.table('notes').insert({
                    'transcript_id': transcript_id,
                    'user_id': user_id, # Link note to user
                    'content': segmented_content_data, # Save segmented content (structured JSON)
                    'markdown_content': markdown_content # Save markdown content
                }).execute()
                
            # Update video status to indicate notes are generated
            update_video_status(video_id, 'completed') # Assuming 'completed' means notes are ready
            print(f"Updated video {video_id} status to 'completed'.")

            return {
                'statusCode': 200,
                'body': json.dumps('Notes generated and saved successfully!')
            }

        except Exception as db_error:
            print(f"Error saving generated notes to Supabase: {db_error}")
            update_video_status(video_id, 'note_generation_failed', f'Error saving generated notes to Supabase: {db_error}')
            return {
                'statusCode': 500,
                'body': json.dumps(f'Error saving generated notes to Supabase: {db_error}')
            }

    except Exception as openai_error:
        print(f"Error during OpenAI API calls: {openai_error}")
        if video_id:
             update_video_status(video_id, 'note_generation_failed', f'Error during OpenAI API calls: {openai_error}')
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error during OpenAI API calls: {openai_error}')
        }

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        if video_id:
             update_video_status(video_id, 'note_generation_failed', f'An unexpected error occurred: {e}')
        return {
            'statusCode': 500,
            'body': json.dumps(f'An unexpected error occurred: {e}')
        }
