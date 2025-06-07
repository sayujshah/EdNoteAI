'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Mail, Copy, ExternalLink } from 'lucide-react'

export default function DeleteAccountSupportModal({ 
  isOpen, 
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const getUserData = async () => {
      if (isOpen) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          setUserEmail(user.email || '')
        }
      }
    }
    getUserData()
  }, [isOpen])

  const handleCopyUserId = async () => {
    try {
      await navigator.clipboard.writeText(userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSendEmail = () => {
    const subject = encodeURIComponent('Account Deletion Request')
    const body = encodeURIComponent(
      `Hello EdNoteAI Support,

I would like to request the deletion of my account.

Account Details:
- Email: ${userEmail}
- User ID: ${userId}

Please delete my account and all associated data.

Thank you,
${userEmail}`
    )
    
    const mailtoLink = `mailto:support@ednoteai.com?subject=${subject}&body=${body}`
    window.location.href = mailtoLink
  }

  const handleClose = () => {
    setUserId('')
    setUserEmail('')
    setCopied(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-lg animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Request Account Deletion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Account deletion is permanent and cannot be undone. All your data will be permanently removed.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm">
              To delete your account, please email our support team with the following information:
            </p>
            
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email To:</span>
                <code className="text-sm bg-background px-2 py-1 rounded">support@ednoteai.com</code>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Email:</span>
                <code className="text-sm bg-background px-2 py-1 rounded">{userEmail}</code>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Your User ID:</span>
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-background px-2 py-1 rounded font-mono">
                    {userId.substring(0, 8)}...
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyUserId}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {copied && (
                <p className="text-xs text-green-600 text-center">User ID copied to clipboard!</p>
              )}
            </div>

            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Click "Send Email" below to open your email app with a pre-filled message to our support team.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmail}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Send Email
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 