import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store verification code in database
    const { error: insertError } = await supabase
      .from('account_deletion_requests')
      .upsert({
        user_id: user.id,
        verification_code: verificationCode,
        expires_at: expiresAt.toISOString(),
        verified: false,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to initiate account deletion. Please try again.' },
        { status: 500 }
      )
    }

    // Send verification email (Security type - always sent regardless of preferences)
    try {
      const { error: emailError } = await resend.emails.send({
        from: 'EdNoteAI Security <security@ednoteai.com>',
        to: [user.email!],
        subject: 'Account Deletion Verification - Action Required',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #dc2626; margin: 0; font-size: 24px;">Account Deletion Request</h1>
              </div>
              
              <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
                We received a request to delete your EdNoteAI account. To proceed with this action, please use the verification code below:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f3f4f6; border: 2px dashed #dc2626; padding: 20px; border-radius: 8px; display: inline-block;">
                  <span style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 4px;">${verificationCode}</span>
                </div>
              </div>
              
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">⚠️ Important Warning</h3>
                <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
                  This action will permanently delete your account and all associated data including:
                  <br>• All uploaded media files
                  <br>• Generated notes and transcriptions
                  <br>• Account preferences and settings
                  <br>• Subscription information
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 20px 0;">
                This verification code will expire in <strong>15 minutes</strong>. If you did not request this deletion, please ignore this email and contact our support team immediately.
              </p>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  EdNoteAI Security Team<br>
                  If you need assistance, reply to this email or contact support@ednoteai.com
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
Account Deletion Verification - EdNoteAI

We received a request to delete your EdNoteAI account.

Your verification code is: ${verificationCode}

⚠️ IMPORTANT WARNING:
This action will permanently delete your account and all associated data including:
- All uploaded media files  
- Generated notes and transcriptions
- Account preferences and settings
- Subscription information

This verification code will expire in 15 minutes.

If you did not request this deletion, please ignore this email and contact our support team immediately.

EdNoteAI Security Team
Need help? Contact support@ednoteai.com
        `
      })

      if (emailError) {
        console.error('Email error:', emailError)
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your email address.',
        email: user.email,
        expiresIn: 15 // minutes
      })

    } catch (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Account deletion initiation error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
} 