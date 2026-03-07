
-- Chat room settings table
CREATE TABLE public.chat_room_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  theme_color TEXT DEFAULT '#1e90ff',
  wallpaper_url TEXT,
  wallpaper_opacity NUMERIC DEFAULT 0.3,
  is_private BOOLEAN DEFAULT false,
  allowed_roles TEXT[] DEFAULT '{}',
  notifications_enabled BOOLEAN DEFAULT true,
  notification_sound TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id)
);

-- Enable RLS
ALTER TABLE public.chat_room_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated can view room settings"
  ON public.chat_room_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Room creator or CEO can update settings"
  ON public.chat_room_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = chat_room_settings.room_id
      AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'ceo'))
    )
  );

CREATE POLICY "Room creator or CEO can insert settings"
  ON public.chat_room_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = chat_room_settings.room_id
      AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'ceo'))
    )
  );

CREATE POLICY "Room creator or CEO can delete settings"
  ON public.chat_room_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = chat_room_settings.room_id
      AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'ceo'))
    )
  );
