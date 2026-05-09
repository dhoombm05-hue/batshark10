
ALTER TABLE public.generated_platforms ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.b99_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id uuid REFERENCES public.generated_platforms(id) ON DELETE CASCADE,
  user_id uuid,
  level integer NOT NULL DEFAULT 2,
  client_api_key text NOT NULL,
  embed_snippet text NOT NULL,
  webhook_url text NOT NULL,
  ai_proxy_endpoint text NOT NULL,
  external_site_url text,
  external_backend_type text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.b99_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can create integration"
ON public.b99_integrations FOR INSERT TO anon, authenticated
WITH CHECK (length(trim(client_api_key)) > 10);

CREATE POLICY "owner or ceo read integration"
ON public.b99_integrations FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "owner or ceo update integration"
ON public.b99_integrations FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "owner or ceo delete integration"
ON public.b99_integrations FOR DELETE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));

CREATE TABLE IF NOT EXISTS public.b99_ai_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  owner_email text,
  owner_name text,
  business_name text,
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  data_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  schedule text NOT NULL DEFAULT 'daily',
  status text NOT NULL DEFAULT 'active',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.b99_ai_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can hire ai employee"
ON public.b99_ai_employees FOR INSERT TO anon, authenticated
WITH CHECK (length(trim(coalesce(business_name,''))) >= 2);

CREATE POLICY "owner or ceo read ai employee"
ON public.b99_ai_employees FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "owner or ceo update ai employee"
ON public.b99_ai_employees FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "owner or ceo delete ai employee"
ON public.b99_ai_employees FOR DELETE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));
