import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../../lib/supabase';

// Configure AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const s3BucketName = process.env.AWS_S3_BUCKET_NAME!;

// Configure AWS Lambda client
const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION!, // Use the same region as S3
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const transcriptionLambdaFunctionName = process.env.AWS_TRANSCRIPTION_LAMBDA_FUNCTION_NAME!;

export async function POST(request: Request) {
  console.log('Received transcription request');
  const audioStream = request.body;

  if (!audioStream) {
    return NextResponse.json({ status: 'error', message: 'No audio stream received' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  const userId = searchParams.get('userId');

  if (!videoId || !userId) {
    return NextResponse.json({ status: 'error', message: 'Missing videoId or userId' }, { status: 400 });
  }

  const fileKey = `audio/${uuidv4()}.webm`; // Generate a unique file key

  try {
    const uploadCommand = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: fileKey,
      Body: audioStream as any, // Type assertion might be needed depending on stream type
    });

    await s3Client.send(uploadCommand);
    console.log(`Audio stream uploaded to S3: ${fileKey}`);

    // Trigger the transcription Lambda function
    const invokeCommand = new InvokeCommand({
      FunctionName: transcriptionLambdaFunctionName,
      InvocationType: 'Event', // Use 'Event' for asynchronous invocation
      Payload: JSON.stringify({ s3Key: fileKey, bucketName: s3BucketName, videoId: videoId }),
    });

    await lambdaClient.send(invokeCommand);
    console.log(`Transcription Lambda function triggered for S3 key: ${fileKey}`);

    // Save initial transcription request status to Supabase
    const { data, error } = await supabase
      .from('videos')
      .update({ transcription_status: 'in_progress', s3_audio_key: fileKey })
      .eq('id', videoId); // Assuming videoId is available

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
