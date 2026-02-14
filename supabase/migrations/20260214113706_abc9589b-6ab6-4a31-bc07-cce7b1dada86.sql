
-- Employee evaluations table (no auth required - internal system)
CREATE TABLE public.employee_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  evaluation_month TEXT NOT NULL,
  evaluation_year INTEGER NOT NULL,
  
  -- Evaluation criteria (1-10 scale)
  budget_compliance INTEGER NOT NULL CHECK (budget_compliance BETWEEN 1 AND 10),
  goal_achievement INTEGER NOT NULL CHECK (goal_achievement BETWEEN 1 AND 10),
  projects_completed INTEGER NOT NULL DEFAULT 0,
  expense_exceeded BOOLEAN NOT NULL DEFAULT false,
  teamwork INTEGER NOT NULL CHECK (teamwork BETWEEN 1 AND 10),
  initiative INTEGER NOT NULL CHECK (initiative BETWEEN 1 AND 10),
  communication INTEGER NOT NULL CHECK (communication BETWEEN 1 AND 10),
  
  -- Overall
  overall_score NUMERIC(4,1) NOT NULL,
  admin_rating INTEGER NOT NULL CHECK (admin_rating BETWEEN 1 AND 10),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate evaluations per employee per month
  UNIQUE (employee_id, evaluation_month, evaluation_year)
);

-- Enable RLS but allow public access (internal company tool, no auth)
ALTER TABLE public.employee_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on evaluations"
ON public.employee_evaluations
FOR ALL
USING (true)
WITH CHECK (true);
