-- =============================================================================
-- 20261030_01_instagram_comment_to_dm.sql
-- Instagram "Comment-to-DM" propio (sin ManyChat)
--   * ig_account        : cuenta IG conectada + token (solo service_role, sin policies)
--   * ig_campaigns      : reglas (palabras clave / publicaciones -> mensaje + link)
--   * ig_comment_events : log idempotente de cada comentario procesado
--   * ig_contacts       : personas que interactuaron (leads de Instagram)
--   * ig_account_status : RPC segura para que el frontend vea el estado sin ver el token
--   * cron semanal      : refresca el token de larga duración (60 días)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Cuenta conectada (fila única). El token NUNCA se expone al frontend.
-- -----------------------------------------------------------------------------
create table if not exists public.ig_account (
  id                smallint primary key default 1 check (id = 1),
  ig_user_id        text,                -- ID profesional de IG (el que llega en entry.id del webhook)
  username          text,
  access_token      text,                -- token de larga duración (Instagram Login)
  token_expires_at  timestamptz,
  token_refreshed_at timestamptz,
  subscribed_fields text[] not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.ig_account enable row level security;
-- Sin policies a propósito: solo el service_role (edge function) puede leer/escribir.

-- -----------------------------------------------------------------------------
-- 2. Campañas / reglas de respuesta
-- -----------------------------------------------------------------------------
create table if not exists public.ig_campaigns (
  id                   uuid primary key default gen_random_uuid(),
  nombre               text not null,
  activa               boolean not null default false,
  prioridad            integer not null default 0,           -- mayor = se evalúa primero

  -- Disparadores
  media_ids            text[] not null default '{}',         -- vacío = todas las publicaciones/reels
  keywords             text[] not null default '{}',         -- vacío = cualquier comentario
  match_mode           text not null default 'contiene'
                       check (match_mode in ('contiene', 'exacta', 'cualquiera')),
  responder_dm         boolean not null default false,       -- también dispara si escriben la keyword por DM

  -- Flujo
  modo                 text not null default 'dos_pasos'
                       check (modo in ('directo', 'dos_pasos')),
  mensaje_inicial      text not null default '¡Hola {username}! 👋 Vi tu comentario. ¿Te mando la info por aquí? Toca el botón 👇',
  boton_texto          text not null default 'Sí, envíamela'  check (char_length(boton_texto) <= 20),
  mensaje_oferta       text not null default 'Aquí tienes toda la info 🚀',
  link_url             text,
  link_titulo          text not null default 'Ver oferta'    check (char_length(link_titulo) <= 20),
  respuestas_publicas  text[] not null default '{}',         -- respuesta visible en el comentario (aleatoria)
  delay_segundos       integer not null default 0 check (delay_segundos between 0 and 60),
  una_vez_por_usuario  boolean not null default true,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists ig_campaigns_activa_idx on public.ig_campaigns (activa, prioridad desc);

-- -----------------------------------------------------------------------------
-- 3. Contactos (leads que comentaron / escribieron)
-- -----------------------------------------------------------------------------
create table if not exists public.ig_contacts (
  ig_user_id           text primary key,                      -- IGSID del usuario
  username             text,
  primer_contacto      timestamptz not null default now(),
  ultimo_contacto      timestamptz not null default now(),
  total_comentarios    integer not null default 0,
  ultima_campaign_id   uuid references public.ig_campaigns (id) on delete set null,
  pending_campaign_id  uuid references public.ig_campaigns (id) on delete set null, -- flujo dos_pasos
  pending_until        timestamptz,
  oferta_enviada_at    timestamptz,
  notas                text
);

create index if not exists ig_contacts_ultima_campaign_idx on public.ig_contacts (ultima_campaign_id);
create index if not exists ig_contacts_pending_campaign_idx on public.ig_contacts (pending_campaign_id);

-- -----------------------------------------------------------------------------
-- 4. Log de eventos (idempotente por comment_id: Meta reintenta webhooks)
-- -----------------------------------------------------------------------------
create table if not exists public.ig_comment_events (
  id                 bigint generated always as identity primary key,
  comment_id         text not null unique,
  media_id           text,
  media_type         text,
  parent_id          text,
  from_id            text,
  from_username      text,
  texto              text,
  campaign_id        uuid references public.ig_campaigns (id) on delete set null,
  estado             text not null default 'recibido'
                     check (estado in ('recibido', 'enviado', 'omitido', 'error')),
  motivo             text,
  private_reply_ok   boolean,
  public_reply_ok    boolean,
  oferta_enviada_at  timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists ig_events_created_idx  on public.ig_comment_events (created_at desc);
create index if not exists ig_events_campaign_idx on public.ig_comment_events (campaign_id);
create index if not exists ig_events_from_idx     on public.ig_comment_events (from_id, campaign_id);

-- -----------------------------------------------------------------------------
-- 5. updated_at automático
-- -----------------------------------------------------------------------------
create or replace function private.ig_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists ig_campaigns_touch on public.ig_campaigns;
create trigger ig_campaigns_touch before update on public.ig_campaigns
  for each row execute function private.ig_touch();

drop trigger if exists ig_account_touch on public.ig_account;
create trigger ig_account_touch before update on public.ig_account
  for each row execute function private.ig_touch();

-- -----------------------------------------------------------------------------
-- 6. RLS para el equipo (mismo patrón que el resto del CRM)
-- -----------------------------------------------------------------------------
alter table public.ig_campaigns      enable row level security;
alter table public.ig_contacts       enable row level security;
alter table public.ig_comment_events enable row level security;

drop policy if exists ig_campaigns_select on public.ig_campaigns;
drop policy if exists ig_campaigns_insert on public.ig_campaigns;
drop policy if exists ig_campaigns_update on public.ig_campaigns;
drop policy if exists ig_campaigns_delete on public.ig_campaigns;
create policy ig_campaigns_select on public.ig_campaigns for select to authenticated using ((select private.is_member()));
create policy ig_campaigns_insert on public.ig_campaigns for insert to authenticated with check ((select private.is_member()));
create policy ig_campaigns_update on public.ig_campaigns for update to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));
create policy ig_campaigns_delete on public.ig_campaigns for delete to authenticated using ((select private.is_member()));

drop policy if exists ig_contacts_select on public.ig_contacts;
drop policy if exists ig_contacts_update on public.ig_contacts;
create policy ig_contacts_select on public.ig_contacts for select to authenticated using ((select private.is_member()));
create policy ig_contacts_update on public.ig_contacts for update to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));

