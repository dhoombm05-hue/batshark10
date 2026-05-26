
CREATE TABLE IF NOT EXISTS public.music_control (
  id INT PRIMARY KEY DEFAULT 1,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  track_url TEXT,
  track_title TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT music_control_singleton CHECK (id = 1)
);

INSERT INTO public.music_control (id, is_playing) VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.music_control ENABLE ROW LEVEL SECURITY;

CREATE POLICY "music_control_read_all"
ON public.music_control FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "music_control_ceo_update"
ON public.music_control FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'ceo'))
WITH CHECK (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "music_control_ceo_insert"
ON public.music_control FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ceo'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.music_control;
ALTER TABLE public.music_control REPLICA IDENTITY FULL;
