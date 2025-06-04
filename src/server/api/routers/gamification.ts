import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { db } from '@/db'
import { 
  challenges, 
  challengeParticipants,
  seasonalCompetitions,
  seasonalCompetitionParticipants,
  userStats,
  comebackMechanics,
  workouts,
  exerciseLibrary
} from '@/db/schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import { PointsService } from '@/server/services/points-service'

const getPointsForNextLevel = (currentLevel: number): number => {
  const levelPoints = [
    0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500
  ]
  
  if (currentLevel < levelPoints.length - 1) {
    return levelPoints[currentLevel + 1]
  }
  
  // After level 10, each level requires 1000 more points
  return 5500 + ((currentLevel - 9) * 1000)
}

export const gamificationRouter = createTRPCRouter({
  // Get user's current stats and level
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id
    
    let stats = null
    try {
      stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, userId),
      })
    } catch (error) {
      console.warn('Failed to fetch user stats, table may not exist yet:', error)
    }
    
    // Get user's rank among all users
    let rankData = null
    try {
      const result = await ctx.supabase
        .rpc('get_user_rank', { p_user_id: userId })
      rankData = result.data
    } catch (error) {
      console.warn('Failed to get user rank:', error)
    }
    
    // Return default stats if none exist
    if (!stats) {
      return {
        userId,
        totalPoints: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
        level: 1,
        consistencyMultiplier: 1.0,
        lastWorkoutPoints: null,
        updatedAt: new Date(),
        rank: null,
        nextLevelPoints: 100,
      }
    }
    
    return {
      ...stats,
      rank: rankData?.[0]?.rank || null,
      nextLevelPoints: getPointsForNextLevel(stats.level || 1),
    }
  }),
  
  // Get leaderboard
  getLeaderboard: protectedProcedure
    .input(z.object({
      period: z.enum(['all_time', 'monthly', 'weekly']).default('all_time'),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ ctx, input }) => {
      let pointsColumn: keyof typeof userStats.$inferSelect = 'totalPoints'
      
      if (input.period === 'monthly') {
        pointsColumn = 'monthlyPoints'
      } else if (input.period === 'weekly') {
        pointsColumn = 'weeklyPoints'
      }
      
      const leaderboard = await db.query.userStats.findMany({
        orderBy: desc(userStats[pointsColumn]),
        limit: input.limit,
        with: {
          user: true,
        },
      })
      
      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        username: entry.user?.username || 'Unknown',
        fullName: entry.user?.fullName || 'Unknown User',
        avatarUrl: entry.user?.avatarUrl,
        points: entry[pointsColumn] || 0,
        level: entry.level || 1,
      }))
    }),
  
  // Get active challenges
  getActiveChallenges: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id
    const now = new Date()
    
    let activeChallenges: any[] = []
    try {
      activeChallenges = await db.query.challenges.findMany({
        where: and(
          eq(challenges.status, 'active'),
          lte(challenges.startDate, now),
          gte(challenges.endDate, now)
        ),
        with: {
          participants: {
            where: eq(challengeParticipants.userId, userId),
          },
        },
      })
    } catch (error) {
      console.warn('Failed to fetch active challenges, table may not exist yet:', error)
      return []
    }
    
    // Get participant counts
    const challengeIds = activeChallenges.map(c => c.id)
    let participantCounts: Array<{ challengeId: string; count: number }> = []
    
    if (challengeIds.length > 0) {
      try {
        participantCounts = await db
          .select({
            challengeId: challengeParticipants.challengeId,
            count: sql<number>`count(*)::int`,
          })
          .from(challengeParticipants)
          .where(sql`${challengeParticipants.challengeId} = ANY(ARRAY[${sql.join(challengeIds, sql`, `)}]::uuid[])`)
          .groupBy(challengeParticipants.challengeId)
      } catch (error) {
        console.warn('Failed to get participant counts:', error)
      }
    }
    
    const countsMap = Object.fromEntries(
      participantCounts.map(pc => [pc.challengeId, pc.count])
    )
    
    return activeChallenges.map(challenge => ({
      ...challenge,
      isJoined: challenge.participants.length > 0,
      participantCount: countsMap[challenge.id] || 0,
      userProgress: challenge.participants[0]?.progress || null,
    }))
  }),
  
  // Join a challenge
  joinChallenge: protectedProcedure
    .input(z.object({
      challengeId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id
      
      // Check if challenge exists and is active
      const challenge = await db.query.challenges.findFirst({
        where: and(
          eq(challenges.id, input.challengeId),
          eq(challenges.status, 'active')
        ),
      })
      
      if (!challenge) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Challenge not found or not active',
        })
      }
      
      // Check if already joined
      const existing = await db.query.challengeParticipants.findFirst({
        where: and(
          eq(challengeParticipants.challengeId, input.challengeId),
          eq(challengeParticipants.userId, userId)
        ),
      })
      
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Already joined this challenge',
        })
      }
      
      // Join the challenge
      await db.insert(challengeParticipants).values({
        challengeId: input.challengeId,
        userId,
        progress: {},
      })
      
      return { success: true }
    }),
  
  // Update challenge progress
  updateChallengeProgress: protectedProcedure
    .input(z.object({
      challengeId: z.string().uuid(),
      workoutId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id
      
      // Get challenge and participant data
      const [challenge, participant, workout] = await Promise.all([
        db.query.challenges.findFirst({
          where: eq(challenges.id, input.challengeId),
        }),
        db.query.challengeParticipants.findFirst({
          where: and(
            eq(challengeParticipants.challengeId, input.challengeId),
            eq(challengeParticipants.userId, userId)
          ),
        }),
        db.query.workouts.findFirst({
          where: and(
            eq(workouts.id, input.workoutId),
            eq(workouts.userId, userId)
          ),
        }),
      ])
      
      if (!challenge || !participant || !workout) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Challenge, participant, or workout not found',
        })
      }
      
      // Update progress based on challenge type
      let updatedProgress = { ...(participant.progress as any) }
      let completed = false
      let pointsEarned = 0
      
      switch (challenge.challengeType) {
        case 'bodyweight_lift': {
          const requirements = challenge.requirements as any
          const exerciseName = requirements.exercise
          const targetReps = requirements.reps
          const multiplier = requirements.multiplier || 1.0
          
          // Check if workout contains the target exercise
          const exercises = workout.exercises as any[]
          const targetExercise = exercises?.find(e => 
            e.name.toLowerCase() === exerciseName.toLowerCase()
          )
          
          if (targetExercise) {
            // Get user's weight
            const { data: userData } = await ctx.supabase
              .from('users')
              .select('starting_weight')
              .eq('id', userId)
              .single()
            
            const userWeight = userData?.starting_weight || 70 // Default 70kg
            const targetWeight = userWeight * multiplier
            
            // Check if any set meets the requirements
            const qualifyingSet = targetExercise.sets?.find((set: any) => 
              set.weight >= targetWeight && set.reps >= targetReps
            )
            
            if (qualifyingSet && !updatedProgress.completed) {
              updatedProgress.completed = true
              updatedProgress.completedAt = new Date().toISOString()
              updatedProgress.qualifyingSet = qualifyingSet
              completed = true
              pointsEarned = challenge.pointsReward
            }
          }
          break
        }
        
        case 'consistency': {
          const requirements = challenge.requirements as any
          const targetCount = requirements.workout_count
          
          updatedProgress.workoutCount = (updatedProgress.workoutCount || 0) + 1
          
          if (updatedProgress.workoutCount >= targetCount && !updatedProgress.completed) {
            updatedProgress.completed = true
            updatedProgress.completedAt = new Date().toISOString()
            completed = true
            pointsEarned = challenge.pointsReward
          }
          break
        }
        
        case 'volume': {
          const requirements = challenge.requirements as any
          const targetVolume = requirements.total_volume
          
          const workoutVolume = workout.totalVolume ? parseFloat(workout.totalVolume.toString()) : 0
          updatedProgress.totalVolume = (updatedProgress.totalVolume || 0) + workoutVolume
          
          if (updatedProgress.totalVolume >= targetVolume && !updatedProgress.completed) {
            updatedProgress.completed = true
            updatedProgress.completedAt = new Date().toISOString()
            completed = true
            pointsEarned = challenge.pointsReward
          }
          break
        }
      }
      
      // Update participant record
      await db
        .update(challengeParticipants)
        .set({
          progress: updatedProgress,
          completedAt: completed ? new Date() : null,
          pointsEarned,
          updatedAt: new Date(),
        })
        .where(and(
          eq(challengeParticipants.challengeId, input.challengeId),
          eq(challengeParticipants.userId, userId)
        ))
      
      // Award points if completed
      if (completed && pointsEarned > 0) {
        await PointsService.awardPoints(
          userId,
          pointsEarned,
          `Completed challenge: ${challenge.name}`,
          {
            challengeId: challenge.id,
            challengeName: challenge.name,
          }
        )
      }
      
      return {
        progress: updatedProgress,
        completed,
        pointsEarned,
      }
    }),
  
  // Get current seasonal competition
  getCurrentSeasonalCompetition: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id
    const now = new Date()
    
    const competition = await db.query.seasonalCompetitions.findFirst({
      where: and(
        eq(seasonalCompetitions.status, 'active'),
        lte(seasonalCompetitions.startDate, now.toISOString().split('T')[0]),
        gte(seasonalCompetitions.endDate, now.toISOString().split('T')[0])
      ),
      with: {
        participants: {
          orderBy: desc(seasonalCompetitionParticipants.pointsEarned),
          limit: 10,
          with: {
            user: true,
          },
        },
      },
    })
    
    if (!competition) return null
    
    // Get user's participation
    const userParticipation = await db.query.seasonalCompetitionParticipants.findFirst({
      where: and(
        eq(seasonalCompetitionParticipants.competitionId, competition.id),
        eq(seasonalCompetitionParticipants.userId, userId)
      ),
    })
    
    return {
      ...competition,
      userParticipation,
      leaderboard: competition.participants.map((p, index) => ({
        rank: index + 1,
        userId: p.userId,
        username: p.user?.username || 'Unknown',
        fullName: p.user?.fullName || 'Unknown User',
        avatarUrl: p.user?.avatarUrl,
        points: p.pointsEarned,
        stats: p.stats,
      })),
    }
  }),
  
  // Join seasonal competition
  joinSeasonalCompetition: protectedProcedure
    .input(z.object({
      competitionId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id
      
      // Check if already joined
      const existing = await db.query.seasonalCompetitionParticipants.findFirst({
        where: and(
          eq(seasonalCompetitionParticipants.competitionId, input.competitionId),
          eq(seasonalCompetitionParticipants.userId, userId)
        ),
      })
      
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Already joined this competition',
        })
      }
      
      // Join the competition
      await db.insert(seasonalCompetitionParticipants).values({
        competitionId: input.competitionId,
        userId,
        stats: {},
      })
      
      return { success: true }
    }),
  
  // Calculate comeback bonus
  calculateComebackBonus: protectedProcedure
    .input(z.object({
      competitionType: z.enum(['challenge', 'seasonal', 'buddy']),
      competitionId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id
      
      // Use the database function to calculate comeback bonus
      const { data: result } = await ctx.supabase
        .rpc('calculate_comeback_bonus', {
          p_user_id: userId,
          p_competition_type: input.competitionType,
          p_competition_id: input.competitionId,
        })
      
      return {
        multiplier: result || 1.0,
        active: result > 1.0,
      }
    }),
  
})