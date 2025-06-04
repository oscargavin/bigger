'use client'

import { useState } from 'react'
import { api } from '@/utils/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Search, UserPlus, X, Check, Clock, Users, CheckCircle } from 'lucide-react'
import type { User } from '@/types/api'
import { HeadToHead } from '@/components/comparison/head-to-head'
import { MessageList } from '@/components/messages/message-list'
import { QuickMessage } from '@/components/messages/quick-message'
import { MilestoneCelebrations } from '@/components/milestones/milestone-celebrations'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function BuddyPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showEndDialog, setShowEndDialog] = useState(false)
  const utils = api.useUtils()
  const { data: user } = api.auth.getUser.useQuery()

  // Queries
  const { data: currentPairing } = api.pairings.getCurrentPairing.useQuery()
  const { data: headToHeadStats } = api.pairings.getHeadToHeadStats.useQuery(
    undefined,
    { enabled: !!currentPairing }
  )
  const { data: pendingRequests } = api.pairings.getPendingRequests.useQuery()
  const { data: sentRequests } = api.pairings.getSentRequests.useQuery()
  const { data: searchResults, isLoading: isSearching } = api.pairings.searchUsers.useQuery(
    { query: searchQuery }
  )
  
  // Create a set of user IDs that have pending requests
  const sentRequestUserIds = new Set(sentRequests?.map(req => req.to.id) || [])

  // Mutations
  const sendRequest = api.pairings.sendRequest.useMutation({
    onSuccess: () => {
      utils.pairings.getSentRequests.invalidate()
      utils.pairings.searchUsers.invalidate()
      setSearchQuery('')
    },
  })

  const acceptRequest = api.pairings.acceptRequest.useMutation({
    onSuccess: () => {
      utils.pairings.getCurrentPairing.invalidate()
      utils.pairings.getPendingRequests.invalidate()
    },
  })

  const rejectRequest = api.pairings.rejectRequest.useMutation({
    onSuccess: () => {
      utils.pairings.getPendingRequests.invalidate()
    },
  })

  const cancelRequest = api.pairings.cancelRequest.useMutation({
    onSuccess: () => {
      utils.pairings.getSentRequests.invalidate()
    },
  })

  const endPairing = api.pairings.endPairing.useMutation({
    onSuccess: () => {
      utils.pairings.getCurrentPairing.invalidate()
      setShowEndDialog(false)
    },
  })

  // If user has an active pairing, show that
  if (currentPairing) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Your Gym Buddy</h1>
          <p className="text-lg text-muted-foreground mt-2">Stay accountable together</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <Card>
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-accent/10 p-2">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">Current Partnership</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {currentPairing.buddy.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{currentPairing.buddy.fullName}</p>
                      <p className="text-muted-foreground">@{currentPairing.buddy.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Partners since</p>
                    <p className="font-medium">{new Date(currentPairing.startedAt!).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Quick Message Widget */}
                <QuickMessage 
                  pairingId={currentPairing.id} 
                  partnerName={currentPairing.buddy.fullName}
                />
              </CardContent>
              <CardFooter className="pt-6 border-t border-border">
                <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      End Partnership
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>End Partnership?</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to end your partnership with {currentPairing.buddy.fullName}? 
                        This action cannot be undone. You&apos;ll both need to find new gym buddies.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowEndDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => endPairing.mutate({ pairingId: currentPairing.id })}
                        disabled={endPairing.isPending}
                      >
                        {endPairing.isPending ? 'Ending...' : 'End Partnership'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>

            {/* Head-to-Head Comparison */}
            {headToHeadStats && (
              <HeadToHead
                user={headToHeadStats.user}
                partner={headToHeadStats.partner}
              />
            )}
          </TabsContent>

          <TabsContent value="messages">
            <MessageList 
              pairingId={currentPairing.id} 
              currentUserId={user?.id || ''}
            />
          </TabsContent>

          <TabsContent value="milestones">
            <MilestoneCelebrations />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Otherwise show search and requests
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Find a Gym Buddy</h1>
        <p className="text-lg text-muted-foreground mt-2">Partner up for accountability and motivation</p>
      </div>

      {/* Pending Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <Card className="border-2 border-success/20 relative overflow-hidden">
          <CardHeader className="pb-6 relative">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-success/10 p-2">
                <Clock className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle className="text-xl">Pending Buddy Requests ({pendingRequests.length})</CardTitle>
                <CardDescription className="text-base">Accept a request to start your accountability journey!</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4 hover:bg-muted transition-colors duration-200">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <span className="font-medium">
                      {request.from.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{request.from.fullName}</p>
                    <p className="text-sm text-muted-foreground">@{request.from.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-success hover:bg-success/90 text-success-foreground"
                    onClick={() => acceptRequest.mutate({ requestId: request.id })}
                    disabled={acceptRequest.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectRequest.mutate({ requestId: request.id })}
                    disabled={rejectRequest.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sent Requests */}
      {sentRequests && sentRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Sent Requests</CardTitle>
                <CardDescription>Waiting for response</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4 hover:bg-muted transition-colors duration-200">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <span className="font-medium">
                      {request.to.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{request.to.fullName}</p>
                    <p className="text-sm text-muted-foreground">@{request.to.username}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => cancelRequest.mutate({ requestId: request.id })}
                  disabled={cancelRequest.isPending}
                >
                  Cancel
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search for Users */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl">Search for a Buddy</CardTitle>
          <CardDescription>Find someone to keep you accountable</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">Search by username or name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? 'Searching for users...' : 'Showing all available users'}
            </p>
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          )}
          
          {!isSearching && searchResults && searchResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                {searchQuery ? 'Search Results' : 'Available Users'} ({searchResults.length})
              </p>
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4 hover:bg-muted transition-colors duration-200">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  {sentRequestUserIds.has(user.id) ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled
                      className="bg-success/10 text-success hover:bg-success/10"
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Requested
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => sendRequest.mutate({ toUserId: user.id })}
                      disabled={sendRequest.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-1.5" />
                      Request
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchResults && searchResults.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery 
                  ? `No users found matching "${searchQuery}"`
                  : 'No available users to pair with'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}