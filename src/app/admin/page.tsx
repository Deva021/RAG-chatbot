'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Users, Activity, Zap, ArrowUpRight, Shield, Database, Sparkles, TrendingUp, Cpu } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ documents: 0, users: 0, chunks: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      const [
        { count: docCount },
        { count: userCount },
        { count: chunkCount }
      ] = await Promise.all([
        supabase.from('kb_documents').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('kb_chunks').select('*', { count: 'exact', head: true }),
      ])
      
      setStats({
        documents: docCount ?? 0,
        users: userCount ?? 0,
        chunks: chunkCount ?? 0
      })
      setLoading(false)
    }
    fetchStats()
  }, [supabase])

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Supreme Greeting Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                <div className="relative h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
             </div>
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-neutral-400 dark:text-neutral-500">Neural Link Stable</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-neutral-900 dark:text-white lg:text-7xl">
            Command <span className="bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">Nexus</span>
          </h1>
          <p className="max-w-2xl text-xl font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Real-time oversight of the <span className="font-bold text-neutral-900 dark:text-white">CSEC Intelligence</span> repositories and decentralized vector processing.
          </p>
        </div>
        
        <div className="group relative flex items-center gap-4 rounded-[2.5rem] border border-white/20 bg-white/40 p-2 pr-6 backdrop-blur-3xl shadow-2xl transition-all hover:scale-[1.02] dark:border-white/5 dark:bg-neutral-900/40">
           <div className="flex -space-x-4 overflow-hidden p-2">
             {[1,2,3,4].map(i => (
               <div key={i} className="inline-block h-10 w-10 rounded-full border-2 border-white bg-linear-to-br from-indigo-100 to-indigo-50 dark:border-neutral-900 dark:from-neutral-800 dark:to-neutral-900 shadow-lg" />
             ))}
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Security Clearance</p>
              <p className="text-sm font-black text-neutral-900 dark:text-white">Internal Lvl 9</p>
           </div>
           {/* Subtle glow behind users */}
           <div className="absolute inset-0 -z-10 bg-indigo-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Analytics Matrix */}
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        <SupremeCard
          title="Neural Assets"
          value={stats.documents.toString()}
          label="Intelligence sources indexed"
          icon={<FileText className="h-7 w-7" />}
          trend="+12% Core Index"
          href="/admin/documents"
          color="indigo"
        />
        <SupremeCard
          title="Personnel"
          value={stats.users.toString()}
          label="Authorized CSEC operatives"
          icon={<Users className="h-7 w-7" />}
          trend="Static Encryption"
          color="violet"
        />
        <SupremeCard
          title="Sub-Vectors"
          value={stats.chunks.toLocaleString()}
          label="Neural segments generated"
          icon={<Cpu className="h-7 w-7" />}
          trend="Real-time Flow"
          color="emerald"
        />
      </div>

      {/* Deep Intelligence Insights */}
      <div className="grid gap-10 lg:grid-cols-3">
         {/* System Integrity (Wide) */}
         <div className="lg:col-span-2 relative overflow-hidden rounded-[3rem] border border-white/20 bg-white/40 p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] backdrop-blur-2xl dark:border-white/5 dark:bg-neutral-900/40">
            <div className="flex items-center justify-between mb-12">
               <div className="flex items-center gap-5">
                  <div className="h-16 w-16 flex items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)]">
                    <Activity className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-neutral-900 dark:text-white">System Integrity</h3>
                    <p className="text-sm font-medium text-neutral-500">Edge node diagnostics</p>
                  </div>
               </div>
               <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-5 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:bg-emerald-950/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Optimal Flow
               </div>
            </div>
            
            <div className="grid gap-10 md:grid-cols-2">
               <div className="space-y-8">
                  <SupremeMetric label="Inference Engine" status="Nominal" progress={98} />
                  <SupremeMetric label="Vector Persistence" status="Active Sync" progress={94} />
               </div>
               <div className="space-y-8">
                  <SupremeMetric label="CSEC Protocol 9" status="Encrypted" progress={100} />
                  <SupremeMetric label="Edge Propagation" status="Synchronized" progress={91} />
               </div>
            </div>
         </div>

         {/* Rapid Operations */}
         <div className="relative overflow-hidden rounded-[3rem] border border-transparent bg-neutral-900 p-12 shadow-2xl dark:bg-neutral-900/80">
            <div className="relative z-10 flex flex-col h-full">
               <div className="mb-10">
                 <h3 className="text-2xl font-black text-white tracking-tight">Rapid Operations</h3>
                 <p className="mt-2 text-neutral-400 font-medium text-sm">Deploy intelligence immediately.</p>
               </div>
               
               <div className="flex-1 space-y-4">
                  <SupremeAction icon={<Sparkles />} label="Ingest neural source" href="/admin/documents" />
                  <SupremeAction icon={<Shield />} label="Audit security fabric" />
                  <SupremeAction icon={<TrendingUp />} label="View analytics stream" color="indigo" />
               </div>

               <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Notice</p>
                  <p className="text-xs text-neutral-500 leading-relaxed font-bold italic">CSEC Governance: All neural extractions are logged for internal auditing.</p>
               </div>
            </div>
            
            {/* Dark Mode Glows */}
            <div className="absolute -bottom-20 -right-20 h-64 w-64 bg-indigo-500/20 blur-[100px] rounded-full" />
            <div className="absolute -top-20 -left-20 h-64 w-64 bg-violet-500/10 blur-[100px] rounded-full" />
         </div>
      </div>
    </div>
  )
}

