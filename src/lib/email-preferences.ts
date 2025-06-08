import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type EmailType = 'marketing' | 'product_updates' | 'security' | 'system'

export interface EmailPreferences {
  marketing_emails: boolean
  product_updates: boolean
  security_notifications: boolean
}

/**
 * Check if a user has opted in to receive a specific type of email
 * Security emails are always allowed regardless of preferences
 */
export async function canSendEmail(userId: string, emailType: EmailType): Promise<boolean> {
  // Security emails are always allowed (MFA codes, password resets, etc.)
  if (emailType === 'security' || emailType === 'system') {
    return true
  }

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
        },
      }
    )

    // Get user's email preferences
    const { data: preferences, error } = await supabase
      .from('email_preferences')
      .select('marketing_emails, product_updates, security_notifications')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If we can't fetch preferences, allow the email to be safe
      console.warn('Could not fetch email preferences for user:', userId, error)
      return true
    }

    // Check the specific preference
    switch (emailType) {
      case 'marketing':
        return preferences?.marketing_emails ?? true
      case 'product_updates':
        return preferences?.product_updates ?? true
      default:
        return true
    }

  } catch (error) {
    console.error('Error checking email preferences:', error)
    // Default to allowing the email if there's an error
    return true
  }
}

/**
 * Get all email preferences for a user
 */
export async function getUserEmailPreferences(userId: string): Promise<EmailPreferences | null> {
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
        },
      }
    )

    const { data: preferences, error } = await supabase
      .from('email_preferences')
      .select('marketing_emails, product_updates, security_notifications')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.warn('Could not fetch email preferences for user:', userId, error)
      return null
    }

    return preferences
  } catch (error) {
    console.error('Error fetching email preferences:', error)
    return null
  }
} 