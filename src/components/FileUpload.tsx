'use client';

import { useState } from 'react';
import { UPLOAD_LIMITS, UPLOAD_ERROR_MESSAGES } from '@/lib/constants';

interface FileUploadProps {
  onUploadSuccess?: (mediaId: string) => void; // Optional callback for successful upload
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleUpload = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL for direct S3 upload
      const uploadUrlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type
        }),
      });

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse.json();
        throw new Error(errorData.message || 'Failed to prepare upload');
      }

      const uploadUrlData = await uploadUrlResponse.json();
      setUploadProgress(10);

      // Step 2: Upload directly to S3
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 70) + 10;
          setUploadProgress(percentComplete);
        }
      });

      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
      });

      xhr.open('PUT', uploadUrlData.uploadUrl);
      xhr.setRequestHeader('Content-Type', selectedFile.type);
      xhr.send(selectedFile);

      await uploadPromise;
      setUploadProgress(80);

      // Step 3: Complete upload and start processing
      const completeResponse = await fetch('/api/upload-complete', {
        method: 'POST',
        body: JSON.stringify({
          mediaId: uploadUrlData.mediaId,
          fileKey: uploadUrlData.fileKey
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.message || 'Failed to start processing');
      }

      setUploadProgress(100);
      setUploadSuccess(true);
      setSelectedFile(null);
      
      if (onUploadSuccess) {
        onUploadSuccess(uploadUrlData.mediaId);
      }

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
        accept="audio/*,video/*"
      />
      <p className="text-xs text-gray-500 mb-2">
        Supported formats: Audio and Video files. Maximum file size: {UPLOAD_LIMITS.MAX_FILE_SIZE_MB} MB
      </p>
      {uploading && (
        <div className="mb-2">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">{uploadProgress}%</p>
        </div>
      )}
      <button
        type="button"
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload File'}
      </button>

      {selectedFile && <p className="mt-2 text-sm">Selected file: {selectedFile.name}</p>}
      {uploadSuccess && <p className="mt-2 text-green-500">File uploaded successfully! Processing started.</p>}
      {uploadError && <p className="mt-2 text-red-500">Upload failed: {uploadError}</p>}
    </div>
  );
}
