'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EmailPreferencesModalProps {
  isOpen: boolean
  onClose: () => void
}

interface EmailPreferences {
  marketing_emails: boolean
  product_updates: boolean
  security_notifications: boolean
}

export default function EmailPreferencesModal({ isOpen, onClose }: EmailPreferencesModalProps) {
  const [preferences, setPreferences] = useState<EmailPreferences>({
    marketing_emails: true,
    product_updates: true,
    security_notifications: true
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Load current preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPreferences()
    }
  }, [isOpen])

  const loadPreferences = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/email-preferences')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load preferences')
      }

      if (result.preferences) {
        setPreferences(result.preferences)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/email-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save preferences')
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const resetModal = () => {
    setError('')
    setSuccess(false)
    onClose()
  }

  const handlePreferenceChange = (key: keyof EmailPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={resetModal} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold">Email Preferences</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={resetModal}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading your preferences...</p>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Preferences Updated!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your email preferences have been saved successfully.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Manage Your Email Communications</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose which types of emails you'd like to receive from EdNoteAI.
                </p>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Marketing Emails */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">Marketing & Promotional Emails</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Special offers, feature announcements, and educational content
                    </p>
                  </div>
                  <Switch
                    checked={preferences.marketing_emails}
                    onCheckedChange={(value) => handlePreferenceChange('marketing_emails', value)}
                    disabled={saving}
                  />
                </div>

                {/* Product Updates */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">Product Updates</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      New features, improvements, and service notifications
                    </p>
                  </div>
                  <Switch
                    checked={preferences.product_updates}
                    onCheckedChange={(value) => handlePreferenceChange('product_updates', value)}
                    disabled={saving}
                  />
                </div>

                {/* Security Notifications */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/10">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      Security & Account Notifications
                      <Info className="h-3 w-3 text-blue-600" />
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      MFA codes, password changes, and critical security alerts
                    </p>
                  </div>
                  <Switch
                    checked={preferences.security_notifications}
                    onCheckedChange={(value) => handlePreferenceChange('security_notifications', value)}
                    disabled={true}
                  />
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Important:</strong> Security notifications cannot be disabled as they are essential for account protection and include MFA verification codes.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={resetModal} disabled={saving}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={savePreferences}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 