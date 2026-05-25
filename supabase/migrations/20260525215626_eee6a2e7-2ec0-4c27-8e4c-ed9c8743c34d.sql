-- Track per-user engagement (view duration) per news item
CREATE TABLE IF NOT EXISTS public.news_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_name text,
  user_avatar text,
  total_seconds integer NOT NULL DEFAULT 0,
  first_viewed_at timestamptz NOT NULL DEFAULT now(),
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (news_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_news_views_news ON public.news_views(news_id);
CREATE INDEX IF NOT EXISTS idx_news_views_user ON public.news_views(user_id);

ALTER TABLE public.news_views ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view (so authors and CEO see who watched)
CREATE POLICY "auth view news_views"
  ON public.news_views FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Users insert their own view records
CREATE POLICY "users insert own news_view"
  ON public.news_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users update their own view records (to accumulate seconds)
CREATE POLICY "users update own news_view"
  ON public.news_views FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CEO can delete
CREATE POLICY "ceo delete news_views"
  ON public.news_views FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'ceo'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.news_views;