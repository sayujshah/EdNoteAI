"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  return (
    <nav className="hidden md:flex gap-6">
      {isHome && (
        <>
          <Link href="/#features" className="text-sm font-medium hover:text-primary">
            Features
          </Link>
          <Link href="/#how-it-works" className="text-sm font-medium hover:text-primary">
            How It Works
          </Link>
          <Link href="/#benefits" className="text-sm font-medium hover:text-primary">
            Benefits
          </Link>
          <Link href="/#pricing" className="text-sm font-medium hover:text-primary">
            Pricing
          </Link>
        </>
      )}
      <Link href="/blog" className="text-sm font-medium hover:text-primary">
        Blog
      </Link>
      <Link href="/dashboard/library" className="text-sm font-medium hover:text-primary">
        Library
      </Link>
      <Link href="/dashboard/upload" className="text-sm font-medium hover:text-primary">
        Upload
      </Link>
    </nav>
  );
} 