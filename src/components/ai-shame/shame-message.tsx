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
    
    const { event, severity } = data.context
    
    if (event === 'pr_achieved' || event === 'milestone' || event === 'crushing_it') {
      return {
        icon: Trophy,
        iconColor: 'text-emerald-500',
        bgColor: 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10',
        borderColor: 'border-emerald-500/30',
        textColor: 'text-emerald-600 dark:text-emerald-400'
      }
    }
    
    if (event === 'streak_broken' || severity === 'nuclear') {
      return {
        icon: AlertTriangle,
        iconColor: 'text-red-500',
        bgColor: 'bg-gradient-to-r from-red-500/10 to-orange-500/10',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-600 dark:text-red-400'
      }
    }
    
    if (event === 'slacking_hard' || event === 'buddy_dominating') {
      return {
        icon: TrendingDown,
        iconColor: 'text-amber-500',
        bgColor: 'bg-gradient-to-r from-amber-500/10 to-orange-500/10',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-600 dark:text-amber-400'
      }
    }
    
    return {
      icon: Flame,
      iconColor: 'text-blue-500',
      bgColor: 'bg-gradient-to-r from-blue-500/10 to-violet-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-600 dark:text-blue-400'
    }
  }

  const style = getMessageStyle()
  const Icon = style.icon || Flame

  if (isLoading) {
    return (
      <Card className={cn('card-glass animate-pulse', className)}>
        <div className="p-6">
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-1/2" />
        </div>
      </Card>
    )
  }

  if (!data?.message) return null

  return (
    <Card className={cn(
      'card-glass relative overflow-hidden transition-all duration-300',
      style.bgColor,
      style.borderColor,
      'border-2',
      className
    )}>
      <div className="absolute top-0 right-0 opacity-10">
        <Icon className="w-32 h-32 -mr-8 -mt-8" />
      </div>
      
      <div className="relative p-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            'p-3 rounded-full bg-white dark:bg-gray-900 shadow-lg',
            'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-950',
            style.borderColor?.replace('border-', 'ring-')
          )}>
            <Icon className={cn('w-6 h-6', style.iconColor)} />
          </div>
          
          <div className="flex-1">
            <p className={cn(
              'text-lg font-semibold leading-relaxed',
              style.textColor
            )}>
              {data.message}
            </p>
            
            {data.context && (
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {data.context.currentStreak !== undefined && (
                  <span className="flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    {data.context.currentStreak} day streak
                  </span>
                )}
                {data.context.daysSinceLastWorkout !== undefined && data.context.daysSinceLastWorkout > 0 && (
                  <span>
                    {data.context.daysSinceLastWorkout} days since last workout
                  </span>
                )}
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="hover:bg-white/50 dark:hover:bg-gray-800/50"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}