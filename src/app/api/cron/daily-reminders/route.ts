import { NextRequest, NextResponse } from 'next/server'
import { handleDailyReminderCron } from '@/server/services/reminder-service'

// This route is designed to be called by a cron job service
// For Vercel: Add to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/daily-reminders",
//     "schedule": "0 * * * *"  // Every hour
//   }]
// }

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    // In production, you should verify the Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await handleDailyReminderCron()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Daily reminder cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}