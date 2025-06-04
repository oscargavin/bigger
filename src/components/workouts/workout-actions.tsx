'use client'

import { useState } from 'react'
import { api } from '@/utils/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WorkoutActionsProps {
  workoutId: string
  durationMinutes?: number
  notes?: string
  onUpdate?: () => void
  onDelete?: () => void
}

export function WorkoutActions({ 
  workoutId, 
  durationMinutes, 
  notes,
  onUpdate,
  onDelete 
}: WorkoutActionsProps) {
  const { toast } = useToast()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editDuration, setEditDuration] = useState(durationMinutes?.toString() || '')
  const [editNotes, setEditNotes] = useState(notes || '')

  const updateWorkout = api.workouts.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Workout updated",
        description: "Your workout has been updated successfully.",
      })
      setIsEditOpen(false)
      onUpdate?.()
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update workout",
      })
    },
  })

  const deleteWorkout = api.workouts.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Workout deleted",
        description: "Your workout has been deleted successfully.",
      })
      setIsDeleteOpen(false)
      // Ensure data is refreshed
      onDelete?.()
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete workout",
      })
    },
  })

  const handleUpdate = () => {
    updateWorkout.mutate({
      workoutId,
      durationMinutes: editDuration ? parseInt(editDuration) : undefined,
      notes: editNotes || undefined,
    })
  }

  const handleDelete = () => {
    deleteWorkout.mutate({ workoutId })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setIsDeleteOpen(true)}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Workout</DialogTitle>
            <DialogDescription>
              Make changes to your workout details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration (minutes)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                min="1"
                max="300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditOpen(false)}
              disabled={updateWorkout.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={updateWorkout.isPending}
            >
              {updateWorkout.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Delete Workout</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground mt-3">
              Are you sure you want to delete this workout? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteOpen(false)}
              disabled={deleteWorkout.isPending}
              className="h-11"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteWorkout.isPending}
              className="h-11 bg-destructive hover:bg-destructive/90"
            >
              {deleteWorkout.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Workout'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}