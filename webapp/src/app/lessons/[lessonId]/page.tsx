'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Import useParams to get route parameters
import Link from 'next/link'; // Import Link for navigation
import FileUpload from '../../../components/FileUpload'; // Import FileUpload component
import AuthGuard from '../../../components/AuthGuard'; // Import AuthGuard - Adjust path

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
      // For now, let's assume we can fetch videos by lessonId from a /api/videos route
      const videosResponse = await fetch(`/api/videos?lessonId=${lessonId}`); // TODO: Create /api/videos route
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
  }, [lessonId]); // Rerun effect when lessonId changes

  if (loading) return <p>Loading lesson details...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!lesson) return <p>Lesson not found.</p>;

  return (
    <AuthGuard> {/* Wrap content with AuthGuard */}
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Lesson: {lesson.title}</h1>

        <h2 className="text-xl font-bold mb-3">Videos</h2>

        {videos.length === 0 && <p>No videos found for this lesson.</p>}

        {videos.length > 0 && (
          <ul>
            {videos.map((video) => (
              <li key={video.id} className="border rounded p-3 mb-2 flex justify-between items-center">
                <span>Video ID: {video.id} - Status: {video.transcription_status}</span>
                {/* TODO: Add link to transcription/note-taking page for this video */}
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
