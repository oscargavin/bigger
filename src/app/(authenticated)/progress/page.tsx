'use client';

import { api } from '@/utils/api';
import { ProgressChart } from '@/components/progress/progress-chart';
import { AddProgressSnapshot } from '@/components/progress/add-progress-snapshot';
import { PhotoComparison } from '@/components/progress/photo-comparison';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Target, TrendingUp, Calendar } from 'lucide-react';

export default function ProgressPage() {
  const { data: progressData, isLoading } = api.progress.getProgressHistory.useQuery({
    limit: 30,
  });

  const { data: baseline } = api.progress.getBaseline.useQuery();
  const { data: exerciseProgress } = api.progress.getExerciseProgress.useQuery();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-muted rounded"></div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const latestSnapshot = progressData?.snapshots[0];
  const hasBaseline = baseline?.startingWeight;

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Progress Tracking</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Track your transformation with percentage-based progress metrics
        </p>
      </div>

      {/* Baseline setup reminder */}
      {!hasBaseline && (
        <Card className="border-amber-500/20 bg-amber-500/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-500/10 p-2">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Set Your Baseline
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Record your starting measurements to track relative progress. This helps make fair comparisons regardless of starting point.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 bg-surface hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Weight</CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {latestSnapshot ? `${parseFloat(latestSnapshot.weight || '0').toFixed(1)}` : '--'}
              <span className="text-lg font-normal text-muted-foreground ml-1">kg</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Latest measurement
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-surface hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Change</CardTitle>
            <div className="rounded-full bg-emerald-500/10 p-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {latestSnapshot 
                ? `${latestSnapshot.weightChangeAbsolute > 0 ? '+' : ''}${latestSnapshot.weightChangeAbsolute.toFixed(1)}`
                : '--'
              }
              <span className="text-lg font-normal text-muted-foreground ml-1">kg</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              From baseline
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-surface hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress %</CardTitle>
            <div className="rounded-full bg-violet-500/10 p-2">
              <Target className="w-5 h-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {latestSnapshot 
                ? `${latestSnapshot.weightChangePercentage > 0 ? '+' : ''}${latestSnapshot.weightChangePercentage.toFixed(1)}`
                : '--'
              }
              <span className="text-lg font-normal text-muted-foreground ml-1">%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Relative change
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-surface hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Snapshots</CardTitle>
            <div className="rounded-full bg-amber-500/10 p-2">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {progressData?.snapshots.length || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Total recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress chart - takes 2 columns */}
        <div className="lg:col-span-2">
          {progressData && progressData.baseline && (
            <ProgressChart
              snapshots={progressData.snapshots}
              baseline={progressData.baseline}
            />
          )}
        </div>

        {/* Add snapshot form */}
        <div>
          <AddProgressSnapshot />
        </div>
      </div>

      {/* Photo Comparison */}
      {progressData && progressData.snapshots.length > 0 && (
        <PhotoComparison snapshots={progressData.snapshots} />
      )}

      {/* Exercise progress */}
      {exerciseProgress && exerciseProgress.length > 0 && (
        <Card className="border-border/50 bg-surface">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl">Personal Records</CardTitle>
            <CardDescription>Your best lifts and exercises</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exerciseProgress.slice(0, 5).map((exercise) => {
                const pr = exercise.personalRecord as any;
                return (
                  <div 
                    key={exercise.id} 
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/5 hover:bg-muted/10 transition-all duration-200"
                  >
                    <div>
                      <p className="font-semibold text-base">{exercise.exerciseName}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pr?.weight}{pr?.unit} × {pr?.reps} reps
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        1RM: {exercise.oneRepMax}{pr?.unit}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {exercise.lastPerformed 
                          ? new Date(exercise.lastPerformed).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}