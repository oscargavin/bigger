'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Dumbbell, TrendingUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Exercise {
  name: string;
  sets: Array<{
    reps: number;
    weight: number;
    unit: 'kg' | 'lbs';
  }>;
}

const COMMON_EXERCISES = [
  { name: 'Bench Press', category: 'chest' },
  { name: 'Squat', category: 'legs' },
  { name: 'Deadlift', category: 'back' },
  { name: 'Overhead Press', category: 'shoulders' },
  { name: 'Barbell Row', category: 'back' },
  { name: 'Pull-up', category: 'back' },
  { name: 'Dip', category: 'chest' },
  { name: 'Bicep Curl', category: 'arms' },
  { name: 'Tricep Extension', category: 'arms' },
  { name: 'Leg Press', category: 'legs' },
];

export function ExerciseInput({ workoutId }: { workoutId?: string }) {
  const { toast } = useToast();
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState('');
  const [customExercise, setCustomExercise] = useState('');
  const [sets, setSets] = useState([{ reps: '', weight: '', unit: 'kg' as const }]);

  const updateExerciseRecord = api.progress.updateExerciseRecord.useMutation({
    onSuccess: () => {
      toast({
        title: 'Exercise recorded!',
        description: 'Your personal record has been updated.',
      });
      utils.progress.getExerciseProgress.invalidate();
    },
  });

  const updateWorkout = api.workouts.updateWorkout.useMutation({
    onSuccess: () => {
      utils.workouts.getMyWorkouts.invalidate();
      utils.workouts.getStats.invalidate();
    },
  });

  const handleAddSet = () => {
    setSets([...sets, { reps: '', weight: '', unit: 'kg' }]);
  };

  const handleRemoveSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const handleSetChange = (index: number, field: 'reps' | 'weight' | 'unit', value: string) => {
    const newSets = [...sets];
    if (field === 'unit') {
      newSets[index][field] = value as 'kg' | 'lbs';
    } else {
      newSets[index][field] = value;
    }
    setSets(newSets);
  };

  const handleAddExercise = () => {
    const exerciseName = customExercise || currentExercise;
    if (!exerciseName) {
      toast({
        title: 'Error',
        description: 'Please select or enter an exercise name',
        variant: 'destructive',
      });
      return;
    }

    const validSets = sets.filter(s => s.reps && s.weight);
    if (validSets.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one set with reps and weight',
        variant: 'destructive',
      });
      return;
    }

    const newExercise: Exercise = {
      name: exerciseName,
      sets: validSets.map(s => ({
        reps: parseInt(s.reps),
        weight: parseFloat(s.weight),
        unit: s.unit,
      })),
    };

    setExercises([...exercises, newExercise]);
    
    // Reset form
    setCurrentExercise('');
    setCustomExercise('');
    setSets([{ reps: '', weight: '', unit: 'kg' }]);

    // Find the best set (highest total volume) for PR tracking
    const bestSet = newExercise.sets.reduce((best, set) => {
      const volume = set.weight * set.reps;
      const bestVolume = best.weight * best.reps;
      return volume > bestVolume ? set : best;
    });

    // Update exercise record
    const category = COMMON_EXERCISES.find(e => e.name === exerciseName)?.category;
    updateExerciseRecord.mutate({
      exerciseName,
      category,
      personalRecord: {
        weight: bestSet.weight,
        reps: bestSet.reps,
        unit: bestSet.unit,
        date: new Date(),
      },
    });
  };

  const handleSaveExercises = async () => {
    if (exercises.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one exercise',
        variant: 'destructive',
      });
      return;
    }

    if (workoutId) {
      // Update existing workout with exercises
      await updateWorkout.mutateAsync({
        id: workoutId,
        exercises,
      });
    }

    setIsOpen(false);
    setExercises([]);
    toast({
      title: 'Exercises saved!',
      description: `${exercises.length} exercises recorded successfully.`,
    });
  };

  if (!isOpen) {
    return (
      <Card className="card-interactive p-6">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex flex-col items-center gap-4 py-8 hover:scale-105 transition-transform"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">Log Exercises</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Track your sets, reps, and personal records
            </p>
          </div>
        </button>
      </Card>
    );
  }

  return (
    <Card className="card-interactive p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Log Exercises</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>

      <div className="space-y-6">
        {/* Exercise selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Exercise</Label>
            <Select value={currentExercise} onValueChange={setCurrentExercise}>
              <SelectTrigger>
                <SelectValue placeholder="Select an exercise" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_EXERCISES.map((exercise) => (
                  <SelectItem key={exercise.name} value={exercise.name}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Or enter custom exercise</Label>
            <Input
              placeholder="Custom exercise name"
              value={customExercise}
              onChange={(e) => setCustomExercise(e.target.value)}
            />
          </div>
        </div>

        {/* Sets input */}
        <div className="space-y-4">
          <Label>Sets</Label>
          {sets.map((set, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs">Reps</Label>
                <Input
                  type="number"
                  placeholder="12"
                  value={set.reps}
                  onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Weight</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="60"
                  value={set.weight}
                  onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                />
              </div>
              <Select
                value={set.unit}
                onValueChange={(value) => handleSetChange(index, 'unit', value)}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                </SelectContent>
              </Select>
              {sets.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSet(index)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddSet}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Set
          </Button>
        </div>

        <Button
          onClick={handleAddExercise}
          className="w-full"
          disabled={!currentExercise && !customExercise}
        >
          Add Exercise
        </Button>

        {/* Added exercises */}
        {exercises.length > 0 && (
          <div className="space-y-2">
            <Label>Added Exercises</Label>
            <div className="space-y-2">
              {exercises.map((exercise, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exercise.sets.length} sets: {exercise.sets.map(s => `${s.reps}×${s.weight}${s.unit}`).join(', ')}
                    </p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
              ))}
            </div>
          </div>
        )}

        {exercises.length > 0 && (
          <Button
            onClick={handleSaveExercises}
            className="w-full"
            disabled={updateWorkout.isPending}
          >
            Save {exercises.length} Exercise{exercises.length > 1 ? 's' : ''}
          </Button>
        )}
      </div>
    </Card>
  );
}