import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from '@/db';

/**
 * Context type that can be provided directly (App Router)
 */
type AppRouterContext = {
  supabase: SupabaseClient<any, any, any>;
  supabaseAdmin: SupabaseClient<any, any, any>;
  db: typeof db;
  session: any;
  user: any;
};

/**
 * Create context for tRPC procedures
 * This runs for each request
 */
export const createTRPCContext = async (
  opts: CreateNextContextOptions | AppRouterContext
): Promise<AppRouterContext> => {
  // If we already have the context (App Router), return it
  if ('supabase' in opts) {
    return opts;
  }

  // Otherwise create it (Pages Router)
  const { req } = opts;

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Get the session from cookies if available
        ...(req.headers.cookie && {
          persistSession: true,
          detectSessionInUrl: false,
        }),
      },
    }
  );

  // Create service role client for admin operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get the user first to validate the JWT
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  return {
    supabase,
    supabaseAdmin,
    db,
    session: user ? { user } : null, // Create a minimal session object if user exists
    user,
  };
};

/**
 * Initialize tRPC backend
 * Should be done only once per backend
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Create tRPC router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure;

/**
 * Middleware to enforce authentication
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      // infers the `session` and `user` as non-nullable
      session: ctx.session,
      user: ctx.user,
    },
  });
});

/**
 * Protected (authenticated) procedure
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);