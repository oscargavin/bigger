'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { api } from '@/utils/api'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export function useRealtimeWorkouts(userId?: string) {
  const utils = api.useUtils()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) return
    
    // Subscribe to workout inserts
    const channel = supabase
      .channel('workout-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workouts',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Get partner info
          const { data: partner } = await supabase
            .from('users')
            .select('username, full_name')
            .eq('id', userId)
            .single()
          
          // Show toast notification
          toast({
            title: '🔥 Partner Workout Alert!',
            description: `${partner?.full_name || partner?.username || 'Your partner'} just logged a workout!`,
          })
          
          // Invalidate relevant queries when partner logs a workout
          utils.workouts.getStats.invalidate()
          utils.workouts.getMyWorkouts.invalidate()
          utils.pairings.getHeadToHeadStats.invalidate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, utils, toast])
}

export function useRealtimePairings(userId?: string) {
  const utils = api.useUtils()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) return
    
    // Subscribe to pairing updates
    const channel = supabase
      .channel('pairing-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pairings',
          filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})`,
        },
        async (payload) => {
          // Invalidate pairing queries
          utils.pairings.getCurrentPairing.invalidate()
          utils.pairings.getPendingRequests.invalidate()
          utils.pairings.getSentRequests.invalidate()
          
          // Handle pairing status changes
          if (payload.eventType === 'UPDATE') {
            const pairing = payload.new as any
            if (pairing.status === 'active') {
              toast({
                title: '🎉 Partnership Accepted!',
                description: 'Your gym buddy request has been accepted. Time to get to work!',
              })
              router.refresh()
            } else if (pairing.status === 'ended') {
              toast({
                title: 'Partnership Ended',
                description: 'Your gym buddy partnership has ended.',
                variant: 'destructive',
              })
              router.refresh()
            }
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const pairing = payload.new as any
            if (pairing.user2_id === userId && pairing.status === 'pending') {
              toast({
                title: '👋 New Buddy Request!',
                description: 'Someone wants to be your gym buddy. Check your buddy page!',
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, utils, router, toast])
}

export function useRealtimeNotifications(userId?: string) {
  const utils = api.useUtils()

  useEffect(() => {
    if (!userId) return
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as any
          
          // Show browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/android-chrome-192x192.png',
            })
          }
          
          console.log('New notification:', notification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, utils])
}