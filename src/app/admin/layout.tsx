import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // TODO: Add real Admin Role check here when profiles table has roles
  // const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  // if (profile?.role !== 'admin') { redirect('/') }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full border-b bg-gray-50 md:w-64 md:border-r md:border-b-0">
        <div className="p-6">
          <h2 className="text-lg font-bold">Admin Panel</h2>
        </div>
        <nav className="space-y-1 px-4">
          <Link
            href="/admin"
            className="flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-gray-200"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/documents"
            className="flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-gray-200"
          >
            Documents
          </Link>
          <Link
            href="/"
            className="flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-200"
          >
            Back to App
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
