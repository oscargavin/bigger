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
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Log Workout</h1>
        <p className="text-lg text-muted-foreground mt-2">Track your progress and stay consistent</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50 bg-surface hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
            <div className="rounded-full bg-emerald-500/10 p-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.currentStreak || 0} <span className="text-lg font-normal text-muted-foreground">days</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Best: {stats?.longestStreak || 0} days
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-surface hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            <div className="rounded-full bg-blue-500/10 p-2">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.thisWeek || 0} <span className="text-lg font-normal text-muted-foreground">workouts</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Keep it up!</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-surface hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workouts</CardTitle>
            <div className="rounded-full bg-violet-500/10 p-2">
              <CheckCircle className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.totalWorkouts || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Log Workout Form */}
      <Card className="border-border/50 bg-surface shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl">New Workout</CardTitle>
            <CardDescription>Log your workout to maintain your streak</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Workout Photo (optional)</Label>
              <div className="flex flex-col items-center gap-4">
                {photoPreview ? (
                  <div className="relative w-full max-w-sm">
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
                      <Image
                        src={photoPreview}
                        alt="Workout preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm"
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
                    className="w-full max-w-sm h-48 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/5 hover:border-border transition-all duration-200"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="rounded-full bg-primary/10 p-3">
                      <Camera className="h-6 w-6 text-primary/70" />
                    </div>
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
              <Label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="45"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min="1"
                max="300"
                className="h-11"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Upper body day, felt strong!"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                className="h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="pt-6">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium shadow-sm"
              size="lg"
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
        <Card className="border-border/50 bg-surface">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl">Recent Workouts</CardTitle>
            <CardDescription>Your last few sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentWorkouts.map((workout) => (
              <div 
                key={workout.id} 
                className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/5 p-4 hover:bg-muted/10 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {workout.photos?.[0] ? (
                    <div className="relative h-14 w-14">
                      <Image
                        src={workout.photos[0].photo_url}
                        alt="Workout"
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-muted/50 flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">
                      {new Date(workout.completed_at).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {workout.duration_minutes ? `${workout.duration_minutes} min` : 'No duration'} 
                      {workout.notes && ` • ${workout.notes.substring(0, 30)}${workout.notes.length > 30 ? '...' : ''}`}
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