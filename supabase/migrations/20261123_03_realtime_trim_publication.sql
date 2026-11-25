-- =============================================================================
-- 20261123_03_realtime_trim_publication.sql
-- Reduce la publicación `supabase_realtime` de 21 a 8 tablas (62 % menos),
-- sacando tablas estáticas, de configuración/catálogo o que ya no tienen
-- suscriptores Realtime en el frontend.
--
-- Objetivo: disminuir el trabajo de decodificación WAL y evaluaciones RLS de
-- `realtime.list_changes` (que acumuló ~79.851 llamadas y 200 M buffer hits).
--
-- Tablas que PERMANECEN en supabase_realtime (8):
--   * Roadmap/Tareas (3): tasks, task_comments, notifications
--   * Feedback (3):       fb_sesiones, fb_compromisos, fb_seguimientos
--   * CRM (2):            crm_mailings, crm_comentarios_semana
--     (Nota: en el frontend actual CrmView no está montada en ninguna ruta; si
--      tampoco la usa ninguna otra app externa, también se pueden sacar estas 2
--      tablas descomentando el bloque opcional al final.)
--
-- Idempotente: verifica pg_publication_tables antes de quitar cada tabla.
-- =============================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    -- Roadmap: catálogos/lecturas propias (estado local optimista)
    'team_members',
    'notification_reads',
    -- Programación CRM: catálogos, reglas y configuración de baja frecuencia
    'crm_catalogo',
    'crm_responsables',
    'crm_feriados',
    'crm_reglas_oportunidad',
    'crm_oportunidad_manual',
    'crm_config',
    -- Feedback & Desarrollo: maestro HR/roles/objetivos y revisiones (refresco dirigido)
    'fb_personas',
    'fb_roles',
    'fb_persona_roles',
    'fb_objetivos',
    'fb_compromiso_revisiones'
  ] loop
    if exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;
end $$;

-- Opcional (solo si se confirma que ninguna app externa monta CrmView):
-- do $$
-- declare t text;
-- begin
--   foreach t in array array['crm_mailings', 'crm_comentarios_semana'] loop
--     if exists (
--       select 1 from pg_publication_tables
--       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
--     ) then
--       execute format('alter publication supabase_realtime drop table public.%I', t);
--     end if;
--   end loop;
-- end $$;
