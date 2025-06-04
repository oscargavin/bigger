'use client'

import { AppSidebar } from '@/components/layout/app-sidebar'
import { RealtimeProvider } from '@/components/providers/realtime-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { StreakMilestone } from '@/components/celebrations/streak-milestone'
import { AchievementCelebration } from '@/components/celebrations/achievement-celebration'
import { useStreakMilestone } from '@/hooks/use-streak-milestone'
import { useAchievementCelebration } from '@/hooks/use-achievement-celebration'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { showMilestone, currentStreak, previousStreak } = useStreakMilestone()
  const { currentBadge, clearCurrent } = useAchievementCelebration()

  return (
    <RealtimeProvider>
      <div className="flex h-screen">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 pt-20 md:pt-6 md:pl-12">
            {children}
          </div>
        </main>
      </div>
      <ToastProvider />
      <StreakMilestone
        show={showMilestone}
        currentStreak={currentStreak}
        previousStreak={previousStreak}
      />
      <AchievementCelebration
        badge={currentBadge}
        onComplete={clearCurrent}
      />
    </RealtimeProvider>
  )
}