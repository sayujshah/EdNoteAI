import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, verificationCode, newPassword } = await request.json()

    if (!email || !verificationCode || !newPassword) {
      return NextResponse.json(
        { error: 'Email, verification code, and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Verify the code
    const { data, error: selectError } = await supabase
      .from('password_change_requests')
      .select('*')
      .eq('request_email', email)
      .eq('verification_code', verificationCode)
      .eq('verified', false)
      .eq('request_type', 'password_reset')
      .single()

    if (selectError || !data) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Check if code has expired
    const expiresAt = new Date(data.expires_at)
    const now = new Date()
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      )
    }

    // Get the user
    const { data: userListData, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error('User lookup error:', userError)
      return NextResponse.json(
        { error: 'Failed to process password reset' },
        { status: 500 }
      )
    }

    const user = userListData.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      )
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Mark verification as used
    const { error: markUsedError } = await supabase
      .from('password_change_requests')
      .update({ verified: true })
      .eq('id', data.id)

    if (markUsedError) {
      console.error('Error marking verification as used:', markUsedError)
      // Don't fail the request if this fails - password was already updated
    }

    // Clean up old/expired requests for this user
    await supabase
      .from('password_change_requests')
      .delete()
      .eq('user_id', user.id)
      .neq('id', data.id)

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.'
    })

  } catch (error) {
    console.error('Password reset verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
} 