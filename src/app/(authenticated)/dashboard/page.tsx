'use client'

import { api } from '@/utils/api'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Trophy, Users, TrendingUp, Image as ImageIcon, Bell, Award } from 'lucide-react'
import { StreakCalendar } from '@/components/calendar/streak-calendar'
import { WorkoutActions } from '@/components/workouts/workout-actions'
import { BadgeDisplay } from '@/components/badges/badge-display'
import { QuickStats } from '@/components/reports/quick-stats'
import { ShameMessage } from '@/components/ai-shame/shame-message'
import { PerformanceComparison } from '@/components/ai-shame/performance-comparison'

export default function DashboardPage() {
  const router = useRouter()
  const utils = api.useUtils()
  const { data: user } = api.auth.getUser.useQuery()
  const { data: currentPairing } = api.pairings.getCurrentPairing.useQuery()
  const { data: stats } = api.workouts.getStats.useQuery()
  const { data: recentWorkouts } = api.workouts.getMyWorkouts.useQuery({ limit: 3 })
  const { data: userBadges } = api.badges.getUserBadges.useQuery({})
  const { data: recentBadges } = api.badges.getRecentBadges.useQuery({ limit: 3 })

  const reminderEnabled = user?.notificationPreferences?.dailyReminder?.enabled

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back{user?.fullName ? `, ${user.fullName}` : ''}!</h1>
        <p className="text-muted-foreground">Track your progress and stay accountable</p>
        {reminderEnabled && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs">
            <Bell className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-300">Daily reminders enabled</span>
          </div>
        )}
      </div>

      {/* AI Shame Engine Message */}
      <ShameMessage className="mb-6" autoRefresh />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-elevated hover-lift overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent dark:from-emerald-400/10" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2 ring-1 ring-emerald-200 dark:ring-emerald-800">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
              {stats?.currentStreak || 0} days
            </div>
            <p className="text-xs text-muted-foreground">Best: {stats?.longestStreak || 0} days</p>
          </CardContent>
        </Card>

        <Card className="card-elevated hover-lift overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent dark:from-brand-400/10" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <div className="rounded-lg bg-brand-100 dark:bg-brand-900/30 p-2 ring-1 ring-brand-200 dark:ring-brand-800">
              <Calendar className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-gradient-to-br from-brand-600 to-brand-500 dark:from-brand-400 dark:to-brand-300 bg-clip-text text-transparent">
              {stats?.thisWeek || 0} workouts
            </div>
            <p className="text-xs text-muted-foreground">Target: 5 workouts</p>
          </CardContent>
        </Card>

        <Card 
          className="card-elevated hover-lift overflow-hidden relative cursor-pointer"
          onClick={() => router.push('/badges')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent dark:from-amber-400/10" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2 ring-1 ring-amber-200 dark:ring-amber-800">
              <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-gradient-to-br from-amber-600 to-amber-500 dark:from-amber-400 dark:to-amber-300 bg-clip-text text-transparent">
              {userBadges?.length || 0} earned
            </div>
            <p className="text-xs text-muted-foreground">Unlock achievements</p>
          </CardContent>
        </Card>

        <Card className="card-elevated hover-lift overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent dark:from-violet-400/10" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gym Buddy</CardTitle>
            <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-2 ring-1 ring-violet-200 dark:ring-violet-800">
              <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-gradient-to-br from-violet-600 to-violet-500 dark:from-violet-400 dark:to-violet-300 bg-clip-text text-transparent">
              {currentPairing ? currentPairing.buddy.username : 'Not paired'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentPairing ? 'Stay accountable' : 'Find a partner'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-interactive border-2 border-border dark:border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Start your workout journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 dark:from-brand-500 dark:to-brand-400 dark:hover:from-brand-600 dark:hover:to-brand-500 text-white shadow-soft hover:shadow-soft-md transition-all duration-200" 
              size="lg"
              onClick={() => router.push('/workouts')}
            >
              Log Workout
            </Button>
            <Button 
              className="w-full border-2 hover:bg-accent/10 dark:hover:bg-accent/20" 
              variant="outline" 
              size="lg"
              onClick={() => router.push('/buddy')}
              disabled={!!currentPairing}
            >
              {currentPairing ? 'View Buddy' : 'Find Gym Buddy'}
            </Button>
          </CardContent>
        </Card>

        <Card className="card-interactive border-2 border-border dark:border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Your workout history</CardDescription>
          </CardHeader>
          <CardContent>
            {recentWorkouts && recentWorkouts.length > 0 ? (
              <div className="space-y-3">
                {recentWorkouts.map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface-raised dark:bg-surface-base p-3 hover:bg-surface-overlay dark:hover:bg-surface-raised transition-colors">
                    <div className="flex items-center gap-3">
                      {workout.photos?.[0] ? (
                        <div className="relative h-10 w-10">
                          <Image
                            src={workout.photos[0].photo_url}
                            alt="Workout"
                            fill
                            className="rounded-lg object-cover ring-2 ring-border/50"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(workout.completed_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {workout.duration_minutes ? `${workout.duration_minutes} min` : 'No duration'} 
                          {workout.notes && ` • ${workout.notes}`}
                        </p>
                      </div>
                    </div>
                    <WorkoutActions
                      workoutId={workout.id}
                      durationMinutes={workout.duration_minutes}
                      notes={workout.notes}
                      onUpdate={() => {
                        utils.workouts.getMyWorkouts.invalidate()
                        utils.workouts.getStats.invalidate()
                      }}
                      onDelete={() => {
                        utils.workouts.getMyWorkouts.invalidate()
                        utils.workouts.getStats.invalidate()
                      }}
                    />
                  </div>
                ))}
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push('/workouts')}
                >
                  View all workouts →
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 rounded-lg bg-background-subtle dark:bg-surface-base">
                <p className="text-sm text-muted-foreground">No recent workouts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison - Only show if user has a buddy */}
      {currentPairing && (
        <div className="mb-6">
          <PerformanceComparison />
        </div>
      )}

      {/* Streak Calendar and Progress Summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        {stats && (
          <Card className="card-glass border-2 border-border/50 shadow-soft-xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Workout Calendar</CardTitle>
              <CardDescription>Track your consistency over time</CardDescription>
            </CardHeader>
            <CardContent>
              <StreakCalendar
                workoutDates={stats.workoutDates?.map(date => new Date(date)) || []}
                currentStreak={stats.currentStreak}
                longestStreak={stats.longestStreak}
              />
            </CardContent>
          </Card>
        )}
        
        <QuickStats />
      </div>
    </div>
  )
}