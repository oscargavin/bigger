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
  // Colors
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-400 dark:border-blue-600',
    icon: 'text-blue-600 dark:text-blue-400'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-400 dark:border-purple-600',
    icon: 'text-purple-600 dark:text-purple-400'
  },
  gold: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-400 dark:border-amber-600',
    icon: 'text-amber-600 dark:text-amber-400'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-400 dark:border-red-600',
    icon: 'text-red-600 dark:text-red-400'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-400 dark:border-orange-600',
    icon: 'text-orange-600 dark:text-orange-400'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-400 dark:border-green-600',
    icon: 'text-green-600 dark:text-green-400'
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-400 dark:border-emerald-600',
    icon: 'text-emerald-600 dark:text-emerald-400'
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-400 dark:border-teal-600',
    icon: 'text-teal-600 dark:text-teal-400'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-400 dark:border-indigo-600',
    icon: 'text-indigo-600 dark:text-indigo-400'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-400 dark:border-yellow-600',
    icon: 'text-yellow-600 dark:text-yellow-400'
  },
  navy: {
    bg: 'bg-blue-100 dark:bg-blue-950/50',
    border: 'border-blue-700 dark:border-blue-700',
    icon: 'text-blue-700 dark:text-blue-300'
  },
  // Rarity colors
  bronze: {
    bg: 'bg-orange-100 dark:bg-orange-950/40',
    border: 'border-orange-600 dark:border-orange-700',
    icon: 'text-orange-700 dark:text-orange-300'
  },
  silver: {
    bg: 'bg-gray-100 dark:bg-gray-900/40',
    border: 'border-gray-400 dark:border-gray-500',
    icon: 'text-gray-600 dark:text-gray-300'
  },
  platinum: {
    bg: 'bg-slate-100 dark:bg-slate-900/40',
    border: 'border-slate-400 dark:border-slate-500',
    icon: 'text-slate-600 dark:text-slate-300'
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
        <TooltipContent side="bottom" className="max-w-xs p-0">
          <div className="space-y-2 p-3">
            <div className="flex items-center gap-2">
              <Icon className={cn(
                "h-4 w-4",
                isEarned ? (colorMap[badge.color]?.icon || colorMap.blue.icon) : 'text-gray-400 dark:text-gray-400'
              )} />
              <p className="font-semibold text-sm">{badge.name}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{badge.description}</p>
            {badge.progress && badge.progress < 100 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium">Progress</p>
                  <p className={cn(
                    "text-xs font-semibold",
                    colorMap[badge.color]?.icon || 'text-blue-500 dark:text-blue-400'
                  )}>
                    {Math.round(badge.progress)}%
                  </p>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      colorMap[badge.color]?.bg || 'bg-blue-500'
                    )}
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
              </div>
            )}
            {badge.earnedAt && (
              <p className="text-xs text-muted-foreground pt-1 border-t">
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