"use client";

import { useState, useRef } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { BookOpen, Settings, Save, X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"

export default function AnalysisPage() {
  const { id } = useParams()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(100)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

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
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              src="/placeholder.mp4"
              poster="/placeholder.svg?height=720&width=1280"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />
            <div className="absolute bottom-4 left-4 text-white bg-black/50 px-2 py-1 rounded text-sm">Audio File</div>
          </div>

          <div className="border-t bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <Slider value={[currentTime]} max={duration} step={0.1} onValueChange={handleSeek} className="mb-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={skipBackward}>
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button variant="default" size="icon" className="h-10 w-10 rounded-full" onClick={togglePlay}>
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={skipForward}>
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
              <div className="w-[88px]" />
            </div>
          </div>

          <div className="border-t p-4">
            <h2 className="mb-2 text-lg font-semibold">Transcription</h2>
            <div className="rounded-lg bg-muted/30 p-4 text-sm">
              <p>
                This is a placeholder transcription. In a real application, this would contain the full text
                transcription of the uploaded media file.
              </p>
              <p className="mt-2">
                The transcription would be time-synced with the media, allowing users to click on any part of the text
                to jump to that point in the audio or video.
              </p>
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

                <div className="space-y-4">
                  <p>
                    These are placeholder notes. In a real application, this would contain AI-generated academic-style
                    notes based on the content of the uploaded media.
                  </p>

                  <h3 className="text-xl font-semibold">Introduction to the Topic</h3>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam
                    ultricies, nunc nisl aliquet nunc, quis aliquam nisl nisl eu nisl. Nullam euismod, nisl eget aliquam
                    ultricies, nunc nisl aliquet nunc, quis aliquam nisl nisl eu nisl.
                  </p>

                  <h3 className="text-xl font-semibold">Key Concepts</h3>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>
                      <strong>Concept 1:</strong> Explanation of the first key concept from the media content.
                    </li>
                    <li>
                      <strong>Concept 2:</strong> Explanation of the second key concept with additional context and
                      examples.
                    </li>
                    <li>
                      <strong>Concept 3:</strong> Detailed breakdown of the third concept and its relationship to the
                      overall topic.
                    </li>
                  </ul>

                  <h3 className="text-xl font-semibold">Analysis</h3>
                  <p>
                    In-depth analysis of the content would appear here, connecting different ideas and providing
                    academic context. This would include references to relevant theories, methodologies, or frameworks
                    mentioned in the media.
                  </p>

                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <h4 className="font-medium text-primary">Important Highlight</h4>
                    <p className="mt-1 text-sm">
                      A particularly significant point from the content would be highlighted here for emphasis and easy
                      reference.
                    </p>
                  </div>

                  <h3 className="text-xl font-semibold">Conclusion</h3>
                  <p>
                    Summary of the main points and their significance in the broader context of the subject matter. This
                    would include potential applications or implications of the content.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Executive Summary</h2>
                <p>
                  This is a placeholder summary. In a real application, this would contain a concise overview of the
                  entire content, highlighting the most important points and conclusions.
                </p>
                <p>
                  The summary would be designed to give the user a quick understanding of the content without having to
                  go through the entire transcription or notes.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="keypoints" className="focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Key Points</h2>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      1
                    </div>
                    <div>
                      <p className="font-medium">First key point from the content</p>
                      <p className="text-sm text-muted-foreground">
                        Additional context and explanation for the first key point.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Second key point from the content</p>
                      <p className="text-sm text-muted-foreground">
                        Additional context and explanation for the second key point.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Third key point from the content</p>
                      <p className="text-sm text-muted-foreground">
                        Additional context and explanation for the third key point.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
