import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

// API route for managing a specific note by ID

// PUT /api/notes/{id} - Update a note
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // TODO: Get user ID from authenticated session and verify ownership
  const userId = 'placeholder-user-id'; // Replace with actual user ID
  const noteId = params.id;

  const updates = await request.json();

  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', noteId)
    .eq('user_id', userId) // Ensure user owns the note
    .select();

  if (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Note not found or user does not own it' }, { status: 404 });
  }

  return NextResponse.json(data[0]);
}

// DELETE /api/notes/{id} - Delete a note
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // TODO: Get user ID from authenticated session and verify ownership
  const userId = 'placeholder-user-id'; // Replace with actual user ID
  const noteId = params.id;

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId); // Ensure user owns the note

  if (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Supabase delete does not return data on success, check error instead
  // If no error, assume success. Could verify by fetching after delete if needed.
  return NextResponse.json({ message: 'Note deleted successfully' });
}
