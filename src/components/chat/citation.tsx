'use client'

import { FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Citation as CitationType } from '@/lib/rag/types'

interface CitationProps {
  source: CitationType
}

export function Citation({ source }: CitationProps) {
  const [expanded, setExpanded] = useState(false)

  const hasLink = !!source.url
  
  const Wrapper = hasLink ? 'a' : 'div'
  const props = hasLink ? { href: source.url!, target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <Wrapper 
      {...props}
      className={cn(
        "mt-2 flex items-center gap-2 rounded-md border border-border/40 bg-muted/40 p-2 text-xs text-muted-foreground transition-colors",
        hasLink && "cursor-pointer hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <FileText className="h-3 w-3 shrink-0" />
      <span className="font-medium truncate max-w-[200px]" title={source.document_title}>
        {source.document_title}
      </span>
      
      <div className="flex items-center gap-1 ml-auto shrink-0 opacity-70">
        {source.page && <span>p. {source.page}</span>}
        {source.section && <span>({source.section})</span>}
        {hasLink && <ExternalLink className="h-2.5 w-2.5 ml-1" />}
      </div>
    </Wrapper>
  )
}
