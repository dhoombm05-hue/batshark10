
-- Create employees table to replace hardcoded mock data
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  position text NOT NULL,
  age integer DEFAULT 30,
  department text DEFAULT 'الإدارة العامة',
  experience text DEFAULT '1 سنة',
  salary numeric DEFAULT 0,
  bonus numeric DEFAULT 0,
  performance integer DEFAULT 50,
  kpi_achievement integer DEFAULT 50,
  profit_contribution integer DEFAULT 0,
  monthly_rating numeric DEFAULT 5,
  achievements text[] DEFAULT '{}',
  improvements text[] DEFAULT '{}',
  feedback text,
  projects text[] DEFAULT '{}',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (matching other tables)
CREATE POLICY "Allow all on employees"
  ON public.employees FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Employee monthly performance table
CREATE TABLE public.employee_monthly_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  month text NOT NULL,
  month_order integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 50,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_monthly_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on employee_monthly_performance"
  ON public.employee_monthly_performance FOR ALL
  USING (true)
  WITH CHECK (true);
