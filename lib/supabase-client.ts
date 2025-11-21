import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Browser client for client components
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server client for API routes (with service role key)
export function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Auth helper - verify user from request headers
export async function getAuthenticatedUser(authHeader?: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'No auth token provided' }
  }

  const token = authHeader.substring(7)
  const supabase = createSupabaseBrowserClient()

  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { user: null, error: error?.message || 'Invalid token' }
  }

  return { user, error: null }
}

// Check if user has sufficient credits
export async function checkUserCredits(userId: string, required: number) {
  const supabase = createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .single()

  if (error) {
    // If user doesn't exist in credits table, create with 0 credits
    if (error.code === 'PGRST116') {
      await supabase
        .from('user_credits')
        .insert({ user_id: userId, credits: 0 })
      return { hasCredits: false, current: 0 }
    }
    throw error
  }

  const current = data?.credits || 0
  return { hasCredits: current >= required, current }
}

// Atomic credit deduction with transaction logging
export async function deductCreditsAtomic(
  userId: string,
  amount: number,
  reason: string
) {
  const supabase = createSupabaseServerClient()

  // Check balance first
  const { hasCredits, current } = await checkUserCredits(userId, amount)
  
  if (!hasCredits) {
    return { 
      success: false, 
      error: 'Insufficient credits', 
      remaining: current,
      required: amount
    }
  }

  // Start transaction-like operation
  try {
    // Deduct credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ credits: current - amount })
      .eq('user_id', userId)

    if (updateError) throw updateError

    // Log transaction
    const { error: logError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        reason,
        created_at: new Date().toISOString()
      })

    if (logError) {
      // Rollback - add credits back
      await supabase
        .from('user_credits')
        .update({ credits: current })
        .eq('user_id', userId)
      throw logError
    }

    return { 
      success: true, 
      remaining: current - amount,
      error: null
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Transaction failed',
      remaining: current
    }
  }
}


// Export alias for compatibility
export { createSupabaseBrowserClient as createClient }
