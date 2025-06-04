import { useEffect } from 'react';
import { api } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';

export function useMessageSubscription(pairingId: string | undefined) {
  const { toast } = useToast();
  const utils = api.useUtils();
  const { data: user } = api.auth.getUser.useQuery();

  useEffect(() => {
    if (!pairingId || !user) return;

    // Subscribe to new messages in the pairing
    const channel = supabase
      .channel(`messages:${pairingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `pairing_id=eq.${pairingId}`,
        },
        (payload) => {
          // Invalidate messages query to refetch
          utils.messages.getMessages.invalidate({ pairingId });
          utils.messages.getUnreadCount.invalidate({ pairingId });

          // Show notification if message is from partner
          if (payload.new.sender_id !== user.id) {
            toast({
              title: "New message",
              description: "Your buddy sent you a message",
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `pairing_id=eq.${pairingId}`,
        },
        () => {
          // Invalidate messages to show edits/read status
          utils.messages.getMessages.invalidate({ pairingId });
          utils.messages.getUnreadCount.invalidate({ pairingId });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pairingId, user, utils, toast]);
}