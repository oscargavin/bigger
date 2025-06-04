import Anthropic from '@anthropic-ai/sdk'
import { 
  analyzeUserWorkouts, 
  comparePerformance,
  type WorkoutAnalysis,
  type PerformanceComparison,
  type WorkoutData,
  type ExerciseRecordData
} from './performance-analysis-service'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface EnhancedMotivationContext {
  userName: string
  buddyName?: string
  currentStreak: number
  longestStreak: number
  weeklyWorkouts: number
  monthlyWorkouts: number
  totalWorkouts: number
  lastWorkoutDaysAgo: number
  
  // Enhanced performance tracking
  performanceGaps?: {
    streak?: { difference: number; direction: 'ahead' | 'behind' }
    weekly?: { difference: number; direction: 'ahead' | 'behind' }
    monthly?: { difference: number; direction: 'ahead' | 'behind' }
    volume?: { difference: number; direction: 'ahead' | 'behind'; percentage: number }
    consistency?: { userRate: number; buddyRate: number; direction: 'ahead' | 'behind' } // percentage
  }
  
  // Workout history for personalization
  workoutHistory?: {
    averageDuration: number // minutes
    favoriteExercises: string[]
    strongestLift?: { exercise: string; weight: number }
    recentPRs?: Array<{ exercise: string; weight: number; date: Date }>
    workoutTimes: { morning: number; afternoon: number; evening: number } // percentages
    volumeTrend: 'increasing' | 'decreasing' | 'stable'
    missedDaysPattern?: string[] // e.g., ['Monday', 'Friday']
  }
  
  // Context for the message
  event: 'streak_broken' | 'buddy_dominating' | 'falling_behind' | 'milestone' | 
         'slacking_hard' | 'crushing_it' | 'daily_reminder' | 'missed_usual_day' |
         'volume_drop' | 'consistency_drop' | 'pr_achieved' | 'comeback'
         
  // Additional context
  additionalContext?: {
    daysUntilGoal?: number
    competitionStatus?: 'winning' | 'losing' | 'tied'
    lastMessage?: string // to avoid repetition
    severity?: 'light' | 'medium' | 'nuclear' // how harsh to be
  }
}

type EnhancedMessageType = 
  | 'shame' 
  | 'trash_talk' 
  | 'motivational' 
  | 'roast'
  | 'encouragement' 
  | 'celebration'
  | 'disappointment'
  | 'challenge'

const ENHANCED_SYSTEM_PROMPT = `You are the AI Shame Engine for a gym accountability app. Your personality combines:
- A savage gym bro who's seen too many people quit
- A disappointed parent who knows you can do better  
- A trash-talking competitor who wants to see you prove them wrong
- A hype beast who goes absolutely wild when you succeed

Your messages should:
- Be SHORT and PUNCHY (1-2 sentences max, preferably 1)
- Use specific numbers and data to make it personal
- Reference their workout patterns and habits
- Compare them to their buddy when relevant
- Be funny but hit hard enough to get them moving
- Use gym slang and memes appropriately
- Stay PG-13 but don't hold back on the roasting

Remember: The shame should motivate, not devastate. Make them laugh while they feel called out.`

export async function generateShameEngineMessage(
  context: EnhancedMotivationContext,
  messageType: EnhancedMessageType
): Promise<string> {
  const prompt = buildEnhancedPrompt(context, messageType)
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      temperature: 0.95, // Higher for more creative roasts
      system: ENHANCED_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return content.text.trim()
    }
    
    return getEnhancedFallback(context, messageType)
  } catch (error) {
    console.error('Shame Engine Error:', error)
    return getEnhancedFallback(context, messageType)
  }
}

