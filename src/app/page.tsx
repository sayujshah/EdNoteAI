'use client';

import Link from "next/link"
import { ArrowRight, Atom, BookOpen, Chrome, GraduationCap, FileText, FileVideo2, SquareFunction, Upload, Workflow, Zap } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

import { Button } from "@/components/ui/button"
import { FileUploadModal } from "@/components/file-upload-modal"
import { LandingPricing } from "@/components/pricing/LandingPricing"

export default function LandingPage() {
  const auth = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EdNoteAI</span>
            <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
              BETA
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              How It Works
            </Link>
            <Link href="#benefits" className="text-sm font-medium hover:text-primary" onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}>
              Benefits
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              Pricing
            </Link>
          </nav>
          <HeaderActions />
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Transform Your Learning with AI-Powered Notes
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Upload any video or audio file and receive detailed transcriptions with academic-style notes to
                    enhance your learning experience.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <TryForFreeButton />
                  <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                    See How It Works
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 border">
                  {/* Mock Dashboard Content */}
                  <div className="absolute inset-4 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        </div>
                        <div className="h-6 bg-green-100 dark:bg-green-900 rounded-full px-2 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          <span className="text-xs text-green-700 dark:text-green-300">Complete</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-blue-100 dark:bg-blue-900 rounded-full px-2 flex items-center">
                          <span className="text-xs text-blue-700 dark:text-blue-300">AI Notes</span>
                        </div>
                        <div className="h-6 bg-purple-100 dark:bg-purple-900 rounded-full px-2 flex items-center">
                          <span className="text-xs text-purple-700 dark:text-purple-300">Transcription</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="rounded-lg bg-background/90 p-2 backdrop-blur">
                      <p className="text-xs font-medium">Generating notes...</p>
                      <div className="mt-1 h-2 w-full rounded-full bg-muted">
                        <div className="h-full w-[75%] rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full bg-muted/50 py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Everything You Need for Better Learning
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  EdNoteAI combines cutting-edge AI with proven learning techniques to help you learn faster and retain
                  information longer.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Accurate Transcriptions</h3>
                <p className="text-center text-muted-foreground">
                  Our AI delivers 98%+ accuracy for transcriptions in multiple languages and accents.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Academic Notes</h3>
                <p className="text-center text-muted-foreground">
                  Transform transcriptions into structured academic-style notes in markdown or LaTeX format.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Fast Processing</h3>
                <p className="text-center text-muted-foreground">
                  Get your transcriptions and notes in minutes, not hours, so you can focus on learning.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">How EdNoteAI Works</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  Three simple steps to transform your learning experience
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
              <div className="relative flex flex-col items-center space-y-4">
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-lg">
                  1
                </div>
                <div className="rounded-lg border bg-background p-6 shadow-sm">
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <Upload className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-bold">Upload Your File</h3>
                    <p className="text-muted-foreground">
                      Upload any video or audio file. We support all major formats including MP4, MP3, WAV, and more.
                    </p>
                  </div>
                </div>
                <div className="absolute left-1/2 top-8 hidden h-0.5 w-1/2 bg-gradient-to-r from-primary/50 to-muted md:block" />
              </div>
              <div className="relative flex flex-col items-center space-y-4">
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-lg">
                  2
                </div>
                <div className="rounded-lg border bg-background p-6 shadow-sm">
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <FileText className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-bold">AI Transcription</h3>
                    <p className="text-muted-foreground">
                      Using state-of-the-art LLMs,our AI transcribes your content with high accuracy, intelligently identifying key concepts.
                    </p>
                  </div>
                </div>
                <div className="absolute left-0 top-8 hidden h-0.5 w-1/2 bg-gradient-to-l from-primary/50 to-muted md:block" />
                <div className="absolute right-0 top-8 hidden h-0.5 w-1/2 bg-gradient-to-r from-primary/50 to-muted md:block" />
              </div>
              <div className="relative flex flex-col items-center space-y-4">
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-lg">
                  3
                </div>
                <div className="rounded-lg border bg-background p-6 shadow-sm">
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-bold">Get Your Notes</h3>
                    <p className="text-muted-foreground">
                      Receive comprehensive academic-style notes with summaries, key points, and citations.
                    </p>
                  </div>
                </div>
                <div className="absolute right-1/2 top-8 hidden h-0.5 w-1/2 bg-gradient-to-l from-primary/50 to-muted md:block" />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="w-full bg-muted/50 py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
              <div className="mx-auto aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 border sm:w-full lg:order-last flex items-center justify-center">
                {/* LaTeX vs Plain Text Comparison */}
                <div className="relative w-full h-full p-4">
                  <div className="absolute inset-4 bg-white/95 dark:bg-gray-900/95 rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-center py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">Plain Text vs LaTeX Notes</div>
                    </div>
                    
                    {/* Comparison Content */}
                    <div className="grid grid-cols-2 h-119">
                      {/* Plain Text Side */}
                      <div className="p-3 border-r border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">❌ Plain Text</div>
                        <div className="space-y-1 text-[10px] leading-tight text-gray-700 dark:text-gray-300">
                          <div className="font-medium">Quadratic Formula:</div>
                          <div className="bg-red-50 dark:bg-red-950/20 p-1 rounded text-red-800 dark:text-red-200">
                            x = (-b +- sqrt(b^2 - 4ac)) / 2a
                          </div>
                          <div className="mt-2 font-medium">Integration:</div>
                          <div className="bg-red-50 dark:bg-red-950/20 p-1 rounded text-red-800 dark:text-red-200">
                            integral of x^2 dx = x^3/3 + C
                          </div>
                          <div className="mt-1 text-[9px] text-gray-500">
                            Hard to read, unprofessional
                          </div>
                        </div>
                      </div>
                      
                      {/* LaTeX Side */}
                      <div className="p-3">
                        <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">✅ LaTeX Formatted</div>
                        <div className="space-y-2 text-[10px] leading-tight text-gray-700 dark:text-gray-300">
                          <div className="font-medium">Quadratic Formula:</div>
                          <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded text-center">
                            <div className="text-lg font-serif">𝑥 = <span className="text-sm">−𝑏 ± √𝑏²−4𝑎𝑐</span></div>
                            <div className="border-t-1 border-black w-36 mx-auto mt-1 pt-1">
                              <span className="text-lg">2𝑎</span>
                            </div>
                          </div>
                          <div className="font-medium">Integration:</div>
                          <div className="bg-green-50 dark:bg-green-950/20 p-1 rounded text-center">
                            <span className="text-lg font-serif">∫ 𝑥² 𝑑𝑥 = </span>
                            <span className="text-sm border-t border-green-200 dark:border-green-800">𝑥³</span>
                            <span className="text-lg"> + 𝐶</span>
                            <div className="border-t-1 border-black w-36 mx-auto mt-1 pt-1"></div>
                            <div className="text-sm">3</div>
                          </div>
                          <div className="mt-1 text-[9px] text-green-600 dark:text-green-400 font-medium">
                            Beautiful, professional formatting
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom Badge */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="bg-primary text-primary-foreground text-[10px] font-medium px-2 py-1 rounded-full">
                        EdNoteAI Advantage
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                    Benefits
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Learn Faster, Remember Longer
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                    EdNoteAI is designed to optimize your learning process and help you retain information more effectively.
                  </p>
                </div>
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 p-1">
                          <SquareFunction className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Professional LaTeX Formatting</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Mathematical equations, formulas, and scientific notation are automatically rendered in beautiful LaTeX format, making your study materials look polished and more refined. No need to manually type equations or formulas in LaTeX notation!
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 p-1">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Save 70% of Study Time</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Stop taking manual notes and rewatching videos. Our AI does the heavy lifting so you can focus on understanding.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 p-1">
                          <GraduationCap className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Academic-Grade Quality</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Notes are structured and formatted using proven academic standards, making them perfect for research, assignments, and professional use.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <LandingPricing />

        {/* Chrome Extension Section */}
        <section className="w-full bg-muted/50 py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="inline-block rounded-lg bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm text-blue-700 dark:text-blue-300 font-medium">
                      Coming Soon
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    <div className="flex items-center gap-2">
                      <Chrome className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" /> 
                      <span>Chrome Extension</span>
                    </div>
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                    Watch any video freely while our AI automatically transcribes and takes notes in the background.
                  </p>
                </div>
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 p-1">
                          <FileVideo2 className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Any Video, Anywhere</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Works with YouTube, Coursera, Zoom recordings, and any video playing in your browser.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 p-1">
                          <Atom className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Hands-Free Learning</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Focus entirely on watching and understanding while our AI handles note-taking automatically.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 p-1">
                          <Workflow className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Seamless Integration</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Notes sync directly to your EdNoteAI library with the same high-quality formatting and LaTeX support.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="mx-auto aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 border sm:w-full lg:order-last flex items-center justify-center">
                {/* Chrome Extension Mockup */}
                <div className="relative w-full h-full p-6">
                  <div className="absolute inset-6 bg-white/95 dark:bg-gray-900/95 rounded-lg shadow-xl border">
                    {/* Browser Window Mockup */}
                    <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 rounded px-2 py-1 mx-4">
                          📹 youtube.com/watch?v=...
                        </div>
                      </div>
                    </div>
                    
                    {/* Video Player Area */}
                    <div className="p-4 space-y-3">
                      <div className="bg-black rounded aspect-video flex items-center justify-center">
                        <div className="text-white text-xs">▶️ Video Playing</div>
                      </div>
                      
                      {/* Extension Popup */}
                      <div className="absolute top-16 right-8 bg-primary text-primary-foreground rounded-lg p-3 shadow-lg max-w-48">
                        <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          EdNoteAI Extension
                        </div>
                        <div className="text-[10px] opacity-90 mb-2">
                          🎯 Auto-transcribing...
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 bg-primary-foreground/20 rounded">
                            <div className="h-full bg-primary-foreground/80 rounded w-3/4"></div>
                          </div>
                          <div className="text-[9px] opacity-75">
                            Taking notes in background
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute top-4 left-4 text-blue-500 dark:text-blue-400 opacity-60">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2L3 7v11h14V7l-7-5z"/>
                    </svg>
                  </div>
                  <div className="absolute bottom-4 right-4 text-purple-500 dark:text-purple-400 opacity-60">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Ready to Transform Your Learning Experience?
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  Join other students and educators who are already saving time and improving their learning
                  outcomes.
                </p>
              </div>
              <div className="mx-auto w-full max-w-sm space-y-2">
                <form className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button type="submit" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t bg-background">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-10 px-4 sm:px-6 lg:px-8 md:h-24 md:flex-row md:py-0">
          <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">EdNoteAI</span>
            <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
              BETA
            </span>
          </Link>
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} EdNoteAI. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="/terms" className="text-sm font-medium hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm font-medium hover:underline underline-offset-4">
              Privacy
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

function HeaderActions() {
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (auth.loading) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-4 w-16 animate-pulse bg-muted rounded" />
        <div className="h-9 w-20 animate-pulse bg-muted rounded" />
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/dashboard/library" className="text-sm font-medium hover:underline underline-offset-4">
          Library
        </Link>
        <Link href="/dashboard/account" className="text-sm font-medium hover:underline underline-offset-4">
          Account
        </Link>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
        Sign In
      </Link>
      <Button onClick={() => router.push('/login')}>
        Get Started
      </Button>
    </div>
  );
}

function TryForFreeButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()
  const auth = useAuth()

  const handleTryForFree = () => {
    if (auth.loading) {
      return; // Don't do anything while checking auth state
    }
    
    if (auth.isAuthenticated) {
      router.push('/dashboard/library');
    } else {
      router.push('/login');
    }
  }

  return (
    <>
      <Button size="lg" className="gap-1" onClick={handleTryForFree} disabled={auth.loading}>
        {auth.loading ? 'Loading...' : 'Try for Free'} <ArrowRight className="h-4 w-4" />
      </Button>

      {isModalOpen && <FileUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
    </>
  )
}