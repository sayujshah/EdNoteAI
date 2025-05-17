'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'; // Import Link for navigation
import AuthGuard from '../../components/AuthGuard'; // Import AuthGuard - Adjust path

interface Lesson {
  id: string;
  title: string;
  created_at: string;
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [creatingLesson, setCreatingLesson] = useState(false);

  // Function to fetch lessons
  const fetchLessons = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/lessons');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch lessons');
      }
      const data: Lesson[] = await response.json();
      setLessons(data);
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lessons on component mount
  useEffect(() => {
    fetchLessons();
  }, []); // Empty dependency array means this runs once on mount

  // Function to create a new lesson
  const createLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;

    setCreatingLesson(true);
    setError(null);
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
        throw new Error(errorData.error || 'Failed to create lesson');
      }

      const newLesson: Lesson = await response.json();
      setLessons([...lessons, newLesson]); // Add the new lesson to the list
      setNewLessonTitle(''); // Clear the input field
    } catch (error: any) {
      setError(error.message);
      console.error('Error creating lesson:', error);
    } finally {
      setCreatingLesson(false);
    }
  };

  return (
    <AuthGuard> {/* Wrap content with AuthGuard */}
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">My Lessons</h1>

        {/* Form to create a new lesson */}
        <form onSubmit={createLesson} className="mb-6">
          <input
            type="text"
            placeholder="New Lesson Title"
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
            className="border rounded px-3 py-2 mr-2 text-gray-700"
            disabled={creatingLesson}
            required
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            disabled={creatingLesson}
          >
            {creatingLesson ? 'Creating...' : 'Create Lesson'}
          </button>
        </form>

        {loading && <p>Loading lessons...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {!loading && lessons.length === 0 && <p>No lessons found. Create one above!</p>}

        {/* List of lessons */}
        {!loading && lessons.length > 0 && (
          <ul>
            {lessons.map((lesson) => (
              <li key={lesson.id} className="border rounded p-3 mb-2 flex justify-between items-center">
                <Link href={`/lessons/${lesson.id}`} className="text-blue-600 hover:underline">
                  {lesson.title}
                </Link>
                {/* TODO: Add delete button for lessons */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AuthGuard>
  );
}
