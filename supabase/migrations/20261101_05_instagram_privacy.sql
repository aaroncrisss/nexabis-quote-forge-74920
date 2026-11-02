-- =============================================================================
-- 20261101_05_instagram_privacy.sql
-- Privacidad (requisito App Review de Meta):
--   * ig_contacts.no_contactar : la persona escribió STOP -> no se le envían más DMs automáticos
--   * ig_data_deletions        : registro de solicitudes de eliminación (callback de Meta,
--                                DM "BORRAR MIS DATOS" o manual), con código de confirmación
-- =============================================================================

alter table public.ig_contacts
  add column if not exists no_contactar boolean not null default false,
  add column if not exists baja_at      timestamptz;

create table if not exists public.ig_data_deletions (
  codigo      text primary key,
  origen      text not null check (origen in ('meta_callback', 'dm', 'manual')),
  -- (no se guarda el ID de la persona: el registro no debe volver a identificarla)
  filas      jsonb,                   -- cuántas filas se borraron/anonimizaron por tabla
  created_at  timestamptz not null default now()
);

alter table public.ig_data_deletions enable row level security;
drop policy if exists ig_data_deletions_select on public.ig_data_deletions;
create policy ig_data_deletions_select on public.ig_data_deletions for select to authenticated
  using ((select private.is_member()));
