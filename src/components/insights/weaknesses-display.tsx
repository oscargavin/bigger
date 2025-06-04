'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { Weakness } from '@/server/services/ai-smart-insights-service'

interface WeaknessesDisplayProps {
  weaknesses: Weakness[]
}

export function WeaknessesDisplay({ weaknesses }: WeaknessesDisplayProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'moderate':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200'
      case 'moderate':
        return 'bg-amber-50 border-amber-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getSeverityBadgeVariant = (severity: string): "destructive" | "secondary" | "default" => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'moderate':
        return 'secondary'
      default:
        return 'default'
    }
  }

  if (weaknesses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Areas for Improvement</CardTitle>
          <CardDescription>Great job! No significant weaknesses identified.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Areas for Improvement</CardTitle>
        <CardDescription>
          Focus on these areas to accelerate your progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {weaknesses.map((weakness, index) => (
          <div
            key={index}
            className={`rounded-lg border p-4 space-y-3 ${getSeverityColor(weakness.severity)}`}
          >
            <div className="flex items-start gap-3">
              {getSeverityIcon(weakness.severity)}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold capitalize">{weakness.type}</h4>
                  <Badge variant={getSeverityBadgeVariant(weakness.severity)}>
                    {weakness.severity}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Priority {weakness.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{weakness.description}</p>
                
                <div className="space-y-2 pt-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Impact</p>
                    <p className="text-sm text-muted-foreground">{weakness.impact}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Recommendation</p>
                    <p className="text-sm">{weakness.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}