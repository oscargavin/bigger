import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { aiSmartInsightsService } from '../../services/ai-smart-insights-service'
import { TRPCError } from '@trpc/server'
import { db } from '@/db'
import { goals, milestones } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export const insightsRouter = createTRPCRouter({
  getSmartInsights: protectedProcedure
    .input(z.object({
      regenerate: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      try {
        const insights = await aiSmartInsightsService.generateSmartInsights(ctx.session.user.id)
        
        // Optionally save generated goals if requested
        if (input?.regenerate) {
          await aiSmartInsightsService.saveGeneratedGoals(ctx.session.user.id, insights.goals)
        }
        
        return insights
      } catch (error) {
        console.error('Error generating smart insights:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate insights',
        })
      }
    }),

  getWorkoutPatterns: protectedProcedure
    .input(z.object({
      days: z.number().min(7).max(90).default(30),
    }).optional())
    .query(async ({ ctx, input }) => {
      try {
        const patterns = await aiSmartInsightsService.analyzeWorkoutPatterns(
          ctx.session.user.id,
          input?.days || 30
        )
        return patterns
      } catch (error) {
        console.error('Error analyzing workout patterns:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to analyze workout patterns',
        })
      }
    }),

  getProgressSummary: protectedProcedure
    .input(z.object({
      period: z.enum(['weekly', 'monthly', 'quarterly']).default('monthly'),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const summary = await aiSmartInsightsService.generateProgressSummary(
          ctx.session.user.id,
          input.period
        )
        return summary
      } catch (error) {
        console.error('Error generating progress summary:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate progress summary',
        })
      }
    }),

  getWeaknesses: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const weaknesses = await aiSmartInsightsService.identifyWeaknesses(ctx.session.user.id)
        return weaknesses
      } catch (error) {
        console.error('Error identifying weaknesses:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to identify weaknesses',
        })
      }
    }),

  getPersonalizedGoals: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const goals = await aiSmartInsightsService.generatePersonalizedGoals(ctx.session.user.id)
        return goals
      } catch (error) {
        console.error('Error generating personalized goals:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate personalized goals',
        })
      }
    }),

  saveGoals: protectedProcedure
    .input(z.object({
      goals: z.array(z.object({
        type: z.enum(['short-term', 'medium-term', 'long-term']),
        category: z.enum(['strength', 'endurance', 'consistency', 'body-composition', 'skill']),
        title: z.string(),
        description: z.string(),
        targetDate: z.date(),
        milestones: z.array(z.object({
          description: z.string(),
          targetDate: z.date(),
          metric: z.string(),
        })),
        actionPlan: z.array(z.string()),
        successCriteria: z.string(),
        estimatedDifficulty: z.enum(['easy', 'moderate', 'challenging', 'stretch']),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const savedGoals = await aiSmartInsightsService.saveGeneratedGoals(
          ctx.session.user.id,
          input.goals
        )
        return savedGoals
      } catch (error) {
        console.error('Error saving goals:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save goals',
        })
      }
    }),

  getActiveGoals: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const activeGoals = await db.query.goals.findMany({
          where: and(
            eq(goals.userId, ctx.session.user.id),
            eq(goals.status, 'active')
          ),
          with: {
            milestones: {
              orderBy: (milestones, { asc }) => [asc(milestones.achievedAt)],
            },
          },
          orderBy: [desc(goals.createdAt)],
        })
        
        return activeGoals
      } catch (error) {
        console.error('Error fetching active goals:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch active goals',
        })
      }
    }),

  updateGoalProgress: protectedProcedure
    .input(z.object({
      goalId: z.string().uuid(),
      currentValue: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [updatedGoal] = await db
          .update(goals)
          .set({ 
            currentValue: input.currentValue.toString(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(goals.id, input.goalId),
              eq(goals.userId, ctx.session.user.id)
            )
          )
          .returning()
        
        if (!updatedGoal) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Goal not found',
          })
        }
        
        // Check if goal is completed
        if (updatedGoal.targetValue) {
          const target = parseFloat(updatedGoal.targetValue)
          const current = input.currentValue
          
          if (current >= target) {
            await db
              .update(goals)
              .set({ 
                status: 'completed',
                completedAt: new Date(),
              })
              .where(eq(goals.id, input.goalId))
          }
        }
        
        return updatedGoal
      } catch (error) {
        console.error('Error updating goal progress:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update goal progress',
        })
      }
    }),

  completeMilestone: protectedProcedure
    .input(z.object({
      milestoneId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [updatedMilestone] = await db
          .update(milestones)
          .set({ 
            celebrated: true,
            celebratedAt: new Date(),
          })
          .where(
            and(
              eq(milestones.id, input.milestoneId),
              eq(milestones.userId, ctx.session.user.id)
            )
          )
          .returning()
        
        if (!updatedMilestone) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Milestone not found',
          })
        }
        
        return updatedMilestone
      } catch (error) {
        console.error('Error completing milestone:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to complete milestone',
        })
      }
    }),
})