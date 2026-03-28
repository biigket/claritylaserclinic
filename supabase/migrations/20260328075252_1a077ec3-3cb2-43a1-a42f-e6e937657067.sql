
CREATE TABLE public.content_topic_backlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_th TEXT NOT NULL,
  title_en TEXT,
  description_th TEXT,
  description_en TEXT,
  suggested_slug TEXT,
  source_article_id UUID,
  source_article_title TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_topic_backlog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and editors can manage topic backlog"
  ON public.content_topic_backlog
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));
