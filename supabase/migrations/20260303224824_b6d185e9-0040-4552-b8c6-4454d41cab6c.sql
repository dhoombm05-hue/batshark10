
-- Create table versions for version history
CREATE TABLE public.custom_table_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL REFERENCES public.custom_tables(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  data_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  saved_by uuid NOT NULL,
  saved_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE public.custom_table_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage versions"
ON public.custom_table_versions
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Index for fast lookups
CREATE INDEX idx_custom_table_versions_table_id ON public.custom_table_versions(table_id, version_number DESC);
