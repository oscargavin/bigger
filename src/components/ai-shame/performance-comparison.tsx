'use client'

import { api } from '@/utils/api'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Flame, TrendingUp, TrendingDown, Activity, Trophy, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PerformanceComparison() {
  const { data, isLoading } = api.aiShame.getPerformanceComparison.useQuery()

  if (isLoading) {
    return (
      <Card className="card-glass p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (!data) return null

  const comparisons = [
    {
      label: 'Current Streak',
      userValue: data.userStats.currentStreak,
      buddyValue: data.buddyStats.currentStreak,
      icon: Flame,
      unit: 'days',
      colorClass: 'text-orange-500'
    },
    {
      label: 'Weekly Workouts',
      userValue: data.userStats.weeklyWorkouts,
      buddyValue: data.buddyStats.weeklyWorkouts,
      icon: Activity,
      unit: '',
      colorClass: 'text-blue-500'
    },
    {
      label: 'Consistency Rate',
      userValue: Math.round(data.userStats.consistencyRate),
      buddyValue: Math.round(data.buddyStats.consistencyRate),
      icon: Target,
      unit: '%',
      colorClass: 'text-emerald-500'
    },
    {
      label: 'Total Volume',
      userValue: Math.round(data.userStats.totalVolume / 1000),
      buddyValue: Math.round(data.buddyStats.totalVolume / 1000),
      icon: Trophy,
      unit: 'k lbs',
      colorClass: 'text-violet-500'
    }
  ]

  return (
    <Card className="card-glass p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        Head-to-Head vs {data.buddyName}
        {data.comparison.streak.direction === 'behind' && data.comparison.weekly.direction === 'behind' ? (
          <TrendingDown className="w-5 h-5 text-red-500" />
        ) : (
          <TrendingUp className="w-5 h-5 text-emerald-500" />
        )}
      </h3>

      <div className="space-y-4">
        {comparisons.map((comp) => {
          const userProgress = (comp.userValue / (comp.userValue + comp.buddyValue)) * 100
          const isAhead = comp.userValue >= comp.buddyValue
          const Icon = comp.icon

          return (
            <div key={comp.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-4 h-4', comp.colorClass)} />
                  <span className="font-medium">{comp.label}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className={cn('font-semibold', isAhead ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400')}>
                    You: {comp.userValue}{comp.unit}
                  </span>
                  <span className={cn('font-semibold', !isAhead ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400')}>
                    {data.buddyName}: {comp.buddyValue}{comp.unit}
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <Progress 
                  value={userProgress} 
                  className="h-3"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white drop-shadow-md">
                    {isAhead ? '+' : '-'}{Math.abs(comp.userValue - comp.buddyValue)}{comp.unit}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Exercise Comparisons */}
      {data.comparison.exerciseComparison && data.comparison.exerciseComparison.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <h4 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400">
            Strength Comparison
          </h4>
          <div className="space-y-2">
            {data.comparison.exerciseComparison.slice(0, 3).map((exercise) => (
              <div key={exercise.exercise} className="flex items-center justify-between text-sm">
                <span className="font-medium">{exercise.exercise}</span>
                <span className={cn(
                  'font-semibold',
                  exercise.difference > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {exercise.difference > 0 ? '+' : ''}{exercise.difference} lbs ({exercise.percentageDiff > 0 ? '+' : ''}{Math.round(exercise.percentageDiff)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}