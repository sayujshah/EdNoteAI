import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import Head from "next/head"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { HeaderNav } from "@/components/HeaderNav"
import LayoutWithHeader from "@/components/LayoutWithHeader"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "EdNoteAI: AI Transcription & Note Taking Service",
  description:
    "Transform your meetings, lectures, and audio into accurate notes with EdNoteAI. Fast, secure, and affordable AI transcription and note taking for students and professionals.",
}

function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-10 px-4 sm:px-6 lg:px-8 md:h-24 md:flex-row md:py-0">
        <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BookOpen className="h-6 w-6 text-primary" aria-label="EdNoteAI Logo" />
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
          <Link href="/cookies" className="text-sm font-medium hover:underline underline-offset-4">
            Cookies
          </Link>
          <Link href="/contact" className="text-sm font-medium hover:underline underline-offset-4">
            Contact
          </Link>
          <Link href="/blog" className="text-sm font-medium hover:underline underline-offset-4">
            Blog
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        {/* Primary Meta Tags */}
        <title>EdNoteAI: AI Transcription & Note Taking Service</title>
        <meta name="description" content="Transform your meetings, lectures, and audio into accurate notes with EdNoteAI. Fast, secure, and affordable AI transcription and note taking for students and professionals." />
        <meta name="keywords" content="ai transcription, ai note taking, automatic transcription, meeting transcription, audio to text, AI note taker, lecture transcription, voice notes AI, transcription service, AI meeting notes, best ai transcription for students, ai note taking for professionals, secure ai transcription, affordable ai transcription, real-time ai transcription" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://ednoteai.com/" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ednoteai.com/" />
        <meta property="og:title" content="EdNoteAI: AI Transcription & Note Taking Service" />
        <meta property="og:description" content="Transform your meetings, lectures, and audio into accurate notes with EdNoteAI." />
        <meta property="og:image" content="https://ednoteai.com/og-image.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://ednoteai.com/" />
        <meta name="twitter:title" content="EdNoteAI: AI Transcription & Note Taking Service" />
        <meta name="twitter:description" content="Transform your meetings, lectures, and audio into accurate notes with EdNoteAI." />
        <meta name="twitter:image" content="https://ednoteai.com/og-image.png" />

        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "EdNoteAI",
          "url": "https://ednoteai.com/",
          "applicationCategory": "Productivity",
          "operatingSystem": "All",
          "offers": {
            "@type": "Offer",
            "price": "9.99",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "120"
          }
        }` }} />
      </Head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <LayoutWithHeader>{children}</LayoutWithHeader>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
