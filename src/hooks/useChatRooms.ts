import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface ChatRoom {
  id: string;
  name: string;
  type: string;
  description: string | null;
  project_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  content: string;
  reply_to_id: string | null;
  file_url: string | null;
  file_name: string | null;
  is_pinned: boolean;
  is_edited: boolean;
  reactions: Record<string, string[]>;
  message_type: string;
  created_at: string;
}

export function useChatRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

  const fetchRooms = useCallback(async () => {
    const { data } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('updated_at', { ascending: false });
    setRooms((data as ChatRoom[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const createRoom = useCallback(async (name: string, type: string, description?: string, projectId?: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({ name, type, description: description || null, project_id: projectId || null, created_by: user.id })
      .select()
      .single();
    if (data) {
      await supabase.from('chat_room_members').insert({ room_id: data.id, user_id: user.id });
      setRooms(prev => [data as ChatRoom, ...prev]);
    }
    return { data, error };
  }, [user]);

  const deleteRoom = useCallback(async (roomId: string) => {
    await supabase.from('chat_rooms').delete().eq('id', roomId);
    setRooms(prev => prev.filter(r => r.id !== roomId));
  }, []);

  return { rooms, loading, createRoom, deleteRoom, refetch: fetchRooms };
}

export function useChatMessages(roomId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuthContext();

  useEffect(() => {
    if (!roomId) { setMessages([]); return; }
    setLoading(true);
    supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(200)
      .then(({ data }) => {
        setMessages((data as ChatMessage[]) || []);
        setLoading(false);
      });
  }, [roomId]);

  // Realtime for INSERT and UPDATE
  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`chat-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === (payload.new as ChatMessage).id)) return prev;
          return [...prev, payload.new as ChatMessage];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages(prev => prev.map(m => m.id === (payload.new as ChatMessage).id ? payload.new as ChatMessage : m));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const sendMessage = useCallback(async (content: string, replyToId?: string, fileUrl?: string, fileName?: string, messageType = 'text') => {
    if (!user || !roomId || !content.trim()) return;
    await supabase.from('chat_messages').insert({
      room_id: roomId,
      user_id: user.id,
      user_name: profile?.display_name || 'مجهول',
      content: content.trim(),
      reply_to_id: replyToId || null,
      file_url: fileUrl || null,
      file_name: fileName || null,
      message_type: messageType,
    });
    // Update room timestamp
    await supabase.from('chat_rooms').update({ updated_at: new Date().toISOString() }).eq('id', roomId);
  }, [user, roomId, profile]);

  const editMessage = useCallback(async (msgId: string, newContent: string) => {
    await supabase.from('chat_messages').update({ content: newContent, is_edited: true }).eq('id', msgId);
  }, []);

  const deleteMessage = useCallback(async (msgId: string) => {
    await supabase.from('chat_messages').delete().eq('id', msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
  }, []);

  const togglePin = useCallback(async (msgId: string, pinned: boolean) => {
    await supabase.from('chat_messages').update({ is_pinned: !pinned }).eq('id', msgId);
  }, []);

  const addReaction = useCallback(async (msgId: string, emoji: string) => {
    if (!user) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const reactions = { ...(msg.reactions || {}) };
    const users = reactions[emoji] || [];
    if (users.includes(user.id)) {
      reactions[emoji] = users.filter(u => u !== user.id);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...users, user.id];
    }
    await supabase.from('chat_messages').update({ reactions }).eq('id', msgId);
  }, [messages, user]);

  return { messages, loading, sendMessage, editMessage, deleteMessage, togglePin, addReaction };
}
