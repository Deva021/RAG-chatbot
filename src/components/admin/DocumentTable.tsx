'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, RefreshCw, Loader2, FileText, Database, Layers, CheckCircle2, XCircle, MoreVertical } from 'lucide-react'
import { runIngestionPipeline } from '@/lib/rag/ingestion-pipeline'
import { useSearchParams } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { AlertTriangle } from 'lucide-react'

interface KBDocument {
  id: string
  name: string
  status: string
  enabled: boolean
  storage_path?: string
  meta: Record<string, unknown>
  created_at: string
  chunk_count?: number
}

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any, glow: string }> = {
  ready: { 
    label: 'Neural Active', 
    color: 'bg-emerald-50/50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400', 
    icon: CheckCircle2,
    glow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]'
  },
  processing: { 
    label: 'Deep Analysis', 
    color: 'bg-indigo-50/50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/20 dark:text-indigo-400', 
    icon: Loader2,
    glow: 'shadow-[0_0_15px_-3px_rgba(79,70,229,0.3)]'
  },
  uploading: { 
    label: 'Transmitting', 
    color: 'bg-blue-50/50 text-blue-700 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400', 
    icon: Database,
    glow: 'shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]'
  },
  failed: { 
    label: 'Sequence Alert', 
    color: 'bg-rose-50/50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400', 
    icon: XCircle,
    glow: 'shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)]'
  },
}

