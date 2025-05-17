'use client';

import { useState } from 'react';

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
      setSelectedFile(event.target.files[0]);
      setUploadError(null); // Clear previous errors
      setUploadSuccess(false); // Reset success message
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
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
      />
      <button
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
