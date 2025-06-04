import Anthropic from '@anthropic-ai/sdk'
import { format, subDays, differenceInDays } from 'date-fns'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface WorkoutData {
  id: string
  completedAt: Date
  durationMinutes?: number
  exercises?: any[]
  notes?: string
  totalVolume?: number
}

export interface UserProfile {
  id: string
  fullName: string
  startingWeight?: number
  currentWeight?: number
  height?: number
  createdAt: Date
  timezone?: string
}

export interface WorkoutAnalysis {
  patterns: {
    consistency: {
      averageWorkoutsPerWeek: number
      mostActiveDay: string
      leastActiveDay: string
      trend: 'improving' | 'declining' | 'stable'
    }
    timing: {
      preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'varied'
      averageWorkoutTime: string
    }
    volume: {
      averageVolume: number
      volumeTrend: 'increasing' | 'decreasing' | 'stable'
      heaviestDay: string
    }
    exercises: {
      mostFrequent: string[]
      neglected: string[]
      balanced: boolean
    }
  }
  strengths: string[]
  weaknesses: string[]
  recommendations: {
    type: 'frequency' | 'volume' | 'variety' | 'progression' | 'recovery'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    actionItems: string[]
  }[]
  goals: {
    shortTerm: string[]
    longTerm: string[]
    nextMilestone: string
  }
}

export async function analyzeWorkoutPatterns(
  workouts: WorkoutData[],
  user: UserProfile,
  currentStats: {
    currentStreak: number
    longestStreak: number
    totalWorkouts: number
  }
): Promise<WorkoutAnalysis> {
  // Prepare workout data for analysis
  const sortedWorkouts = workouts.sort((a, b) => 
    new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  )

  // Calculate basic patterns
  const patterns = calculatePatterns(sortedWorkouts)
  
  // Prepare context for AI
  const context = {
    userProfile: {
      daysActive: differenceInDays(new Date(), new Date(user.createdAt)),
      startingWeight: user.startingWeight,
      currentWeight: user.currentWeight,
      height: user.height,
    },
    workoutHistory: {
      totalWorkouts: currentStats.totalWorkouts,
      currentStreak: currentStats.currentStreak,
      longestStreak: currentStats.longestStreak,
      recentWorkouts: sortedWorkouts.slice(-10).map(w => ({
        date: format(new Date(w.completedAt), 'yyyy-MM-dd'),
        duration: w.durationMinutes,
        exercises: w.exercises?.length || 0,
        volume: w.totalVolume,
        notes: w.notes,
      })),
    },
    patterns,
  }

  // Generate AI insights
  const prompt = `You are a professional fitness coach analyzing workout data for personalized insights.

User Profile:
- Active for ${context.userProfile.daysActive} days
- Starting weight: ${context.userProfile.startingWeight || 'Not recorded'} kg
- Current weight: ${context.userProfile.currentWeight || 'Not recorded'} kg
- Height: ${context.userProfile.height || 'Not recorded'} cm

Workout Statistics:
- Total workouts: ${context.workoutHistory.totalWorkouts}
- Current streak: ${context.workoutHistory.currentStreak} days
- Longest streak: ${context.workoutHistory.longestStreak} days

Recent Patterns:
${JSON.stringify(context.patterns, null, 2)}

Recent Workouts:
${JSON.stringify(context.workoutHistory.recentWorkouts, null, 2)}

Based on this data, provide a comprehensive analysis in the following JSON format:
{
  "strengths": ["list 3-5 key strengths based on the data"],
  "weaknesses": ["list 3-5 areas for improvement"],
  "recommendations": [
    {
      "type": "frequency|volume|variety|progression|recovery",
      "priority": "high|medium|low",
      "title": "Clear, actionable title",
      "description": "Detailed explanation (2-3 sentences)",
      "actionItems": ["Specific action 1", "Specific action 2", "Specific action 3"]
    }
  ],
  "goals": {
    "shortTerm": ["2-3 achievable goals for next 2-4 weeks"],
    "longTerm": ["2-3 ambitious goals for next 3-6 months"],
    "nextMilestone": "The most immediate milestone to focus on"
  }
}

Focus on:
1. Identifying specific patterns and trends
2. Providing actionable, personalized recommendations
3. Setting realistic but challenging goals
4. Addressing any concerning patterns (like declining frequency)
5. Celebrating strengths while addressing weaknesses constructively`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const aiAnalysis = JSON.parse(content.text)
      
      return {
        patterns,
        strengths: aiAnalysis.strengths,
        weaknesses: aiAnalysis.weaknesses,
        recommendations: aiAnalysis.recommendations,
        goals: aiAnalysis.goals,
      }
    }

    throw new Error('Unexpected response format from AI')
  } catch (error) {
    console.error('AI analysis error:', error)
    
    // Fallback to rule-based insights
    return generateFallbackInsights(patterns, currentStats)
  }
}

