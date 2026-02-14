'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Zap } from 'lucide-react'
import { runIngestionPipeline, type IngestionProgress, type IngestionStep } from '@/lib/rag/ingestion-pipeline'

const STEP_LABELS: Record<IngestionStep, string> = {
  uploading: 'Transmitting Data',
  extracting: 'Neural Extraction',
  chunking: 'Recursive Structuring',
  embedding: 'Vector Generation',
  saving: 'Persistence Sync',
  done: 'Sequence Complete',
  error: 'Critical Failure',
}

const STEPS_ORDER: IngestionStep[] = ['uploading', 'extracting', 'chunking', 'embedding', 'saving']

export default function DocumentUploader({ onComplete }: { onComplete?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<IngestionProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ chunkCount: number; pageCount: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (selected.type !== 'application/pdf') {
      setError('Only advanced PDF schemas are supported for neural ingestion.')
      return
    }

    setFile(selected)
    setError(null)
    setResult(null)
    setProgress(null)
  }

  const handleUpload = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      const res = await runIngestionPipeline(file, (p) => {
        setProgress(p)
      })
      setResult({ chunkCount: res.chunkCount, pageCount: res.pageCount })
      onComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neural ingestion aborted.')
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setFile(null)
    setProgress(null)
    setError(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const currentStepIdx = progress ? STEPS_ORDER.indexOf(progress.step) : -1

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/30 p-1 shadow-2xl backdrop-blur-3xl dark:border-neutral-800/40 dark:bg-neutral-900/30">
      <div className="flex items-center justify-between rounded-t-[2.2rem] bg-indigo-50/30 px-10 py-5 dark:bg-indigo-950/20">
        <div className="flex items-center gap-3">
          <Zap className="h-4 w-4 text-indigo-500 animate-pulse" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900/40 dark:text-indigo-100/40">Nexus Ingestion Wizard</h3>
        </div>
        <div className="flex items-center gap-4">
          {file && !isProcessing && !result && (
            <button onClick={reset} className="text-[10px] font-black uppercase tracking-widest text-neutral-400 transition-colors hover:text-rose-500">Reset Buffer</button>
          )}
          <button 
            onClick={() => onComplete?.()} 
            className="text-[10px] font-black uppercase tracking-widest text-neutral-400 transition-colors hover:text-indigo-600"
          >
            Close Wizard
          </button>
        </div>
      </div>

      <div className="p-10">
        {/* Drop Zone / File Picker */}
        {!isProcessing && !result && (
          <div className="space-y-8">
            <div
              className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-4xl border-2 border-dashed transition-all duration-500 px-6 py-16 ${
                file 
                ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-900/10 shadow-[0_0_40px_-10px_rgba(79,70,229,0.2)]' 
                : 'border-neutral-200 bg-neutral-50/50 hover:border-indigo-400 hover:bg-white/80 dark:border-neutral-800'
              }`}
              onClick={() => inputRef.current?.click()}
            >
              <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-3xl transition-all duration-500 shadow-2xl ${
                file ? 'bg-indigo-600 text-white animate-bounce' : 'bg-white text-indigo-600 dark:bg-neutral-900'
              }`}>
                {file ? <FileText className="h-10 w-10" /> : <Upload className="h-10 w-10" />}
              </div>
              
              <div className="relative z-10 text-center">
                <p className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                  {file ? file.name : 'Load Intelligence Source'}
                </p>
                <p className="mt-2 text-sm font-medium text-neutral-500 opacity-60">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB • Buffer ready` : 'High-fidelity PDF analysis only'}
                </p>
              </div>

              {/* Decorative Glow */}
              <div className="absolute inset-0 -z-10 bg-linear-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileSelect}
            />

            {error && (
              <div className="flex items-center gap-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-5 text-sm font-bold text-rose-600 animate-in fade-in zoom-in-95 backdrop-blur-md">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file}
              className="group relative flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-indigo-600 font-black text-white shadow-2xl shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.01] hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 disabled:shadow-none active:scale-95"
            >
              <div className="flex items-center gap-3">
                <span>Engage Pipeline</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="absolute inset-x-0 -bottom-1 h-3 bg-white/20 blur-md" />
            </button>
          </div>
        )}

        {/* Neural Progress Visualization */}
        {isProcessing && progress && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {STEPS_ORDER.map((step, idx) => {
                const isCurrent = step === progress.step
                const isDone = currentStepIdx > idx || progress.step === 'done'
                const isError = progress.step === 'error' && idx === currentStepIdx

                return (
                  <div key={step} className="relative flex flex-col items-center">
                    <div className={`mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 transition-all duration-700 z-10 ${
                      isDone ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 
                      isError ? 'border-rose-500 bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 
                      isCurrent ? 'border-indigo-600 bg-white text-indigo-600 scale-125 shadow-2xl dark:bg-neutral-900' : 
                      'border-neutral-200 bg-white/50 text-neutral-300 dark:border-neutral-800'
                    }`}>
                      {isDone ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : isError ? (
                        <XCircle className="h-6 w-6" />
                      ) : isCurrent ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <span className="text-xs font-black">{idx + 1}</span>
                      )}
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-[0.15em] text-center ${isCurrent ? 'text-neutral-900 dark:text-white' : isDone ? 'text-emerald-600' : 'text-neutral-400'}`}>
                      {STEP_LABELS[step]}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Glowing Detailed Progress */}
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/40 p-10 shadow-inner backdrop-blur-2xl dark:border-neutral-800/20 dark:bg-neutral-950/20">
               <div className="flex items-center justify-between mb-4">
                 <h4 className="flex items-center gap-2 text-lg font-black text-neutral-900 dark:text-white">
                   <div className="h-2 w-2 animate-ping rounded-full bg-indigo-500" />
                   {STEP_LABELS[progress.step as IngestionStep]}
                 </h4>
                 <div className="px-4 py-1 rounded-full bg-indigo-600 text-white text-xs font-black shadow-lg shadow-indigo-200/50">
                   {progress.progress}%
                 </div>
               </div>
               
               <div className="group relative h-4 w-full overflow-hidden rounded-full bg-neutral-200/50 p-1 dark:bg-neutral-800/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 relative ${progress.step === 'error' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-linear-to-r from-indigo-500 via-violet-500 to-purple-600 shadow-[0_0_20px_rgba(79,70,229,0.4)]'}`}
                  style={{ width: `${progress.progress}%` }}
                >
                   <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              
              <div className="mt-6 flex items-center gap-3">
                <div className="h-6 w-6 flex items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </div>
                <p className="text-sm font-bold italic tracking-tight text-neutral-500 dark:text-neutral-400">
                  {progress.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* High-Fidelity Success State */}
        {result && (
          <div className="space-y-8 animate-in zoom-in-[0.98] fade-in duration-700">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-100 bg-emerald-50/30 p-12 text-center backdrop-blur-md dark:border-emerald-900/20 dark:bg-emerald-950/10">
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                </div>
                
                <h4 className="text-4xl font-black tracking-tight text-emerald-900 dark:text-emerald-100">Intelligence Refined</h4>
                <p className="mt-3 max-w-sm text-lg font-medium text-emerald-700 opacity-80 dark:text-emerald-300">
                  Neural indexing complete. Source is now available for vector retrieval.
                </p>
                
                <div className="mt-12 grid grid-cols-2 gap-8 w-full max-w-md">
                  <div className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-md dark:bg-neutral-900/80">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/60">Vector Segments</p>
                    <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-white">{result.chunkCount}</p>
                  </div>
                  <div className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-md dark:bg-neutral-900/80">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/60">Page Sources</p>
                    <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-white">{result.pageCount}</p>
                  </div>
                </div>
              </div>
            </div>
 
            <button
              onClick={reset}
              className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl border-2 border-indigo-100 bg-white px-8 font-black text-indigo-600 transition-all duration-300 hover:border-indigo-600 hover:bg-indigo-50 active:scale-95 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-500 dark:hover:bg-neutral-800"
            >
              Initialize Next Source
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
