
-- Custom tables system for CRUD data management
CREATE TABLE public.custom_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  table_type TEXT NOT NULL DEFAULT 'general',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.custom_table_rows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.custom_tables(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.custom_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_table_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage custom_tables" ON public.custom_tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can manage custom_table_rows" ON public.custom_table_rows FOR ALL USING (true) WITH CHECK (true);

-- Triggers
CREATE TRIGGER update_custom_tables_updated_at BEFORE UPDATE ON public.custom_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_table_rows_updated_at BEFORE UPDATE ON public.custom_table_rows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
