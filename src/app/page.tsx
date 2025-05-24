'use client';

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BookOpen, Clock, FileText, Upload, Zap } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

import { Button } from "@/components/ui/button"
import { FileUploadModal } from "@/components/file-upload-modal"

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
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl bg-muted">
                  <Image
                    src="/placeholder.svg?height=700&width=700"
                    width={700}
                    height={700}
                    alt="EdNoteAI Dashboard Preview"
                    className="object-cover"
                  />
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
                  Transform transcriptions into structured academic notes with key concepts highlighted.
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
              <Image
                src="/placeholder.svg?height=550&width=550"
                width={550}
                height={550}
                alt="Student studying with EdNoteAI"
                className="mx-auto aspect-square overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
              />
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
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  Pricing
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Simple, Transparent Pricing</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  Choose the plan that fits your learning needs
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
              <div className="flex flex-col rounded-lg border bg-background p-6 shadow-sm">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-2xl font-bold">Free</h3>
                  <p className="text-muted-foreground">Perfect for trying out EdNoteAI</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                <ul className="my-6 space-y-2">
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>3 transcriptions per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Files up to 10 minutes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Basic note formatting</span>
                  </li>
                </ul>
                <Button variant="outline" className="mt-auto">
                  Get Started
                </Button>
              </div>
              <div className="relative flex flex-col rounded-lg border bg-background p-6 shadow-sm">
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
                <div className="flex flex-col space-y-2">
                  <h3 className="text-2xl font-bold">Student</h3>
                  <p className="text-muted-foreground">For serious learners</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">$9.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                <ul className="my-6 space-y-2">
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Unlimited transcriptions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Files up to 2 hours</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Advanced academic notes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Key concept highlighting</span>
                  </li>
                </ul>
                <Button className="mt-auto">Subscribe Now</Button>
              </div>
              <div className="flex flex-col rounded-lg border bg-background p-6 shadow-sm">
                <div className="flex flex-col space-y-2">
                  <h3 className="text-2xl font-bold">Professional</h3>
                  <p className="text-muted-foreground">For educators and professionals</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">$14.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                <ul className="my-6 space-y-2">
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Everything in Student plan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Files up to 8 hours</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Custom branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Priority processing</span>
                  </li>
                </ul>
                <Button variant="outline" className="mt-auto">
                  Subscribe Now
                </Button>
              </div>
            </div>
          </div>
        </section>

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