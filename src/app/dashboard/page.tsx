'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase'; // Import supabase client
import AuthGuard from '../../components/AuthGuard'; // Import AuthGuard - Corrected path

export default function Home() {
  const [status, setStatus] = useState('Extension integration disabled');
  const [transcription, setTranscription] = useState(''); // State for transcription

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

  // The capture functionality and related state/effects are removed as per user request.
  // The transcription state and fetchTranscription function are kept for future use.

  return (
    <AuthGuard> {/* Wrap content with AuthGuard */}
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <h1>Video Transcriptor Notes</h1>
        <p>Status: {status}</p>
        {/* Capture buttons removed as extension integration is disabled */}
        {/* Display transcription results here */}
        {transcription && (
          <div className="mt-8 p-4 border rounded w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-2">Transcription</h2>
            <p>{transcription}</p>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
