import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, differenceInDays } from 'date-fns'

export const reportsRouter = createTRPCRouter({
  // Generate a progress report for a specific period
  generateReport: protectedProcedure
    .input(z.object({
      period: z.enum(['week', 'month', 'quarter', 'year']),
      offset: z.number().min(0).default(0), // 0 = current period, 1 = last period, etc.
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const now = new Date()
      
      // Calculate date range based on period and offset
      let startDate: Date
      let endDate: Date
      let comparisonStartDate: Date
      let comparisonEndDate: Date
      
      switch (input.period) {
        case 'week':
          const targetWeek = subWeeks(now, input.offset)
          startDate = startOfWeek(targetWeek)
          endDate = endOfWeek(targetWeek)
          comparisonStartDate = startOfWeek(subWeeks(targetWeek, 1))
          comparisonEndDate = endOfWeek(subWeeks(targetWeek, 1))
          break
        case 'month':
          const targetMonth = subMonths(now, input.offset)
          startDate = startOfMonth(targetMonth)
          endDate = endOfMonth(targetMonth)
          comparisonStartDate = startOfMonth(subMonths(targetMonth, 1))
          comparisonEndDate = endOfMonth(subMonths(targetMonth, 1))
          break
        // Add quarter and year logic as needed
        default:
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid period' })
      }

      // Get workouts for the period
      const { data: workouts } = await ctx.supabase
        .from('workouts')
        .select(`
          *,
          photos(*)
        `)
        .eq('user_id', userId)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: true })

      // Get comparison period workouts
      const { data: comparisonWorkouts } = await ctx.supabase
        .from('workouts')
        .select('id, duration_minutes')
        .eq('user_id', userId)
        .gte('completed_at', comparisonStartDate.toISOString())
        .lte('completed_at', comparisonEndDate.toISOString())

      // Get progress snapshots for the period
      const { data: progressSnapshots } = await ctx.supabase
        .from('progress_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      // Get user info and starting stats
      const { data: user } = await ctx.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      // Get badges earned in this period
      const { data: badgesEarned } = await ctx.supabase
        .from('user_badges')
        .select(`
          *,
          badge:badge_definitions(*)
        `)
        .eq('user_id', userId)
        .gte('earned_at', startDate.toISOString())
        .lte('earned_at', endDate.toISOString())

      // Calculate statistics
      const totalWorkouts = workouts?.length || 0
      const comparisonTotalWorkouts = comparisonWorkouts?.length || 0
      const workoutGrowth = comparisonTotalWorkouts > 0 
        ? ((totalWorkouts - comparisonTotalWorkouts) / comparisonTotalWorkouts) * 100 
        : 0

      const totalDuration = workouts?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0
      const comparisonDuration = comparisonWorkouts?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0
      const durationGrowth = comparisonDuration > 0
        ? ((totalDuration - comparisonDuration) / comparisonDuration) * 100
        : 0

      const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0
      const photosUploaded = workouts?.filter(w => w.photos && w.photos.length > 0).length || 0

      // Calculate consistency
      const totalDays = differenceInDays(endDate, startDate) + 1
      const workoutDays = new Set(workouts?.map(w => 
        new Date(w.completed_at).toISOString().split('T')[0]
      )).size
      const consistency = (workoutDays / totalDays) * 100

      // Calculate weight progress if available
      let weightProgress = null
      if (progressSnapshots && progressSnapshots.length > 0 && user?.starting_weight) {
        const latestWeight = progressSnapshots[progressSnapshots.length - 1].weight
        const startingWeight = user.starting_weight
        if (latestWeight && startingWeight) {
          weightProgress = {
            current: Number(latestWeight),
            starting: Number(startingWeight),
            change: Number(latestWeight) - Number(startingWeight),
            percentageChange: ((Number(latestWeight) - Number(startingWeight)) / Number(startingWeight)) * 100
          }
        }
      }

      // Get best exercises (if tracked)
      const exerciseData = workouts?.flatMap(w => w.exercises || []) as any[]
      const exerciseStats = exerciseData.reduce((acc, exercise) => {
        if (!exercise.name) return acc
        
        if (!acc[exercise.name]) {
          acc[exercise.name] = {
            name: exercise.name,
            totalSets: 0,
            totalReps: 0,
            totalVolume: 0,
            maxWeight: 0,
            sessions: 0
          }
        }
        
        acc[exercise.name].sessions++
        acc[exercise.name].totalSets += exercise.sets || 0
        acc[exercise.name].totalReps += (exercise.sets || 0) * (exercise.reps || 0)
        acc[exercise.name].totalVolume += (exercise.sets || 0) * (exercise.reps || 0) * (exercise.weight || 0)
        acc[exercise.name].maxWeight = Math.max(acc[exercise.name].maxWeight, exercise.weight || 0)
        
        return acc
      }, {} as Record<string, any>)

      const topExercises = Object.values(exerciseStats)
        .sort((a: any, b: any) => b.sessions - a.sessions)
        .slice(0, 5)

      // Generate insights
      const insights = generateInsights({
        totalWorkouts,
        workoutGrowth,
        consistency,
        avgDuration,
        durationGrowth,
        badgesEarned: badgesEarned?.length || 0,
        weightProgress,
      })

      return {
        period: {
          type: input.period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        summary: {
          totalWorkouts,
          totalDuration,
          avgDuration,
          consistency,
          photosUploaded,
          workoutDays,
          totalDays,
        },
        comparison: {
          workoutGrowth,
          durationGrowth,
          previousWorkouts: comparisonTotalWorkouts,
          previousDuration: comparisonDuration,
        },
        weightProgress,
        badgesEarned: badgesEarned || [],
        topExercises,
        workoutDetails: workouts || [],
        progressSnapshots: progressSnapshots || [],
        insights,
      }
    }),

  // Get a list of available reports
  getAvailableReports: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    
    // Get user's first workout date
    const { data: firstWorkout } = await ctx.supabase
      .from('workouts')
      .select('completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: true })
      .limit(1)
      .single()

    if (!firstWorkout) {
      return []
    }

    const firstWorkoutDate = new Date(firstWorkout.completed_at)
    const now = new Date()
    const reports = []

    // Calculate available weekly reports (last 12 weeks)
    for (let i = 0; i < 12; i++) {
      const weekStart = startOfWeek(subWeeks(now, i))
      if (weekStart >= firstWorkoutDate) {
        reports.push({
          type: 'week' as const,
          offset: i,
          label: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i} weeks ago`,
          startDate: weekStart.toISOString(),
          endDate: endOfWeek(weekStart).toISOString(),
        })
      }
    }

    // Calculate available monthly reports (last 6 months)
    for (let i = 0; i < 6; i++) {
      const monthStart = startOfMonth(subMonths(now, i))
      if (monthStart >= firstWorkoutDate) {
        reports.push({
          type: 'month' as const,
          offset: i,
          label: i === 0 ? 'This Month' : i === 1 ? 'Last Month' : `${i} months ago`,
          startDate: monthStart.toISOString(),
          endDate: endOfMonth(monthStart).toISOString(),
        })
      }
    }

    return reports
  }),

  // Get quick stats for dashboard
  getQuickStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const now = new Date()
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)

    // This week's stats
    const { data: weekWorkouts } = await ctx.supabase
      .from('workouts')
      .select('id, duration_minutes')
      .eq('user_id', userId)
      .gte('completed_at', weekStart.toISOString())

    // This month's stats
    const { data: monthWorkouts } = await ctx.supabase
      .from('workouts')
      .select('id, duration_minutes')
      .eq('user_id', userId)
      .gte('completed_at', monthStart.toISOString())

    // All-time stats
    const { count: totalWorkouts } = await ctx.supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return {
      week: {
        workouts: weekWorkouts?.length || 0,
        duration: weekWorkouts?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0,
      },
      month: {
        workouts: monthWorkouts?.length || 0,
        duration: monthWorkouts?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0,
      },
      allTime: {
        workouts: totalWorkouts || 0,
      },
    }
  }),
})

// Helper function to generate insights
function generateInsights(data: {
  totalWorkouts: number
  workoutGrowth: number
  consistency: number
  avgDuration: number
  durationGrowth: number
  badgesEarned: number
  weightProgress: any
}) {
  const insights = []

  // Workout frequency insights
  if (data.totalWorkouts === 0) {
    insights.push({
      type: 'warning',
      message: 'No workouts logged this period. Time to get back on track!',
    })
  } else if (data.workoutGrowth > 20) {
    insights.push({
      type: 'success',
      message: `Great job! You increased your workout frequency by ${Math.round(data.workoutGrowth)}% compared to last period.`,
    })
  } else if (data.workoutGrowth < -20) {
    insights.push({
      type: 'warning',
      message: `Your workout frequency decreased by ${Math.abs(Math.round(data.workoutGrowth))}%. Let's get back to your routine!`,
    })
  }

  // Consistency insights
  if (data.consistency >= 80) {
    insights.push({
      type: 'success',
      message: `Excellent consistency! You worked out ${Math.round(data.consistency)}% of the days.`,
    })
  } else if (data.consistency < 40) {
    insights.push({
      type: 'info',
      message: 'Try to maintain a more regular workout schedule for better results.',
    })
  }

  // Duration insights
  if (data.avgDuration > 60) {
    insights.push({
      type: 'info',
      message: `Your workouts averaged ${Math.round(data.avgDuration)} minutes. Great endurance!`,
    })
  } else if (data.avgDuration < 30 && data.totalWorkouts > 0) {
    insights.push({
      type: 'info',
      message: 'Consider longer workout sessions for better results.',
    })
  }

  // Badges insights
  if (data.badgesEarned > 0) {
    insights.push({
      type: 'success',
      message: `You earned ${data.badgesEarned} new achievement${data.badgesEarned > 1 ? 's' : ''}! Keep up the great work!`,
    })
  }

  // Weight progress insights
  if (data.weightProgress) {
    if (Math.abs(data.weightProgress.percentageChange) > 2) {
      const direction = data.weightProgress.change > 0 ? 'gained' : 'lost'
      insights.push({
        type: 'info',
        message: `You've ${direction} ${Math.abs(data.weightProgress.change).toFixed(1)} kg (${Math.abs(data.weightProgress.percentageChange).toFixed(1)}%) from your starting weight.`,
      })
    }
  }

  return insights
}