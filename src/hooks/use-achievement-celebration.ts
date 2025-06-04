'use client'

import { create } from 'zustand'

interface BadgeData {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  category: string
}

interface AchievementStore {
  currentBadge: BadgeData | null
  queue: BadgeData[]
  celebrate: (badge: BadgeData) => void
  clearCurrent: () => void
}

export const useAchievementCelebration = create<AchievementStore>((set, get) => ({
  currentBadge: null,
  queue: [],

  celebrate: (badge) => {
    const state = get()
    
    // If there's already a celebration showing, add to queue
    if (state.currentBadge) {
      set({ queue: [...state.queue, badge] })
    } else {
      set({ currentBadge: badge })
    }
  },

  clearCurrent: () => {
    const state = get()
    const nextBadge = state.queue[0]
    
    if (nextBadge) {
      // Show next badge from queue
      set({
        currentBadge: nextBadge,
        queue: state.queue.slice(1),
      })
    } else {
      // No more badges in queue
      set({ currentBadge: null })
    }
  },
}))