import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { v4 as uuidv4 } from 'uuid';
import createClient from '../../../lib/supabase/server'; // Import server-side client
import { SubscriptionService } from '@/lib/services/subscriptionService';
import { UPLOAD_LIMITS, UPLOAD_ERROR_MESSAGES } from '@/lib/constants';

// Configure AWS S3 client (same as transcribe route)
const s3Client = new S3Client({
  region: process.env.REGION_AWS!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
  },
});

const s3BucketName = process.env.S3_BUCKET_NAME_AWS!;

// Configure AWS Lambda client (same as transcribe route)
const lambdaClient = new LambdaClient({
  region: process.env.REGION_AWS!, // Use the same region as S3
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
  },
});

const transcriptionLambdaFunctionName = process.env.TRANSCRIPTION_LAMBDA_FUNCTION_NAME_AWS!;

// Helper function to get media duration (simplified for demo - you may want to use a media library)
async function getMediaDurationMinutes(file: File): Promise<number> {
  // This is a simplified version. In production, you'd want to use a proper media analysis library
  // For now, we'll estimate based on file size (very rough approximation)
  // 1MB ≈ 1 minute for audio/video files (this is just an estimate)
  const fileSizeMB = file.size / (1024 * 1024);
  return Math.ceil(fileSizeMB); // Very rough estimate - replace with actual media duration detection
}

// POST /api/upload - Handle file uploads for transcription
export async function POST(request: Request) {
  // Get authenticated user
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  console.log('Received file upload request for user:', user.id);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File; // Assuming the file is sent with the key 'file'
    const lessonId = formData.get('lessonId') as string; // Assuming lessonId is sent with the key 'lessonId'
    const noteFormat = formData.get('noteFormat') as string || 'Markdown'; // Get note format, default to markdown

    if (!file) {
      return NextResponse.json({ status: 'error', message: 'No file uploaded' }, { status: 400 });
    }

    // Server-side file size validation using shared constants
    if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      return NextResponse.json({ 
        status: 'error', 
        message: UPLOAD_ERROR_MESSAGES.FILE_TOO_LARGE(fileSizeMB, UPLOAD_LIMITS.MAX_FILE_SIZE_MB)
      }, { status: 413 });
    }

    if (!lessonId) {
       return NextResponse.json({ status: 'error', message: 'lessonId is required for now' }, { status: 400 });
    }

    // Note: noteFormat is always 'Markdown' in the unified format (Markdown + LaTeX math)

    // Get estimated duration for validation
    const estimatedDurationMinutes = await getMediaDurationMinutes(file);
    console.log(`Estimated file duration: ${estimatedDurationMinutes} minutes`);

    // Validate upload against user's subscription limits
    const validation = await SubscriptionService.validateUpload(user.id, estimatedDurationMinutes);
    
    if (!validation.canUpload) {
      const errorMessages = {
        no_credits: `Insufficient credits. You have ${validation.creditsRemaining} credits remaining.`,
        duration_exceeded: `File duration (${estimatedDurationMinutes} min) exceeds your plan limit of ${validation.maxDurationMinutes} minutes.`,
        subscription_expired: 'Your subscription has expired. Please renew to continue uploading.'
      };

      return NextResponse.json({ 
        status: 'error', 
        message: errorMessages[validation.reason!] || 'Upload not allowed',
        code: validation.reason,
        details: {
          maxDurationMinutes: validation.maxDurationMinutes,
          creditsRemaining: validation.creditsRemaining,
          estimatedDuration: estimatedDurationMinutes
        }
      }, { status: 403 });
    }

    // Generate a unique file key for S3
    const fileExtension = file.name.split('.').pop(); // Corrected split
    const fileKey = `uploads/${uuidv4()}.${fileExtension}`;

    // Upload the file to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: fileKey,
      Body: Buffer.from(await file.arrayBuffer()), // Convert stream to Buffer for S3 upload
    });

    await s3Client.send(uploadCommand);
    console.log(`File uploaded to S3: ${fileKey}`);

    // Create a new video record in Supabase with duration tracking
    const { data: videoData, error: videoError } = await supabaseServer
      .from('videos')
      .insert([{ 
        lesson_id: lessonId, 
        file_url: fileKey, 
        transcription_status: 'pending', 
        s3_audio_key: fileKey, 
        note_format: noteFormat,
        duration_minutes: estimatedDurationMinutes,
        credits_consumed: 1,
        uploaded_at: new Date().toISOString()
      }]) // Save S3 key as file_url and note format
      .select('id') // Select the ID of the newly created video
      .single();

    if (videoError) {
      console.error('Error creating video record:', videoError);
      // TODO: Clean up S3 object if video record creation fails
      return NextResponse.json({ status: 'error', message: 'Failed to create video record' }, { status: 500 });
    }

    const newVideoId = videoData.id; // Get the ID of the newly created video

    // Consume user credits
    const creditsConsumed = await SubscriptionService.consumeCredits(user.id, 1);
    if (!creditsConsumed) {
      console.error('Failed to consume credits after successful upload');
      // In production, you might want to delete the video record and S3 file here
    }

    // Update usage statistics
    await SubscriptionService.updateUsage(user.id, {
      uploadMinutes: estimatedDurationMinutes,
      transcriptionsCount: 1
    });

    console.log(`Attempting to trigger Lambda function: ${transcriptionLambdaFunctionName}`); // Added logging
    // Trigger the transcription Lambda function
    const invokeCommand = new InvokeCommand({
      FunctionName: transcriptionLambdaFunctionName,
      InvocationType: 'Event', // Use 'Event' for asynchronous invocation
      Payload: JSON.stringify({ s3Key: fileKey, bucketName: s3BucketName, videoId: newVideoId, userId: user.id, noteFormat: noteFormat }), // Pass necessary info to Lambda including note format
    });

    await lambdaClient.send(invokeCommand);
    console.log(`Transcription Lambda function triggered for S3 key: ${fileKey}`); // Added logging

    // Include the newVideoId in the successful response
    return NextResponse.json({ status: 'processing', fileKey, mediaId: newVideoId });

  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to handle file upload' }, { status: 500 });
  }
}
