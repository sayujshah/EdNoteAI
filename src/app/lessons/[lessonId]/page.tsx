'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Import useParams to get route parameters
import Link from 'next/link'; // Import Link for navigation
import FileUpload from '../../../components/FileUpload'; // Import FileUpload component
import AuthGuard from '../../../components/AuthGuard'; // Import AuthGuard - Adjust path
import { Progress } from '../../../components/ui/progress'; // Import Progress component

interface Lesson {
  id: string;
  title: string;
  created_at: string;
}

interface Video {
  id: string;
  lesson_id: string;
  url: string;
  transcription_status: string; // Assuming status is a string for now
  created_at: string;
}

export default function LessonDetailPage() {
  const params = useParams();
  const lessonId = params.lessonId as string; // Get lessonId from route parameters

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch lesson details and videos
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch lesson details (assuming an API route for single lesson exists or can be adapted)
      // For now, let's assume we can fetch lessons by ID from the existing /api/lessons route
      const lessonResponse = await fetch(`/api/lessons?id=${lessonId}`); // Assuming GET /api/lessons can take an ID query param
      if (!lessonResponse.ok) {
        const errorData = await lessonResponse.json();
        throw new Error(errorData.error || 'Failed to fetch lesson details');
      }
      const lessonData: Lesson[] = await lessonResponse.json(); // Assuming it returns an array
      setLesson(lessonData[0] || null); // Set the first item as the lesson

      // Fetch videos for this lesson (assuming an API route for videos exists or can be adapted)
      // Let's assume a new API route /api/videos or modify /api/lessons to include videos
      // Fetch videos by lessonId from the /api/media route
      const videosResponse = await fetch(`/api/media?lessonId=${lessonId}`); // Fetch videos from the new /api/media route
      if (!videosResponse.ok) {
        const errorData = await videosResponse.json();
        throw new Error(errorData.error || 'Failed to fetch videos');
      }
      const videosData: Video[] = await videosResponse.json();
      setVideos(videosData);

    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when lessonId changes
  useEffect(() => {
    if (lessonId) {
      fetchData();
    }
  }, [lessonId, fetchData]); // Rerun effect when lessonId changes

  // Poll for video status updates (optional, for real-time feel)
  useEffect(() => {
    const interval = setInterval(() => {
      if (videos.some(video => video.transcription_status !== 'notes_generated' && video.transcription_status !== 'failed' && video.transcription_status !== 'transcribed_only')) {
        fetchData(); // Refetch data if any video is still processing
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval); // Clean up interval on component unmount
  }, [videos, fetchData]); // Rerun effect when videos state changes


  if (loading) return <p>Loading lesson details...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!lesson) return <p>Lesson not found.</p>;

  return (
    <AuthGuard> {/* Wrap content with AuthGuard */}
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Lesson: {lesson.title}</h1>

        <h2 className="text-xl font-bold mb-3">Media Items</h2> {/* Updated Heading */}

        {/* Overall Progress Indicator */}
        {videos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Overall Lesson Progress</h3>
            <Progress value={(videos.filter(video => video.transcription_status === 'notes_generated').length / videos.length) * 100} />
            <p className="text-sm text-gray-600 mt-1">{videos.filter(video => video.transcription_status === 'notes_generated').length} of {videos.length} media items processed</p>
          </div>
        )}

        {videos.length === 0 && <p>No media items found for this lesson.</p>} {/* Updated text */}

        {videos.length > 0 && (
          <ul>
            {videos.map((video) => (
              <li key={video.id} className="border rounded p-3 mb-2 flex justify-between items-center">
                <Link href={`/media/${video.id}`} className="text-blue-600 hover:underline flex-grow mr-4"> {/* Added Link and flex-grow */}
                  <span>Media ID: {video.id} - Status: {video.transcription_status}</span> {/* Updated text */}
                </Link>
                {/* Progress Bar */}
                <div className="w-32 mr-4"> {/* Container for progress bar */}
                  <Progress value={
                    video.transcription_status === 'pending' ? 0 :
                    video.transcription_status === 'transcribing' ? 25 : // Adjusted progress values
                    video.transcription_status === 'note_generating' ? 75 :
                    video.transcription_status === 'notes_generated' ? 100 :
                    video.transcription_status === 'transcribed_only' ? 60 : // Added status
                    video.transcription_status === 'failed' ? 0 : 0 // Added status and default
                  } />
                </div>
                {/* TODO: Add delete button for videos */}
              </li>
            ))}
          </ul>
        )}

        {/* File Upload Component */}
        <FileUpload lessonId={lessonId} /> {/* Add FileUpload component */}

        {/* TODO: Add button to add a new video (might be triggered by capture) */}
      </div>
    </AuthGuard>
  );
}
