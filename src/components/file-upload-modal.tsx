"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { X, Upload, FileText, Check, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { UPLOAD_LIMITS, UPLOAD_ERROR_MESSAGES } from "@/lib/constants"

export function FileUploadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  if (!isOpen) return null

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
      setUploadStatus('Preparing upload...');
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
      setUploadStatus('Uploading...');
      
      const s3Response = await fetch(uploadUrlData.uploadUrl, {
        method: 'PUT',
        body: file
      });

      if (!s3Response.ok) {
        throw new Error(`Upload failed: ${s3Response.status} ${s3Response.statusText}`);
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
      
      // Redirect to analysis page and close modal
      setTimeout(() => {
        onClose();
        router.push(`/dashboard/analysis/${uploadUrlData.mediaId}`);
      }, 1500);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Upload failed. Please try again or contact support.');
      setIsProcessing(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleButtonClick = () => {
    // Trigger the hidden file input
    inputRef.current?.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="z-10 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Upload Your File</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="mt-4">
          {/* Error display */}
          {uploadError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 text-sm font-medium">Upload Error</p>
                  <p className="text-red-700 text-sm mt-1">{uploadError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
                    onClick={() => {
                      setUploadError(null);
                      setUploadStatus('');
                      setFile(null);
                      setUploadProgress(0);
                      setUploadComplete(false);
                      setIsProcessing(false);
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!file ? (
            <div
              className={`relative mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center ${
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
              <input ref={inputRef} type="file" className="hidden" onChange={handleChange} accept={UPLOAD_LIMITS.ACCEPTED_TYPES} />

              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="mb-1 font-medium">Drag and drop your file here</p>
                  <p className="text-sm text-muted-foreground">
                    Support for audio and video files (MP3, MP4, WAV, etc.)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum file size: {UPLOAD_LIMITS.MAX_FILE_SIZE_MB} MB
                  </p>
                </div>
                <Button onClick={handleButtonClick} className="mt-2" disabled={isProcessing}>
                  Select File
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

                  <div className="mt-4 space-y-2">
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

                  {uploadComplete && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                      <Check className="h-4 w-4" />
                      <span>Upload complete! Redirecting to analysis...</span>
                    </div>
                  )}

                  {isProcessing && !uploadComplete}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                {!uploadComplete && !isProcessing && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFile(null)
                        setUploadProgress(0)
                        setUploadComplete(false)
                        setUploadError(null)
                        setUploadStatus('')
                        setIsProcessing(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleUpload} disabled={isProcessing}>
                      Upload File
                    </Button>
                  </>
                )}
                {isProcessing && !uploadComplete && (
                  <Button variant="outline" size="sm" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-muted-foreground">
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
    </div>
  )
}