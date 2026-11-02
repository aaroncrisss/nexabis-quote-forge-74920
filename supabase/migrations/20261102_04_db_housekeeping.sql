-- =============================================================================
-- 20261102_04_db_housekeeping.sql
-- Mantención liviana para cuidar el presupuesto de Disk IO de Supabase:
--   * pg_cron guarda una fila por cada corrida (cada 2 min = ~720/día) y nunca la borra.
--     Se limpia a diario dejando 3 días de historial.
--   * task_history no tiene suscriptores Realtime: se saca de la publicación para que
--     Realtime no tenga que procesar sus cambios.
-- Idempotente: se puede correr más de una vez.
-- =============================================================================

-- Limpieza diaria del historial de pg_cron (04:15 UTC = madrugada en Chile)
select cron.unschedule(jobid) from cron.job where jobname = 'nexabis-cron-cleanup';
select cron.schedule(
  'nexabis-cron-cleanup',
  '15 4 * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '3 days'$$
);

-- Primera limpieza ahora
delete from cron.job_run_details where end_time < now() - interval '3 days';

-- task_history: nadie la escucha por Realtime
do $$
begin
  if exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'task_history'
  ) then
    alter publication supabase_realtime drop table public.task_history;
  end if;
end $$;
