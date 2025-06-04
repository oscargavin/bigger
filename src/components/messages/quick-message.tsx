"use client";

import { useState } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircleIcon, SendIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickMessageProps {
  pairingId: string;
  partnerName?: string;
}

export function QuickMessage({ pairingId, partnerName }: QuickMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState("");

  const utils = api.useUtils();
  const { data: unreadCount } = api.messages.getUnreadCount.useQuery({ pairingId });

  const sendMessage = api.messages.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      setIsExpanded(false);
      utils.messages.getUnreadCount.invalidate({ pairingId });
    },
  });

  const quickMessages = [
    { type: 'encouragement' as const, text: "Let's crush it today! 💪", icon: "💪" },
    { type: 'celebration' as const, text: "Great workout! 🎉", icon: "🎉" },
    { type: 'challenge' as const, text: "Race you to the gym! 🏃", icon: "🏆" },
  ];

  const handleQuickSend = (type: typeof quickMessages[0]['type'], text: string) => {
    sendMessage.mutate({
      pairingId,
      content: text,
      messageType: type,
    });
  };

  return (
    <Card className={cn("transition-all", isExpanded && "shadow-lg")}>
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircleIcon className="h-4 w-4" />
            Quick Message {partnerName && `to ${partnerName}`}
          </CardTitle>
          {unreadCount && unreadCount.count > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount.count} new
            </Badge>
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {quickMessages.map((qm) => (
              <Button
                key={qm.text}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSend(qm.type, qm.text)}
                className="justify-start"
              >
                <span className="mr-2">{qm.icon}</span>
                {qm.text}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && message.trim()) {
                  sendMessage.mutate({
                    pairingId,
                    content: message.trim(),
                  });
                }
              }}
              placeholder="Custom message..."
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => {
                if (message.trim()) {
                  sendMessage.mutate({
                    pairingId,
                    content: message.trim(),
                  });
                }
              }}
              disabled={!message.trim() || sendMessage.isPending}
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}