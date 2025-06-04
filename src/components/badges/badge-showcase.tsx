'use client'

import { useState } from 'react'
import { api } from '@/utils/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BadgeDisplay, BadgeGrid } from './badge-display'
import { Trophy, Target, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BadgeShowcase() {
  const { data: userBadges } = api.badges.getUserBadges.useQuery({})
  const { data: badgeProgress } = api.badges.getBadgeProgress.useQuery()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', label: 'All Badges' },
    { id: 'strength', label: 'Strength' },
    { id: 'consistency', label: 'Consistency' },
    { id: 'volume', label: 'Volume' },
    { id: 'milestone', label: 'Milestones' },
  ]

  const filteredBadges = badgeProgress?.filter(badge => 
    selectedCategory === 'all' || badge.category === selectedCategory
  ) || []

  const earnedBadges = filteredBadges.filter(b => b.earned)
  const inProgressBadges = filteredBadges.filter(b => !b.earned && b.progress > 0)
  const lockedBadges = filteredBadges.filter(b => !b.earned && b.progress === 0)

  const totalBadges = badgeProgress?.length || 0
  const totalEarned = badgeProgress?.filter(b => b.earned).length || 0
  const completionPercentage = totalBadges > 0 ? (totalEarned / totalBadges) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="card-elevated hover-lift overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent dark:from-amber-400/10" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Your Achievements</CardTitle>
              <CardDescription>Unlock badges by reaching fitness milestones</CardDescription>
            </div>
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-3 ring-1 ring-amber-200 dark:ring-amber-800">
              <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{totalEarned} / {totalBadges} badges</span>
          </div>
          <Progress value={completionPercentage} className="h-3" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-br from-amber-600 to-amber-500 dark:from-amber-400 dark:to-amber-300 bg-clip-text text-transparent">
                {earnedBadges.length}
              </div>
              <p className="text-xs text-muted-foreground">Earned</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {inProgressBadges.length}
              </div>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {lockedBadges.length}
              </div>
              <p className="text-xs text-muted-foreground">Locked</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-6 mt-6">
          {/* Earned Badges */}
          {earnedBadges.length > 0 && (
            <Card className="card-glass border-2 border-border/50 shadow-soft-xl">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <CardTitle className="text-lg">Earned Badges</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <BadgeGrid badges={earnedBadges} />
              </CardContent>
            </Card>
          )}

          {/* In Progress Badges */}
          {inProgressBadges.length > 0 && (
            <Card className="card-interactive border-2 border-border dark:border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  <CardTitle className="text-lg">In Progress</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <BadgeGrid badges={inProgressBadges} />
              </CardContent>
            </Card>
          )}

          {/* Locked Badges */}
          {lockedBadges.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <CardTitle className="text-lg">Locked Badges</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <BadgeGrid badges={lockedBadges} size="sm" />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface BadgeNotificationProps {
  badge: {
    name: string
    description: string
    icon: string
    color: string
    rarity: string
  }
}

export function BadgeNotification({ badge }: BadgeNotificationProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <Card className={cn(
        "w-80 border-2",
        badge.rarity === 'legendary' && 'border-yellow-500 shadow-xl shadow-yellow-500/20',
        badge.rarity === 'epic' && 'border-purple-500 shadow-lg shadow-purple-500/20',
        badge.rarity === 'rare' && 'border-blue-500 shadow-lg shadow-blue-500/20',
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <BadgeDisplay 
              badge={{
                id: 'new',
                ...badge,
                category: 'achievement',
                earned: true,
              }} 
              size="sm" 
              showProgress={false}
            />
            <div>
              <CardTitle className="text-lg">Achievement Unlocked!</CardTitle>
              <CardDescription>{badge.name}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{badge.description}</p>
        </CardContent>
      </Card>
    </div>
  )
}