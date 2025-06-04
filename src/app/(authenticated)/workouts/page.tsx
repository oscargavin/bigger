'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { api } from '@/utils/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Clock, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react'
import { useStreakMilestone } from '@/hooks/use-streak-milestone'
import { WorkoutActions } from '@/components/workouts/workout-actions'
import { ExerciseInput } from '@/components/workouts/exercise-input'

export default function WorkoutsPage() {
  const router = useRouter()
  const utils = api.useUtils()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setMilestone } = useStreakMilestone()

  const [durationMinutes, setDurationMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Queries
  const { data: stats } = api.workouts.getStats.useQuery()
  const { data: recentWorkouts } = api.workouts.getMyWorkouts.useQuery({ limit: 5 })

  // Mutations
  const uploadPhoto = api.workouts.uploadPhoto.useMutation()
  const createWorkout = api.workouts.create.useMutation({
    onSuccess: async () => {
      // Get the old stats before invalidating
      const oldStats = stats
      
      // Invalidate to get new stats
      await utils.workouts.getStats.invalidate()
      
      // Get the new stats
      const newStats = await utils.workouts.getStats.fetch()
      
      // Check if we hit a milestone
      if (oldStats && newStats) {
        const oldStreak = oldStats.currentStreak
        const newStreak = newStats.currentStreak
        
        // If streak increased and hit a milestone, trigger celebration
        if (newStreak > oldStreak) {
          const milestones = [7, 14, 30, 60, 100]
          const hitMilestone = milestones.some(m => newStreak >= m && oldStreak < m)
          
          if (hitMilestone) {
            setMilestone(newStreak, oldStreak)
          }
        }
      }
      
      utils.workouts.getMyWorkouts.invalidate()
      // Reset form
      setDurationMinutes('')
      setNotes('')
      setPhotoFile(null)
      setPhotoPreview(null)
      router.push('/dashboard')
    },
  })

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Photo must be less than 10MB')
        return
      }

      setPhotoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      let photoUrl: string | undefined

      // Upload photo if selected
      if (photoFile) {
        // Get signed upload URL
        const uploadData = await uploadPhoto.mutateAsync({
          fileName: photoFile.name,
          fileType: photoFile.type,
          fileSize: photoFile.size,
        })

        // Upload file to Supabase Storage
        const uploadResponse = await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          body: photoFile,
          headers: {
            'Content-Type': photoFile.type,
          },
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload photo')
        }

        photoUrl = uploadData.publicUrl
      }

      // Create workout
      await createWorkout.mutateAsync({
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        notes: notes || undefined,
        photoUrl,
      })
    } catch (error) {
      console.error('Error logging workout:', error)
      alert('Failed to log workout. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Log Workout</h1>
        <p className="text-muted-foreground">Track your progress and stay consistent</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-elevated hover-lift overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent dark:from-emerald-400/10" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2 ring-1 ring-emerald-200 dark:ring-emerald-800">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
              {stats?.currentStreak || 0} days
            </div>
            <p className="text-xs text-muted-foreground">
              Best: {stats?.longestStreak || 0} days
            </p>
          </CardContent>
        </Card>

        <Card className="card-elevated hover-lift overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent dark:from-brand-400/10" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <div className="rounded-lg bg-brand-100 dark:bg-brand-900/30 p-2 ring-1 ring-brand-200 dark:ring-brand-800">
              <Clock className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-gradient-to-br from-brand-600 to-brand-500 dark:from-brand-400 dark:to-brand-300 bg-clip-text text-transparent">
              {stats?.thisWeek || 0} workouts
            </div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>

        <Card className="card-elevated hover-lift overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent dark:from-violet-400/10" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
            <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-2 ring-1 ring-violet-200 dark:ring-violet-800">
              <CheckCircle className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold bg-gradient-to-br from-violet-600 to-violet-500 dark:from-violet-400 dark:to-violet-300 bg-clip-text text-transparent">
              {stats?.totalWorkouts || 0}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Log Workout Form */}
      <Card className="card-interactive border-2 border-border dark:border-border/50">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>New Workout</CardTitle>
            <CardDescription>Log your workout to maintain your streak</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Workout Photo (optional)</Label>
              <div className="flex flex-col items-center gap-4">
                {photoPreview ? (
                  <div className="relative w-full max-w-sm">
                    <div className="relative w-full h-[300px]">
                      <Image
                        src={photoPreview}
                        alt="Workout preview"
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => {
                        setPhotoFile(null)
                        setPhotoPreview(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div
                    className="w-full max-w-sm h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload photo</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="45"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min="1"
                max="300"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Upper body day, felt strong!"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isUploading || createWorkout.isPending}
            >
              {isUploading || createWorkout.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging Workout...
                </>
              ) : (
                'Log Workout'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Exercise Tracking */}
      <ExerciseInput />

      {/* Recent Workouts */}
      {recentWorkouts && recentWorkouts.length > 0 && (
        <Card className="card-glass border-2 border-border/50 shadow-soft-xl">
          <CardHeader>
            <CardTitle>Recent Workouts</CardTitle>
            <CardDescription>Your last few sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface-raised dark:bg-surface-base p-3 hover:bg-surface-overlay dark:hover:bg-surface-raised transition-colors">
                <div className="flex items-center gap-3">
                  {workout.photos?.[0] ? (
                    <div className="relative h-12 w-12">
                      <Image
                        src={workout.photos[0].photo_url}
                        alt="Workout"
                        fill
                        className="rounded-lg object-cover ring-2 ring-border/50"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {new Date(workout.completed_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {workout.duration_minutes ? `${workout.duration_minutes} min` : 'No duration'} 
                      {workout.notes && ` • ${workout.notes}`}
                    </p>
                  </div>
                </div>
                <WorkoutActions
                  workoutId={workout.id}
                  durationMinutes={workout.duration_minutes}
                  notes={workout.notes}
                  onUpdate={() => {
                    utils.workouts.getMyWorkouts.invalidate()
                    utils.workouts.getStats.invalidate()
                  }}
                  onDelete={() => {
                    utils.workouts.getMyWorkouts.invalidate()
                    utils.workouts.getStats.invalidate()
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}