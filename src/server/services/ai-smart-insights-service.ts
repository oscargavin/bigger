import { Anthropic } from '@anthropic-ai/sdk'
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays, format, parseISO, addDays } from 'date-fns'
import { db } from '@/db'
import { workouts, progressSnapshots, exerciseLibrary, userStats, users, streaks, goals as goalsTable, milestones as milestonesTable } from '@/db/schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import type { Workout, ProgressSnapshot, ExerciseRecord, User, Goal as DbGoal, Milestone as DbMilestone } from '@/db/schema'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface WorkoutPattern {
  frequency: number
  averageDuration: number
  preferredDays: string[]
  preferredTimes: string[]
  consistency: number
  volumeTrend: 'increasing' | 'decreasing' | 'stable'
  exerciseVariety: number
  restDayPattern: string[]
}

export interface ProgressSummary {
  period: 'weekly' | 'monthly' | 'quarterly'
  totalWorkouts: number
  totalVolume: number
  volumeChange: number
  durationChange: number
  newPRs: number
  streakStatus: {
    current: number
    longest: number
    trend: 'improving' | 'declining' | 'stable'
  }
  bodyComposition: {
    weightChange: number
    bodyFatChange: number | null
    measurementChanges: Record<string, number>
  }
  highlights: string[]
  concerns: string[]
}

export interface Weakness {
  type: 'consistency' | 'volume' | 'variety' | 'progression' | 'recovery' | 'balance'
  severity: 'minor' | 'moderate' | 'critical'
  description: string
  impact: string
  recommendation: string
  priority: number
}

export interface PersonalizedGoal {
  type: 'short-term' | 'medium-term' | 'long-term'
  category: 'strength' | 'endurance' | 'consistency' | 'body-composition' | 'skill'
  title: string
  description: string
  targetDate: Date
  milestones: {
    description: string
    targetDate: Date
    metric: string
  }[]
  actionPlan: string[]
  successCriteria: string
  estimatedDifficulty: 'easy' | 'moderate' | 'challenging' | 'stretch'
}

export interface SmartInsights {
  workoutPatterns: WorkoutPattern
  progressSummary: ProgressSummary
  weaknesses: Weakness[]
  goals: PersonalizedGoal[]
  overallAnalysis: string
  motivationalMessage: string
  nextSteps: string[]
}

export class AISmartInsightsService {
  async saveGeneratedGoals(userId: string, goals: PersonalizedGoal[]): Promise<DbGoal[]> {
    const savedGoals: DbGoal[] = []
    
    for (const goal of goals) {
      const [savedGoal] = await db.insert(goalsTable).values({
        userId,
        title: goal.title,
        description: goal.description,
        goalType: this.mapGoalCategoryToType(goal.category),
        targetValue: goal.successCriteria.match(/\d+/)?.[0] || null,
        targetUnit: this.extractUnit(goal.successCriteria),
        startDate: format(new Date(), 'yyyy-MM-dd'),
        targetDate: format(goal.targetDate, 'yyyy-MM-dd'),
        status: 'active',
        metadata: {
          type: goal.type,
          category: goal.category,
          estimatedDifficulty: goal.estimatedDifficulty,
          actionPlan: goal.actionPlan,
          successCriteria: goal.successCriteria,
          milestones: goal.milestones,
        },
      }).returning()
      
      savedGoals.push(savedGoal)
      
      // Save milestones
      for (const milestone of goal.milestones) {
        await db.insert(milestonesTable).values({
          userId,
          goalId: savedGoal.id,
          title: milestone.description,
          description: `Target: ${milestone.metric}`,
          milestoneType: 'goal_completion',
          value: milestone.metric.match(/\d+/)?.[0] || '0',
          unit: this.extractUnit(milestone.metric),
          achievedAt: milestone.targetDate,
          metadata: {
            targetDate: milestone.targetDate,
            metric: milestone.metric,
          },
        })
      }
    }
    
    return savedGoals
  }
  
  private mapGoalCategoryToType(category: string): 'weight_loss' | 'weight_gain' | 'strength' | 'endurance' | 'consistency' | 'body_composition' | 'custom' {
    const mapping: Record<string, 'weight_loss' | 'weight_gain' | 'strength' | 'endurance' | 'consistency' | 'body_composition' | 'custom'> = {
      'strength': 'strength',
      'endurance': 'endurance',
      'consistency': 'consistency',
      'body-composition': 'body_composition',
      'skill': 'custom',
    }
    return mapping[category] || 'custom'
  }
  
