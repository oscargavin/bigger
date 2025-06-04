'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  PointsDisplay, 
  ChallengesList, 
  SeasonalCompetition, 
  Leaderboard 
} from '@/components/gamification'
import { 
  Trophy, 
  Target, 
  Calendar, 
  Medal 
} from 'lucide-react'

export default function GamificationPage() {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Gamification Hub
        </h1>
        <p className="text-muted-foreground">
          Track your progress, compete in challenges, and climb the leaderboard!
        </p>
      </div>
      
      {/* Points Overview */}
      <PointsDisplay variant="full" />
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="challenges" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="challenges" className="gap-2">
            <Target className="h-4 w-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="competition" className="gap-2">
            <Calendar className="h-4 w-4" />
            Monthly Competition
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Medal className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="challenges" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Active Challenges</h2>
            <p className="text-muted-foreground mb-6">
              Join challenges to earn bonus points and push your limits!
            </p>
            <ChallengesList />
          </div>
        </TabsContent>
        
        <TabsContent value="competition" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Monthly Competition</h2>
            <p className="text-muted-foreground mb-6">
              Compete against the community for monthly glory and prizes!
            </p>
            <SeasonalCompetition />
          </div>
        </TabsContent>
        
        <TabsContent value="leaderboard" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Global Rankings</h2>
            <p className="text-muted-foreground mb-6">
              See how you stack up against other athletes in the community!
            </p>
            <Leaderboard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}