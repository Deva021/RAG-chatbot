import { createClient } from '@/lib/supabase/server'
import { ChatRole, Citation } from '@/lib/rag/types'

export interface ChatMessage {
  id: string
  session_id: string
  role: ChatRole
  content: string
  citations: Citation[] | null
  created_at: string
}

/**
 * Save a message to the database. Identifies valid sessions via RLS/FK.
 */
export async function saveMessage(payload: {
  id: string
  session_id: string
  role: ChatRole
  content: string
  citations?: Citation[]
}): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('chat_messages').insert({
    id: payload.id, // Client generated ID
    session_id: payload.session_id,
    role: payload.role,
    content: payload.content,
    citations: payload.citations || null
  })

  if (error) {
    console.error('Failed to save message:', error)
    throw new Error(`Persistence failure: ${error.message}`)
  }
}

/**
 * Check if a message ID already exists (for deduplication).
 */
export async function getMessageById(id: string): Promise<ChatMessage | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  return data as ChatMessage | null
}

/**
 * Get all messages for a session, ordered by time.
 */
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  return (data || []) as ChatMessage[]
}
