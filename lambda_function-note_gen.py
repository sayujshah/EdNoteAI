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
        note_format = payload.get('noteFormat', 'Markdown') # Get note format, default to markdown
        # raw_transcript is no longer expected directly, we fetch it
        on_screen_text_data = payload.get('onScreenTextData') # Expect on-screen text data

        if not video_id or not user_id:
            print("Missing videoId or userId in payload.")
            # No video_id to update status if missing
            return {
                'statusCode': 400,
                'body': json.dumps('Missing videoId or userId')
            }

        print(f"Generating notes for video ID: {video_id} for user: {user_id} in format: {note_format}")

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

        # --- Generate Notes Based on Format ---
        if note_format == 'LaTeX':
            # LaTeX-specific prompt
            generation_prompt = f"""
            You are an AI assistant specialized in generating academic-style notes from lecture transcripts in LaTeX format.
            Your task is to take the provided raw transcript and transform it into well-structured LaTeX content suitable for academic documents.
            
            Requirements:
            1. **Document Structure**: Use LaTeX sectioning commands (\\section{{}}, \\subsection{{}}, \\subsubsection{{}})
            2. **Lists**: Use \\begin{{itemize}} and \\begin{{enumerate}} for bullet points and numbered lists
            3. **Mathematics**: Use proper LaTeX math notation with $ for inline math and $$ for display math
            4. **Emphasis**: Use \\textbf{{}} for bold and \\textit{{}} for italics
            5. **Content Organization**: Break content into logical sections based on topics discussed
            6. **Academic Style**: Maintain formal academic tone and structure
            
            Raw Transcript:
            {raw_transcript}
            
            On-screen Text Data (if available):
            {json.dumps(on_screen_text_data) if on_screen_text_data else "No on-screen text data provided."}
            
            Generate comprehensive LaTeX content (without \\documentclass or \\begin{{document}} - just the content that would go inside a document).
            Focus on clear structure, proper LaTeX formatting, and academic presentation.
            """
        else:
            # Markdown-specific prompt (existing logic)
            generation_prompt = f"""
            You are an AI assistant specialized in generating academic-style notes from lecture transcripts in Markdown format.
            Your task is to take the provided raw transcript and transform it into well-structured Markdown content.
            
            Requirements:
            1. **Document Structure**: Use proper Markdown headers (# ## ###)
            2. **Lists**: Use - or * for bullet points and 1. 2. 3. for numbered lists
            3. **Emphasis**: Use **bold** and *italic* formatting
            4. **Content Organization**: Break content into logical sections based on topics discussed
            5. **Academic Style**: Maintain formal academic tone and structure
            
            Raw Transcript:
            {raw_transcript}
            
            On-screen Text Data (if available):
            {json.dumps(on_screen_text_data) if on_screen_text_data else "No on-screen text data provided."}
            
            Generate comprehensive Markdown content with clear structure and academic presentation.
            Generate clean markdown content without any code block wrappers or formatting indicators. Return only the raw markdown content.
            """

        print(f"Sending request to OpenAI for {note_format} content generation...")
        generation_response = openai_client.chat.completions.create(
            model="gpt-4o-mini", # Or your preferred model
            messages=[
                {"role": "system", "content": f"You are a helpful assistant that generates structured academic notes in {note_format.upper()} format."},
                {"role": "user", "content": generation_prompt}
            ]
        )

        generated_content = generation_response.choices[0].message.content
        print(f"Generated {note_format} content successfully.")

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
                    'content': generated_content, # Save generated content
                    'markdown_content': None # Markdown content is not saved for LaTeX notes
                }).eq('id', note_id).execute()

            else:
                # Insert new note
                print(f"No existing note for transcript {transcript_id}, inserting new note.")
                insert_response = supabase.table('notes').insert({
                    'transcript_id': transcript_id,
                    'user_id': user_id, # Link note to user
                    'content': generated_content, # Save generated content
                    'markdown_content': None # Markdown content is not saved for LaTeX notes
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