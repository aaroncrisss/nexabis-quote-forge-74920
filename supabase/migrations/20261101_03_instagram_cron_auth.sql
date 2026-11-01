-- =============================================================================
-- 20261101_03_instagram_cron_auth.sql
-- Crons de Instagram autenticados con x-ig-admin-key leída desde Supabase Vault.
--
-- APLICAR SOLO DESPUÉS de crear el secreto en Vault (mismo valor que IG_ADMIN_KEY):
--   select vault.create_secret('<IG_ADMIN_KEY>', 'ig_admin_key');
-- y de desplegar la edge function con IG_POLL_REQUIRE_KEY=true.
-- =============================================================================

-- 8. Crons autenticados (la clave vive en Vault, no en el repo)
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from cron.job where jobname = 'nexabis-ig-poll-comments') then
    perform cron.unschedule('nexabis-ig-poll-comments');
  end if;
  if exists (select 1 from cron.job where jobname = 'nexabis-ig-refresh-token') then
    perform cron.unschedule('nexabis-ig-refresh-token');
  end if;
exception when others then
  null;
end $$;

select cron.schedule(
  'nexabis-ig-poll-comments',
  '*/2 * * * *',
  $$
  select net.http_post(
    url := 'https://htwuamsbzaznmwuypflt.supabase.co/functions/v1/instagram-webhook',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-ig-admin-key', (select decrypted_secret from vault.decrypted_secrets where name = 'ig_admin_key')
    ),
    body := '{"action": "poll_comments"}'::jsonb,
    timeout_milliseconds := 150000
  );
  $$
);

select cron.schedule(
  'nexabis-ig-refresh-token',
  '0 9 * * 1',
  $$
  select net.http_post(
    url := 'https://htwuamsbzaznmwuypflt.supabase.co/functions/v1/instagram-webhook',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-ig-admin-key', (select decrypted_secret from vault.decrypted_secrets where name = 'ig_admin_key')
    ),
    body := '{"action": "refresh_token", "force": true}'::jsonb
  );
  $$
);
