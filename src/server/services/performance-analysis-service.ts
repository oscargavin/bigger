// Type definitions for Supabase data
export interface WorkoutData {
  id: string
  user_id: string
  pairing_id?: string | null
  completed_at: string
  duration_minutes?: number | null
  notes?: string | null
  exercises?: any
  total_volume?: number | null
  workout_type?: string | null
  created_at: string
  updated_at: string
}

export interface ExerciseRecordData {
  id: string
  user_id: string
  exercise_name: string
  category?: string | null
  personal_record?: number | null
  last_performed?: string | null
  created_at: string
  updated_at: string
}

export interface WorkoutAnalysis {
  currentStreak: number
  longestStreak: number
  weeklyWorkouts: number
  monthlyWorkouts: number
  daysSinceLastWorkout: number
  totalVolume: number
  averageWorkoutDuration: number
  consistencyRate: number // percentage
  favoriteExercises: Array<{ name: string; count: number }>
  workoutTimeDistribution: {
    morning: number // 5am-12pm
    afternoon: number // 12pm-5pm
    evening: number // 5pm-10pm
    night: number // 10pm-5am
  }
  volumeTrend: 'increasing' | 'decreasing' | 'stable'
  missedDaysPattern: string[]
  recentPRs: Array<{
    exercise: string
    weight: number
    reps: number
    date: Date
    improvement: number // percentage
  }>
}

export interface PerformanceComparison {
  streak: { difference: number; direction: 'ahead' | 'behind' }
  weekly: { difference: number; direction: 'ahead' | 'behind' }
  monthly: { difference: number; direction: 'ahead' | 'behind' }
  volume: { 
    difference: number
    direction: 'ahead' | 'behind'
    percentage: number 
  }
  consistency: { 
    userRate: number
    buddyRate: number
    direction: 'ahead' | 'behind'
  }
  exerciseComparison: Array<{
    exercise: string
    userBest: number
    buddyBest: number
    difference: number
    percentageDiff: number
  }>
}

export function analyzeUserWorkouts(
  workouts: WorkoutData[],
  exerciseRecords?: ExerciseRecordData[]
): WorkoutAnalysis {
  if (!workouts.length) {
    return getEmptyAnalysis()
  }

  // Sort workouts by date
  const sortedWorkouts = [...workouts].sort((a, b) => 
    new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  )

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Calculate streaks
  const { currentStreak, longestStreak } = calculateStreaks(sortedWorkouts)
  
  // Calculate workout frequency
  const weeklyWorkouts = sortedWorkouts.filter(w => 
    new Date(w.completed_at) > weekAgo
  ).length
  
  const monthlyWorkouts = sortedWorkouts.filter(w => 
    new Date(w.completed_at) > monthAgo
  ).length

  // Days since last workout
  const daysSinceLastWorkout = sortedWorkouts.length > 0
    ? Math.floor((now.getTime() - new Date(sortedWorkouts[0].completed_at).getTime()) / (24 * 60 * 60 * 1000))
    : Infinity

  // Calculate total volume
  const totalVolume = sortedWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0)

  // Average workout duration
  const avgDuration = sortedWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) / sortedWorkouts.length

  // Consistency rate (workouts per expected days in the last month)
  const expectedWorkoutsPerMonth = 12 // 3 per week * 4 weeks
  const consistencyRate = (monthlyWorkouts / expectedWorkoutsPerMonth) * 100

  // Analyze favorite exercises
  const exerciseCounts = new Map<string, number>()
  sortedWorkouts.forEach(workout => {
    if (workout.exercises && Array.isArray(workout.exercises)) {
      workout.exercises.forEach((exercise: any) => {
        const count = exerciseCounts.get(exercise.name) || 0
        exerciseCounts.set(exercise.name, count + 1)
      })
    }
  })
  
  const favoriteExercises = Array.from(exerciseCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Workout time distribution
  const timeDistribution = calculateTimeDistribution(sortedWorkouts)

  // Volume trend (compare last 2 weeks to previous 2 weeks)
  const volumeTrend = calculateVolumeTrend(sortedWorkouts)

  // Missed days pattern
  const missedDaysPattern = analyzeMissedDaysPattern(sortedWorkouts)

  // Recent PRs
  const recentPRs = findRecentPRs(sortedWorkouts, exerciseRecords)

  return {
    currentStreak,
    longestStreak,
    weeklyWorkouts,
    monthlyWorkouts,
    daysSinceLastWorkout,
    totalVolume,
    averageWorkoutDuration: avgDuration,
    consistencyRate,
    favoriteExercises,
    workoutTimeDistribution: timeDistribution,
    volumeTrend,
    missedDaysPattern,
    recentPRs
  }
}

