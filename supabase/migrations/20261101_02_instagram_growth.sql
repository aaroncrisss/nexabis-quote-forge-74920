-- =============================================================================
-- 20261101_02_instagram_growth.sql
-- Instagram Auto-DM: siguiente nivel
--   * ig_settings        : configuración editable desde /instagram (CRM + agente IA)
--   * ig_campaigns       : UTM automáticos + rastreo de clics
--   * ig_contacts        : vínculo con clientes del CRM, pausa del agente IA, clics
--   * ig_messages        : historial de DMs (contexto para la IA + deduplicación por mid)
--   * ig_links           : links rastreables (redirect por la edge function)
--   * Trigger CRM        : al entregar la oferta, el contacto se crea como cliente
--                          (fuente=instagram, etapa_ciclo=lead) + oportunidad en el pipeline
--   * ig_funnel_stats()  : embudo completo comentario → DM → clic → lead → presupuesto → venta
--   * ig_register_click(): registra un clic y devuelve el destino (solo service_role)
--   (crons autenticados: ver 20261101_03_instagram_cron_auth.sql)
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Configuración (fila única) editable por el equipo
-- -----------------------------------------------------------------------------
create table if not exists public.ig_settings (
  id                 smallint primary key default 1 check (id = 1),
  crm_sync           boolean not null default true,
  crm_owner_id       uuid references auth.users (id) on delete set null,
  ai_enabled         boolean not null default false,
  ai_prompt          text not null default
'Eres Nexabot, el asistente de ventas de Nexabis Technologies (@cris.nexabis) en Instagram.
Nexabis crea sistemas a medida para negocios: CRM, cotizadores con IA, automatizaciones de WhatsApp e Instagram, páginas web y apps.
Objetivo: entender qué necesita la persona, resolver dudas breves y llevarla a agendar una llamada o pedir una cotización en https://nexabistech.com.
Precios: cada proyecto se cotiza según alcance; no inventes cifras. Si piden precio, pregunta qué necesitan y ofrece una cotización sin costo.',
  ai_link            text default 'https://nexabistech.com',
  ai_max_turnos_dia  integer not null default 15 check (ai_max_turnos_dia between 1 and 100),
  updated_at         timestamptz not null default now()
);

insert into public.ig_settings (id, crm_owner_id)
select 1, (select r.user_id from public.user_roles r where r.role = 'admin' order by r.created_at limit 1)
where not exists (select 1 from public.ig_settings);

alter table public.ig_settings enable row level security;
drop policy if exists ig_settings_select on public.ig_settings;
drop policy if exists ig_settings_update on public.ig_settings;
create policy ig_settings_select on public.ig_settings for select to authenticated using ((select private.is_member()));
create policy ig_settings_update on public.ig_settings for update to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));

drop trigger if exists ig_settings_touch on public.ig_settings;
create trigger ig_settings_touch before update on public.ig_settings
  for each row execute function private.ig_touch();

-- -----------------------------------------------------------------------------
-- 2. Campañas: UTM + rastreo de clics
-- -----------------------------------------------------------------------------
alter table public.ig_campaigns
  add column if not exists utm_activo     boolean not null default true,
  add column if not exists rastrear_clics boolean not null default false;

-- -----------------------------------------------------------------------------
-- 3. Contactos: CRM, IA, clics
-- -----------------------------------------------------------------------------
alter table public.ig_contacts
  add column if not exists cliente_id        uuid references public.clientes (id) on delete set null,
  add column if not exists ai_pausado_hasta  timestamptz,
  add column if not exists clics             integer not null default 0,
  add column if not exists ultimo_mensaje_at timestamptz;

create index if not exists ig_contacts_cliente_idx on public.ig_contacts (cliente_id);

