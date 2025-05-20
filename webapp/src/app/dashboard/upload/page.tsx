"use client";

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Upload, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
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
    setFile(file)
    simulateUpload()
  }

  const simulateUpload = () => {
    setUploadProgress(0)
    setUploadComplete(false)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploadComplete(true)
          return 100
        }
        return prev + 5
      })
    }, 150)
  }

  const processFile = () => {
    setIsProcessing(true)
    // Simulate processing time
    setTimeout(() => {
      // Redirect to the analysis page with the file ID
      // In a real app, you would get this ID from your backend
      const fileId = "demo123"
      router.push(`/dashboard/analysis/${fileId}`)
    }, 2000)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EdNoteAI</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
              Dashboard
            </Link>
            <Link href="/dashboard/library" className="text-sm font-medium hover:text-primary">
              Library
            </Link>
            <Button variant="ghost" size="sm">
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-12">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold">Upload Media</h1>
              <p className="mt-2 text-muted-foreground">
                Upload your audio or video file to generate AI-powered academic notes
              </p>
            </div>

            <div
              className={`relative mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center ${
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input type="file" id="file-upload" className="hidden" onChange={handleChange} accept="audio/*,video/*" />

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
                      <span>{uploadComplete ? "Upload complete" : "Uploading..."}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2 w-full" />
                  </div>

                  {uploadComplete && !isProcessing && (
                    <div className="flex items-center justify-between gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFile(null)
                          setUploadProgress(0)
                          setUploadComplete(false)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={processFile}>Process File</Button>
                    </div>
                  )}

                  {isProcessing && (
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
                <Link href="#" className="font-medium text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="font-medium text-primary hover:underline">
                  Privacy Policy
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
