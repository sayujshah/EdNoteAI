import { NextResponse } from 'next/server';
// import { supabase } from '../../../lib/supabase'; // Client-side client (might not be needed)
import createClient from '../../../lib/supabase/server'; // Import server-side client

// API route for managing lessons

// GET /api/lessons - Retrieve a user's lessons
export async function GET() {
  // Get authenticated user
  const supabaseServer = await createClient(); // Add await
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Fetching lessons for user:', user.id);

  // TODO: Get user ID from authenticated session
  // const userId = 'placeholder-user-id'; // Replace with actual user ID

  const { data, error } = await supabaseServer // Use server-side client
    .from('lessons')
    .select('*')
    .eq('user_id', user.id); // Use actual user ID

  if (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/lessons - Create a new lesson
export async function POST(request: Request) {
  // Get authenticated user
  const supabaseServer = await createClient(); // Add await
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Creating lesson for user:', user.id);

  const { title } = await request.json();

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { data, error } = await supabaseServer // Use server-side client
    .from('lessons')
    .insert([{ user_id: user.id, title: title }]) // Use actual user ID
    .select(); // Select the inserted data

  if (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]); // Return the first inserted record
}

// TODO: Implement PUT /api/lessons/{id} - Update a lesson
// TODO: Implement DELETE /api/lessons/{id} - Delete a lesson
