import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { ClientLayout } from './client-layout'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Verify user is authenticated by calling getUser
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    redirect('/auth/signin')
  }

  return <ClientLayout>{children}</ClientLayout>
}