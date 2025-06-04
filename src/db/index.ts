import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Construct the Supabase database URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
}

// Extract project ref from Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1]
if (!projectRef) {
  throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format')
}

// Construct database URL - Supabase uses port 5432 for direct connections
const connectionString = process.env.DATABASE_URL || 
  `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD || ''}@aws-0-eu-west-2.pooler.supabase.com:5432/postgres`

const client = postgres(connectionString)
export const db = drizzle(client, { schema })