export default function DocumentTable({ refreshKey }: { refreshKey?: number }) {
  const [documents, setDocuments] = useState<KBDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()
  const searchParams = useSearchParams()
  const query = searchParams.get('q')?.toLowerCase() ?? ''

  const fetchDocuments = async () => {
    setLoading(true)
    let request = supabase
      .from('kb_documents')
      .select('id, name, status, enabled, storage_path, meta, created_at')
      .order('created_at', { ascending: false })
    
    if (query) {
      request = request.ilike('name', `%${query}%`)
    }

    const { data, error } = await request

    if (!error && data) {
      const docsWithCounts: KBDocument[] = await Promise.all(
        data.map(async (doc) => {
          const { count } = await supabase
            .from('kb_chunks')
            .select('*', { count: 'exact', head: true })
            .eq('document_id', doc.id)
          return { ...doc, chunk_count: count ?? 0 }
        })
      )
      setDocuments(docsWithCounts)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, query])

  useEffect(() => {
    setMounted(true)
  }, [])

  const promptDelete = (docId: string) => {
    setDeleteDocId(docId)
  }

  const confirmDelete = async () => {
    if (!deleteDocId) return
    const docId = deleteDocId
    setDeleteDocId(null)
    setActionLoading(docId)
    
    try {
      const doc = documents.find(d => d.id === docId)
      if (doc?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('artifacts')
          .remove([doc.storage_path])
        
        if (storageError) {
          console.warn('Storage removal warning:', storageError)
        }
      }

      const { error: deleteError } = await supabase.from('kb_documents').delete().eq('id', docId)
      
      if (deleteError) {
        console.error('Delete failed:', deleteError)
        alert(`Critical Failure: ${deleteError.message}`)
      } else {
        await fetchDocuments()
      }
    } catch (err) {
      console.error('Unexpected error during deletion:', err)
      alert('An unexpected neural collapse occurred during deletion.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggle = async (docId: string, currentEnabled: boolean) => {
    setActionLoading(docId)
    await supabase
      .from('kb_documents')
      .update({ enabled: !currentEnabled })
      .eq('id', docId)
    setActionLoading(null)
    fetchDocuments()
  }

  const handleReprocess = async (docId: string) => {
    const doc = documents.find(d => d.id === docId)
    if (!doc) return

    setActionLoading(docId)
    await supabase.from('kb_chunks').delete().eq('document_id', docId)

    if (doc.meta && typeof doc.meta === 'object' && 'storage_path' in doc.meta) {
      const storagePath = (doc.meta as any).storage_path
      const { data: fileData } = await supabase.storage.from('artifacts').download(storagePath) as any

      if (fileData) {
        const file = new File([fileData], doc.name, { type: 'application/pdf' })
        await supabase.from('kb_documents').delete().eq('id', docId)
        try {
          await runIngestionPipeline(file, () => {})
        } catch { }
      }
    }

    setActionLoading(null)
    fetchDocuments()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 opacity-20" />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-4xl border-2 border-dashed border-neutral-200 bg-neutral-50/30 px-6 py-32 text-center dark:border-neutral-800">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-neutral-200 shadow-2xl dark:bg-neutral-900">
          <Database className="h-10 w-10" />
        </div>
        <h4 className="text-2xl font-black text-neutral-900 dark:text-white">Repository Depleted</h4>
        <p className="mt-2 max-w-xs text-sm font-medium text-neutral-500 opacity-60">
          Initialize the ingestion wizard to load documentation into the neural space.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-4">
      <table className="min-w-[1000px] w-full border-separate border-spacing-y-4 px-4">
        <thead>
          <tr>
            <th className="px-6 py-2 text-left text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Intelligence Source</th>
            <th className="px-6 py-2 text-left text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Neural Status</th>
            <th className="px-6 py-2 text-left text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Segments</th>
            <th className="px-6 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Auto-Inference</th>
            <th className="px-6 py-2 text-right text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">System Controls</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const config = STATUS_CONFIG[doc.status] || STATUS_CONFIG.failed
            const StatusIcon = config.icon

            return (
              <tr key={doc.id} className="group">
                <td className="whitespace-nowrap rounded-l-3xl border-y border-l border-white/40 bg-white/40 px-6 py-6 shadow-sm backdrop-blur-md transition-all duration-300 group-hover:bg-white/60 dark:border-neutral-800/40 dark:bg-neutral-900/40 dark:group-hover:bg-neutral-900/60">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-lg border border-neutral-100 transition-transform group-hover:scale-110 dark:bg-neutral-800 dark:border-neutral-700">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-base font-black tracking-tight text-neutral-900 dark:text-white">{doc.name}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        Initialised • {new Date(doc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap border-y border-white/40 bg-white/40 px-6 py-6 backdrop-blur-md transition-all duration-300 group-hover:bg-white/60 dark:border-neutral-800/40 dark:bg-neutral-900/40 dark:group-hover:bg-neutral-900/60">
                  <span className={`inline-flex items-center gap-2 rounded-xl border px-4 py-1.5 text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${config.color} ${config.glow}`}>
                    <StatusIcon className={`h-3.5 w-3.5 ${doc.status === 'processing' ? 'animate-spin' : ''}`} />
                    {config.label}
                  </span>
                </td>
                <td className="whitespace-nowrap border-y border-white/40 bg-white/40 px-6 py-6 backdrop-blur-md transition-all duration-300 group-hover:bg-white/60 dark:border-neutral-800/40 dark:bg-neutral-900/40 dark:group-hover:bg-neutral-900/60">
                  <div className="flex items-center gap-2 text-sm font-black text-neutral-700 dark:text-neutral-300">
                    <Layers className="h-4 w-4 text-indigo-400" />
                    {doc.chunk_count ?? '0'}
                  </div>
                </td>
                <td className="whitespace-nowrap border-y border-white/40 bg-white/40 px-6 py-6 text-center backdrop-blur-md transition-all duration-300 group-hover:bg-white/60 dark:border-neutral-800/40 dark:bg-neutral-900/40 dark:group-hover:bg-neutral-900/60">
                   <button
                    onClick={() => handleToggle(doc.id, doc.enabled)}
                    disabled={actionLoading === doc.id}
                    className="group relative inline-flex h-7 w-12 items-center justify-center rounded-full transition-all focus:outline-none"
                  >
                    <div className={`absolute h-6 w-full rounded-full transition-colors duration-300 ${doc.enabled ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
                    <div className={`absolute left-1 h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-300 ${doc.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </td>
                <td className="whitespace-nowrap rounded-r-3xl border-y border-r border-white/40 bg-white/40 px-6 py-6 text-right shadow-sm backdrop-blur-md transition-all duration-300 group-hover:bg-white/60 dark:border-neutral-800/40 dark:bg-neutral-900/40 dark:group-hover:bg-neutral-900/60">
                  <div className="flex items-center justify-end gap-3">
                    {actionLoading === doc.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    ) : (
                      <>
                        <button
                          onClick={() => handleReprocess(doc.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-indigo-500 transition-all hover:bg-indigo-600 hover:text-white hover:shadow-xl hover:shadow-indigo-200 dark:text-indigo-400 dark:hover:shadow-none"
                          title="Neural Refresh"
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => promptDelete(doc.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-500 transition-all hover:bg-rose-600 hover:text-white hover:shadow-xl hover:shadow-rose-200 dark:text-rose-400 dark:hover:shadow-none"
                          title="Purge Intelligence"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Modal
        isOpen={!!deleteDocId}
        onClose={() => setDeleteDocId(null)}
        title="Purge Intelligence Asset"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-500">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <p className="text-sm font-medium">This action cannot be undone.</p>
          </div>
          
          <p className="text-neutral-400 text-sm leading-relaxed">
            Are you sure you want to permanently delete this document? The associated vector embeddings and neural index will be irretrievably lost.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteDocId(null)}
              className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="group flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-500 active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
              <span>Confirm Purge</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
