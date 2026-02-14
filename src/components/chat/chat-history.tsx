'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Calendar, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatSession {
  id: string
  title: string
  updated_at: string
}

interface ChatHistoryProps {
  onSelectSession: (sessionId: string) => void
  currentSessionId?: string
  refreshKey?: number
}

export function ChatHistory({ onSelectSession, currentSessionId, refreshKey }: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setIsLoading(false)
        return
      }

      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false })
        .limit(20)

      if (!error && sessions) {
        setSessions(sessions)
      }
      setIsLoading(false)
    }

    fetchSessions()
  }, [refreshKey]) // Re-fetch when refreshKey changes

  if (isLoading) {
    return <div className="p-4 text-xs text-gray-500 text-center animate-pulse">Loading history...</div>
  }

  if (sessions.length === 0) {
    return (
        <div className="p-4 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
            <MessageCircle className="h-4 w-4 opacity-50" />
            <span>No past conversations</span>
        </div>
    )
  }

  return (
    <div className="space-y-1 p-2">
      <h4 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Chats</h4>
      {sessions.map((session) => (
        <button
          key={session.id}
          onClick={() => onSelectSession(session.id)}
          className={cn(
            "w-full flex items-center justify-between gap-3 p-2 rounded-lg text-left text-sm transition-colors hover:bg-white/5 group",
            currentSessionId === session.id ? "bg-white/10 text-white" : "text-gray-400"
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <MessageCircle className={cn(
                "h-4 w-4 shrink-0", 
                 currentSessionId === session.id ? "text-green-400" : "text-gray-600 group-hover:text-gray-400"
            )} />
            <span className="truncate">{session.title}</span>
          </div>
          <ChevronRight className={cn(
            "h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity",
             currentSessionId === session.id && "opacity-100 text-white"
          )} />
        </button>
      ))}
    </div>
  )
}
