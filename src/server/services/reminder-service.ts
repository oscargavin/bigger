import { createClient } from '@supabase/supabase-js'

// This service would typically be called by a cron job
// For Vercel, you can use Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
// Example cron expression: 0 * * * * (runs every hour)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key needed for admin operations
)

interface UserWithReminder {
  id: string
  email: string
  username: string
  fullName: string
  timezone: string
  notificationPreferences: {
    dailyReminder?: {
      enabled: boolean
      time: string
      days: string[]
    }
  }
  lastWorkoutDate?: string
  currentStreak?: number
}

export async function sendDailyReminders() {
  try {
    // Get current time in UTC
    const now = new Date()
    const currentHour = now.getHours()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    // Get all users with reminders enabled for the current hour
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        username,
        full_name,
        timezone,
        notification_preferences,
        streaks (
          current_streak,
          last_workout_date
        )
      `)
      .not('notification_preferences->dailyReminder', 'is', null)
      .eq('notification_preferences->dailyReminder->enabled', true)

    if (error) {
      console.error('Error fetching users for reminders:', error)
      return
    }

    // Filter users who should receive reminders at this hour
    const usersToNotify = users?.filter((user) => {
      const reminder = user.notification_preferences?.dailyReminder
      if (!reminder?.enabled || !reminder.days.includes(currentDay)) {
        return false
      }

      // Convert reminder time to UTC based on user's timezone
      const [hours] = reminder.time.split(':').map(Number)
      // TODO: Implement proper timezone conversion
      // For now, assume all users are in the same timezone as the server
      return hours === currentHour
    }) || []

    // Send reminders to each user
    for (const user of usersToNotify) {
      const formattedUser: UserWithReminder = {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        timezone: user.timezone,
        notificationPreferences: user.notification_preferences,
        lastWorkoutDate: user.streaks?.[0]?.last_workout_date,
        currentStreak: user.streaks?.[0]?.current_streak
      }
      await sendReminderToUser(formattedUser)
    }

    console.log(`Sent ${usersToNotify.length} daily reminders`)
  } catch (error) {
    console.error('Error in sendDailyReminders:', error)
  }
}

async function sendReminderToUser(user: UserWithReminder) {
  try {
    const lastWorkoutDate = user.lastWorkoutDate
    const currentStreak = user.currentStreak || 0

    // Check if user already worked out today
    const today = new Date().toISOString().split('T')[0]
    if (lastWorkoutDate === today) {
      console.log(`User ${user.username} already worked out today`)
      return
    }

    // Calculate if streak will be broken
    const willBreakStreak = currentStreak > 0 && lastWorkoutDate !== today

    // Create notification record
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'daily_reminder',
        title: willBreakStreak 
          ? `Don't break your ${currentStreak} day streak!` 
          : 'Time for your workout!',
        message: willBreakStreak
          ? `You're on a ${currentStreak} day streak! Log your workout today to keep it going.`
          : 'Ready to crush your workout? Log it when you\'re done to track your progress.',
        data: {
          streak: currentStreak,
          lastWorkoutDate,
        },
      })

    if (notificationError) {
      console.error(`Error creating notification for user ${user.username}:`, notificationError)
      return
    }

    // In a production app, you would also:
    // 1. Send push notification if enabled
    // 2. Send email if enabled
    // 3. Send SMS if enabled
    // Example with a service like SendGrid or Resend:
    /*
    if (user.notificationPreferences.email) {
      await sendEmail({
        to: user.email,
        subject: willBreakStreak 
          ? `Don't break your ${currentStreak} day streak!` 
          : 'Time for your workout!',
        html: renderReminderEmail({ user, streak: currentStreak, willBreakStreak })
      })
    }
    */

    console.log(`Sent reminder to ${user.username}`)
  } catch (error) {
    console.error(`Error sending reminder to user ${user.id}:`, error)
  }
}

// This function would be called by an API route that's triggered by a cron job
export async function handleDailyReminderCron() {
  // Verify the request is from your cron service (e.g., Vercel Cron)
  // This is important for security
  
  await sendDailyReminders()
  
  return { success: true, timestamp: new Date().toISOString() }
}