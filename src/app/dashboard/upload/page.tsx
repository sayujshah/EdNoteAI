"use client";

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Upload, FileText, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Import Select components
import { Input } from "@/components/ui/input" // Import Input component
import { useAuth } from '@/contexts/AuthContext'
import { UPLOAD_LIMITS, UPLOAD_ERROR_MESSAGES } from "@/lib/constants"

// Define a type for lessons
interface Lesson {
  id: string;
  title: string;
  // Add other lesson properties if needed
}

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>(''); // Add upload status message
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [lessonsError, setLessonsError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null); // State for selected lesson ID
  const [newLessonTitle, setNewLessonTitle] = useState(""); // State for new lesson title
  const [isCreatingNewLesson, setIsCreatingNewLesson] = useState(false); // State to toggle between selecting/creating lesson
  const [creatingLesson, setCreatingLesson] = useState(false); // State for creating lesson process
  const [createLessonError, setCreateLessonError] = useState<string | null>(null); // State for create lesson error

  const auth = useAuth();
  const router = useRouter()

  // Fetch lessons on component mount
  useEffect(() => {
    const fetchLessons = async () => {
      setLoadingLessons(true);
      setLessonsError(null);
      try {
        const response = await fetch('/api/lessons');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch lessons');
        }
        const data: Lesson[] = await response.json();
        setLessons(data);
        if (data.length > 0) {
          setSelectedLessonId(data[0].id); // Select the first lesson by default
        }
      } catch (error: any) {
        setLessonsError(error.message);
        console.error('Error fetching lessons:', error);
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchLessons();
  }, []);


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
    setCreateLessonError(null); // Clear create lesson error on new file selection
  }

  const handleCreateLesson = async () => {
    if (!newLessonTitle.trim()) {
      setCreateLessonError("Lesson title cannot be empty.");
      return;
    }

    setCreatingLesson(true);
    setCreateLessonError(null);

    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newLessonTitle }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create lesson');
      }

      const newLesson: Lesson = await response.json();
      setLessons([...lessons, newLesson]); // Add new lesson to the list
      setSelectedLessonId(newLesson.id); // Select the newly created lesson
      setIsCreatingNewLesson(false); // Switch back to selection mode
      setNewLessonTitle(""); // Clear new lesson title input

    } catch (error: any) {
      setCreateLessonError(error.message);
      console.error('Error creating lesson:', error);
    } finally {
      setCreatingLesson(false);
    }
  };


  const handleUpload = async () => {
    if (!file) return;

    const lessonIdToUse = selectedLessonId;

    // If creating a new lesson, create it first
    if (isCreatingNewLesson && newLessonTitle.trim()) {
       // This case should ideally be handled by clicking a separate "Create Lesson" button first
       // For simplicity here, we'll assume the user clicks "Upload File" after typing a new lesson name
       // A better UX would be to create the lesson first, then allow upload.
       // For now, we'll prevent upload if a new lesson title is entered but not created.
       setUploadError("Please create the new lesson first.");
       return;
    }

    if (!lessonIdToUse) {
        setUploadError("Please select a lesson or create a new one.");
        return;
    }

    setUploadProgress(0);
    setUploadComplete(false);
    setIsProcessing(true);
    setUploadError(null);
    setUploadStatus('Preparing upload...');

    try {
      // Step 1: Get presigned URL for direct S3 upload
      setUploadStatus('Getting upload URL...');
      const uploadUrlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          lessonId: lessonIdToUse
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

      // Step 2: Upload directly to S3 using presigned URL
      setUploadStatus('Uploading file to cloud storage...');
      const s3Response = await fetch(uploadUrlData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
        // Add progress tracking if needed
      });

      if (!s3Response.ok) {
        throw new Error(`S3 upload failed: ${s3Response.status} ${s3Response.statusText}`);
      }

      setUploadProgress(80); // S3 upload complete
      setUploadStatus('Starting transcription processing...');

      // Step 3: Notify server that upload is complete and start processing
      const completeResponse = await fetch('/api/upload-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          errorMessage = `Processing failed: ${completeResponse.status} ${completeResponse.statusText}`;
          console.error('Failed to parse completion response as JSON:', jsonError);
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
      setUploadStatus('Upload complete! Redirecting...');
      
      // Redirect to analysis page
      router.push(`/dashboard/analysis/${uploadUrlData.mediaId}`);

    } catch (error: any) {
      setUploadError(error.message);
      setUploadStatus('');
      console.error('Upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EdNoteAI</span>
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

                  {/* Lesson Selection/Creation UI */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select or Create Lesson</label>
                    {loadingLessons ? (
                      <p>Loading lessons...</p>
                    ) : lessonsError ? (
                      <p className="text-red-500">Error loading lessons: {lessonsError}</p>
                    ) : (
                      <>
                        {!isCreatingNewLesson ? (
                          <div className="flex items-center gap-2">
                            <Select onValueChange={setSelectedLessonId} value={selectedLessonId || ""}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select a lesson" />
                              </SelectTrigger>
                              <SelectContent>
                                {lessons.map((lesson) => (
                                  <SelectItem key={lesson.id} value={lesson.id}>
                                    {lesson.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={() => setIsCreatingNewLesson(true)}>
                              New Lesson
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="New Lesson Title"
                              value={newLessonTitle}
                              onChange={(e) => setNewLessonTitle(e.target.value)}
                              disabled={creatingLesson}
                            />
                            <Button onClick={handleCreateLesson} disabled={creatingLesson || !newLessonTitle.trim()}>
                              {creatingLesson ? "Creating..." : "Create"}
                            </Button>
                            <Button variant="outline" onClick={() => {
                                setIsCreatingNewLesson(false);
                                setNewLessonTitle("");
                                setCreateLessonError(null);
                                // Select the first lesson if available when switching back
                                if (lessons.length > 0) {
                                    setSelectedLessonId(lessons[0].id);
                                } else {
                                    setSelectedLessonId(null);
                                }
                            }}>
                                Cancel
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                    {createLessonError && <p className="text-red-500 text-sm">{createLessonError}</p>}
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
                          setCreateLessonError(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUpload} disabled={isProcessing || (!selectedLessonId && !isCreatingNewLesson) || (isCreatingNewLesson && !newLessonTitle.trim())}>Upload File</Button>
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
                .
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
