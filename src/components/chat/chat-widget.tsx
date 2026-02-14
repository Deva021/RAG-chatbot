'use client'

import { useRef, useState, useEffect } from 'react'
import { Citation } from './citation'
import { ChatHistory } from './chat-history'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'
import { CopyButton } from './copy-button'
import { X, Send, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useAnalytics } from '@/lib/analytics'
import { embedQuestion } from '@/lib/rag/embedder'
import { Citation as CitationType } from '@/lib/rag/types'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface MessagingMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: CitationType[]
}

interface ChatWidgetProps {
  user: any
}

export default function ChatWidget({ user }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false) // For model loading / initial fetch
  const [isStreaming, setIsStreaming] = useState(false) // For active stream
  const [messages, setMessages] = useState<MessagingMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your CSEC AI assistant. How can I help you regarding the club or cybersecurity today?',
    },
  ])
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { trackEvent } = useAnalytics()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isStreaming, isLoading, isOpen])

  useEffect(() => {
    if (isOpen) trackEvent('chat_opened')
  }, [isOpen])

  // Restore session from localStorage or fetch latest on mount
  useEffect(() => {
    const initSession = async () => {
        if (!user) return
        
        const savedSessionId = localStorage.getItem('csec_chat_session_id')
        if (savedSessionId) {
            loadSession(savedSessionId)
            return
        }

        // If no saved session, try to get the most recent from DB
        const supabase = createClient()
        const { data: sessionData } = await supabase
            .from('chat_sessions')
            .select('id')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        
        if (sessionData) {
            loadSession(sessionData.id)
        }
    }

    initSession()
  }, [user])

  // Save session to localStorage when it changes
  useEffect(() => {
    if (sessionId) {
        localStorage.setItem('csec_chat_session_id', sessionId)
    } else {
        localStorage.removeItem('csec_chat_session_id')
    }
  }, [sessionId])

  // Load messages for a session
  const loadSession = async (sid: string) => {
    setIsLoading(true)
    setSessionId(sid)
    setError(null)
    setShowHistory(false) // return to chat view
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sid)
            .order('created_at', { ascending: true })
        
        if (error) throw error

        if (data) {
            setMessages(data.map(m => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                citations: m.citations ? (m.citations as any) : undefined
            })))
        }
    } catch (err) {
        console.error('Failed to load session:', err)
        setError('Failed to load conversation history.')
    } finally {
        setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || isStreaming || !user) return

    const userMessageText = input.trim()
    const tempId = crypto.randomUUID()
    
    // 1. Optimistic UI update
    const userMsg: MessagingMessage = {
      id: tempId,
      role: 'user',
      content: userMessageText
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      // 2. Generate Embedding (Client-side)
      const embedding = await embedQuestion(userMessageText)

      setIsLoading(false)
      setIsStreaming(true)

      // 3. Prepare Assistant Message Placeholder
      const assistantId = crypto.randomUUID()
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: ''
      }])

      // 4. Start Streaming Request
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embedding,
          message: userMessageText,
          message_id: tempId, // Use tempId as user message ID
          session_id: sessionId
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || `Server error: ${response.status}`)
      }

      // Check content type for SSE vs JSON (Refusal)
      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        // Handle refusal or immediate non-stream response
        const data = await response.json()
        if (data.type === 'refusal') {
           setMessages(prev => prev.map(m => 
             m.id === assistantId 
               ? { ...m, content: data.message + (data.suggestions ? '\n\nSuggestions:\n' + data.suggestions.map((s:string) => `- ${s}`).join('\n') : '') }
               : m
           ))
        } else if (data.type === 'answer') {
           setMessages(prev => prev.map(m => 
             m.id === assistantId ? { ...m, content: data.text } : m
           ))
        } else {
           // Generic fallback
           setMessages(prev => prev.map(m => 
            m.id === assistantId ? { ...m, content: data.message || "Request processed." } : m
          ))
        }
        setIsStreaming(false)
        return
      }

      // 5. Read SSE Stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) throw new Error('No response body')

      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' 

        for (const line of lines) {
            const eventMatch = line.match(/^event: (.*)$/m)
            const dataMatch = line.match(/^data: (.*)$/m)
            
            if (eventMatch && dataMatch) {
                const event = eventMatch[1]
                const data = JSON.parse(dataMatch[1])

                switch (event) {
                    case 'answer_start':
                        if (data.session_id) {
                            setSessionId(data.session_id)
                            setHistoryRefreshKey(prev => prev + 1)
                        }
                        break
                    case 'answer_delta':
                        setMessages(prev => prev.map(m => 
                            m.id === assistantId ? { ...m, content: m.content + data.text } : m
                        ))
                        break
                    case 'sources':
                         setMessages(prev => prev.map(m => 
                            m.id === assistantId ? { ...m, citations: data.citations } : m
                        ))
                        break
                    case 'refusal':
                         setMessages(prev => prev.map(m => 
                            m.id === assistantId ? { ...m, content: data.message } : m
                        ))
                        break
                    case 'error':
                        throw new Error(data.message)
                }
            }
        }
      }

    } catch (err: any) {
      console.error('Chat error:', err)
      setError(err.message || 'Something went wrong.')
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last.role === 'assistant' && !last.content) {
             return prev.map(m => m.id === last.id ? { ...m, content: `Error: ${err.message}` } : m)
        }
        return prev
      })
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const startNewSession = () => {
    setMessages([{
        id: 'new-welcome',
        role: 'assistant',
        content: 'Hello! How can I help you today?'
    }])
    setSessionId(undefined)
    localStorage.removeItem('csec_chat_session_id')
    setShowHistory(false)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {isOpen && (
        <div className="flex h-[500px] w-[350px] flex-col rounded-xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl overflow-hidden transition-all sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
            <h3 className="font-semibold text-sm text-white">CSEC Nexus</h3>
            <div className="flex items-center gap-2">
                {user && (
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={cn("text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10", showHistory && "text-white bg-white/10")}
                        title="History"
                    >
                        <MessageCircle className="h-4 w-4" />
                    </button>
                )}
                <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close chat"
                >
                <X className="h-4 w-4" />
                </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden relative">
            {/* History Overlay */}
             {showHistory ? (
                <div className="absolute inset-0 z-10 bg-black/90 backdrop-blur-sm overflow-y-auto w-full h-full p-2">
                    <div className="mb-2">
                        <button
                            className="w-full flex items-center justify-start gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-md px-3 py-2 text-xs transition-colors"
                            onClick={startNewSession}
                        >
                            <MessageCircle className="h-3 w-3" />
                            New Conversation
                        </button>
                    </div>
                    <ChatHistory 
                        onSelectSession={loadSession} 
                        currentSessionId={sessionId} 
                        refreshKey={historyRefreshKey}
                    />
                </div>
            ) : (
                /* Messages Area */
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent w-full">
                    {messages.map((msg) => (
                    <div key={msg.id} className="group relative">
                        <MessageBubble role={msg.role} content={msg.content} />
                        {msg.role === 'assistant' && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={msg.content} />
                            </div>
                        )}
                        {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                            <CitationList citations={msg.citations} />
                        )}
                    </div>
                    ))}
                    
                    {isLoading && !isStreaming && (
                        <div className="flex justify-start ml-2">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <TypingIndicator />
                                <span>Initializing AI model...</span>
                            </div>
                        </div>
                    )}
                    {isStreaming && (
                        <div className="flex justify-start ml-2">
                            <TypingIndicator />
                        </div>
                    )}
                    
                    {error && (
                        <div className="mx-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                            {error}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="border-t border-white/10 bg-white/5 p-4 shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={user ? "Ask anything..." : "Please login to chat"}
                disabled={!user || isLoading || isStreaming || showHistory}
                className="flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isStreaming || !user || showHistory}
                aria-label="Send message"
                className="rounded-lg bg-white px-3 py-2 text-black transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {!user && (
                 <div className="mt-2 text-center text-xs text-red-400">
                    Authentication required for queries.
                 </div>
            )}
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  )
}

function CitationList({ citations }: { citations: CitationType[] }) {
  // Deduplicate and group by document
  const uniqueCitations = citations.reduce((acc, curr) => {
    const existing = acc.find(c => c.document_title === curr.document_title)
    if (existing) {
        // If we have a new page for existing doc, append it to a custom property (we'll need to cast or just handle it purely in UI)
        // For simplicity, we just keep the first one but we might want to track all pages.
        // Let's create a display object.
        if (curr.page && !existing.pages?.includes(curr.page)) {
            existing.pages = [...(existing.pages || []), curr.page].sort((a,b) => a-b)
        }
        return acc
    }
    return [...acc, { ...curr, pages: curr.page ? [curr.page] : [] }]
  }, [] as (CitationType & { pages?: number[] })[])

  const [expanded, setExpanded] = useState(false)
  const visibleCitations = expanded ? uniqueCitations : uniqueCitations.slice(0, 3)
  const hasMore = uniqueCitations.length > 3

  return (
    <div className="mt-2.5 pl-2">
        <div className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
            <span className="text-[9px]">Sources</span>
            <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="flex flex-wrap gap-1.5">
            {visibleCitations.map((citation, idx) => (
                <Citation 
                    key={idx} 
                    source={citation} 
                    pages={citation.pages}
                />
            ))}
        </div>
        {hasMore && (
            <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-[10px] text-neutral-500 hover:text-white transition-colors flex items-center gap-1"
            >
                {expanded ? 'Show Less' : `+ ${uniqueCitations.length - 3} more`}
            </button>
        )}
    </div>
  )
}
