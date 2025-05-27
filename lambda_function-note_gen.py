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
    
    # First, fix missing backslashes before common LaTeX functions
    common_math_functions = [
        'frac', 'sqrt', 'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'sum', 'prod', 'int',
        'lim', 'alpha', 'beta', 'gamma', 'delta', 'pi', 'theta', 'sigma', 'omega',
        'infty', 'partial', 'nabla', 'cdot', 'times', 'pm', 'leq', 'geq', 'neq'
    ]
    
    processed_content = content
    
    # Fix missing backslashes in math expressions
    for func in common_math_functions:
        # Pattern: $ followed by function name without backslash
        pattern = rf'(\$\$?[^$]*?)([^\\]|^)({func})([^a-zA-Z])'
        replacement = rf'\1\2\\{func}\4'
        processed_content = re.sub(pattern, replacement, processed_content)
    
    # Fix common LaTeX math delimiter issues
    
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

        # --- Generate Notes in Unified Markdown + LaTeX Format ---
        # Always generate Markdown content with embedded LaTeX math expressions
        generation_prompt = f"""
        AI AGENT INSTRUCTIONS: CONVERT TRANSCRIPT TO MARKDOWN CONVERTER WITH LATEX MATH

        You are a specialized AI agent responsible for converting transcripts into well-structured Markdown notes. Your primary focus is creating clean, readable documentation with properly formatted mathematical expressions that render correctly in KaTeX.

        CORE RESPONSIBILITIES:
            1. Transform spoken content into structured written notes
            2. Format mathematical expressions using proper LaTeX syntax
            3. Organize content with clear hierarchy and flow
            4. Ensure KaTeX compatibility for all math expressions

        MARKDOWN STRUCTURE GUIDELINES:
            - Use appropriate heading levels (`#`, `##`, `###`) to create logical document hierarchy
            - Employ bullet points and numbered lists for clarity
            - Add emphasis with **bold** and *italic* text where appropriate
            - Include code blocks for non-mathematical code or formulas
            - Use blockquotes for important definitions or key concepts

        LaTeX MATH FORMATTING RULES:
            1. For KaTeX Compatibility:
                - Inline math: Wrap in single dollar signs `$...$`
                - Display math blocks: Wrap in double dollar signs `$$...$$`
                    - Always place display blocks on separate lines with blank lines above and below

            2. Mathematical Expression Guidelines:
                - Use `\\frac{{numerator}}{{denominator}}` for fractions
                - Use `^{{}}` for superscripts and `_{{}}` for subscripts
                - Use `\\sqrt{{}}` for square roots, `\\sqrt[n]{{}}` for nth roots
                - Use proper LaTeX function names: `\\sin`, `\\cos`, `\\log`, `\\ln`, `\\exp`
                - Use `\\sum`, `\\prod`, `\\int` for summation, product, and integral symbols
                - Use `\\alpha`, `\\beta`, `\\gamma`, etc. for Greek letters
                - Use `\\mathbf{{}}` for bold math symbols
                - Use `\\text{{}}` for text within math expressions

            3. Common Math Symbols and Operators:
                - `\\pm` for ±, `\\mp` for ∓
                - `\\times` for ×, `\\cdot` for ·
                - `\\leq` for ≤, `\\geq` for ≥
                - `\\neq` for ≠, `\\approx` for ≈
                - `\\infty` for ∞
                - `\\partial` for partial derivatives
                - `\\nabla` for gradient operator

        CONTENT ORGANIZATION:
            1. Title: Create a clear, descriptive title
            2. Overview/Summary: Brief introduction to the topic
            3. Main Sections: Organize content thematically with subheadings
            4. Key Equations: Highlight important formulas in display math blocks
            5. Examples: Include worked examples where applicable
            6. Definitions: Clearly mark and format important definitions

        QUALITY STANDARDS:
            - Accuracy: Ensure all mathematical expressions are syntactically correct
            - Readability: Balance detail with clarity
            - Consistency: Use consistent formatting throughout
            - Completeness: Don't omit important information from the transcript

        EXAMPLE OUTPUT FORMAT:

            ```markdown
            # Topic Title

            ## Overview
            Brief description of the content covered.

            ## Key Concepts

            ### Concept 1
            Explanation with inline math like $E = mc^2$ when appropriate.

            Important formula:
            $$
            \\int_{{-\\infty}}^{{\\infty}} e^{{-x^2}} dx = \\sqrt{{\\pi}}
            $$

            ### Concept 2
            More content with proper LaTeX formatting.

            ## Examples

            ### Example 1
            Step-by-step solution showing:
            $$
            \\frac{{d}}{{dx}}[x^n] = nx^{{n-1}}
            $$

            ## Summary
            Key takeaways and important formulas.
            ```

        ERROR PREVENTION CHECKLIST
        Before finalizing output, verify:
            - All math expressions use proper LaTeX syntax
            - Display math blocks are properly separated with blank lines
            - Inline math doesn't break across lines
            - Heading hierarchy is logical and consistent
            - All mathematical symbols render correctly in KaTeX
            - No raw transcript artifacts remain (e.g., "um", "uh", speaker names)

        SPECIAL INSTRUCITONS:
            - If the transcript contains unclear mathematical expressions, make reasonable interpretations based on context
            - When in doubt about mathematical notation, choose the most standard LaTeX representation
            - Preserve the logical flow and key insights from the original transcript
            - Add clarifying context where the spoken word might be ambiguous in written form
            - If equations are referenced verbally (e.g., "equation 1"), create numbered equations using `\\tag{{}}`

        Remember: Your output will be processed by KaTeX, so all LaTeX must be compatible with KaTeX's supported functions and syntax.
        """

        print(f"Sending request to OpenAI for unified Markdown+LaTeX content generation...")
        
        system_message = "You are a helpful assistant that generates structured academic notes in Markdown format with embedded LaTeX math expressions. CRITICAL REQUIREMENTS: 1) MUST use proper math delimiters: single $ for inline math and double $$ for display math. 2) EVERY LaTeX function MUST start with a backslash (\\): use \\frac not frac, \\sin not sin, \\sum not sum, \\alpha not alpha. 3) Never use \\[...\\] or \\(...\\) or \\begin{{equation}}. 4) Always use KaTeX-compatible LaTeX syntax within Markdown structure. REMEMBER: Missing backslashes will break math rendering!"
        
        generation_response = openai_client.chat.completions.create(
            model="gpt-4o-mini", # Or your preferred model
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": generation_prompt}
            ]
        )

        generated_content = generation_response.choices[0].message.content
        print(f"Generated unified Markdown+LaTeX content successfully.")

        # Post-process LaTeX content to fix common issues
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