-- 1) Scheduling columns
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- All previously existing rows are considered published
UPDATE public.news SET is_published = true WHERE is_published IS DISTINCT FROM true;

CREATE INDEX IF NOT EXISTS idx_news_scheduled_pub ON public.news (is_published, scheduled_at);

-- 2) Ensure realtime fires on news inserts/updates
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'news';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.news';
  END IF;
END $$;

ALTER TABLE public.news REPLICA IDENTITY FULL;

-- 3) Cron: auto-publish scheduled news every minute
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Remove previous schedule if any (idempotent)
DO $$
DECLARE jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'publish_scheduled_news';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

SELECT cron.schedule(
  'publish_scheduled_news',
  '* * * * *',
  $$ UPDATE public.news
       SET is_published = true,
           updated_at = now()
     WHERE is_published = false
       AND scheduled_at <= now(); $$
);