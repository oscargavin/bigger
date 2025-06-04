'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, Target, Zap, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { format } from 'date-fns'
import type { PersonalizedGoal } from '@/server/services/ai-smart-insights-service'

interface PersonalizedGoalsProps {
  goals: PersonalizedGoal[]
  onSaveGoals?: (goals: PersonalizedGoal[]) => Promise<void>
}

export function PersonalizedGoals({ goals, onSaveGoals }: PersonalizedGoalsProps) {
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)

  const toggleGoal = (index: number) => {
    const newExpanded = new Set(expandedGoals)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedGoals(newExpanded)
  }

  const handleSaveGoals = async () => {
    if (!onSaveGoals) return
    setSaving(true)
    try {
      await onSaveGoals(goals)
    } finally {
      setSaving(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'short-term':
        return 'bg-blue-500'
      case 'medium-term':
        return 'bg-purple-500'
      case 'long-term':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength':
        return '💪'
      case 'endurance':
        return '🏃'
      case 'consistency':
        return '📅'
      case 'body-composition':
        return '⚖️'
      case 'skill':
        return '🎯'
      default:
        return '🎯'
    }
  }

  const getDifficultyColor = (difficulty: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (difficulty) {
      case 'easy':
        return 'secondary'
      case 'moderate':
        return 'default'
      case 'challenging':
        return 'destructive'
      case 'stretch':
        return 'outline'
      default:
        return 'default'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Personalized Goals</CardTitle>
            <CardDescription>
              AI-generated goals tailored to your progress and needs
            </CardDescription>
          </div>
          {onSaveGoals && (
            <Button
              onClick={handleSaveGoals}
              disabled={saving}
              size="sm"
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Goals'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal, index) => (
          <div
            key={index}
            className="border rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleGoal(index)}
              className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getCategoryIcon(goal.category)}</div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{goal.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {goal.type}
                    </Badge>
                    <Badge variant={getDifficultyColor(goal.estimatedDifficulty)} className="text-xs">
                      {goal.estimatedDifficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {goal.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(goal.targetDate, 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>{goal.milestones.length} milestones</span>
                    </div>
                  </div>
                </div>
                <div className="text-muted-foreground">
                  {expandedGoals.has(index) ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
            </button>

            {expandedGoals.has(index) && (
              <div className="border-t p-4 space-y-4 bg-muted/20">
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Success Criteria</h5>
                  <p className="text-sm text-muted-foreground">{goal.successCriteria}</p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Milestones</h5>
                  <div className="space-y-3">
                    {goal.milestones.map((milestone, mIndex) => (
                      <div key={mIndex} className="flex items-start gap-3">
                        <div className={`h-2 w-2 rounded-full mt-1.5 ${getTypeColor(goal.type)}`} />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm">{milestone.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{format(milestone.targetDate, 'MMM d')}</span>
                            <span>•</span>
                            <span>{milestone.metric}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Action Plan</h5>
                  <ul className="space-y-1">
                    {goal.actionPlan.map((action, aIndex) => (
                      <li key={aIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Zap className="h-3 w-3 mt-0.5 text-amber-600" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}