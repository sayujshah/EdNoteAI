import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// API route for managing notes

// GET /api/notes?transcriptId=... - Retrieve notes for a transcript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const transcriptId = searchParams.get('transcriptId');

  if (!transcriptId) {
    return NextResponse.json({ error: 'transcriptId is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('transcript_id', transcriptId);

  if (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/notes - Create a new note
export async function POST(request: Request) {
  // TODO: Get user ID from authenticated session
  const userId = 'placeholder-user-id'; // Replace with actual user ID

  const { transcript_id, content, visual_context } = await request.json();

  if (!transcript_id || !content) {
    return NextResponse.json({ error: 'transcript_id and content are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('notes')
    .insert([{ transcript_id: transcript_id, user_id: userId, content: content, visual_context: visual_context }])
    .select(); // Select the inserted data

  if (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]); // Return the first inserted record
}

// TODO: Implement PUT /api/notes/{id} - Update a note
// TODO: Implement DELETE /api/notes/{id} - Delete a note
