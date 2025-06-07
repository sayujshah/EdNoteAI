"use client";

import { useState, useRef, useEffect, useCallback } from "react" // Import useCallback
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { BookOpen, Settings, Save, X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { createBrowserClient } from '@supabase/ssr'; // Import createBrowserClient
import { Skeleton } from "@/components/ui/Skeleton";
import 'katex/dist/katex.min.css'; // Import KaTeX CSS
import SaveToLibraryModal from '@/components/ui/SaveToLibraryModal'; // Import save modal
import type { SaveNoteRequest } from '@/lib/types/library';
import NoteRenderer from '@/components/ui/NoteRenderer'; // Import shared renderer

// Define types for media data, transcription, and notes
interface Media {
  id: string;
  file_url: string;
  note_format?: 'Markdown' | 'LaTeX'; // Add note format field
  transcripts?: Transcription[]; // Transcription is now nested under Media
  transcription_status: string; // Add transcription status to Media type
  // Add other media properties if needed
}

interface Transcription {
  id: string;
  content: string;
  notes?: Note[]; // Notes are now nested under Transcription
  // Add other transcription properties if needed (e.g., timestamps)
}

interface Note {
  id: string;
  content: any; // Segmented content (structured JSON)
  markdown_content?: string; // Markdown notes
  // Add other note properties if needed
}

// Initialize Supabase client for Realtime
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


export default function AnalysisPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Save to Library state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Function to fetch media data, wrapped in useCallback
  const fetchData = useCallback(async () => {
    console.log("Fetching media data..."); // Added logging
    setLoading(true);
    setError(null);
    try {
      const mediaResponse = await fetch(`/api/media/${id}`);
      if (!mediaResponse.ok) {
        const errorData = await mediaResponse.json();
        throw new Error(errorData.message || 'Failed to fetch media data');
      }
      const mediaData: Media = await mediaResponse.json();
      setMedia(mediaData);
      console.log("Media data fetched:", mediaData); // Added logging

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [id]); // Dependency array for useCallback


  // Fetch media data on component mount and set up Realtime subscription
  useEffect(() => {
    if (id) {
      fetchData(); // Initial data fetch
      // Set up Realtime subscription
      const channel = supabase
        .channel(`media_status_changes_${id}`) // Unique channel name for this media item
        .on(
          'postgres_changes',
          {
            event: 'UPDATE', // Listen for UPDATE events
            schema: 'public',
            table: 'videos', // Listen for changes in the videos table
            filter: `id=eq.${id}`, // Filter for the specific media item ID
          },
          (payload) => {
            // Check if the transcription status has changed to 'completed'
            if (payload.new.transcription_status === 'completed') {
               fetchData(); // Refetch data when status is completed
            }
          }
        )
        .subscribe(); // Subscribe to the channel

      // Clean up subscription on component unmount
      return () => {
        supabase.removeChannel(channel)
      };
    }
  }, [id, fetchData]); // Removed fetchData from dependency array


  // Format time in MM:SS format
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    if (newVolume === 0) {
      setIsMuted(true)
    } else {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
    }
  }

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10)
    }
  }

  // Add error handling for video element
  const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      console.error('Video playback error:', event.nativeEvent);
      // You might want to display a user-friendly error message on the UI
      setError('Error loading or playing media.');
  };

  const handleVideoStalled = () => {
      console.warn('Video playback stalled.');
  };

  const handleVideoSuspend = () => {
      console.warn('Video playback suspended.');
  };

   const handleVideoAbort = () => {
       console.warn('Video playback aborted.');
   };


  // Helper to get the first transcription text (assuming one transcript per video for now)
  const getTranscriptionText = () => {
    if (media?.transcripts && media.transcripts.length > 0) {
      return media.transcripts[0].content;
    }
    return null;
  };

  // Helper to get the markdown content from the first note (assuming one note per transcript for now)
  const getMarkdownContent = () => {
    if (media?.transcripts && media.transcripts.length > 0 && media.transcripts[0].notes && media.transcripts[0].notes.length > 0) {
      return media.transcripts[0].notes[0].markdown_content;
    }
    return null;
  };

  // Helper to get the generated content from the first note (works for both markdown and latex)
  const getGeneratedContent = () => {
    if (media?.transcripts && media.transcripts.length > 0 && media.transcripts[0].notes && media.transcripts[0].notes.length > 0) {
      return media.transcripts[0].notes[0].content;
    }
    return null;
  };

  // Helper to render notes with unified Markdown + LaTeX format
  const renderNotes = () => {
    const content = getGeneratedContent();
    if (!content) return null;

    return (
      <NoteRenderer 
        content={content} 
        className="space-y-4"
      />
    );
  };

  // Save note to library function
  const handleSaveToLibrary = async (noteData: SaveNoteRequest) => {
    try {
      const response = await fetch('/api/library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save note');
      }

      // Show success state
      setSaveSuccess(true);
      
    } catch (error: any) {
      throw error; // Re-throw to be handled by the modal
    }
  };

  // Handle successful save - show success briefly then navigate
  const handleSaveSuccess = () => {
    setTimeout(() => {
      router.push('/dashboard/library');
    }, 1500); // Navigate after 1.5 seconds
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">EdNoteAI</h1>
          <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
            BETA
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            <span>Customize Notes</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowSaveModal(true)}
            disabled={!getGeneratedContent() || loading}
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save to Library</span>
              </>
            )}
          </Button>
          <Link href="/dashboard/library">
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Media player */}
        <div className="flex w-1/3 flex-col border-r">
          <div className="relative flex-1 bg-black">
            {loading ? (
              <div className="flex items-center justify-center h-full text-white">Loading media...</div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-red-500">Error loading media: {error}</div>
            ) : media?.file_url ? (
              <video
                ref={videoRef}
                className="h-full w-full object-contain"
                src={media.file_url} // Use actual file URL
                poster="/placeholder.svg?height=720&width=1280" // Keep placeholder poster for now
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onError={handleVideoError} // Added error listener
                onStalled={handleVideoStalled} // Added stalled listener
                onSuspend={handleVideoSuspend} // Added suspend listener
                onAbort={handleVideoAbort} // Added abort listener
              />
            ) : (
               <div className="flex items-center justify-center h-full text-white">No media file available.</div>
            )}
            <div className="absolute bottom-4 left-4 text-white bg-black/50 px-2 py-1 rounded text-sm">Audio/Video File</div>
          </div>

          <div className="border-t bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <Slider value={[currentTime]} max={duration} step={0.1} onValueChange={handleSeek} className="mb-4" disabled={!media?.file_url} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={toggleMute} disabled={!media?.file_url}>
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                  disabled={!media?.file_url}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={skipBackward} disabled={!media?.file_url}>
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button variant="default" size="icon" className="h-10 w-10 rounded-full" onClick={togglePlay} disabled={!media?.file_url}>
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={skipForward} disabled={!media?.file_url}>
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
              <div className="w-[88px]" />
            </div>
          </div>

          <div className="border-t p-4">
            <h2 className="mb-2 text-lg font-semibold">Transcription</h2>
            <div className="rounded-lg bg-muted/30 p-4 text-sm overflow-y-auto max-h-[200px]">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : error ? (
                <p className="text-red-500">Error loading transcription: {error}</p>
              ) : getTranscriptionText() ? (
                <p>{getTranscriptionText()}</p> // Display actual transcription
              ) : (
                <p>Transcription not available yet.</p> // Placeholder if no transcription
              )}
            </div>
          </div>
        </div>

        {/* Right panel - Notes */}
        <div className="w-2/3 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Academic Notes</h2>
          
          {/* AI Disclaimer */}
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            <strong>DISCLAIMER:</strong> By using this AI-generated content, you acknowledge that it may contain inaccuracies, errors, or hallucinations. Please verify all important information independently and exercise your own judgment when relying on this content for academic or professional purposes.
          </p>

          {loading || (!getMarkdownContent() && !getGeneratedContent()) ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : error ? (
            <p className="text-red-500">Error loading notes: {error}</p>
          ) : getMarkdownContent() ? (
            renderNotes()
          ) : getGeneratedContent() ? (
            renderNotes()
          ) : null}
        </div>
      </div>

      {/* Save to Library Modal */}
      {media && getGeneratedContent() && (
        <SaveToLibraryModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveToLibrary}
          onSaveSuccess={handleSaveSuccess}
          content={getGeneratedContent()}
          format={'Markdown'}
          mediaId={media.id}
          mediaTitle={`Analysis ${media.id}`} // You could get a better title from media metadata
        />
      )}
    </div>
  )
}
