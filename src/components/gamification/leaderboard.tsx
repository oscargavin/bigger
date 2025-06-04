'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// Avatar component removed - using custom implementation
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Medal,
  Crown,
  TrendingUp,
  Zap,
  Star
} from 'lucide-react'
import { api } from '@/utils/api'
import { cn } from '@/lib/utils'

interface LeaderboardProps {
  className?: string
}

export function Leaderboard({ className }: LeaderboardProps) {
  const [period, setPeriod] = useState<'all_time' | 'monthly' | 'weekly'>('all_time')
  
  const { data: leaderboard, isLoading } = api.gamification.getLeaderboard.useQuery({
    period,
    limit: 20,
  })
  
  const { data: userStats } = api.gamification.getUserStats.useQuery()
  
  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </Card>
    )
  }
  
  return (
    <Card className={cn('card-glass', className)}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Leaderboard
          </h2>
          <Badge variant="outline" className="gap-1">
            <Star className="h-3 w-3" />
            Top {leaderboard?.length || 0} Athletes
          </Badge>
        </div>
        
        {/* Period Tabs */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all_time">All Time</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
            <TabsTrigger value="weekly">This Week</TabsTrigger>
          </TabsList>
          
          <TabsContent value={period} className="mt-6 space-y-4">
            {/* Top 3 Podium */}
            {leaderboard && leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                <div className="pt-8">
                  <PodiumCard
                    entry={leaderboard[1]}
                    rank={2}
                    isCurrentUser={leaderboard[1].userId === userStats?.userId}
                  />
                </div>
                
                {/* 1st Place */}
                <div>
                  <PodiumCard
                    entry={leaderboard[0]}
                    rank={1}
                    isCurrentUser={leaderboard[0].userId === userStats?.userId}
                  />
                </div>
                
                {/* 3rd Place */}
                <div className="pt-12">
                  <PodiumCard
                    entry={leaderboard[2]}
                    rank={3}
                    isCurrentUser={leaderboard[2].userId === userStats?.userId}
                  />
                </div>
              </div>
            )}
            
            {/* Rest of Leaderboard */}
            <div className="space-y-2">
              {leaderboard?.slice(3).map((entry) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={entry.userId === userStats?.userId}
                />
              ))}
            </div>
            
            {/* User's Position if not in top */}
            {userStats && userStats.rank && userStats.rank > 20 && (
              <div className="pt-4 border-t">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 ring-2 ring-blue-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">#{userStats.rank}</span>
                      <div>
                        <p className="font-medium">Your Position</p>
                        <p className="text-sm text-muted-foreground">
                          Keep grinding to climb the ranks!
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {userStats?.[period === 'weekly' ? 'weeklyPoints' : period === 'monthly' ? 'monthlyPoints' : 'totalPoints']?.toLocaleString() || '0'}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  )
}

interface PodiumCardProps {
  entry: any
  rank: number
  isCurrentUser: boolean
}

function PodiumCard({ entry, rank, isCurrentUser }: PodiumCardProps) {
  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Medal className="h-6 w-6 text-orange-600" />
    }
  }
  
  const getRankColor = () => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-amber-500'
      case 2:
        return 'from-gray-300 to-gray-400'
      case 3:
        return 'from-orange-400 to-orange-500'
    }
  }
  
  return (
    <div 
      className={cn(
        'relative text-center space-y-3 p-4 rounded-xl',
        isCurrentUser && 'ring-2 ring-blue-500'
      )}
    >
      {/* Rank Icon */}
      <div className="flex justify-center mb-2">
        {getRankIcon()}
      </div>
      
      {/* Avatar */}
      <div className="relative inline-block">
        <div className={cn(
          'h-20 w-20 rounded-full overflow-hidden ring-4 flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-br',
          getRankColor(),
          rank === 1 && 'ring-yellow-400',
          rank === 2 && 'ring-gray-300',
          rank === 3 && 'ring-orange-400'
        )}>
          {entry.avatarUrl ? (
            <Image src={entry.avatarUrl} alt={entry.fullName} className="w-full h-full object-cover" fill sizes="80px" />
          ) : (
            entry.fullName[0]
          )}
        </div>
        <div className={cn(
          'absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br',
          getRankColor()
        )}>
          {rank}
        </div>
      </div>
      
      {/* Name & Stats */}
      <div>
        <p className="font-semibold truncate">{entry.fullName}</p>
        <p className="text-xs text-muted-foreground">@{entry.username}</p>
      </div>
      
      <div className="pt-2">
        <p className={cn(
          'text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
          getRankColor()
        )}>
          {entry.points.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">points</p>
      </div>
      
      {/* Level Badge */}
      <Badge variant="secondary" className="gap-1">
        <Zap className="h-3 w-3" />
        Level {entry.level}
      </Badge>
    </div>
  )
}

interface LeaderboardRowProps {
  entry: any
  isCurrentUser: boolean
}

function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-lg card-elevated transition-all hover:scale-[1.02]',
      isCurrentUser && 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20'
    )}>
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-muted-foreground w-12">
          #{entry.rank}
        </span>
        <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
          {entry.avatarUrl ? (
            <Image src={entry.avatarUrl} alt={entry.fullName} className="w-full h-full object-cover" fill sizes="80px" />
          ) : (
            entry.fullName[0]
          )}
        </div>
        <div>
          <p className="font-medium">{entry.fullName}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>@{entry.username}</span>
            <span>•</span>
            <span>Level {entry.level}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xl font-bold">{entry.points.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">points</p>
        </div>
        <TrendingUp className="h-5 w-5 text-green-500" />
      </div>
    </div>
  )
}