import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, amount, reason } = body

    if (!user_id || !amount) {
      return NextResponse.json(
        { error: 'User ID and amount are required' },
        { status: 400 }
      )
    }

    // Get current credits
    const { data: userData, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user_id)
      .single()

    if (fetchError) throw fetchError

    const currentCredits = userData?.credits || 0

    if (currentCredits < amount) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      )
    }

    // Deduct credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ credits: currentCredits - amount })
      .eq('user_id', user_id)

    if (updateError) throw updateError

    // Log transaction
    await supabase
      .from('credit_transactions')
      .insert({
        user_id,
        amount: -amount,
        reason: reason || 'Credit usage',
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      remaining_credits: currentCredits - amount
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Credit deduction error:', message)
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'