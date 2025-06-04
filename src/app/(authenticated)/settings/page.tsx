'use client'

import { api } from '@/utils/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ReminderSettings } from '@/components/notifications/reminder-settings'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const { data: user } = api.auth.getUser.useQuery()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences</p>
        </div>
      </div>

      {/* User Info */}
      <Card className="border-border/50 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-xl">Account Information</CardTitle>
          <CardDescription>Your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Username</span>
            <span className="text-sm font-medium">{user?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Full Name</span>
            <span className="text-sm font-medium">{user?.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Member Since</span>
            <span className="text-sm font-medium">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <ReminderSettings />

      {/* More settings sections can be added here */}
    </div>
  )
}