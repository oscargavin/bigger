'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ProgressChartProps {
  snapshots: Array<{
    date: string;
    weight: string | null;
    weightChangePercentage: number;
    weightChangeAbsolute: number;
  }>;
  baseline: {
    weight: number;
    date: Date | null;
  };
}

export function ProgressChart({ snapshots, baseline }: ProgressChartProps) {
  const chartData = useMemo(() => {
    return snapshots
      .slice()
      .reverse()
      .map(snapshot => ({
        date: new Date(snapshot.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        weight: parseFloat(snapshot.weight || '0'),
        changePercent: snapshot.weightChangePercentage,
      }));
  }, [snapshots]);

  const latestSnapshot = snapshots[0];
  const trend = latestSnapshot?.weightChangePercentage || 0;
  const isPositive = trend > 0;

  // Calculate min and max for chart scaling
  const weights = chartData.map(d => d.weight).filter(w => w > 0);
  const minWeight = Math.min(...weights, baseline.weight);
  const maxWeight = Math.max(...weights, baseline.weight);
  const range = maxWeight - minWeight || 1;
  const padding = range * 0.1;

  return (
    <Card className="card-glass p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Weight Progress</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Relative to baseline: {baseline.weight}kg
          </p>
        </div>
        
        {latestSnapshot && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            isPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-medium">{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {chartData.length > 0 ? (
        <div className="relative h-64">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground">
            <span>{(maxWeight + padding).toFixed(1)}</span>
            <span>{((maxWeight + minWeight) / 2).toFixed(1)}</span>
            <span>{(minWeight - padding).toFixed(1)}</span>
          </div>

          {/* Chart area */}
          <div className="ml-12 h-full relative">
            {/* Baseline reference line */}
            <div 
              className="absolute left-0 right-0 border-t-2 border-dashed border-muted-foreground/30"
              style={{
                top: `${((maxWeight + padding - baseline.weight) / (range + 2 * padding)) * 100}%`
              }}
            >
              <span className="absolute -top-2.5 left-2 text-xs text-muted-foreground bg-background px-1">
                Baseline
              </span>
            </div>

            {/* Data points and line */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {/* Line connecting points */}
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary"
                points={chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1 || 1)) * 100;
                  const y = ((maxWeight + padding - d.weight) / (range + 2 * padding)) * 100;
                  return `${x},${y}`;
                }).join(' ')}
              />
              
              {/* Data points */}
              {chartData.map((d, i) => {
                const x = (i / (chartData.length - 1 || 1)) * 100;
                const y = ((maxWeight + padding - d.weight) / (range + 2 * padding)) * 100;
                return (
                  <circle
                    key={i}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    className="fill-primary"
                  />
                );
              })}
            </svg>

            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground mt-2">
              {chartData.map((d, i) => (
                <span key={i} className="transform -rotate-45 origin-top-left">
                  {d.date}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <p>No progress data yet. Start tracking your measurements!</p>
        </div>
      )}

      {/* Summary stats */}
      {latestSnapshot && (
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Current</p>
            <p className="text-xl font-semibold">{parseFloat(latestSnapshot.weight || '0').toFixed(1)}kg</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Change</p>
            <p className={`text-xl font-semibold ${
              latestSnapshot.weightChangeAbsolute > 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {latestSnapshot.weightChangeAbsolute > 0 ? '+' : ''}{latestSnapshot.weightChangeAbsolute.toFixed(1)}kg
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className={`text-xl font-semibold ${
              trend > 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}