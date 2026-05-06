
-- Ad Campaigns
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  name TEXT NOT NULL,
  business_type TEXT,
  ad_type TEXT NOT NULL DEFAULT 'social',
  platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  ad_copy TEXT,
  cta TEXT,
  hashtags JSONB DEFAULT '[]'::jsonb,
  best_times JSONB DEFAULT '[]'::jsonb,
  audience JSONB DEFAULT '{}'::jsonb,
  budget NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  templates JSONB DEFAULT '[]'::jsonb,
  brief TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages campaigns" ON public.ad_campaigns FOR ALL TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'ceo'::app_role))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(),'ceo'::app_role));
CREATE POLICY "guest can insert campaigns" ON public.ad_campaigns FOR INSERT TO anon WITH CHECK (true);

-- Generated Platforms (full standalone mini-sites)
CREATE TABLE IF NOT EXISTS public.generated_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  owner_email TEXT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  platform_type TEXT NOT NULL DEFAULT 'general',
  access_code TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  brand JSONB DEFAULT '{}'::jsonb,
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  meta JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'live',
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.generated_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read platforms" ON public.generated_platforms FOR SELECT USING (true);
CREATE POLICY "owner manage platforms" ON public.generated_platforms FOR ALL TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'ceo'::app_role))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(),'ceo'::app_role));
CREATE POLICY "anon insert platforms" ON public.generated_platforms FOR INSERT TO anon WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_platforms_slug ON public.generated_platforms(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON public.ad_campaigns(user_id);
