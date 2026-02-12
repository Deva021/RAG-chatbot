import { FileText } from 'lucide-react'

interface CitationProps {
  source: {
    title: string
    page?: number
    section?: string
  }
}

export function Citation({ source }: CitationProps) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-md border bg-gray-50 p-2 text-xs text-gray-600">
      <FileText className="h-3 w-3" />
      <span className="font-semibold">{source.title}</span>
      {source.page && <span>p. {source.page}</span>}
      {source.section && <span>({source.section})</span>}
    </div>
  )
}
