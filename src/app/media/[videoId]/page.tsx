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
        <h1 className="text-2xl font-bold mb-4">Media Analysis</h1> {/* Updated Heading */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    videoData.transcripts.segmented_content.segments.map((segment: any, index: number) => ( // Use 'any' for now
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
    </AuthGuard>
  );
}
