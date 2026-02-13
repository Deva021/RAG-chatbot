'use client'

import { useState, useEffect } from 'react'
import DocumentUploader from '@/components/admin/DocumentUploader'
import DocumentTable from '@/components/admin/DocumentTable'
import { Plus, X, Sparkles, Database } from 'lucide-react'

export default function AdminDocumentsPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [showUploader, setShowUploader] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleUploadComplete = () => {
    setRefreshKey((k) => k + 1)
    setShowUploader(false)
  }

  if (!mounted) return null

  return (
    <div className="mx-auto max-w-7xl space-y-12">
      {/* Supreme Header Card */}
      <header className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/40 p-10 shadow-2xl backdrop-blur-2xl dark:border-neutral-800/20 dark:bg-neutral-900/40">
        <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs">Intelligence Engineering</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-neutral-900 dark:text-white lg:text-6xl">
              Knowledge <span className="bg-linear-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Base</span>
            </h1>
            <p className="max-w-2xl text-lg font-medium text-neutral-600 dark:text-neutral-400">
              Manage high-fidelity documentation and oversee neural indexing for your private AI models.
            </p>
          </div>

          <button
            onClick={() => setShowUploader(!showUploader)}
            className="group relative h-16 w-full items-center justify-center overflow-hidden rounded-[1.25rem] bg-indigo-600 px-8 font-black text-white shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.02] hover:bg-indigo-700 active:scale-95 lg:w-auto"
          >
            <div className="flex items-center justify-center gap-3">
              {showUploader ? (
                <>
                  <X className="h-5 w-5" />
                  <span>Minimize Wizard</span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
                  <span>Ingest New Intelligence</span>
                </>
              )}
            </div>
            {/* Button Glow Effect */}
            <div className="absolute inset-x-0 -bottom-1 h-3 bg-white/20 blur-md" />
          </button>
        </div>

        {/* Decorative Corner Icon */}
        <div className="absolute -right-4 -top-4 opacity-5">
          <Database className="h-48 w-48 text-indigo-600" />
        </div>
      </header>

      {/* Content Area */}
      <main className="grid grid-cols-1 gap-12">
        {showUploader && (
          <section className="animate-in fade-in slide-in-from-top-8 duration-700">
            <DocumentUploader onComplete={handleUploadComplete} />
          </section>
        )}

        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/30 bg-white/60 p-2 shadow-2xl backdrop-blur-xl dark:border-neutral-800/30 dark:bg-neutral-900/60">
          <div className="bg-neutral-50/50 dark:bg-neutral-950/50 px-8 py-6 rounded-t-[2.2rem] border-b border-white/20 dark:border-neutral-800/20 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                  <Database className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-neutral-900 dark:text-white">Active Neural Index</h2>
             </div>
             <div className="flex items-center gap-2">
               <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
               <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Systems Operational</span>
             </div>
          </div>
          <div className="p-4">
            <DocumentTable refreshKey={refreshKey} />
          </div>
        </section>
      </main>
    </div>
  )
}
