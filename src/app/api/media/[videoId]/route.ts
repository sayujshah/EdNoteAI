import { NextResponse } from 'next/server';
import createClient from '../../../../lib/supabase/server'; // Import server-side client
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'; // Import DeleteObjectCommand and S3Client

// Initialize AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const s3BucketName = process.env.AWS_S3_BUCKET_NAME!;
const awsRegion = process.env.AWS_REGION!; // Get AWS region for S3 URL construction

// API route for managing a specific video by ID

// GET /api/videos/{videoId} - Retrieve a single video and its transcript and notes
export async function GET(request: Request, { params }: { params: Promise<{ videoId: string }> }) {
  // Await params before accessing videoId
  const { videoId } = await params;
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Fetching video', videoId, 'for user:', user.id);

  // Fetch the video, its associated transcript, and notes nested under transcript
  // Select the s3_audio_key to construct the public URL
  const { data: videoData, error: videoError } = await supabaseServer
    .from('videos')
    .select('*, transcripts(*, notes(*)), lessons(user_id), s3_audio_key') // Select s3_audio_key
    .eq('id', videoId)
    .single(); // Assuming one video per ID

  if (videoError) {
    console.error('Error fetching video, transcript, and notes:', videoError);
    return NextResponse.json({ error: videoError.message }, { status: 500 });
  }

  if (!videoData || videoData.lessons?.user_id !== user.id) {
    return NextResponse.json({ error: 'Video not found or user does not own it' }, { status: 404 });
  }

  // Construct the public S3 object URL using the s3_audio_key
  // Assuming the S3 bucket is publicly accessible
  const publicFileUrl = `https://${s3BucketName}.s3.${awsRegion}.amazonaws.com/${videoData.s3_audio_key}`;

  // Return the video data, replacing the stored file_url (S3 key) with the public URL
  // Or add a new property for the public URL if you want to keep the S3 key
  // Let's replace file_url for simplicity, assuming frontend expects the playable URL there
  const responseData = {
      ...videoData,
      file_url: publicFileUrl, // Replace file_url with the public S3 URL
      // Remove s3_audio_key from the response if you don't want to expose it
      // s3_audio_key: undefined,
  };


  return NextResponse.json(responseData);
}

// PUT /api/videos/{videoId} - Update video details
export async function PUT(request: Request, { params }: { params: Promise<{ videoId: string }> }) {
  
  // Await params before accessing videoId
  const { videoId } = await params;
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
  // Await params before accessing videoId
  const { videoId } = await params;
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


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

  // Delete associated transcript and notes first (if they exist)
  // Assuming transcript and notes are linked via video_id and cascade delete is not set up
  const { error: deleteTranscriptError } = await supabaseServer
    .from('transcripts')
    .delete()
    .eq('video_id', videoId);

  if (deleteTranscriptError) {
    console.error('Error deleting associated transcript:', deleteTranscriptError);
    // Continue with video deletion but log the error
  }

  // TODO: If a separate AI notes table is created, delete from there too

  // Delete the video record from Supabase
  const { error: deleteVideoError } = await supabaseServer
    .from('videos')
    .delete()
    .eq('id', videoId);

  if (deleteVideoError) {
    console.error('Error deleting video record:', deleteVideoError);
    return NextResponse.json({ error: deleteVideoError.message }, { status: 500 });
  }

  // Delete the S3 audio file using the s3_audio_key
  if (videoData.s3_audio_key) {
    try {
      const deleteObjectCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: videoData.s3_audio_key,
      });
      await s3Client.send(deleteObjectCommand);
      console.log(`Deleted S3 object: ${videoData.s3_audio_key}`);
    } catch (s3Error) {
      console.error('Error deleting S3 object:', s3Error);
      // Continue with the response but log the error
    }
  }

  return NextResponse.json({ status: 'success', message: 'Video deleted successfully' });
}
