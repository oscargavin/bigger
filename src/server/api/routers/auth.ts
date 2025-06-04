import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/api/trpc';

export const authRouter = createTRPCRouter({
  /**
   * Get current session
   * @deprecated Use getUser instead for secure authentication
   */
  getSession: publicProcedure.query(({ ctx }) => {
    // Return a minimal session object based on the user
    return ctx.user ? { user: ctx.user } : null;
  }),

  /**
   * Get current user
   */
  getUser: protectedProcedure.query(async ({ ctx }) => {
    const { data: userProfile } = await ctx.supabase
      .from('users')
      .select('*')
      .eq('id', ctx.user.id)
      .single();

    return userProfile || ctx.user;
  }),

  /**
   * Sign up with email and password
   */
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        username: z.string().min(3).max(20),
        fullName: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if username is already taken
      const { data: existingUser } = await ctx.supabase
        .from('users')
        .select('id')
        .eq('username', input.username)
        .single();

      if (existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Username already taken',
        });
      }

      const { data, error } = await ctx.supabase.auth.signUp({
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      if (data.user) {
        // Create user profile in public.users table
        const { error: profileError } = await ctx.supabase
          .from('users')
          .insert({
            id: data.user.id,
            username: input.username,
            full_name: input.fullName,
          });

        if (profileError) {
          // If profile creation fails, we should ideally delete the auth user
          // But for now, just throw an error
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create user profile',
          });
        }

        // Create initial streak record
        await ctx.supabase
          .from('streaks')
          .insert({
            user_id: data.user.id,
            current_streak: 0,
            longest_streak: 0,
          });
      }

      return data;
    }),

  /**
   * Sign in with email and password
   */
  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message,
        });
      }

      return data;
    }),

  /**
   * Sign out
   */
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    const { error } = await ctx.supabase.auth.signOut();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      });
    }

    return { success: true };
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.auth.updateUser({
        data: input,
      });

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      return data;
    }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.auth.resetPasswordForEmail(
        input.email,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
        }
      );

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      return data;
    }),

  /**
   * Update password (when authenticated)
   */
  updatePassword: protectedProcedure
    .input(
      z.object({
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.auth.updateUser({
        password: input.newPassword,
      });

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      return data;
    }),

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: protectedProcedure
    .input(
      z.object({
        dailyReminder: z.object({
          enabled: z.boolean(),
          time: z.string(),
          days: z.array(z.string()),
        }).optional(),
        email: z.boolean().optional(),
        push: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get current preferences
      const { data: currentUser } = await ctx.supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      const currentPrefs = currentUser?.notification_preferences || {};
      const updatedPrefs = {
        ...currentPrefs,
        ...input,
      };

      // Update preferences
      const { data, error } = await ctx.supabase
        .from('users')
        .update({
          notification_preferences: updatedPrefs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return data;
    }),
});