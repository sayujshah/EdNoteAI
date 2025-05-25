import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function withAuth(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const supabase = createServerComponentClient({ cookies })
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Add user info to request for use in handler
      return await handler(req, session.user)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      )
    }
  }
}

// Helper function to get current user in API routes
export async function getCurrentUser() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
} 