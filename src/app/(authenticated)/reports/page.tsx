'use client'

import { ProgressReport } from '@/components/reports/progress-report'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Progress Reports</h1>
        <p className="text-muted-foreground">Track your fitness journey with detailed analytics</p>
      </div>
      
      <ProgressReport />
    </div>
  )
}