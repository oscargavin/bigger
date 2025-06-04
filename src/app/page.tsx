import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Gym Buddy Accountability
        </h1>
        <p className="text-xl text-muted-foreground">
          Stay motivated and accountable with your workout partner. Track progress, compete, and achieve your fitness goals together.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signin">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/auth/signin">
            <Button size="lg" variant="outline">Sign In</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}