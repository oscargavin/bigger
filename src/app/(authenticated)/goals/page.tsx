'use client'

import { GoalList } from '@/components/goals/goal-list'

export default function GoalsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Your Goals</h1>
        <p className="text-lg text-muted-foreground mt-2">Set targets and track your fitness journey</p>
      </div>

      <GoalList />
    </div>
  )
}