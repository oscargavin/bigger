'use client'

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// Avatar component removed - using custom implementation
import { 
  Trophy, 
  Calendar,
  Users,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { api } from '@/utils/api'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface SeasonalCompetitionProps {
  className?: string
}

export function SeasonalCompetition({ className }: SeasonalCompetitionProps) {
  const { toast } = useToast()
  const { data: competition, isLoading, refetch } = api.gamification.getCurrentSeasonalCompetition.useQuery()
  const joinCompetition = api.gamification.joinSeasonalCompetition.useMutation({
    onSuccess: () => {
      toast({
        title: 'Joined competition!',
        description: 'May the best athlete win!',
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Failed to join',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
  
  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <div className="p-6 space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </Card>
    )
  }
  
  if (!competition) {
    return (
      <Card className={cn('text-center p-8', className)}>
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Active Competition</h3>
        <p className="text-muted-foreground">Check back next month!</p>
      </Card>
    )
  }
  
  const isJoined = !!competition.userParticipation
  const userRank = competition.leaderboard.findIndex(
    entry => entry.userId === competition.userParticipation?.userId
  ) + 1
  
  return (
    <Card 
      className={cn('card-glass overflow-hidden', className)}
      style={{
        background: `linear-gradient(135deg, ${competition.color}20 0%, transparent 100%)`,
      }}
    >
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-4 rounded-2xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${competition.color} 0%, ${competition.color}CC 100%)`,
              }}
            >
              <span className="text-3xl">{competition.icon}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{competition.name}</h2>
              <p className="text-muted-foreground">{competition.theme}</p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className="gap-1" 
            style={{ borderColor: competition.color, color: competition.color }}
          >
            <Sparkles className="h-3 w-3" />
            Active
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">{competition.description}</p>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              <span className="font-semibold">{competition.participants.length}</span> competing
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-500" />
            <span className="text-sm">
              Ends {new Date(competition.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      
      {/* User Status / Join */}
      {isJoined ? (
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Position</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <span className="text-2xl font-bold">#{userRank || '-'}</span>
                </div>
                <div className="text-sm">
                  <p className="font-semibold">
                    {competition.userParticipation?.pointsEarned || 0} points
                  </p>
                  {competition.userParticipation && 
                   typeof competition.userParticipation.comebackMultiplier === 'number' && 
                   competition.userParticipation.comebackMultiplier > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      {competition.userParticipation.comebackMultiplier}x comeback bonus
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Progress
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6 border-b bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold mb-1">Join the competition!</p>
              <p className="text-sm text-muted-foreground">
                Compete for glory and prizes this month
              </p>
            </div>
            <Button 
              onClick={() => joinCompetition.mutate({ competitionId: competition.id })}
              disabled={joinCompetition.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Join Now
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Leaderboard */}
      <div className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Top Competitors
        </h3>
        <div className="space-y-3">
          {competition.leaderboard.slice(0, 5).map((entry, index) => (
            <LeaderboardEntry 
              key={entry.userId}
              entry={entry}
              rank={index + 1}
              isCurrentUser={entry.userId === competition.userParticipation?.userId}
              themeColor={competition.color}
            />
          ))}
        </div>
        
        {competition.leaderboard.length > 5 && (
          <Button 
            variant="ghost" 
            className="w-full mt-4"
            onClick={() => {/* Navigate to full leaderboard */}}
          >
            View Full Leaderboard
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
      
      {/* Scoring Rules */}
      <div className="p-6 border-t bg-muted/20">
        <h4 className="text-sm font-semibold mb-2">How to Earn Points</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {competition.scoringRules && typeof competition.scoringRules === 'object' ? 
           Object.entries(competition.scoringRules).slice(0, 4).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: competition.color }} />
              <span className="capitalize">{key.replace(/_/g, ' ')}: {JSON.stringify(value)}</span>
            </div>
          )) : null}
        </div>
      </div>
    </Card>
  )
}

interface LeaderboardEntryProps {
  entry: any
  rank: number
  isCurrentUser: boolean
  themeColor: string
}

function LeaderboardEntry({ entry, rank, isCurrentUser, themeColor }: LeaderboardEntryProps) {
  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return null
    }
  }
  
  return (
    <div 
      className={cn(
        'flex items-center justify-between p-3 rounded-lg transition-colors',
        isCurrentUser && 'bg-blue-50 dark:bg-blue-950/20 ring-2 ring-blue-500'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8">
          {getRankIcon() || <span className="font-semibold text-muted-foreground">#{rank}</span>}
        </div>
        <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold relative">
          {entry.avatarUrl ? (
            <Image src={entry.avatarUrl} alt={entry.fullName} className="w-full h-full object-cover" fill sizes="32px" />
          ) : (
            entry.fullName[0]
          )}
        </div>
        <div>
          <p className="font-medium text-sm">{entry.fullName}</p>
          <p className="text-xs text-muted-foreground">@{entry.username}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold" style={{ color: themeColor }}>
          {entry.points.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">points</p>
      </div>
    </div>
  )
}