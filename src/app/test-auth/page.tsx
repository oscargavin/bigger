import { createClient } from '@/lib/supabase-server'
import { SignInButton } from '@/components/auth/auth-button'
import { supabase } from '@/lib/supabase-client'

export default async function TestAuthPage() {
  const serverSupabase = await createClient()
  const { data: { session }, error } = await serverSupabase.auth.getSession()

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Auth Test Page</h1>
      
      <div className="space-y-2">
        <p>Server Session: {session ? 'Found' : 'Not found'}</p>
        <p>User ID: {session?.user?.id || 'None'}</p>
        <p>Email: {session?.user?.email || 'None'}</p>
        {error && <p className="text-red-500">Error: {error.message}</p>}
      </div>

      <div className="space-y-2">
        <SignInButton />
        <p className="text-sm text-muted-foreground">
          Click to test sign in with hardcoded credentials
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
        <pre className="bg-muted p-4 rounded text-xs overflow-auto">
          {JSON.stringify({ session, error }, null, 2)}
        </pre>
      </div>
    </div>
  )
}