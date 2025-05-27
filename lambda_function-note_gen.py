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


def post_process_latex_content(content: str) -> str:
    """
    Post-process LaTeX content to fix common formatting issues and ensure KaTeX compatibility.
    """
    import re
    
    # Fix common LaTeX math delimiter issues
    processed_content = content
    
    # Replace \[ ... \] with $$ ... $$
    processed_content = re.sub(r'\\?\\\[([^\\]*?)\\?\\\]', r'$$\1$$', processed_content)
    
    # Replace \( ... \) with $ ... $
    processed_content = re.sub(r'\\?\\\(([^\\]*?)\\?\\\)', r'$\1$', processed_content)
    
    # Fix equation environments - replace with display math
    processed_content = re.sub(r'\\begin\{equation\*?\}(.*?)\\end\{equation\*?\}', r'$$\1$$', processed_content, flags=re.DOTALL)
    
    # Fix align environments - replace with display math
    processed_content = re.sub(r'\\begin\{align\*?\}(.*?)\\end\{align\*?\}', r'$$\1$$', processed_content, flags=re.DOTALL)
    
    # Clean up extra backslashes in math mode
    processed_content = re.sub(r'\$\$\s*\\\s*', r'$$', processed_content)
    processed_content = re.sub(r'\s*\\\s*\$\$', r'$$', processed_content)
    processed_content = re.sub(r'\$\s*\\\s*', r'$', processed_content)
    processed_content = re.sub(r'\s*\\\s*\$', r'$', processed_content)
    
    # Fix common spacing issues in math
    processed_content = re.sub(r'\$\s+', r'$', processed_content)
    processed_content = re.sub(r'\s+\$', r'$', processed_content)
    processed_content = re.sub(r'\$\$\s+', r'$$', processed_content)
    processed_content = re.sub(r'\s+\$\$', r'$$', processed_content)
    
    # Fix integration by parts notation specifically
    # Replace \[ u \, dv = uv - v \, du \] with proper display math
    processed_content = re.sub(r'\\?\\\[\s*([^\\]*?)\s*\\?\\\]', r'$$\1$$', processed_content)
    
    # Ensure proper spacing in mathematical expressions
    processed_content = re.sub(r'(\$\$[^$]*?)\s*\\\s*([^$]*?\$\$)', r'\1 \2', processed_content)
    
    # Fix any remaining document-level commands that shouldn't be there
    processed_content = re.sub(r'\\documentclass.*?\n', '', processed_content)
    processed_content = re.sub(r'\\begin\{document\}', '', processed_content)
    processed_content = re.sub(r'\\end\{document\}', '', processed_content)
    processed_content = re.sub(r'\\usepackage.*?\n', '', processed_content)
    
    # Clean up multiple newlines
    processed_content = re.sub(r'\n\s*\n\s*\n+', '\n\n', processed_content)
    
    return processed_content.strip()


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
            
            CRITICAL MATH FORMATTING RULES:
            1. **Inline Math**: Use single dollar signs $...$ for inline mathematical expressions
            2. **Display Math**: Use double dollar signs $$...$$ for centered mathematical expressions
            3. **NO DOCUMENT COMMANDS**: Do not use \\[...\\], \\(...\\), \\begin{{equation}}, or \\documentclass
            4. **Math Examples**:
               - Inline: The quadratic formula is $x = \\frac{{-b \\pm \\sqrt{{b^2 - 4ac}}}}{{2a}}$
               - Display: $$\\int x^2 \\, dx = \\frac{{x^3}}{{3}} + C$$
               - Fractions: Use \\frac{{numerator}}{{denominator}}
               - Square roots: Use \\sqrt{{expression}}
               - Integrals: Use \\int, \\sum, \\prod
               - Greek letters: \\alpha, \\beta, \\gamma, \\pi, \\theta, etc.
            
            DOCUMENT STRUCTURE RULES:
            1. **Sections**: Use \\section{{Title}}, \\subsection{{Title}}, \\subsubsection{{Title}}
            2. **Lists**: Use \\begin{{itemize}}...\\end{{itemize}} and \\begin{{enumerate}}...\\end{{enumerate}}
            3. **List Items**: Use \\item for each list item
            4. **Emphasis**: Use \\textbf{{bold text}} and \\textit{{italic text}}
            5. **Content Organization**: Break content into logical sections based on topics discussed
            
            MATHEMATICAL CONTENT GUIDELINES:
            - Always use proper LaTeX math syntax for equations, formulas, and mathematical expressions
            - Use display math ($$...$$) for important equations that should be centered
            - Use inline math ($...$) for mathematical terms within sentences
            - Include step-by-step derivations when applicable
            - Format mathematical definitions clearly
            
            Raw Transcript:
            {raw_transcript}
            
            On-screen Text Data (if available):
            {json.dumps(on_screen_text_data) if on_screen_text_data else "No on-screen text data provided."}
            
            Generate comprehensive LaTeX content (without \\documentclass or \\begin{{document}} - just the content that would go inside a document).
            Focus on clear structure, proper LaTeX math formatting with $ and $$ delimiters, and academic presentation.
            Ensure all mathematical expressions use proper LaTeX syntax that will render correctly with KaTeX.
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
        
        if note_format == 'LaTeX':
            system_message = "You are a helpful assistant that generates structured academic notes in LaTeX format. You MUST use proper math delimiters: single $ for inline math and double $$ for display math. Never use \\[...\\] or \\(...\\) or \\begin{equation}. Always use KaTeX-compatible LaTeX syntax."
        else:
            system_message = f"You are a helpful assistant that generates structured academic notes in {note_format.upper()} format."
        
        generation_response = openai_client.chat.completions.create(
            model="gpt-4o-mini", # Or your preferred model
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": generation_prompt}
            ]
        )

        generated_content = generation_response.choices[0].message.content
        print(f"Generated {note_format} content successfully.")

        # Post-process LaTeX content to fix common issues
        if note_format == 'LaTeX':
            generated_content = post_process_latex_content(generated_content)
            print("Applied LaTeX post-processing.")

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