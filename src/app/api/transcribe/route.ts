import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { v4 as uuidv4 } from 'uuid';
// import { supabase } from '../../lib/supabase'; // Client-side client (might not be needed in API route)
import createClient from '../../../lib/supabase/server'; // Import server-side client

// Configure AWS S3 client
const s3Client = new S3Client({ region: process.env.REGION_AWS! });

const s3BucketName = process.env.S3_BUCKET_NAME_AWS!;

// Configure AWS Lambda client
const lambdaClient = new LambdaClient({ region: process.env.REGION_AWS! });

const transcriptionLambdaFunctionName = process.env.TRANSCRIPTION_LAMBDA_FUNCTION_NAME_AWS!;

export async function POST(request: Request) {
  // Get authenticated user
  const supabaseServer = await createClient(); // Add await
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  console.log('Received transcription request for user:', user.id);

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  // const userId = searchParams.get('userId'); // No longer needed from query params

  if (!videoId) { // userId is now from auth
    return NextResponse.json({ status: 'error', message: 'Missing videoId' }, { status: 400 });
  }

  const audioStream = request.body;

  if (!audioStream) {
    return NextResponse.json({ status: 'error', message: 'No audio stream received' }, { status: 400 });
  }

  const fileKey = `audio/${uuidv4()}.webm`; // Generate a unique file key

  try {
    const uploadCommand = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: fileKey,
      Body: audioStream as any, // TODO: Find a more specific type for audioStream if possible
    });

    await s3Client.send(uploadCommand);
    console.log(`Audio stream uploaded to S3: ${fileKey}`);

    // Trigger the transcription Lambda function
    const invokeCommand = new InvokeCommand({
      FunctionName: transcriptionLambdaFunctionName,
      InvocationType: 'Event', // Use 'Event' for asynchronous invocation
      Payload: JSON.stringify({ s3Key: fileKey, bucketName: s3BucketName, videoId: videoId, userId: user.id }), // Pass actual userId
    });

    await lambdaClient.send(invokeCommand);
    console.log(`Transcription Lambda function triggered for S3 key: ${fileKey}`);

    // Save initial transcription request status to Supabase
    // Save initial transcription request status to Supabase
    const { error } = await supabaseServer
      .from('videos')
      .update({ transcription_status: 'in_progress', s3_audio_key: fileKey })
      .eq('id', videoId)
      .eq('user_id', user.id); // Ensure video belongs to the user

    if (error) {
      console.error('Error saving transcription status to Supabase:', error);
      // Depending on error severity, might need to clean up S3 object
      return NextResponse.json({ status: 'error', message: 'Failed to save transcription status' }, { status: 500 });
    }

    console.log(`Transcription status updated in Supabase for video ${videoId}`);

  } catch (error) {
    console.error('Error processing transcription request:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to process transcription request' }, { status: 500 });
  }

  return NextResponse.json({ status: 'processing', fileKey });
}
