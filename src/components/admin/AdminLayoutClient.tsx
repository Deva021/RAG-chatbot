'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, FileText, ExternalLink, ShieldCheck, Zap, Bell, Search } from 'lucide-react'

export default function AdminLayoutClient({ 
  user, 
  children 
}: { 
  user: any, 
  children: React.ReactNode 
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery) {
      params.set('q', searchQuery)
    } else {
      params.delete('q')
    }
    router.push(`/admin/documents?${params.toString()}`)
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-white dark:bg-neutral-950 font-sans selection:bg-indigo-500/30">
      {/* GLOBAL KINETIC BACKGROUND */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -left-[15%] top-[10%] h-[800px] w-[800px] animate-blob rounded-full bg-indigo-400/10 mix-blend-screen blur-[120px] filter dark:bg-indigo-900/10" />
        <div className="animation-delay-2000 absolute -right-[15%] top-[30%] h-[800px] w-[800px] animate-blob rounded-full bg-violet-400/10 mix-blend-screen blur-[120px] filter dark:bg-violet-900/10" />
        <div className="animation-delay-4000 absolute bottom-[5%] left-[25%] h-[800px] w-[800px] animate-blob rounded-full bg-cyan-400/10 mix-blend-screen blur-[120px] filter dark:bg-cyan-900/10" />
      </div>

      {/* ULTRA-GLASS SIDEBAR */}
      <aside className="fixed left-8 top-8 bottom-8 hidden w-80 lg:flex flex-col overflow-hidden rounded-[3rem] border border-white/40 bg-white/30 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] backdrop-blur-2xl dark:border-white/5 dark:bg-neutral-900/30">
        <div className="p-10">
          <div className="flex items-center gap-4">
             <div className="relative group">
                <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative h-12 w-12 flex items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl">
                  <ShieldCheck className="h-7 w-7" />
                </div>
             </div>
             <div>
               <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">CSEC Intelligence</h2>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">Core Engine</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 space-y-3 px-6 py-6" aria-label="Admin Navigation">
          <SidebarLink href="/admin" icon={<LayoutDashboard className="h-5 w-5" />} label="Command Center" />
          <SidebarLink href="/admin/documents" icon={<FileText className="h-5 w-5" />} label="Neural Assets" />
          
          <div className="py-6">
            <div className="h-px w-full bg-linear-to-r from-transparent via-neutral-200 to-transparent dark:via-neutral-800" />
          </div>
          
          <SidebarLink href="/" icon={<ExternalLink className="h-5 w-5" />} label="Live Portal" secondary />
        </nav>

        <div className="p-10 pt-0">
          <div className="group relative rounded-4xl bg-indigo-600/5 p-6 border border-indigo-600/10 backdrop-blur-md overflow-hidden transition-all hover:bg-indigo-600/10">
             <div className="absolute top-0 right-0 -mr-4 -mt-4 h-16 w-16 bg-indigo-400/10 blur-xl rounded-full" />
             <div className="flex items-center gap-3 mb-4">
               <div className="h-6 w-6 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                 <Zap className="h-4 w-4 text-indigo-600 fill-indigo-600" />
               </div>
               <span className="text-[11px] font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-100">Sync Status</span>
             </div>
             <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mb-3" role="progressbar" aria-valuenow={92} aria-valuemin={0} aria-valuemax={100}>
               <div className="h-full w-[92%] bg-linear-to-r from-indigo-500 to-violet-600 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.6)] animate-pulse" />
             </div>
             <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 leading-relaxed italic">Intelligence vectors fully synchronized across edge nodes.</p>
          </div>
        </div>
      </aside>

      {/* SUPREME CONTENT SHELL */}
      <main className="flex-1 lg:ml-96 min-h-screen flex flex-col">
        {/* HIFI TOP HEADER */}
        <header className="sticky top-0 z-50 h-24 flex items-center justify-between px-12 backdrop-blur-xl border-b border-transparent group hover:border-neutral-100 transition-all dark:hover:border-neutral-800">
           <form onSubmit={handleSearch} className="flex items-center gap-4 bg-white/50 dark:bg-neutral-900/50 px-6 py-2.5 rounded-2xl border border-white/50 dark:border-neutral-800/50 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
              <Search className="h-4 w-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search documents..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm font-bold text-neutral-700 outline-none w-64 placeholder:text-neutral-300 dark:text-neutral-300" 
              />
           </form>
           
           <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer">
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-white dark:border-neutral-950" />
                <Bell className="h-5 w-5 text-neutral-500 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex items-center gap-4 group cursor-pointer">
                 <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-neutral-900 dark:text-white">Admin Terminal</span>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Operator Active</span>
                 </div>
                 <div className="h-10 w-10 rounded-xl bg-linear-to-br from-indigo-600 to-violet-700 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
                   <div className="h-full w-full rounded-[0.55rem] bg-white dark:bg-neutral-900 flex items-center justify-center font-black text-indigo-600 text-sm">
                      {user?.email?.substring(0, 2).toUpperCase() || 'AD'}
                   </div>
                 </div>
              </div>
           </div>
        </header>

        <div className="flex-1 p-12">
          {children}
        </div>
      </main>

      {/* Supreme Global Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(50px, -80px) scale(1.2); }
          66% { transform: translate(-40px, 40px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 15s infinite alternate ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 4s;
        }
        .animation-delay-4000 {
          animation-delay: 8s;
        }
      `}} />
    </div>
  )
}

function SidebarLink({ href, icon, label, secondary = false }: { href: string, icon: React.ReactNode, label: string, secondary?: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-4 rounded-2xl px-6 py-4.5 transition-all duration-500 ${
        secondary 
        ? 'text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400' 
        : 'text-neutral-600 hover:text-white dark:text-neutral-400'
      }`}
    >
      <div className="relative z-10 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-3">
        {icon}
      </div>
      <span className="relative z-10 text-[13px] font-black tracking-widest uppercase">{label}</span>
      
      {/* Link Hover State */}
      {!secondary && (
        <div className="absolute inset-0 z-0 bg-linear-to-r from-indigo-600 to-violet-600 opacity-0 scale-95 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100 rounded-2xl shadow-xl shadow-indigo-500/30" />
      )}
      {secondary && (
        <div className="absolute inset-0 z-0 bg-indigo-50 dark:bg-indigo-900/10 opacity-0 scale-95 transition-all duration-500 group-hover:opacity-100 group-hover:scale-100 rounded-2xl border border-indigo-100 dark:border-indigo-900/20" />
      )}
    </Link>
  )
}
