
-- 1. User profiles for Batshare 99
CREATE TABLE public.batshare_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  user_track TEXT NOT NULL DEFAULT 'beginner', -- beginner, intermediate, professional, analysis
  has_business BOOLEAN NOT NULL DEFAULT false,
  business_efficiency INTEGER DEFAULT 0, -- 0-100
  experience_level TEXT DEFAULT 'none', -- none, beginner, intermediate, expert
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  budget_range TEXT,
  budget_amount NUMERIC DEFAULT 0,
  available_time TEXT,
  risk_tolerance TEXT DEFAULT 'medium',
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  location TEXT,
  behavior_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_visitor BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.batshare_user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON public.batshare_user_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));

-- 2. Smart assessments
CREATE TABLE public.batshare_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  track TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  behavior_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_summary TEXT,
  match_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.batshare_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own assessments" ON public.batshare_assessments
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));

-- 3. Personalized recommendations
CREATE TABLE public.batshare_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assessment_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  business_type TEXT,
  match_percentage INTEGER NOT NULL DEFAULT 0,
  required_budget NUMERIC DEFAULT 0,
  estimated_roi NUMERIC DEFAULT 0,
  difficulty TEXT DEFAULT 'medium',
  ai_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  market_research JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_customized BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'suggested',
  project_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.batshare_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recommendations" ON public.batshare_recommendations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));

-- 4. Hierarchical subscriptions
CREATE TABLE public.batshare_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free', -- free, analysis, suggestion, automation, human_review
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.batshare_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription" ON public.batshare_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO manages subscriptions" ON public.batshare_subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'ceo'::app_role))
  WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Users create own subscription" ON public.batshare_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. Business diagnostics
CREATE TABLE public.batshare_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  business_name TEXT,
  weak_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  strong_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  improvement_roadmap JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_recommendations JSONB NOT NULL DEFAULT '{}'::jsonb,
  health_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.batshare_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own diagnostics" ON public.batshare_diagnostics
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));

-- 6. Revival plans for failed projects
CREATE TABLE public.batshare_revival_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  failed_project_name TEXT NOT NULL,
  failure_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  core_mistakes JSONB NOT NULL DEFAULT '[]'::jsonb,
  revival_strategy JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_reduction JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_analysis TEXT,
  new_project_id UUID,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.batshare_revival_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own revival plans" ON public.batshare_revival_plans
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));

-- 7. Auto-generated websites
CREATE TABLE public.batshare_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  recommendation_id UUID,
  site_name TEXT NOT NULL,
  site_type TEXT DEFAULT 'landing',
  template TEXT DEFAULT 'modern',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_html TEXT,
  preview_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.batshare_websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own websites" ON public.batshare_websites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'ceo'::app_role));

-- Triggers
CREATE TRIGGER batshare_user_profiles_updated_at BEFORE UPDATE ON public.batshare_user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER batshare_recommendations_updated_at BEFORE UPDATE ON public.batshare_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER batshare_websites_updated_at BEFORE UPDATE ON public.batshare_websites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_batshare_assessments_user ON public.batshare_assessments(user_id);
CREATE INDEX idx_batshare_recommendations_user ON public.batshare_recommendations(user_id);
CREATE INDEX idx_batshare_diagnostics_user ON public.batshare_diagnostics(user_id);
