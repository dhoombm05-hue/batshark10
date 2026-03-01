
CREATE TABLE public.performance_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  cycle_start TIMESTAMP WITH TIME ZONE NOT NULL,
  cycle_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_actions INTEGER NOT NULL DEFAULT 0,
  updates_count INTEGER NOT NULL DEFAULT 0,
  creates_count INTEGER NOT NULL DEFAULT 0,
  deletes_count INTEGER NOT NULL DEFAULT 0,
  financial_impact NUMERIC NOT NULL DEFAULT 0,
  final_score INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.performance_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view cycles" ON public.performance_cycles
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert cycles" ON public.performance_cycles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
