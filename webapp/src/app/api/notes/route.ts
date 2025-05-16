import { NextResponse } from 'next/server';
// import { supabase } from '../../../lib/supabase'; // Client-side client (might not be needed)
import createClient from '../../../lib/supabase/server'; // Import server-side client

// API route for managing notes

// GET /api/notes?transcriptId=... - Retrieve notes for a transcript
export async function GET(request: Request) {
  // Get authenticated user
  const supabaseServer = await createClient(); // Add await
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Fetching notes for user:', user.id);

  const { searchParams } = new URL(request.url);
  const transcriptId = searchParams.get('transcriptId');

  if (!transcriptId) {
    return NextResponse.json({ error: 'transcriptId is required' }, { status: 400 });
  }

  const { data, error } = await supabaseServer // Use server-side client
    .from('notes')
    .select('*')
    .eq('transcript_id', transcriptId)
    .eq('user_id', user.id); // Ensure notes belong to the user

  if (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/notes - Create a new note
export async function POST(request: Request) {
  // Get authenticated user
  const supabaseServer = await createClient(); // Add await
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Creating note for user:', user.id);

  const { transcript_id, content, visual_context } = await request.json();

  if (!transcript_id || !content) {
    return NextResponse.json({ error: 'transcript_id and content are required' }, { status: 400 });
  }

  const { data, error } = await supabaseServer // Use server-side client
    .from('notes')
    .insert([{ transcript_id: transcript_id, user_id: user.id, content: content, visual_context: visual_context }]) // Use actual user ID
    .select(); // Select the inserted data

  if (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]); // Return the first inserted record
}

// TODO: Implement PUT /api/notes/{id} - Update a note
// TODO: Implement DELETE /api/notes/{id} - Delete a note
