import { NextResponse } from 'next/server';
import createClient from '../../../../lib/supabase/server'; // Import server-side client

// API route for managing a specific video by ID

// GET /api/videos/{videoId} - Retrieve a single video and its transcript
export async function GET(request: Request, { params }: { params: { videoId: string } }) {
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Fetching video', params.videoId, 'for user:', user.id);

  const videoId = params.videoId;

  // Fetch the video and its associated transcript
  const { data: videoData, error: videoError } = await supabaseServer
    .from('videos')
    .select('*, transcripts(*), lessons(user_id)') // Select the video, transcript, and related lesson's user_id
    .eq('id', videoId)
    .single(); // Assuming one video per ID

  if (videoError) {
    console.error('Error fetching video and transcript:', videoError);
    return NextResponse.json({ error: videoError.message }, { status: 500 });
  }

  if (!videoData || videoData.lessons?.user_id !== user.id) {
    return NextResponse.json({ error: 'Video not found or user does not own it' }, { status: 404 });
  }

  return NextResponse.json(videoData);
}

// PUT /api/videos/{videoId} - Update video details
export async function PUT(request: Request, { params }: { params: { videoId: string } }) {
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const videoId = params.videoId;
  const { url } = await request.json(); // Assuming only URL is updatable for now

  console.log('Updating video', videoId, 'for user:', user.id);

  // Check if the video belongs to the user before updating
  const { data: videoData, error: fetchError } = await supabaseServer
    .from('videos')
    .select('lessons(user_id)')
    .eq('id', videoId)
    .single();

  // Check if the video belongs to the user before proceeding
  // Access user_id from the nested lessons object, handling potential array return
  if (fetchError || !videoData || !videoData.lessons || videoData.lessons[0]?.user_id !== user.id) {
    return NextResponse.json({ error: 'Video not found or user does not own it' }, { status: 404 });
  }

  // Update video details
  const { data, error: updateError } = await supabaseServer
    .from('videos')
    .update({ url: url }) // Update the URL field
    .eq('id', videoId)
    .select() // Select the updated video data
    .single();

  if (updateError) {
    console.error('Error updating video:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/videos/{videoId} - Delete a video
export async function DELETE(request: Request, { params }: { params: { videoId: string } }) {
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const videoId = params.videoId;

  console.log('Deleting video', videoId, 'for user:', user.id);

  // Check if the video belongs to the user before deleting
  const { data: videoData, error: fetchError } = await supabaseServer
    .from('videos')
    .select('lessons(user_id), s3_audio_key') // Also get s3_audio_key for S3 deletion
    .eq('id', videoId)
    .single();

  // Check if the video belongs to the user before deleting
  // Access user_id from the nested lessons object, handling potential array return
  if (fetchError || !videoData || !videoData.lessons || videoData.lessons[0]?.user_id !== user.id) {
    return NextResponse.json({ error: 'Video not found or user does not own it' }, { status: 404 });
  }

  // TODO: Delete associated transcript and notes first (if they exist)
  // This might require separate API calls or database cascade rules

  // Delete the video record from Supabase
  const { error: deleteError } = await supabaseServer
    .from('videos')
    .delete()
    .eq('id', videoId);

  if (deleteError) {
    console.error('Error deleting video record:', deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // TODO: Delete the S3 audio file using the s3_audio_key
  // This requires AWS SDK S3 DeleteObjectCommand

  return NextResponse.json({ status: 'success', message: 'Video deleted successfully' });
}
