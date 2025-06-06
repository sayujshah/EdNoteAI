"use client";

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Mail, Lock, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("signin")
  const [showResend, setShowResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setShowResend(false)
    setResendMessage(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        const msg = error.message.toLowerCase();
        if (
          msg.includes('not confirmed') ||
          msg.includes('confirm your email') ||
          msg.includes('must confirm')
        ) {
          setShowResend(true)
        }
        console.error("Login error:", error)
      } else {
        // After successful login, check subscription status
        try {
          const res = await fetch('/api/subscription/status', { credentials: 'include' });
          if (res.ok) {
            const status = await res.json();
            if (status.limits?.plan_name?.toLowerCase() === 'free') {
              router.push('/dashboard/upload');
            } else {
              router.push('/dashboard/library');
            }
          } else {
            // Fallback: go to upload if status check fails
            router.push('/dashboard/upload');
          }
        } catch {
          router.push('/dashboard/upload');
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Login error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      })

      if (error) {
        setError(error.message)
        console.error("Sign up error:", error)
      } else {
        // Check if user needs email confirmation
        if (data.user && !data.session) {
          // Email confirmation required
          alert("Sign up successful! Please check your email for confirmation.")
          setActiveTab("signin")
        } else if (data.session) {
          // User is automatically signed in (email confirmation disabled)
          router.push("/dashboard/library")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Sign up error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        console.error(`${provider} login error:`, error)
        setLoading(false)
      }
      // No need to set loading to false on success as we're redirecting
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(`${provider} login error:`, err)
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setResendLoading(true)
    setResendMessage(null)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback',
        },
      })
      if (error) {
        setResendMessage('Failed to resend confirmation email. Please try again.')
      } else {
        setResendMessage('A new confirmation email has been sent. Please check your inbox.')
      }
    } catch (err) {
      setResendMessage('An unexpected error occurred. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  const dismissError = () => {
    setError(null)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EdNoteAI</span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm font-medium hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <div className="container flex items-center justify-center py-12 md:py-24">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold">Welcome to EdNoteAI</h1>
              <p className="text-muted-foreground">Sign in or create an account to continue</p>
            </div>

            {error && (
              <Alert variant="destructive" dismissible onDismiss={dismissError}>
                <AlertDescription>{error}</AlertDescription>
                {showResend && (
                  <div className="mt-2 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResendConfirmation}
                      disabled={resendLoading}
                    >
                      {resendLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                      ) : (
                        'Resend Confirmation Email'
                      )}
                    </Button>
                    {resendMessage && (
                      <span className="text-xs text-muted-foreground">{resendMessage}</span>
                    )}
                  </div>
                )}
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <Card>
                  <form onSubmit={handleLogin}>
                    <CardHeader>
                      <CardTitle>Sign In</CardTitle>
                      <CardDescription>Enter your credentials to access your account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="Email"
                            className="pl-10"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Password"
                            className="pl-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="remember"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="remember" className="text-sm text-muted-foreground">
                            Remember me
                          </label>
                        </div>
                        <Link href="#" className="text-sm font-medium text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>

              <TabsContent value="signup">
                <Card>
                  <form onSubmit={handleSignUp}>
                    <CardHeader>
                      <CardTitle>Create Account</CardTitle>
                      <CardDescription>Enter your details to create a new account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Full Name"
                            className="pl-10"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="Email"
                            className="pl-10"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Password"
                            className="pl-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="terms"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          required
                        />
                        <label htmlFor="terms" className="text-sm text-muted-foreground">
                          I agree to the{" "}
                          <Link href="/terms" className="font-medium text-primary hover:underline">
                            Terms of Service
                          </Link>
                          ,{" "}
                          <Link href="/privacy" className="font-medium text-primary hover:underline">
                            Privacy Policy
                          </Link>
                          , and{" "}
                          <Link href="/cookies" className="font-medium text-primary hover:underline">
                            Cookies Policy
                          </Link>
                        </label>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => handleSocialLogin("google")} disabled={loading} type="button">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Google
              </Button>
              <Button variant="outline" onClick={() => handleSocialLogin("facebook")} disabled={loading} type="button">
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
                Facebook
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}