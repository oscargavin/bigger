'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkoutPatterns } from './workout-patterns'
import { ProgressSummaryCard } from './progress-summary'
import { WeaknessesDisplay } from './weaknesses-display'
import { PersonalizedGoals } from './personalized-goals'
import { Brain, RefreshCw, Sparkles } from 'lucide-react'
import type { SmartInsights } from '@/server/services/ai-smart-insights-service'

interface InsightsDashboardProps {
  insights: SmartInsights | null
  loading?: boolean
  onRegenerate?: () => void
  onSaveGoals?: (goals: any[]) => Promise<void>
}

export function InsightsDashboard({ 
  insights, 
  loading, 
  onRegenerate,
  onSaveGoals 
}: InsightsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Analyzing your fitness data...</p>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">No insights available yet</p>
            {onRegenerate && (
              <Button onClick={onRegenerate} variant="outline">
                Generate Insights
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Smart Insights</h2>
          <p className="text-muted-foreground">
            AI-powered analysis of your fitness journey
          </p>
        </div>
        {onRegenerate && (
          <Button onClick={onRegenerate} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>

      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Overall Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {insights.overallAnalysis}
          </p>
          {insights.motivationalMessage && (
            <div className="mt-4 p-4 bg-background rounded-lg border">
              <p className="text-sm font-medium italic">
                &ldquo;{insights.motivationalMessage}&rdquo;
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="weaknesses">Weaknesses</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <WorkoutPatterns patterns={insights.workoutPatterns} />
            <ProgressSummaryCard summary={insights.progressSummary} />
          </div>
          
          {insights.nextSteps && insights.nextSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>Immediate actions to take</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary font-medium">{index + 1}.</span>
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="patterns">
          <WorkoutPatterns patterns={insights.workoutPatterns} />
        </TabsContent>

        <TabsContent value="weaknesses">
          <WeaknessesDisplay weaknesses={insights.weaknesses} />
        </TabsContent>

        <TabsContent value="goals">
          <PersonalizedGoals 
            goals={insights.goals} 
            onSaveGoals={onSaveGoals}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}