  private extractUnit(text: string): string {
    if (text.includes('lbs') || text.includes('pounds')) return 'lbs'
    if (text.includes('kg') || text.includes('kilograms')) return 'kg'
    if (text.includes('%')) return '%'
    if (text.includes('days')) return 'days'
    if (text.includes('reps')) return 'reps'
    return ''
  }
  async analyzeWorkoutPatterns(userId: string, days: number = 30): Promise<WorkoutPattern> {
    const startDate = subDays(new Date(), days)
    
    const recentWorkouts = await db
      .select()
      .from(workouts)
      .where(
        and(
          eq(workouts.userId, userId),
          gte(workouts.completedAt, startDate)
        )
      )
      .orderBy(desc(workouts.completedAt))

    if (recentWorkouts.length === 0) {
      return this.getDefaultWorkoutPattern()
    }

    const dayFrequency = this.analyzeDayFrequency(recentWorkouts)
    const timePreferences = this.analyzeTimePreferences(recentWorkouts)
    const consistency = this.calculateConsistency(recentWorkouts, days)
    const volumeTrend = await this.analyzeVolumeTrend(userId)
    const variety = this.calculateExerciseVariety(recentWorkouts)
    const restPattern = this.analyzeRestDayPattern(recentWorkouts)

    return {
      frequency: recentWorkouts.length / (days / 7),
      averageDuration: recentWorkouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0) / recentWorkouts.length,
      preferredDays: dayFrequency,
      preferredTimes: timePreferences,
      consistency,
      volumeTrend,
      exerciseVariety: variety,
      restDayPattern: restPattern,
    }
  }

  async generateProgressSummary(
    userId: string, 
    period: 'weekly' | 'monthly' | 'quarterly' = 'monthly'
  ): Promise<ProgressSummary> {
    const { startDate, endDate, previousStartDate } = this.getPeriodDates(period)
    
    const [currentWorkouts, previousWorkouts, currentProgress, previousProgress, prRecords] = await Promise.all([
      this.getWorkoutsInPeriod(userId, startDate, endDate),
      this.getWorkoutsInPeriod(userId, previousStartDate, startDate),
      this.getProgressInPeriod(userId, startDate, endDate),
      this.getProgressInPeriod(userId, previousStartDate, startDate),
      this.getNewPRsInPeriod(userId, startDate, endDate),
    ])

    const currentVolume = currentWorkouts.reduce((sum, w) => sum + (parseFloat(w.totalVolume || '0')), 0)
    const previousVolume = previousWorkouts.reduce((sum, w) => sum + (parseFloat(w.totalVolume || '0')), 0)
    const volumeChange = previousVolume > 0 ? ((currentVolume - previousVolume) / previousVolume) * 100 : 0

    const currentDuration = currentWorkouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0)
    const previousDuration = previousWorkouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0)
    const durationChange = previousDuration > 0 ? ((currentDuration - previousDuration) / previousDuration) * 100 : 0

    const bodyComposition = this.analyzeBodyComposition(currentProgress, previousProgress)
    const { highlights, concerns } = await this.generateInsights(currentWorkouts, previousWorkouts, bodyComposition)

    return {
      period,
      totalWorkouts: currentWorkouts.length,
      totalVolume: currentVolume,
      volumeChange,
      durationChange,
      newPRs: prRecords.length,
      streakStatus: await this.getStreakStatus(userId),
      bodyComposition,
      highlights,
      concerns,
    }
  }

  async identifyWeaknesses(userId: string): Promise<Weakness[]> {
    const patterns = await this.analyzeWorkoutPatterns(userId, 30)
    const progressData = await this.generateProgressSummary(userId, 'monthly')
    const exerciseData = await this.getExerciseData(userId)
    
    const weaknesses: Weakness[] = []

    // Consistency weakness
    if (patterns.consistency < 0.6) {
      weaknesses.push({
        type: 'consistency',
        severity: patterns.consistency < 0.3 ? 'critical' : 'moderate',
        description: `Working out only ${Math.round(patterns.consistency * 100)}% of expected days`,
        impact: 'Inconsistent training significantly slows progress and makes it harder to build habits',
        recommendation: 'Start with 3 workouts per week on fixed days. Set reminders and prepare gym bag the night before.',
        priority: 1,
      })
    }

    // Volume weakness
    if (progressData.volumeChange < -10) {
      weaknesses.push({
        type: 'volume',
        severity: progressData.volumeChange < -20 ? 'critical' : 'minor',
        description: `Training volume decreased by ${Math.abs(Math.round(progressData.volumeChange))}%`,
        impact: 'Decreasing volume can lead to strength loss and reduced muscle mass',
        recommendation: 'Gradually increase sets or reps by 10% weekly. Focus on progressive overload.',
        priority: 2,
      })
    }

    // Variety weakness
    if (patterns.exerciseVariety < 5) {
      weaknesses.push({
        type: 'variety',
        severity: 'moderate',
        description: `Only performing ${patterns.exerciseVariety} different exercises regularly`,
        impact: 'Limited exercise variety can cause imbalances and plateau progress',
        recommendation: 'Add 2-3 new exercises targeting different muscle groups or movement patterns.',
        priority: 3,
      })
    }

    // Balance weakness
    const muscleBalance = this.analyzeMuscleBalance(exerciseData)
    if (muscleBalance.imbalance > 0.3) {
      weaknesses.push({
        type: 'balance',
        severity: muscleBalance.imbalance > 0.5 ? 'critical' : 'moderate',
        description: `Overemphasizing ${muscleBalance.dominant} while neglecting ${muscleBalance.neglected}`,
        impact: 'Muscle imbalances increase injury risk and limit overall strength development',
        recommendation: `Add 2-3 ${muscleBalance.neglected} exercises to each workout. Consider a dedicated ${muscleBalance.neglected} day.`,
        priority: 2,
      })
    }

    // Recovery weakness
    if (patterns.restDayPattern.includes('insufficient')) {
      weaknesses.push({
        type: 'recovery',
        severity: 'moderate',
        description: 'Not taking adequate rest days between intense workouts',
        impact: 'Insufficient recovery leads to overtraining, injury risk, and performance decline',
        recommendation: 'Schedule at least 2 rest days per week. Consider active recovery like walking or yoga.',
        priority: 2,
      })
    }

    return weaknesses.sort((a, b) => a.priority - b.priority)
  }

  async generatePersonalizedGoals(userId: string): Promise<PersonalizedGoal[]> {
    const [userData, patterns, weaknesses, progressData, stats] = await Promise.all([
      this.getUserData(userId),
      this.analyzeWorkoutPatterns(userId, 60),
      this.identifyWeaknesses(userId),
      this.generateProgressSummary(userId, 'quarterly'),
      this.getUserStats(userId),
    ])

    const goals: PersonalizedGoal[] = []

    // Short-term consistency goal
    if (weaknesses.some(w => w.type === 'consistency')) {
      goals.push({
        type: 'short-term',
        category: 'consistency',
        title: 'Build Unbreakable Workout Habit',
        description: `Establish a consistent workout routine by hitting ${patterns.frequency < 3 ? 3 : patterns.frequency + 1} workouts per week for 30 days straight`,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        milestones: [
          {
            description: 'Complete first week with all scheduled workouts',
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            metric: '7 days streak',
          },
          {
            description: 'Maintain 2-week streak',
            targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            metric: '14 days streak',
          },
          {
            description: 'Complete full month',
            targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            metric: '30 days streak',
          },
        ],
        actionPlan: [
          'Schedule workouts in calendar as non-negotiable appointments',
          'Prepare gym bag night before',
          'Start with 45-minute sessions to avoid burnout',
          'Track completion in app daily',
        ],
        successCriteria: 'Complete at least 12 workouts in 30 days with no more than 2 consecutive rest days',
        estimatedDifficulty: patterns.consistency < 0.5 ? 'challenging' : 'moderate',
      })
    }

    // Medium-term strength goal
    const topExercises = await this.getTopExercises(userId, 3)
    if (topExercises.length > 0) {
      const targetExercise = topExercises[0]
      const currentPR = targetExercise.personalRecord as any
      const targetIncrease = this.calculateRealisticPRTarget(currentPR, userData)
      
      goals.push({
        type: 'medium-term',
        category: 'strength',
        title: `Crush New ${targetExercise.exerciseName} PR`,
        description: `Increase your ${targetExercise.exerciseName} by ${targetIncrease}% in 12 weeks through progressive overload`,
        targetDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000),
        milestones: [
          {
            description: `Add 5% to current working weight`,
            targetDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
            metric: `${Math.round(currentPR.weight * 1.05)}lbs`,
          },
          {
            description: `Reach 10% increase`,
            targetDate: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000),
            metric: `${Math.round(currentPR.weight * 1.10)}lbs`,
          },
          {
            description: `Hit final target`,
            targetDate: new Date(Date.now() + 84 * 24 * 60 * 60 * 1000),
            metric: `${Math.round(currentPR.weight * (1 + targetIncrease/100))}lbs`,
          },
        ],
        actionPlan: [
          `Perform ${targetExercise.exerciseName} 2x per week`,
          'Use 5/3/1 or linear progression scheme',
          'Focus on form with lighter weights in second session',
          'Ensure adequate protein intake (0.8-1g per lb bodyweight)',
          'Prioritize 7-8 hours sleep for recovery',
        ],
        successCriteria: `Complete a clean rep at ${Math.round(currentPR.weight * (1 + targetIncrease/100))}lbs with proper form`,
        estimatedDifficulty: 'challenging',
      })
    }

    // Long-term body composition goal
    if (progressData.bodyComposition.weightChange !== 0 || userData.startingWeight) {
      const isGaining = progressData.bodyComposition.weightChange > 0
      goals.push({
        type: 'long-term',
        category: 'body-composition',
        title: isGaining ? 'Lean Muscle Building Phase' : 'Body Recomposition Transformation',
        description: isGaining 
          ? 'Build 10-15lbs of lean muscle over 6 months while minimizing fat gain'
          : 'Reduce body fat by 5-8% while maintaining muscle mass over 6 months',
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        milestones: [
          {
            description: isGaining ? 'Gain first 3-5lbs' : 'Lose first 2% body fat',
            targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            metric: isGaining ? '+3-5lbs lean mass' : '-2% body fat',
          },
          {
            description: isGaining ? 'Reach 8-10lbs gained' : 'Achieve 4% reduction',
            targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
            metric: isGaining ? '+8-10lbs lean mass' : '-4% body fat',
          },
          {
            description: 'Complete transformation',
            targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            metric: isGaining ? '+10-15lbs lean mass' : '-5-8% body fat',
          },
        ],
        actionPlan: isGaining ? [
          'Maintain caloric surplus of 300-500 calories daily',
          'Hit protein target of 1g per lb bodyweight',
          'Focus on compound movements with progressive overload',
          'Track measurements monthly',
          'Adjust calories based on weekly weight trends',
        ] : [
          'Create moderate caloric deficit of 300-500 calories',
          'Maintain protein at 1-1.2g per lb bodyweight',
          'Include 2-3 cardio sessions per week',
          'Prioritize strength training to preserve muscle',
          'Take progress photos bi-weekly',
        ],
        successCriteria: isGaining 
          ? 'Gain 10-15lbs with less than 5lbs fat gain, increased strength across all lifts'
          : 'Reduce body fat by 5-8% while maintaining 90%+ of current strength levels',
        estimatedDifficulty: 'stretch',
      })
    }

    // Add skill-based goal if lacking variety
    if (weaknesses.some(w => w.type === 'variety')) {
      goals.push({
        type: 'short-term',
        category: 'skill',
        title: 'Master New Movement Pattern',
        description: 'Learn and perfect a challenging exercise like pistol squats, muscle-ups, or Olympic lifts',
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        milestones: [
          {
            description: 'Complete assisted/scaled version',
            targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            metric: '10 assisted reps',
          },
          {
            description: 'Perform with minimal assistance',
            targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            metric: '5 reps with band/support',
          },
          {
            description: 'Execute unassisted with proper form',
            targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            metric: '3 clean unassisted reps',
          },
        ],
        actionPlan: [
          'Practice movement 3x per week at start of workouts',
          'Film yourself to check form',
          'Work on mobility requirements daily',
          'Use progressions and scaled variations',
        ],
        successCriteria: 'Perform 3 clean, unassisted reps with full range of motion',
        estimatedDifficulty: 'moderate',
      })
    }

    return goals
  }

  async generateSmartInsights(userId: string): Promise<SmartInsights> {
    const [patterns, summary, weaknesses, goals] = await Promise.all([
      this.analyzeWorkoutPatterns(userId),
      this.generateProgressSummary(userId),
      this.identifyWeaknesses(userId),
      this.generatePersonalizedGoals(userId),
    ])

    const overallAnalysis = await this.generateOverallAnalysis(userId, patterns, summary, weaknesses, goals)
    const motivationalMessage = await this.generateMotivationalMessage(userId, patterns, weaknesses, goals)
    const nextSteps = this.generateNextSteps(weaknesses, goals)

    return {
      workoutPatterns: patterns,
      progressSummary: summary,
      weaknesses,
      goals,
      overallAnalysis,
      motivationalMessage,
      nextSteps,
    }
  }

  private async generateOverallAnalysis(
    userId: string,
    patterns: WorkoutPattern,
    summary: ProgressSummary,
    weaknesses: Weakness[],
    goals: PersonalizedGoal[]
  ): Promise<string> {
    try {
      const userData = await this.getUserData(userId)
      
      const prompt = `You are an expert fitness coach analyzing a user's workout data. Provide a comprehensive but concise analysis (3-4 paragraphs) of their fitness journey.

User: ${userData.fullName}
Workout Frequency: ${patterns.frequency.toFixed(1)} times/week
Consistency: ${(patterns.consistency * 100).toFixed(0)}%
Volume Trend: ${patterns.volumeTrend}
Recent Progress: ${summary.totalWorkouts} workouts, ${summary.volumeChange.toFixed(0)}% volume change
Main Weaknesses: ${weaknesses.slice(0, 2).map(w => w.type).join(', ')}
Key Goals: ${goals.slice(0, 2).map(g => g.category).join(', ')}

Provide an honest, insightful analysis that:
1. Acknowledges their current state and effort
2. Highlights 1-2 key insights from the data
3. Connects their weaknesses to specific outcomes
4. Shows how the suggested goals address their needs
5. Ends with an empowering perspective on their potential

Keep the tone professional but encouraging. Be specific with data points.`

      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      })

      return response.content[0].type === 'text' ? response.content[0].text : this.getFallbackAnalysis(patterns, summary)
    } catch (error) {
      console.error('Error generating analysis:', error)
      return this.getFallbackAnalysis(patterns, summary)
    }
  }

  private async generateMotivationalMessage(
    userId: string,
    patterns: WorkoutPattern,
    weaknesses: Weakness[],
    goals: PersonalizedGoal[]
  ): Promise<string> {
    try {
      const userData = await this.getUserData(userId)
      const criticalWeakness = weaknesses.find(w => w.severity === 'critical')
      const primaryGoal = goals[0]
      
      const prompt = `You are a motivational fitness coach. Create a powerful, personalized message (2-3 sentences) that will inspire ${userData.fullName} to take action TODAY.

Current State:
- Consistency: ${(patterns.consistency * 100).toFixed(0)}%
- Volume Trend: ${patterns.volumeTrend}
- Biggest Challenge: ${criticalWeakness?.type || weaknesses[0]?.type || 'consistency'}
- Next Goal: ${primaryGoal?.title || 'Improve consistency'}

Create a message that:
1. Acknowledges where they are without judgment
2. Paints a vivid picture of what's possible
3. Gives them a specific action for today
4. Uses powerful, action-oriented language

Tone: Inspiring, urgent, and personal. Like a coach who believes in them 100%.`

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }],
      })

      return response.content[0].type === 'text' ? response.content[0].text : this.getFallbackMotivation(patterns)
    } catch (error) {
      console.error('Error generating motivation:', error)
      return this.getFallbackMotivation(patterns)
    }
  }

  // Helper methods
  private analyzeDayFrequency(workouts: Workout[]): string[] {
    const dayCount: Record<string, number> = {}
    workouts.forEach(w => {
      const day = format(new Date(w.completedAt), 'EEEE')
      dayCount[day] = (dayCount[day] || 0) + 1
    })
    
    return Object.entries(dayCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day)
  }

  private analyzeTimePreferences(workouts: Workout[]): string[] {
    const timeSlots: Record<string, number> = {
      'Early Morning (5-8am)': 0,
      'Morning (8-11am)': 0,
      'Lunch (11am-2pm)': 0,
      'Afternoon (2-5pm)': 0,
      'Evening (5-8pm)': 0,
      'Night (8-11pm)': 0,
    }
    
    workouts.forEach(w => {
      const hour = new Date(w.completedAt).getHours()
      if (hour >= 5 && hour < 8) timeSlots['Early Morning (5-8am)']++
      else if (hour >= 8 && hour < 11) timeSlots['Morning (8-11am)']++
      else if (hour >= 11 && hour < 14) timeSlots['Lunch (11am-2pm)']++
      else if (hour >= 14 && hour < 17) timeSlots['Afternoon (2-5pm)']++
      else if (hour >= 17 && hour < 20) timeSlots['Evening (5-8pm)']++
      else if (hour >= 20 && hour < 23) timeSlots['Night (8-11pm)']++
    })
    
    return Object.entries(timeSlots)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([slot]) => slot)
  }

  private calculateConsistency(workouts: Workout[], days: number): number {
    const expectedWorkouts = (days / 7) * 3 // Assuming 3 workouts per week as baseline
    return Math.min(workouts.length / expectedWorkouts, 1)
  }

  private async analyzeVolumeTrend(userId: string): Promise<'increasing' | 'decreasing' | 'stable'> {
    const thirtyDaysAgo = subDays(new Date(), 30)
    const sixtyDaysAgo = subDays(new Date(), 60)
    
    const [recentVolume, previousVolume] = await Promise.all([
      this.getTotalVolume(userId, thirtyDaysAgo, new Date()),
      this.getTotalVolume(userId, sixtyDaysAgo, thirtyDaysAgo),
    ])
    
    const change = previousVolume > 0 ? (recentVolume - previousVolume) / previousVolume : 0
    
    if (change > 0.1) return 'increasing'
    if (change < -0.1) return 'decreasing'
    return 'stable'
  }

  private calculateExerciseVariety(workouts: Workout[]): number {
    const uniqueExercises = new Set<string>()
    workouts.forEach(w => {
      const exercises = w.exercises as any[]
      exercises?.forEach(e => uniqueExercises.add(e.name))
    })
    return uniqueExercises.size
  }

  private analyzeRestDayPattern(workouts: Workout[]): string[] {
    const patterns: string[] = []
    const sortedWorkouts = [...workouts].sort((a, b) => 
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    )
    
    let maxConsecutiveDays = 0
    let currentStreak = 1
    
    for (let i = 1; i < sortedWorkouts.length; i++) {
      const daysBetween = differenceInDays(
        new Date(sortedWorkouts[i].completedAt),
        new Date(sortedWorkouts[i-1].completedAt)
      )
      
      if (daysBetween === 1) {
        currentStreak++
        maxConsecutiveDays = Math.max(maxConsecutiveDays, currentStreak)
      } else {
        currentStreak = 1
      }
    }
    
    if (maxConsecutiveDays > 4) patterns.push('insufficient')
    if (maxConsecutiveDays <= 2) patterns.push('adequate')
    
    return patterns
  }

  private getPeriodDates(period: 'weekly' | 'monthly' | 'quarterly') {
    const now = new Date()
    let startDate: Date
    let endDate = now
    let previousStartDate: Date
    
    switch (period) {
      case 'weekly':
        startDate = startOfWeek(now)
        previousStartDate = subDays(startDate, 7)
        break
      case 'monthly':
        startDate = startOfMonth(now)
        previousStartDate = startOfMonth(subDays(startDate, 1))
        break
      case 'quarterly':
        startDate = subDays(now, 90)
        previousStartDate = subDays(startDate, 90)
        break
    }
    
    return { startDate, endDate, previousStartDate }
  }

  private async getWorkoutsInPeriod(userId: string, startDate: Date, endDate: Date) {
    return db
      .select()
      .from(workouts)
      .where(
        and(
          eq(workouts.userId, userId),
          gte(workouts.completedAt, startDate),
          lte(workouts.completedAt, endDate)
        )
      )
  }

  private async getProgressInPeriod(userId: string, startDate: Date, endDate: Date) {
    return db
      .select()
      .from(progressSnapshots)
      .where(
        and(
          eq(progressSnapshots.userId, userId),
          gte(progressSnapshots.date, format(startDate, 'yyyy-MM-dd')),
          lte(progressSnapshots.date, format(endDate, 'yyyy-MM-dd'))
        )
      )
  }

  private async getNewPRsInPeriod(userId: string, startDate: Date, endDate: Date) {
    return db
      .select()
      .from(exerciseLibrary)
      .where(
        and(
          eq(exerciseLibrary.userId, userId),
          gte(exerciseLibrary.updatedAt, startDate),
          lte(exerciseLibrary.updatedAt, endDate)
        )
      )
  }

  private async getStreakStatus(userId: string): Promise<{
    current: number;
    longest: number;
    trend: 'stable' | 'improving' | 'declining';
  }> {
    const streakData = await db.query.streaks.findFirst({
      where: eq(streaks.userId, userId)
    })
    
    const trend: 'stable' | 'improving' | 'declining' = 
      streakData?.currentStreak === streakData?.longestStreak ? 'improving' :
      streakData?.currentStreak === 0 ? 'declining' : 'stable'
    
    return {
      current: streakData?.currentStreak || 0,
      longest: streakData?.longestStreak || 0,
      trend,
    }
  }

  private analyzeBodyComposition(current: ProgressSnapshot[], previous: ProgressSnapshot[]) {
    const latestCurrent = current[current.length - 1]
    const latestPrevious = previous[previous.length - 1]
    
    const weightChange = latestCurrent && latestPrevious
      ? parseFloat(latestCurrent.weight || '0') - parseFloat(latestPrevious.weight || '0')
      : 0
      
    const bodyFatChange = latestCurrent?.bodyFatPercentage && latestPrevious?.bodyFatPercentage
      ? parseFloat(latestCurrent.bodyFatPercentage) - parseFloat(latestPrevious.bodyFatPercentage)
      : null
      
    const measurementChanges: Record<string, number> = {}
    
    if (latestCurrent?.measurements && latestPrevious?.measurements) {
      const currentMeasurements = latestCurrent.measurements as Record<string, number>
      const previousMeasurements = latestPrevious.measurements as Record<string, number>
      
      Object.keys(currentMeasurements).forEach(key => {
        if (previousMeasurements[key]) {
          measurementChanges[key] = currentMeasurements[key] - previousMeasurements[key]
        }
      })
    }
    
    return { weightChange, bodyFatChange, measurementChanges }
  }

  private async generateInsights(
    current: Workout[], 
    previous: Workout[], 
    bodyComp: any
  ): Promise<{ highlights: string[], concerns: string[] }> {
    const highlights: string[] = []
    const concerns: string[] = []
    
    // Workout frequency insights
    if (current.length > previous.length * 1.2) {
      highlights.push(`Increased workout frequency by ${Math.round((current.length / previous.length - 1) * 100)}%`)
    } else if (current.length < previous.length * 0.8) {
      concerns.push(`Workout frequency dropped by ${Math.round((1 - current.length / previous.length) * 100)}%`)
    }
    
    // Body composition insights
    if (bodyComp.weightChange < -2) {
      highlights.push(`Lost ${Math.abs(bodyComp.weightChange).toFixed(1)} lbs`)
    } else if (bodyComp.weightChange > 2) {
      highlights.push(`Gained ${bodyComp.weightChange.toFixed(1)} lbs`)
    }
    
    if (bodyComp.bodyFatChange && bodyComp.bodyFatChange < -1) {
      highlights.push(`Reduced body fat by ${Math.abs(bodyComp.bodyFatChange).toFixed(1)}%`)
    }
    
    // Volume insights
    const currentVolume = current.reduce((sum, w) => sum + parseFloat(w.totalVolume || '0'), 0)
    const previousVolume = previous.reduce((sum, w) => sum + parseFloat(w.totalVolume || '0'), 0)
    
    if (currentVolume > previousVolume * 1.15) {
      highlights.push('Significant volume increase - great progressive overload!')
    }
    
    return { highlights, concerns }
  }

  private async getExerciseData(userId: string) {
    return db
      .select()
      .from(exerciseLibrary)
      .where(eq(exerciseLibrary.userId, userId))
  }

  private analyzeMuscleBalance(exercises: ExerciseRecord[]) {
    const categories: Record<string, number> = {
      push: 0,
      pull: 0,
      legs: 0,
      core: 0,
    }
    
    exercises.forEach(e => {
      const category = e.category?.toLowerCase() || ''
      if (category.includes('push') || category.includes('chest') || category.includes('shoulder')) {
        categories.push++
      } else if (category.includes('pull') || category.includes('back') || category.includes('bicep')) {
        categories.pull++
      } else if (category.includes('leg') || category.includes('squat') || category.includes('deadlift')) {
        categories.legs++
      } else if (category.includes('core') || category.includes('abs')) {
        categories.core++
      }
    })
    
    const total = Object.values(categories).reduce((sum, count) => sum + count, 0)
    const expectedPerCategory = total / 4
    
    let maxDeviation = 0
    let dominant = ''
    let neglected = ''
    
    Object.entries(categories).forEach(([category, count]) => {
      const deviation = Math.abs(count - expectedPerCategory) / expectedPerCategory
      if (deviation > maxDeviation) {
        maxDeviation = deviation
        if (count > expectedPerCategory) {
          dominant = category
        } else {
          neglected = category
        }
      }
    })
    
    return { imbalance: maxDeviation, dominant, neglected }
  }

  private async getUserData(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })
    return user!
  }

  private async getUserStats(userId: string) {
    return db.query.userStats.findFirst({
      where: eq(userStats.userId, userId)
    })
  }

  private async getTotalVolume(userId: string, startDate: Date, endDate: Date) {
    const workouts = await this.getWorkoutsInPeriod(userId, startDate, endDate)
    return workouts.reduce((sum, w) => sum + parseFloat(w.totalVolume || '0'), 0)
  }

  private async getTopExercises(userId: string, limit: number) {
    return db
      .select()
      .from(exerciseLibrary)
      .where(eq(exerciseLibrary.userId, userId))
      .orderBy(desc(exerciseLibrary.lastPerformed))
      .limit(limit)
  }

  private calculateRealisticPRTarget(currentPR: any, userData: User): number {
    const baseIncrease = 15 // Base 15% increase target
    const experienceFactor = userData.createdAt 
      ? Math.min(differenceInDays(new Date(), new Date(userData.createdAt)) / 365, 1) 
      : 0.5
    
    // More experienced lifters progress slower
    const adjustedIncrease = baseIncrease * (1 - experienceFactor * 0.5)
    
    return Math.round(adjustedIncrease)
  }

  private generateNextSteps(weaknesses: Weakness[], goals: PersonalizedGoal[]): string[] {
    const steps: string[] = []
    
    // Address top weakness
    if (weaknesses[0]) {
      steps.push(`Focus on ${weaknesses[0].type}: ${weaknesses[0].recommendation.split('.')[0]}`)
    }
    
    // Start with primary goal
    if (goals[0]) {
      steps.push(`Begin "${goals[0].title}" - ${goals[0].actionPlan[0]}`)
    }
    
    // Add immediate action
    steps.push('Log your next workout within 24 hours to maintain momentum')
    
    // Add tracking reminder
    steps.push('Take progress photos and measurements this week for baseline')
    
    return steps.slice(0, 3)
  }

  // Fallback methods
  private getDefaultWorkoutPattern(): WorkoutPattern {
    return {
      frequency: 0,
      averageDuration: 0,
      preferredDays: [],
      preferredTimes: [],
      consistency: 0,
      volumeTrend: 'stable',
      exerciseVariety: 0,
      restDayPattern: ['insufficient'],
    }
  }

  private getFallbackAnalysis(patterns: WorkoutPattern, summary: ProgressSummary): string {
    return `Based on your recent activity, you're working out ${patterns.frequency.toFixed(1)} times per week with ${(patterns.consistency * 100).toFixed(0)}% consistency. 

Your training volume is ${patterns.volumeTrend}, and you've completed ${summary.totalWorkouts} workouts in the past ${summary.period}. ${summary.volumeChange > 0 ? `Your volume increased by ${summary.volumeChange.toFixed(0)}%, showing good progressive overload.` : 'Focus on gradually increasing your training volume for continued progress.'}

${patterns.consistency < 0.6 ? 'Improving consistency should be your top priority - aim for at least 3 workouts per week.' : 'Your consistency is solid - now focus on progressive overload and exercise variety.'}

Remember, sustainable progress comes from consistent effort over time. Keep showing up and the results will follow!`
  }

  private getFallbackMotivation(patterns: WorkoutPattern): string {
    if (patterns.consistency < 0.5) {
      return "You're at a crucial point - the difference between staying where you are and becoming who you want to be is showing up TODAY. One workout, right now, changes everything."
    } else if (patterns.volumeTrend === 'decreasing') {
      return "You've built the habit, now it's time to push harder. Add one more set, five more pounds, or two more reps today. Small increases create massive transformations."
    } else {
      return "You're building unstoppable momentum! Keep this energy flowing - your future self will thank you for every rep you do today. Let's make this your best workout yet!"
    }
  }
}

// Export singleton instance
export const aiSmartInsightsService = new AISmartInsightsService()