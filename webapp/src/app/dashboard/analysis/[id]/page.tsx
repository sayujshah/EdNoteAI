"use client";

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { BookOpen, Settings, Save, X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import { createBrowserClient } from '@supabase/ssr'; // Import createBrowserClient

// Define types for media data, transcription, and notes
interface Media {
  id: string;
  file_url: string;
  transcripts?: Transcription[]; // Transcription is now nested under Media
  transcription_status: string; // Add transcription status to Media type
  // Add other media properties if needed
}

interface Transcription {
  id: string;
  text: string;
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch media data
  const fetchData = async () => {
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
  };


  // Fetch media data on component mount and set up Realtime subscription
  useEffect(() => {
    if (id) {
      fetchData(); // Initial data fetch

      console.log(`Attempting to subscribe to Realtime channel for media ID: ${id}`); // Added logging
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
            console.log('Realtime update received:', payload); // Added logging
            // Check if the transcription status has changed to 'completed'
            if (payload.new.transcription_status === 'completed') {
               console.log('Media status updated to completed, refetching data.'); // Added logging
               fetchData(); // Refetch data when status is completed
            } else {
                console.log('Realtime update received, but status is not completed:', payload.new.transcription_status); // Added logging
            }
          }
        )
        .subscribe((status) => {
            console.log(`Realtime subscription status for channel media_status_changes_${id}: ${status}`); // Added logging
        }); // Subscribe to the channel

      // Clean up subscription on component unmount
      return () => {
        console.log(`Removing Realtime channel media_status_changes_${id}`); // Added logging
        supabase.removeChannel(channel);
      };
    }
  }, [id]); // Rerun effect if id changes


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

  // Helper to get the first transcription text (assuming one transcript per video for now)
  const getTranscriptionText = () => {
    if (media?.transcripts && media.transcripts.length > 0) {
      return media.transcripts[0].text;
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

  // Helper to get the segmented content from the first note (assuming one note per transcript for now)
   const getSegmentedContent = () => {
     if (media?.transcripts && media.transcripts.length > 0 && media.transcripts[0].notes && media.transcripts[0].notes.length > 0) {
       return media.transcripts[0].notes[0].content;
     }
     return null;
   };


  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Media Analysis</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            <span>Customize Notes</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            <span>Save to Library</span>
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Media player */}
        <div className="flex w-1/2 flex-col border-r">
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
                <p>Loading transcription...</p>
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
        <div className="w-1/2 overflow-y-auto p-6">
          <Tabs defaultValue="notes">
            <TabsList className="mb-6">
              <TabsTrigger value="notes">AI Notes</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="keypoints">Key Points</TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Academic Notes</h2>

                {loading ? (
                   <p>Loading notes...</p>
                 ) : error ? (
                   <p className="text-red-500">Error loading notes: {error}</p>
                 ) : getMarkdownContent() ? (
                   <ReactMarkdown>{getMarkdownContent()}</ReactMarkdown> // Render markdown content
                 ) : getSegmentedContent() ? (
                    <div className="space-y-4">
                      <p>Notes loaded (rendering raw segmented content for now):</p>
                      <pre>{JSON.stringify(getSegmentedContent(), null, 2)}</pre> {/* Fallback to raw segmented content */}
                    </div>
                 ) : (
                   <div className="space-y-4">
                     <p>Notes not available yet.</p>
                     <p className="mt-2 text-sm text-muted-foreground">
                       Notes will appear here after processing is complete.
                     </p>
                   </div>
                 )}

              </div>
            </TabsContent>

            <TabsContent value="summary" className="focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Executive Summary</h2>
                 {loading ? (
                    <p>Loading summary...</p>
                  ) : error ? (
                    <p className="text-red-500">Error loading summary: {error}</p>
                  ) : getMarkdownContent() ? ( // Assuming summary is part of markdown content or can be extracted
                    // TODO: Extract summary from markdown or segmented content if needed
                    <p>Summary will be displayed here from markdown or segmented content.</p>
                  ) : getSegmentedContent()?.summary ? ( // Fallback to segmented content summary if available
                    <p>{getSegmentedContent().summary}</p>
                  ) : (
                    <p>Summary not available yet.</p>
                  )}
              </div>
            </TabsContent>

            <TabsContent value="keypoints" className="focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Key Points</h2>
                 {loading ? (
                    <p>Loading key points...</p>
                  ) : error ? (
                    <p className="text-red-500">Error loading key points: {error}</p>
                  ) : getMarkdownContent() ? ( // Assuming key points are part of markdown content or can be extracted
                     // TODO: Extract key points from markdown or segmented content if needed
                     <p>Key points will be displayed here from markdown or segmented content.</p>
                  ) : getSegmentedContent()?.segments ? ( // Fallback to segmented content key points if available
                    <ul className="space-y-4">
                      {getSegmentedContent().segments.map((segment: any, segmentIndex: number) => (
                         segment.key_points && segment.key_points.map((kp: string, kpIndex: number) => (
                            <li key={`${segmentIndex}-${kpIndex}`} className="flex gap-3">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                {kpIndex + 1}
                              </div>
                              <div>
                                <p className="font-medium">{kp}</p>
                                {/* No description in this structure, just the key point text */}
                              </div>
                            </li>
                         ))
                      )).flat()} {/* Flatten the array of arrays */}
                    </ul>
                  ) : (
                    <p>Key points not available yet.</p>
                  )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
