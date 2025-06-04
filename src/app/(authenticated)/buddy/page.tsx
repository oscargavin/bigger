'use client'

import { useState } from 'react'
import { api } from '@/utils/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Search, UserPlus, X, Check, Clock, Users } from 'lucide-react'
import type { User } from '@/types/api'
import { HeadToHead } from '@/components/comparison/head-to-head'
import { MessageList } from '@/components/messages/message-list'
import { QuickMessage } from '@/components/messages/quick-message'
import { MilestoneCelebrations } from '@/components/milestones/milestone-celebrations'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function BuddyPage() {
  const [searchQuery, setSearchQuery] = useState('')
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
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  )

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
            <Card className="border-border/50 bg-surface">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-violet-500/10 p-2">
                    <Users className="h-5 w-5 text-violet-600" />
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
              <CardFooter className="pt-6 border-t border-border/50">
                <Button
                  variant="destructive"
                  onClick={() => endPairing.mutate({ pairingId: currentPairing.id })}
                  disabled={endPairing.isPending}
                >
                  End Partnership
                </Button>
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
        <Card className="border-border/50 bg-surface">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2">
                <Clock className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Pending Requests</CardTitle>
                <CardDescription>People who want to be your gym buddy</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/5 p-4 hover:bg-muted/10 transition-all duration-200">
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
                    variant="outline"
                    onClick={() => acceptRequest.mutate({ requestId: request.id })}
                    disabled={acceptRequest.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
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
        <Card className="border-border/50 bg-surface">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Sent Requests</CardTitle>
                <CardDescription>Waiting for response</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/5 p-4 hover:bg-muted/10 transition-all duration-200">
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
      <Card className="border-border/50 bg-surface">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl">Search for a Buddy</CardTitle>
          <CardDescription>Find someone to keep you accountable</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">Search by username or name</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Enter username or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                className="h-11"
              />
              <Button size="icon" variant="outline" disabled={!searchQuery || isSearching} className="h-11 w-11">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults && searchResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Search Results</p>
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/5 p-4 hover:bg-muted/10 transition-all duration-200">
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
                  <Button
                    size="sm"
                    onClick={() => sendRequest.mutate({ toUserId: user.id })}
                    disabled={sendRequest.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Request
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchResults && searchResults.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No users found matching &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}