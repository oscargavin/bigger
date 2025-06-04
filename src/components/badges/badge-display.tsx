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

const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
  // Colors aligned with design system
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-600 dark:text-blue-500'
  },
  purple: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    icon: 'text-violet-600 dark:text-violet-500'
  },
  gold: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: 'text-amber-600 dark:text-amber-500'
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: 'text-red-600 dark:text-red-500'
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: 'text-orange-600 dark:text-orange-500'
  },
  green: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-600 dark:text-emerald-500'
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-600 dark:text-emerald-500'
  },
  teal: {
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    icon: 'text-teal-600 dark:text-teal-500'
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    icon: 'text-indigo-600 dark:text-indigo-500'
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: 'text-yellow-600 dark:text-yellow-500'
  },
  navy: {
    bg: 'bg-blue-600/10',
    border: 'border-blue-600/20',
    icon: 'text-blue-700 dark:text-blue-400'
  },
  // Rarity colors
  bronze: {
    bg: 'bg-orange-600/10',
    border: 'border-orange-600/20',
    icon: 'text-orange-700 dark:text-orange-400'
  },
  silver: {
    bg: 'bg-muted',
    border: 'border-border',
    icon: 'text-muted-foreground'
  },
  platinum: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    icon: 'text-slate-600 dark:text-slate-400'
  },
}

const rarityStyles: Record<string, { glow: string; borderWidth: string }> = {
  common: {
    glow: '',
    borderWidth: 'border-2'
  },
  rare: {
    glow: 'shadow-md shadow-blue-500/20 dark:shadow-blue-400/30',
    borderWidth: 'border-2'
  },
  epic: {
    glow: 'shadow-lg shadow-purple-500/30 dark:shadow-purple-400/40',
    borderWidth: 'border-[3px]'
  },
  legendary: {
    glow: 'shadow-xl shadow-yellow-500/40 dark:shadow-yellow-400/50 animate-pulse',
    borderWidth: 'border-4'
  },
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
              isEarned && rarityStyles[badge.rarity]?.glow
            )}
          >
            {/* Badge background */}
            <div
              className={cn(
                'absolute inset-0 rounded-full transition-all duration-300',
                rarityStyles[badge.rarity]?.borderWidth || 'border-2',
                isEarned
                  ? `${colorMap[badge.color]?.bg || colorMap.blue.bg} ${colorMap[badge.color]?.border || colorMap.blue.border}`
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
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
                  className={cn(
                    "transition-all duration-500",
                    colorMap[badge.color]?.icon || 'text-blue-500 dark:text-blue-400'
                  )}
                />
              </svg>
            )}
            
            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon 
                className={cn(
                  iconSizeClasses[size],
                  isEarned ? (colorMap[badge.color]?.icon || colorMap.blue.icon) : 'text-gray-500 dark:text-gray-500'
                )}
              />
            </div>
            
            {/* Locked overlay */}
            {!isEarned && badge.progress === 0 && (
              <div className="absolute inset-0 rounded-full bg-white/60 dark:bg-black/30" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-0 !bg-white dark:!bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="space-y-2 p-3 text-gray-900 dark:text-gray-100">
            <div className="flex items-center gap-2">
              <Icon className={cn(
                "h-4 w-4",
                isEarned ? (colorMap[badge.color]?.icon || colorMap.blue.icon) : 'text-gray-400 dark:text-gray-400'
              )} />
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{badge.name}</p>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{badge.description}</p>
            {badge.progress && badge.progress < 100 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Progress</p>
                  <p className={cn(
                    "text-xs font-semibold",
                    colorMap[badge.color]?.icon || 'text-blue-500 dark:text-blue-400'
                  )}>
                    {Math.round(badge.progress)}%
                  </p>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 bg-blue-600 dark:bg-blue-500"
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
              </div>
            )}
            {badge.earnedAt && (
              <p className="text-xs text-gray-500 dark:text-gray-500 pt-1 border-t border-gray-200 dark:border-gray-700">
                Earned on {new Date(badge.earnedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
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