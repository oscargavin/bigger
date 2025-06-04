'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StreakDay {
  date: Date
  hasWorkout: boolean
  isToday: boolean
  isFuture: boolean
  isCurrentMonth: boolean
}

interface StreakCalendarProps {
  workoutDates: Date[]
  currentStreak: number
  longestStreak: number
}

export function StreakCalendar({ workoutDates, currentStreak, longestStreak }: StreakCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const workoutDateSet = useMemo(() => {
    return new Set(workoutDates.map(date => date.toDateString()))
  }, [workoutDates])

  const calendar = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: StreakDay[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const date = new Date(year, month, -startingDayOfWeek + i + 1)
      days.push({
        date,
        hasWorkout: workoutDateSet.has(date.toDateString()),
        isToday: date.toDateString() === today.toDateString(),
        isFuture: date > today,
        isCurrentMonth: false,
      })
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({
        date,
        hasWorkout: workoutDateSet.has(date.toDateString()),
        isToday: date.toDateString() === today.toDateString(),
        isFuture: date > today,
        isCurrentMonth: true,
      })
    }
    
    // Add empty cells to complete the grid
    const remainingCells = 42 - days.length // 6 weeks * 7 days
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i)
      days.push({
        date,
        hasWorkout: workoutDateSet.has(date.toDateString()),
        isToday: date.toDateString() === today.toDateString(),
        isFuture: date > today,
        isCurrentMonth: false,
      })
    }
    
    return days
  }, [currentDate, workoutDateSet])

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{monthYear}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-xs"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg border p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground p-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendar.map((day, index) => (
            <div
              key={index}
              className={cn(
                "relative aspect-square p-1 text-center rounded-md transition-colors",
                !day.isCurrentMonth && "text-muted-foreground/50",
                day.isToday && "ring-2 ring-primary",
                day.hasWorkout && day.isCurrentMonth && "bg-primary/10",
                day.isFuture && "opacity-50"
              )}
            >
              <span className="text-sm">{day.date.getDate()}</span>
              {day.hasWorkout && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-2xl font-bold">{currentStreak}</span>
          </div>
          <p className="text-sm text-muted-foreground">Current Streak</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className="h-5 w-5 text-yellow-500" />
            <span className="text-2xl font-bold">{longestStreak}</span>
          </div>
          <p className="text-sm text-muted-foreground">Best Streak</p>
        </div>
      </div>
    </div>
  )
}