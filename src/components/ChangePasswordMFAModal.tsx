'use client'

import { useState } from 'react'
import { X, Key, Mail, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ChangePasswordMFAModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 'password' | 'verify' | 'processing' | 'complete'

export default function ChangePasswordMFAModal({ isOpen, onClose }: ChangePasswordMFAModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('password')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds

  const resetModal = () => {
    setCurrentStep('password')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
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

  const validatePassword = () => {
    if (!currentPassword) {
      setError('Please enter your current password')
      return false
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      return false
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return false
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from your current password')
      return false
    }
    return true
  }

  const handleInitiatePasswordChange = async () => {
    if (!validatePassword()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/account/password/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          currentPassword 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate password change')
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

  const handleVerifyAndChangePassword = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/account/password/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          verificationCode, 
          newPassword 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify code')
      }

      setCurrentStep('processing')
      
      // Show processing and completion
      setTimeout(() => {
        setCurrentStep('complete')
        setTimeout(() => {
          resetModal()
        }, 3000)
      }, 1500)

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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={currentStep === 'password' ? resetModal : undefined} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold">Change Password</h2>
          </div>
          {currentStep === 'password' && (
            <Button variant="ghost" size="icon" onClick={resetModal}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'password' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Change Your Password</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter your current password and choose a new one. We'll send a verification code to confirm the change.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium mb-2">
                    Current Password
                  </label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value)
                      setError('')
                    }}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium mb-2">
                    New Password
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setError('')
                    }}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setError('')
                    }}
                    disabled={loading}
                  />
                </div>

                <div className="text-xs text-gray-500">
                  New password must be at least 8 characters long and different from your current password
                </div>
              </div>

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
                  className="flex-1" 
                  onClick={handleInitiatePasswordChange}
                  disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Send Verification'
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
                  className="flex-1" 
                  onClick={handleVerifyAndChangePassword}
                  disabled={loading || verificationCode.length !== 6 || timeLeft === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
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
                <h3 className="text-lg font-medium mb-2">Updating Password</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please wait while we securely update your password...
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
                <h3 className="text-lg font-medium mb-2">Password Updated Successfully</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your password has been changed. Please use your new password for future sign-ins.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 