-- -----------------------------------------------------------------------------
-- 4. Historial de mensajes (DM)
-- -----------------------------------------------------------------------------
create table if not exists public.ig_messages (
  id          bigint generated always as identity primary key,
  ig_user_id  text not null,                       -- la otra persona (IGSID)
  mid         text unique,                         -- id del mensaje en Meta (dedupe webhook/polling)
  direccion   text not null check (direccion in ('in', 'out')),
  origen      text not null check (origen in ('usuario', 'campaña', 'ia', 'humano')),
  campaign_id uuid references public.ig_campaigns (id) on delete set null,
  texto       text,
  created_at  timestamptz not null default now()
);

create index if not exists ig_messages_user_idx on public.ig_messages (ig_user_id, created_at desc);

alter table public.ig_messages enable row level security;
drop policy if exists ig_messages_select on public.ig_messages;
create policy ig_messages_select on public.ig_messages for select to authenticated using ((select private.is_member()));

-- -----------------------------------------------------------------------------
-- 5. Links rastreables
-- -----------------------------------------------------------------------------
create table if not exists public.ig_links (
  token          text primary key,
  campaign_id    uuid references public.ig_campaigns (id) on delete set null,
  ig_user_id     text,
  media_id       text,
  destino        text not null,
  clics          integer not null default 0,
  primer_clic_at timestamptz,
  ultimo_clic_at timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists ig_links_campaign_idx on public.ig_links (campaign_id);
create index if not exists ig_links_user_idx on public.ig_links (ig_user_id);

alter table public.ig_links enable row level security;
drop policy if exists ig_links_select on public.ig_links;
create policy ig_links_select on public.ig_links for select to authenticated using ((select private.is_member()));

create or replace function public.ig_register_click(p_token text)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_dest text;
  v_user text;
  v_first boolean;
begin
  update public.ig_links
     set clics = clics + 1,
         primer_clic_at = coalesce(primer_clic_at, now()),
         ultimo_clic_at = now()
   where token = p_token
  returning destino, ig_user_id, (clics = 1) into v_dest, v_user, v_first;

  -- clics del contacto = links distintos abiertos (no recargas)
  if v_user is not null and v_first then
    update public.ig_contacts set clics = clics + 1 where ig_user_id = v_user;
  end if;
  return v_dest;
end $$;

revoke all on function public.ig_register_click(text) from public, anon, authenticated;
grant execute on function public.ig_register_click(text) to service_role;

-- -----------------------------------------------------------------------------
-- 6. Sincronización con el CRM: al entregar la oferta → cliente + oportunidad
-- -----------------------------------------------------------------------------
create or replace function private.ig_sync_contact_to_crm() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_owner    uuid;
  v_sync     boolean;
  v_cliente  uuid;
  v_etapa    uuid;
  v_campaign text;
  v_nombre   text;
begin
  if new.oferta_enviada_at is null or new.cliente_id is not null then
    return null;
  end if;

  select s.crm_sync, s.crm_owner_id into v_sync, v_owner from public.ig_settings s where s.id = 1;
  if not coalesce(v_sync, false) or v_owner is null then
    return null;
  end if;

  begin
    select c.nombre into v_campaign from public.ig_campaigns c where c.id = new.ultima_campaign_id;
    v_nombre := coalesce('@' || nullif(new.username, ''), 'Instagram ' || new.ig_user_id);

    insert into public.clientes (usuario_id, nombre, email, fuente, etapa_ciclo, sitio_web, notas)
    values (
      v_owner,
      v_nombre,
      '',
      'instagram',
      'lead',
      case when nullif(new.username, '') is not null then 'https://instagram.com/' || new.username end,
      'Lead automático desde Instagram Auto-DM'
        || coalesce(' · campaña: ' || v_campaign, '')
        || ' · IGSID ' || new.ig_user_id
    )
    returning id into v_cliente;

    select e.id into v_etapa
      from public.pipeline_etapas e
     where e.usuario_id = v_owner
     order by e.orden
     limit 1;

    if v_etapa is not null then
      insert into public.oportunidades (usuario_id, cliente_id, etapa_id, titulo, valor, probabilidad, notas)
      values (
        v_owner, v_cliente, v_etapa,
        'IG · ' || coalesce(v_campaign, 'Instagram') || ' · ' || v_nombre,
        0, 10,
        'Recibió la oferta por DM el ' || to_char(new.oferta_enviada_at at time zone 'America/Santiago', 'DD-MM-YYYY HH24:MI')
      );
    end if;

    -- (no re-dispara el trigger: solo escucha cambios de oferta_enviada_at)
    update public.ig_contacts set cliente_id = v_cliente where ig_user_id = new.ig_user_id;
  exception when others then
    -- Nunca romper el flujo de Instagram por un problema del CRM
    raise warning 'ig_sync_contact_to_crm: %', sqlerrm;
  end;
  return null;
end $$;

-- AFTER (no BEFORE): con INSERT ... ON CONFLICT DO UPDATE, un BEFORE INSERT se ejecuta
-- aunque la fila termine actualizándose, lo que crearía clientes duplicados.
drop trigger if exists ig_contacts_crm_sync on public.ig_contacts;
create trigger ig_contacts_crm_sync
  after insert or update of oferta_enviada_at on public.ig_contacts
  for each row execute function private.ig_sync_contact_to_crm();

-- -----------------------------------------------------------------------------
-- 7. Embudo completo (server-side, sin límite de 300 filas)
-- -----------------------------------------------------------------------------
create or replace function public.ig_funnel_stats(p_desde timestamptz default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_desde timestamptz := coalesce(p_desde, '-infinity'::timestamptz);
  v_result jsonb;
begin
  if not (select private.is_member()) then
    raise exception 'forbidden';
  end if;

  with ev as (
    select * from public.ig_comment_events where created_at >= v_desde
  ),
  ct as (
    select * from public.ig_contacts where primer_contacto >= v_desde
  ),
  pr as (
    select p.* from public.presupuestos p
     where p.cliente_id in (select cliente_id from ct where cliente_id is not null)
  )
  select jsonb_build_object(
    'comentarios',      (select count(*) from ev),
    'con_campania',     (select count(*) from ev where campaign_id is not null),
    'dms_enviados',     (select count(*) from ev where estado = 'enviado'),
    'ofertas',          (select count(*) from ev where oferta_enviada_at is not null),
    'errores',          (select count(*) from ev where estado = 'error'),
    'clics',            (select coalesce(sum(clics), 0) from public.ig_links where created_at >= v_desde),
    'personas_clic',    (select count(*) from ct where clics > 0),
    'leads_crm',        (select count(*) from ct where cliente_id is not null),
    'presupuestos',     (select count(*) from pr),
    'aprobados',        (select count(*) from pr where estado = 'aprobado'),
    'ingresos',         (select coalesce(sum(total), 0) from pr where estado = 'aprobado'),
    'conversaciones_ia',(select count(distinct ig_user_id) from public.ig_messages where origen = 'ia' and created_at >= v_desde),
    'por_campania', coalesce((
      select jsonb_agg(jsonb_build_object(
        'campaign_id', c.id,
        'enviados', (select count(*) from ev where ev.campaign_id = c.id and ev.estado = 'enviado'),
        'ofertas',  (select count(*) from ev where ev.campaign_id = c.id and ev.oferta_enviada_at is not null),
        'clics',    (select coalesce(sum(l.clics), 0) from public.ig_links l where l.campaign_id = c.id and l.created_at >= v_desde),
        'leads',    (select count(*) from ct where ct.ultima_campaign_id = c.id and ct.cliente_id is not null)
      ))
      from public.ig_campaigns c
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end $$;

revoke all on function public.ig_funnel_stats(timestamptz) from public, anon;
grant execute on function public.ig_funnel_stats(timestamptz) to authenticated;
