'use client'

import { useState } from 'react'
import { api } from '@/utils/api'
import { InsightsDashboard } from '@/components/insights'
import { useToast } from '@/hooks/use-toast'

export default function InsightsPage() {
  const { toast } = useToast()
  const [regenerating, setRegenerating] = useState(false)

  const { data: insights, isLoading, refetch } = api.insights.getSmartInsights.useQuery({
    regenerate: false,
  })

  const saveGoalsMutation = api.insights.saveGoals.useMutation({
    onSuccess: () => {
      toast({
        title: 'Goals Saved',
        description: 'Your personalized goals have been saved successfully.',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save goals. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await refetch()
      toast({
        title: 'Insights Refreshed',
        description: 'Your insights have been updated with the latest data.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh insights. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setRegenerating(false)
    }
  }

  const handleSaveGoals = async (goals: any[]) => {
    await saveGoalsMutation.mutateAsync({ goals })
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <InsightsDashboard
        insights={insights || null}
        loading={isLoading || regenerating}
        onRegenerate={handleRegenerate}
        onSaveGoals={handleSaveGoals}
      />
    </div>
  )
}