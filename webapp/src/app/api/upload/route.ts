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
    const videoId = formData.get('videoId') as string; // Assuming videoId is sent with the key 'videoId'
    const lessonId = formData.get('lessonId') as string; // Assuming lessonId is sent with the key 'lessonId'

    if (!file) {
      return NextResponse.json({ status: 'error', message: 'No file uploaded' }, { status: 400 });
    }

    if (!lessonId) {
       return NextResponse.json({ status: 'error', message: 'lessonId is required for now' }, { status: 400 });
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
      .insert([{ lesson_id: lessonId, url: fileKey, transcription_status: 'pending', s3_audio_key: fileKey }]) // Save initial status and S3 key
      .select('id') // Select the ID of the newly created video
      .single();

    if (videoError) {
      console.error('Error creating video record:', videoError);
      // TODO: Clean up S3 object if video record creation fails
      return NextResponse.json({ status: 'error', message: 'Failed to create video record' }, { status: 500 });
    }

    const newVideoId = videoData.id; // Get the ID of the newly created video

    // Trigger the transcription Lambda function
    const invokeCommand = new InvokeCommand({
      FunctionName: transcriptionLambdaFunctionName,
      InvocationType: 'Event', // Use 'Event' for asynchronous invocation
      Payload: JSON.stringify({ s3Key: fileKey, bucketName: s3BucketName, videoId: newVideoId, userId: user.id }), // Pass necessary info to Lambda
    });

    await lambdaClient.send(invokeCommand);
    console.log(`Transcription Lambda function triggered for S3 key: ${fileKey}`);

    return NextResponse.json({ status: 'processing', fileKey });

  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json({ status: 'error', message: 'Failed to handle file upload' }, { status: 500 });
  }
}
