import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Camera, 
  Bell, 
  Zap,
  CheckCircle,
  Calendar,
  BarChart3,
  Target
} from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6 lg:p-8">
        <div className="container mx-auto">
          <Link href="/" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors w-fit">
            <Image 
              src="/android-chrome-512x512.png" 
              alt="Bigger Logo" 
              width={32} 
              height={32}
              className="rounded-lg"
            />
            <span className="text-xl font-semibold">Bigger</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Never Skip Gym Day
              <span className="block text-3xl md:text-4xl mt-4 text-muted-foreground font-normal">
                Again.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The accountability app that pairs you with a workout buddy, tracks your progress, and keeps you motivated through friendly competition.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/auth/signin">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              We Get It. Staying Consistent is Hard.
            </h2>
            <div className="text-lg text-muted-foreground space-y-4">
              <p>You start strong, motivated for a week or two. Then life happens.</p>
              <p>No one notices if you skip. No consequences. No accountability.</p>
              <p className="font-semibold text-foreground">Until now.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Personal Accountability System
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to stay on track and reach your goals
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 border-border/50 hover:shadow-lg transition-shadow">
              <Users className="h-12 w-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-3">Buddy System</h3>
              <p className="text-muted-foreground">
                Get paired with someone on the same journey. Check in daily, share progress, and keep each other accountable.
              </p>
            </Card>

            <Card className="p-8 border-border/50 hover:shadow-lg transition-shadow">
              <Camera className="h-12 w-12 mb-4 text-emerald-600" />
              <h3 className="text-xl font-semibold mb-3">Photo Check-ins</h3>
              <p className="text-muted-foreground">
                Prove you showed up. Quick gym selfies create a visual log of your consistency and progress.
              </p>
            </Card>

            <Card className="p-8 border-border/50 hover:shadow-lg transition-shadow">
              <Trophy className="h-12 w-12 mb-4 text-amber-600" />
              <h3 className="text-xl font-semibold mb-3">Friendly Competition</h3>
              <p className="text-muted-foreground">
                Compete in challenges, climb leaderboards, and earn achievements. Turn fitness into a game you want to win.
              </p>
            </Card>

            <Card className="p-8 border-border/50 hover:shadow-lg transition-shadow">
              <TrendingUp className="h-12 w-12 mb-4 text-violet-600" />
              <h3 className="text-xl font-semibold mb-3">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Track workouts, monitor streaks, and visualize your journey. See how far you&apos;ve come with detailed analytics.
              </p>
            </Card>

            <Card className="p-8 border-border/50 hover:shadow-lg transition-shadow">
              <Bell className="h-12 w-12 mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-3">Smart Reminders</h3>
              <p className="text-muted-foreground">
                Never forget leg day again. Customizable notifications keep you on schedule and your buddy informed.
              </p>
            </Card>

            <Card className="p-8 border-border/50 hover:shadow-lg transition-shadow">
              <Zap className="h-12 w-12 mb-4 text-orange-600" />
              <h3 className="text-xl font-semibold mb-3">Stakes & Rewards</h3>
              <p className="text-muted-foreground">
                Put something on the line. Set consequences for missing workouts and rewards for hitting milestones.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple to Start, Easy to Stick With
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Sign Up & Set Your Goals</h3>
                <p className="text-muted-foreground">
                  Create your profile, set your workout schedule, and define what success looks like for you.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Get Matched with Your Buddy</h3>
                <p className="text-muted-foreground">
                  We&apos;ll pair you with someone who has similar goals and schedule. Your accountability partner in fitness.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Check In & Stay Accountable</h3>
                <p className="text-muted-foreground">
                  Log your workouts, share progress photos, and keep each other motivated. Watch your streak grow!
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Compete & Celebrate</h3>
                <p className="text-muted-foreground">
                  Join challenges, earn achievements, and celebrate milestones together. Make fitness fun and rewarding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join Thousands Getting Stronger Together
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-5xl font-bold mb-2">92%</div>
              <p className="text-muted-foreground">of users maintain their workout streak after 30 days</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">3.5x</div>
              <p className="text-muted-foreground">more likely to reach fitness goals with a buddy</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">15min</div>
              <p className="text-muted-foreground">average time to find your perfect accountability partner</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Fitness Journey?
            </h2>
            <p className="text-xl text-muted-foreground">
              Stop going it alone. Start today and discover the power of having someone in your corner.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/auth/signin">
                <Button size="lg" className="text-lg px-8 py-6">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              No credit card required • Free to start • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 Bigger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}