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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    messagesData?.pages.flatMap(page => page.messages) ?? [],
    [messagesData]
  );

  // Mark messages as read when they come into view
  useEffect(() => {
    messages.forEach(message => {
      if (message.senderId !== currentUserId && !message.readAt) {
        markAsRead.mutate({ messageId: message.id });
      }
    });
  }, [messages, currentUserId, markAsRead]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-4">
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === currentUserId;
                const isEditing = editingMessageId === message.id;

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      isOwnMessage ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg p-3",
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {message.messageType !== 'text' && (
                          <span className="text-lg">
                            {messageTypeIcons[message.messageType as keyof typeof messageTypeIcons]}
                          </span>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {message.sender.fullName || message.sender.username}
                            </span>
                            <span className="text-xs opacity-70">
                              {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { 
                                addSuffix: true 
                              }) : ''}
                            </span>
                            {message.editedAt && (
                              <Badge variant="outline" className="text-xs">
                                edited
                              </Badge>
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
                            <p className="text-sm">{message.content}</p>
                          )}
                          {isOwnMessage && !message.deletedAt && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
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
                                onClick={() => deleteMessage.mutate({ messageId: message.id })}
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {message.readAt && isOwnMessage && (
                            <CheckIcon className="h-3 w-3 mt-1 opacity-70" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {hasNextPage && (
                <Button
                  variant="ghost"
                  onClick={() => fetchNextPage()}
                  className="w-full"
                >
                  Load more messages
                </Button>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div className="border-t p-4">
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
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessage.isPending}
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}