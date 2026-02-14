import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
import { User, Bot } from 'lucide-react'
import { sanitizeMarkdown } from '@/lib/sanitize'
import { useMemo } from 'react'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  // Sanitize content if it's from assistant (RAG output)
  const safeContent = useMemo(() => {
    return role === 'assistant' ? sanitizeMarkdown(content) : content
  }, [content, role])

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
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
          role === 'user'
            ? 'bg-blue-600 text-white ml-auto rounded-br-sm'
            : 'bg-muted/50 text-foreground mr-auto rounded-bl-sm border border-border/50'
        )}
      >
        <div className="flex items-center gap-2 mb-1.5 opacity-60 text-[10px] uppercase tracking-wider font-medium">
          {role === 'user' ? (
            <>
              <User className="h-3 w-3" />
              <span>You</span>
            </>
          ) : (
            <>
              <Bot className="h-3 w-3" />
              <span>Nexus AI</span>
            </>
          )}
        </div>
        
        {role === 'user' ? (
          <div className="whitespace-pre-wrap">{content}</div>
        ) : (
          <ReactMarkdown
            className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:p-2 prose-pre:rounded-md break-words"
            components={{
                a: (props) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />
                )
            }}
          >
            {safeContent}
          </ReactMarkdown>
        )}
      </div>

      {role === 'user' && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-background shadow-sm">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}
