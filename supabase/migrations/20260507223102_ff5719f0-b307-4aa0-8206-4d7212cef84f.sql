DROP POLICY IF EXISTS "guests can create platforms" ON public.generated_platforms;
DROP POLICY IF EXISTS "guest can insert campaigns" ON public.ad_campaigns;

CREATE POLICY "guests can create valid platforms"
ON public.generated_platforms
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND status = 'live'
  AND length(trim(name)) BETWEEN 2 AND 120
  AND length(trim(slug)) BETWEEN 3 AND 80
  AND jsonb_array_length(pages) BETWEEN 1 AND 12
);

CREATE POLICY "guests can create valid campaigns"
ON public.ad_campaigns
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND length(trim(name)) BETWEEN 2 AND 140
  AND length(trim(coalesce(business_type, ''))) BETWEEN 2 AND 140
  AND budget >= 0
  AND status IN ('draft', 'ready', 'active')
);