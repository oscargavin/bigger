import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { generatePersonalizedMessage, generateShameEngineMessage, type EnhancedMotivationContext } from '@/server/services/ai-shame-engine'
import { analyzeUserWorkouts, comparePerformance } from '@/server/services/performance-analysis-service'

export const aiShameRouter = createTRPCRouter({
  // Get personalized shame/motivation message
  getPersonalizedMessage: protectedProcedure
    .input(z.object({
      messageType: z.enum(['shame', 'trash_talk', 'motivational', 'roast', 'encouragement', 'celebration', 'disappointment', 'challenge']).optional(),
      event: z.enum(['streak_broken', 'buddy_dominating', 'falling_behind', 'milestone', 'slacking_hard', 'crushing_it', 'daily_reminder', 'missed_usual_day', 'volume_drop', 'consistency_drop', 'pr_achieved', 'comeback']).optional()
    }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id
      const userName = ctx.user.user_metadata?.full_name || ctx.user.email?.split('@')[0] || 'Champion'
      
      // Get user's workouts (handle potential database errors)
      let userWorkouts: any[] = []
      try {
        const { data, error } = await ctx.supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(100)
        
        if (error) throw error
        userWorkouts = data || []
      } catch (error) {
        console.warn('Failed to fetch workouts, table may not exist yet:', error)
        // Continue with empty array
      }
        
      // Get user's exercise records
      let userExerciseRecords: any[] = []
      try {
        const { data, error } = await ctx.supabase
          .from('exercise_library')
          .select('*')
          .eq('user_id', userId)
        
        if (error) throw error
        userExerciseRecords = data || []
      } catch (error) {
        console.warn('Failed to fetch exercise records, table may not exist yet:', error)
        // Continue with empty array
      }
        
      // Check if user has a buddy
      let buddyId: string | null = null
      let buddyName: string | null = null
      let buddyWorkouts: typeof userWorkouts = []
      
      // Get buddy from pairings
      let pairing: any = null
      try {
        const { data: pairingData, error } = await ctx.supabase
          .from('pairings')
          .select(`
            *,
            user1:users!pairings_user1_id_fkey(*),
            user2:users!pairings_user2_id_fkey(*)
          `)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .eq('status', 'active')
          .single()
        
        if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
        pairing = pairingData
      } catch (error) {
        console.warn('Failed to fetch pairing:', error)
        // Continue without pairing
      }
      
      if (pairing) {
        buddyId = pairing.user1_id === userId ? pairing.user2_id : pairing.user1_id
        buddyName = pairing.user1_id === userId ? 
          (pairing.user2?.full_name || pairing.user2?.username || 'Your buddy') : 
          (pairing.user1?.full_name || pairing.user1?.username || 'Your buddy')
        
        // Get buddy's workouts
        try {
          const { data, error } = await ctx.supabase
            .from('workouts')
            .select('*')
            .eq('user_id', buddyId)
            .order('completed_at', { ascending: false })
            .limit(100)
          
          if (error) throw error
          buddyWorkouts = data || []
        } catch (error) {
          console.warn('Failed to fetch buddy workouts:', error)
          buddyWorkouts = []
        }
      }
      
      // If specific event or type requested, generate with that context
      if (input?.event || input?.messageType) {
        const userAnalysis = analyzeUserWorkouts(userWorkouts, userExerciseRecords)
        
        let performanceGaps: EnhancedMotivationContext['performanceGaps'] | undefined
        if (buddyWorkouts.length > 0 && buddyName) {
          const buddyAnalysis = analyzeUserWorkouts(buddyWorkouts)
          const comparison = comparePerformance(userAnalysis, buddyAnalysis, userWorkouts, buddyWorkouts)
          
          performanceGaps = {
            streak: comparison.streak,
            weekly: comparison.weekly,
            monthly: comparison.monthly,
            volume: comparison.volume,
            consistency: comparison.consistency
          }
        }
        
        const context: EnhancedMotivationContext = {
          userName,
          buddyName: buddyName || undefined,
          currentStreak: userAnalysis.currentStreak,
          longestStreak: userAnalysis.longestStreak,
          weeklyWorkouts: userAnalysis.weeklyWorkouts,
          monthlyWorkouts: userAnalysis.monthlyWorkouts,
          totalWorkouts: userWorkouts.length,
          lastWorkoutDaysAgo: userAnalysis.daysSinceLastWorkout,
          performanceGaps,
          workoutHistory: {
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
          },
          event: input.event || 'daily_reminder'
        }
        
        const message = await generateShameEngineMessage(
          context,
          input.messageType || 'motivational'
        )
        
        return {
          message,
          context: {
            event: context.event,
            severity: context.additionalContext?.severity,
            currentStreak: userAnalysis.currentStreak,
            daysSinceLastWorkout: userAnalysis.daysSinceLastWorkout
          }
        }
      }
      
      // If no workouts yet, return a starter message
      if (userWorkouts.length === 0) {
        return {
          message: `Hey ${userName}! Time to log your first workout and start building that streak. The gym is calling your name! 💪`,
          context: {
            hasWorkouts: false,
            hasBuddy: !!buddyName,
            event: 'no_workouts_yet'
          }
        }
      }
      
      // Otherwise generate fully personalized message
      const message = await generatePersonalizedMessage(
        userName,
        userWorkouts,
        buddyName || undefined,
        buddyWorkouts.length > 0 ? buddyWorkouts : undefined,
        userExerciseRecords
      )
      
      return {
        message,
        context: {
          hasWorkouts: userWorkouts.length > 0,
          hasBuddy: !!buddyName
        }
      }
    }),
    
  // Get performance comparison with buddy
  getPerformanceComparison: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id
      
      // Get user's workouts
      let userWorkouts: any[] = []
      try {
        const { data, error } = await ctx.supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(100)
        
        if (error) throw error
        userWorkouts = data || []
      } catch (error) {
        console.warn('Failed to fetch workouts for comparison:', error)
      }
        
      // Get pairing
      let pairing: any = null
      try {
        const { data: pairingData, error } = await ctx.supabase
          .from('pairings')
          .select(`
            *,
            user1:users!pairings_user1_id_fkey(*),
            user2:users!pairings_user2_id_fkey(*)
          `)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .eq('status', 'active')
          .single()
        
        if (error && error.code !== 'PGRST116') throw error
        pairing = pairingData
      } catch (error) {
        console.warn('Failed to fetch pairing for comparison:', error)
      }
      
      if (!pairing) {
        return null
      }
      
      const buddyId = pairing.user1_id === userId ? pairing.user2_id : pairing.user1_id
      const buddyName = pairing.user1_id === userId ? 
        (pairing.user2?.full_name || pairing.user2?.username || 'Your buddy') : 
        (pairing.user1?.full_name || pairing.user1?.username || 'Your buddy')
      
      // Get buddy's workouts
      let buddyWorkouts: any[] = []
      try {
        const { data, error } = await ctx.supabase
          .from('workouts')
          .select('*')
          .eq('user_id', buddyId)
          .order('completed_at', { ascending: false })
          .limit(100)
        
        if (error) throw error
        buddyWorkouts = data || []
      } catch (error) {
        console.warn('Failed to fetch buddy workouts for comparison:', error)
      }
        
      // Analyze both users
      const userAnalysis = analyzeUserWorkouts(userWorkouts)
      const buddyAnalysis = analyzeUserWorkouts(buddyWorkouts)
      
      // Get comparison
      const comparison = comparePerformance(userAnalysis, buddyAnalysis, userWorkouts, buddyWorkouts)
      
      return {
        userName: ctx.user.user_metadata?.full_name || ctx.user.email?.split('@')[0] || 'You',
        buddyName: buddyName || 'Your buddy',
        userStats: {
          currentStreak: userAnalysis.currentStreak,
          weeklyWorkouts: userAnalysis.weeklyWorkouts,
          monthlyWorkouts: userAnalysis.monthlyWorkouts,
          consistencyRate: userAnalysis.consistencyRate,
          totalVolume: userAnalysis.totalVolume
        },
        buddyStats: {
          currentStreak: buddyAnalysis.currentStreak,
          weeklyWorkouts: buddyAnalysis.weeklyWorkouts,
          monthlyWorkouts: buddyAnalysis.monthlyWorkouts,
          consistencyRate: buddyAnalysis.consistencyRate,
          totalVolume: buddyAnalysis.totalVolume
        },
        comparison
      }
    }),
    
  // Get workout analysis
  getWorkoutAnalysis: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id
      
      // Get user's workouts
      let userWorkouts: any[] = []
      try {
        const { data, error } = await ctx.supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(100)
        
        if (error) throw error
        userWorkouts = data || []
      } catch (error) {
        console.warn('Failed to fetch workouts for analysis:', error)
      }
        
      // Get user's exercise records
      let userExerciseRecords: any[] = []
      try {
        const { data, error } = await ctx.supabase
          .from('exercise_library')
          .select('*')
          .eq('user_id', userId)
        
        if (error) throw error
        userExerciseRecords = data || []
      } catch (error) {
        console.warn('Failed to fetch exercise records for analysis:', error)
      }
        
      const analysis = analyzeUserWorkouts(userWorkouts, userExerciseRecords)
      
      return analysis
    }),
    
  // Trigger daily shame message (could be called by cron)
  triggerDailyShame: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.user.id
      const userName = ctx.user.user_metadata?.full_name || ctx.user.email?.split('@')[0] || 'Champion'
      
      // Get user's workouts
      let userWorkouts: any[] = []
      try {
        const { data, error } = await ctx.supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(30) // Last month
        
        if (error) throw error
        userWorkouts = data || []
      } catch (error) {
        console.warn('Failed to fetch workouts for daily shame:', error)
      }
        
      if (userWorkouts.length === 0) {
        return {
          message: `Hey ${userName}, time to start your fitness journey! The gym is waiting for you.`,
          sent: true
        }
      }
      
      const analysis = analyzeUserWorkouts(userWorkouts)
      
      // Determine if we should send a shame message
      if (analysis.daysSinceLastWorkout >= 2 || analysis.currentStreak === 0) {
        const message = await generatePersonalizedMessage(
          userName,
          userWorkouts
        )
        
        // Here you could also save this to a notifications table
        // or send via push notification/email
        
        return {
          message,
          sent: true,
          context: {
            daysSinceLastWorkout: analysis.daysSinceLastWorkout,
            currentStreak: analysis.currentStreak
          }
        }
      }
      
      return {
        message: null,
        sent: false,
        context: {
          daysSinceLastWorkout: analysis.daysSinceLastWorkout,
          currentStreak: analysis.currentStreak
        }
      }
    })
})