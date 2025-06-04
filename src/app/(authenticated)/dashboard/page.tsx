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
import { GoalProgressWidget } from '@/components/goals/goal-progress-widget'

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
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Track your progress and stay accountable</p>
        {reminderEnabled && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium">
            <Bell className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-700 dark:text-emerald-400">Daily reminders enabled</span>
          </div>
        )}
      </div>

      {/* AI Shame Engine Message */}
      <ShameMessage className="mb-8" autoRefresh />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-surface hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
            <div className="rounded-full bg-emerald-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.currentStreak || 0} <span className="text-lg font-normal text-muted-foreground">days</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Best: {stats?.longestStreak || 0} days
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-surface hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.thisWeek || 0} <span className="text-lg font-normal text-muted-foreground">workouts</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Target: 5 workouts
            </p>
          </CardContent>
        </Card>

        <Card 
          className="border-border/50 bg-surface hover:shadow-lg transition-all duration-200 cursor-pointer"
          onClick={() => router.push('/badges')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Achievements</CardTitle>
            <div className="rounded-full bg-amber-500/10 p-2">
              <Award className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {userBadges?.length || 0} <span className="text-lg font-normal text-muted-foreground">earned</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Unlock achievements
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-surface hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gym Buddy</CardTitle>
            <div className="rounded-full bg-violet-500/10 p-2">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentPairing ? currentPairing.buddy.username : 'Not paired'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {currentPairing ? 'Stay accountable' : 'Find a partner'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Activity Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border-border/50 bg-surface">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl">Quick Actions</CardTitle>
            <CardDescription>Start your workout journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full h-12 text-base font-medium shadow-sm" 
              size="lg"
              onClick={() => router.push('/workouts')}
            >
              Log Today&apos;s Workout
            </Button>
            <Button 
              className="w-full h-12 text-base font-medium" 
              variant="outline" 
              size="lg"
              onClick={() => router.push('/buddy')}
              disabled={!!currentPairing}
            >
              {currentPairing ? 'View Buddy Profile' : 'Find Gym Buddy'}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/50 bg-surface">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl">Recent Activity</CardTitle>
            <CardDescription>Your workout history</CardDescription>
          </CardHeader>
          <CardContent>
            {recentWorkouts && recentWorkouts.length > 0 ? (
              <div className="space-y-4">
                {recentWorkouts.map((workout) => (
                  <div 
                    key={workout.id} 
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/5 p-4 hover:bg-muted/10 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      {workout.photos?.[0] ? (
                        <div className="relative h-14 w-14">
                          <Image
                            src={workout.photos[0].photo_url}
                            alt="Workout"
                            fill
                            className="rounded-lg object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-muted/50 flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">
                          {new Date(workout.completed_at).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {workout.duration_minutes ? `${workout.duration_minutes} min` : 'No duration'} 
                          {workout.notes && ` • ${workout.notes.substring(0, 30)}${workout.notes.length > 30 ? '...' : ''}`}
                        </p>
                      </div>
                    </div>
                    <WorkoutActions
                      workoutId={workout.id}
                      durationMinutes={workout.duration_minutes}
                      notes={workout.notes}
                      onUpdate={async () => {
                        await Promise.all([
                          utils.workouts.getMyWorkouts.invalidate(),
                          utils.workouts.getStats.invalidate(),
                          utils.badges.getUserBadges.invalidate(),
                          utils.badges.getRecentBadges.invalidate()
                        ])
                      }}
                      onDelete={async () => {
                        await Promise.all([
                          utils.workouts.getMyWorkouts.invalidate(),
                          utils.workouts.getStats.invalidate(),
                          utils.badges.getUserBadges.invalidate(),
                          utils.badges.getRecentBadges.invalidate()
                        ])
                      }}
                    />
                  </div>
                ))}
                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={() => router.push('/workouts')}
                >
                  View all workouts →
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-16 rounded-xl bg-muted/5">
                <p className="text-muted-foreground">No recent workouts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison - Only show if user has a buddy */}
      {currentPairing && (
        <div className="mb-8">
          <PerformanceComparison />
        </div>
      )}

      {/* Streak Calendar and Progress Summary */}
      <div className="grid gap-8 lg:grid-cols-3">
        {stats && (
          <Card className="border-border/50 bg-surface lg:col-span-2">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl">Workout Calendar</CardTitle>
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
        
        <div className="space-y-8">
          <QuickStats />
          <GoalProgressWidget />
        </div>
      </div>
    </div>
  )
}