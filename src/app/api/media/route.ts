import { NextResponse } from 'next/server';
import createClient from '../../../lib/supabase/server'; // Import server-side client - Corrected path

// API route for managing videos (listing)

// GET /api/videos - Retrieve a list of videos for the authenticated user with filtering and sorting
export async function GET(request: Request) {
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get('type'); // Get type filter (video or audio)
  const sortBy = searchParams.get('sortBy'); // Get sort parameter (e.g., created_at_desc)

  console.log(`Fetching videos for user: ${user.id}, Filter: ${typeFilter}, Sort: ${sortBy}`);

  // Query videos directly by user_id
  let query = supabaseServer
    .from('videos')
    .select('*, transcripts(*)')
    .eq('user_id', user.id); // Filter videos by user ownership

  // Apply type filter
  if (typeFilter === 'video') {
    query = query.like('file_url', '%.mp4'); // Basic filtering by file extension
  } else if (typeFilter === 'audio') {
    query = query.not('file_url', 'like', '%.mp4'); // Basic filtering by file extension (not mp4)
  }

  // Apply sorting
  if (sortBy === 'created_at_asc') {
    query = query.order('created_at', { ascending: true });
  } else if (sortBy === 'title_asc') {
    query = query.order('title', { ascending: true });
  } else if (sortBy === 'title_desc') {
    query = query.order('title', { ascending: false });
  } else { // Default sort
    query = query.order('created_at', { ascending: false });
  }

  const { data: videosData, error: videosError } = await query;

  if (videosError) {
    console.error('Error fetching videos:', videosError);
    return NextResponse.json({ error: videosError.message }, { status: 500 });
  }

  return NextResponse.json(videosData);
}

// TODO: Implement POST /api/videos - Create a new video (might be handled by upload route or separately)
