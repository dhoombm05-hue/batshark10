
-- Task Distribution System tables
CREATE TABLE public.task_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual', -- 'file', 'manual', 'project'
  source_file_url TEXT,
  source_file_name TEXT,
  project_id UUID REFERENCES public.projects(id),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'analyzing', 'reviewed', 'distributed', 'completed'
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  employee_insights JSONB DEFAULT '{}'::jsonb,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  assigned_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.task_distribution_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  distribution_id UUID NOT NULL REFERENCES public.task_distributions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  category TEXT DEFAULT 'general',
  required_skills TEXT[] DEFAULT '{}',
  estimated_hours NUMERIC DEFAULT 0,
  assigned_to UUID,
  assigned_to_name TEXT,
  assignment_reason TEXT, -- AI explanation for why this employee was chosen
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'assigned', 'in_progress', 'completed', 'rejected'
  employee_development_notes TEXT, -- AI notes on how this task helps employee grow
  completion_score INTEGER, -- 0-100 after completion
  feedback TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.task_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_distribution_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view distributions" ON public.task_distributions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can create distributions" ON public.task_distributions FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator or CEO can update distributions" ON public.task_distributions FOR UPDATE USING (auth.uid() = created_by OR has_role(auth.uid(), 'ceo'::app_role));
CREATE POLICY "Creator or CEO can delete distributions" ON public.task_distributions FOR DELETE USING (auth.uid() = created_by OR has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "Authenticated can view distribution items" ON public.task_distribution_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can create distribution items" ON public.task_distribution_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update distribution items" ON public.task_distribution_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Creator or CEO can delete distribution items" ON public.task_distribution_items FOR DELETE USING (has_role(auth.uid(), 'ceo'::app_role));
