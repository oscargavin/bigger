import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { goals, milestones, pairings } from "@/db/schema";
import { and, eq, or, desc, asc, gte, lte, not } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const goalsRouter = createTRPCRouter({
  getGoals: protectedProcedure
    .input(z.object({
      status: z.enum(['active', 'completed', 'paused', 'failed']).optional(),
      includePartnerGoals: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const { status, includePartnerGoals } = input;
      
      let whereConditions: any = eq(goals.userId, ctx.user.id);
      
      if (includePartnerGoals) {
        // Get user's pairing to find partner goals
        const pairing = await ctx.db.query.pairings.findFirst({
          where: and(
            or(
              eq(pairings.user1Id, ctx.user.id),
              eq(pairings.user2Id, ctx.user.id)
            ),
            eq(pairings.status, 'active')
          ),
        });

        if (pairing) {
          const partnerId = pairing.user1Id === ctx.user.id ? pairing.user2Id : pairing.user1Id;
          whereConditions = or(
            eq(goals.userId, ctx.user.id),
            and(
              eq(goals.userId, partnerId),
              not(eq(goals.visibility, 'private'))
            )
          );
        }
      }

      if (status) {
        whereConditions = and(whereConditions, eq(goals.status, status));
      }

      const userGoals = await ctx.db.query.goals.findMany({
        where: whereConditions,
        orderBy: [desc(goals.createdAt)],
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          milestones: {
            orderBy: [desc(milestones.achievedAt)],
            limit: 5,
          },
        },
      });

      return userGoals;
    }),

  getGoalById: protectedProcedure
    .input(z.object({
      goalId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const goal = await ctx.db.query.goals.findFirst({
        where: eq(goals.id, input.goalId),
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          milestones: {
            orderBy: [desc(milestones.achievedAt)],
          },
        },
      });

      if (!goal) {
        throw new TRPCError({ 
          code: "NOT_FOUND",
          message: "Goal not found" 
        });
      }

      // Check if user has permission to view this goal
      const canView = goal.userId === ctx.user.id || 
        (goal.visibility !== 'private' && goal.pairingId);

      if (!canView) {
        throw new TRPCError({ 
          code: "FORBIDDEN",
          message: "You don't have permission to view this goal" 
        });
      }

      return goal;
    }),

  createGoal: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      goalType: z.enum(['weight_loss', 'weight_gain', 'strength', 'endurance', 'consistency', 'body_composition', 'custom']),
      targetValue: z.number().optional(),
      targetUnit: z.string().optional(),
      currentValue: z.number().optional(),
      startDate: z.string(), // ISO date string
      targetDate: z.string(), // ISO date string
      visibility: z.enum(['private', 'buddy_only', 'public']).default('buddy_only'),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get user's active pairing if exists
      const pairing = await ctx.db.query.pairings.findFirst({
        where: and(
          or(
            eq(pairings.user1Id, ctx.user.id),
            eq(pairings.user2Id, ctx.user.id)
          ),
          eq(pairings.status, 'active')
        ),
      });

      const [goal] = await ctx.db.insert(goals).values({
        userId: ctx.user.id,
        pairingId: pairing?.id,
        title: input.title,
        description: input.description,
        goalType: input.goalType,
        targetValue: input.targetValue?.toString(),
        targetUnit: input.targetUnit,
        currentValue: input.currentValue?.toString(),
        startDate: input.startDate,
        targetDate: input.targetDate,
        visibility: input.visibility,
        metadata: input.metadata || {},
      }).returning();

      return goal;
    }),

  updateGoal: protectedProcedure
    .input(z.object({
      goalId: z.string().uuid(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      targetValue: z.number().optional(),
      currentValue: z.number().optional(),
      targetDate: z.string().optional(),
      visibility: z.enum(['private', 'buddy_only', 'public']).optional(),
      status: z.enum(['active', 'completed', 'paused', 'failed']).optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { goalId, ...updateData } = input;

      // Verify goal belongs to user
      const goal = await ctx.db.query.goals.findFirst({
        where: and(
          eq(goals.id, goalId),
          eq(goals.userId, ctx.user.id)
        ),
      });

      if (!goal) {
        throw new TRPCError({ 
          code: "NOT_FOUND",
          message: "Goal not found or you don't have permission to update it" 
        });
      }

      const updatePayload: any = {
        ...updateData,
        updatedAt: new Date(),
      };

      if (updateData.targetValue !== undefined) {
        updatePayload.targetValue = updateData.targetValue.toString();
      }
      if (updateData.currentValue !== undefined) {
        updatePayload.currentValue = updateData.currentValue.toString();
      }
      if (updateData.status === 'completed' && !goal.completedAt) {
        updatePayload.completedAt = new Date();
      }

      const [updated] = await ctx.db
        .update(goals)
        .set(updatePayload)
        .where(eq(goals.id, goalId))
        .returning();

      // Create milestone if goal was completed
      if (updateData.status === 'completed' && !goal.completedAt) {
        await ctx.db.insert(milestones).values({
          userId: ctx.user.id,
          pairingId: goal.pairingId,
          goalId: goalId,
          title: `Completed: ${goal.title}`,
          description: `Successfully completed the goal "${goal.title}"`,
          milestoneType: 'goal_completion',
          value: goal.targetValue,
          unit: goal.targetUnit,
          icon: '🎯',
        });
      }

      return updated;
    }),

  deleteGoal: protectedProcedure
    .input(z.object({
      goalId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify goal belongs to user
      const goal = await ctx.db.query.goals.findFirst({
        where: and(
          eq(goals.id, input.goalId),
          eq(goals.userId, ctx.user.id)
        ),
      });

      if (!goal) {
        throw new TRPCError({ 
          code: "NOT_FOUND",
          message: "Goal not found or you don't have permission to delete it" 
        });
      }

      await ctx.db.delete(goals).where(eq(goals.id, input.goalId));

      return { success: true };
    }),

  updateProgress: protectedProcedure
    .input(z.object({
      goalId: z.string().uuid(),
      currentValue: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { goalId, currentValue } = input;

      // Verify goal belongs to user
      const goal = await ctx.db.query.goals.findFirst({
        where: and(
          eq(goals.id, goalId),
          eq(goals.userId, ctx.user.id)
        ),
      });

      if (!goal) {
        throw new TRPCError({ 
          code: "NOT_FOUND",
          message: "Goal not found or you don't have permission to update it" 
        });
      }

      const [updated] = await ctx.db
        .update(goals)
        .set({ 
          currentValue: currentValue.toString(),
          updatedAt: new Date(),
        })
        .where(eq(goals.id, goalId))
        .returning();

      // Check if goal is completed based on target
      if (goal.targetValue) {
        const target = parseFloat(goal.targetValue);
        const shouldComplete = 
          (goal.goalType === 'weight_loss' && currentValue <= target) ||
          (goal.goalType === 'weight_gain' && currentValue >= target) ||
          (['strength', 'endurance'].includes(goal.goalType) && currentValue >= target);

        if (shouldComplete && goal.status === 'active') {
          await ctx.db
            .update(goals)
            .set({ 
              status: 'completed',
              completedAt: new Date(),
            })
            .where(eq(goals.id, goalId));

          // Create completion milestone
          await ctx.db.insert(milestones).values({
            userId: ctx.user.id,
            pairingId: goal.pairingId,
            goalId: goalId,
            title: `Completed: ${goal.title}`,
            description: `Reached target of ${target} ${goal.targetUnit || ''}`,
            milestoneType: 'goal_completion',
            value: target.toString(),
            unit: goal.targetUnit,
            icon: '🎯',
          });
        }
      }

      return updated;
    }),

  getUpcomingDeadlines: protectedProcedure
    .query(async ({ ctx }) => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const upcomingGoals = await ctx.db.query.goals.findMany({
        where: and(
          eq(goals.userId, ctx.user.id),
          eq(goals.status, 'active'),
          lte(goals.targetDate, thirtyDaysFromNow.toISOString().split('T')[0])
        ),
        orderBy: [asc(goals.targetDate)],
        limit: 5,
      });

      return upcomingGoals;
    }),
});