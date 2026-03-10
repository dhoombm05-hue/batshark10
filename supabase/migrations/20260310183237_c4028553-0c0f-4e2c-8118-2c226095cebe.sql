
CREATE TABLE public.learning_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'عام',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view learning materials"
  ON public.learning_materials FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "CEO can insert learning materials"
  ON public.learning_materials FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can update learning materials"
  ON public.learning_materials FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CEO can delete learning materials"
  ON public.learning_materials FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'ceo'::app_role));
