'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Trophy, Award, Crown } from 'lucide-react'
import confetti from 'canvas-confetti'

interface StreakMilestoneProps {
  currentStreak: number
  previousStreak: number
  show: boolean
}

const milestones = [
  { days: 7, icon: Flame, color: 'text-orange-500', title: 'Week Warrior!', message: '7 day streak achieved!' },
  { days: 14, icon: Trophy, color: 'text-yellow-500', title: 'Fortnight Fighter!', message: '14 day streak achieved!' },
  { days: 30, icon: Award, color: 'text-purple-500', title: 'Monthly Master!', message: '30 day streak achieved!' },
  { days: 60, icon: Crown, color: 'text-gold-500', title: 'Legendary!', message: '60 day streak achieved!' },
  { days: 100, icon: Crown, color: 'text-gold-600', title: 'Centurion!', message: '100 day streak achieved!' },
]

export function StreakMilestone({ currentStreak, previousStreak, show }: StreakMilestoneProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [milestone, setMilestone] = useState<typeof milestones[0] | null>(null)

  useEffect(() => {
    if (!show) return

    // Check if we've hit a new milestone
    const currentMilestone = milestones.find(m => 
      currentStreak >= m.days && previousStreak < m.days
    )

    if (currentMilestone) {
      setMilestone(currentMilestone)
      setIsVisible(true)

      // Trigger confetti
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false)
      }, 5000)
    }
  }, [currentStreak, previousStreak, show])

  if (!milestone) return null

  const Icon = milestone.icon

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="bg-background border-2 border-primary rounded-lg shadow-2xl p-8 text-center max-w-sm pointer-events-auto"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: 3 }}
              className="mb-4"
            >
              <Icon className={`h-24 w-24 mx-auto ${milestone.color}`} />
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">{milestone.title}</h2>
            <p className="text-xl text-muted-foreground mb-4">{milestone.message}</p>
            <div className="flex items-center justify-center gap-2">
              <Flame className="h-8 w-8 text-orange-500" />
              <span className="text-4xl font-bold">{currentStreak}</span>
              <span className="text-xl text-muted-foreground">days</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}