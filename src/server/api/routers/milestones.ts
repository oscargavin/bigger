import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { milestones, pairings, workouts } from "@/db/schema";
import { and, eq, or, desc, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const milestonesRouter = createTRPCRouter({
  getMilestones: protectedProcedure
    .input(z.object({
      milestoneType: z.enum(['workout_count', 'streak', 'weight_change', 'strength_pr', 'time_based', 'goal_completion', 'anniversary', 'custom']).optional(),
      includeBuddy: z.boolean().default(false),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { milestoneType, includeBuddy, limit } = input;
      
      let whereConditions: any = eq(milestones.userId, ctx.user.id);
      
      if (includeBuddy) {
        // Get user's pairing to include buddy milestones
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
            eq(milestones.userId, ctx.user.id),
            eq(milestones.userId, partnerId)
          );
        }
      }

      if (milestoneType) {
        whereConditions = and(whereConditions, eq(milestones.milestoneType, milestoneType));
      }

      const userMilestones = await ctx.db.query.milestones.findMany({
        where: whereConditions,
        orderBy: [desc(milestones.achievedAt)],
        limit,
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          goal: true,
        },
      });

      return userMilestones;
    }),

  getUncelebratedMilestones: protectedProcedure
    .query(async ({ ctx }) => {
      const uncelebrated = await ctx.db.query.milestones.findMany({
        where: and(
          eq(milestones.userId, ctx.user.id),
          eq(milestones.celebrated, false)
        ),
        orderBy: [desc(milestones.achievedAt)],
        with: {
          goal: true,
        },
      });

      return uncelebrated;
    }),

  celebrateMilestone: protectedProcedure
    .input(z.object({
      milestoneId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify milestone belongs to user
      const milestone = await ctx.db.query.milestones.findFirst({
        where: and(
          eq(milestones.id, input.milestoneId),
          eq(milestones.userId, ctx.user.id)
        ),
      });

      if (!milestone) {
        throw new TRPCError({ 
          code: "NOT_FOUND",
          message: "Milestone not found or you don't have permission to celebrate it" 
        });
      }

      const [updated] = await ctx.db
        .update(milestones)
        .set({ 
          celebrated: true,
          celebratedAt: new Date(),
        })
        .where(eq(milestones.id, input.milestoneId))
        .returning();

      return updated;
    }),

  createCustomMilestone: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      milestoneType: z.enum(['custom']),
      value: z.number().optional(),
      unit: z.string().optional(),
      icon: z.string().optional(),
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

      const [milestone] = await ctx.db.insert(milestones).values({
        userId: ctx.user.id,
        pairingId: pairing?.id,
        title: input.title,
        description: input.description,
        milestoneType: 'custom',
        value: input.value?.toString(),
        unit: input.unit,
        icon: input.icon || '🏆',
        metadata: input.metadata || {},
      }).returning();

      return milestone;
    }),

  checkAndCreateAnniversaries: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Get user's active pairing
      const pairing = await ctx.db.query.pairings.findFirst({
        where: and(
          or(
            eq(pairings.user1Id, ctx.user.id),
            eq(pairings.user2Id, ctx.user.id)
          ),
          eq(pairings.status, 'active')
        ),
      });

      if (!pairing || !pairing.startedAt) return { created: [] };

      const now = new Date();
      const startDate = new Date(pairing.startedAt);
      const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                        (now.getMonth() - startDate.getMonth());

      const createdMilestones = [];

      // Check for monthly anniversaries (1, 3, 6, 9 months)
      const monthMilestones = [1, 3, 6, 9];
      for (const months of monthMilestones) {
        if (monthsDiff >= months) {
          // Check if this milestone already exists
          const existing = await ctx.db.query.milestones.findFirst({
            where: and(
              eq(milestones.userId, ctx.user.id),
              eq(milestones.milestoneType, 'anniversary'),
              eq(milestones.metadata, { months })
            ),
          });

          if (!existing) {
            const [milestone] = await ctx.db.insert(milestones).values({
              userId: ctx.user.id,
              pairingId: pairing.id,
              title: `${months} Month Gym Partnership Anniversary! 🎉`,
              description: `You and your buddy have been crushing it together for ${months} month${months > 1 ? 's' : ''}!`,
              milestoneType: 'anniversary',
              value: months.toString(),
              unit: 'months',
              icon: '🎊',
              metadata: { months },
            }).returning();
            createdMilestones.push(milestone);
          }
        }
      }

      // Check for yearly anniversaries
      const years = Math.floor(monthsDiff / 12);
      if (years > 0) {
        const existing = await ctx.db.query.milestones.findFirst({
          where: and(
            eq(milestones.userId, ctx.user.id),
            eq(milestones.milestoneType, 'anniversary'),
            eq(milestones.metadata, { years })
          ),
        });

        if (!existing) {
          const [milestone] = await ctx.db.insert(milestones).values({
            userId: ctx.user.id,
            pairingId: pairing.id,
            title: `${years} Year Gym Partnership Anniversary! 🏆`,
            description: `An incredible ${years} year${years > 1 ? 's' : ''} of gains and friendship!`,
            milestoneType: 'anniversary',
            value: years.toString(),
            unit: 'years',
            icon: '🥇',
            metadata: { years },
          }).returning();
          createdMilestones.push(milestone);
        }
      }

      return { created: createdMilestones };
    }),

  checkAndCreateWorkoutMilestones: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Get total workout count
      const result = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(workouts)
        .where(eq(workouts.userId, ctx.user.id));
      
      const totalWorkouts = result[0]?.count || 0;
      const createdMilestones = [];

      // Check for workout count milestones
      const workoutMilestones = [10, 25, 50, 100, 200, 300, 500, 1000];
      for (const count of workoutMilestones) {
        if (totalWorkouts >= count) {
          // Check if this milestone already exists
          const existing = await ctx.db.query.milestones.findFirst({
            where: and(
              eq(milestones.userId, ctx.user.id),
              eq(milestones.milestoneType, 'workout_count'),
              eq(milestones.value, count.toString())
            ),
          });

          if (!existing) {
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

            const [milestone] = await ctx.db.insert(milestones).values({
              userId: ctx.user.id,
              pairingId: pairing?.id,
              title: `${count} Workouts Completed! 💪`,
              description: `You've completed ${count} workouts! Keep up the amazing work!`,
              milestoneType: 'workout_count',
              value: count.toString(),
              unit: 'workouts',
              icon: count >= 500 ? '🏅' : count >= 100 ? '🥈' : '🥉',
            }).returning();
            createdMilestones.push(milestone);
          }
        }
      }

      return { created: createdMilestones };
    }),

  getPartnershipAnniversaries: protectedProcedure
    .query(async ({ ctx }) => {
      // Get user's active pairing
      const pairing = await ctx.db.query.pairings.findFirst({
        where: and(
          or(
            eq(pairings.user1Id, ctx.user.id),
            eq(pairings.user2Id, ctx.user.id)
          ),
          eq(pairings.status, 'active')
        ),
      });

      if (!pairing) return { anniversaries: [] };

      const anniversaries = await ctx.db.query.milestones.findMany({
        where: and(
          eq(milestones.pairingId, pairing.id),
          eq(milestones.milestoneType, 'anniversary')
        ),
        orderBy: [desc(milestones.achievedAt)],
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      });

      return { 
        anniversaries,
        partnershipStartDate: pairing.startedAt,
      };
    }),
});