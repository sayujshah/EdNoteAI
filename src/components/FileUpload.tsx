'use client';

import { useState } from 'react';
import { UPLOAD_LIMITS, UPLOAD_ERROR_MESSAGES } from '@/lib/constants';

interface FileUploadProps {
  lessonId: string; // Require lessonId to associate the uploaded video
  // TODO: Add option to create a new lesson during upload
}

export default function FileUpload({ lessonId }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // File size validation using shared constants
      if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        setUploadError(UPLOAD_ERROR_MESSAGES.FILE_TOO_LARGE(fileSizeMB, UPLOAD_LIMITS.MAX_FILE_SIZE_MB));
        setSelectedFile(null);
        setUploadSuccess(false);
        return;
      }
      
      setSelectedFile(file);
      setUploadError(null); // Clear previous errors
      setUploadSuccess(false); // Reset success message
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async (event: React.MouseEvent<HTMLButtonElement>) => { // Accept event
    event.preventDefault(); // Prevent default button behavior (page refresh)

    if (!selectedFile || !lessonId) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('lessonId', lessonId); // Pass lessonId with the file

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'File upload failed');
      }

      setUploadSuccess(true);
      setSelectedFile(null); // Clear selected file after successful upload
      // TODO: Provide feedback to the user about transcription status (e.g., redirect to video page or show status)

    } catch (error: any) {
      setUploadError(error.message);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border rounded p-4 mb-4">
      <h3 className="text-lg font-bold mb-2">Upload Audio/Video File</h3>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        className="mb-2"
        accept={UPLOAD_LIMITS.ACCEPTED_TYPES}
      />
      <p className="text-xs text-gray-500 mb-2">
        Supported formats: {UPLOAD_LIMITS.SUPPORTED_FORMATS.join(', ')}. Maximum file size: {UPLOAD_LIMITS.MAX_FILE_SIZE_MB} MB
      </p>
      <button
        type="button" // Explicitly set type to button to prevent form submission
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload File'}
      </button>

      {selectedFile && <p className="mt-2 text-sm">Selected file: {selectedFile.name}</p>}
      {uploadSuccess && <p className="mt-2 text-green-500">File uploaded successfully! Transcription is processing.</p>}
      {uploadError && <p className="mt-2 text-red-500">Upload failed: {uploadError}</p>}

      {/* TODO: Add progress indicator */}
    </div>
  );
}
