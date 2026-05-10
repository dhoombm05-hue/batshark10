
-- 1. PROJECTS
DROP POLICY IF EXISTS "Allow all on projects" ON public.projects;
CREATE POLICY "auth read projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "ceo write projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "ceo update projects" ON public.projects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'ceo')) WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "ceo delete projects" ON public.projects FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'ceo'));

-- 2. AUDIT LOGS
DROP POLICY IF EXISTS "Allow all on audit_logs" ON public.audit_logs;
CREATE POLICY "ceo read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "auth insert audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 3. JOURNAL
DROP POLICY IF EXISTS "Allow all on journal_entries" ON public.journal_entries;
CREATE POLICY "auth read je" ON public.journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert je" ON public.journal_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ceo update je" ON public.journal_entries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'ceo')) WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "ceo delete je" ON public.journal_entries FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'ceo'));

DROP POLICY IF EXISTS "Allow all on journal_lines" ON public.journal_lines;
CREATE POLICY "auth read jl" ON public.journal_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert jl" ON public.journal_lines FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ceo update jl" ON public.journal_lines FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'ceo')) WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "ceo delete jl" ON public.journal_lines FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'ceo'));

-- 4. PROJECT FINANCIALS
DROP POLICY IF EXISTS "Allow all on revenues" ON public.project_revenues;
CREATE POLICY "auth read rev" ON public.project_revenues FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert rev" ON public.project_revenues FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ceo modify rev" ON public.project_revenues FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'ceo')) WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "ceo delete rev" ON public.project_revenues FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'ceo'));

DROP POLICY IF EXISTS "Allow all on expenses" ON public.project_expenses;
CREATE POLICY "auth read exp" ON public.project_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert exp" ON public.project_expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ceo modify exp" ON public.project_expenses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'ceo')) WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "ceo delete exp" ON public.project_expenses FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'ceo'));

DROP POLICY IF EXISTS "Allow all on monthly_data" ON public.project_monthly_data;
CREATE POLICY "auth read pmd" ON public.project_monthly_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert pmd" ON public.project_monthly_data FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ceo modify pmd" ON public.project_monthly_data FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'ceo')) WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "ceo delete pmd" ON public.project_monthly_data FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'ceo'));

DROP POLICY IF EXISTS "Allow all on analysis" ON public.project_analysis;
CREATE POLICY "auth read pa" ON public.project_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert pa" ON public.project_analysis FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ceo modify pa" ON public.project_analysis FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'ceo')) WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "ceo delete pa" ON public.project_analysis FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'ceo'));

DROP POLICY IF EXISTS "Allow all on chart_of_accounts" ON public.chart_of_accounts;
CREATE POLICY "auth read coa" ON public.chart_of_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "ceo write coa" ON public.chart_of_accounts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "ceo update coa" ON public.chart_of_accounts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'ceo')) WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "ceo delete coa" ON public.chart_of_accounts FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'ceo'));

-- 5. CUSTOM TABLES
DROP POLICY IF EXISTS "Authenticated can manage custom_tables" ON public.custom_tables;
CREATE POLICY "auth manage custom_tables" ON public.custom_tables FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated can manage custom_table_rows" ON public.custom_table_rows;
CREATE POLICY "auth manage ct_rows" ON public.custom_table_rows FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated can manage custom_table_columns" ON public.custom_table_columns;
CREATE POLICY "auth manage ct_cols" ON public.custom_table_columns FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated can manage custom_table_cells" ON public.custom_table_cells;
CREATE POLICY "auth manage ct_cells" ON public.custom_table_cells FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated can manage versions" ON public.custom_table_versions;
CREATE POLICY "auth manage ct_ver" ON public.custom_table_versions FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 6. INVOICES
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
CREATE POLICY "ceo or creator view invoices" ON public.invoices FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'ceo') OR auth.uid() = created_by);

-- 7. EMPLOYEES
DROP POLICY IF EXISTS "Authenticated can view employees" ON public.employees;
CREATE POLICY "ceo view employees" ON public.employees FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'ceo'));
DROP POLICY IF EXISTS "Authenticated can view evaluations" ON public.employee_evaluations;
CREATE POLICY "ceo view evaluations" ON public.employee_evaluations FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'ceo'));
DROP POLICY IF EXISTS "Authenticated can view performance" ON public.employee_monthly_performance;
CREATE POLICY "ceo view perf" ON public.employee_monthly_performance FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'ceo'));

-- 8. REPORT EMAIL SETTINGS
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.report_email_settings;
CREATE POLICY "ceo view email settings" ON public.report_email_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'ceo'));

-- 9. STRATEGIC
DROP POLICY IF EXISTS "Authenticated can view feasibility" ON public.business_feasibility;
CREATE POLICY "ceo or creator view feasibility" ON public.business_feasibility FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'ceo') OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated can view proposals" ON public.business_proposals;
DROP POLICY IF EXISTS "Service role can insert proposals" ON public.business_proposals;
DROP POLICY IF EXISTS "Service role can update proposals" ON public.business_proposals;
CREATE POLICY "ceo view proposals" ON public.business_proposals FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'ceo'));

DROP POLICY IF EXISTS "Authenticated can view ownership" ON public.project_ownership;
CREATE POLICY "ceo view ownership" ON public.project_ownership FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'ceo'));

-- 10. PERFORMANCE CYCLES
DROP POLICY IF EXISTS "Authenticated can view cycles" ON public.performance_cycles;
CREATE POLICY "ceo or self view cycles" ON public.performance_cycles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'ceo') OR auth.uid() = user_id);

-- 11. NOTIFICATIONS
DROP POLICY IF EXISTS "Authenticated can create notifications" ON public.notifications;
CREATE POLICY "self create notification" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = sender_id);

-- 12. B99 INTEGRATIONS
DROP POLICY IF EXISTS "anyone can create integration" ON public.b99_integrations;
CREATE POLICY "auth create integration" ON public.b99_integrations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND length(trim(client_api_key)) > 10);

-- 13. DOCUMENTS
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;
CREATE POLICY "auth view documents" ON public.documents FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ceo update documents" ON public.documents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'ceo')) WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "ceo delete documents" ON public.documents FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'ceo'));

-- 14. LEARNING / QUIZ
DROP POLICY IF EXISTS "Authenticated can view learning materials" ON public.learning_materials;
CREATE POLICY "auth view learning" ON public.learning_materials FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated can view quizzes" ON public.quizzes;
CREATE POLICY "auth view quizzes" ON public.quizzes FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated can view questions" ON public.quiz_questions;
CREATE POLICY "auth view quiz questions" ON public.quiz_questions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- 16. PROFILES & ROLES
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "auth view profiles" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated can view roles" ON public.user_roles;
CREATE POLICY "auth view roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- 17. FUNCTIONS
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- 18. STORAGE
DROP POLICY IF EXISTS "auth list documents bucket" ON storage.objects;
CREATE POLICY "auth list documents bucket" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
DROP POLICY IF EXISTS "auth upload buckets" ON storage.objects;
CREATE POLICY "auth upload buckets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('news-media','avatars','documents'));
DROP POLICY IF EXISTS "ceo delete storage" ON storage.objects;
CREATE POLICY "ceo delete storage" ON storage.objects FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'ceo'));
