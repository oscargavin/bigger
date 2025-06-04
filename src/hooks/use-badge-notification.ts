'use client'

import { create } from 'zustand'

interface BadgeNotification {
  badge: {
    name: string
    description: string
    icon: string
    color: string
    rarity: string
  } | null
}

interface BadgeNotificationStore extends BadgeNotification {
  showBadge: (badge: BadgeNotification['badge']) => void
  clearBadge: () => void
}

export const useBadgeNotification = create<BadgeNotificationStore>((set) => ({
  badge: null,
  showBadge: (badge) => {
    set({ badge })
    // Auto-clear after 5 seconds
    setTimeout(() => {
      set({ badge: null })
    }, 5000)
  },
  clearBadge: () => set({ badge: null }),
}))