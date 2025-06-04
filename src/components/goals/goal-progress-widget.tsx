"use client";

import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TargetIcon, AlertCircleIcon } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useRouter } from "next/navigation";

export function GoalProgressWidget() {
  const router = useRouter();
  const { data: activeGoals = [] } = api.goals.getGoals.useQuery({ 
    status: 'active',
    includePartnerGoals: false 
  });
  
  const { data: upcomingDeadlines = [] } = api.goals.getUpcomingDeadlines.useQuery();

  const calculateProgress = (goal: any) => {
    if (!goal.targetValue || !goal.currentValue) return 0;
    
    const target = parseFloat(goal.targetValue);
    const current = parseFloat(goal.currentValue);

    if (goal.goalType === 'weight_loss') {
      const start = goal.metadata?.startValue ? parseFloat(goal.metadata.startValue) : target * 1.1;
      return Math.min(100, ((start - current) / (start - target)) * 100);
    } else {
      return Math.min(100, (current / target) * 100);
    }
  };

  const goalTypeEmojis: Record<string, string> = {
    weight_loss: "📉",
    weight_gain: "📈",
    strength: "💪",
    endurance: "🏃",
    consistency: "📅",
    body_composition: "🎯",
    custom: "⭐",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TargetIcon className="h-5 w-5" />
            Active Goals
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoals.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">
              No active goals. Set a goal to track your progress!
            </p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Create Goal
            </Button>
          </div>
        ) : (
          <>
            {/* Active Goals Progress */}
            <div className="space-y-3">
              {activeGoals.slice(0, 3).map((goal) => {
                const progress = calculateProgress(goal);
                const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
                
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {goalTypeEmojis[goal.goalType] || "🎯"}
                        </span>
                        <span className="text-sm font-medium">{goal.title}</span>
                      </div>
                      {daysLeft <= 7 && (
                        <Badge variant="destructive" className="text-xs">
                          {daysLeft}d left
                        </Badge>
                      )}
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {goal.currentValue || 0}/{goal.targetValue} {goal.targetUnit}
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Upcoming Deadlines Warning */}
            {upcomingDeadlines.length > 0 && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
                  <AlertCircleIcon className="h-4 w-4" />
                  <span className="font-medium">Upcoming Deadlines</span>
                </div>
                <div className="mt-2 space-y-1">
                  {upcomingDeadlines.slice(0, 2).map((goal) => {
                    const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
                    return (
                      <div key={goal.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{goal.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {daysLeft === 0 ? 'Today' : 
                           daysLeft === 1 ? 'Tomorrow' : 
                           `${daysLeft} days`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}