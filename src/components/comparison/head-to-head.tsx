'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, Flame, Calendar, Target, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserStats {
  id: string
  username: string
  fullName: string
  currentStreak: number
  longestStreak: number
  weeklyWorkouts: number
  monthlyWorkouts: number
  totalWorkouts: number
  lastWorkoutDate: string | null
}

interface HeadToHeadProps {
  user: UserStats
  partner: UserStats
}

export function HeadToHead({ user, partner }: HeadToHeadProps) {
  // Calculate who's winning in each category
  const compareStats = (userVal: number, partnerVal: number) => {
    if (userVal > partnerVal) return 'user'
    if (partnerVal > userVal) return 'partner'
    return 'tie'
  }

  const streakWinner = compareStats(user.currentStreak, partner.currentStreak)
  const weeklyWinner = compareStats(user.weeklyWorkouts, partner.weeklyWorkouts)
  const monthlyWinner = compareStats(user.monthlyWorkouts, partner.monthlyWorkouts)
  const totalWinner = compareStats(user.totalWorkouts, partner.totalWorkouts)

  // Calculate overall winner (most categories won)
  const wins = {
    user: [streakWinner, weeklyWinner, monthlyWinner, totalWinner].filter(w => w === 'user').length,
    partner: [streakWinner, weeklyWinner, monthlyWinner, totalWinner].filter(w => w === 'partner').length,
  }

  const overallWinner = wins.user > wins.partner ? 'user' : wins.partner > wins.user ? 'partner' : 'tie'

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Head-to-Head Competition</h2>
        {overallWinner === 'tie' ? (
          <p className="text-muted-foreground">You&apos;re neck and neck!</p>
        ) : (
          <p className="text-muted-foreground">
            <span className={cn('font-semibold', overallWinner === 'user' ? 'text-green-600' : 'text-red-600')}>
              {overallWinner === 'user' ? "You're" : partner.username + ' is'} currently in the lead!
            </span>
          </p>
        )}
      </div>

      {/* User Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* User Card */}
        <Card className={cn(
          "relative",
          overallWinner === 'user' && "ring-2 ring-green-500"
        )}>
          {overallWinner === 'user' && (
            <Badge className="absolute -top-2 -right-2 bg-green-500">Leading</Badge>
          )}
          <CardHeader>
            <CardTitle>{user.fullName}</CardTitle>
            <CardDescription>@{user.username}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatRow
              icon={<Flame className="h-4 w-4" />}
              label="Current Streak"
              value={`${user.currentStreak} days`}
              isWinner={streakWinner === 'user'}
            />
            <StatRow
              icon={<Calendar className="h-4 w-4" />}
              label="This Week"
              value={`${user.weeklyWorkouts} workouts`}
              isWinner={weeklyWinner === 'user'}
            />
            <StatRow
              icon={<Target className="h-4 w-4" />}
              label="This Month"
              value={`${user.monthlyWorkouts} workouts`}
              isWinner={monthlyWinner === 'user'}
            />
            <StatRow
              icon={<Award className="h-4 w-4" />}
              label="Total"
              value={`${user.totalWorkouts} workouts`}
              isWinner={totalWinner === 'user'}
            />
          </CardContent>
        </Card>

        {/* Partner Card */}
        <Card className={cn(
          "relative",
          overallWinner === 'partner' && "ring-2 ring-green-500"
        )}>
          {overallWinner === 'partner' && (
            <Badge className="absolute -top-2 -right-2 bg-green-500">Leading</Badge>
          )}
          <CardHeader>
            <CardTitle>{partner.fullName}</CardTitle>
            <CardDescription>@{partner.username}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatRow
              icon={<Flame className="h-4 w-4" />}
              label="Current Streak"
              value={`${partner.currentStreak} days`}
              isWinner={streakWinner === 'partner'}
            />
            <StatRow
              icon={<Calendar className="h-4 w-4" />}
              label="This Week"
              value={`${partner.weeklyWorkouts} workouts`}
              isWinner={weeklyWinner === 'partner'}
            />
            <StatRow
              icon={<Target className="h-4 w-4" />}
              label="This Month"
              value={`${partner.monthlyWorkouts} workouts`}
              isWinner={monthlyWinner === 'partner'}
            />
            <StatRow
              icon={<Award className="h-4 w-4" />}
              label="Total"
              value={`${partner.totalWorkouts} workouts`}
              isWinner={totalWinner === 'partner'}
            />
          </CardContent>
        </Card>
      </div>

      {/* Comparison Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Progress Comparison</CardTitle>
          <CardDescription>Who&apos;s putting in more work this week?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ComparisonBar
            label="Current Streak"
            userValue={user.currentStreak}
            partnerValue={partner.currentStreak}
            maxValue={Math.max(user.currentStreak, partner.currentStreak, 7)}
            unit="days"
          />
          <ComparisonBar
            label="Weekly Workouts"
            userValue={user.weeklyWorkouts}
            partnerValue={partner.weeklyWorkouts}
            maxValue={7}
            unit="workouts"
          />
          <ComparisonBar
            label="Monthly Workouts"
            userValue={user.monthlyWorkouts}
            partnerValue={partner.monthlyWorkouts}
            maxValue={30}
            unit="workouts"
          />
        </CardContent>
      </Card>
    </div>
  )
}

interface StatRowProps {
  icon: React.ReactNode
  label: string
  value: string
  isWinner: boolean
}

function StatRow({ icon, label, value, isWinner }: StatRowProps) {
  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-md",
      isWinner && "bg-green-50 dark:bg-green-950"
    )}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{value}</span>
        {isWinner && <Trophy className="h-4 w-4 text-green-600" />}
      </div>
    </div>
  )
}

interface ComparisonBarProps {
  label: string
  userValue: number
  partnerValue: number
  maxValue: number
  unit: string
}

function ComparisonBar({ label, userValue, partnerValue, maxValue, unit }: ComparisonBarProps) {
  const userPercentage = maxValue > 0 ? (userValue / maxValue) * 100 : 0
  const partnerPercentage = maxValue > 0 ? (partnerValue / maxValue) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {userValue} vs {partnerValue} {unit}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs w-16">You</span>
          <Progress value={userPercentage} className="flex-1" />
          <span className="text-xs w-8 text-right">{userValue}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-16">Partner</span>
          <Progress value={partnerPercentage} className="flex-1" />
          <span className="text-xs w-8 text-right">{partnerValue}</span>
        </div>
      </div>
    </div>
  )
}