function buildEnhancedPrompt(
  context: EnhancedMotivationContext, 
  messageType: EnhancedMessageType
): string {
  const { 
    userName, 
    buddyName, 
    performanceGaps,
    workoutHistory,
    event,
    additionalContext 
  } = context
  
  let prompt = `Generate a ${messageType} message for ${userName}. `
  
  // Add performance gap context
  if (performanceGaps && buddyName) {
    const gaps = []
    if (performanceGaps.streak?.direction === 'behind') {
      gaps.push(`${performanceGaps.streak.difference} day streak behind ${buddyName}`)
    }
    if (performanceGaps.volume?.direction === 'behind') {
      gaps.push(`lifting ${performanceGaps.volume.percentage}% less weight than ${buddyName}`)
    }
    if (performanceGaps.consistency) {
      const diff = performanceGaps.consistency.buddyRate - performanceGaps.consistency.userRate
      if (diff > 10) {
        gaps.push(`${buddyName} shows up ${diff}% more consistently`)
      }
    }
    if (gaps.length > 0) {
      prompt += `Performance gaps: ${gaps.join(', ')}. `
    }
  }
  
  // Add workout history context
  if (workoutHistory) {
    if (workoutHistory.missedDaysPattern?.length) {
      prompt += `They always skip ${workoutHistory.missedDaysPattern.join(' and ')}. `
    }
    if (workoutHistory.volumeTrend === 'decreasing') {
      prompt += `Their weights have been dropping lately. `
    }
    if (workoutHistory.favoriteExercises.length) {
      prompt += `They love ${workoutHistory.favoriteExercises[0]} but have been avoiding it. `
    }
  }
  
  // Event-specific prompts
  switch (event) {
    case 'streak_broken':
      prompt += `They just killed their ${context.currentStreak} day streak! ${
        context.currentStreak > 7 ? 'This was actually impressive before they ruined it.' : ''
      } Haven't worked out in ${context.lastWorkoutDaysAgo} days now.`
      break
      
    case 'buddy_dominating':
      prompt += `${buddyName} is absolutely destroying them in every metric. This is getting embarrassing.`
      break
      
    case 'falling_behind':
      prompt += `They're falling behind ${buddyName} week after week. The gap keeps growing.`
      break
      
    case 'slacking_hard':
      prompt += `${context.weeklyWorkouts} workouts this week. ${context.lastWorkoutDaysAgo} days since last workout. This is pathetic.`
      break
      
    case 'missed_usual_day':
      prompt += `They ALWAYS work out on ${new Date().toLocaleDateString('en-US', { weekday: 'long' })} but not today. Something's wrong.`
      break
      
    case 'volume_drop':
      prompt += `They're lifting way less weight than usual. Either injured or just gave up caring.`
      break
      
    case 'consistency_drop':
      prompt += `Used to be consistent, now they're flaky. Classic case of losing discipline.`
      break
      
    case 'pr_achieved':
      if (workoutHistory?.recentPRs?.[0]) {
        const pr = workoutHistory.recentPRs[0]
        prompt += `Just hit ${pr.weight}lbs on ${pr.exercise}! Time to acknowledge greatness.`
      }
      break
      
    case 'comeback':
      prompt += `They're back after ${context.lastWorkoutDaysAgo} days! Roast them but welcome them back.`
      break
  }
  
  // Add severity context
  if (additionalContext?.severity) {
    prompt += ` Severity level: ${additionalContext.severity}.`
  }
  
  return prompt
}

function getEnhancedFallback(
  context: EnhancedMotivationContext, 
  messageType: EnhancedMessageType
): string {
  const { userName, currentStreak, buddyName } = context
  
  const fallbacks: Record<string, string[]> = {
    streak_broken: [
      `${currentStreak} days... gone. ${buddyName || 'Your muscles'} won't even recognize you anymore.`,
      `RIP ${currentStreak} day streak. It died doing what it loved: being ignored by ${userName}.`,
      `Congrats on the ${currentStreak} day participation trophy. Too bad you fumbled it.`
    ],
    buddy_dominating: [
      `${buddyName} is making you their personal benchmark for mediocrity.`,
      `At this rate, ${buddyName} should claim you as a dependent on their taxes.`,
      `${buddyName} called. They're getting bored of winning so easily.`
    ],
    slacking_hard: [
      `The gym filed a missing person report. Description: "${userName}, chronic underachiever"`,
      `Your muscles are in witness protection from the trauma of being abandoned.`,
      `Even your rest days are taking rest days at this point.`
    ],
    comeback: [
      `Look who remembered their gym password! Welcome back to the land of the lifting.`,
      `The prodigal lifter returns! Your bench missed you (it's been very lonely).`,
      `Back from the dead! Lazarus had nothing on this resurrection.`
    ]
  }
  
  const messages = fallbacks[context.event] || [
    `${userName}, this is your sign to stop being a disappointment.`,
    `Somewhere, ${buddyName || 'someone'} is working harder than you. Sleep tight.`,
    `The only thing you're crushing lately is your own potential.`
  ]
  
  return messages[Math.floor(Math.random() * messages.length)]
}

