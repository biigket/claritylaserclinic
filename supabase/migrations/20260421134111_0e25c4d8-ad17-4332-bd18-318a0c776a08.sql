-- 1. Add SEO Agent / workflow fields to blog_articles
ALTER TABLE public.blog_articles
  ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS source_system text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS seo_score integer,
  ADD COLUMN IF NOT EXISTS aeo_score integer,
  ADD COLUMN IF NOT EXISTS geo_score integer,
  ADD COLUMN IF NOT EXISTS safety_score integer,
  ADD COLUMN IF NOT EXISTS target_keyword text,
  ADD COLUMN IF NOT EXISTS target_intent text,
  ADD COLUMN IF NOT EXISTS answer_summary text,
  ADD COLUMN IF NOT EXISTS citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS schema_jsonld jsonb,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes text;

-- Validation trigger for score ranges (avoid CHECK constraints per guidelines)
CREATE OR REPLACE FUNCTION public.validate_blog_article_scores()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.seo_score IS NOT NULL AND (NEW.seo_score < 0 OR NEW.seo_score > 100) THEN
    RAISE EXCEPTION 'seo_score must be between 0 and 100';
  END IF;
  IF NEW.aeo_score IS NOT NULL AND (NEW.aeo_score < 0 OR NEW.aeo_score > 100) THEN
    RAISE EXCEPTION 'aeo_score must be between 0 and 100';
  END IF;
  IF NEW.geo_score IS NOT NULL AND (NEW.geo_score < 0 OR NEW.geo_score > 100) THEN
    RAISE EXCEPTION 'geo_score must be between 0 and 100';
  END IF;
  IF NEW.safety_score IS NOT NULL AND (NEW.safety_score < 0 OR NEW.safety_score > 100) THEN
    RAISE EXCEPTION 'safety_score must be between 0 and 100';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_blog_article_scores_trigger ON public.blog_articles;
CREATE TRIGGER validate_blog_article_scores_trigger
BEFORE INSERT OR UPDATE ON public.blog_articles
FOR EACH ROW EXECUTE FUNCTION public.validate_blog_article_scores();

CREATE INDEX IF NOT EXISTS idx_blog_articles_workflow_status ON public.blog_articles(workflow_status);
CREATE INDEX IF NOT EXISTS idx_blog_articles_source_system ON public.blog_articles(source_system);

-- 2. article_visual_assets
CREATE TABLE IF NOT EXISTS public.article_visual_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  asset_url text NOT NULL,
  alt_text text,
  caption text,
  role text NOT NULL DEFAULT 'inline',
  position integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_visual_assets_article ON public.article_visual_assets(article_id);

ALTER TABLE public.article_visual_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage article visual assets"
  ON public.article_visual_assets
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- 3. content_approval_events
CREATE TABLE IF NOT EXISTS public.content_approval_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid,
  actor_label text,
  notes text,
  snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_approval_events_article ON public.content_approval_events(article_id);

ALTER TABLE public.content_approval_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view approval events"
  ON public.content_approval_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Staff can insert approval events"
  ON public.content_approval_events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor(auth.uid()));