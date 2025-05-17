'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Import useParams to get route parameters
import AuthGuard from '../../../components/AuthGuard'; // Import AuthGuard - Adjust path

interface VideoData {
  id: string;
  lesson_id: string;
  url: string;
  transcription_status: string;
  created_at: string;
  transcripts: {
    id: string;
    video_id: string;
    content: string;
    segmented_content: any; // Use a more specific type later
    created_at: string;
  } | null; // Transcript might not be available yet
}

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.videoId as string; // Get videoId from route parameters

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch video and transcript data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/videos/${videoId}`); // Fetch data from the new API route
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch video data');
      }
      const data: VideoData = await response.json();
      setVideoData(data);
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching video data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when videoId changes
  useEffect(() => {
    if (videoId) {
      fetchData();
    }
  }, [videoId]); // Rerun effect when videoId changes

  if (loading) return <p>Loading video data...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!videoData) return <p>Video not found.</p>;

  return (
    <AuthGuard> {/* Wrap content with AuthGuard */}
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Video Details</h1>
        <p>Video ID: {videoData.id}</p>
        <p>Transcription Status: {videoData.transcription_status}</p>

        <h2 className="text-xl font-bold mt-6 mb-3">Transcription</h2>
        {videoData.transcripts ? (
          <div className="border rounded p-3">
            <p>{videoData.transcripts.content}</p>
            {/* TODO: Implement segmented transcription display */}
          </div>
        ) : (
          <p>Transcription not yet available.</p>
        )}

        <h2 className="text-xl font-bold mt-6 mb-3">Notes</h2>
        {/* TODO: Implement note-taking interface */}
        <p>Note-taking interface goes here.</p> {/* Placeholder */}

      </div>
    </AuthGuard>
  );
}
