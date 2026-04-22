-- Create the article-visuals public bucket for SEO Agent uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-visuals', 'article-visuals', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Public read policy
DROP POLICY IF EXISTS "Public read access for article-visuals" ON storage.objects;
CREATE POLICY "Public read access for article-visuals"
ON storage.objects
FOR SELECT
USING (bucket_id = 'article-visuals');