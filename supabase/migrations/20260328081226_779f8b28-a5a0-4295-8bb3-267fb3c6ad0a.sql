
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a settings table to store auto-publish configuration
CREATE TABLE public.auto_publish_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled BOOLEAN NOT NULL DEFAULT false,
  cron_expression TEXT NOT NULL DEFAULT '0 */6 * * *',
  batch_size INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_publish_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage auto-publish settings"
  ON public.auto_publish_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Insert default settings
INSERT INTO public.auto_publish_settings (id, enabled, cron_expression, batch_size)
VALUES ('default', false, '0 */6 * * *', 3);
