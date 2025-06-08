import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("Auth callback error:", error)
      // Redirect to login with error
      return NextResponse.redirect(new URL("/login?error=auth_error", requestUrl.origin))
    }
  }

  // Determine where to redirect based on auth type
  if (type === "recovery") {
    // Password reset flow - redirect to reset password page
    return NextResponse.redirect(new URL("/auth/reset-password", requestUrl.origin))
  } else {
    // Normal sign-in or sign-up flow - redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard/library", requestUrl.origin))
  }
} 