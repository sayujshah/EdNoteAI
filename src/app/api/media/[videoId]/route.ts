import { NextResponse } from 'next/server';
import createClient from '../../../../lib/supabase/server'; // Import server-side client
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'; // Import DeleteObjectCommand and S3Client
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'; // Import getSignedUrl for signed URLs
import { GetObjectCommand } from '@aws-sdk/client-s3'; // Import GetObjectCommand

// Initialize AWS S3 client
const s3Client = new S3Client({
  region: process.env.REGION_AWS!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
  },
});

const s3BucketName = process.env.S3_BUCKET_NAME_AWS!;

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
    .select(`
      *,
      lessons(user_id),
      transcripts(
        id,
        content,
        video_id,
        created_at,
        notes(*)
      )
    `) // Simplified query with explicit transcript content selection
    .eq('id', videoId)
    .single(); // Assuming one video per ID

  if (videoError) {
    console.error('Error fetching video, transcript, and notes:', videoError);
    return NextResponse.json({ error: videoError.message }, { status: 500 });
  }

  if (!videoData || videoData.lessons?.user_id !== user.id) {
    return NextResponse.json({ error: 'Video not found or user does not own it' }, { status: 404 });
  }

  // If transcripts are empty, try fetching them separately
  if (!videoData.transcripts || videoData.transcripts.length === 0) {
    console.log('No transcripts found in nested query, fetching separately...');
    const { data: transcriptData, error: transcriptError } = await supabaseServer
      .from('transcripts')
      .select(`
        id,
        content,
        video_id,
        created_at,
        notes(*)
      `)
      .eq('video_id', videoId);

    if (transcriptError) {
      console.error('Error fetching transcripts separately:', transcriptError);
    } else {
      console.log('Separate transcript query result:', JSON.stringify(transcriptData, null, 2));
      videoData.transcripts = transcriptData || [];
    }
  }

  // Construct a signed S3 object URL using the s3_audio_key
  let signedFileUrl = null;
  if (videoData.s3_audio_key) {
    const command = new GetObjectCommand({
      Bucket: s3BucketName,
      Key: videoData.s3_audio_key,
    });
    signedFileUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
  }

  const responseData = {
      ...videoData,
      file_url: signedFileUrl, // Replace file_url with the signed S3 URL
      // s3_audio_key: undefined, // Optionally remove this from the response
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
export async function DELETE(request: Request, { params }: { params: Promise<{ videoId: string }> }) {
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
        Bucket: process.env.S3_BUCKET_NAME_AWS!,
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
