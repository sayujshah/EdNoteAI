import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import createClient from '../../../lib/supabase/server';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import { UPLOAD_LIMITS } from '@/lib/constants';

export async function POST(request: Request) {
  console.log('=== DEBUG: Environment variables check ===');
  
  // Validate required environment variables first
  const requiredEnvVars = {
    REGION_AWS: process.env.REGION_AWS,
    ACCESS_KEY_ID_AWS: process.env.ACCESS_KEY_ID_AWS,
    SECRET_ACCESS_KEY_AWS: process.env.SECRET_ACCESS_KEY_AWS,
    S3_BUCKET_NAME_AWS: process.env.S3_BUCKET_NAME_AWS,
  };

  // Log which variables are present/missing (without exposing values)
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    console.log(`${key}: ${value ? 'SET ✓' : 'MISSING ✗'}`);
    if (value) {
      console.log(`${key} length: ${value.length}`);
      if (key === 'REGION_AWS' || key === 'S3_BUCKET_NAME_AWS') {
        console.log(`${key} value: ${value}`); // Safe to log these
      }
    }
  });

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    console.error('NODE_ENV:', process.env.NODE_ENV);
    console.error('Available env vars starting with REGION:', Object.keys(process.env).filter(k => k.includes('REGION')));
    console.error('Available env vars starting with ACCESS:', Object.keys(process.env).filter(k => k.includes('ACCESS')));
    console.error('Available env vars starting with SECRET:', Object.keys(process.env).filter(k => k.includes('SECRET')));
    console.error('Available env vars starting with S3:', Object.keys(process.env).filter(k => k.includes('S3')));
    
    return NextResponse.json({ 
      status: 'error', 
      message: 'Server configuration error. Please contact support.',
      code: 'CONFIG_ERROR',
      debug: {
        missingVars,
        nodeEnv: process.env.NODE_ENV,
        availableAwsVars: Object.keys(process.env).filter(k => k.includes('AWS') || k.includes('REGION') || k.includes('S3'))
      }
    }, { status: 500 });
  }

  console.log('=== Environment variables check passed ===');

  // Configure AWS S3 client after environment validation
  const s3Client = new S3Client({
    region: process.env.REGION_AWS!,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID_AWS!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY_AWS!,
    },
  });

  const s3BucketName = process.env.S3_BUCKET_NAME_AWS!;

  // Get authenticated user
  let supabaseServer;
  let user;
  
  try {
    supabaseServer = await createClient();
    const { data: { user: authUser } } = await supabaseServer.auth.getUser();
    user = authUser;
    console.log('User authentication:', user ? 'SUCCESS ✓' : 'FAILED ✗');
  } catch (authError) {
    console.error('Authentication error:', authError);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fileName, fileSize, fileType, lessonId } = await request.json();

    if (!fileName || !fileSize || !fileType) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Missing required file information' 
      }, { status: 400 });
    }

    // Validate file size
    if (fileSize > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
      return NextResponse.json({ 
        status: 'error', 
        message: `File size (${fileSizeMB} MB) exceeds the maximum limit of ${UPLOAD_LIMITS.MAX_FILE_SIZE_MB} MB.`
      }, { status: 413 });
    }

    // Get estimated duration for validation (rough approximation)
    const estimatedDurationMinutes = Math.ceil(fileSize / (1024 * 1024));

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

    // Generate unique S3 key
    const fileExtension = fileName.split('.').pop();
    const fileKey = `uploads/${uuidv4()}.${fileExtension}`;

    // Generate presigned URL for direct upload
    const command = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry

    // Create video record in database (status: uploading)
    const { data: videoData, error: videoError } = await supabaseServer
      .from('videos')
      .insert([{ 
        user_id: user.id,
        lesson_id: lessonId, 
        file_url: fileKey, 
        transcription_status: 'pending',
        s3_audio_key: fileKey, 
        note_format: 'Markdown',
        duration_minutes: estimatedDurationMinutes,
        credits_consumed: 1,
        uploaded_at: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (videoError) {
      console.error('Error creating video record:', videoError);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Failed to create video record' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      status: 'success',
      uploadUrl,
      fileKey,
      mediaId: videoData.id
    });

  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to generate upload URL' 
    }, { status: 500 });
  }
} 