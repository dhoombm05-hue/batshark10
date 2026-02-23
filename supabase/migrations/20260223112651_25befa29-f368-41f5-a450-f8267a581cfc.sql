
-- Add override columns to projects table
-- When a field has an override, recalculation will NOT overwrite it
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS override_total_revenue numeric DEFAULT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS override_total_expenses numeric DEFAULT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS override_net_profit numeric DEFAULT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS override_growth_rate numeric DEFAULT NULL;

-- Enhanced activity log table with deep impact tracking
CREATE TABLE IF NOT EXISTS public.activity_impact_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT 'مجهول',
  action_type text NOT NULL, -- update, create, delete, override, journal_entry, file_upload
  entity_type text NOT NULL, -- projects, project_expenses, employees, documents, journal_entries
  entity_id text,
  entity_name text, -- e.g. "بادل", "أومبركس"
  section text, -- بادل / أومبركس / الشاشات / لوحة التحكم
  field_name text,
  old_value text,
  new_value text,
  numeric_difference numeric DEFAULT 0,
  is_manual_override boolean DEFAULT false,
  change_reason text,
  -- Impact metrics at time of change
  impact_on_net_profit numeric DEFAULT 0,
  impact_on_liquidity numeric DEFAULT 0,
  impact_on_growth numeric DEFAULT 0,
  risk_level text DEFAULT 'low', -- low, medium, high, critical
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_impact_log ENABLE ROW LEVEL SECURITY;

-- CEO can see all, users can see own
CREATE POLICY "CEO can view all activity impact"
ON public.activity_impact_log FOR SELECT
USING (has_role(auth.uid(), 'ceo'::app_role) OR auth.uid() = user_id);

CREATE POLICY "Authenticated can insert activity impact"
ON public.activity_impact_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_activity_impact_user ON public.activity_impact_log(user_id);
CREATE INDEX idx_activity_impact_entity ON public.activity_impact_log(entity_type, entity_id);
CREATE INDEX idx_activity_impact_section ON public.activity_impact_log(section);
CREATE INDEX idx_activity_impact_created ON public.activity_impact_log(created_at DESC);
