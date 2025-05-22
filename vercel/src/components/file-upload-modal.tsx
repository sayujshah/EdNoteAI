"use client"

import type React from "react"

import { useState, useRef } from "react"
import { X, Upload, FileText, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export function FileUploadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleButtonClick = () => {
    // Redirect to the login page instead of opening the file picker
    window.location.href = "/login"
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
          {!file ? (
            <div
              className={`relative mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center ${
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input ref={inputRef} type="file" className="hidden" onChange={handleChange} accept="audio/*,video/*" />

              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="mb-1 font-medium">Drag and drop your file here</p>
                  <p className="text-sm text-muted-foreground">
                    Support for audio and video files (MP3, MP4, WAV, etc.)
                  </p>
                </div>
                <Button onClick={handleButtonClick} className="mt-2">
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
                      <span>Uploading{uploadComplete ? " complete" : "..."}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2 w-full" />
                  </div>

                  {uploadComplete && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                      <Check className="h-4 w-4" />
                      <span>Upload complete! Processing your file...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null)
                    setUploadProgress(0)
                    setUploadComplete(false)
                  }}
                >
                  Cancel
                </Button>
                {uploadComplete && <Button size="sm">View Results</Button>}
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-muted-foreground">
            <p>By uploading, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </div>
  )
}