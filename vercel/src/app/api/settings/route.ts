import { NextResponse } from 'next/server';
// import { supabase } from '../../../lib/supabase'; // Client-side client (might not be needed)
import createClient from '../../../lib/supabase/server'; // Import server-side client

// API route for managing user settings

// GET /api/settings - Retrieve user settings
export async function GET(request: Request) {
  // Get authenticated user
  const supabaseServer = await createClient(); // Add await
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Fetching settings for user:', user.id);

  // TODO: Get user ID from authenticated session
  // const userId = 'placeholder-user-id'; // Replace with actual user ID

  const { data, error } = await supabaseServer // Use server-side client
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id) // Ensure settings belong to the user
    .single(); // Assuming one settings record per user

  if (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT /api/settings - Update user settings
export async function PUT(request: Request) {
  // Get authenticated user
  const supabaseServer = await createClient(); // Add await
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Updating settings for user:', user.id);

  const updates = await request.json();

  const { data, error } = await supabaseServer // Use server-side client
    .from('user_settings')
    .update(updates)
    .eq('user_id', user.id) // Ensure settings belong to the user
    .select(); // Select the updated data

  if (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]); // Return the first updated record
}
