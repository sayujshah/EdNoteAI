"use client";

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen, Lock, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

// Force dynamic rendering - disable static generation
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // For password reset, we always want to show the form
    // Users only arrive here through password reset links
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log("Reset password page - session check:", session?.user?.id)
        
        if (session?.user) {
          // User has a valid session from the reset link - show the form
          setValidSession(true)
        } else {
          // No session means invalid/expired link
          setValidSession(false)
        }
      } catch (error) {
        console.error("Error checking session:", error)
        setValidSession(false)
      }
    }

    // Listen for auth state changes (optional, mainly for cleanup)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change on reset page:", event)
      
      if (event === "SIGNED_OUT") {
        router.push("/login")
      }
    })

    // Only run if we're in the browser
    if (typeof window !== 'undefined') {
      checkInitialSession()
    }

    return () => subscription.unsubscribe()
  }, [router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      console.log("Attempting to update password...")
      
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error("Password reset error:", error)
        setError(error.message)
      } else {
        console.log("Password updated successfully")
        setSuccess(true)
        
        // Sign out the user after password reset to force fresh login
        await supabase.auth.signOut()
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/login?message=password_reset_success")
        }, 3000)
      }
    } catch (err) {
      console.error("Password reset error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">EdNoteAI</span>
              <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
                BETA
              </span>
            </Link>
            <Link href="/login" className="flex items-center gap-1 text-sm font-medium hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </header>
        <main className="flex-1">
          <div className="container mx-auto flex items-center justify-center py-12 md:py-24">
            <div className="w-full max-w-md space-y-6">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-green-600">Password Reset Successful!</CardTitle>
                  <CardDescription>
                    Your password has been successfully updated. You will be redirected to the login page in a few seconds.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button asChild className="w-full">
                    <Link href="/login">Go to Login Now</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (validSession === false) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">EdNoteAI</span>
              <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
                BETA
              </span>
            </Link>
            <Link href="/login" className="flex items-center gap-1 text-sm font-medium hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </header>
        <main className="flex-1">
          <div className="container mx-auto flex items-center justify-center py-12 md:py-24">
            <div className="w-full max-w-md space-y-6">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-red-600">Invalid Password Reset Link</CardTitle>
                  <CardDescription>
                    This password reset link is invalid or has expired. Please request a new password reset from the login page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button asChild className="w-full">
                    <Link href="/login">Go to Login</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (validSession === null) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">EdNoteAI</span>
              <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
                BETA
              </span>
            </Link>
          </div>
        </header>
        <main className="flex-1">
          <div className="container mx-auto flex items-center justify-center py-12 md:py-24">
            <div className="w-full max-w-md space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Loading...</h1>
                <p className="text-muted-foreground">Verifying your password reset link</p>
              </div>
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EdNoteAI</span>
            <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
              BETA
            </span>
          </Link>
          <Link href="/login" className="flex items-center gap-1 text-sm font-medium hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto flex items-center justify-center py-12 md:py-24">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold">Reset Your Password</h1>
              <p className="text-muted-foreground">Enter your new password below</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card>
              <form onSubmit={handleResetPassword}>
                <CardHeader>
                  <CardTitle>New Password</CardTitle>
                  <CardDescription>Choose a strong password for your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="New Password"
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm New Password"
                        className="pl-10 pr-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </div>
                </CardContent>
                <CardContent>
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 