import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase-server'

export default async function DebugAuthPage() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Debug Auth Page</h1>
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Cookies:</h2>
        <pre className="bg-muted p-4 rounded text-xs overflow-auto">
          {JSON.stringify(allCookies.map(c => ({ name: c.name, hasValue: !!c.value })), null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Session from getSession():</h2>
        <pre className="bg-muted p-4 rounded text-xs overflow-auto">
          {JSON.stringify({ hasSession: !!session, userId: session?.user?.id }, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">User from getUser():</h2>
        <pre className="bg-muted p-4 rounded text-xs overflow-auto">
          {JSON.stringify({ hasUser: !!user, userId: user?.id }, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Links:</h2>
        <div className="flex gap-4">
          <a href="/dashboard" className="text-blue-500 hover:underline">Go to Dashboard (hard link)</a>
          <a href="/test-auth" className="text-blue-500 hover:underline">Go to Test Auth</a>
        </div>
      </div>
    </div>
  )
}