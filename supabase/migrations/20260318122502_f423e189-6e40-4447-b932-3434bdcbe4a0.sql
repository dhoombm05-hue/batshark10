-- Table for tracking project ownership/share sales
CREATE TABLE IF NOT EXISTS public.project_ownership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  action_type text NOT NULL DEFAULT 'sale',
  percentage_sold numeric NOT NULL DEFAULT 0,
  remaining_ownership numeric NOT NULL DEFAULT 100,
  buyer_name text,
  sale_amount numeric DEFAULT 0,
  sale_date timestamp with time zone DEFAULT now(),
  notes text,
  executed_by text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.project_ownership ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ownership" ON public.project_ownership
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "CEO can manage ownership" ON public.project_ownership
  FOR ALL USING (public.has_role(auth.uid(), 'ceo'))
  WITH CHECK (public.has_role(auth.uid(), 'ceo'));

-- Add ownership_percentage column to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ownership_percentage numeric NOT NULL DEFAULT 100;