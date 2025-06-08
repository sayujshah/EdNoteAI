import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

    // Get user's email preferences
    const { data: preferences, error: fetchError } = await supabase
      .from('email_preferences')
      .select('marketing_emails, product_updates, security_notifications')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching email preferences:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch email preferences' },
        { status: 500 }
      )
    }

    // If no preferences exist, return defaults (this should rarely happen due to trigger)
    if (!preferences) {
      return NextResponse.json({
        success: true,
        preferences: {
          marketing_emails: true,
          product_updates: true,
          security_notifications: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      preferences
    })

  } catch (error) {
    console.error('Email preferences fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { marketing_emails, product_updates, security_notifications } = await request.json()

    // Validate required fields
    if (typeof marketing_emails !== 'boolean' || 
        typeof product_updates !== 'boolean' || 
        typeof security_notifications !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid preference values. All fields must be boolean.' },
        { status: 400 }
      )
    }

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

    // Update or insert email preferences
    const { error: upsertError } = await supabase
      .from('email_preferences')
      .upsert({
        user_id: user.id,
        marketing_emails,
        product_updates,
        security_notifications: true, // Always force security notifications to true
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Error updating email preferences:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update email preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email preferences updated successfully',
      preferences: {
        marketing_emails,
        product_updates,
        security_notifications: true
      }
    })

  } catch (error) {
    console.error('Email preferences update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 