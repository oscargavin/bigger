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

export default function BuddyPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const utils = api.useUtils()

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Your Gym Buddy</h1>
          <p className="text-muted-foreground">Stay accountable together</p>
        </div>

        <Card className="card-interactive border-2 border-border dark:border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Partnership
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-brand-500 dark:from-violet-400 dark:to-brand-400" />
                <div>
                  <p className="font-semibold">{currentPairing.buddy.fullName}</p>
                  <p className="text-sm text-muted-foreground">@{currentPairing.buddy.username}</p>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Partners since</p>
                <p>{new Date(currentPairing.startedAt!).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
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
      </div>
    )
  }

  // Otherwise show search and requests
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find a Gym Buddy</h1>
        <p className="text-muted-foreground">Partner up for accountability and motivation</p>
      </div>

      {/* Pending Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <Card className="card-elevated hover-lift overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent dark:from-emerald-400/10" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Pending Requests
            </CardTitle>
            <CardDescription>People who want to be your gym buddy</CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface-raised dark:bg-surface-base p-3 hover:bg-surface-overlay dark:hover:bg-surface-raised transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 dark:from-emerald-300 dark:to-emerald-500" />
                  <div>
                    <p className="font-medium">{request.from.fullName}</p>
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
        <Card className="card-elevated hover-lift overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent dark:from-brand-400/10" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              Sent Requests
            </CardTitle>
            <CardDescription>Waiting for response</CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-3">
            {sentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface-raised dark:bg-surface-base p-3 hover:bg-surface-overlay dark:hover:bg-surface-raised transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 dark:from-brand-300 dark:to-brand-500" />
                  <div>
                    <p className="font-medium">{request.to.fullName}</p>
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
      <Card className="card-glass border-2 border-border/50 shadow-soft-xl">
        <CardHeader>
          <CardTitle>Search for a Buddy</CardTitle>
          <CardDescription>Find someone to keep you accountable</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search by username or name</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Enter username or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
              <Button size="icon" variant="outline" disabled={!searchQuery || isSearching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults && searchResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Search Results</p>
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface-raised dark:bg-surface-base p-3 hover:bg-surface-overlay dark:hover:bg-surface-raised transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 dark:from-violet-300 dark:to-violet-500" />
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendRequest.mutate({ toUserId: user.id })}
                    disabled={sendRequest.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Request
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchResults && searchResults.length === 0 && searchQuery && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No users found matching &quot;{searchQuery}&quot;
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}