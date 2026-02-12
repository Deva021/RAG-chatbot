import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
import { User, Bot } from 'lucide-react'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

// react-markdown automatically sanitizes input by default, preventing XSS.
export function MessageBubble({ role, content }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex w-full items-start gap-2',
        role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      {role === 'assistant' && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
        role === 'user'
          ? 'bg-blue-600 text-white ml-auto rounded-br-none'
          : 'bg-white/10 text-gray-200 mr-auto rounded-bl-none border border-white/5'
      )}
    >
      <div className="flex items-center gap-2 mb-1 opacity-50 text-xs">
        {role === 'user' ? (
          <User className="h-3 w-3" />
        ) : (
          <Bot className="h-3 w-3" />
        )}
        <span>{role === 'user' ? 'You' : 'Nexus AI'}</span>
      </div>
      <ReactMarkdown
        className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 break-words"
      >
            {content}
        </ReactMarkdown>
      </div>
      {role === 'user' && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-background">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}
