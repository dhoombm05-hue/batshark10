
ALTER TABLE public.generated_platforms
  ADD COLUMN IF NOT EXISTS layout_mode TEXT NOT NULL DEFAULT 'longform',
  ADD COLUMN IF NOT EXISTS owner_password TEXT,
  ADD COLUMN IF NOT EXISTS backend_link TEXT,
  ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC,
  ADD COLUMN IF NOT EXISTS video_assets JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS product_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS theme_mode TEXT NOT NULL DEFAULT 'dark';

ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS video_scenes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS voiceover_script TEXT,
  ADD COLUMN IF NOT EXISTS video_prompt TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'vertical';

-- RPC to verify owner password (returns platform id when valid)
CREATE OR REPLACE FUNCTION public.verify_platform_owner(_slug TEXT, _owner_password TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.generated_platforms
  WHERE slug = _slug
    AND owner_password IS NOT NULL
    AND owner_password = _owner_password
  LIMIT 1;
$$;
