-- Normalize custom tables persistence to DB-first column/row/cell model

-- 1) Columns table (stable IDs and metadata)
CREATE TABLE IF NOT EXISTS public.custom_table_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL REFERENCES public.custom_tables(id) ON DELETE CASCADE,
  column_key text NOT NULL,
  column_name text NOT NULL DEFAULT '',
  column_type text NOT NULL DEFAULT 'text',
  width integer,
  position integer NOT NULL DEFAULT 0,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(table_id, column_key)
);

-- 2) Cells table (one record per row/column)
CREATE TABLE IF NOT EXISTS public.custom_table_cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL REFERENCES public.custom_tables(id) ON DELETE CASCADE,
  row_id uuid NOT NULL REFERENCES public.custom_table_rows(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES public.custom_table_columns(id) ON DELETE CASCADE,
  cell_value jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(row_id, column_id)
);

-- 3) Extend rows table with explicit row identity metadata
ALTER TABLE public.custom_table_rows
  ADD COLUMN IF NOT EXISTS row_name text,
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

UPDATE public.custom_table_rows
SET row_name = COALESCE(NULLIF(data->>'_row_name', ''), row_name, '');

-- 4) Backfill columns from legacy custom_tables.columns JSON array
INSERT INTO public.custom_table_columns (table_id, column_key, column_name, column_type, width, position)
SELECT
  t.id AS table_id,
  COALESCE(NULLIF(c.elem->>'id', ''), 'col_' || c.ordinality::text) AS column_key,
  COALESCE(c.elem->>'label', '') AS column_name,
  COALESCE(c.elem->>'type', 'text') AS column_type,
  NULLIF(c.elem->>'width', '')::integer AS width,
  c.ordinality - 1 AS position
FROM public.custom_tables t
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(t.columns, '[]'::jsonb)) WITH ORDINALITY AS c(elem, ordinality)
ON CONFLICT (table_id, column_key) DO NOTHING;

-- 5) Backfill cells from legacy custom_table_rows.data JSON payload
INSERT INTO public.custom_table_cells (table_id, row_id, column_id, cell_value)
SELECT
  r.table_id,
  r.id AS row_id,
  c.id AS column_id,
  r.data -> c.column_key AS cell_value
FROM public.custom_table_rows r
JOIN public.custom_table_columns c ON c.table_id = r.table_id
WHERE r.data ? c.column_key
ON CONFLICT (row_id, column_id) DO NOTHING;

-- 6) Keep updated_at fresh
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_custom_table_columns_updated_at'
  ) THEN
    CREATE TRIGGER trg_custom_table_columns_updated_at
    BEFORE UPDATE ON public.custom_table_columns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_custom_table_cells_updated_at'
  ) THEN
    CREATE TRIGGER trg_custom_table_cells_updated_at
    BEFORE UPDATE ON public.custom_table_cells
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_custom_table_rows_updated_at'
  ) THEN
    CREATE TRIGGER trg_custom_table_rows_updated_at
    BEFORE UPDATE ON public.custom_table_rows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- 7) RLS for new tables
ALTER TABLE public.custom_table_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_table_cells ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'custom_table_columns' AND policyname = 'Authenticated can manage custom_table_columns'
  ) THEN
    CREATE POLICY "Authenticated can manage custom_table_columns"
    ON public.custom_table_columns
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'custom_table_cells' AND policyname = 'Authenticated can manage custom_table_cells'
  ) THEN
    CREATE POLICY "Authenticated can manage custom_table_cells"
    ON public.custom_table_cells
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END
$$;