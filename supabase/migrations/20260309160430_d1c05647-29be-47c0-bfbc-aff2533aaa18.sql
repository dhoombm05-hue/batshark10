
CREATE TABLE public.business_feasibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  business_type TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  ai_analysis JSONB,
  risk_score NUMERIC DEFAULT 0,
  feasibility_score NUMERIC DEFAULT 0,
  recommendation TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_feasibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view feasibility" ON public.business_feasibility FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can create feasibility" ON public.business_feasibility FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator or CEO can update feasibility" ON public.business_feasibility FOR UPDATE USING (auth.uid() = created_by OR has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "Creator or CEO can delete feasibility" ON public.business_feasibility FOR DELETE USING (auth.uid() = created_by OR has_role(auth.uid(), 'ceo'::app_role));
