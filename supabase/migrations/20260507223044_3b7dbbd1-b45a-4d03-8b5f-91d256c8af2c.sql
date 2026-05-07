ALTER TABLE public.ad_campaigns
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.generated_platforms
  ADD COLUMN IF NOT EXISTS requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS build_level TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS build_mode TEXT NOT NULL DEFAULT 'standalone';

DROP POLICY IF EXISTS "public read platforms" ON public.generated_platforms;
DROP POLICY IF EXISTS "owner manage platforms" ON public.generated_platforms;
DROP POLICY IF EXISTS "anon insert platforms" ON public.generated_platforms;

CREATE POLICY "public can view live platform shell"
ON public.generated_platforms
FOR SELECT
USING (status = 'live');

CREATE POLICY "owners and ceo manage platforms"
ON public.generated_platforms
FOR ALL
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(),'ceo'::app_role))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(),'ceo'::app_role));

CREATE POLICY "guests can create platforms"
ON public.generated_platforms
FOR INSERT
TO anon
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.verify_platform_access(_slug text, _access_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.generated_platforms
    WHERE slug = _slug
      AND status = 'live'
      AND (
        is_public = true
        OR access_code IS NULL
        OR access_code = _access_code
      )
  );
$$;

CREATE INDEX IF NOT EXISTS idx_platforms_build_level ON public.generated_platforms(build_level);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON public.ad_campaigns(created_at DESC);