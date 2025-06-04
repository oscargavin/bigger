"use client";

import { useState } from "react";
import { format } from "date-fns";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TargetIcon, TrophyIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon, EyeOffIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function GoalList() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [includePartnerGoals, setIncludePartnerGoals] = useState(true);

  const utils = api.useUtils();
  const { data: goals = [] } = api.goals.getGoals.useQuery({ 
    includePartnerGoals 
  });

  const createGoal = api.goals.createGoal.useMutation({
    onSuccess: () => {
      setShowCreateDialog(false);
      utils.goals.getGoals.invalidate();
    },
  });

  const updateGoal = api.goals.updateGoal.useMutation({
    onSuccess: () => {
      setEditingGoalId(null);
      utils.goals.getGoals.invalidate();
    },
  });

  const deleteGoal = api.goals.deleteGoal.useMutation({
    onSuccess: () => {
      utils.goals.getGoals.invalidate();
    },
  });

  const updateProgress = api.goals.updateProgress.useMutation({
    onSuccess: () => {
      utils.goals.getGoals.invalidate();
    },
  });

  const goalTypeConfig = {
    weight_loss: { icon: "📉", color: "text-blue-600 dark:text-blue-400" },
    weight_gain: { icon: "📈", color: "text-emerald-600 dark:text-emerald-400" },
    strength: { icon: "💪", color: "text-violet-600 dark:text-violet-400" },
    endurance: { icon: "🏃", color: "text-orange-600 dark:text-orange-400" },
    consistency: { icon: "📅", color: "text-indigo-600 dark:text-indigo-400" },
    body_composition: { icon: "🎯", color: "text-pink-600 dark:text-pink-400" },
    custom: { icon: "⭐", color: "text-amber-600 dark:text-amber-400" },
  };

  const calculateProgress = (goal: any) => {
    if (!goal.targetValue || !goal.currentValue) return 0;
    
    const target = parseFloat(goal.targetValue);
    const current = parseFloat(goal.currentValue);
    const start = goal.metadata?.startValue ? parseFloat(goal.metadata.startValue) : 0;

    if (goal.goalType === 'weight_loss') {
      return Math.min(100, ((start - current) / (start - target)) * 100);
    } else {
      return Math.min(100, (current / target) * 100);
    }
  };

  const visibilityIcons = {
    private: <EyeOffIcon className="h-3 w-3" />,
    buddy_only: <UsersIcon className="h-3 w-3" />,
    public: <EyeIcon className="h-3 w-3" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Goals</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIncludePartnerGoals(!includePartnerGoals)}
          >
            {includePartnerGoals ? "Hide" : "Show"} Partner Goals
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-1" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <GoalForm
                onSubmit={(data) => createGoal.mutate(data)}
                isLoading={createGoal.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const config = goalTypeConfig[goal.goalType as keyof typeof goalTypeConfig];
          const progress = calculateProgress(goal);
          const isOwnGoal = goal.user.id === goal.userId;

          return (
            <Card key={goal.id} className={cn(
              "transition-all hover:shadow-md",
              !isOwnGoal && "opacity-90"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-2xl", config.color)}>
                      {config.icon}
                    </span>
                    <div>
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {goal.user.fullName || goal.user.username}
                        </Badge>
                        {goal.visibility && visibilityIcons[goal.visibility as keyof typeof visibilityIcons]}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      goal.status === 'completed' ? 'default' :
                      goal.status === 'active' ? 'outline' :
                      goal.status === 'paused' ? 'secondary' :
                      'destructive'
                    }
                    className={
                      goal.status === 'completed' ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500' : ''
                    }
                  >
                    {goal.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {goal.description && (
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                )}
                
                {goal.targetValue && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>
                        {goal.currentValue || 0} / {goal.targetValue} {goal.targetUnit}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Started: {format(new Date(goal.startDate), 'MMM d, yyyy')}</span>
                  <span>Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}</span>
                </div>

                {isOwnGoal && goal.status === 'active' && (
                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="flex-1">
                          Update Progress
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Progress</DialogTitle>
                        </DialogHeader>
                        <ProgressUpdateForm
                          goal={goal}
                          onSubmit={(value) => updateProgress.mutate({
                            goalId: goal.id,
                            currentValue: value,
                          })}
                          isLoading={updateProgress.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteGoal.mutate({ goalId: goal.id })}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {goals.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <TargetIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No goals yet. Create your first goal to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface GoalFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  initialData?: any;
}

function GoalForm({ onSubmit, isLoading, initialData }: GoalFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    goalType: initialData?.goalType || "custom",
    targetValue: initialData?.targetValue || "",
    targetUnit: initialData?.targetUnit || "",
    currentValue: initialData?.currentValue || "",
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
    targetDate: initialData?.targetDate || "",
    visibility: initialData?.visibility || "buddy_only",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      targetValue: formData.targetValue ? parseFloat(formData.targetValue) : undefined,
      currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Goal Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="goalType">Goal Type</Label>
        <Select
          value={formData.goalType}
          onValueChange={(value) => setFormData({ ...formData, goalType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weight_loss">Weight Loss</SelectItem>
            <SelectItem value="weight_gain">Weight Gain</SelectItem>
            <SelectItem value="strength">Strength</SelectItem>
            <SelectItem value="endurance">Endurance</SelectItem>
            <SelectItem value="consistency">Consistency</SelectItem>
            <SelectItem value="body_composition">Body Composition</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="targetValue">Target Value</Label>
          <Input
            id="targetValue"
            type="number"
            step="0.1"
            value={formData.targetValue}
            onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="targetUnit">Unit</Label>
          <Input
            id="targetUnit"
            value={formData.targetUnit}
            onChange={(e) => setFormData({ ...formData, targetUnit: e.target.value })}
            placeholder="lbs, kg, reps..."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="currentValue">Current Value</Label>
        <Input
          id="currentValue"
          type="number"
          step="0.1"
          value={formData.currentValue}
          onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="targetDate">Target Date</Label>
          <Input
            id="targetDate"
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="visibility">Visibility</Label>
        <Select
          value={formData.visibility}
          onValueChange={(value) => setFormData({ ...formData, visibility: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="buddy_only">Buddy Only</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {initialData ? "Update Goal" : "Create Goal"}
      </Button>
    </form>
  );
}

interface ProgressUpdateFormProps {
  goal: any;
  onSubmit: (value: number) => void;
  isLoading: boolean;
}

function ProgressUpdateForm({ goal, onSubmit, isLoading }: ProgressUpdateFormProps) {
  const [value, setValue] = useState(goal.currentValue || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value) {
      onSubmit(parseFloat(value));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="progress">Current Value</Label>
        <div className="flex gap-2">
          <Input
            id="progress"
            type="number"
            step="0.1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            {goal.targetUnit}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Target: {goal.targetValue} {goal.targetUnit}
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        Update Progress
      </Button>
    </form>
  );
}