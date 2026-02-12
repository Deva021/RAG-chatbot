import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ChatWidget from '@/components/chat/chat-widget'
import { ArrowRight, CheckCircle2, Shield, Zap, Database, Lock } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-purple-500/30">
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl supports-backdrop-filter:bg-black/20">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-blue-600"></div>
            <span className="text-xl font-bold tracking-tight">CSEC RAG Bot</span>
          </Link>
          <nav className="flex items-center gap-6">
             {session ? (
                <div className="flex items-center gap-6">
                  <span className="hidden text-sm text-gray-400 sm:inline-block">
                    {session.user.email}
                  </span>
                  <Link
                      href="/chat"
                      className="text-sm font-medium transition-colors hover:text-white text-gray-300"
                  >
                    Demo App
                  </Link>
                  <form action="/auth/signout" method="post">
                    <button className="text-sm font-medium transition-colors hover:text-white text-gray-300">
                      Sign Out
                    </button>
                  </form>
                </div>
             ) : (
               <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-all hover:bg-gray-200"
                >
                  Sign Up
                </Link>
               </>
             )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          {/* Background Gradients */}
          <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/20 blur-[100px]"></div>
          <div className="absolute top-0 right-0 -z-10 h-[300px] w-[300px] bg-blue-500/10 blur-[80px]"></div>

          <div className="container mx-auto px-6 text-center">
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-green-200 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                CSEC Dev Team Entry
              </div>
              <h1 className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
                CSEC Nexus
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-gray-400">
                A demonstration of RAG (Retrieval-Augmented Generation) technology for the CSEC development team recruitment contest. Submit documents and query them securely.
              </p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row">
                <Link
                  href={session ? "/chat" : "/signup"}
                  className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
                >
                  Try the Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  Project Details
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-black/50">
          <div className="container mx-auto px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Technical Showcase.
              </h2>
              <p className="mt-4 text-gray-400">
                Exploring modern web technologies and AI integration patterns.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Database,
                  title: "Vector Embeddings",
                  desc: "Demonstrating semantic search capabilities using pgvector and Supabase."
                },
                {
                  icon: Shield,
                  title: "Secure Architecture",
                  desc: "Implementing Row Level Security (RLS) and server-side auth protection."
                },
                {
                  icon: Zap,
                  title: "Modern Stack",
                  desc: "Built with Next.js 14 App Router, TypeScript, and Server Actions."
                }
              ].map((feature, i) => (
                <div key={i} className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 transition-colors hover:border-green-500/50 hover:bg-white/10">
                  <div className="mb-4 inline-block rounded-lg bg-white/10 p-3 text-green-400 group-hover:bg-green-500/20 group-hover:text-green-300">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats / Social Proof */}
        <section className="border-y border-white/10 bg-white/5 py-12">
            <div className="container mx-auto flex flex-col gap-8 px-6 text-center md:flex-row md:justify-around text-gray-400">
                <div>
                    <div className="text-3xl font-bold text-white">Next.js</div>
                    <div className="text-sm">App Router</div>
                </div>
                <div>
                    <div className="text-3xl font-bold text-white">Supabase</div>
                    <div className="text-sm">Backend & Auth</div>
                </div>
                <div>
                    <div className="text-3xl font-bold text-white">Tailwind</div>
                    <div className="text-sm">Styling Engine</div>
                </div>
            </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black py-12">
        <div className="container mx-auto px-6 flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-sm text-gray-500">
            © 2026 CSEC Demo Project.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-white">GitHub</Link>
            <Link href="#" className="hover:text-white">Documentation</Link>
          </div>
        </div>
      </footer>
      
      <ChatWidget user={session?.user} />
    </div>
  )
}