drop policy if exists ig_events_select on public.ig_comment_events;
create policy ig_events_select on public.ig_comment_events for select to authenticated using ((select private.is_member()));

-- -----------------------------------------------------------------------------
-- 7. Estado de la conexión para el frontend (sin exponer el token)
-- -----------------------------------------------------------------------------
create or replace function public.ig_account_status()
returns table (
  connected          boolean,
  ig_user_id         text,
  username           text,
  token_expires_at   timestamptz,
  token_refreshed_at timestamptz,
  subscribed_fields  text[]
)
language sql stable security definer set search_path = '' set row_security = off as $$
  select
    (a.access_token is not null and a.ig_user_id is not null) as connected,
    a.ig_user_id, a.username, a.token_expires_at, a.token_refreshed_at, a.subscribed_fields
  from public.ig_account a
  where a.id = 1 and (select private.is_member())
$$;

revoke all on function public.ig_account_status() from public, anon;
grant execute on function public.ig_account_status() to authenticated;

-- -----------------------------------------------------------------------------
-- 8. Campaña de ejemplo (INACTIVA). Edítala desde /instagram antes de activarla.
-- -----------------------------------------------------------------------------
insert into public.ig_campaigns (
  nombre, activa, prioridad, keywords, match_mode, modo,
  mensaje_inicial, boton_texto, mensaje_oferta, link_url, link_titulo, respuestas_publicas
)
select
  'Ejemplo: comenta INFO', false, 10, array['info', 'precio', 'quiero', 'link'], 'contiene', 'dos_pasos',
  '¡Hola {username}! 👋 Gracias por comentar. ¿Te envío los detalles de lo que estamos ofreciendo? Toca el botón 👇',
  'Sí, envíamela',
  'Acá tienes todo: qué incluye, precios y cómo partir. Cualquier duda me escribes por aquí mismo 🙌',
  'https://nexabistech.com',
  'Ver oferta',
  array['¡Te escribí por DM, {username}! 📩', '¡Listo! Revisa tus mensajes 💬', 'Te mandé la info por interno 🚀']
where not exists (select 1 from public.ig_campaigns);

-- -----------------------------------------------------------------------------
-- 9. Cron semanal: refrescar token de larga duración (lunes 09:00 UTC)
--    La acción "refresh_token" es inofensiva: solo refresca si el token tiene >24h.
-- -----------------------------------------------------------------------------
create extension if not exists pg_net;
create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'nexabis-ig-refresh-token') then
    perform cron.unschedule('nexabis-ig-refresh-token');
  end if;
exception when others then
  null;
end $$;

select cron.schedule(
  'nexabis-ig-refresh-token',
  '0 9 * * 1',
  $$
  select net.http_post(
    url := 'https://htwuamsbzaznmwuypflt.supabase.co/functions/v1/instagram-webhook',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"action": "refresh_token"}'::jsonb
  );
  $$
);
