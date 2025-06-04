'use client'

import { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Flame, TrendingDown, Trophy, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShameMessageProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function ShameMessage({ className, autoRefresh = false, refreshInterval = 3600000 }: ShameMessageProps) {
  const [messageType, setMessageType] = useState<'shame' | 'motivational' | 'celebration' | undefined>()
  
  const { data, isLoading, refetch } = api.aiShame.getPersonalizedMessage.useQuery(
    { messageType },
    {
      refetchInterval: autoRefresh ? refreshInterval : false,
    }
  )

  const getMessageStyle = () => {
    if (!data?.context) return {}
    
    const context = data.context as any
    const { event, severity } = context
    
    if (event === 'pr_achieved' || event === 'milestone' || event === 'crushing_it') {
      return {
        icon: Trophy,
        iconColor: 'text-emerald-600',
        iconBgColor: 'bg-emerald-500/10',
        textColor: 'text-foreground'
      }
    }
    
    if (event === 'streak_broken' || severity === 'nuclear') {
      return {
        icon: AlertTriangle,
        iconColor: 'text-red-600',
        iconBgColor: 'bg-red-500/10',
        textColor: 'text-foreground'
      }
    }
    
    if (event === 'slacking_hard' || event === 'buddy_dominating') {
      return {
        icon: TrendingDown,
        iconColor: 'text-amber-600',
        iconBgColor: 'bg-amber-500/10',
        textColor: 'text-foreground'
      }
    }
    
    return {
      icon: Flame,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-500/10',
      textColor: 'text-foreground'
    }
  }

  const style = getMessageStyle()
  const Icon = style.icon || Flame

  if (isLoading) {
    return (
      <Card className={cn('border-border/50 bg-surface animate-pulse', className)}>
        <div className="p-6">
          <div className="h-5 bg-muted/20 rounded w-3/4 mb-2" />
          <div className="h-5 bg-muted/20 rounded w-1/2" />
        </div>
      </Card>
    )
  }

  if (!data?.message) return null

  return (
    <Card className={cn(
      'border-border/50 bg-surface hover:shadow-lg transition-all duration-200',
      className
    )}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center',
            style.iconBgColor
          )}>
            <Icon className={cn('h-5 w-5', style.iconColor)} />
          </div>
          
          <div className="flex-1">
            <p className={cn(
              'text-base leading-relaxed',
              style.textColor
            )}>
              {data.message}
            </p>
            
            {data.context && ((data.context as any).currentStreak !== undefined || 
              ((data.context as any).daysSinceLastWorkout !== undefined && (data.context as any).daysSinceLastWorkout > 0)) && (
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                {(data.context as any).currentStreak !== undefined && (
                  <span className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5" />
                    {(data.context as any).currentStreak} day streak
                  </span>
                )}
                {(data.context as any).daysSinceLastWorkout !== undefined && (data.context as any).daysSinceLastWorkout > 0 && (
                  <span>
                    {(data.context as any).daysSinceLastWorkout} days since last workout
                  </span>
                )}
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}