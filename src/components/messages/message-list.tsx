"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/utils/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, SendIcon, TrashIcon, EditIcon } from "lucide-react";
import { useMessageSubscription } from "@/hooks/use-message-subscription";

interface MessageListProps {
  pairingId: string;
  currentUserId: string;
}

export function MessageList({ pairingId, currentUserId }: MessageListProps) {
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Subscribe to real-time message updates
  useMessageSubscription(pairingId);

  const utils = api.useUtils();
  const { data: messagesData, hasNextPage, fetchNextPage } = api.messages.getMessages.useInfiniteQuery(
    { pairingId, limit: 50 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const sendMessage = api.messages.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      utils.messages.getMessages.invalidate({ pairingId });
      utils.messages.getUnreadCount.invalidate({ pairingId });
    },
  });

  const markAsRead = api.messages.markAsRead.useMutation({
    onSuccess: () => {
      utils.messages.getUnreadCount.invalidate({ pairingId });
    },
  });

  const editMessage = api.messages.editMessage.useMutation({
    onSuccess: () => {
      setEditingMessageId(null);
      setEditContent("");
      utils.messages.getMessages.invalidate({ pairingId });
    },
  });

  const deleteMessage = api.messages.deleteMessage.useMutation({
    onSuccess: () => {
      utils.messages.getMessages.invalidate({ pairingId });
    },
  });

  const messages = useMemo(() => 
    messagesData?.pages.flatMap(page => page.messages).reverse() ?? [],
    [messagesData]
  );

  // Track which messages we've already marked as read to prevent duplicates
  const markedAsReadRef = useRef<Set<string>>(new Set());

  // Mark messages as read when they come into view
  useEffect(() => {
    const unreadMessages = messages.filter(
      message => message.senderId !== currentUserId && 
      !message.readAt && 
      !markedAsReadRef.current.has(message.id)
    );
    
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(message => {
        markedAsReadRef.current.add(message.id);
        markAsRead.mutate({ messageId: message.id });
      });
    }
  }, [messages, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to top when new messages arrive (since newest are at top)
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, [messages.length]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage.mutate({
        pairingId,
        content: newMessage.trim(),
      });
    }
  };

  const handleEditMessage = (messageId: string) => {
    if (editContent.trim()) {
      editMessage.mutate({
        messageId,
        content: editContent.trim(),
      });
    }
  };

  const messageTypeIcons = {
    text: null,
    celebration: "🎉",
    encouragement: "💪",
    challenge: "🏆",
  };

  return (
    <Card className="flex flex-col h-[600px] shadow-sm border-border/50">
      <CardHeader className="border-b bg-surface/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Messages</CardTitle>
          {messages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {messages.length} messages
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted/50 p-4 mb-4">
                <SendIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === currentUserId;
                const isEditing = editingMessageId === message.id;

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
                      isOwnMessage ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "group relative max-w-[70%] rounded-2xl px-4 py-3 transition-all",
                        isOwnMessage
                          ? "bg-primary text-primary-foreground hover:shadow-md"
                          : "bg-surface-raised hover:bg-muted/80"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {message.messageType !== 'text' && (
                          <span className="text-lg">
                            {messageTypeIcons[message.messageType as keyof typeof messageTypeIcons]}
                          </span>
                        )}
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {message.sender.fullName || message.sender.username}
                            </span>
                            <span className={cn(
                              "text-xs",
                              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { 
                                addSuffix: true 
                              }) : ''}
                            </span>
                            {message.editedAt && (
                              <span className={cn(
                                "text-xs italic",
                                isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>
                                (edited)
                              </span>
                            )}
                          </div>
                          {isEditing ? (
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleEditMessage(message.id);
                                  }
                                }}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleEditMessage(message.id)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditContent("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed break-words">{message.content}</p>
                          )}
                          {isOwnMessage && !message.deletedAt && (
                            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 hover:bg-white/10"
                                onClick={() => {
                                  setEditingMessageId(message.id);
                                  setEditContent(message.content);
                                }}
                              >
                                <EditIcon className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 hover:bg-white/10"
                                onClick={() => deleteMessage.mutate({ messageId: message.id })}
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {message.readAt && isOwnMessage && (
                            <div className="absolute -bottom-5 right-0 flex items-center gap-1">
                              <CheckIcon className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Read</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {hasNextPage && (
                <div className="pt-2 pb-4">
                  <Button
                    variant="ghost"
                    onClick={() => fetchNextPage()}
                    className="w-full hover:bg-muted/50"
                  >
                    Load older messages
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="border-t bg-surface/50 p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 h-11 bg-background border-border/50 focus:border-primary/50 transition-colors"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessage.isPending}
              size="default"
              className="h-11 px-4 shadow-sm"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}