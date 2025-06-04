import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { PointsServiceSupabase } from '@/server/services/points-service-supabase'

export const workoutsRouter = createTRPCRouter({
  // Create a new workout
  create: protectedProcedure
    .input(z.object({
      durationMinutes: z.number().min(1).optional(),
      notes: z.string().optional(),
      photoUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Get current pairing
      const { data: pairing } = await ctx.supabase
        .from('pairings')
        .select('id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .single()

      // Create workout
      const { data: workout, error } = await ctx.supabase
        .from('workouts')
        .insert({
          user_id: userId,
          pairing_id: pairing?.id,
          duration_minutes: input.durationMinutes,
          notes: input.notes,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

      // If photo was uploaded, create photo record
      if (input.photoUrl && workout) {
        await ctx.supabase
          .from('photos')
          .insert({
            workout_id: workout.id,
            user_id: userId,
            photo_url: input.photoUrl,
          })
      }

      // Update streak
      await updateUserStreak(ctx, userId)

      // Calculate and award points
      const photoCount = input.photoUrl ? 1 : 0
      const pointsCalculation = await PointsServiceSupabase.calculateWorkoutPoints(
        ctx.supabase,
        userId,
        workout.id,
        {
          pairingId: pairing?.id,
          exercises: [], // No exercises in simple create
          photoCount,
        }
      )
      
      await PointsServiceSupabase.awardPoints(
        ctx.supabase,
        userId,
        pointsCalculation.totalPoints,
        'Workout completed',
        {
          workoutId: workout.id,
          breakdown: pointsCalculation.breakdown,
        }
      )

      // Check and award badges - commented out until badge checking is implemented
      // await ctx.supabase.rpc('check_and_award_badges', { p_user_id: userId })

      // Notify buddy if paired
      if (pairing) {
        const { data: user } = await ctx.supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        const { data: buddy } = await ctx.supabase
          .from('pairings')
          .select('user1_id, user2_id')
          .eq('id', pairing.id)
          .single()

        const buddyId = buddy ? (buddy.user1_id === userId ? buddy.user2_id : buddy.user1_id) : null

        if (buddyId) {
          await ctx.supabase
            .from('notifications')
            .insert({
              user_id: buddyId,
              type: 'buddy_workout',
              title: 'Your buddy worked out!',
              message: `${user?.full_name || user?.username} just completed a workout`,
              data: { workout_id: workout.id },
            })
        }
      }

      return workout
    }),

  // Get user's workouts
  getMyWorkouts: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const { data: workouts, error } = await ctx.supabase
        .from('workouts')
        .select(`
          *,
          photos(*)
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1)

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

      return workouts
    }),

  // Get buddy's workouts (if paired)
  getBuddyWorkouts: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Get current pairing
      const { data: pairing } = await ctx.supabase
        .from('pairings')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .single()

      if (!pairing) return []

      const buddyId = pairing.user1_id === userId ? pairing.user2_id : pairing.user1_id

      const { data: workouts, error } = await ctx.supabase
        .from('workouts')
        .select(`
          *,
          photos(*),
          user:users(*)
        `)
        .eq('user_id', buddyId)
        .order('completed_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1)

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

      return workouts
    }),

  // Get workout stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Get this week's workouts
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const { data: weekWorkouts } = await ctx.supabase
      .from('workouts')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', startOfWeek.toISOString())

    // Get this month's workouts
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: monthWorkouts } = await ctx.supabase
      .from('workouts')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', startOfMonth.toISOString())

    // Get total workouts
    const { count: totalWorkouts } = await ctx.supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get current streak
    const { data: streak } = await ctx.supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get last workout
    const { data: lastWorkout } = await ctx.supabase
      .from('workouts')
      .select('completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    // Get recent workouts
    const { data: recentWorkouts } = await ctx.supabase
      .from('workouts')
      .select('id, completed_at, notes, photos(photo_url)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(5)

    // Get all workout dates for calendar (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const { data: workoutDates } = await ctx.supabase
      .from('workouts')
      .select('completed_at')
      .eq('user_id', userId)
      .gte('completed_at', ninetyDaysAgo.toISOString())
      .order('completed_at', { ascending: false })

    return {
      thisWeek: weekWorkouts?.length || 0,
      weeklyWorkouts: weekWorkouts?.length || 0,
      monthlyWorkouts: monthWorkouts?.length || 0,
      totalWorkouts: totalWorkouts || 0,
      currentStreak: streak?.current_streak || 0,
      longestStreak: streak?.longest_streak || 0,
      lastWorkoutDate: lastWorkout?.completed_at || null,
      recentWorkouts: recentWorkouts || [],
      workoutDates: workoutDates?.map(w => w.completed_at) || [],
    }
  }),

  // Upload photo
  uploadPhoto: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileType: z.string(),
      fileSize: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const timestamp = Date.now()
      const ext = input.fileName.split('.').pop()
      const filePath = `${userId}/${timestamp}.${ext}`

      // Generate signed upload URL
      const { data, error } = await ctx.supabase.storage
        .from('workout-photos')
        .createSignedUploadUrl(filePath)

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

      return {
        uploadUrl: data.signedUrl,
        path: filePath,
        publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/workout-photos/${filePath}`,
      }
    }),

  // Update workout
  update: protectedProcedure
    .input(z.object({
      workoutId: z.string().uuid(),
      durationMinutes: z.number().min(1).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // First verify the workout belongs to the user
      const { data: existingWorkout } = await ctx.supabase
        .from('workouts')
        .select('*')
        .eq('id', input.workoutId)
        .eq('user_id', userId)
        .single()

      if (!existingWorkout) {
        throw new TRPCError({ 
          code: 'NOT_FOUND', 
          message: 'Workout not found or you do not have permission to edit it' 
        })
      }

      // Update the workout
      const { data: updatedWorkout, error } = await ctx.supabase
        .from('workouts')
        .update({
          duration_minutes: input.durationMinutes,
          notes: input.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.workoutId)
        .select()
        .single()

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

      return updatedWorkout
    }),

  // Delete workout
  delete: protectedProcedure
    .input(z.object({
      workoutId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // First verify the workout belongs to the user
      const { data: existingWorkout } = await ctx.supabase
        .from('workouts')
        .select('*')
        .eq('id', input.workoutId)
        .eq('user_id', userId)
        .single()

      if (!existingWorkout) {
        throw new TRPCError({ 
          code: 'NOT_FOUND', 
          message: 'Workout not found or you do not have permission to delete it' 
        })
      }

      // Delete the workout (photos will be cascade deleted)
      const { error } = await ctx.supabase
        .from('workouts')
        .delete()
        .eq('id', input.workoutId)

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

      // Recalculate streak after deletion
      await recalculateUserStreak(ctx, userId)

      return { success: true }
    }),

  // Update workout with exercise data
  updateWorkout: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      durationMinutes: z.number().min(1).max(600).optional(),
      notes: z.string().max(500).optional(),
      exercises: z.array(z.object({
        name: z.string(),
        sets: z.array(z.object({
          reps: z.number(),
          weight: z.number(),
          unit: z.enum(['kg', 'lbs']),
        })),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Calculate total volume if exercises provided
      let totalVolume = 0;
      if (input.exercises) {
        input.exercises.forEach(exercise => {
          exercise.sets.forEach(set => {
            // Convert to kg if needed for consistent volume calculation
            const weightInKg = set.unit === 'lbs' ? set.weight * 0.453592 : set.weight;
            totalVolume += weightInKg * set.reps;
          });
        });
      }

      // Update the workout
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (input.durationMinutes !== undefined) updateData.duration_minutes = input.durationMinutes;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.exercises !== undefined) {
        updateData.exercises = input.exercises;
        updateData.total_volume = totalVolume;
      }

      const { data, error } = await ctx.supabase
        .from('workouts')
        .update(updateData)
        .eq('id', input.id)
        .eq('user_id', userId) // Ensure user owns the workout
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workout not found',
        })
      }

      // If exercises were added, calculate and award points for PRs
      if (input.exercises && input.exercises.length > 0) {
        // Get existing workout data to check if this is the first time adding exercises
        const { data: existingWorkout } = await ctx.supabase
          .from('workouts')
          .select('exercises, pairing_id, photos(id)')
          .eq('id', input.id)
          .single()
        
        const existingExercises = existingWorkout?.exercises as any[] || []
        
        // Only award points if this is the first time adding exercises
        if (existingExercises.length === 0) {
          const pointsCalculation = await PointsServiceSupabase.calculateWorkoutPoints(
            ctx.supabase,
            userId,
            input.id,
            {
              pairingId: existingWorkout?.pairing_id,
              exercises: input.exercises,
              photoCount: existingWorkout?.photos?.length || 0,
            }
          )
          
          // Award only the progress bonus for PRs
          if (pointsCalculation.progressBonus > 0) {
            await PointsServiceSupabase.awardPoints(
              ctx.supabase,
              userId,
              pointsCalculation.progressBonus,
              'Personal records achieved',
              {
                workoutId: input.id,
                prCount: pointsCalculation.progressBonus / 25, // 25 points per PR
              }
            )
          }
        }
      }

      return data
    }),
})

// Helper function to update user streak
async function updateUserStreak(ctx: { supabase: any }, userId: string) {
  // Get user's last workout before today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: previousWorkout } = await ctx.supabase
    .from('workouts')
    .select('completed_at')
    .eq('user_id', userId)
    .lt('completed_at', today.toISOString())
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  // Get current streak
  const { data: currentStreak } = await ctx.supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  let newStreak = 1
  if (previousWorkout) {
    const lastWorkoutDate = new Date(previousWorkout.completed_at)
    const daysDiff = Math.floor((today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 1) {
      // Consecutive day
      newStreak = (currentStreak?.current_streak || 0) + 1
    }
  }

  const longestStreak = Math.max(newStreak, currentStreak?.longest_streak || 0)

  // Update streak
  await ctx.supabase
    .from('streaks')
    .upsert({
      user_id: userId,
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_workout_date: today.toISOString().split('T')[0],
    })
}

// Helper function to recalculate streak after deletion
async function recalculateUserStreak(ctx: { supabase: any }, userId: string) {
  // Get all workouts ordered by date
  const { data: workouts } = await ctx.supabase
    .from('workouts')
    .select('completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })

  if (!workouts || workouts.length === 0) {
    // No workouts, reset streak
    await ctx.supabase
      .from('streaks')
      .upsert({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_workout_date: null,
      })
    return
  }

  // Calculate current streak
  let currentStreak = 0
  let checkDate = new Date()
  checkDate.setHours(0, 0, 0, 0)

  for (const workout of workouts) {
    const workoutDate = new Date(workout.completed_at)
    workoutDate.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor((checkDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 0) {
      // Today's workout
      currentStreak = 1
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (daysDiff === 1) {
      // Yesterday's workout (consecutive)
      currentStreak++
      checkDate = new Date(workoutDate)
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      // Streak broken
      break
    }
  }

  // Calculate longest streak
  let longestStreak = currentStreak
  let tempStreak = 0
  let prevDate: Date | null = null

  for (const workout of workouts) {
    const workoutDate = new Date(workout.completed_at)
    workoutDate.setHours(0, 0, 0, 0)

    if (!prevDate) {
      tempStreak = 1
    } else {
      const daysDiff = Math.floor((prevDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    prevDate = workoutDate
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  // Update streak
  const lastWorkoutDate = new Date(workouts[0].completed_at)
  await ctx.supabase
    .from('streaks')
    .upsert({
      user_id: userId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_workout_date: lastWorkoutDate.toISOString().split('T')[0],
    })
}

