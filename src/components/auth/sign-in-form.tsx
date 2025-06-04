'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/utils/api'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const signUp = api.auth.signUp.useMutation({
    onSuccess: () => {
      router.push('/dashboard')
      router.refresh()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignUp) {
        signUp.mutate({ email, password, username, fullName })
      } else {
        // Use Supabase client directly for sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(signInError.message)
        } else if (data.session) {
          // Force a hard navigation to ensure cookies are properly set
          window.location.href = '/dashboard'
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      if (!isSignUp) {
        setLoading(false)
      }
    }
  }

  return (
    <Card className="w-full border-border/50 shadow-sm">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-semibold">
          {isSignUp ? 'Create an account' : 'Sign in to your account'}
        </CardTitle>
        <CardDescription className="text-base">
          {isSignUp 
            ? 'Start your fitness journey today' 
            : 'Welcome back! Please enter your details'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium" 
            disabled={loading || signUp.isPending}
          >
            {loading || signUp.isPending ? 'Loading...' : (isSignUp ? 'Create account' : 'Sign in')}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {isSignUp ? 'Already have an account?' : 'New to Gym Buddy?'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary hover:text-primary/90 font-medium transition-colors"
          >
            {isSignUp ? 'Sign in instead' : 'Create an account'}
          </button>

          {(error || signUp.error) && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive text-center">
                {error || signUp.error?.message}
              </p>
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}