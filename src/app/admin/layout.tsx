import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

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

  // Strict Admin Role Check
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !profile || profile.role !== 'admin') {
    redirect('/')
  }

  return (
    <AdminLayoutClient user={user}>
      {children}
    </AdminLayoutClient>
  )
}