function calculatePatterns(workouts: WorkoutData[]) {
  if (workouts.length === 0) {
    return {
      consistency: {
        averageWorkoutsPerWeek: 0,
        mostActiveDay: 'None',
        leastActiveDay: 'None',
        trend: 'stable' as const,
      },
      timing: {
        preferredTimeOfDay: 'varied' as const,
        averageWorkoutTime: 'N/A',
      },
      volume: {
        averageVolume: 0,
        volumeTrend: 'stable' as const,
        heaviestDay: 'None',
      },
      exercises: {
        mostFrequent: [],
        neglected: [],
        balanced: false,
      },
    }
  }

  // Calculate consistency patterns
  const dayCount: Record<string, number> = {}
  const hourCount: Record<number, number> = {}
  let totalVolume = 0
  let volumeCount = 0
  
  workouts.forEach(workout => {
    const date = new Date(workout.completedAt)
    const dayName = format(date, 'EEEE')
    const hour = date.getHours()
    
    dayCount[dayName] = (dayCount[dayName] || 0) + 1
    hourCount[hour] = (hourCount[hour] || 0) + 1
    
    if (workout.totalVolume) {
      totalVolume += workout.totalVolume
      volumeCount++
    }
  })

  // Find most/least active days
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayCounts = days.map(day => ({ day, count: dayCount[day] || 0 }))
  const mostActiveDay = dayCounts.reduce((a, b) => a.count > b.count ? a : b).day
  const leastActiveDay = dayCounts.reduce((a, b) => a.count < b.count ? a : b).day

  // Determine time preference
  const morningCount = Object.entries(hourCount)
    .filter(([hour]) => parseInt(hour) >= 5 && parseInt(hour) < 12)
    .reduce((sum, [, count]) => sum + count, 0)
  const afternoonCount = Object.entries(hourCount)
    .filter(([hour]) => parseInt(hour) >= 12 && parseInt(hour) < 17)
    .reduce((sum, [, count]) => sum + count, 0)
  const eveningCount = Object.entries(hourCount)
    .filter(([hour]) => parseInt(hour) >= 17 && parseInt(hour) < 22)
    .reduce((sum, [, count]) => sum + count, 0)

  let preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'varied' = 'varied'
  const total = morningCount + afternoonCount + eveningCount
  if (morningCount > total * 0.5) preferredTimeOfDay = 'morning'
  else if (afternoonCount > total * 0.5) preferredTimeOfDay = 'afternoon'
  else if (eveningCount > total * 0.5) preferredTimeOfDay = 'evening'

  // Calculate trends
  const recentWorkouts = workouts.slice(-14) // Last 2 weeks
  const olderWorkouts = workouts.slice(-28, -14) // Previous 2 weeks
  const recentAvg = recentWorkouts.length / 2
  const olderAvg = olderWorkouts.length / 2
  
  let trend: 'improving' | 'declining' | 'stable' = 'stable'
  if (recentAvg > olderAvg * 1.2) trend = 'improving'
  else if (recentAvg < olderAvg * 0.8) trend = 'declining'

  // Exercise analysis
  const exerciseCounts: Record<string, number> = {}
  workouts.forEach(workout => {
    workout.exercises?.forEach((exercise: any) => {
      if (exercise.name) {
        exerciseCounts[exercise.name] = (exerciseCounts[exercise.name] || 0) + 1
      }
    })
  })

  const sortedExercises = Object.entries(exerciseCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name]) => name)

  return {
    consistency: {
      averageWorkoutsPerWeek: (workouts.length / Math.max(1, differenceInDays(new Date(), new Date(workouts[0].completedAt)) / 7)),
      mostActiveDay,
      leastActiveDay,
      trend,
    },
    timing: {
      preferredTimeOfDay,
      averageWorkoutTime: 'Variable',
    },
    volume: {
      averageVolume: volumeCount > 0 ? totalVolume / volumeCount : 0,
      volumeTrend: 'stable' as const,
      heaviestDay: mostActiveDay,
    },
    exercises: {
      mostFrequent: sortedExercises.slice(0, 3),
      neglected: [], // Would need exercise library to determine
      balanced: sortedExercises.length >= 5,
    },
  }
}

