import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { canSendEmail } from '@/lib/email-preferences'

const resend = new Resend(process.env.RESEND_API_KEY)

// This is an example endpoint for sending marketing emails
// It demonstrates how to check email preferences before sending
export async function POST(request: NextRequest) {
  try {
    const { announcementType, subject, content } = await request.json()

    if (!announcementType || !subject || !content) {
      return NextResponse.json(
        { error: 'Announcement type, subject, and content are required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin operations
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get all users who have opted in to receive this type of email
    let emailType: 'marketing' | 'product_updates'
    
    if (announcementType === 'feature' || announcementType === 'improvement') {
      emailType = 'product_updates'
    } else {
      emailType = 'marketing'
    }

    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    let sentCount = 0
    let skippedCount = 0
    const errors: string[] = []

    // Send emails to users who have opted in
    for (const user of users.users) {
      if (!user.email) continue

      try {
        // Check if we can send this type of email to this user
        const canSend = await canSendEmail(user.id, emailType)
        
        if (!canSend) {
          skippedCount++
          console.log(`Skipped sending ${emailType} email to user ${user.id} - opted out`)
          continue
        }

        // Send the email
        const { error: emailError } = await resend.emails.send({
          from: 'EdNoteAI <announcements@ednoteai.com>',
          to: [user.email],
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #333; margin: 0; font-size: 24px;">${subject}</h1>
                </div>
                
                <div style="color: #333; line-height: 1.6; margin-bottom: 30px;">
                  ${content.replace(/\n/g, '<br>')}
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                  <p style="color: #666; font-size: 12px; margin: 0;">
                    You're receiving this because you've opted in to receive ${emailType === 'marketing' ? 'marketing' : 'product update'} emails.<br>
                    You can manage your email preferences in your <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/account" style="color: #007bff;">account settings</a>.
                  </p>
                </div>
              </div>
            </div>
          `,
          text: `
${subject}

${content}

---
You're receiving this because you've opted in to receive ${emailType === 'marketing' ? 'marketing' : 'product update'} emails.
You can manage your email preferences in your account settings: ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/account
          `
        })

        if (emailError) {
          console.error(`Error sending email to ${user.email}:`, emailError)
          errors.push(`Failed to send to ${user.email}: ${emailError.message}`)
        } else {
          sentCount++
        }

      } catch (error: any) {
        console.error(`Error processing user ${user.id}:`, error)
        errors.push(`Error processing user ${user.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Email campaign completed`,
      stats: {
        sent: sentCount,
        skipped: skippedCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Marketing email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 