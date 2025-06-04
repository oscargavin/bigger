"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { TrophyIcon, CalendarIcon, SparklesIcon, HeartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAchievementCelebration } from "@/hooks/use-achievement-celebration";

export function MilestoneCelebrations() {
  const [celebratingMilestone, setCelebratingMilestone] = useState<any>(null);
  const { celebrate } = useAchievementCelebration();

  const utils = api.useUtils();
  
  // Get uncelebrated milestones
  const { data: uncelebrated = [] } = api.milestones.getUncelebratedMilestones.useQuery();
  
  // Get recent milestones (including buddy's)
  const { data: recentMilestones = [] } = api.milestones.getMilestones.useQuery({
    includeBuddy: true,
    limit: 10,
  });

  // Get partnership anniversaries
  const { data: anniversaryData } = api.milestones.getPartnershipAnniversaries.useQuery();

  // Check for new milestones on mount and after workouts
  const checkAnniversaries = api.milestones.checkAndCreateAnniversaries.useMutation({
    onSuccess: (data) => {
      if (data.created.length > 0) {
        utils.milestones.getUncelebratedMilestones.invalidate();
        utils.milestones.getPartnershipAnniversaries.invalidate();
      }
    },
  });

  const checkWorkoutMilestones = api.milestones.checkAndCreateWorkoutMilestones.useMutation({
    onSuccess: (data) => {
      if (data.created.length > 0) {
        utils.milestones.getUncelebratedMilestones.invalidate();
      }
    },
  });

  const celebrateMilestone = api.milestones.celebrateMilestone.useMutation({
    onSuccess: () => {
      utils.milestones.getUncelebratedMilestones.invalidate();
      utils.milestones.getMilestones.invalidate();
      setCelebratingMilestone(null);
    },
  });

  // Check for milestones on mount
  useEffect(() => {
    checkAnniversaries.mutate();
    checkWorkoutMilestones.mutate();
  }, [checkAnniversaries, checkWorkoutMilestones]);

  // Auto-show celebration for uncelebrated milestones
  useEffect(() => {
    if (uncelebrated.length > 0 && !celebratingMilestone) {
      const milestone = uncelebrated[0];
      setCelebratingMilestone(milestone);
      celebrate({
        id: milestone.id,
        name: milestone.title,
        description: milestone.description || "",
        icon: "🎉",
        rarity: "common",
        category: "milestone"
      });
    }
  }, [uncelebrated, celebratingMilestone, celebrate]);

  const milestoneIcons: Record<string, React.ReactElement> = {
    workout_count: <TrophyIcon className="h-5 w-5" />,
    streak: <SparklesIcon className="h-5 w-5" />,
    anniversary: <HeartIcon className="h-5 w-5" />,
    goal_completion: <TrophyIcon className="h-5 w-5" />,
    custom: <SparklesIcon className="h-5 w-5" />,
  };

  const getTimeUntilNextAnniversary = () => {
    if (!anniversaryData?.partnershipStartDate) return null;

    const startDate = new Date(anniversaryData.partnershipStartDate);
    const now = new Date();
    const monthsSinceStart = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                           (now.getMonth() - startDate.getMonth());

    // Find next milestone month
    const milestoneMonths = [1, 3, 6, 9, 12];
    const nextMilestone = milestoneMonths.find(m => m > monthsSinceStart) || 
                         (Math.floor(monthsSinceStart / 12) + 1) * 12;

    const nextDate = new Date(startDate);
    nextDate.setMonth(startDate.getMonth() + nextMilestone);

    return {
      date: nextDate,
      label: nextMilestone >= 12 
        ? `${nextMilestone / 12} Year Anniversary` 
        : `${nextMilestone} Month Anniversary`,
    };
  };

  const nextAnniversary = getTimeUntilNextAnniversary();

  return (
    <>
      {/* Celebration Dialog */}
      <Dialog 
        open={!!celebratingMilestone} 
        onOpenChange={(open) => !open && setCelebratingMilestone(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {celebratingMilestone?.icon || "🎉"} Milestone Achieved!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <h3 className="text-xl font-semibold">{celebratingMilestone?.title}</h3>
            {celebratingMilestone?.description && (
              <p className="text-muted-foreground">{celebratingMilestone.description}</p>
            )}
            {celebratingMilestone?.value && (
              <div className="text-3xl font-bold text-primary">
                {celebratingMilestone.value} {celebratingMilestone.unit}
              </div>
            )}
            <Button 
              onClick={() => {
                if (celebratingMilestone) {
                  celebrateMilestone.mutate({ milestoneId: celebratingMilestone.id });
                }
              }}
              className="w-full"
            >
              Celebrate! 🎊
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Milestones Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrophyIcon className="h-5 w-5" />
            Milestones & Anniversaries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Next Anniversary Countdown */}
          {nextAnniversary && (
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Next: {nextAnniversary.label}</span>
                </div>
                <Badge variant="outline">
                  {formatDistanceToNow(nextAnniversary.date, { addSuffix: false })}
                </Badge>
              </div>
            </div>
          )}

          {/* Recent Milestones */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Achievements</h4>
            {recentMilestones.length > 0 ? (
              <div className="space-y-2">
                {recentMilestones.slice(0, 5).map((milestone) => (
                  <div 
                    key={milestone.id} 
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md",
                      milestone.celebrated ? "opacity-75" : "bg-muted"
                    )}
                  >
                    <div className="text-lg">
                      {milestone.icon || milestoneIcons[milestone.milestoneType] || "🏆"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{milestone.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {milestone.user.fullName || milestone.user.username} • 
                        {formatDistanceToNow(new Date(milestone.achievedAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!milestone.celebrated && milestone.userId === milestone.user.id && (
                      <Badge variant="default" className="text-xs">New!</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No milestones yet. Keep working towards your goals!
              </p>
            )}
          </div>

          {/* Check for new milestones button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => {
              checkAnniversaries.mutate();
              checkWorkoutMilestones.mutate();
            }}
          >
            Check for New Milestones
          </Button>
        </CardContent>
      </Card>
    </>
  );
}