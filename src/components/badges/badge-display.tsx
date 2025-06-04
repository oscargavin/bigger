'use client'

import { cn } from '@/lib/utils'
import { 
  Trophy, 
  Flame, 
  Dumbbell, 
  Star, 
  Camera, 
  Users as UsersIcon, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Sunrise,
  Moon
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Badge {
  id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  rarity: string
  earned?: boolean
  progress?: number
  earnedAt?: string
}

const iconMap: Record<string, any> = {
  trophy: Trophy,
  flame: Flame,
  dumbbell: Dumbbell,
  star: Star,
  camera: Camera,
  users: UsersIcon,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  calendar: Calendar,
  sunrise: Sunrise,
  moon: Moon,
}

const colorMap: Record<string, string> = {
  // Colors
  blue: 'from-blue-500 to-blue-600 ring-blue-400',
  purple: 'from-purple-500 to-purple-600 ring-purple-400',
  gold: 'from-yellow-400 to-amber-500 ring-yellow-400',
  red: 'from-red-500 to-red-600 ring-red-400',
  orange: 'from-orange-500 to-orange-600 ring-orange-400',
  green: 'from-green-500 to-green-600 ring-green-400',
  emerald: 'from-emerald-500 to-emerald-600 ring-emerald-400',
  teal: 'from-teal-500 to-teal-600 ring-teal-400',
  indigo: 'from-indigo-500 to-indigo-600 ring-indigo-400',
  yellow: 'from-yellow-400 to-yellow-500 ring-yellow-400',
  navy: 'from-blue-700 to-blue-800 ring-blue-600',
  // Rarity colors
  bronze: 'from-orange-600 to-orange-700 ring-orange-500',
  silver: 'from-gray-400 to-gray-500 ring-gray-400',
  platinum: 'from-slate-300 to-slate-400 ring-slate-300',
}

const rarityGlow: Record<string, string> = {
  common: '',
  rare: 'shadow-lg shadow-blue-500/20',
  epic: 'shadow-lg shadow-purple-500/30',
  legendary: 'shadow-xl shadow-yellow-500/40 animate-pulse',
}

interface BadgeDisplayProps {
  badge: Badge
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
  onClick?: () => void
}

export function BadgeDisplay({ badge, size = 'md', showProgress = true, onClick }: BadgeDisplayProps) {
  const Icon = iconMap[badge.icon] || Trophy
  
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  }
  
  const iconSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }

  const isEarned = badge.earned || (badge.progress && badge.progress >= 100)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'relative group transition-all duration-300',
              sizeClasses[size],
              onClick && 'cursor-pointer hover:scale-110',
              isEarned && rarityGlow[badge.rarity]
            )}
          >
            {/* Badge background */}
            <div
              className={cn(
                'absolute inset-0 rounded-full transition-all duration-300',
                isEarned
                  ? `bg-gradient-to-br ${colorMap[badge.color]} ring-2`
                  : 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700'
              )}
            />
            
            {/* Progress ring */}
            {showProgress && badge.progress && badge.progress < 100 && (
              <svg className="absolute inset-0 -rotate-90 transform">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${badge.progress * 2.83} 283`}
                  className="text-brand-500 transition-all duration-500"
                />
              </svg>
            )}
            
            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon 
                className={cn(
                  iconSizeClasses[size],
                  isEarned ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                )}
              />
            </div>
            
            {/* Locked overlay */}
            {!isEarned && (
              <div className="absolute inset-0 rounded-full bg-black/20 dark:bg-black/40" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{badge.name}</p>
            <p className="text-sm text-muted-foreground">{badge.description}</p>
            {badge.progress && badge.progress < 100 && (
              <p className="text-xs text-brand-500 dark:text-brand-400">
                Progress: {Math.round(badge.progress)}%
              </p>
            )}
            {badge.earnedAt && (
              <p className="text-xs text-muted-foreground">
                Earned: {new Date(badge.earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface BadgeGridProps {
  badges: Badge[]
  size?: 'sm' | 'md' | 'lg'
  onBadgeClick?: (badge: Badge) => void
}

export function BadgeGrid({ badges, size = 'md', onBadgeClick }: BadgeGridProps) {
  const gridClasses = {
    sm: 'grid-cols-6 gap-2',
    md: 'grid-cols-5 gap-4',
    lg: 'grid-cols-4 gap-6',
  }

  return (
    <div className={cn('grid', gridClasses[size])}>
      {badges.map((badge) => (
        <BadgeDisplay
          key={badge.id}
          badge={badge}
          size={size}
          onClick={() => onBadgeClick?.(badge)}
        />
      ))}
    </div>
  )
}