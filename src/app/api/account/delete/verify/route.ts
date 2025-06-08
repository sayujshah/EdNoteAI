import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { verificationCode } = await request.json()

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Verification code is required' },
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

    // Find and verify the deletion request
    const { data: deletionRequest, error: fetchError } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('verification_code', verificationCode)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (fetchError || !deletionRequest) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Mark the request as verified
    const { error: updateError } = await supabase
      .from('account_deletion_requests')
      .update({
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', deletionRequest.id)

    if (updateError) {
      console.error('Failed to mark deletion request as verified:', updateError)
      return NextResponse.json(
        { error: 'Failed to process verification' },
        { status: 500 }
      )
    }

    // Create admin client with service role key for user deletion
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Clean up user data following Supabase best practices
    // Order matters due to foreign key constraints
    try {
      console.log(`Starting deletion process for user: ${user.id}`)

      // 1. Delete Storage objects first (as per Supabase docs)
      // Users cannot be deleted if they own Storage objects
      try {
        const { data: storageObjects, error: storageListError } = await supabaseAdmin
          .storage
          .from('user-uploads') // Adjust bucket name as needed  
          .list(user.id)

        if (!storageListError && storageObjects && storageObjects.length > 0) {
          const filePaths = storageObjects.map(obj => `${user.id}/${obj.name}`)
          const { error: storageDeleteError } = await supabaseAdmin
            .storage
            .from('user-uploads')
            .remove(filePaths)

          if (storageDeleteError) {
            console.error('Failed to delete storage objects:', storageDeleteError)
          } else {
            console.log(`Deleted ${filePaths.length} storage objects`)
          }
        }
      } catch (storageError) {
        console.log('No storage objects found or storage bucket does not exist')
      }

      // 2. Delete child records first (due to foreign key constraints)
      
      // Delete notes (references transcripts and users)
      const { error: notesError } = await supabaseAdmin
        .from('notes')
        .delete()
        .eq('user_id', user.id)

      if (notesError) {
        console.error('Failed to delete notes:', notesError)
      } else {
        console.log('Deleted user notes')
      }

      // Delete transcripts (references videos) - will cascade delete notes
      const { data: userVideos } = await supabaseAdmin
        .from('videos')
        .select('id')
        .eq('user_id', user.id)

      if (userVideos && userVideos.length > 0) {
        const videoIds = userVideos.map(v => v.id)
        const { error: transcriptsError } = await supabaseAdmin
          .from('transcripts')
          .delete()
          .in('video_id', videoIds)

        if (transcriptsError) {
          console.error('Failed to delete transcripts:', transcriptsError)
        } else {
          console.log('Deleted user transcripts')
        }
      }

      // Delete saved notes
      const { error: savedNotesError } = await supabaseAdmin
        .from('saved_notes')
        .delete()
        .eq('user_id', user.id)

      if (savedNotesError) {
        console.error('Failed to delete saved notes:', savedNotesError)
      } else {
        console.log('Deleted saved notes')
      }

      // Delete payment history
      const { error: paymentHistoryError } = await supabaseAdmin
        .from('payment_history')
        .delete()
        .eq('user_id', user.id)

      if (paymentHistoryError) {
        console.error('Failed to delete payment history:', paymentHistoryError)
      } else {
        console.log('Deleted payment history')
      }

      // Delete user usage records
      const { error: userUsageError } = await supabaseAdmin
        .from('user_usage')
        .delete()
        .eq('user_id', user.id)

      if (userUsageError) {
        console.error('Failed to delete user usage:', userUsageError)
      } else {
        console.log('Deleted user usage records')
      }

      // Delete user subscriptions
      const { error: subscriptionsError } = await supabaseAdmin
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id)

      if (subscriptionsError) {
        console.error('Failed to delete user subscriptions:', subscriptionsError)
      } else {
        console.log('Deleted user subscriptions')
      }

      // Delete user settings
      const { error: settingsError } = await supabaseAdmin
        .from('user_settings')
        .delete()
        .eq('user_id', user.id)

      if (settingsError) {
        console.error('Failed to delete user settings:', settingsError)
      } else {
        console.log('Deleted user settings')
      }

      // Delete videos (after transcripts and notes are deleted)
      const { error: videosError } = await supabaseAdmin
        .from('videos')
        .delete()
        .eq('user_id', user.id)

      if (videosError) {
        console.error('Failed to delete videos:', videosError)
      } else {
        console.log('Deleted user videos')
      }

      // Delete password change requests
      const { error: passwordRequestsError } = await supabaseAdmin
        .from('password_change_requests')
        .delete()
        .eq('user_id', user.id)

      if (passwordRequestsError) {
        console.error('Failed to delete password change requests:', passwordRequestsError)
      } else {
        console.log('Deleted password change requests')
      }

      // Delete account deletion requests
      const { error: deletionRequestsError } = await supabaseAdmin
        .from('account_deletion_requests')
        .delete()
        .eq('user_id', user.id)

      if (deletionRequestsError) {
        console.error('Failed to delete account deletion requests:', deletionRequestsError)
      } else {
        console.log('Deleted account deletion requests')
      }

      // 3. Finally, delete the auth user using Admin API (as per Supabase docs)
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

      if (authDeleteError) {
        console.error('Failed to delete auth user:', authDeleteError)
        throw new Error('Failed to delete user account')
      }

      console.log('Successfully deleted auth user')

    } catch (dataCleanupError) {
      console.error('Data cleanup error:', dataCleanupError)
      return NextResponse.json(
        { error: 'Failed to complete account deletion. Please contact support.' },
        { status: 500 }
      )
    }

    // Sign out the user from current session
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.error('Sign out error:', signOutError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Account deletion processed successfully. You have been signed out.'
    })

  } catch (error) {
    console.error('Account deletion verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
} 