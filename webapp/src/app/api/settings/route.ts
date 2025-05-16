import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// API route for managing user settings

// GET /api/settings - Retrieve user settings
export async function GET(request: Request) {
  // TODO: Get user ID from authenticated session
  const userId = 'placeholder-user-id'; // Replace with actual user ID

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single(); // Assuming one settings record per user

  if (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT /api/settings - Update user settings
export async function PUT(request: Request) {
  // TODO: Get user ID from authenticated session
  const userId = 'placeholder-user-id'; // Replace with actual user ID

  const updates = await request.json();

  const { data, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', userId)
    .select(); // Select the updated data

  if (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]); // Return the first updated record
}
