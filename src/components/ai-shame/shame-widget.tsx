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
      'relative inline-flex items-center justify-center',
      className
    )}>
      <div className={cn(
        'rounded-full p-2',
        style.bgColor,
        'text-white shadow-lg',
        style.pulse && 'animate-pulse'
      )}>
        <Icon className="w-5 h-5" />
      </div>
      
      {/* Badge showing days */}
      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
        {data.daysSinceLastWorkout}
      </span>
    </div>
  )
}