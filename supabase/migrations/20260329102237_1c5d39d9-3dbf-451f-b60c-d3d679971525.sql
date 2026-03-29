
CREATE OR REPLACE FUNCTION public.update_auto_publish_cron(
  _cron_expression text,
  _supabase_url text,
  _anon_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove existing job
  PERFORM cron.unschedule('auto-publish-articles');
  
  -- Create new job with updated schedule
  PERFORM cron.schedule(
    'auto-publish-articles',
    _cron_expression,
    format(
      'SELECT net.http_post(url := %L, headers := %L::jsonb, body := ''{"scheduled": true}''::jsonb) AS request_id;',
      _supabase_url || '/functions/v1/auto-publish-articles',
      json_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || _anon_key)::text
    )
  );
END;
$$;
