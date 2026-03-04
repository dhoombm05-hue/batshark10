
-- Drop the overly permissive "Allow all" policy on employees
DROP POLICY IF EXISTS "Allow all on employees" ON public.employees;

-- Everyone authenticated can SELECT
CREATE POLICY "Authenticated can view employees"
ON public.employees FOR SELECT
TO authenticated
USING (true);

-- Only CEO can INSERT
CREATE POLICY "CEO can insert employees"
ON public.employees FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ceo'));

-- Only CEO can UPDATE
CREATE POLICY "CEO can update employees"
ON public.employees FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'ceo'));

-- Only CEO can DELETE
CREATE POLICY "CEO can delete employees"
ON public.employees FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'ceo'));

-- Same for employee_monthly_performance
DROP POLICY IF EXISTS "Allow all on employee_monthly_performance" ON public.employee_monthly_performance;

CREATE POLICY "Authenticated can view performance"
ON public.employee_monthly_performance FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "CEO can insert performance"
ON public.employee_monthly_performance FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "CEO can update performance"
ON public.employee_monthly_performance FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "CEO can delete performance"
ON public.employee_monthly_performance FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'ceo'));

-- Same for employee_evaluations
DROP POLICY IF EXISTS "Allow all operations on evaluations" ON public.employee_evaluations;

CREATE POLICY "Authenticated can view evaluations"
ON public.employee_evaluations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "CEO can insert evaluations"
ON public.employee_evaluations FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "CEO can update evaluations"
ON public.employee_evaluations FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "CEO can delete evaluations"
ON public.employee_evaluations FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'ceo'));
