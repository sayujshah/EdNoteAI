'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation'; // Import useParams to get route parameters
import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';
import AuthGuard from '../../../components/AuthGuard'; // Import AuthGuard - Adjust path

interface VideoData {
  id: string;
  url: string;
  transcription_status: string;
  created_at: string;
  transcripts: {
    id: string;
    video_id: string;
    content: string;
    segmented_content: any; // TODO: Use a more specific type for segmented content later
    created_at: string;
  } | null; // Transcript might not be available yet
}

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.videoId as string; // Get videoId from route parameters

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/videos/${videoId}`);
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
  }, [videoId]);

  useEffect(() => {
    if (videoId) {
      fetchData();
    }
  }, [videoId, fetchData]);

  if (loading) return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">EdNoteAI</span>
            </Link>
            <Link href="/dashboard/library" className="flex items-center gap-1 text-sm font-medium hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Link>
          </div>
        </header>
        <main className="flex-1 container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <p>Loading video data...</p>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
  
  if (error) return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">EdNoteAI</span>
            </Link>
            <Link href="/dashboard/library" className="flex items-center gap-1 text-sm font-medium hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Link>
          </div>
        </header>
        <main className="flex-1 container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <p className="text-red-500">Error: {error}</p>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
  
  if (!videoData) return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">EdNoteAI</span>
            </Link>
            <Link href="/dashboard/library" className="flex items-center gap-1 text-sm font-medium hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Link>
          </div>
        </header>
        <main className="flex-1 container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <p>Video not found.</p>
          </div>
        </main>
      </div>
    </AuthGuard>
  );

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">EdNoteAI</span>
                <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
                  BETA
                </span>
              </Link>
              <span className="text-sm text-muted-foreground">/ Media Analysis</span>
            </div>
            <Link href="/dashboard/library" className="flex items-center gap-1 text-sm font-medium hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Link>
          </div>
        </header>
        
        <main className="flex-1 container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Media Analysis</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Video Player and Transcription */}
              <div>
                {/* Video Player Placeholder */}
                <div className="w-full bg-gray-200 aspect-video rounded-md flex items-center justify-center">
                  {/* TODO: Integrate actual video player */}
                  <p className="text-gray-500">Video Player Placeholder</p>
                </div>

                {/* Transcription Area */}
                <div className="mt-4">
                  <h2 className="text-xl font-bold mb-2">Transcription</h2>
                  <div className="border rounded p-3 h-64 overflow-y-auto"> {/* Added height and scroll */}
                    {videoData.transcripts ? (
                      <p>{videoData.transcripts.content}</p>
                    ) : (
                      <p>Transcription not yet available.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Academic Notes and Controls */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-bold">Academic Notes</h2>
                  {/* TODO: Add Customize Notes and Save to Library buttons */}
                  <div>
                    <button className="mr-2 px-3 py-1 border rounded text-sm">Customize Notes</button>
                    <button className="px-3 py-1 border rounded text-sm">Save to Library</button>
                  </div>
                </div>

                {/* Notes Tabs (Placeholder) */}
                <div className="border rounded p-3 h-96 overflow-y-auto"> {/* Added height and scroll */}
                  {/* TODO: Implement tabs for AI Notes, Summary, Key Points */}
                  <div className="mb-4">
                    <button className="px-4 py-2 border-b-2 border-blue-500 text-blue-500">AI Notes</button>
                    <button className="px-4 py-2 text-gray-500">Summary</button>
                    <button className="px-4 py-2 text-gray-500">Key Points</button>
                  </div>

                  {/* Display AI Generated Notes */}
                  {videoData.transcripts?.segmented_content ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{videoData.transcripts.segmented_content.title || 'Generated Notes'}</h3>
                      {videoData.transcripts.segmented_content.segments && videoData.transcripts.segmented_content.segments.length > 0 ? (
                        videoData.transcripts.segmented_content.segments.map((segment: any /* TODO: Define a specific type for segment */, index: number) => ( // Use 'any' for now
                          <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
                            <h4 className="text-md font-semibold mb-1">{segment.heading || `Segment ${index + 1}`}</h4>
                            {segment.summary && <p className="text-sm text-gray-700 mb-1">Summary: {segment.summary}</p>}
                            {segment.key_points && segment.key_points.length > 0 && (
                              <div>
                                <p className="text-sm font-medium">Key Points:</p>
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                  {segment.key_points.map((point: string, pointIndex: number) => (
                                    <li key={pointIndex}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {segment.demonstration_description && (
                              <p className="text-sm text-gray-700 mt-1">Demonstration: {segment.demonstration_description}</p>
                            )}
                            {/* TODO: Display segment text and timestamps */}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-700">No segments found in generated notes.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700">Generated notes not yet available.</p>
                  )}

                  {/* TODO: Implement user note-taking interface - potentially in a separate tab */}
                  {/* <h2 className="text-xl font-bold mt-6 mb-3">Your Personal Notes</h2> */}
                  {/* <p>User note-taking interface goes here.</p> */}

                </div>

                {/* Export Options - Moved below notes area */}
                <div className="mt-4">
                  <h2 className="text-xl font-bold mb-3">Export Notes</h2>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => window.open(`/api/videos/${videoId}/export?format=markdown`, '_blank')}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                    >
                      Export Markdown
                    </button>
                    <button
                      onClick={() => window.open(`/api/videos/${videoId}/export?format=latex`, '_blank')}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                    >
                      Export LaTeX
                    </button>
                    <button
                      onClick={() => window.open(`/api/videos/${videoId}/export?format=txt`, '_blank')}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                    >
                      Export Plain Text
                    </button>
                    {/* TODO: Add DOCX export button (requires backend implementation) */}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
