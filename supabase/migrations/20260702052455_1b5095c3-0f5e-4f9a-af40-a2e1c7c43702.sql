
DROP POLICY IF EXISTS "contracts_bucket_read" ON storage.objects;
DROP POLICY IF EXISTS "contracts_bucket_write_auth" ON storage.objects;
DROP POLICY IF EXISTS "contracts_bucket_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "contracts_bucket_delete_auth" ON storage.objects;

CREATE POLICY "contracts_bucket_read_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'contracts');
CREATE POLICY "contracts_bucket_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contracts');
CREATE POLICY "contracts_bucket_update_auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'contracts');
CREATE POLICY "contracts_bucket_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'contracts');
