import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';
import { appRouter } from '@/server/api/root';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { db } from '@/db';

/**
 * Configure basic CORS headers
 * Adjust as needed for your use case
 */
const setCorsHeaders = (res: Response) => {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Request-Method', '*');
  res.headers.set('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
  res.headers.set('Access-Control-Allow-Headers', '*');
};

export const OPTIONS = () => {
  const response = new Response(null, { status: 200 });
  setCorsHeaders(response);
  return response;
};

/**
 * Create context for App Router
 */
const createContext = async (req: NextRequest) => {
  // Create Supabase server client with proper cookie handling
  const supabase = await createClient();

  // Create service role client for admin operations
  const supabaseAdmin = createSupabaseClient(
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

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };