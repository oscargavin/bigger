'use client'

import { useRealtimeWorkouts, useRealtimePairings, useRealtimeNotifications } from '@/hooks/use-realtime'
import { api } from '@/utils/api'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  // Get current user and pairing
  const { data: user } = api.auth.getUser.useQuery()
  const { data: pairing } = api.pairings.getCurrentPairing.useQuery()
  
  // Get partner ID if paired
  const partnerId = pairing?.partner?.id

  // Subscribe to realtime updates
  useRealtimeWorkouts(partnerId) // Watch partner's workouts
  useRealtimePairings(user?.id) // Watch pairing changes
  useRealtimeNotifications(user?.id) // Watch for notifications

  return <>{children}</>
}