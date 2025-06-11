import { NextResponse } from 'next/server';
import createClient from '../../../../../lib/supabase/server';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Initialize AWS S3 client
const s3Client = new S3Client({
  region: process.env.REGION_AWS!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
  },
});

const s3BucketName = process.env.S3_BUCKET_NAME_AWS!;

// API route for cleaning up S3 files after analysis is complete
export async function POST(request: Request, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch the video to get S3 key and check processing status
    const { data: videoData, error: videoError } = await supabaseServer
      .from('videos')
      .select('id, s3_audio_key, transcription_status, user_id')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single();

    if (videoError || !videoData) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check if processing is complete (transcription is done)
    if (videoData.transcription_status !== 'completed') {
      return NextResponse.json({ 
        message: 'Processing not yet complete, cleanup skipped',
        status: 'pending'
      });
    }

    // Delete the S3 file if it exists
    if (videoData.s3_audio_key) {
      try {
        const deleteObjectCommand = new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: videoData.s3_audio_key,
        });
        
        await s3Client.send(deleteObjectCommand);
        console.log(`Cleaned up S3 object: ${videoData.s3_audio_key} for video ${videoId}`);

        // Update the video record to indicate S3 file has been cleaned up
        await supabaseServer
          .from('videos')
          .update({ 
            s3_audio_key: null, // Clear the S3 key since file is deleted
            s3_cleaned_up: true,
            s3_cleanup_at: new Date().toISOString()
          })
          .eq('id', videoId);

        return NextResponse.json({ 
          status: 'success', 
          message: 'S3 file cleaned up successfully' 
        });

      } catch (s3Error) {
        console.error('Error deleting S3 object:', s3Error);
        return NextResponse.json({ 
          error: 'Failed to delete S3 file',
          status: 'error'
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ 
        message: 'No S3 file to clean up',
        status: 'no_file'
      });
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json({ 
      error: 'Internal server error during cleanup' 
    }, { status: 500 });
  }
} 