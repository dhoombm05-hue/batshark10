
-- Create news-media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('news-media', 'news-media', true);

-- Allow authenticated users to upload to news-media
CREATE POLICY "Authenticated can upload news media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'news-media');

-- Allow public read access
CREATE POLICY "Public can read news media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'news-media');

-- Allow owner or CEO to delete news media
CREATE POLICY "Owner or CEO can delete news media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'news-media');
