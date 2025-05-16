'use client';

import { useState, useEffect } from 'react'; // Import useEffect
import { supabase } from '../lib/supabase'; // Import supabase client
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating IDs

export default function Home() {
  const [status, setStatus] = useState('Idle');
  const [transcription, setTranscription] = useState(''); // State for transcription
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null); // State to hold the current video ID

  // Function to fetch transcription from Supabase
  const fetchTranscription = async (videoId: string) => {
    const { data, error } = await supabase
      .from('transcripts')
      .select('content')
      .eq('video_id', videoId)
      .single(); // Assuming one transcript per video for now

    if (error) {
      console.error('Error fetching transcription:', error);
      return null;
    }
    return data?.content || '';
  };

  // Effect to poll for transcription updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (currentVideoId && status === 'Capturing...') {
      intervalId = setInterval(async () => {
        const latestTranscription = await fetchTranscription(currentVideoId);
        if (latestTranscription) {
          setTranscription(latestTranscription);
          // Stop polling if transcription is complete (optional, depending on how completion is tracked)
          // For now, just update the transcription
        }
      }, 5000); // Poll every 5 seconds
    } else if (intervalId) {
      clearInterval(intervalId);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentVideoId, status]); // Rerun effect when videoId or status changes

  const startCapture = async () => {
    // Generate a new video ID (will associate with a lesson later)
    const newVideoId = uuidv4();
    setCurrentVideoId(newVideoId);

    setStatus('Starting capture...');
    try {
      // Pass videoId and userId to the extension
      const response = await chrome.runtime.sendMessage('jbginpeohajmpfgpimbakcabhafakmki', {
        action: 'startCapture',
        videoId: newVideoId,
        userId: 'placeholder-user-id', // TODO: Replace with actual user ID - implement actual auth later
      }); // TODO: Replace with actual extension ID
      console.log('Start capture response:', response);
      setStatus(response.status === 'captureStarted' ? 'Capturing...' : 'Failed to start capture');
    } catch (error) {
      console.error('Error sending start capture message:', error);
      setStatus('Error starting capture');
    }
  };

  const stopCapture = async () => {
    setStatus('Stopping capture...');
    try {
      const response = await chrome.runtime.sendMessage('jbginpeohajmpfgpimbakcabhafakmki', { action: 'stopCapture' }); // TODO: Replace with actual extension ID
      console.log('Stop capture response:', response);
      setStatus(response.status === 'captureStopped' ? 'Stopped' : 'Failed to stop capture');
      // After stopping, fetch the final transcription
      if (currentVideoId) {
        const finalTranscription = await fetchTranscription(currentVideoId);
        if (finalTranscription) {
          setTranscription(finalTranscription);
        }
      }
    } catch (error) {
      console.error('Error sending stop capture message:', error);
      setStatus('Error stopping capture');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Video Transcriptor Notes</h1>
      <p>Status: {status}</p>
      <div>
        <button
          onClick={startCapture}
          disabled={status === 'Capturing...'}
          className="mr-4 px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          Start Capture
        </button>
        <button
          onClick={stopCapture}
          disabled={status !== 'Capturing...'}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        >
          Stop Capture
        </button>
      </div>
      {/* Display transcription results here */}
      {transcription && (
        <div className="mt-8 p-4 border rounded w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-2">Transcription</h2>
          <p>{transcription}</p>
        </div>
      )}
    </main>
  );
}
