'use client'

import { useEffect } from 'react'
import { api } from '@/utils/api'
import { AlertTriangle, Flame, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ShameWidgetProps {
  className?: string
  showToast?: boolean
}

export function ShameWidget({ className, showToast = true }: ShameWidgetProps) {
  const { toast } = useToast()
  const { data } = api.aiShame.getWorkoutAnalysis.useQuery()
  
  // Trigger daily shame check
  const { mutate: triggerShame, data: shameData } = api.aiShame.triggerDailyShame.useMutation()

  useEffect(() => {
    if (data) {
      const shouldTriggerShame = 
        data.daysSinceLastWorkout === Infinity || // Never worked out
        data.daysSinceLastWorkout >= 2 // Haven't worked out in 2+ days
      
      if (shouldTriggerShame) {
        triggerShame()
      }
    }
  }, [data, triggerShame])

  useEffect(() => {
    if (shameData?.sent && shameData.message && showToast) {
      toast({
        title: "AI Shame Engine Alert",
        description: shameData.message,
      })
    }
  }, [shameData, showToast, toast])

  if (!data) return null
  
  // Handle edge case where user has never worked out
  const hasNeverWorkedOut = data.daysSinceLastWorkout === Infinity || data.daysSinceLastWorkout > 365
  
  // Don't show widget for users who worked out recently (less than 2 days)
  if (!hasNeverWorkedOut && data.daysSinceLastWorkout < 2) return null

  const getSeverityStyle = () => {
    if (hasNeverWorkedOut || data.daysSinceLastWorkout >= 30) {
      return {
        bgColor: 'bg-red-500',
        icon: AlertTriangle,
        pulse: true
      }
    }
    if (data.daysSinceLastWorkout >= 7) {
      return {
        bgColor: 'bg-red-500',
        icon: AlertTriangle,
        pulse: true
      }
    }
    if (data.daysSinceLastWorkout >= 4) {
      return {
        bgColor: 'bg-amber-500',
        icon: TrendingDown,
        pulse: true
      }
    }
    return {
      bgColor: 'bg-orange-500',
      icon: Flame,
      pulse: false
    }
  }

  const style = getSeverityStyle()
  const Icon = style.icon

  const getStatusText = () => {
    if (hasNeverWorkedOut) {
      return "No workouts tracked yet"
    }
    if (data.daysSinceLastWorkout === 1) {
      return "1 day since workout"
    }
    return `${data.daysSinceLastWorkout} days since workout`
  }

  const getBorderColor = () => {
    if (hasNeverWorkedOut || data.daysSinceLastWorkout >= 7) {
      return 'border-red-500/30'
    }
    if (data.daysSinceLastWorkout >= 4) {
      return 'border-amber-500/30'
    }
    return 'border-orange-500/30'
  }

  const getIconColor = () => {
    if (hasNeverWorkedOut || data.daysSinceLastWorkout >= 7) {
      return 'text-red-600'
    }
    if (data.daysSinceLastWorkout >= 4) {
      return 'text-amber-600'
    }
    return 'text-orange-600'
  }

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg',
      style.bgColor,
      'bg-opacity-10 border',
      getBorderColor(),
      className
    )}>
      <Icon className={cn(
        "w-4 h-4",
        getIconColor(),
        style.pulse && 'animate-pulse'
      )} />
      <div className="flex-1">
        <p className="text-xs font-medium text-foreground">
          {getStatusText()}
        </p>
      </div>
    </div>
  )
}