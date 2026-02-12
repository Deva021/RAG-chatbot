'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'
import { Citation } from './citation'
import { Button } from '@/components/ui/button' 
import { MessageCircle, X, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/lib/analytics'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatWidgetProps {
    user: any
}

export default function ChatWidget({ user }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const { trackEvent } = useAnalytics()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your CSEC AI assistant. How can I help you regarding the club or cybersecurity today?',
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])
  
  useEffect(() => {
    if (isOpen) {
        trackEvent('chat_opened')
    }
  }, [isOpen])

  const simulateStream = async (text: string) => {
    setIsTyping(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setIsTyping(false)

    const id = Date.now().toString()
    setMessages((prev) => [...prev, { id, role: 'assistant', content: '' }])

    for (let i = 0; i < text.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 15 + Math.random() * 20))
        setMessages((prev) => 
            prev.map((msg) => 
                msg.id === id ? { ...msg, content: msg.content + text[i] } : msg
            )
        )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping || !user) return
    
    // Mock Rate Limit
    if (messages.length > 20) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "⚠️ You have reached the message limit for this demo." }])
        return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    trackEvent('message_sent', { length: input.length })
    
    // Better Mock Responses
    const lowerInput = input.toLowerCase()
    let responseText = "I'm a demo bot for the CSEC contest. I can simulate RAG responses but I'm not connected to the vector DB yet."
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        responseText = "Hi there! Ready to explore the secure document vault?"
    } else if (lowerInput.includes('features') || lowerInput.includes('do')) {
        responseText = "I can currently demo the UI, streaming responses, and auth integration. Real document search is coming in Batch 4."
    } else if (lowerInput.includes('security') || lowerInput.includes('policy')) {
        responseText = "According to the Security_Policy.pdf (p. 12), all sensitive data must be encrypted at rest using AES-256."
    }

    await simulateStream(responseText)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {isOpen && (
        <div className="flex h-[500px] w-[350px] flex-col rounded-xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl overflow-hidden transition-all sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
            <h3 className="font-semibold text-sm text-white">CSEC AI Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div key={msg.id}>
                <MessageBubble role={msg.role} content={msg.content} />
                {msg.role === 'assistant' && msg.content.includes('Security_Policy.pdf') && !isTyping && (
                    <div className="ml-10 mt-2">
                        <Citation source={{ title: 'Security_Policy.pdf', page: 12 }} />
                    </div>
                )}
              </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                    <TypingIndicator />
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-white/10 bg-white/5 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={user ? "Ask anything..." : "Please login to chat"}
                disabled={!user}
                className="flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping || !user}
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
            <div className="mt-2 text-xs text-gray-500 text-center">
                AI can make mistakes. Verify important info.
            </div>
          </form>
        </div>
      )}

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
