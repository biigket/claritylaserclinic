-- Create public bucket for SEO Agent visual assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-visuals', 'article-visuals', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access (bucket is public)
CREATE POLICY "Public can read article-visuals"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-visuals');

-- Only service role writes (handled by edge function); no public insert/update/delete policy.
