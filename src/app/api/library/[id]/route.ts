import { NextResponse } from 'next/server';
import createClient from '../../../../lib/supabase/server';
import type { UpdateSavedNoteRequest } from '@/lib/types/library';

// API route for managing individual saved notes

// GET /api/library/[id] - Get a specific saved note
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Await the params
  const { id } = await params;
  
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`Fetching saved note ${id} for user: ${user.id}`);

  try {
    const { data: savedNote, error } = await supabaseServer
      .from('saved_notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the note
      .single();

    if (error) {
      console.error('Error fetching saved note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!savedNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(savedNote);

  } catch (err: any) {
    console.error('Error fetching saved note:', err);
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
  }
}

// PUT /api/library/[id] - Update a saved note
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Await the params
  const { id } = await params;
  
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`Updating saved note ${id} for user: ${user.id}`);

  try {
    const updates: UpdateSavedNoteRequest = await request.json();

    // Remove any fields that shouldn't be updated
    const allowedUpdates = {
      title: updates.title,
      content: updates.content,
      tags: updates.tags
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key as keyof typeof allowedUpdates] === undefined) {
        delete allowedUpdates[key as keyof typeof allowedUpdates];
      }
    });

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: updatedNote, error } = await supabaseServer
      .from('saved_notes')
      .update(allowedUpdates)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the note
      .select()
      .single();

    if (error) {
      console.error('Error updating saved note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedNote) {
      return NextResponse.json({ error: 'Note not found or user does not own it' }, { status: 404 });
    }

    return NextResponse.json(updatedNote);

  } catch (err: any) {
    console.error('Error updating saved note:', err);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE /api/library/[id] - Delete a saved note
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Await the params
  const { id } = await params;
  
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`Deleting saved note ${id} for user: ${user.id}`);

  try {
    const { error } = await supabaseServer
      .from('saved_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user owns the note

    if (error) {
      console.error('Error deleting saved note:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Note deleted successfully' });

  } catch (err: any) {
    console.error('Error deleting saved note:', err);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
} 