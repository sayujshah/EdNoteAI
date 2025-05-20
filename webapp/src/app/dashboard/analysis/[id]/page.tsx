"use client";

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { BookOpen, Settings, Save, X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import ReactMarkdown from 'react-markdown';
import { createBrowserClient } from '@supabase/ssr';
import remarkGfm from 'remark-gfm'

// Define types for media data, transcription, and notes
interface Media {
  id: string;
  file_url: string;
  transcripts?: Transcription[];
  transcription_status: string;
}

interface Transcription {
  id: string;
  text: string;
  notes?: Note[];
}

interface Note {
  id: string;
  content: any;
  markdown_content?: string;
}

// Initialize Supabase client for Realtime
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AnalysisPage() {
  // Add this line to the top of your component if you need to install remark-gfm
  // npm install remark-gfm --save
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
  
  // Added state variables to store extracted content
  const [markdownNotes, setMarkdownNotes] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [keyPoints, setKeyPoints] = useState<{title: string; description?: string}[]>([]);

  // Function to fetch media data
  const fetchData = async () => {
    console.log("Fetching media data...");
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
      console.log("Media data fetched:", mediaData);
      
      // Process and extract content once media data is loaded
      processMediaContent(mediaData);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process and extract content from media data once media data is loaded
  const processMediaContent = (mediaData: Media) => {
    console.log("Processing media content...");
    
    // Extract markdown content
    let mdContent = getMarkdownContent(mediaData);
    console.log("Extracted markdown content:", mdContent);
    
    // If no markdown content directly available, try to use raw text as markdown
    if (!mdContent && mediaData?.transcripts && mediaData.transcripts.length > 0 && 
        mediaData.transcripts[0].notes && mediaData.transcripts[0].notes.length > 0) {
      const note = mediaData.transcripts[0].notes[0];
      
      // Check if there's text in the note that might be markdown but not properly identified
      if (typeof note.content === 'string' && 
          (note.content.includes('#') || note.content.includes('-') || note.content.includes('*'))) {
        mdContent = note.content;
        console.log("Using note content as markdown:", mdContent);
      }
    }
    
    // Update state with the markdown content
    setMarkdownNotes(mdContent);
    
    // Process segmented content if available
    const segContent = getSegmentedContent(mediaData);
    if (segContent) {
      console.log("Processing segmented content:", segContent);
      
      // Extract summary from segmented content
      if (segContent.summary) {
        setSummary(segContent.summary);
      }
      
      // Extract and format key points
      if (segContent.segments) {
        const formattedKeyPoints = segContent.segments
          .flatMap((segment: any) => 
            segment.key_points 
              ? segment.key_points.map((kp: string) => ({ title: kp }))
              : []
          );
        setKeyPoints(formattedKeyPoints);
      }
      
      // If there's no markdown content but we have segmented content,
      // generate markdown from segmented content
      if (!mdContent) {
        const generatedMarkdown = generateMarkdownFromSegments(segContent);
        console.log("Generated markdown from segments:", generatedMarkdown);
        setMarkdownNotes(generatedMarkdown);
      }
    }
  };
  
  // Function to generate markdown from segmented content
  const generateMarkdownFromSegments = (segmentedContent: any): string => {
    if (!segmentedContent || !segmentedContent.segments) return '';
    
    let markdown = '';
    
    // Add title and summary if available
    if (segmentedContent.title) {
      markdown += `# ${segmentedContent.title}\n\n`;
    }
    
    if (segmentedContent.summary) {
      markdown += `## Summary\n\n${segmentedContent.summary}\n\n`;
    }
    
    // Process each segment
    segmentedContent.segments.forEach((segment: any, index: number) => {
      if (segment.title) {
        markdown += `## ${segment.title}\n\n`;
      } else {
        markdown += `## Section ${index + 1}\n\n`;
      }
      
      if (segment.content) {
        markdown += `${segment.content}\n\n`;
      }
      
      // Add key points if available
      if (segment.key_points && segment.key_points.length > 0) {
        markdown += `### Key Points\n\n`;
        segment.key_points.forEach((kp: string) => {
          markdown += `- ${kp}\n`;
        });
        markdown += '\n';
      }
    });
    
    return markdown;
  };

  // Fetch media data on component mount and set up Realtime subscription
  useEffect(() => {
    if (id) {
      fetchData(); // Initial data fetch

      console.log(`Attempting to subscribe to Realtime channel for media ID: ${id}`);
      // Set up Realtime subscription
      const channel = supabase
        .channel(`media_status_changes_${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'videos',
            filter: `id=eq.${id}`,
          },
          (payload) => {
            console.log('Realtime update received:', payload);
            if (payload.new.transcription_status === 'completed') {
               console.log('Media status updated to completed, refetching data.');
               fetchData();
            } else {
                console.log('Realtime update received, but status is not completed:', payload.new.transcription_status);
            }
          }
        )
        .subscribe((status) => {
            console.log(`Realtime subscription status for channel media_status_changes_${id}: ${status}`);
        });

      // Clean up subscription on component unmount
      return () => {
        console.log(`Removing Realtime channel media_status_changes_${id}`);
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  // Format time in MM:SS format
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Video player functions
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

  // Helper to get the first transcription text
  const getTranscriptionText = (mediaData: Media | null = media) => {
    if (mediaData?.transcripts && mediaData.transcripts.length > 0) {
      return mediaData.transcripts[0].text;
    }
    return null;
  };

  // Helper to get the markdown content from the first note
  const getMarkdownContent = (mediaData: Media | null = media) => {
    if (mediaData?.transcripts && mediaData.transcripts.length > 0 && 
        mediaData.transcripts[0].notes && mediaData.transcripts[0].notes.length > 0) {
      // Return the markdown content, making sure it's properly escaped and formatted
      const content = mediaData.transcripts[0].notes[0].markdown_content;
      return content ? content.trim() : null;
    }
    return null;
  };

  // Helper to get the segmented content from the first note
  const getSegmentedContent = (mediaData: Media | null = media) => {
    if (mediaData?.transcripts && mediaData.transcripts.length > 0 && 
        mediaData.transcripts[0].notes && mediaData.transcripts[0].notes.length > 0) {
      return mediaData.transcripts[0].notes[0].content;
    }
    return null;
  };

  // Determine processing status message
  const getProcessingStatusMessage = () => {
    if (!media) return "Processing not started.";
    
    switch (media.transcription_status) {
      case 'pending':
        return "Transcription is pending...";
      case 'processing':
        return "Transcription in progress...";
      case 'completed':
        return media.transcripts && media.transcripts.length > 0 ? 
          (media.transcripts[0].notes && media.transcripts[0].notes.length > 0 ? 
            "Processing complete." : 
            "Transcription complete, generating notes...") :
          "Transcription complete, but no notes generated yet.";
      case 'error':
        return "Error occurred during processing.";
      default:
        return "Unknown processing status.";
    }
  };

  // Render loading component
  const renderLoading = () => (
    <div className="space-y-2">
      <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
      <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
      <div className="h-4 w-5/6 bg-muted animate-pulse rounded"></div>
    </div>
  );

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
                src={media.file_url}
                poster="/placeholder.svg?height=720&width=1280"
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
                <p>{getTranscriptionText()}</p>
              ) : (
                <div>
                  <p>Transcription not available yet.</p>
                  <p className="text-xs text-muted-foreground mt-2">{getProcessingStatusMessage()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel - Notes */}
        <div className="w-1/2 overflow-y-auto p-6">
          <Tabs defaultValue="notes">

            <TabsContent value="notes" className="focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Generated Notes</h2>

                {loading ? (
                  renderLoading()
                ) : error ? (
                  <p className="text-red-500">Error loading notes: {error}</p>
                ) : markdownNotes ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />
                      }}
                    >
                      {markdownNotes}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p>Notes not available yet.</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {getProcessingStatusMessage()}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}