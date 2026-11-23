-- Aviso de Supabase (2026-11-23): el proyecto agota su presupuesto de Disk IO.
-- La base pesa 26 MB y casi todo se lee desde caché, así que el desgaste viene de lo que corre sin parar:
-- el polling de Instagram cada 2 min (720 ejecuciones al día: pg_net + cron.job_run_details + Edge Function
-- con ~110 s de trabajo) y Realtime decodificando el WAL que generan esas escrituras.
-- Los webhooks de Meta ya llegan en tiempo real (verificado el 2026-11-17), así que el polling queda solo
-- como respaldo: cada 5 min baja el trabajo un 60 %. Un post programado sale con hasta 5 min de atraso.
-- Se usa alter_job para mantener el comando (y la clave desde Vault) tal como está.
do $$
declare j bigint;
begin
  select jobid into j from cron.job where jobname = 'nexabis-ig-poll-comments';
  if j is not null then
    perform cron.alter_job(job_id := j, schedule := '*/5 * * * *');
  end if;

  -- Historial de cron: 1 día alcanza para depurar (antes 3).
  select jobid into j from cron.job where jobname = 'nexabis-cron-cleanup';
  if j is not null then
    perform cron.alter_job(job_id := j, command := $c$delete from cron.job_run_details where end_time < now() - interval '1 day'$c$);
  end if;
end $$;
