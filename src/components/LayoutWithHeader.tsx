"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { HeaderNav } from "@/components/HeaderNav";

export default function LayoutWithHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  return (
    <>
      {!isHome && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="EdNoteAI Home">
              <BookOpen className="h-6 w-6 text-primary" aria-label="EdNoteAI Logo" />
              <span className="text-xl font-bold">EdNoteAI</span>
              <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
                BETA
              </span>
            </Link>
            <HeaderNav />
          </div>
        </header>
      )}
      {children}
    </>
  );
} 