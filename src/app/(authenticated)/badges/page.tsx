'use client'

import { BadgeShowcase } from '@/components/badges/badge-showcase'

export default function BadgesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Achievements</h1>
        <p className="text-muted-foreground">Track your fitness milestones and unlock rewards</p>
      </div>
      
      <BadgeShowcase />
    </div>
  )
}