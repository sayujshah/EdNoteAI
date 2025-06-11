import { NextResponse } from 'next/server';
import createClient from '../../../../lib/supabase/server';
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

// Batch cleanup service for old processed files
export async function POST(request: Request) {
  try {
    // Verify this is an authorized request (you might want to add API key or other auth)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CLEANUP_SERVICE_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseServer = await createClient();

    // Find videos that are completed but haven't been cleaned up and are older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: videosToCleanup, error: fetchError } = await supabaseServer
      .from('videos')
      .select('id, s3_audio_key, user_id, uploaded_at')
      .eq('transcription_status', 'completed')
      .eq('s3_cleaned_up', false)
      .not('s3_audio_key', 'is', null)
      .lt('uploaded_at', oneHourAgo)
      .limit(50); // Process in batches of 50

    if (fetchError) {
      console.error('Error fetching videos for cleanup:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    if (!videosToCleanup || videosToCleanup.length === 0) {
      return NextResponse.json({ 
        message: 'No videos need cleanup',
        processed: 0
      });
    }

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    for (const video of videosToCleanup) {
      try {
        // Delete the S3 file
        const deleteObjectCommand = new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: video.s3_audio_key,
        });
        
        await s3Client.send(deleteObjectCommand);
        console.log(`Batch cleanup: Deleted S3 object ${video.s3_audio_key} for video ${video.id}`);

        // Update the video record
        const { error: updateError } = await supabaseServer
          .from('videos')
          .update({ 
            s3_audio_key: null,
            s3_cleaned_up: true,
            s3_cleanup_at: new Date().toISOString()
          })
          .eq('id', video.id);

        if (updateError) {
          console.error(`Failed to update video ${video.id}:`, updateError);
          failureCount++;
          results.push({ 
            videoId: video.id, 
            status: 'db_update_failed', 
            error: updateError.message 
          });
        } else {
          successCount++;
          results.push({ 
            videoId: video.id, 
            status: 'success' 
          });
        }

      } catch (s3Error) {
        console.error(`Failed to delete S3 object for video ${video.id}:`, s3Error);
        failureCount++;
        results.push({ 
          videoId: video.id, 
          status: 's3_delete_failed', 
          error: s3Error instanceof Error ? s3Error.message : 'Unknown S3 error'
        });
      }

      // Add a small delay to avoid overwhelming S3
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      message: 'Batch cleanup completed',
      processed: videosToCleanup.length,
      successful: successCount,
      failed: failureCount,
      results
    });

  } catch (error) {
    console.error('Error during batch cleanup:', error);
    return NextResponse.json({ 
      error: 'Internal server error during batch cleanup' 
    }, { status: 500 });
  }
}

// GET endpoint to check cleanup status
export async function GET() {
  try {
    const supabaseServer = await createClient();

    // Get statistics about cleanup status
    const { data: stats, error } = await supabaseServer
      .from('videos')
      .select('transcription_status, s3_cleaned_up, s3_audio_key')
      .not('s3_audio_key', 'is', null);

    if (error) {
      console.error('Error fetching cleanup stats:', error);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    const completed = stats?.filter(v => v.transcription_status === 'completed') || [];
    const needsCleanup = completed.filter(v => !v.s3_cleaned_up);
    const cleaned = completed.filter(v => v.s3_cleaned_up);

    return NextResponse.json({
      total_files_with_s3_key: stats?.length || 0,
      completed_processing: completed.length,
      needs_cleanup: needsCleanup.length,
      already_cleaned: cleaned.length,
      pending_processing: stats?.filter(v => v.transcription_status !== 'completed').length || 0
    });

  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 