export function comparePerformance(
  userAnalysis: WorkoutAnalysis,
  buddyAnalysis: WorkoutAnalysis,
  userWorkouts: WorkoutData[],
  buddyWorkouts: WorkoutData[]
): PerformanceComparison {
  const comparison: PerformanceComparison = {
    streak: {
      difference: Math.abs(userAnalysis.currentStreak - buddyAnalysis.currentStreak),
      direction: userAnalysis.currentStreak >= buddyAnalysis.currentStreak ? 'ahead' : 'behind'
    },
    weekly: {
      difference: Math.abs(userAnalysis.weeklyWorkouts - buddyAnalysis.weeklyWorkouts),
      direction: userAnalysis.weeklyWorkouts >= buddyAnalysis.weeklyWorkouts ? 'ahead' : 'behind'
    },
    monthly: {
      difference: Math.abs(userAnalysis.monthlyWorkouts - buddyAnalysis.monthlyWorkouts),
      direction: userAnalysis.monthlyWorkouts >= buddyAnalysis.monthlyWorkouts ? 'ahead' : 'behind'
    },
    volume: {
      difference: Math.abs(userAnalysis.totalVolume - buddyAnalysis.totalVolume),
      direction: userAnalysis.totalVolume >= buddyAnalysis.totalVolume ? 'ahead' : 'behind',
      percentage: buddyAnalysis.totalVolume > 0 
        ? Math.round(((userAnalysis.totalVolume - buddyAnalysis.totalVolume) / buddyAnalysis.totalVolume) * 100)
        : 100
    },
    consistency: {
      userRate: userAnalysis.consistencyRate,
      buddyRate: buddyAnalysis.consistencyRate,
      direction: userAnalysis.consistencyRate >= buddyAnalysis.consistencyRate ? 'ahead' : 'behind'
    },
    exerciseComparison: compareExercisePRs(userWorkouts, buddyWorkouts)
  }

  return comparison
}

// Helper functions
function calculateStreaks(workouts: WorkoutData[]): { currentStreak: number; longestStreak: number } {
  if (!workouts.length) return { currentStreak: 0, longestStreak: 0 }

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1
  
  const dates = workouts.map(w => new Date(w.completed_at).toDateString())
  const uniqueDates = [...new Set(dates)].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  // Check if the most recent workout was today or yesterday
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
  
  if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
    currentStreak = 1
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i])
      const previousDate = new Date(uniqueDates[i - 1])
      const dayDiff = Math.floor((previousDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000))
      
      if (dayDiff === 1) {
        currentStreak++
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak)
  
  return { currentStreak, longestStreak }
}

function calculateTimeDistribution(workouts: WorkoutData[]) {
  const distribution = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0
  }

  workouts.forEach(workout => {
    const hour = new Date(workout.completedAt).getHours()
    if (hour >= 5 && hour < 12) distribution.morning++
    else if (hour >= 12 && hour < 17) distribution.afternoon++
    else if (hour >= 17 && hour < 22) distribution.evening++
    else distribution.night++
  })

  const total = workouts.length
  return {
    morning: Math.round((distribution.morning / total) * 100),
    afternoon: Math.round((distribution.afternoon / total) * 100),
    evening: Math.round((distribution.evening / total) * 100),
    night: Math.round((distribution.night / total) * 100)
  }
}

function calculateVolumeTrend(workouts: WorkoutData[]): 'increasing' | 'decreasing' | 'stable' {
  if (workouts.length < 4) return 'stable'

  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)

  const recentWorkouts = workouts.filter(w => new Date(w.completed_at) > twoWeeksAgo)
  const olderWorkouts = workouts.filter(w => 
    new Date(w.completed_at) > fourWeeksAgo && new Date(w.completed_at) <= twoWeeksAgo
  )

  if (!recentWorkouts.length || !olderWorkouts.length) return 'stable'

  const recentAvgVolume = recentWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0) / recentWorkouts.length
  const olderAvgVolume = olderWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0) / olderWorkouts.length

  const percentChange = ((recentAvgVolume - olderAvgVolume) / olderAvgVolume) * 100

  if (percentChange > 10) return 'increasing'
  if (percentChange < -10) return 'decreasing'
  return 'stable'
}

function analyzeMissedDaysPattern(workouts: WorkoutData[]): string[] {
  const dayCount: Record<string, number> = {
    Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, 
    Thursday: 0, Friday: 0, Saturday: 0
  }

  workouts.forEach(workout => {
    const dayName = new Date(workout.completedAt).toLocaleDateString('en-US', { weekday: 'long' })
    dayCount[dayName]++
  })

  // Find days with significantly fewer workouts
  const avgWorkoutsPerDay = workouts.length / 7
  const missedDays = Object.entries(dayCount)
    .filter(([_, count]) => count < avgWorkoutsPerDay * 0.5)
    .map(([day]) => day)

  return missedDays
}

