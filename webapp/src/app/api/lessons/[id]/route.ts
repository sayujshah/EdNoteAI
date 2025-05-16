import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

// API route for managing a specific lesson by ID

// PUT /api/lessons/{id} - Update a lesson
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // TODO: Get user ID from authenticated session and verify ownership
  const userId = 'placeholder-user-id'; // Replace with actual user ID
  const lessonId = params.id;

  const updates = await request.json();

  const { data, error } = await supabase
    .from('lessons')
    .update(updates)
    .eq('id', lessonId)
    .eq('user_id', userId) // Ensure user owns the lesson
    .select();

  if (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Lesson not found or user does not own it' }, { status: 404 });
  }

  return NextResponse.json(data[0]);
}

// DELETE /api/lessons/{id} - Delete a lesson
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // TODO: Get user ID from authenticated session and verify ownership
  const userId = 'placeholder-user-id'; // Replace with actual user ID
  const lessonId = params.id;

  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)
    .eq('user_id', userId); // Ensure user owns the lesson

  if (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Supabase delete does not return data on success, check error instead
  // If no error, assume success. Could verify by fetching after delete if needed.
  return NextResponse.json({ message: 'Lesson deleted successfully' });
}