// Generate personalized messages based on detailed workout history
export async function generatePersonalizedMessage(
  userName: string,
  workouts: WorkoutData[],
  buddyName?: string,
  buddyWorkouts?: WorkoutData[],
  exerciseRecords?: ExerciseRecordData[]
): Promise<string> {
  // Analyze user's workout patterns
  const userAnalysis = analyzeUserWorkouts(workouts, exerciseRecords)
  
  let performanceGaps: EnhancedMotivationContext['performanceGaps'] | undefined
  
  // If buddy exists, analyze their patterns and compare
  if (buddyWorkouts && buddyName) {
    const buddyAnalysis = analyzeUserWorkouts(buddyWorkouts)
    const comparison = comparePerformance(userAnalysis, buddyAnalysis, workouts, buddyWorkouts)
    
    performanceGaps = {
      streak: comparison.streak,
      weekly: comparison.weekly,
      monthly: comparison.monthly,
      volume: comparison.volume,
      consistency: comparison.consistency
    }
  }
  
  // Build workout history context
  const workoutHistory: EnhancedMotivationContext['workoutHistory'] = {
    averageDuration: userAnalysis.averageWorkoutDuration,
    favoriteExercises: userAnalysis.favoriteExercises.map(e => e.name),
    strongestLift: userAnalysis.recentPRs[0] ? {
      exercise: userAnalysis.recentPRs[0].exercise,
      weight: userAnalysis.recentPRs[0].weight
    } : undefined,
    recentPRs: userAnalysis.recentPRs,
    workoutTimes: userAnalysis.workoutTimeDistribution,
    volumeTrend: userAnalysis.volumeTrend,
    missedDaysPattern: userAnalysis.missedDaysPattern
  }
  
  const context: EnhancedMotivationContext = {
    userName,
    buddyName,
    currentStreak: userAnalysis.currentStreak,
    longestStreak: userAnalysis.longestStreak,
    weeklyWorkouts: userAnalysis.weeklyWorkouts,
    monthlyWorkouts: userAnalysis.monthlyWorkouts,
    totalWorkouts: workouts.length,
    lastWorkoutDaysAgo: userAnalysis.daysSinceLastWorkout,
    performanceGaps,
    workoutHistory,
    event: determineEvent(userAnalysis, performanceGaps),
    additionalContext: {
      severity: determineSeverity(userAnalysis, performanceGaps)
    }
  }
  
  const messageType = determineMessageType(userAnalysis, performanceGaps)
  return generateShameEngineMessage(context, messageType)
}

// Helper functions to determine context
function determineEvent(
  analysis: WorkoutAnalysis,
  performanceGaps?: EnhancedMotivationContext['performanceGaps']
): EnhancedMotivationContext['event'] {
  // Check for broken streak
  if (analysis.currentStreak === 0 && analysis.longestStreak > 3) {
    return 'streak_broken'
  }
  
  // Check if buddy is dominating
  if (performanceGaps) {
    let behindCount = 0
    if (performanceGaps.streak?.direction === 'behind' && performanceGaps.streak.difference > 5) behindCount++
    if (performanceGaps.weekly?.direction === 'behind' && performanceGaps.weekly.difference > 2) behindCount++
    if (performanceGaps.volume?.direction === 'behind' && performanceGaps.volume.percentage < -20) behindCount++
    
    if (behindCount >= 2) return 'buddy_dominating'
    if (behindCount >= 1) return 'falling_behind'
  }
  
  // Check for milestones
  if (analysis.currentStreak > 0 && analysis.currentStreak % 7 === 0) {
    return 'milestone'
  }
  
  // Check for PRs
  if (analysis.recentPRs.length > 0 && analysis.recentPRs[0].improvement > 5) {
    return 'pr_achieved'
  }
  
  // Check for slacking
  if (analysis.weeklyWorkouts < 2 || analysis.daysSinceLastWorkout > 3) {
    return 'slacking_hard'
  }
  
  // Check for crushing it
  if (analysis.weeklyWorkouts >= 5 && analysis.currentStreak >= 7) {
    return 'crushing_it'
  }
  
  // Check for comeback
  if (analysis.daysSinceLastWorkout > 7 && analysis.totalVolume > 0) {
    return 'comeback'
  }
  
  // Check for volume drop
  if (analysis.volumeTrend === 'decreasing') {
    return 'volume_drop'
  }
  
  // Check for consistency drop
  if (analysis.consistencyRate < 50) {
    return 'consistency_drop'
  }
  
  // Check for missed usual day
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  if (analysis.missedDaysPattern.includes(today) && analysis.daysSinceLastWorkout >= 1) {
    return 'missed_usual_day'
  }
  
  return 'daily_reminder'
}