function findRecentPRs(
  workouts: WorkoutData[], 
  exerciseRecords?: ExerciseRecordData[]
): WorkoutAnalysis['recentPRs'] {
  const prs: WorkoutAnalysis['recentPRs'] = []
  const exerciseBests = new Map<string, { weight: number; reps: number; date: Date }>()

  // Build exercise bests from workouts
  workouts.forEach(workout => {
    if (workout.exercises && Array.isArray(workout.exercises)) {
      workout.exercises.forEach((exercise: any) => {
        const currentBest = exerciseBests.get(exercise.name)
        const maxWeight = Math.max(...exercise.sets.map((s: any) => s.weight || 0))
        
        if (!currentBest || maxWeight > currentBest.weight) {
          const bestSet = exercise.sets.find((s: any) => s.weight === maxWeight)
          exerciseBests.set(exercise.name, {
            weight: maxWeight,
            reps: bestSet?.reps || 0,
            date: new Date(workout.completedAt)
          })
        }
      })
    }
  })

  // Find recent PRs (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  exerciseBests.forEach((best, exerciseName) => {
    if (best.date > thirtyDaysAgo) {
      // Calculate improvement if we have historical data
      const olderWorkouts = workouts.filter(w => 
        new Date(w.completed_at) < best.date && 
        w.exercises?.some((e: any) => e.name === exerciseName)
      )
      
      let improvement = 0
      if (olderWorkouts.length > 0) {
        const previousBest = Math.max(...olderWorkouts.flatMap(w => 
          w.exercises
            ?.filter((e: any) => e.name === exerciseName)
            ?.flatMap((e: any) => e.sets.map((s: any) => s.weight || 0)) || []
        ))
        if (previousBest > 0) {
          improvement = ((best.weight - previousBest) / previousBest) * 100
        }
      }

      prs.push({
        exercise: exerciseName,
        weight: best.weight,
        reps: best.reps,
        date: best.date,
        improvement
      })
    }
  })

  return prs.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5)
}

function compareExercisePRs(userWorkouts: WorkoutData[], buddyWorkouts: WorkoutData[]) {
  const userPRs = new Map<string, number>()
  const buddyPRs = new Map<string, number>()

  // Extract user PRs
  userWorkouts.forEach(workout => {
    if (workout.exercises && Array.isArray(workout.exercises)) {
      workout.exercises.forEach((exercise: any) => {
        const maxWeight = Math.max(...exercise.sets.map((s: any) => s.weight || 0))
        const currentPR = userPRs.get(exercise.name) || 0
        userPRs.set(exercise.name, Math.max(currentPR, maxWeight))
      })
    }
  })

  // Extract buddy PRs
  buddyWorkouts.forEach(workout => {
    if (workout.exercises && Array.isArray(workout.exercises)) {
      workout.exercises.forEach((exercise: any) => {
        const maxWeight = Math.max(...exercise.sets.map((s: any) => s.weight || 0))
        const currentPR = buddyPRs.get(exercise.name) || 0
        buddyPRs.set(exercise.name, Math.max(currentPR, maxWeight))
      })
    }
  })

  // Compare common exercises
  const comparisons: PerformanceComparison['exerciseComparison'] = []
  const allExercises = new Set([...userPRs.keys(), ...buddyPRs.keys()])
  
  allExercises.forEach(exercise => {
    const userBest = userPRs.get(exercise) || 0
    const buddyBest = buddyPRs.get(exercise) || 0
    
    if (userBest > 0 && buddyBest > 0) {
      comparisons.push({
        exercise,
        userBest,
        buddyBest,
        difference: userBest - buddyBest,
        percentageDiff: buddyBest > 0 ? ((userBest - buddyBest) / buddyBest) * 100 : 0
      })
    }
  })

  return comparisons.sort((a, b) => Math.abs(b.percentageDiff) - Math.abs(a.percentageDiff)).slice(0, 5)
}

function getEmptyAnalysis(): WorkoutAnalysis {
  return {
    currentStreak: 0,
    longestStreak: 0,
    weeklyWorkouts: 0,
    monthlyWorkouts: 0,
    daysSinceLastWorkout: Infinity,
    totalVolume: 0,
    averageWorkoutDuration: 0,
    consistencyRate: 0,
    favoriteExercises: [],
    workoutTimeDistribution: {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    },
    volumeTrend: 'stable',
    missedDaysPattern: [],
    recentPRs: []
  }
}