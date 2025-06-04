import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

const measurementsSchema = z.object({
  chest: z.number().optional(),
  waist: z.number().optional(),
  hips: z.number().optional(),
  thighs: z.number().optional(),
  arms: z.number().optional(),
  neck: z.number().optional(),
});

const exerciseDataSchema = z.object({
  name: z.string(),
  sets: z.array(z.object({
    reps: z.number(),
    weight: z.number(),
    unit: z.enum(['kg', 'lbs']),
  })),
});

export const progressRouter = createTRPCRouter({
  // Get user's baseline data
  getBaseline: protectedProcedure
    .query(async ({ ctx }) => {
      const { data: user, error } = await ctx.supabase
        .from('users')
        .select('starting_weight, height, baseline_measurements, baseline_date')
        .eq('id', ctx.session.user.id)
        .single();

      if (error || !user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      return {
        startingWeight: user.starting_weight,
        height: user.height,
        baselineMeasurements: user.baseline_measurements,
        baselineDate: user.baseline_date,
      };
    }),

  // Update baseline data
  updateBaseline: protectedProcedure
    .input(z.object({
      startingWeight: z.number().min(0).max(999),
      height: z.number().min(0).max(300),
      measurements: measurementsSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('users')
        .update({
          starting_weight: input.startingWeight.toString(),
          height: input.height.toString(),
          baseline_measurements: input.measurements,
          baseline_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.session.user.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return { success: true };
    }),

  // Create progress snapshot
  createSnapshot: protectedProcedure
    .input(z.object({
      date: z.date(),
      weight: z.number().min(0).max(999),
      bodyFatPercentage: z.number().min(0).max(100).optional(),
      measurements: measurementsSchema,
      photoUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: snapshot, error } = await ctx.supabase
        .from('progress_snapshots')
        .insert({
          user_id: ctx.session.user.id,
          date: input.date.toISOString().split('T')[0],
          weight: input.weight.toString(),
          body_fat_percentage: input.bodyFatPercentage?.toString(),
          measurements: input.measurements,
          photo_url: input.photoUrl,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return snapshot;
    }),

  // Get progress snapshots with calculations
  getProgressHistory: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      // Build query
      let query = ctx.supabase
        .from('progress_snapshots')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .order('date', { ascending: false })
        .limit(input.limit);
      
      if (input.startDate) {
        query = query.gte('date', input.startDate.toISOString().split('T')[0]);
      }
      
      if (input.endDate) {
        query = query.lte('date', input.endDate.toISOString().split('T')[0]);
      }

      const [snapshotsResult, userResult] = await Promise.all([
        query,
        ctx.supabase
          .from('users')
          .select('starting_weight, baseline_measurements, baseline_date')
          .eq('id', ctx.session.user.id)
          .single(),
      ]);

      if (userResult.error || !userResult.data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const snapshots = snapshotsResult.data || [];
      const user = userResult.data;

      // Calculate percentage changes from baseline
      const baselineWeight = parseFloat(user.starting_weight || '0');
      const enhancedSnapshots = snapshots.map(snapshot => {
        const currentWeight = parseFloat(snapshot.weight || '0');
        const weightChangePercentage = baselineWeight > 0 
          ? ((currentWeight - baselineWeight) / baselineWeight) * 100 
          : 0;

        return {
          ...snapshot,
          weightChangePercentage,
          weightChangeAbsolute: currentWeight - baselineWeight,
        };
      });

      return {
        snapshots: enhancedSnapshots,
        baseline: {
          weight: baselineWeight,
          measurements: user.baseline_measurements,
          date: user.baseline_date,
        },
      };
    }),

  // Track exercise progress
  updateExerciseRecord: protectedProcedure
    .input(z.object({
      exerciseName: z.string(),
      category: z.string().optional(),
      personalRecord: z.object({
        weight: z.number(),
        reps: z.number(),
        unit: z.enum(['kg', 'lbs']),
        date: z.date(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabase
        .from('exercise_library')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .eq('exercise_name', input.exerciseName)
        .single();

      if (existing) {
        // Update if new PR is better
        const currentPR = existing.personal_record as any;
        const currentTotal = (currentPR?.weight || 0) * (currentPR?.reps || 0);
        const newTotal = input.personalRecord.weight * input.personalRecord.reps;

        if (newTotal > currentTotal) {
          const { error } = await ctx.supabase
            .from('exercise_library')
            .update({
              personal_record: input.personalRecord,
              last_performed: input.personalRecord.date.toISOString().split('T')[0],
              category: input.category || existing.category,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: error.message,
            });
          }
        }
      } else {
        // Create new exercise record
        const { error } = await ctx.supabase
          .from('exercise_library')
          .insert({
            user_id: ctx.session.user.id,
            exercise_name: input.exerciseName,
            category: input.category,
            personal_record: input.personalRecord,
            last_performed: input.personalRecord.date.toISOString().split('T')[0],
          });

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          });
        }
      }

      return { success: true };
    }),

  // Get exercise library with PR progress
  getExerciseProgress: protectedProcedure
    .query(async ({ ctx }) => {
      const { data: exercises, error } = await ctx.supabase
        .from('exercise_library')
        .select('*')
        .eq('user_id', ctx.session.user.id)
        .order('last_performed', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return (exercises || []).map(exercise => {
        const pr = exercise.personal_record as any;
        return {
          ...exercise,
          personalRecord: exercise.personal_record,
          oneRepMax: pr ? calculateOneRepMax(pr.weight, pr.reps) : 0,
        };
      });
    }),

  // Compare progress with buddy
  compareProgress: protectedProcedure
    .input(z.object({
      pairingId: z.string().uuid(),
      metric: z.enum(['weight', 'strength', 'consistency']),
    }))
    .query(async ({ ctx, input }) => {
      // Get both users in the pairing
      const { data: pairing, error: pairingError } = await ctx.supabase
        .from('pairings')
        .select('*, user1:users!pairings_user1_id_fkey(*), user2:users!pairings_user2_id_fkey(*)')
        .eq('id', input.pairingId)
        .single();

      if (pairingError || !pairing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pairing not found' });
      }

      const otherUserId = pairing.user1_id === ctx.session.user.id 
        ? pairing.user2_id 
        : pairing.user1_id;

      // Get progress data for both users
      const [userSnapshotsResult, buddySnapshotsResult] = await Promise.all([
        ctx.supabase
          .from('progress_snapshots')
          .select('*')
          .eq('user_id', ctx.session.user.id)
          .order('date', { ascending: false })
          .limit(30),
        ctx.supabase
          .from('progress_snapshots')
          .select('*')
          .eq('user_id', otherUserId)
          .order('date', { ascending: false })
          .limit(30),
      ]);

      const userSnapshots = userSnapshotsResult.data || [];
      const buddySnapshots = buddySnapshotsResult.data || [];

      // Calculate relative progress for both users
      const calculateProgress = (snapshots: any[], baseline: any) => {
        if (!snapshots.length || !baseline) return 0;
        
        const latest = snapshots[0];
        const baselineWeight = parseFloat(baseline.starting_weight || '0');
        const currentWeight = parseFloat(latest.weight || '0');
        
        return baselineWeight > 0 
          ? ((currentWeight - baselineWeight) / baselineWeight) * 100 
          : 0;
      };

      const [userBaselineResult, buddyBaselineResult] = await Promise.all([
        ctx.supabase
          .from('users')
          .select('starting_weight')
          .eq('id', ctx.session.user.id)
          .single(),
        ctx.supabase
          .from('users')
          .select('starting_weight')
          .eq('id', otherUserId)
          .single(),
      ]);

      return {
        user: {
          progressPercentage: calculateProgress(userSnapshots, userBaselineResult.data),
          latestSnapshot: userSnapshots[0],
        },
        buddy: {
          progressPercentage: calculateProgress(buddySnapshots, buddyBaselineResult.data),
          latestSnapshot: buddySnapshots[0],
        },
      };
    }),
});

// Helper function to calculate estimated 1RM
function calculateOneRepMax(weight: number, reps: number): number {
  // Epley formula: 1RM = weight × (1 + reps/30)
  return Math.round(weight * (1 + reps / 30));
}