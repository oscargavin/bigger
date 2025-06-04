import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const badgesRouter = createTRPCRouter({
  // Get all badge definitions
  getAllBadges: protectedProcedure.query(async ({ ctx }) => {
    const { data: badges, error } = await ctx.supabase
      .from('badge_definitions')
      .select('*')
      .order('category', { ascending: true })
      .order('rarity', { ascending: true })

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

    return badges
  }),

  // Get user's earned badges
  getUserBadges: protectedProcedure
    .input(z.object({
      userId: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.session.user.id

      const { data: userBadges, error } = await ctx.supabase
        .from('user_badges')
        .select(`
          *,
          badge:badge_definitions(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

      return userBadges
    }),

  // Get badge progress for a user
  getBadgeProgress: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Get all badges and user's earned badges
    const [allBadgesResult, userBadgesResult, userStatsResult] = await Promise.all([
      ctx.supabase.from('badge_definitions').select('*'),
      ctx.supabase.from('user_badges').select('badge_id, earned_at').eq('user_id', userId),
      getUserStats(ctx, userId),
    ])

    if (allBadgesResult.error || userBadgesResult.error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
    }

    const earnedBadgeIds = new Set(userBadgesResult.data?.map(ub => ub.badge_id))
    const userStats = userStatsResult

    // Calculate progress for each badge
    const badgeProgress = allBadgesResult.data?.map(badge => {
      const earned = earnedBadgeIds.has(badge.id)
      let progress = 0

      if (!earned && badge.criteria) {
        // Calculate progress based on criteria type
        switch (badge.criteria.type) {
          case 'streak':
            progress = Math.min(100, (userStats.longestStreak / badge.criteria.days) * 100)
            break
          case 'total_workouts':
            progress = Math.min(100, (userStats.totalWorkouts / badge.criteria.count) * 100)
            break
          case 'strength_increase':
            // This would need actual strength tracking data
            progress = 0
            break
          case 'weight_loss':
          case 'weight_gain':
            if (userStats.startingWeight && userStats.currentWeight) {
              const percentChange = ((userStats.currentWeight - userStats.startingWeight) / userStats.startingWeight) * 100
              const targetChange = badge.criteria.percentage
              if (badge.criteria.type === 'weight_loss') {
                progress = percentChange < 0 ? Math.min(100, (Math.abs(percentChange) / targetChange) * 100) : 0
              } else {
                progress = percentChange > 0 ? Math.min(100, (percentChange / targetChange) * 100) : 0
              }
            }
            break
        }
      }

      return {
        ...badge,
        earned,
        progress: earned ? 100 : progress,
        earnedAt: earned ? userBadgesResult.data?.find(ub => ub.badge_id === badge.id)?.earned_at : null,
      }
    })

    return badgeProgress || []
  }),

  // Check and award badges for a user
  checkAndAwardBadges: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Call the database function to check and award badges
    const { data: newBadges, error } = await ctx.supabase
      .rpc('check_and_award_badges', { p_user_id: userId })

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

    // If new badges were awarded, create notifications
    if (newBadges && newBadges.length > 0) {
      for (const badge of newBadges) {
        await ctx.supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'badge_earned',
            title: 'New Achievement Unlocked!',
            message: `You've earned the "${badge.badge_name}" badge!`,
            data: { badge_id: badge.new_badge_id },
          })
      }
    }

    return newBadges
  }),

  // Get recent badges across all users (for feed)
  getRecentBadges: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const { data: recentBadges, error } = await ctx.supabase
        .from('user_badges')
        .select(`
          *,
          badge:badge_definitions(*),
          user:users(id, username, full_name)
        `)
        .order('earned_at', { ascending: false })
        .limit(input.limit)

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

      return recentBadges
    }),

  // Get badge leaderboard
  getBadgeLeaderboard: protectedProcedure.query(async ({ ctx }) => {
    const { data: leaderboard, error } = await ctx.supabase
      .from('user_badges')
      .select(`
        user_id,
        user:users(id, username, full_name)
      `)
      .order('user_id')
      .limit(100)

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

    // Group by user and count badges
    const userBadgeCounts = leaderboard?.reduce((acc, curr) => {
      if (!acc[curr.user_id]) {
        acc[curr.user_id] = {
          user: curr.user,
          count: 0,
        }
      }
      acc[curr.user_id].count++
      return acc
    }, {} as Record<string, any>)

    return Object.values(userBadgeCounts || {}).sort((a, b) => b.count - a.count)
  }),
})

// Helper function to get user stats for badge progress calculation
async function getUserStats(ctx: any, userId: string) {
  const { data: user } = await ctx.supabase
    .from('users')
    .select('starting_weight')
    .eq('id', userId)
    .single()

  const { data: latestSnapshot } = await ctx.supabase
    .from('progress_snapshots')
    .select('weight')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  const { data: stats } = await ctx.supabase
    .from('streaks')
    .select('current_streak, longest_streak')
    .eq('user_id', userId)
    .single()

  const { count: totalWorkouts } = await ctx.supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: totalPhotos } = await ctx.supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return {
    startingWeight: user?.starting_weight,
    currentWeight: latestSnapshot?.weight || user?.starting_weight,
    currentStreak: stats?.current_streak || 0,
    longestStreak: stats?.longest_streak || 0,
    totalWorkouts: totalWorkouts || 0,
    totalPhotos: totalPhotos || 0,
  }
}