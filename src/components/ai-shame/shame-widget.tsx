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
    if (data && data.daysSinceLastWorkout >= 2) {
      triggerShame()
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

  if (!data || data.daysSinceLastWorkout < 2) return null

  const getSeverityStyle = () => {
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

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg',
      style.bgColor,
      'bg-opacity-10 border',
      data.daysSinceLastWorkout >= 7 ? 'border-red-500/30' : 
      data.daysSinceLastWorkout >= 4 ? 'border-amber-500/30' : 'border-orange-500/30',
      className
    )}>
      <Icon className={cn(
        "w-4 h-4",
        data.daysSinceLastWorkout >= 7 ? 'text-red-600' : 
        data.daysSinceLastWorkout >= 4 ? 'text-amber-600' : 'text-orange-600',
        style.pulse && 'animate-pulse'
      )} />
      <div className="flex-1">
        <p className="text-xs font-medium text-foreground">
          {data.daysSinceLastWorkout} days since workout
        </p>
      </div>
    </div>
  )
}