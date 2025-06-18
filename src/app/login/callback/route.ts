import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const extension = requestUrl.searchParams.get("extension")

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  if (extension === 'true') {
    // If this was initiated from the extension, redirect back to login page with extension parameter
    // This will trigger the ExtensionAuthBridge to handle the authentication
    return NextResponse.redirect(new URL("/login?extension=true&auth=success", request.url))
  } else {
    // Normal authentication - redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard/library", request.url))
  }
}