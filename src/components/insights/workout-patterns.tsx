'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { WorkoutPattern } from '@/server/services/ai-smart-insights-service'

interface WorkoutPatternsProps {
  patterns: WorkoutPattern
}

export function WorkoutPatterns({ patterns }: WorkoutPatternsProps) {
  const getVolumeTrendIcon = () => {
    switch (patterns.volumeTrend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getVolumeTrendColor = () => {
    switch (patterns.volumeTrend) {
      case 'increasing':
        return 'text-green-600'
      case 'decreasing':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Patterns</CardTitle>
        <CardDescription>Your training habits over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Frequency</p>
            <p className="text-2xl font-bold">{patterns.frequency.toFixed(1)}x/week</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Duration</p>
            <p className="text-2xl font-bold">{Math.round(patterns.averageDuration)} min</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Consistency</span>
            <span className="text-sm font-medium">{Math.round(patterns.consistency * 100)}%</span>
          </div>
          <Progress value={patterns.consistency * 100} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Volume Trend</span>
            {getVolumeTrendIcon()}
            <span className={`text-sm font-medium capitalize ${getVolumeTrendColor()}`}>
              {patterns.volumeTrend}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Preferred Days</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {patterns.preferredDays.map((day) => (
              <Badge key={day} variant="secondary">
                {day}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Preferred Times</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {patterns.preferredTimes.map((time) => (
              <Badge key={time} variant="secondary">
                {time}
              </Badge>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Exercise Variety</span>
            <span className="text-sm font-medium">{patterns.exerciseVariety} exercises</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}