'use client'

import { useState } from 'react'
import { api } from '@/utils/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Info,
  Weight,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { BadgeDisplay } from '@/components/badges/badge-display'

interface ProgressReportProps {
  period?: 'week' | 'month' | 'quarter' | 'year'
  offset?: number
}

export function ProgressReport({ period = 'week', offset = 0 }: ProgressReportProps) {
  const [currentOffset, setCurrentOffset] = useState(offset)
  const [currentPeriod, setCurrentPeriod] = useState(period)

  const { data: report, isLoading } = api.reports.generateReport.useQuery({
    period: currentPeriod,
    offset: currentOffset,
  })

  const { data: availableReports } = api.reports.getAvailableReports.useQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <Activity className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Generating your progress report...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No data available for this period</p>
        </CardContent>
      </Card>
    )
  }

  const periodLabel = currentOffset === 0 
    ? `This ${currentPeriod}` 
    : currentOffset === 1 
    ? `Last ${currentPeriod}`
    : `${currentOffset} ${currentPeriod}s ago`

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Progress Report</h2>
          <p className="text-muted-foreground">
            {format(new Date(report.period.startDate), 'MMM d')} - {format(new Date(report.period.endDate), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentOffset(currentOffset + 1)}
            disabled={!availableReports?.some(r => r.type === currentPeriod && r.offset === currentOffset + 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-3 py-1 border rounded-md min-w-[120px] text-center">
            {periodLabel}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentOffset(Math.max(0, currentOffset - 1))}
            disabled={currentOffset === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Period selector */}
      <Tabs value={currentPeriod} onValueChange={(v) => {
        setCurrentPeriod(v as typeof currentPeriod)
        setCurrentOffset(0)
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="week">Weekly</TabsTrigger>
          <TabsTrigger value="month">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value={currentPeriod} className="space-y-6 mt-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Workouts"
              value={report.summary.totalWorkouts}
              comparison={report.comparison.workoutGrowth}
              previousValue={report.comparison.previousWorkouts}
              icon={Activity}
              color="blue"
            />
            <MetricCard
              title="Total Duration"
              value={`${report.summary.totalDuration} min`}
              comparison={report.comparison.durationGrowth}
              previousValue={`${report.comparison.previousDuration} min`}
              icon={Clock}
              color="purple"
            />
            <MetricCard
              title="Consistency"
              value={`${Math.round(report.summary.consistency)}%`}
              subtitle={`${report.summary.workoutDays}/${report.summary.totalDays} days`}
              icon={Calendar}
              color="emerald"
            />
            <MetricCard
              title="Avg Duration"
              value={`${Math.round(report.summary.avgDuration)} min`}
              icon={Activity}
              color="amber"
            />
          </div>

          {/* Insights */}
          {report.insights.length > 0 && (
            <Card className="card-glass border-2 border-border/50 shadow-soft-xl">
              <CardHeader>
                <CardTitle className="text-lg">Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.insights.map((insight, i) => (
                  <div key={i} className={cn(
                    "flex items-start gap-3 p-3 rounded-lg",
                    insight.type === 'success' && "bg-emerald-50 dark:bg-emerald-900/20",
                    insight.type === 'warning' && "bg-amber-50 dark:bg-amber-900/20",
                    insight.type === 'info' && "bg-blue-50 dark:bg-blue-900/20"
                  )}>
                    {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />}
                    {insight.type === 'warning' && <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />}
                    {insight.type === 'info' && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />}
                    <p className="text-sm">{insight.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Weight Progress */}
          {report.weightProgress && (
            <Card className="card-interactive border-2 border-border dark:border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Weight className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  <CardTitle className="text-lg">Weight Progress</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{report.weightProgress.starting.toFixed(1)} kg</p>
                    <p className="text-xs text-muted-foreground">Starting</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{report.weightProgress.current.toFixed(1)} kg</p>
                    <p className="text-xs text-muted-foreground">Current</p>
                  </div>
                  <div>
                    <p className={cn(
                      "text-2xl font-bold",
                      report.weightProgress.change > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {report.weightProgress.change > 0 ? '+' : ''}{report.weightProgress.change.toFixed(1)} kg
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.weightProgress.percentageChange > 0 ? '+' : ''}{report.weightProgress.percentageChange.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Badges Earned */}
          {report.badgesEarned.length > 0 && (
            <Card className="card-interactive border-2 border-border dark:border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <CardTitle className="text-lg">Achievements Unlocked</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {report.badgesEarned.map((userBadge) => (
                    <BadgeDisplay
                      key={userBadge.id}
                      badge={{
                        ...userBadge.badge,
                        earned: true,
                        earnedAt: userBadge.earned_at,
                      }}
                      size="md"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Exercises */}
          {report.topExercises.length > 0 && (
            <Card className="card-interactive border-2 border-border dark:border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  <CardTitle className="text-lg">Most Performed Exercises</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.topExercises.map((exercise: any, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-raised dark:bg-surface-base">
                      <div>
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {exercise.sessions} sessions • {exercise.totalSets} sets
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{exercise.maxWeight} kg</p>
                        <p className="text-xs text-muted-foreground">Max weight</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="mr-2 h-4 w-4" />
              Share Progress
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  comparison?: number
  previousValue?: string | number
  subtitle?: string
  icon: any
  color: string
}

function MetricCard({ title, value, comparison, previousValue, subtitle, icon: Icon, color }: MetricCardProps) {
  const colorMap = {
    blue: 'from-blue-500/10 to-transparent dark:from-blue-400/10',
    purple: 'from-purple-500/10 to-transparent dark:from-purple-400/10',
    emerald: 'from-emerald-500/10 to-transparent dark:from-emerald-400/10',
    amber: 'from-amber-500/10 to-transparent dark:from-amber-400/10',
  }

  const iconColorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 ring-blue-200 dark:ring-blue-800 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 ring-purple-200 dark:ring-purple-800 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 ring-emerald-200 dark:ring-emerald-800 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 ring-amber-200 dark:ring-amber-800 text-amber-600 dark:text-amber-400',
  }

  return (
    <Card className="card-elevated hover-lift overflow-hidden relative">
      <div className={cn("absolute inset-0 bg-gradient-to-br", colorMap[color as keyof typeof colorMap])} />
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("rounded-lg p-2 ring-1", iconColorMap[color as keyof typeof iconColorMap])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {comparison !== undefined && previousValue !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {comparison > 0 ? (
              <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            ) : comparison < 0 ? (
              <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
            ) : null}
            <p className={cn(
              "text-xs",
              comparison > 0 && "text-emerald-600 dark:text-emerald-400",
              comparison < 0 && "text-red-600 dark:text-red-400",
              comparison === 0 && "text-muted-foreground"
            )}>
              {comparison > 0 ? '+' : ''}{Math.round(comparison)}% vs {previousValue}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}