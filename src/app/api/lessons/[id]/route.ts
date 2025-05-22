import { NextResponse } from 'next/server';
// import { supabase } from '../../../../lib/supabase'; // Client-side client (might not be needed)
import createClient from '../../../../lib/supabase/server'; // Import server-side client

// API route for managing a specific lesson by ID

// PUT /api/lessons/{id} - Update a lesson
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // Get authenticated user
  const supabaseServer = await createClient(); // Add await
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Updating lesson', params.id, 'for user:', user.id);

  // TODO: Get user ID from authenticated session and verify ownership
  // const userId = 'placeholder-user-id'; // Replace with actual user ID
  const lessonId = params.id;

  const updates: unknown = await request.json(); // Use unknown for updates

  // Basic type check for updates
  if (typeof updates !== 'object' || updates === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { data, error } = await supabaseServer // Use server-side client
    .from('lessons')
    .update(updates)
    .eq('id', lessonId)
    .eq('user_id', user.id) // Ensure user owns the lesson - Use actual user ID
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
  // Get authenticated user
  const supabaseServer = await createClient(); // Add await
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Deleting lesson', params.id, 'for user:', user.id);

  const lessonId = params.id;

  const { error } = await supabaseServer // Use server-side client
    .from('lessons')
    .delete()
    .eq('id', lessonId)
    .eq('user_id', user.id); // Ensure user owns the lesson - Use actual user ID

  if (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Supabase delete does not return data on success, check error instead
  // If no error, assume success. Could verify by fetching after delete if needed.
  return NextResponse.json({ message: 'Lesson deleted successfully' });
}
