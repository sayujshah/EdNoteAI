import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// API route for managing lessons

// GET /api/lessons - Retrieve a user's lessons
export async function GET(request: Request) {
  // TODO: Get user ID from authenticated session
  const userId = 'placeholder-user-id'; // Replace with actual user ID

  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/lessons - Create a new lesson
export async function POST(request: Request) {
  // TODO: Get user ID from authenticated session
  const userId = 'placeholder-user-id'; // Replace with actual user ID

  const { title } = await request.json();

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('lessons')
    .insert([{ user_id: userId, title: title }])
    .select(); // Select the inserted data

  if (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]); // Return the first inserted record
}

// TODO: Implement PUT /api/lessons/{id} - Update a lesson
// TODO: Implement DELETE /api/lessons/{id} - Delete a lesson
