import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export function useUnreadCounts() {
  const [pmUnread, setPmUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const { user } = useAuthContext();

  const fetchCounts = useCallback(async () => {
    if (!user) return;

    // Private messages unread - only count messages sent TO me that are unread
    const { count: pmCount } = await supabase
      .from('private_messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', user.id);
    setPmUnread(pmCount || 0);

    // Chat rooms unread - compare last_read_at with latest messages
    const { data: memberships } = await supabase
      .from('chat_room_members')
      .select('room_id, last_read_at')
      .eq('user_id', user.id);

    if (memberships?.length) {
      let total = 0;
      for (const m of memberships) {
        const { count } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('room_id', m.room_id)
          .neq('user_id', user.id)
          .gt('created_at', m.last_read_at || '1970-01-01');
        total += (count || 0);
      }
      setChatUnread(total);
    } else {
      setChatUnread(0);
    }
  }, [user]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Realtime updates - listen to INSERT, UPDATE and DELETE
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('unread-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_messages' }, () => fetchCounts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => fetchCounts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_room_members' }, () => fetchCounts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchCounts]);

  // Mark chat room as read
  const markChatRoomRead = useCallback(async (roomId: string) => {
    if (!user) return;
    await supabase
      .from('chat_room_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', user.id);
    fetchCounts();
  }, [user, fetchCounts]);

  return { pmUnread, chatUnread, totalUnread: pmUnread + chatUnread, refetch: fetchCounts, markChatRoomRead };
}
