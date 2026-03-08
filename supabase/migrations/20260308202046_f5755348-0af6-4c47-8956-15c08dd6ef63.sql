
-- Tasks system
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_name text,
  created_by uuid NOT NULL,
  created_by_name text NOT NULL DEFAULT '',
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  due_date date,
  category text DEFAULT 'general',
  source_type text,
  source_id text,
  source_label text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view tasks" ON public.tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can create tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Assignee or creator or CEO can update" ON public.tasks FOR UPDATE USING (
  auth.uid() = created_by OR auth.uid() = assigned_to OR has_role(auth.uid(), 'ceo'::app_role)
);
CREATE POLICY "Creator or CEO can delete" ON public.tasks FOR DELETE USING (
  auth.uid() = created_by OR has_role(auth.uid(), 'ceo'::app_role)
);

-- Data imports tracking
CREATE TABLE public.data_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_type text NOT NULL DEFAULT 'csv',
  file_url text,
  row_count integer DEFAULT 0,
  column_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  target_table text,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  import_config jsonb DEFAULT '{}',
  error_log jsonb DEFAULT '[]',
  cleaning_report jsonb DEFAULT '{}',
  imported_by uuid NOT NULL,
  imported_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.data_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view imports" ON public.data_imports FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can create imports" ON public.data_imports FOR INSERT WITH CHECK (auth.uid() = imported_by);
CREATE POLICY "Creator or CEO can update" ON public.data_imports FOR UPDATE USING (
  auth.uid() = imported_by OR has_role(auth.uid(), 'ceo'::app_role)
);
CREATE POLICY "Creator or CEO can delete" ON public.data_imports FOR DELETE USING (
  auth.uid() = imported_by OR has_role(auth.uid(), 'ceo'::app_role)
);
