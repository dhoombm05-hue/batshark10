import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RoomSettings {
  id: string;
  room_id: string;
  theme_color: string;
  wallpaper_url: string | null;
  wallpaper_opacity: number;
  is_private: boolean;
  allowed_roles: string[];
  notifications_enabled: boolean;
  notification_sound: string;
  created_at: string;
  updated_at: string;
}

export function useRoomSettings(roomId: string | null) {
  const [settings, setSettings] = useState<RoomSettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) { setSettings(null); return; }
    setLoading(true);
    supabase
      .from('chat_room_settings')
      .select('*')
      .eq('room_id', roomId)
      .maybeSingle()
      .then(({ data }) => {
        setSettings(data as RoomSettings | null);
        setLoading(false);
      });
  }, [roomId]);

  const upsertSettings = useCallback(async (roomId: string, updates: Partial<RoomSettings>) => {
    // Try update first
    const { data: existing } = await supabase
      .from('chat_room_settings')
      .select('id')
      .eq('room_id', roomId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('chat_room_settings')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('room_id', roomId)
        .select()
        .single();
      if (data) setSettings(data as RoomSettings);
      return { data, error };
    } else {
      const { data, error } = await supabase
        .from('chat_room_settings')
        .insert({ room_id: roomId, ...updates } as any)
        .select()
        .single();
      if (data) setSettings(data as RoomSettings);
      return { data, error };
    }
  }, []);

  return { settings, loading, upsertSettings };
}
