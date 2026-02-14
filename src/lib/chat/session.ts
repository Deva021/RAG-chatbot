import { createClient } from '@/lib/supabase/server'

/**
 * Get an existing session (if owned by user) or create a new one.
 */
export async function getOrCreateSession(
  userId: string,
  sessionId?: string,
  firstMessage?: string
): Promise<string> {
  const supabase = await createClient()

  // 1. Try to reuse existing session
  if (sessionId) {
    // Check ownership and existence
    const { data } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (data) {
      // Touch updated_at
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId)

      return sessionId
    }
  }

  // 2. Create new session
  // Generate title from first message or default
  let title = 'New Conversation'
  if (firstMessage) {
    title = firstMessage.slice(0, 80)
    if (firstMessage.length > 80) title += '…'
  }

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      title
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create session:', error)
    throw new Error('Failed to create chat session')
  }

  return data.id
}

/**
 * Get the most recent session for a user.
 */
export async function getLatestSession(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data.id
}
