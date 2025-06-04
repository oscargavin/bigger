import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface MotivationContext {
  userName: string
  buddyName?: string
  currentStreak: number
  longestStreak: number
  weeklyWorkouts: number
  monthlyWorkouts: number
  totalWorkouts: number
  lastWorkoutDaysAgo: number
  performanceGap?: {
    type: 'ahead' | 'behind'
    difference: number
    metric: 'streak' | 'weekly' | 'monthly' | 'total'
  }
  event: 'streak_broken' | 'buddy_ahead' | 'milestone' | 'slacking' | 'crushing_it' | 'daily_check'
}

type MessageTone = 'shame' | 'motivational' | 'trash_talk' | 'encouragement' | 'celebration'

const SYSTEM_PROMPT = `You are a sassy, witty AI fitness coach for a gym accountability app. Your personality is a mix of:
- A drill sergeant who's secretly proud of their recruits
- A best friend who roasts you because they care
- A hype person who gets genuinely excited about progress

Your job is to generate short, punchy messages (1-2 sentences max) that:
- Use gym bro culture and fitness slang appropriately
- Are funny but not mean-spirited
- Actually motivate people to work out
- Reference specific numbers/stats when provided
- Keep it PG-13 (mild language okay, nothing offensive)

Remember: The goal is to get people to the gym, not make them feel genuinely bad about themselves.`

export async function generateMotivationMessage(
  context: MotivationContext,
  tone: MessageTone
): Promise<string> {
  const prompt = buildPrompt(context, tone)
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      temperature: 0.9,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return content.text.trim()
    }
    
    return getFallbackMessage(context, tone)
  } catch (error) {
    console.error('Error generating AI message:', error)
    return getFallbackMessage(context, tone)
  }
}

function buildPrompt(context: MotivationContext, tone: MessageTone): string {
  const { userName, buddyName, currentStreak, weeklyWorkouts, lastWorkoutDaysAgo, performanceGap, event } = context
  
  let prompt = `Generate a ${tone} message for ${userName}. `
  
  switch (event) {
    case 'streak_broken':
      prompt += `They just broke their ${currentStreak} day streak! They haven't worked out in ${lastWorkoutDaysAgo} days. Time for some tough love.`
      break
      
    case 'buddy_ahead':
      if (performanceGap && buddyName) {
        prompt += `Their buddy ${buddyName} is ${performanceGap.difference} ${performanceGap.metric === 'streak' ? 'days' : 'workouts'} ahead. ${userName} needs to catch up!`
      }
      break
      
    case 'milestone':
      prompt += `They just hit a milestone: ${currentStreak} day streak! Time to celebrate but keep them hungry for more.`
      break
      
    case 'slacking':
      prompt += `They've only done ${weeklyWorkouts} workouts this week and haven't been to the gym in ${lastWorkoutDaysAgo} days. Light a fire under them!`
      break
      
    case 'crushing_it':
      prompt += `They're absolutely killing it with ${weeklyWorkouts} workouts this week and a ${currentStreak} day streak! Keep the momentum going.`
      break
      
    case 'daily_check':
      if (lastWorkoutDaysAgo === 0) {
        prompt += `They already worked out today! Acknowledge their dedication.`
      } else if (lastWorkoutDaysAgo === 1) {
        prompt += `They worked out yesterday. Gentle reminder to keep the streak alive today.`
      } else {
        prompt += `They haven't worked out in ${lastWorkoutDaysAgo} days. Time for a wake-up call!`
      }
      break
  }
  
  return prompt
}

function getFallbackMessage(context: MotivationContext, tone: MessageTone): string {
  const { userName, currentStreak, weeklyWorkouts, lastWorkoutDaysAgo, event } = context
  
  const fallbacks: Record<string, string[]> = {
    streak_broken: [
      `RIP to your ${currentStreak} day streak, ${userName}. Time to start a new one! 💪`,
      `Streaks are meant to be broken... but so are PRs. Get back in there!`,
      `${currentStreak} days down the drain. But hey, muscle memory is real!`
    ],
    buddy_ahead: [
      `Your buddy is making you look bad, ${userName}. You gonna take that?`,
      `While you're reading this, your buddy is probably at the gym. Just saying...`,
      `Someone's getting out-worked, and it ain't your buddy! 😤`
    ],
    milestone: [
      `${currentStreak} days strong! You're officially a gym regular now! 🔥`,
      `Look at you with that ${currentStreak} day streak! Beast mode: ACTIVATED`,
      `${currentStreak} days of pure dedication. You love to see it! 💪`
    ],
    slacking: [
      `${weeklyWorkouts} workouts this week? Those are rookie numbers, gotta pump those up!`,
      `${lastWorkoutDaysAgo} days without a workout? Your muscles are filing a missing person report!`,
      `Remember when you said "this is the year"? The gym remembers...`
    ],
    crushing_it: [
      `${weeklyWorkouts} workouts this week?! Save some gains for the rest of us! 🔥`,
      `${currentStreak} day streak and counting! You're making this look easy!`,
      `Absolutely destroying it! Keep this energy up! 💪`
    ],
    daily_check: [
      lastWorkoutDaysAgo === 0 ? `Already crushed it today! Rest up, warrior!` :
      lastWorkoutDaysAgo === 1 ? `You showed up yesterday. Let's make it two in a row!` :
      `${lastWorkoutDaysAgo} days off? Time to get back to business!`
    ]
  }
  
  const messages = fallbacks[event] || fallbacks.daily_check
  return messages[Math.floor(Math.random() * messages.length)]
}

export async function generateBulkMotivation(
  contexts: MotivationContext[],
  tone: MessageTone
): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  
  // Process in batches to avoid rate limits
  const batchSize = 5
  for (let i = 0; i < contexts.length; i += batchSize) {
    const batch = contexts.slice(i, i + batchSize)
    const promises = batch.map(context => 
      generateMotivationMessage(context, tone)
        .then(message => ({ userName: context.userName, message }))
    )
    
    const batchResults = await Promise.all(promises)
    batchResults.forEach(({ userName, message }) => {
      results.set(userName, message)
    })
    
    // Small delay between batches
    if (i + batchSize < contexts.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
}