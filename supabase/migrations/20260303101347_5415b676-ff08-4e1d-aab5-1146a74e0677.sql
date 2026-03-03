
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage articles" ON public.blog_articles;
DROP POLICY IF EXISTS "Anyone can read published articles" ON public.blog_articles;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can manage articles"
ON public.blog_articles
FOR ALL
TO authenticated
USING (is_admin_or_editor(auth.uid()))
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Anyone can read published articles"
ON public.blog_articles
FOR SELECT
TO anon, authenticated
USING (status = 'published');
