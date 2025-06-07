"use client";

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Upload, FileText, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useAuth } from '@/contexts/AuthContext'
import { UPLOAD_LIMITS, UPLOAD_ERROR_MESSAGES } from "@/lib/constants"

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const auth = useAuth();
  const router = useRouter()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // File size validation using shared constants
    if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      setUploadError(UPLOAD_ERROR_MESSAGES.FILE_TOO_LARGE(fileSizeMB, UPLOAD_LIMITS.MAX_FILE_SIZE_MB));
      return;
    }

    setFile(file)
    setUploadProgress(0);
    setUploadComplete(false);
    setIsProcessing(false);
    setUploadError(null);
    setUploadStatus('');
  }

  const handleUpload = async () => {
    if (!file) return;

    setUploadProgress(0);
    setUploadComplete(false);
    setIsProcessing(true);
    setUploadError(null);
    setUploadStatus('Preparing upload...');

    try {
      // Step 1: Get presigned URL for direct S3 upload
      setUploadStatus('Uploading...');
      const uploadUrlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }),
      });

      if (!uploadUrlResponse.ok) {
        let errorMessage = 'Failed to prepare upload';
        try {
          const errorData = await uploadUrlResponse.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          errorMessage = `Upload preparation failed: ${uploadUrlResponse.status} ${uploadUrlResponse.statusText}`;
          console.error('Failed to parse upload URL error response as JSON:', jsonError);
        }
        throw new Error(errorMessage);
      }

      let uploadUrlData;
      try {
        uploadUrlData = await uploadUrlResponse.json();
      } catch (jsonError) {
        console.error('Failed to parse upload URL response as JSON:', jsonError);
        throw new Error('Failed to prepare upload. Please try again.');
      }

      setUploadProgress(10); // URL obtained

      // Step 2: Upload directly to S3 using presigned URL with progress tracking
      const s3Response = await fetch(uploadUrlData.uploadUrl, {
        method: 'PUT',
        body: file
      });

      if (!s3Response.ok) {
        throw new Error(`S3 upload failed: ${s3Response.status} ${s3Response.statusText}`);
      }

      setUploadProgress(80); // S3 upload complete
      setUploadStatus('Preparing transcription processing...');

      // Step 3: Notify server that upload is complete and start processing
      const completeResponse = await fetch('/api/upload-complete', {
        method: 'POST',
        body: JSON.stringify({
          mediaId: uploadUrlData.mediaId,
          fileKey: uploadUrlData.fileKey
        }),
      });

      if (!completeResponse.ok) {
        let errorMessage = 'Upload completed but failed to start processing';
        try {
          const errorData = await completeResponse.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          errorMessage = `Processing start failed: ${completeResponse.status} ${completeResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      let completeData;
      try {
        completeData = await completeResponse.json();
      } catch (jsonError) {
        console.error('Failed to parse completion response as JSON:', jsonError);
        throw new Error('Upload completed but received invalid response. Please check your uploads.');
      }

      setUploadProgress(100);
      setUploadComplete(true);
      setUploadStatus('Upload successful! Redirecting...');
      
      // Redirect to analysis page
      setTimeout(() => {
        router.push(`/dashboard/analysis/${uploadUrlData.mediaId}`);
      }, 1500);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Upload failed. Please try again.');
      setIsProcessing(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error: any) {
      console.error('Error signing out:', error.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EdNoteAI</span>
            <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
              BETA
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard/library" className="text-sm font-medium hover:text-primary">
              Library
            </Link>
            <Link href="/dashboard/account" className="text-sm font-medium hover:text-primary">
              Account
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold">Upload Media</h1>
              <p className="mt-2 text-muted-foreground">
                Upload your audio or video file to generate AI-powered academic notes
              </p>
            </div>

            <div
              className={`relative mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center ${
                uploadError 
                  ? "border-red-300 bg-red-50/50" 
                  : dragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input type="file" id="file-upload" className="hidden" onChange={handleChange} accept={UPLOAD_LIMITS.ACCEPTED_TYPES} />

              {/* Error display area - always visible */}
              {uploadError && (
                <div className="mb-4 w-full max-w-md">
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-red-800 text-sm font-medium">
                          Upload Error
                        </p>
                        <p className="text-red-700 text-sm mt-1">
                          {uploadError}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
                          onClick={() => {
                            setUploadError(null);
                            setUploadStatus('');
                            setFile(null);
                          }}
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!file ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Drag and drop your file here</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Support for audio and video files (MP3, MP4, WAV, etc.)
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Maximum file size: {UPLOAD_LIMITS.MAX_FILE_SIZE_MB} MB
                    </p>
                  </div>
                  <Button onClick={() => document.getElementById("file-upload")?.click()} className="mt-4">
                    Select File
                  </Button>
                </div>
              ) : (
                <div className="w-full max-w-md space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{file.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {uploadComplete 
                          ? "Upload complete" 
                          : isProcessing 
                            ? uploadStatus || "Processing..." 
                            : "Ready to upload"}
                      </span>
                      <span>{uploadComplete ? "100%" : `${uploadProgress}%`}</span>
                    </div>
                    <Progress value={isProcessing ? (uploadComplete ? 100 : uploadProgress) : 0} className="h-2 w-full" />
                  </div>

                  {!uploadComplete && !isProcessing && (
                    <div className="flex items-center justify-between gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFile(null)
                          setUploadProgress(0)
                          setUploadComplete(false)
                          setIsProcessing(false)
                          setUploadError(null)
                          setUploadStatus('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUpload} disabled={isProcessing}>Upload File</Button>
                    </div>
                  )}

                  {isProcessing && !uploadComplete && (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <div>
                        <p className="font-medium">Processing your file...</p>
                        <p className="text-sm text-muted-foreground">
                          This may take a few moments depending on the file size.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>
                By uploading, you agree to our{" "}
                <Link href="/terms" className="font-medium text-primary hover:underline">
                  Terms of Service
                </Link>
                ,{" "}
                <Link href="/privacy" className="font-medium text-primary hover:underline">
                  Privacy Policy
                </Link>
                , and{" "}
                <Link href="/cookies" className="font-medium text-primary hover:underline">
                  Cookies Policy
                </Link>
                . Need help?{" "}
                <Link href="/contact" className="font-medium text-primary hover:underline">
                  Contact us
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}