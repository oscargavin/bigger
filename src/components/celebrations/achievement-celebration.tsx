'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Trophy, Award, Star, Zap, Flame, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BadgeData {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  category: string
}

interface AchievementCelebrationProps {
  badge: BadgeData | null
  onComplete?: () => void
}

const rarityColors = {
  common: {
    bg: 'from-gray-400 to-gray-600',
    glow: 'shadow-gray-400/50',
    text: 'text-gray-600',
  },
  rare: {
    bg: 'from-blue-400 to-blue-600',
    glow: 'shadow-blue-400/50',
    text: 'text-blue-600',
  },
  epic: {
    bg: 'from-purple-400 to-purple-600',
    glow: 'shadow-purple-400/50',
    text: 'text-purple-600',
  },
  legendary: {
    bg: 'from-amber-400 to-amber-600',
    glow: 'shadow-amber-400/50',
    text: 'text-amber-600',
  },
}

const iconMap: Record<string, React.ComponentType<any>> = {
  trophy: Trophy,
  award: Award,
  star: Star,
  zap: Zap,
  flame: Flame,
  target: Target,
}

export function AchievementCelebration({ badge, onComplete }: AchievementCelebrationProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (badge) {
      setShow(true)
      
      // Trigger confetti based on rarity
      const particleCount = badge.rarity === 'legendary' ? 200 : 
                           badge.rarity === 'epic' ? 150 : 
                           badge.rarity === 'rare' ? 100 : 50

      const spread = badge.rarity === 'legendary' ? 360 : 
                     badge.rarity === 'epic' ? 180 : 
                     badge.rarity === 'rare' ? 120 : 90

      // Center burst
      confetti({
        particleCount,
        spread,
        origin: { y: 0.5, x: 0.5 },
        colors: badge.rarity === 'legendary' ? ['#fbbf24', '#f59e0b', '#d97706'] :
                badge.rarity === 'epic' ? ['#a855f7', '#9333ea', '#7c3aed'] :
                badge.rarity === 'rare' ? ['#3b82f6', '#2563eb', '#1d4ed8'] :
                ['#6b7280', '#4b5563', '#374151'],
      })

      // Side bursts for epic and legendary
      if (badge.rarity === 'epic' || badge.rarity === 'legendary') {
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
          })
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
          })
        }, 250)
      }

      // Auto-hide after delay
      const timer = setTimeout(() => {
        setShow(false)
        onComplete?.()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [badge, onComplete])

  if (!badge) return null

  const Icon = iconMap[badge.icon] || Trophy
  const colors = rarityColors[badge.rarity]

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          {/* Achievement card */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: 1, 
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 15,
              }
            }}
            exit={{ scale: 0, opacity: 0 }}
            className="relative"
          >
            {/* Glow effect */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={cn(
                "absolute inset-0 rounded-full blur-3xl",
                colors.glow,
                "shadow-2xl"
              )}
              style={{
                background: `radial-gradient(circle, ${
                  badge.rarity === 'legendary' ? '#fbbf24' :
                  badge.rarity === 'epic' ? '#a855f7' :
                  badge.rarity === 'rare' ? '#3b82f6' :
                  '#6b7280'
                } 0%, transparent 70%)`,
              }}
            />
            
            {/* Card content */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl min-w-[400px]">
              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-6"
              >
                <h2 className="text-3xl font-bold mb-2">Achievement Unlocked!</h2>
                <div className={cn("text-sm font-medium uppercase tracking-wider", colors.text)}>
                  {badge.rarity} {badge.category}
                </div>
              </motion.div>
              
              {/* Badge icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                <div className={cn(
                  "relative w-32 h-32 rounded-full bg-gradient-to-br flex items-center justify-center",
                  colors.bg
                )}>
                  {/* Spinning ring for epic and legendary */}
                  {(badge.rarity === 'epic' || badge.rarity === 'legendary') && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(from 0deg, transparent, ${
                          badge.rarity === 'legendary' ? '#fbbf24' : '#a855f7'
                        }, transparent)`,
                      }}
                    />
                  )}
                  
                  {/* Icon */}
                  <motion.div
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Icon className="w-16 h-16 text-white" />
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Badge details */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <h3 className="text-2xl font-bold mb-2">{badge.name}</h3>
                <p className="text-muted-foreground">{badge.description}</p>
              </motion.div>
              
              {/* Particles for legendary badges */}
              {badge.rarity === 'legendary' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-amber-400 rounded-full"
                      initial={{
                        x: Math.random() * 400,
                        y: 400,
                      }}
                      animate={{
                        y: -50,
                        opacity: [1, 0],
                      }}
                      transition={{
                        duration: Math.random() * 3 + 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}