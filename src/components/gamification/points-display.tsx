'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Zap, TrendingUp, Trophy, Flame } from 'lucide-react'
import { api } from '@/utils/api'
import { cn } from '@/lib/utils'

interface PointsDisplayProps {
  className?: string
  variant?: 'compact' | 'full'
}

export function PointsDisplay({ className, variant = 'full' }: PointsDisplayProps) {
  const { data: stats, isLoading } = api.gamification.getUserStats.useQuery()
  
  if (isLoading || !stats) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <div className="p-6 space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </Card>
    )
  }
  
  const level = stats.level || 1
  const totalPoints = stats.totalPoints || 0
  const consistencyMultiplier = typeof stats.consistencyMultiplier === 'number' ? stats.consistencyMultiplier : 1
  const currentLevelPoints = level === 1 ? 0 : getLevelThreshold(level - 1)
  const nextLevelPoints = getLevelThreshold(level)
  const progressInLevel = totalPoints - currentLevelPoints
  const pointsNeededForLevel = nextLevelPoints - currentLevelPoints
  const progressPercentage = (progressInLevel / pointsNeededForLevel) * 100
  
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">{totalPoints.toLocaleString()} pts</p>
            <p className="text-xs text-muted-foreground">Level {level}</p>
          </div>
        </div>
        <Progress value={progressPercentage} className="w-24 h-2" />
      </div>
    )
  }
  
  return (
    <Card className={cn('border-border/50 bg-surface', className)}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Your Progress</h3>
          {stats.rank && (
            <Badge variant="outline" className="gap-1">
              <Trophy className="h-3 w-3" />
              Rank #{stats.rank}
            </Badge>
          )}
        </div>
        
        {/* Level & Points */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalPoints.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">Level {level}</p>
              <p className="text-sm text-muted-foreground">
                {pointsNeededForLevel - progressInLevel} pts to next
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progressInLevel.toLocaleString()}</span>
              <span>{nextLevelPoints.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border/50 bg-muted/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-medium">This Week</p>
            </div>
            <p className="text-xl font-bold">
              {(stats.weeklyPoints || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="p-4 rounded-lg border border-border/50 bg-muted/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Flame className="h-4 w-4 text-violet-600" />
              </div>
              <p className="text-sm font-medium">This Month</p>
            </div>
            <p className="text-xl font-bold">
              {(stats.monthlyPoints || 0).toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Multiplier */}
        {consistencyMultiplier > 1 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium">Consistency Bonus Active</span>
            </div>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
              {consistencyMultiplier}x Points
            </Badge>
          </div>
        )}
      </div>
    </Card>
  )
}

function getLevelThreshold(level: number): number {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]
  
  if (level < thresholds.length) {
    return thresholds[level]
  }
  
  // After level 10, each level requires 1000 more points
  return 5500 + ((level - 10) * 1000)
}