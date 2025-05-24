'use client';

import Link from "next/link"
import { ArrowRight, BookOpen, Clock, FileText, Upload, Zap } from "lucide-react"
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
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EdNoteAI</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary">
              How It Works
            </Link>
            <Link href="#benefits" className="text-sm font-medium hover:text-primary">
              Benefits
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
          </nav>
          <HeaderActions />
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
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
                  <Button size="lg" variant="outline">
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
                      <p className="text-xs font-medium">Transcription complete: 98% accuracy</p>
                      <div className="mt-1 h-2 w-full rounded-full bg-muted">
                        <div className="h-full w-[98%] rounded-full bg-primary" />
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
          <div className="container px-4 md:px-6">
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
          <div className="container px-4 md:px-6">
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
                      Our AI transcribes your content with high accuracy, identifying speakers and key sections.
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
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
              <div className="mx-auto aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-950 dark:via-blue-950 dark:to-purple-950 border sm:w-full lg:order-last flex items-center justify-center">
                {/* Study/Learning Illustration */}
                <div className="relative w-full h-full p-8">
                  <div className="absolute inset-8 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow-lg p-6 flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-center space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <div className="h-2 bg-primary/20 rounded"></div>
                      <div className="h-2 bg-primary/40 rounded"></div>
                      <div className="h-2 bg-primary/60 rounded"></div>
                      <div className="h-2 bg-primary/80 rounded"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    </div>
                  </div>
                  {/* Floating elements for visual interest */}
                  <div className="absolute top-4 right-4 w-3 h-3 bg-yellow-400 rounded-full opacity-60"></div>
                  <div className="absolute bottom-4 left-4 w-2 h-2 bg-pink-400 rounded-full opacity-60"></div>
                  <div className="absolute top-1/3 left-4 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
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
                    EdNoteAI is designed to optimize your learning process and help you retain information more
                    effectively.
                  </p>
                </div>
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 p-1">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Save 70% of Study Time</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Stop taking manual notes and rewatching videos. Our AI does the heavy lifting so you can focus
                        on understanding.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 p-1">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Accelerate Learning</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Our structured notes highlight key concepts and connections, helping you grasp complex topics
                        faster.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 p-1">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Improve Retention</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Notes are formatted using proven memory techniques to help you remember information for longer
                        periods.
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

        {/* CTA Section */}
        <section className="w-full bg-muted/50 py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Ready to Transform Your Learning Experience?
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  Join thousands of students and educators who are already saving time and improving their learning
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
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">EdNoteAI</span>
          </Link>
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} EdNoteAI. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
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