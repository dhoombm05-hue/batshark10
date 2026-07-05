ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS login_email TEXT,
  ADD COLUMN IF NOT EXISTS login_password TEXT;