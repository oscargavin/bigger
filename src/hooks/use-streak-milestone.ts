'use client'

import { create } from 'zustand'

interface StreakMilestoneStore {
  showMilestone: boolean
  previousStreak: number
  currentStreak: number
  setMilestone: (current: number, previous: number) => void
  hideMilestone: () => void
}

export const useStreakMilestoneStore = create<StreakMilestoneStore>((set) => ({
  showMilestone: false,
  previousStreak: 0,
  currentStreak: 0,
  setMilestone: (current, previous) => {
    set({
      currentStreak: current,
      previousStreak: previous,
      showMilestone: true,
    })
  },
  hideMilestone: () => {
    set({ showMilestone: false })
  },
}))

export function useStreakMilestone() {
  return useStreakMilestoneStore()
}