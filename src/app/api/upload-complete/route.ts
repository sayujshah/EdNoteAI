import { NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import createClient from '../../../lib/supabase/server';
import { SubscriptionService } from '@/lib/services/subscriptionService';

// Configure AWS Lambda client
const lambdaClient = new LambdaClient({
  region: process.env.REGION_AWS!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
  },
});

const transcriptionLambdaFunctionName = process.env.TRANSCRIPTION_LAMBDA_FUNCTION_NAME_AWS!;
const s3BucketName = process.env.S3_BUCKET_NAME_AWS!;

export async function POST(request: Request) {
  // Validate required environment variables first
  const requiredEnvVars = {
    REGION_AWS: process.env.REGION_AWS,
    ACCESS_KEY_ID_AWS: process.env.ACCESS_KEY_ID_AWS,
    SECRET_ACCESS_KEY_AWS: process.env.SECRET_ACCESS_KEY_AWS,
    TRANSCRIPTION_LAMBDA_FUNCTION_NAME_AWS: process.env.TRANSCRIPTION_LAMBDA_FUNCTION_NAME_AWS,
    S3_BUCKET_NAME_AWS: process.env.S3_BUCKET_NAME_AWS,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Server configuration error. Please contact support.',
      code: 'CONFIG_ERROR'
    }, { status: 500 });
  }

  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { mediaId, fileKey } = await request.json();

    if (!mediaId || !fileKey) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Verify video record exists and belongs to user
    const { data: videoData, error: fetchError } = await supabaseServer
      .from('videos')
      .select('*')
      .eq('id', mediaId)
      .eq('user_id', user.id) // Ensure user owns the video
      .single();

    if (fetchError || !videoData) {
      console.error('Error fetching video record:', fetchError);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Video record not found or access denied' 
      }, { status: 404 });
    }

    // Update uploaded timestamp to indicate upload is complete
    const { error: updateError } = await supabaseServer
      .from('videos')
      .update({ 
        uploaded_at: new Date().toISOString()
      })
      .eq('id', mediaId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating video record:', updateError);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Failed to update video record' 
      }, { status: 500 });
    }

    // Consume user credits
    try {
      const creditsConsumed = await SubscriptionService.consumeCredits(user.id, 1);
      if (!creditsConsumed) {
        console.error('Failed to consume credits after successful upload');
      }
    } catch (creditsError) {
      console.error('Error consuming credits:', creditsError);
      // Don't fail the process if credits consumption fails
    }

    // Update usage statistics
    try {
      await SubscriptionService.updateUsage(user.id, {
        uploadMinutes: videoData.duration_minutes || 1,
        transcriptionsCount: 1
      });
    } catch (usageError) {
      console.error('Error updating usage statistics:', usageError);
      // Don't fail the process if usage update fails
    }

    console.log(`Attempting to trigger Lambda function: ${transcriptionLambdaFunctionName}`);
    
    // Trigger the transcription Lambda function
    const invokeCommand = new InvokeCommand({
      FunctionName: transcriptionLambdaFunctionName,
      InvocationType: 'Event', // Use 'Event' for asynchronous invocation
      Payload: JSON.stringify({ 
        s3Key: fileKey, 
        bucketName: s3BucketName, 
        videoId: mediaId, 
        userId: user.id, 
        noteFormat: videoData.note_format || 'Markdown'
      }),
    });

    try {
      await lambdaClient.send(invokeCommand);
      console.log(`Transcription Lambda function triggered for S3 key: ${fileKey}`);
    } catch (lambdaError) {
      console.error('Lambda invocation failed:', lambdaError);
      // Update status to indicate Lambda failure
      await supabaseServer
        .from('videos')
        .update({ transcription_status: 'failed' })
        .eq('id', mediaId);
      
      return NextResponse.json({ 
        status: 'error', 
        message: 'Failed to start transcription processing. Please try again.',
        code: 'LAMBDA_ERROR'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'Upload completed and processing started',
      mediaId: mediaId
    });

  } catch (error) {
    console.error('Error processing upload completion:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to process upload completion' 
    }, { status: 500 });
  }
} 