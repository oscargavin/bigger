'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Target, 
  Users, 
  Clock, 
  Zap,
  Dumbbell,
  CheckCircle,
  Plus
} from 'lucide-react'
import { api } from '@/utils/api'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface ChallengesListProps {
  className?: string
}

export function ChallengesList({ className }: ChallengesListProps) {
  const { toast } = useToast()
  const { data: challenges, isLoading, refetch } = api.gamification.getActiveChallenges.useQuery()
  const joinChallenge = api.gamification.joinChallenge.useMutation({
    onSuccess: () => {
      toast({
        title: 'Challenge joined!',
        description: 'Good luck on your challenge!',
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Failed to join challenge',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
  
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="p-6 space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    )
  }
  
  if (!challenges || challenges.length === 0) {
    return (
      <Card className={cn('text-center p-8', className)}>
        <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Active Challenges</h3>
        <p className="text-muted-foreground">Check back soon for new challenges!</p>
      </Card>
    )
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {challenges.map((challenge) => (
        <ChallengeCard 
          key={challenge.id} 
          challenge={challenge}
          onJoin={() => joinChallenge.mutate({ challengeId: challenge.id })}
          isJoining={joinChallenge.isLoading}
        />
      ))}
    </div>
  )
}

interface ChallengeCardProps {
  challenge: any
  onJoin: () => void
  isJoining: boolean
}

function ChallengeCard({ challenge, onJoin, isJoining }: ChallengeCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength':
        return <Dumbbell className="h-5 w-5" />
      case 'consistency':
        return <Target className="h-5 w-5" />
      case 'endurance':
        return <Clock className="h-5 w-5" />
      default:
        return <Trophy className="h-5 w-5" />
    }
  }
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength':
        return 'from-red-500 to-orange-500'
      case 'consistency':
        return 'from-blue-500 to-cyan-500'
      case 'endurance':
        return 'from-green-500 to-emerald-500'
      default:
        return 'from-purple-500 to-pink-500'
    }
  }
  
  const getProgress = () => {
    if (!challenge.userProgress) return 0
    
    switch (challenge.challengeType) {
      case 'consistency':
        return (challenge.userProgress.workoutCount / challenge.requirements.workout_count) * 100
      case 'volume':
        return (challenge.userProgress.totalVolume / challenge.requirements.total_volume) * 100
      default:
        return challenge.userProgress.completed ? 100 : 0
    }
  }
  
  const progress = getProgress()
  const isCompleted = challenge.userProgress?.completed
  
  return (
    <Card className="card-interactive overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-3 rounded-xl shadow-lg bg-gradient-to-br',
              getCategoryColor(challenge.category)
            )}>
              <span className="text-2xl text-white">{challenge.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {challenge.name}
                {isCompleted && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </h3>
              <p className="text-sm text-muted-foreground">{challenge.description}</p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              'gap-1',
              challenge.tier === 'platinum' && 'border-purple-500 text-purple-500',
              challenge.tier === 'gold' && 'border-yellow-500 text-yellow-500',
              challenge.tier === 'silver' && 'border-gray-500 text-gray-500',
              challenge.tier === 'bronze' && 'border-orange-500 text-orange-500'
            )}
          >
            {getCategoryIcon(challenge.category)}
            {challenge.category}
          </Badge>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">
              <span className="font-semibold">{challenge.pointsReward}</span> pts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              <span className="font-semibold">{challenge.participantCount}</span> joined
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <span className="text-sm">
              {formatDistanceToNow(new Date(challenge.endDate), { addSuffix: true })}
            </span>
          </div>
        </div>
        
        {/* Progress or Join Button */}
        {challenge.isJoined ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            {challenge.userProgress && !isCompleted && (
              <p className="text-xs text-muted-foreground mt-1">
                {getProgressText(challenge)}
              </p>
            )}
          </div>
        ) : (
          <Button 
            onClick={onJoin}
            disabled={isJoining}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Join Challenge
          </Button>
        )}
        
        {/* Comeback Bonus Indicator */}
        {challenge.comebackEnabled && challenge.isJoined && !isCompleted && (
          <div className="text-xs text-muted-foreground italic">
            💡 Comeback bonuses available if you fall behind
          </div>
        )}
      </div>
    </Card>
  )
}

function getProgressText(challenge: any): string {
  const progress = challenge.userProgress
  
  switch (challenge.challengeType) {
    case 'consistency':
      return `${progress.workoutCount || 0} / ${challenge.requirements.workout_count} workouts completed`
    case 'volume':
      const current = Math.round(progress.totalVolume || 0)
      const target = challenge.requirements.total_volume
      return `${current.toLocaleString()} / ${target.toLocaleString()} lbs lifted`
    case 'bodyweight_lift':
      return `Lift ${challenge.requirements.multiplier}x bodyweight for ${challenge.requirements.reps} reps`
    default:
      return 'Keep going!'
  }
}