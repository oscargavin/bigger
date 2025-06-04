import { createTRPCRouter } from '@/server/api/trpc';
import { authRouter } from '@/server/api/routers/auth';
import { pairingsRouter } from '@/server/api/routers/pairings';
import { workoutsRouter } from '@/server/api/routers/workouts';
import { progressRouter } from '@/server/api/routers/progress';
import { badgesRouter } from '@/server/api/routers/badges';
import { reportsRouter } from '@/server/api/routers/reports';
import { aiShameRouter } from '@/server/api/routers/ai-shame';
import { gamificationRouter } from '@/server/api/routers/gamification';
import { insightsRouter } from '@/server/api/routers/insights';
import { messagesRouter } from '@/server/api/routers/messages';
import { goalsRouter } from '@/server/api/routers/goals';
import { milestonesRouter } from '@/server/api/routers/milestones';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  pairings: pairingsRouter,
  workouts: workoutsRouter,
  progress: progressRouter,
  badges: badgesRouter,
  reports: reportsRouter,
  aiShame: aiShameRouter,
  gamification: gamificationRouter,
  insights: insightsRouter,
  messages: messagesRouter,
  goals: goalsRouter,
  milestones: milestonesRouter,
  // Add more routers here as you create them
});

// export type definition of API
export type AppRouter = typeof appRouter;