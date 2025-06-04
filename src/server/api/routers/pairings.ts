import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const pairingsRouter = createTRPCRouter({
  // Get current pairing status
  getCurrentPairing: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const { data: pairing, error } = await ctx.supabase
      .from('pairings')
      .select(`
        *,
        user1:users!pairings_user1_id_fkey(*),
        user2:users!pairings_user2_id_fkey(*)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'active')
      .single()

    if (error || !pairing) return null

    // Return the buddy's info
    const buddy = pairing.user1_id === userId ? pairing.user2 : pairing.user1
    const buddyId = buddy?.id || ''

    // Get partner's streak data
    let partnerStats = null
    if (buddyId) {
      const { data: streak } = await ctx.supabase
        .from('streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', buddyId)
        .single()
      
      partnerStats = {
        currentStreak: streak?.current_streak || 0,
        longestStreak: streak?.longest_streak || 0,
      }
    }

    return {
      id: pairing.id,
      buddy: {
        id: buddyId,
        username: buddy?.username || '',
        fullName: buddy?.full_name || '',
        avatarUrl: buddy?.avatar_url || null,
      },
      partner: buddy,
      partnerStats,
      startedAt: pairing.started_at,
    }
  }),

  // Get pending pairing requests
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const { data: requests, error } = await ctx.supabase
      .from('pairings')
      .select(`
        *,
        user1:users!pairings_user1_id_fkey(*)
      `)
      .eq('user2_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

    return (requests || []).map(req => ({
      id: req.id,
      from: {
        id: req.user1?.id || '',
        username: req.user1?.username || '',
        fullName: req.user1?.full_name || '',
        avatarUrl: req.user1?.avatar_url || null,
      },
      createdAt: req.created_at,
    }))
  }),

  // Get sent pairing requests
  getSentRequests: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const { data: requests, error } = await ctx.supabase
      .from('pairings')
      .select(`
        *,
        user2:users!pairings_user2_id_fkey(*)
      `)
      .eq('user1_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

    return (requests || []).map(req => ({
      id: req.id,
      to: {
        id: req.user2?.id || '',
        username: req.user2?.username || '',
        fullName: req.user2?.full_name || '',
        avatarUrl: req.user2?.avatar_url || null,
      },
      createdAt: req.created_at,
    }))
  }),

  // Search for users to pair with
  searchUsers: protectedProcedure
    .input(z.object({
      query: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      
      // Trim and prepare search query
      const searchQuery = input.query.trim()

      // Build query
      let query = ctx.supabase
        .from('users')
        .select('*')
        .neq('id', userId)
        .limit(10)
      
      // If search query provided, filter by it
      if (searchQuery.length > 0) {
        query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      }
      
      // Execute query
      const { data: users, error } = await query

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

      // If no users found, return empty array early
      if (!users || users.length === 0) {
        return []
      }

      // Get all existing pairings for the current user in one query
      const { data: userPairings } = await ctx.supabase
        .from('pairings')
        .select('user1_id, user2_id, status')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .in('status', ['active', 'pending'])

      // Create a set of user IDs that are already paired with the current user
      const pairedUserIds = new Set<string>()
      if (userPairings) {
        for (const pairing of userPairings) {
          if (pairing.user1_id === userId) {
            pairedUserIds.add(pairing.user2_id)
          } else {
            pairedUserIds.add(pairing.user1_id)
          }
        }
      }

      // Filter out users who are already paired
      const availableUsers = users.filter(user => !pairedUserIds.has(user.id))

      return availableUsers.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
      }))
    }),

  // Send pairing request
  sendRequest: protectedProcedure
    .input(z.object({
      toUserId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const fromUserId = ctx.session.user.id

      // Check if user already has an active pairing
      const { data: existingActive } = await ctx.supabase
        .from('pairings')
        .select('id')
        .or(`user1_id.eq.${fromUserId},user2_id.eq.${fromUserId}`)
        .eq('status', 'active')
        .single()

      if (existingActive) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You already have an active gym buddy',
        })
      }

      // Check if request already exists
      const { data: existingRequest } = await ctx.supabase
        .from('pairings')
        .select('id')
        .or(
          `and(user1_id.eq.${fromUserId},user2_id.eq.${input.toUserId}),` +
          `and(user1_id.eq.${input.toUserId},user2_id.eq.${fromUserId})`
        )
        .in('status', ['pending', 'active'])
        .single()

      if (existingRequest) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Request already exists',
        })
      }

      // Get requesting user's info
      const { data: fromUser } = await ctx.supabase
        .from('users')
        .select('*')
        .eq('id', fromUserId)
        .single()

      // Create pairing request
      const { data: pairing, error } = await ctx.supabase
        .from('pairings')
        .insert({
          user1_id: fromUserId,
          user2_id: input.toUserId,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

      // Send notification
      await ctx.supabase
        .from('notifications')
        .insert({
          user_id: input.toUserId,
          type: 'pairing_request',
          title: 'New Gym Buddy Request!',
          message: `${fromUser?.full_name || fromUser?.username} wants to be your gym buddy`,
          data: { pairing_id: pairing.id },
        })

      return pairing
    }),

  // Accept pairing request
  acceptRequest: protectedProcedure
    .input(z.object({
      requestId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Get the request
      const { data: request, error: requestError } = await ctx.supabase
        .from('pairings')
        .select('*')
        .eq('id', input.requestId)
        .eq('user2_id', userId)
        .eq('status', 'pending')
        .single()

      if (requestError || !request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      // Update status to active
      const { data: updated, error: updateError } = await ctx.supabase
        .from('pairings')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.requestId)
        .select()
        .single()

      if (updateError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: updateError.message })

      // Get accepting user's info
      const { data: acceptingUser } = await ctx.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      // Send notification to requester
      await ctx.supabase
        .from('notifications')
        .insert({
          user_id: request.user1_id,
          type: 'pairing_accepted',
          title: 'Gym Buddy Request Accepted!',
          message: `${acceptingUser?.full_name || acceptingUser?.username} is now your gym buddy`,
          data: { pairing_id: updated.id },
        })

      return updated
    }),

  // Reject pairing request
  rejectRequest: protectedProcedure
    .input(z.object({
      requestId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Delete the request
      const { error } = await ctx.supabase
        .from('pairings')
        .delete()
        .eq('id', input.requestId)
        .eq('user2_id', userId)
        .eq('status', 'pending')

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      return { success: true }
    }),

  // Cancel sent request
  cancelRequest: protectedProcedure
    .input(z.object({
      requestId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Delete the request
      const { error } = await ctx.supabase
        .from('pairings')
        .delete()
        .eq('id', input.requestId)
        .eq('user1_id', userId)
        .eq('status', 'pending')

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })
      }

      return { success: true }
    }),

  // Get head-to-head stats
  getHeadToHeadStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Get current pairing
    const { data: pairing } = await ctx.supabase
      .from('pairings')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'active')
      .single()

    if (!pairing) return null

    const partnerId = pairing.user1_id === userId ? pairing.user2_id : pairing.user1_id

    // Get user stats
    const getUserStats = async (uid: string) => {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      // Get user info
      const { data: user } = await ctx.supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single()

      // Get weekly workouts
      const { data: weekWorkouts } = await ctx.supabase
        .from('workouts')
        .select('id')
        .eq('user_id', uid)
        .gte('completed_at', startOfWeek.toISOString())

      // Get monthly workouts
      const { data: monthWorkouts } = await ctx.supabase
        .from('workouts')
        .select('id')
        .eq('user_id', uid)
        .gte('completed_at', startOfMonth.toISOString())

      // Get total workouts
      const { count: totalWorkouts } = await ctx.supabase
        .from('workouts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)

      // Get streak
      const { data: streak } = await ctx.supabase
        .from('streaks')
        .select('*')
        .eq('user_id', uid)
        .single()

      // Get last workout
      const { data: lastWorkout } = await ctx.supabase
        .from('workouts')
        .select('completed_at')
        .eq('user_id', uid)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      return {
        id: uid,
        username: user?.username || '',
        fullName: user?.full_name || '',
        currentStreak: streak?.current_streak || 0,
        longestStreak: streak?.longest_streak || 0,
        weeklyWorkouts: weekWorkouts?.length || 0,
        monthlyWorkouts: monthWorkouts?.length || 0,
        totalWorkouts: totalWorkouts || 0,
        lastWorkoutDate: lastWorkout?.completed_at || null,
      }
    }

    const [userStats, partnerStats] = await Promise.all([
      getUserStats(userId),
      getUserStats(partnerId),
    ])

    return {
      user: userStats,
      partner: partnerStats,
    }
  }),

  // End pairing
  endPairing: protectedProcedure
    .input(z.object({
      pairingId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Get pairing first to find the other user
      const { data: pairing } = await ctx.supabase
        .from('pairings')
        .select('*')
        .eq('id', input.pairingId)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .single()

      if (!pairing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Active pairing not found',
        })
      }

      // Update pairing status
      const { error } = await ctx.supabase
        .from('pairings')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.pairingId)

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

      // Get the other user
      const otherUserId = pairing.user1_id === userId ? pairing.user2_id : pairing.user1_id
      const { data: endingUser } = await ctx.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      // Notify the other user
      await ctx.supabase
        .from('notifications')
        .insert({
          user_id: otherUserId,
          type: 'pairing_ended',
          title: 'Gym Buddy Partnership Ended',
          message: `${endingUser?.full_name || endingUser?.username} has ended the partnership`,
          data: { pairing_id: pairing.id },
        })

      return { success: true }
    }),
})