'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAchievementCelebration } from '@/hooks/use-achievement-celebration'
import { Trophy, Flame, Target, Zap, Star, Award } from 'lucide-react'

const testBadges = [
  {
    id: '1',
    name: 'First Step',
    description: 'Complete your first workout',
    icon: 'trophy',
    rarity: 'common' as const,
    category: 'milestone',
  },
  {
    id: '2',
    name: 'Week Warrior',
    description: 'Complete 7 workouts in a week',
    icon: 'star',
    rarity: 'rare' as const,
    category: 'consistency',
  },
  {
    id: '3',
    name: 'Unstoppable Force',
    description: 'Achieve a 30-day streak',
    icon: 'flame',
    rarity: 'epic' as const,
    category: 'streak',
  },
  {
    id: '4',
    name: 'Iron Will',
    description: 'Reach 100 total workouts',
    icon: 'zap',
    rarity: 'legendary' as const,
    category: 'milestone',
  },
]

export default function TestCelebrationsPage() {
  const { celebrate } = useAchievementCelebration()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Achievement Celebrations</h1>
        <p className="text-muted-foreground">Click on badges to see the celebration animations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {testBadges.map((badge) => (
          <Card
            key={badge.id}
            className="card-interactive hover-lift cursor-pointer"
            onClick={() => celebrate(badge)}
          >
            <CardHeader>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                badge.rarity === 'legendary' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                badge.rarity === 'epic' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                badge.rarity === 'rare' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                'bg-gradient-to-br from-gray-400 to-gray-600'
              }`}>
                {badge.icon === 'trophy' && <Trophy className="w-6 h-6 text-white" />}
                {badge.icon === 'star' && <Star className="w-6 h-6 text-white" />}
                {badge.icon === 'flame' && <Flame className="w-6 h-6 text-white" />}
                {badge.icon === 'zap' && <Zap className="w-6 h-6 text-white" />}
              </div>
              <CardTitle className="text-lg">{badge.name}</CardTitle>
              <CardDescription>{badge.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                badge.rarity === 'legendary' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                badge.rarity === 'epic' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                badge.rarity === 'rare' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
              }`}>
                {badge.rarity.toUpperCase()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="card-glass">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>The achievement celebration system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Rarity Levels</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <span className="text-gray-600 font-medium">Common</span> - Basic achievements with simple animation</li>
              <li>• <span className="text-blue-600 font-medium">Rare</span> - Harder to earn with enhanced effects</li>
              <li>• <span className="text-purple-600 font-medium">Epic</span> - Challenging milestones with special animations</li>
              <li>• <span className="text-amber-600 font-medium">Legendary</span> - Ultimate achievements with full celebration</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Confetti effects scaled by rarity</li>
              <li>• Animated badge reveal with spring physics</li>
              <li>• Glowing effects for higher rarities</li>
              <li>• Queue system for multiple achievements</li>
              <li>• Auto-dismiss after 5 seconds</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}