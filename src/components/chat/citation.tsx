'use client'

import { FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Citation as CitationType } from '@/lib/rag/types'

interface CitationProps {
  source: CitationType
  pages?: number[]
}

export function Citation({ source, pages }: CitationProps) {
  const hasLink = !!source.url
  const Wrapper = hasLink ? 'a' : 'div'
  const props = hasLink ? { href: source.url!, target: '_blank', rel: 'noopener noreferrer' } : {}

  const pageLabel = pages && pages.length > 0 
    ? `p. ${pages.join(', ')}`
    : source.page ? `p. ${source.page}` : null

  return (
    <Wrapper 
      {...props}
      className={cn(
        "flex max-w-full items-center gap-1.5 rounded-md border border-white/5 bg-white/5 px-2 py-1 text-[10px] transition-all hover:bg-white/10 hover:border-white/10",
        hasLink && "cursor-pointer hover:text-white"
      )}
      title={source.document_title}
    >
      <FileText className="h-3 w-3 shrink-0 text-indigo-400" />
      <span className="truncate max-w-[120px] font-medium text-neutral-300">
        {source.document_title}
      </span>
      {pageLabel && (
        <span className="shrink-0 text-neutral-500 font-mono text-[9px]">
            {pageLabel}
        </span>
      )}
      {hasLink && <ExternalLink className="h-2 w-2 text-neutral-600" />}
    </Wrapper>
  )
}