function determineMessageType(
  analysis: WorkoutAnalysis,
  performanceGaps?: EnhancedMotivationContext['performanceGaps']
): EnhancedMessageType {
  const event = determineEvent(analysis, performanceGaps)
  
  switch (event) {
    case 'streak_broken':
    case 'buddy_dominating':
    case 'slacking_hard':
      return 'shame'
      
    case 'falling_behind':
    case 'volume_drop':
    case 'consistency_drop':
      return 'trash_talk'
      
    case 'milestone':
    case 'pr_achieved':
    case 'crushing_it':
      return 'celebration'
      
    case 'comeback':
    case 'daily_reminder':
      return 'motivational'
      
    case 'missed_usual_day':
      return 'roast'
      
    default:
      return 'encouragement'
  }
}

function determineSeverity(
  analysis: WorkoutAnalysis,
  performanceGaps?: EnhancedMotivationContext['performanceGaps']
): 'light' | 'medium' | 'nuclear' {
  let severity = 0
  
  // Streak factors
  if (analysis.currentStreak === 0 && analysis.longestStreak > 10) severity += 3
  else if (analysis.currentStreak === 0 && analysis.longestStreak > 5) severity += 2
  else if (analysis.currentStreak === 0) severity += 1
  
  // Days since last workout
  if (analysis.daysSinceLastWorkout > 7) severity += 3
  else if (analysis.daysSinceLastWorkout > 5) severity += 2
  else if (analysis.daysSinceLastWorkout > 3) severity += 1
  
  // Performance gaps
  if (performanceGaps) {
    if (performanceGaps.streak?.direction === 'behind' && performanceGaps.streak.difference > 10) severity += 2
    if (performanceGaps.volume?.direction === 'behind' && performanceGaps.volume.percentage < -30) severity += 2
    if (performanceGaps.consistency?.direction === 'behind' && 
        performanceGaps.consistency.buddyRate - performanceGaps.consistency.userRate > 30) severity += 2
  }
  
  // Consistency
  if (analysis.consistencyRate < 25) severity += 3
  else if (analysis.consistencyRate < 50) severity += 2
  else if (analysis.consistencyRate < 75) severity += 1
  
  // Volume trend
  if (analysis.volumeTrend === 'decreasing') severity += 1
  
  // Map severity score to level
  if (severity >= 8) return 'nuclear'
  if (severity >= 4) return 'medium'
  return 'light'
}

// Batch generation for multiple users
export async function generateBulkShameMessages(
  contexts: EnhancedMotivationContext[],
  messageType: EnhancedMessageType
): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  
  // Process in smaller batches for better quality
  const batchSize = 3
  for (let i = 0; i < contexts.length; i += batchSize) {
    const batch = contexts.slice(i, i + batchSize)
    const promises = batch.map(context => 
      generateShameEngineMessage(context, messageType)
        .then(message => ({ userName: context.userName, message }))
        .catch(err => ({ 
          userName: context.userName, 
          message: getEnhancedFallback(context, messageType) 
        }))
    )
    
    const batchResults = await Promise.all(promises)
    batchResults.forEach(({ userName, message }) => {
      results.set(userName, message)
    })
    
    // Delay between batches to respect rate limits
    if (i + batchSize < contexts.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  return results
}