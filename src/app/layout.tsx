import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import AuthGuard from "@/components/AuthGuard"
import ExtensionAuthBridge from "@/components/ExtensionAuthBridge"

import Link from "next/link"
import { BookOpen } from "lucide-react"
import { HeaderNav } from "@/components/HeaderNav"
import LayoutWithHeader from "@/components/LayoutWithHeader"
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EdNoteAI - AI-Powered Note Taking",
  description: "Transform your learning with AI-generated notes from videos, lectures, and audio content. Save time and enhance comprehension with intelligent summaries.",
  keywords: "AI notes, video transcription, lecture notes, study tools, AI-powered learning",
  authors: [{ name: "EdNoteAI Team" }],
  creator: "EdNoteAI",
  publisher: "EdNoteAI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "EdNoteAI - AI-Powered Note Taking",
    description: "Transform your learning with AI-generated notes from videos, lectures, and audio content.",
    url: "https://ednoteai.com",
    siteName: "EdNoteAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EdNoteAI - AI-Powered Note Taking",
    description: "Transform your learning with AI-generated notes from videos, lectures, and audio content.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <AuthGuard>
              <LayoutWithHeader>{children}</LayoutWithHeader>
            </AuthGuard>
            <ExtensionAuthBridge />
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
