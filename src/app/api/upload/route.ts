import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { v4 as uuidv4 } from 'uuid';
import createClient from '../../../lib/supabase/server'; // Import server-side client
import { SubscriptionService } from '@/lib/services/subscriptionService';
import { UPLOAD_LIMITS, UPLOAD_ERROR_MESSAGES } from '@/lib/constants';

// Configure runtime and body size for this API route
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout for large uploads

// Configure AWS S3 client (same as transcribe route)
const s3Client = new S3Client({ region: process.env.REGION_AWS! });

const s3BucketName = process.env.S3_BUCKET_NAME_AWS!;

// Configure AWS Lambda client (same as transcribe route)
const lambdaClient = new LambdaClient({ region: process.env.REGION_AWS! });

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
    const file = formData.get('file') as File;
    const lessonId = formData.get('lessonId') as string; // Optional lesson ID
    const noteFormat = formData.get('noteFormat') as string || 'Markdown';

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

    // If no lessonId provided, create or find a default lesson
    let finalLessonId = lessonId;
    if (!lessonId) {
      // Find or create a default lesson for the user
      let { data: existingLessons, error: lessonFetchError } = await supabaseServer
        .from('lessons')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lessonFetchError) {
        console.error('Error fetching lessons:', lessonFetchError);
        return NextResponse.json({ status: 'error', message: 'Failed to fetch lessons' }, { status: 500 });
      }

      if (existingLessons && existingLessons.length > 0) {
        // Use the most recent lesson
        finalLessonId = existingLessons[0].id;
        console.log(`Using existing recent lesson for user ${user.id}: ${finalLessonId} (${existingLessons[0].title})`);
      } else {
        // Create a new default lesson if user has no lessons
        const currentDate = new Date().toLocaleDateString();
        const { data: newLesson, error: lessonCreateError } = await supabaseServer
          .from('lessons')
          .insert([{
            user_id: user.id,
            title: `My Lessons - ${currentDate}`,
            tags: []
          }])
          .select('id')
          .single();

        if (lessonCreateError) {
          console.error('Error creating default lesson:', lessonCreateError);
          return NextResponse.json({ status: 'error', message: 'Failed to create lesson' }, { status: 500 });
        }
        
        finalLessonId = newLesson.id;
        console.log(`Created new default lesson for user ${user.id}: ${finalLessonId}`);
      }
    }

    // Get estimated duration for validation
    const estimatedDurationMinutes = await getMediaDurationMinutes(file);
    console.log(`Estimated file duration: ${estimatedDurationMinutes} minutes`);

    // Validate upload against user's subscription limits
    let validation;
    try {
      validation = await SubscriptionService.validateUpload(user.id, estimatedDurationMinutes);
    } catch (subscriptionError) {
      console.error('Subscription validation failed:', subscriptionError);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Unable to validate subscription. Please try again.',
        code: 'SUBSCRIPTION_ERROR'
      }, { status: 500 });
    }
    
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

    try {
      await s3Client.send(uploadCommand);
      console.log(`File uploaded to S3: ${fileKey}`);
    } catch (s3Error) {
      console.error('S3 upload failed:', s3Error);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Failed to upload file to storage. Please try again.',
        code: 'S3_UPLOAD_ERROR'
      }, { status: 500 });
    }

    // Create a new video record in Supabase with duration tracking
    const { data: videoData, error: videoError } = await supabaseServer
      .from('videos')
      .insert([{ 
        user_id: user.id, // Add user_id for ownership
        lesson_id: finalLessonId, 
        file_url: fileKey, 
        transcription_status: 'pending', 
        s3_audio_key: fileKey, 
        note_format: noteFormat,
        duration_minutes: estimatedDurationMinutes,
        credits_consumed: 1,
        uploaded_at: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (videoError) {
      console.error('Error creating video record:', videoError);
      // TODO: Clean up S3 object if video record creation fails
      return NextResponse.json({ status: 'error', message: 'Failed to create video record' }, { status: 500 });
    }

    const newVideoId = videoData.id; // Get the ID of the newly created video

    // Consume user credits
    try {
      const creditsConsumed = await SubscriptionService.consumeCredits(user.id, 1);
      if (!creditsConsumed) {
        console.error('Failed to consume credits after successful upload');
        // In production, you might want to delete the video record and S3 file here
      }
    } catch (creditsError) {
      console.error('Error consuming credits:', creditsError);
      // Don't fail the upload if credits consumption fails
    }

    // Update usage statistics
    try {
      await SubscriptionService.updateUsage(user.id, {
        uploadMinutes: estimatedDurationMinutes,
        transcriptionsCount: 1
      });
    } catch (usageError) {
      console.error('Error updating usage statistics:', usageError);
      // Don't fail the upload if usage update fails
    }

    console.log(`Attempting to trigger Lambda function: ${transcriptionLambdaFunctionName}`); // Added logging
    // Trigger the transcription Lambda function
    const invokeCommand = new InvokeCommand({
      FunctionName: transcriptionLambdaFunctionName,
      InvocationType: 'Event', // Use 'Event' for asynchronous invocation
      Payload: JSON.stringify({ s3Key: fileKey, bucketName: s3BucketName, videoId: newVideoId, userId: user.id, noteFormat: noteFormat }), // Pass necessary info to Lambda including note format
    });

    try {
      await lambdaClient.send(invokeCommand);
      console.log(`Transcription Lambda function triggered for S3 key: ${fileKey}`); // Added logging
    } catch (lambdaError) {
      console.error('Lambda invocation failed:', lambdaError);
      // Don't fail the entire upload if Lambda fails - the file is already uploaded
      console.warn('Continuing with upload despite Lambda failure - file is uploaded to S3');
    }

    // Include the newVideoId in the successful response
    return NextResponse.json({ status: 'processing', fileKey, mediaId: newVideoId });

  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to handle file upload' }, { status: 500 });
  }
}
