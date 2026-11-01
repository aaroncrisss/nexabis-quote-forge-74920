-- =============================================================================
-- 20261029_06_clean_tasks_and_daily_whatsapp_cron.sql
-- 1. Limpia todas las tareas de prueba/existentes para que el usuario comience de cero
-- 2. Configura el teléfono +56986343217 en el perfil principal
-- 3. Programa el resumen diario automático de WhatsApp a las 08:30 AM Chile (11:30 UTC)
-- =============================================================================

-- 1. Eliminar todas las tareas y registros asociados actuales
DELETE FROM public.task_comments;
DELETE FROM public.task_history;
DELETE FROM public.notification_reads;
DELETE FROM public.notifications;
DELETE FROM public.tasks;

-- 2. Asegurar teléfono +56986343217 en el miembro principal
UPDATE public.team_members
SET phone = '56986343217'
WHERE id = 'cristobal_abarca';

-- 3. Habilitar pg_net y pg_cron para el envío diario automático por WhatsApp
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nexabis-daily-whatsapp-summary') THEN
    PERFORM cron.unschedule('nexabis-daily-whatsapp-summary');
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'nexabis-daily-whatsapp-summary',
  '30 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://htwuamsbzaznmwuypflt.supabase.co/functions/v1/whatsapp-assistant',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"action": "daily_summary", "phone": "56986343217"}'::jsonb
  );
  $$
);
