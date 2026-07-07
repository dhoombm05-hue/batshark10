
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcomed_at timestamptz;

UPDATE public.employees e
SET login_email = u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE p.employee_id = e.id AND (e.login_email IS NULL OR e.login_email = '');

CREATE OR REPLACE FUNCTION public.resolve_login_email(_password text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT e.login_email
       FROM public.employees e
       WHERE e.login_password = _password
         AND e.login_email IS NOT NULL
       LIMIT 1),
    (SELECT u.email
       FROM public.employees e
       JOIN public.profiles p ON p.employee_id = e.id
       JOIN auth.users u ON u.id = p.user_id
       WHERE e.login_password = _password
       LIMIT 1)
  );
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_email(text) TO anon, authenticated;
