'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'

export function SignInButton() {
  const router = useRouter()

  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'oscarfgavin+b@gmail.com',
      password: 'Bon&vent0',
    })

    if (error) {
      console.error('Sign in error:', error)
    } else {
      console.log('Sign in success:', data)
      // Refresh the page to update server components
      router.refresh()
    }
  }

  return (
    <Button onClick={handleSignIn}>
      Test Sign In
    </Button>
  )
}