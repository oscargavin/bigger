'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Activity, Trophy, Flame, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ProgressSummary } from '@/server/services/ai-smart-insights-service'

interface ProgressSummaryProps {
  summary: ProgressSummary
}

export function ProgressSummaryCard({ summary }: ProgressSummaryProps) {
  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return null
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Summary</CardTitle>
        <CardDescription>
          Your {summary.period} performance overview
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Workouts</span>
            </div>
            <p className="text-2xl font-bold">{summary.totalWorkouts}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">New PRs</span>
            </div>
            <p className="text-2xl font-bold">{summary.newPRs}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Volume Change</span>
            <div className="flex items-center gap-2">
              {getChangeIcon(summary.volumeChange)}
              <span className={`text-sm font-medium ${getChangeColor(summary.volumeChange)}`}>
                {formatChange(summary.volumeChange)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Duration Change</span>
            <div className="flex items-center gap-2">
              {getChangeIcon(summary.durationChange)}
              <span className={`text-sm font-medium ${getChangeColor(summary.durationChange)}`}>
                {formatChange(summary.durationChange)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Streak Status</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current</span>
              <Badge variant={summary.streakStatus.current > 0 ? 'default' : 'secondary'}>
                {summary.streakStatus.current} days
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Longest</span>
              <Badge variant="outline">{summary.streakStatus.longest} days</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trend</span>
              <Badge 
                variant={
                  summary.streakStatus.trend === 'improving' ? 'default' :
                  summary.streakStatus.trend === 'declining' ? 'destructive' : 'secondary'
                }
              >
                {summary.streakStatus.trend}
              </Badge>
            </div>
          </div>
        </div>

        {summary.bodyComposition.weightChange !== 0 && (
          <div className="space-y-2 pt-2 border-t">
            <span className="text-sm font-medium">Body Composition</span>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Weight</span>
                <span className={`text-sm font-medium ${getChangeColor(summary.bodyComposition.weightChange)}`}>
                  {summary.bodyComposition.weightChange > 0 ? '+' : ''}
                  {summary.bodyComposition.weightChange.toFixed(1)} lbs
                </span>
              </div>
              {summary.bodyComposition.bodyFatChange !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Body Fat</span>
                  <span className={`text-sm font-medium ${getChangeColor(-summary.bodyComposition.bodyFatChange)}`}>
                    {formatChange(summary.bodyComposition.bodyFatChange)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {(summary.highlights.length > 0 || summary.concerns.length > 0) && (
          <div className="space-y-3 pt-2 border-t">
            {summary.highlights.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Highlights</span>
                </div>
                <ul className="space-y-1">
                  {summary.highlights.map((highlight, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {summary.concerns.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-600">Areas of Concern</span>
                </div>
                <ul className="space-y-1">
                  {summary.concerns.map((concern, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}