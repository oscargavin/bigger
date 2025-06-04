'use client'

import { useState } from 'react'
import { api } from '@/utils/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Bell, Clock } from 'lucide-react'

interface ReminderSettings {
  enabled: boolean
  time: string
  days: string[]
}

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
]

const TIME_OPTIONS = [
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
]

export function ReminderSettings() {
  const { toast } = useToast()
  const { data: user } = api.auth.getUser.useQuery()
  
  // Initialize from user preferences
  const initialSettings: ReminderSettings = user?.notificationPreferences?.dailyReminder || {
    enabled: false,
    time: '18:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  }

  const [settings, setSettings] = useState<ReminderSettings>(initialSettings)
  const [isSaving, setIsSaving] = useState(false)

  const updatePreferences = api.auth.updateNotificationPreferences.useMutation({
    onSuccess: () => {
      toast({
        title: "Reminder settings updated",
        description: "Your daily workout reminders have been updated.",
      })
      setIsSaving(false)
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update reminder settings",
      })
      setIsSaving(false)
    },
  })

  const handleSave = () => {
    setIsSaving(true)
    updatePreferences.mutate({
      dailyReminder: settings,
    })
  }

  const toggleDay = (dayId: string) => {
    setSettings(prev => ({
      ...prev,
      days: prev.days.includes(dayId)
        ? prev.days.filter(d => d !== dayId)
        : [...prev.days, dayId],
    }))
  }

  return (
    <Card className="card-interactive border-2 border-border dark:border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-brand-100 dark:bg-brand-900/30 p-2 ring-1 ring-brand-200 dark:ring-brand-800">
            <Bell className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          </div>
          <CardTitle className="text-lg">Daily Workout Reminders</CardTitle>
        </div>
        <CardDescription>
          Get reminded to log your workouts and maintain your streak
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="reminder-enabled" className="cursor-pointer">
            Enable daily reminders
          </Label>
          <Switch
            id="reminder-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        {settings.enabled && (
          <>
            {/* Time Selection */}
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Reminder time</Label>
              <Select
                value={settings.time}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, time: value }))
                }
              >
                <SelectTrigger id="reminder-time" className="w-full">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Days Selection */}
            <div className="space-y-2">
              <Label>Reminder days</Label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.id}
                    variant={settings.days.includes(day.id) ? "default" : "outline"}
                    size="sm"
                    className="w-12"
                    onClick={() => toggleDay(day.id)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                You&apos;ll receive reminders at{' '}
                <span className="font-medium text-foreground">
                  {TIME_OPTIONS.find(t => t.value === settings.time)?.label}
                </span>{' '}
                on{' '}
                <span className="font-medium text-foreground">
                  {settings.days.length === 7
                    ? 'every day'
                    : settings.days.length === 0
                    ? 'no days'
                    : settings.days
                        .map(d => DAYS_OF_WEEK.find(day => day.id === d)?.label)
                        .join(', ')}
                </span>
              </p>
            </div>
          </>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving || updatePreferences.isPending}
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save Reminder Settings'}
        </Button>
      </CardContent>
    </Card>
  )
}