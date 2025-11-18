import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseBrowserClient, checkUserCredits } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Get auth token from header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth token provided' },
        { status: 401 }
      )
    }

    // SECURITY: Verify the token is valid
    const token = authHeader.substring(7)
    const supabase = createSupabaseBrowserClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Get user's credit balance
    const { current } = await checkUserCredits(user.id, 0)

    return NextResponse.json({
      credits: current,
      user_id: user.id
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Get balance error:', message)
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
