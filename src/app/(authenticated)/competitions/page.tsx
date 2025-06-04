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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          Competitions & Challenges
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Track your progress, compete in challenges, and climb the leaderboard
        </p>
      </div>
      
      {/* Points Overview */}
      <PointsDisplay variant="full" />
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="challenges" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-11">
          <TabsTrigger value="challenges" className="gap-2 data-[state=active]:bg-primary/10">
            <Target className="h-4 w-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="competition" className="gap-2 data-[state=active]:bg-primary/10">
            <Calendar className="h-4 w-4" />
            Competition
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2 data-[state=active]:bg-primary/10">
            <Medal className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="challenges" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Active Challenges</h2>
            <p className="text-muted-foreground mt-2">
              Join challenges to earn bonus points and push your limits
            </p>
          </div>
          <ChallengesList />
        </TabsContent>
        
        <TabsContent value="competition" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Monthly Competition</h2>
            <p className="text-muted-foreground mt-2">
              Compete against the community for monthly glory and prizes
            </p>
          </div>
          <SeasonalCompetition />
        </TabsContent>
        
        <TabsContent value="leaderboard" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Global Rankings</h2>
            <p className="text-muted-foreground mt-2">
              See how you stack up against other athletes in the community
            </p>
          </div>
          <Leaderboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}