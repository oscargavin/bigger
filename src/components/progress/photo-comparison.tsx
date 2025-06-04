'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, ChevronLeft, ChevronRight, Calendar, Weight } from 'lucide-react'
import Image from 'next/image'

// Simple date formatting helper
const formatDate = (dateString: string, format: 'short' | 'medium' | 'long' = 'medium') => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = 
    format === 'short' ? { month: 'short', day: 'numeric' } :
    format === 'long' ? { month: 'long', day: 'numeric', year: 'numeric' } :
    { month: 'short', day: 'numeric', year: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

interface ProgressSnapshot {
  id: string
  date: string
  weight: string | null
  bodyFatPercentage: string | null
  photoUrl: string | null
  weightChangePercentage: number
  weightChangeAbsolute: number
  measurements: any
  notes: string | null
}

interface PhotoComparisonProps {
  snapshots: ProgressSnapshot[]
}

export function PhotoComparison({ snapshots }: PhotoComparisonProps) {
  const [compareMode, setCompareMode] = useState(false)
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid')

  const photosSnapshots = snapshots.filter(s => s.photoUrl)

  const toggleSnapshotSelection = (snapshotId: string) => {
    setSelectedSnapshots(prev => {
      if (prev.includes(snapshotId)) {
        return prev.filter(id => id !== snapshotId)
      } else if (prev.length < 2) {
        return [...prev, snapshotId]
      }
      return prev
    })
  }

  const clearSelection = () => {
    setSelectedSnapshots([])
    setCompareMode(false)
  }

  if (photosSnapshots.length === 0) {
    return (
      <Card className="card-glass border-2 border-border/50 shadow-soft-xl">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-4">
            <Camera className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-lg font-medium mb-2">No Progress Photos Yet</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Start documenting your transformation by adding photos to your progress snapshots
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-glass border-2 border-border/50 shadow-soft-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Progress Photos</CardTitle>
            <CardDescription>
              {compareMode 
                ? `Select 2 photos to compare (${selectedSnapshots.length}/2)`
                : 'Visual documentation of your journey'
              }
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'timeline' : 'grid')}
            >
              {viewMode === 'grid' ? 'Timeline' : 'Grid'} View
            </Button>
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (compareMode) {
                  clearSelection()
                } else {
                  setCompareMode(true)
                }
              }}
            >
              {compareMode ? 'Exit Compare' : 'Compare Photos'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {compareMode && selectedSnapshots.length === 2 ? (
          // Comparison View
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {selectedSnapshots.map((snapshotId, index) => {
                const snapshot = snapshots.find(s => s.id === snapshotId)
                if (!snapshot?.photoUrl) return null
                
                return (
                  <div key={snapshotId} className="space-y-3">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface-raised">
                      <Image
                        src={snapshot.photoUrl}
                        alt={`Progress photo from ${formatDate(snapshot.date)}`}
                        fill
                        className="object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-sm font-medium">
                          Before
                        </div>
                      )}
                      {index === 1 && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-sm font-medium">
                          After
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-4 rounded-lg bg-surface-raised dark:bg-surface-base border border-border/50">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{formatDate(snapshot.date)}</p>
                        <p className={`text-sm font-medium ${
                          snapshot.weightChangePercentage < 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : snapshot.weightChangePercentage > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground'
                        }`}>
                          {snapshot.weightChangePercentage > 0 ? '+' : ''}{snapshot.weightChangePercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Weight</p>
                          <p className="font-medium">{snapshot.weight} kg</p>
                        </div>
                        {snapshot.bodyFatPercentage && (
                          <div>
                            <p className="text-muted-foreground">Body Fat</p>
                            <p className="font-medium">{snapshot.bodyFatPercentage}%</p>
                          </div>
                        )}
                      </div>
                      {snapshot.notes && (
                        <p className="text-sm italic text-muted-foreground pt-2 border-t">
                          {snapshot.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Comparison Summary */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-brand-500/10 to-violet-500/10 border border-brand-500/20">
              <h4 className="font-medium mb-3">Comparison Summary</h4>
              {(() => {
                const [snapshot1, snapshot2] = selectedSnapshots.map(id => 
                  snapshots.find(s => s.id === id)
                )
                if (!snapshot1 || !snapshot2) return null
                
                const timeDiff = Math.abs(
                  new Date(snapshot2.date).getTime() - new Date(snapshot1.date).getTime()
                )
                const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
                const weightDiff = parseFloat(snapshot2.weight || '0') - parseFloat(snapshot1.weight || '0')
                
                return (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Time Period</p>
                      <p className="font-medium">{daysDiff} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Weight Change</p>
                      <p className={`font-medium ${
                        weightDiff < 0 ? 'text-emerald-600' : weightDiff > 0 ? 'text-amber-600' : ''
                      }`}>
                        {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg. Change/Week</p>
                      <p className={`font-medium ${
                        weightDiff < 0 ? 'text-emerald-600' : weightDiff > 0 ? 'text-amber-600' : ''
                      }`}>
                        {((weightDiff / daysDiff) * 7).toFixed(2)} kg
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>
            
            <Button 
              onClick={clearSelection} 
              variant="outline" 
              className="w-full"
            >
              Select Different Photos
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photosSnapshots.map(snapshot => (
              <div
                key={snapshot.id}
                className={`group cursor-pointer rounded-lg border-2 transition-all overflow-hidden ${
                  compareMode && selectedSnapshots.includes(snapshot.id)
                    ? 'border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-border/50 hover:border-border'
                }`}
                onClick={() => compareMode && toggleSnapshotSelection(snapshot.id)}
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={snapshot.photoUrl!}
                    alt={`Progress photo from ${formatDate(snapshot.date, 'short')}`}
                    fill
                    className="object-cover"
                  />
                  {compareMode && selectedSnapshots.includes(snapshot.id) && (
                    <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                      <div className="bg-brand-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {selectedSnapshots.indexOf(snapshot.id) + 1}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-surface-raised dark:bg-surface-base">
                  <p className="font-medium text-sm">{formatDate(snapshot.date)}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{snapshot.weight} kg</p>
                    <p className={`text-xs font-medium ${
                      snapshot.weightChangePercentage < 0 
                        ? 'text-emerald-600' 
                        : snapshot.weightChangePercentage > 0 
                        ? 'text-amber-600'
                        : 'text-muted-foreground'
                    }`}>
                      {snapshot.weightChangePercentage > 0 ? '+' : ''}{snapshot.weightChangePercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Timeline View
          <div className="space-y-4">
            {photosSnapshots.map((snapshot, index) => (
              <div key={snapshot.id} className="flex gap-4 p-4 rounded-lg border border-border/50 bg-surface-raised dark:bg-surface-base hover:bg-surface-overlay dark:hover:bg-surface-raised transition-colors">
                <div className="relative h-32 w-24 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src={snapshot.photoUrl!}
                    alt={`Progress from ${formatDate(snapshot.date, 'short')}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-grow space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{formatDate(snapshot.date, 'long')}</p>
                      <p className="text-sm text-muted-foreground">
                        Weight: {snapshot.weight} kg
                        {snapshot.bodyFatPercentage && ` • Body Fat: ${snapshot.bodyFatPercentage}%`}
                      </p>
                    </div>
                    <p className={`text-sm font-medium ${
                      snapshot.weightChangePercentage < 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : snapshot.weightChangePercentage > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground'
                    }`}>
                      {snapshot.weightChangePercentage > 0 ? '+' : ''}{snapshot.weightChangePercentage.toFixed(1)}%
                    </p>
                  </div>
                  {snapshot.measurements && Object.keys(snapshot.measurements).length > 0 && (
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {Object.entries(snapshot.measurements).filter(([_, value]) => value).slice(0, 3).map(([key, value]) => (
                        <span key={key}>
                          {key}: {String(value)}cm
                        </span>
                      ))}
                    </div>
                  )}
                  {snapshot.notes && (
                    <p className="text-sm italic text-muted-foreground">{snapshot.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}