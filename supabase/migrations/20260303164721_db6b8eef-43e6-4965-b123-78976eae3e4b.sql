
-- User preferences table for themes, wallpapers, per-section backgrounds
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  theme text NOT NULL DEFAULT 'light',
  custom_bg_url text,
  section_backgrounds jsonb NOT NULL DEFAULT '{}'::jsonb,
  chat_wallpaper_url text,
  chat_wallpaper_opacity numeric NOT NULL DEFAULT 0.3,
  chat_wallpaper_blur numeric NOT NULL DEFAULT 8,
  chat_wallpaper_overlay text DEFAULT 'rgba(0,0,0,0.5)',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
