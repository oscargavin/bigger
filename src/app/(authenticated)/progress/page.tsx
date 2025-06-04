'use client';

import { api } from '@/utils/api';
import { ProgressChart } from '@/components/progress/progress-chart';
import { AddProgressSnapshot } from '@/components/progress/add-progress-snapshot';
import { PhotoComparison } from '@/components/progress/photo-comparison';
import { Card } from '@/components/ui/card';
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
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const latestSnapshot = progressData?.snapshots[0];
  const hasBaseline = baseline?.startingWeight;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Progress Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Track your transformation with percentage-based progress metrics
        </p>
      </div>

      {/* Baseline setup reminder */}
      {!hasBaseline && (
        <Card className="card-interactive p-6 bg-amber-500/10 border-amber-500/20">
          <div className="flex items-start gap-4">
            <Target className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                Set Your Baseline
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                Record your starting measurements to track relative progress. This helps make fair comparisons regardless of starting point.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-elevated p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Weight</p>
              <p className="text-2xl font-bold mt-1">
                {latestSnapshot ? `${parseFloat(latestSnapshot.weight || '0').toFixed(1)}kg` : '--'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="card-elevated p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Change</p>
              <p className="text-2xl font-bold mt-1">
                {latestSnapshot 
                  ? `${latestSnapshot.weightChangeAbsolute > 0 ? '+' : ''}${latestSnapshot.weightChangeAbsolute.toFixed(1)}kg`
                  : '--'
                }
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="card-elevated p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Progress %</p>
              <p className="text-2xl font-bold mt-1">
                {latestSnapshot 
                  ? `${latestSnapshot.weightChangePercentage > 0 ? '+' : ''}${latestSnapshot.weightChangePercentage.toFixed(1)}%`
                  : '--'
                }
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
        </Card>

        <Card className="card-elevated p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Snapshots</p>
              <p className="text-2xl font-bold mt-1">
                {progressData?.snapshots.length || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        <Card className="card-glass p-6">
          <h3 className="text-lg font-semibold mb-4">Personal Records</h3>
          <div className="space-y-3">
            {exerciseProgress.slice(0, 5).map((exercise) => {
              const pr = exercise.personalRecord as any;
              return (
                <div key={exercise.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{exercise.exerciseName}</p>
                    <p className="text-sm text-muted-foreground">
                      {pr?.weight}{pr?.unit} × {pr?.reps} reps
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">1RM: {exercise.oneRepMax}{pr?.unit}</p>
                    <p className="text-xs text-muted-foreground">
                      {exercise.lastPerformed 
                        ? new Date(exercise.lastPerformed).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}