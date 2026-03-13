
CREATE TABLE public.business_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  business_type TEXT,
  sector TEXT,
  location TEXT,
  description TEXT,
  ai_research JSONB DEFAULT '{}'::jsonb,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  market_data JSONB DEFAULT '{}'::jsonb,
  financial_plan JSONB DEFAULT '{}'::jsonb,
  action_plan JSONB DEFAULT '{}'::jsonb,
  competitors JSONB DEFAULT '[]'::jsonb,
  licenses JSONB DEFAULT '[]'::jsonb,
  risk_assessment JSONB DEFAULT '{}'::jsonb,
  excel_data JSONB DEFAULT '[]'::jsonb,
  feasibility_score NUMERIC DEFAULT 0,
  risk_score NUMERIC DEFAULT 0,
  recommendation TEXT DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'pending',
  ceo_decision TEXT DEFAULT NULL,
  ceo_notes TEXT DEFAULT NULL,
  decided_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  auto_generated BOOLEAN DEFAULT true,
  generation_cycle INTEGER DEFAULT 1,
  next_generation_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '3 days'),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view proposals" ON public.business_proposals FOR SELECT TO authenticated USING (true);
CREATE POLICY "CEO can insert proposals" ON public.business_proposals FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can update proposals" ON public.business_proposals FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "CEO can delete proposals" ON public.business_proposals FOR DELETE TO authenticated USING (has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "Service role can insert proposals" ON public.business_proposals FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update proposals" ON public.business_proposals FOR UPDATE TO service_role USING (true);
