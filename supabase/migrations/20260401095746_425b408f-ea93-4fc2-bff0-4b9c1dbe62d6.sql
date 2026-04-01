
CREATE TABLE public.report_email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  weekdays int[] NOT NULL DEFAULT '{0,3}',
  sends_per_week int NOT NULL DEFAULT 2,
  recipient_emails text[] NOT NULL DEFAULT '{}',
  report_types text[] NOT NULL DEFAULT '{"executive-summary"}',
  send_hour int NOT NULL DEFAULT 9,
  timezone text NOT NULL DEFAULT 'Asia/Riyadh',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.report_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view settings"
  ON public.report_email_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "CEO can manage settings"
  ON public.report_email_settings FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'ceo'))
  WITH CHECK (public.has_role(auth.uid(), 'ceo'));
