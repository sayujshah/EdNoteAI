'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertTriangle, Mail, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DeleteAccountMFAModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 'confirm' | 'verify' | 'processing' | 'complete'

export default function DeleteAccountMFAModal({ isOpen, onClose }: DeleteAccountMFAModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('confirm')
  const [verificationCode, setVerificationCode] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds
  const router = useRouter()

  const resetModal = () => {
    setCurrentStep('confirm')
    setVerificationCode('')
    setEmail('')
    setError('')
    setTimeLeft(15 * 60)
    onClose()
  }

  const startTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleInitiateDeletion = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/account/delete/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate account deletion')
      }

      setEmail(result.email)
      setCurrentStep('verify')
      startTimer()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/account/delete/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verificationCode }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify code')
      }

      setCurrentStep('processing')
      
      // Simulate processing time and redirect
      setTimeout(() => {
        setCurrentStep('complete')
        setTimeout(() => {
          router.push('/')
        }, 3000)
      }, 2000)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={currentStep === 'confirm' ? resetModal : undefined} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold">Delete Account</h2>
          </div>
          {currentStep === 'confirm' && (
            <Button variant="ghost" size="icon" onClick={resetModal}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'confirm' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Are you absolutely sure?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action cannot be undone. This will permanently delete your account and all associated data.
                </p>
              </div>

              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <strong>This will permanently delete:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>All uploaded media files</li>
                    <li>Generated notes and transcriptions</li>
                    <li>Account preferences and settings</li>
                    <li>Subscription information</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {error && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={resetModal}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1" 
                  onClick={handleInitiateDeletion}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Yes, Delete Account'
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Check Your Email</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We've sent a 6-digit verification code to:
                </p>
                <p className="font-medium text-blue-600 dark:text-blue-400 mt-1">
                  {email}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="verification-code" className="block text-sm font-medium mb-2">
                    Verification Code
                  </label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setVerificationCode(value)
                      setError('')
                    }}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>

                <div className="text-center text-sm text-gray-500">
                  {timeLeft > 0 ? (
                    <p>Code expires in: <span className="font-mono">{formatTime(timeLeft)}</span></p>
                  ) : (
                    <p className="text-red-600">Verification code has expired</p>
                  )}
                </div>

                {error && (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={resetModal}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1" 
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6 || timeLeft === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Delete'
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'processing' && (
            <div className="text-center space-y-6 py-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Processing Account Deletion</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please wait while we securely delete your account and all associated data...
                </p>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-6 py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Account Deleted Successfully</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your account and all associated data have been permanently deleted.
                  <br />
                  Redirecting you to the home page...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 