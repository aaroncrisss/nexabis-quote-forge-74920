DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nexabis-ig-poll-comments') THEN
    PERFORM cron.unschedule('nexabis-ig-poll-comments');
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'nexabis-ig-poll-comments',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://htwuamsbzaznmwuypflt.supabase.co/functions/v1/instagram-webhook',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"action": "poll_comments"}'::jsonb
  );
  $$
);
