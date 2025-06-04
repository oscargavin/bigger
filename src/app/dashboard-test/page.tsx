import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export default async function DashboardTestPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard Test (No Layout)</h1>
      <p>User ID: {session.user.id}</p>
      <p>Email: {session.user.email}</p>
      <a href="/dashboard" className="text-blue-500 hover:underline">Try regular dashboard</a>
    </div>
  )
}