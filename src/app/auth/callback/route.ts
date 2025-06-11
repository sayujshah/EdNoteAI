import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    
    // Exchange code for session (for sign up, sign in, OAuth)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(new URL("/login?error=auth_error", requestUrl.origin))
    }
    
    // Successful authentication - redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard/library", requestUrl.origin))
  }

  // No code provided - redirect to login
  return NextResponse.redirect(new URL("/login?error=missing_code", requestUrl.origin))
} 