function generateFallbackInsights(
  patterns: any,
  stats: { currentStreak: number; longestStreak: number; totalWorkouts: number }
): WorkoutAnalysis {
  const strengths = []
  const weaknesses = []
  const recommendations = []

  // Analyze strengths
  if (stats.currentStreak >= 7) {
    strengths.push(`Excellent consistency with a ${stats.currentStreak}-day streak!`)
  }
  if (patterns.consistency.averageWorkoutsPerWeek >= 4) {
    strengths.push('Strong workout frequency averaging 4+ sessions per week')
  }
  if (patterns.exercises.balanced) {
    strengths.push('Good exercise variety in your workouts')
  }

  // Identify weaknesses
  if (patterns.consistency.trend === 'declining') {
    weaknesses.push('Workout frequency has been declining recently')
    recommendations.push({
      type: 'frequency' as const,
      priority: 'high' as const,
      title: 'Reverse the declining trend',
      description: 'Your workout frequency has dropped. Let\'s get back on track with a realistic schedule.',
      actionItems: [
        'Set 3 specific workout days for next week',
        'Prepare gym bag the night before',
        'Schedule workouts in your calendar',
      ],
    })
  }

  if (patterns.consistency.averageWorkoutsPerWeek < 3) {
    weaknesses.push('Low workout frequency (less than 3x per week)')
    recommendations.push({
      type: 'frequency' as const,
      priority: 'high' as const,
      title: 'Increase workout frequency',
      description: 'Aim for at least 3-4 workouts per week for optimal progress.',
      actionItems: [
        'Start with 3 workouts this week',
        'Choose consistent days (e.g., Mon/Wed/Fri)',
        'Set reminders on your phone',
      ],
    })
  }

  if (!patterns.exercises.balanced) {
    weaknesses.push('Limited exercise variety')
    recommendations.push({
      type: 'variety' as const,
      priority: 'medium' as const,
      title: 'Diversify your workout routine',
      description: 'Adding variety prevents plateaus and ensures balanced development.',
      actionItems: [
        'Try one new exercise each workout',
        'Alternate between upper and lower body days',
        'Include both strength and cardio exercises',
      ],
    })
  }

  // Set goals based on current performance
  const goals = {
    shortTerm: [
      stats.currentStreak < 30 ? `Reach a 30-day workout streak` : `Maintain your ${stats.currentStreak}-day streak`,
      'Complete 4 workouts each week for the next month',
      'Try 5 new exercises in the next 2 weeks',
    ],
    longTerm: [
      'Build a sustainable 5-day per week workout habit',
      'Complete 200 total workouts',
      'Develop expertise in all major movement patterns',
    ],
    nextMilestone: stats.currentStreak < 30 
      ? `${30 - stats.currentStreak} more days to reach a 30-day streak!`
      : `${Math.ceil((100 - stats.totalWorkouts) / patterns.consistency.averageWorkoutsPerWeek)} weeks to reach 100 total workouts!`,
  }

  return {
    patterns,
    strengths: strengths.length > 0 ? strengths : ['Getting started on your fitness journey!'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Keep building consistency'],
    recommendations: recommendations.length > 0 ? recommendations : [{
      type: 'progression' as const,
      priority: 'medium' as const,
      title: 'Keep building momentum',
      description: 'You\'re on the right track. Focus on consistency and gradual progression.',
      actionItems: [
        'Maintain your current workout schedule',
        'Increase weights by 5-10% when exercises feel easy',
        'Track your progress weekly',
      ],
    }],
    goals,
  }
}

export async function generateProgressSummary(
  user: UserProfile,
  recentProgress: {
    workouts: number
    duration: number
    volume: number
    streakDays: number
    weightChange?: number
    badges: string[]
  },
  period: 'week' | 'month'
): Promise<string> {
  const prompt = `Generate a brief, encouraging progress summary for a gym user.

Period: Last ${period}
Stats:
- Workouts completed: ${recentProgress.workouts}
- Total duration: ${recentProgress.duration} minutes
- Current streak: ${recentProgress.streakDays} days
${recentProgress.weightChange ? `- Weight change: ${recentProgress.weightChange > 0 ? '+' : ''}${recentProgress.weightChange} kg` : ''}
${recentProgress.badges.length > 0 ? `- New achievements: ${recentProgress.badges.join(', ')}` : ''}

Write a 2-3 sentence personalized summary that:
1. Celebrates their accomplishments
2. Highlights the most impressive stat
3. Provides brief encouragement
4. Uses an upbeat, motivational tone

Keep it concise and personal.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      temperature: 0.8,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return content.text
    }

    throw new Error('Unexpected response format')
  } catch (error) {
    console.error('Summary generation error:', error)
    
    // Fallback summary
    return `Great work this ${period}! You completed ${recentProgress.workouts} workouts and maintained a ${recentProgress.streakDays}-day streak. Keep up the amazing momentum!`
  }
}