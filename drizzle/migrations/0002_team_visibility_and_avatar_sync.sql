UPDATE public.profiles p SET avatar_url = e.avatar_url
FROM public.employees e WHERE e.id::text = p.employee_id::text AND e.avatar_url IS NOT NULL AND (p.avatar_url IS NULL OR p.avatar_url = '');

CREATE OR REPLACE FUNCTION public.sync_employee_avatar_to_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.avatar_url IS DISTINCT FROM OLD.avatar_url AND NEW.avatar_url IS NOT NULL THEN
    UPDATE public.profiles SET avatar_url = NEW.avatar_url WHERE employee_id::text = NEW.id::text;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_sync_employee_avatar ON public.employees;
CREATE TRIGGER trg_sync_employee_avatar AFTER UPDATE OF avatar_url ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.sync_employee_avatar_to_profile();

CREATE OR REPLACE VIEW public.employees_public AS
  SELECT id, slug, name, position, department, age, experience, avatar_url, video_url,
         performance, kpi_achievement, profit_contribution, monthly_rating,
         achievements, improvements, projects, feedback, created_at, updated_at
  FROM public.employees;
REVOKE ALL ON public.employees_public FROM anon;
GRANT SELECT ON public.employees_public TO authenticated, service_role;

CREATE POLICY "team view evaluations" ON public.employee_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "team view monthly perf" ON public.employee_monthly_performance FOR SELECT TO authenticated USING (true);