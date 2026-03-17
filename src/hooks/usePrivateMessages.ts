import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface PrivateConversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  other_user?: { display_name: string; avatar_url: string | null; job_title: string | null };
  unread_count?: number;
}

export interface PrivateMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

export function useConversations() {
  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('private_conversations')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (!data) { setConversations([]); setLoading(false); return; }

    const otherIds = [...new Set(data.map(c => c.user1_id === user.id ? c.user2_id : c.user1_id))];
    const [{ data: profiles }, { data: unreadData }] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, avatar_url, job_title').in('user_id', otherIds),
      supabase.from('private_messages').select('conversation_id').eq('is_read', false).neq('sender_id', user.id),
    ]);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    const unreadMap = new Map<string, number>();
    (unreadData || []).forEach((m: any) => {
      unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) || 0) + 1);
    });

    setConversations(data.map(c => {
      const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
      return {
        ...c,
        other_user: profileMap.get(otherId) || { display_name: 'مستخدم', avatar_url: null, job_title: null },
        unread_count: unreadMap.get(c.id) || 0,
      };
    }) as PrivateConversation[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Realtime - listen to both messages and conversation updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('private-convos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_messages' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_conversations' }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  const startConversation = useCallback(async (otherUserId: string) => {
    if (!user) return null;
    const [id1, id2] = [user.id, otherUserId].sort();
    // Check existing
    const { data: existing } = await supabase
      .from('private_conversations')
      .select('*')
      .eq('user1_id', id1)
      .eq('user2_id', id2)
      .maybeSingle();
    if (existing) return existing as PrivateConversation;

    const { data, error } = await supabase
      .from('private_conversations')
      .insert({ user1_id: id1, user2_id: id2 } as any)
      .select()
      .single();
    if (data) fetchConversations();
    return data as PrivateConversation | null;
  }, [user, fetchConversations]);

  return { conversations, loading, startConversation, refetch: fetchConversations };
}

export function usePrivateMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuthContext();

  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    setLoading(true);
    supabase
      .from('private_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(500)
      .then(({ data }) => {
        setMessages((data as PrivateMessage[]) || []);
        setLoading(false);
        // Mark as read and update local state immediately
        if (user && data?.length) {
          const unread = data.filter(m => !m.is_read && m.sender_id !== user.id).map(m => m.id);
          if (unread.length > 0) {
            supabase.from('private_messages').update({ is_read: true } as any).in('id', unread).then(() => {
              // Update local messages to reflect read status
              setMessages(prev => prev.map(m => unread.includes(m.id) ? { ...m, is_read: true } : m));
            });
          }
        }
      });
  }, [conversationId, user]);

  // Realtime
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`pm-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'private_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as PrivateMessage;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        // Auto mark as read
        if (user && newMsg.sender_id !== user.id) {
          supabase.from('private_messages').update({ is_read: true } as any).eq('id', newMsg.id).then(() => {});
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user]);

  const sendMessage = useCallback(async (content: string, fileUrl?: string, fileName?: string, messageType = 'text') => {
    if (!user || !conversationId || !content.trim()) return;
    await supabase.from('private_messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      file_url: fileUrl || null,
      file_name: fileName || null,
      message_type: messageType,
    } as any);
    // Update conversation
    await supabase.from('private_conversations').update({
      last_message: content.trim().slice(0, 100),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any).eq('id', conversationId);
  }, [user, conversationId]);

  return { messages, loading, sendMessage };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuthContext();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setUnreadCount((data || []).filter((n: any) => !n.is_read).length);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(async (id?: string) => {
    if (!user) return;
    if (id) {
      await supabase.from('notifications').update({ is_read: true } as any).eq('id', id);
    } else {
      await supabase.from('notifications').update({ is_read: true } as any).eq('user_id', user.id).eq('is_read', false);
    }
    fetchNotifications();
  }, [user, fetchNotifications]);

  return { notifications, unreadCount, markAsRead, refetch: fetchNotifications };
}
