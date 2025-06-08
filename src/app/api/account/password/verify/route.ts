import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { verificationCode, newPassword } = await request.json()

    if (!verificationCode || !newPassword) {
      return NextResponse.json(
        { error: 'Verification code and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
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

    // Find and verify the password change request
    const { data: passwordRequest, error: fetchError } = await supabase
      .from('password_change_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('verification_code', verificationCode)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (fetchError || !passwordRequest) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Mark the request as verified
    const { error: updateError } = await supabase
      .from('password_change_requests')
      .update({
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', passwordRequest.id)

    if (updateError) {
      console.error('Failed to mark password request as verified:', updateError)
      return NextResponse.json(
        { error: 'Failed to process verification' },
        { status: 500 }
      )
    }

    // Update the user's password
    const { error: passwordUpdateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (passwordUpdateError) {
      console.error('Failed to update password:', passwordUpdateError)
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      )
    }

    // Clean up old password change requests for this user
    const { error: cleanupError } = await supabase
      .from('password_change_requests')
      .delete()
      .eq('user_id', user.id)

    if (cleanupError) {
      console.error('Failed to cleanup password requests:', cleanupError)
      // Don't fail the request for cleanup issues
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Password change verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
} 