
-- Add employee assignment to quizzes
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS employee_name TEXT DEFAULT '';
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS week_number INTEGER DEFAULT 0;
