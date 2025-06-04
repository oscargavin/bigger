"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/utils/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckIcon,
  SendIcon,
  TrashIcon,
  EditIcon,
  Paperclip,
  Mic,
  CornerDownLeft,
} from "lucide-react";
import { useMessageSubscription } from "@/hooks/use-message-subscription";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
} from "@/components/ui/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatInput } from "@/components/ui/chat-input";

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
  const {
    data: messagesData,
    hasNextPage,
    fetchNextPage,
  } = api.messages.getMessages.useInfiniteQuery(
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

  const messages = useMemo(
    () => messagesData?.pages.flatMap((page) => page.messages).reverse() ?? [],
    [messagesData]
  );

  // Track which messages we've already marked as read to prevent duplicates
  const markedAsReadRef = useRef<Set<string>>(new Set());

  // Mark messages as read when they come into view
  useEffect(() => {
    const unreadMessages = messages.filter(
      (message) =>
        message.senderId !== currentUserId &&
        !message.readAt &&
        !markedAsReadRef.current.has(message.id)
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach((message) => {
        markedAsReadRef.current.add(message.id);
        markAsRead.mutate({ messageId: message.id });
      });
    }
  }, [messages, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Get user initials for avatar fallback
  const getUserInitials = (user: any) => {
    if (user.fullName) {
      return user.fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();
    }
    return user.username ? user.username.substring(0, 2).toUpperCase() : "U";
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
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <ChatMessageList smooth>
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
              <>
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === currentUserId;
                  const isEditing = editingMessageId === message.id;

                  return (
                    <ChatBubble
                      key={message.id}
                      variant={isOwnMessage ? "sent" : "received"}
                    >
                      <ChatBubbleAvatar
                        src={message.sender.avatarUrl || undefined}
                        fallback={getUserInitials(message.sender)}
                        className="h-8 w-8 shrink-0"
                      />
                      <div className="flex flex-col gap-1 max-w-[70%]">
                        <ChatBubbleMessage
                          variant={isOwnMessage ? "sent" : "received"}
                          className="relative group"
                        >
                          <div className="flex items-start gap-2">
                            {message.messageType !== "text" && (
                              <span className="text-lg">
                                {
                                  messageTypeIcons[
                                    message.messageType as keyof typeof messageTypeIcons
                                  ]
                                }
                              </span>
                            )}
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-semibold text-sm">
                                  {message.sender.fullName ||
                                    message.sender.username}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs",
                                    isOwnMessage
                                      ? "text-primary-foreground/70"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {message.createdAt
                                    ? formatDistanceToNow(
                                        new Date(message.createdAt),
                                        {
                                          addSuffix: true,
                                        }
                                      )
                                    : ""}
                                </span>
                                {message.editedAt && (
                                  <span
                                    className={cn(
                                      "text-xs italic",
                                      isOwnMessage
                                        ? "text-primary-foreground/70"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    (edited)
                                  </span>
                                )}
                              </div>
                              {isEditing ? (
                                <div className="flex gap-2 mt-2">
                                  <ChatInput
                                    value={editContent}
                                    onChange={(e) =>
                                      setEditContent(e.target.value)
                                    }
                                    onKeyPress={(e) => {
                                      if (e.key === "Enter") {
                                        handleEditMessage(message.id);
                                      }
                                    }}
                                    className="flex-1 min-h-0 h-auto"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleEditMessage(message.id)
                                    }
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
                                <p className="text-sm leading-relaxed break-words">
                                  {message.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </ChatBubbleMessage>
                        {isOwnMessage && !message.deletedAt && (
                          <ChatBubbleActionWrapper className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChatBubbleAction
                              icon={<EditIcon className="h-3 w-3" />}
                              onClick={() => {
                                setEditingMessageId(message.id);
                                setEditContent(message.content);
                              }}
                            />
                            <ChatBubbleAction
                              icon={<TrashIcon className="h-3 w-3" />}
                              onClick={() =>
                                deleteMessage.mutate({ messageId: message.id })
                              }
                            />
                          </ChatBubbleActionWrapper>
                        )}
                        {message.readAt && isOwnMessage && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckIcon className="h-3 w-3" />
                            <span>Read</span>
                          </div>
                        )}
                      </div>
                    </ChatBubble>
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
              </>
            )}
          </ChatMessageList>
        </div>
        <div className="border-t bg-surface/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
          >
            <ChatInput
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center p-3 pt-0 justify-between">
              <Button
                type="submit"
                size="sm"
                className="ml-auto gap-1.5"
                disabled={!newMessage.trim() || sendMessage.isPending}
              >
                Send Message
                <CornerDownLeft className="size-3.5" />
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