function SupremeCard({ title, value, label, icon, trend, color = "indigo", href }: any) {
  const accentColors: any = {
    indigo: "bg-indigo-600 shadow-indigo-500/40",
    violet: "bg-violet-600 shadow-violet-500/40",
    emerald: "bg-emerald-500 shadow-emerald-500/40"
  }
  
  const content = (
    <div className="group relative overflow-hidden rounded-[3rem] border border-white/40 bg-white/40 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_48px_80px_-24px_rgba(0,0,0,0.12)] dark:border-white/5 dark:bg-neutral-900/40">
      <div className="flex items-center justify-between mb-10">
         <div className={`h-16 w-16 flex items-center justify-center rounded-[1.25rem] text-white shadow-2xl transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110 ${accentColors[color]}`}>
           {icon}
         </div>
         {href && (
           <div className="h-10 w-10 flex items-center justify-center rounded-full bg-neutral-100/50 text-neutral-400 transition-all group-hover:bg-indigo-600 group-hover:text-white dark:bg-neutral-800/50">
             <ArrowUpRight className="h-5 w-5" />
           </div>
         )}
      </div>
      
      <div className="space-y-2">
         <p className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-400">{title}</p>
         <h4 className="text-6xl font-black tracking-tighter text-neutral-900 dark:text-white">{value}</h4>
         <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">{label}</p>
      </div>
      
      <div className="mt-10 flex items-center gap-3">
         <TrendingUp className="h-4 w-4 text-emerald-500" />
         <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">{trend}</span>
      </div>

      {/* Subtle corner glow */}
      <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

function SupremeMetric({ label, status, progress }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400">{label}</span>
        <span className="text-xs font-black text-neutral-900 dark:text-white">{status}</span>
      </div>
      <div className="group relative h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden p-0.5">
        <div 
          className="h-full bg-linear-to-r from-indigo-600 to-violet-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all duration-[1.5s] ease-out group-hover:brightness-110" 
          style={{ width: `${progress}%` }}
        >
          <div className="h-full w-full opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.4)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0.4)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
        </div>
      </div>
    </div>
  )
}

function SupremeAction({ icon, label, href = "#", color = "white" }: any) {
  return (
    <Link href={href} className="flex group items-center justify-between rounded-2xl bg-white/5 p-6 transition-all duration-300 hover:bg-white/10 hover:translate-x-2 border border-white/5 active:scale-95">
      <div className="flex items-center gap-5">
        <div className="text-indigo-400 group-hover:text-indigo-300 transition-colors">{icon}</div>
        <span className="font-black tracking-tight text-white/90 text-sm">{label}</span>
      </div>
      <ArrowUpRight className="h-5 w-5 text-neutral-600 group-hover:text-white transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  )
}
