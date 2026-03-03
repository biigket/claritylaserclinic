
-- Drop ALL existing policies on blog_articles (including ones with trailing spaces)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'blog_articles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.blog_articles', pol.policyname);
    END LOOP;
END $$;

-- Create PERMISSIVE policies
CREATE POLICY "blog_admin_all"
ON public.blog_articles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (is_admin_or_editor(auth.uid()))
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "blog_public_read"
ON public.blog_articles
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (status = 'published');
