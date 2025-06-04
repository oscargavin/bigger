'use client'

import { api } from '@/utils/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileBarChart, TrendingUp, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function QuickStats() {
  const router = useRouter()
  const { data: stats } = api.reports.getQuickStats.useQuery()

  if (!stats) return null

  const weekProgress = stats.week.workouts >= 5 ? 100 : (stats.week.workouts / 5) * 100

  return (
    <Card className="card-interactive border-2 border-border dark:border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Progress Summary</CardTitle>
            <CardDescription>Your fitness journey at a glance</CardDescription>
          </div>
          <div className="rounded-lg bg-brand-100 dark:bg-brand-900/30 p-2 ring-1 ring-brand-200 dark:ring-brand-800">
            <FileBarChart className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weekly Target Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Weekly Target</span>
            <span className="text-muted-foreground">{stats.week.workouts}/5 workouts</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full transition-all duration-500",
                weekProgress >= 100
                  ? "bg-emerald-500"
                  : weekProgress >= 60
                  ? "bg-primary"
                  : "bg-amber-500"
              )}
              style={{ width: `${Math.min(100, weekProgress)}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-background-subtle dark:bg-surface-base p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium">This Week</p>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.week.workouts}</p>
            <p className="text-xs text-muted-foreground">{stats.week.duration} min total</p>
          </div>
          
          <div className="rounded-lg bg-background-subtle dark:bg-surface-base p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <p className="text-sm font-medium">This Month</p>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.month.workouts}</p>
            <p className="text-xs text-muted-foreground">{stats.month.duration} min total</p>
          </div>
        </div>

        {/* View Full Report Button */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => router.push('/reports')}
        >
          View Detailed Reports
        </Button>
      </CardContent>
    </Card>
  )
}