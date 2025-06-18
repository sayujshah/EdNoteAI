import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const extension = requestUrl.searchParams.get("extension")

  if (code) {
    const supabase = await createClient()
    
    // Exchange code for session (for sign up, sign in, OAuth)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("Auth callback error:", error)
      // Include extension parameter in error redirect if present
      const errorUrl = extension === 'true' 
        ? new URL("/login?error=auth_error&extension=true", requestUrl.origin)
        : new URL("/login?error=auth_error", requestUrl.origin)
      return NextResponse.redirect(errorUrl)
    }
    
    // Successful authentication - redirect based on source
    if (extension === 'true') {
      // If this was initiated from the extension, redirect to a special extension success page
      // This page will automatically notify the extension and close the tab
      return NextResponse.redirect(new URL("/login?extension=true&auth=success", requestUrl.origin))
    } else {
      // Normal authentication - redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard/library", requestUrl.origin))
    }
  }

  // No code provided - redirect to login
  const loginUrl = extension === 'true' 
    ? new URL("/login?error=missing_code&extension=true", requestUrl.origin)
    : new URL("/login?error=missing_code", requestUrl.origin)
  return NextResponse.redirect(loginUrl)
} 