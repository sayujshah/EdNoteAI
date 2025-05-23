import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { v4 as uuidv4 } from 'uuid';
import createClient from '../../../lib/supabase/server'; // Import server-side client

// Configure AWS S3 client (same as transcribe route)
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const s3BucketName = process.env.AWS_S3_BUCKET_NAME!;

// Configure AWS Lambda client (same as transcribe route)
const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION!, // Use the same region as S3
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const transcriptionLambdaFunctionName = process.env.AWS_TRANSCRIPTION_LAMBDA_FUNCTION_NAME!;

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

    if (!lessonId) {
       return NextResponse.json({ status: 'error', message: 'lessonId is required for now' }, { status: 400 });
    }

    // Validate note format
    if (noteFormat !== 'Markdown' && noteFormat !== 'LaTeX') {
      return NextResponse.json({ status: 'error', message: 'Invalid note format. Must be "Markdown" or "LaTeX"' }, { status: 400 });
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

    // Create a new video record in Supabase
    const { data: videoData, error: videoError } = await supabaseServer
      .from('videos')
      .insert([{ lesson_id: lessonId, file_url: fileKey, transcription_status: 'pending', s3_audio_key: fileKey, note_format: noteFormat }]) // Save S3 key as file_url and note format
      .select('id') // Select the ID of the newly created video
      .single();

    if (videoError) {
      console.error('Error creating video record:', videoError);
      // TODO: Clean up S3 object if video record creation fails
      return NextResponse.json({ status: 'error', message: 'Failed to create video record' }, { status: 500 });
    }

    const newVideoId = videoData.id; // Get the ID of the newly created video

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
