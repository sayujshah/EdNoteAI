'use client';

import { useState, useEffect } from 'react';
import { UPLOAD_LIMITS, UPLOAD_ERROR_MESSAGES } from '@/lib/constants';
import type { UserPlanLimits } from '@/lib/types/subscription';

interface FileUploadProps {
  // No lessonId
}

export default function FileUpload({}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [planLimits, setPlanLimits] = useState<UserPlanLimits | null>(null);
  const [durationExceeded, setDurationExceeded] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);

  useEffect(() => {
    // Fetch user plan limits on mount
    const fetchPlanLimits = async () => {
      try {
        const res = await fetch('/api/subscription/status', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPlanLimits(data.limits);
        }
      } catch (err) {
        // Ignore for now
      }
    };
    fetchPlanLimits();
  }, []);

  useEffect(() => {
    if (selectedFile && planLimits) {
      // Estimate duration: 1MB ≈ 1 minute
      const fileSizeMB = selectedFile.size / (1024 * 1024);
      const duration = Math.ceil(fileSizeMB);
      setEstimatedDuration(duration);
      setDurationExceeded(duration > planLimits.max_upload_duration_minutes);
    } else {
      setEstimatedDuration(null);
      setDurationExceeded(false);
    }
  }, [selectedFile, planLimits]);

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

    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('file', selectedFile);

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

  // Determine if user is out of credits (for non-unlimited plans)
  const outOfCredits = !!planLimits && planLimits.monthly_credits !== -1 && planLimits.credits_remaining <= 0;

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
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => {
            setSelectedFile(null);
            setUploadError(null);
            setUploadSuccess(false);
            setEstimatedDuration(null);
            setDurationExceeded(false);
          }}
          disabled={uploading}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || uploading || durationExceeded || outOfCredits}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
      {durationExceeded && planLimits && (
        <div className="mt-2 text-sm text-red-600 text-center">
          {planLimits.plan_name === 'Free' && (
            <>Video exceeds plan limits (max duration 10 minutes). <span className="underline cursor-pointer text-red-700 font-semibold">Upgrade now to upload longer videos!</span></>
          )}
          {planLimits.plan_name === 'Student' && (
            <>Video exceeds plan limits (max duration 2 hours). <span className="underline cursor-pointer text-red-700 font-semibold">Upgrade now to upload longer videos!</span></>
          )}
          {planLimits.plan_name === 'Professional' && (
            <>Video exceeds plan limits (max duration 8 hours).</>
          )}
        </div>
      )}
      {outOfCredits && planLimits && (
        <div className="mt-2 text-sm text-red-600 text-center">
          You have used all your uploads for this month. Upgrade to increase your limit.
        </div>
      )}
      {selectedFile && <p className="mt-2 text-sm">Selected file: {selectedFile.name}</p>}
      {uploadSuccess && <p className="mt-2 text-green-500">File uploaded successfully! Transcription is processing.</p>}
      {uploadError && <p className="mt-2 text-red-500">Upload failed: {uploadError}</p>}

      {/* TODO: Add progress indicator */}
    </div>
  );
}