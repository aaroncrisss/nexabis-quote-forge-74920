-- =============================================================================
-- 20261102_03_instagram_analytics.sql
-- Analítica de Instagram:
--   * ig_media_stats      : estadísticas por publicación (sincronizadas por el cron cada 6 h)
--   * ig_settings         : horas de audiencia (Meta), sync, resumen semanal y WhatsApp
--   * ig_resumenes        : historial de resúmenes semanales
--   * ig_period_stats()   : KPIs de un rango [desde, hasta) (para comparar semanas)
--   * ig_activity_heatmap(): comentarios recibidos por día de semana × hora (hora Chile)
--   * ig_content_ranking(): cada post con sus métricas de Meta + resultados del bot
-- =============================================================================

create table if not exists public.ig_media_stats (
  media_id           text primary key,
  media_product_type text,
  media_type         text,
  caption            text,
  permalink          text,
  thumbnail_url      text,
  publicado_at       timestamptz,
  likes              integer,
  comments           integer,
  reach              integer,
  views              integer,
  saved              integer,
  shares             integer,
  interactions       integer,
  follows            integer,
  profile_visits     integer,
  avg_watch_ms       integer,
  updated_at         timestamptz not null default now()
);

create index if not exists ig_media_stats_publicado_idx on public.ig_media_stats (publicado_at desc);

alter table public.ig_media_stats enable row level security;
drop policy if exists ig_media_stats_select on public.ig_media_stats;
create policy ig_media_stats_select on public.ig_media_stats for select to authenticated
  using ((select private.is_member()));

alter table public.ig_settings
  add column if not exists audiencia_horas     jsonb,        -- [24] promedio de seguidores conectados por hora (hora Chile)
  add column if not exists audiencia_dias      jsonb,        -- [7]  (0 = domingo) promedio diario
  add column if not exists stats_synced_at     timestamptz,
  add column if not exists followers_count     integer,
  add column if not exists resumen_semanal     boolean not null default true,
  add column if not exists resumen_email       text,
  add column if not exists resumen_enviado_at  timestamptz,
  -- WhatsApp (Evolution API): resumen semanal y alertas en tiempo real
  add column if not exists whatsapp_numero      text,
  add column if not exists resumen_por_whatsapp boolean not null default true,
  add column if not exists alertas_whatsapp     boolean not null default false;

alter table public.ig_contacts
  add column if not exists alerta_at timestamptz;   -- anti-spam de alertas de DM (1 por hora por persona)

create table if not exists public.ig_resumenes (
  id            bigint generated always as identity primary key,
  semana_desde  timestamptz not null,
  semana_hasta  timestamptz not null,
  datos         jsonb not null,
  email_enviado boolean not null default false,
  email_error   text,
  created_at    timestamptz not null default now()
);

alter table public.ig_resumenes enable row level security;
drop policy if exists ig_resumenes_select on public.ig_resumenes;
create policy ig_resumenes_select on public.ig_resumenes for select to authenticated
  using ((select private.is_member()));

-- Miembro del equipo o service_role (cron / edge function)
create or replace function private.ig_can_read() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'role') = 'service_role', false) or (select private.is_member());
$$;

-- -----------------------------------------------------------------------------
-- KPIs de un período
-- -----------------------------------------------------------------------------
create or replace function public.ig_period_stats(p_desde timestamptz, p_hasta timestamptz default now())
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v jsonb;
begin
  if not private.ig_can_read() then
    raise exception 'forbidden';
  end if;

  with ev as (
    select * from public.ig_comment_events where created_at >= p_desde and created_at < p_hasta
  ),
  ct as (
    select * from public.ig_contacts where primer_contacto >= p_desde and primer_contacto < p_hasta
  ),
  pr as (
    select p.* from public.presupuestos p
     join public.ig_contacts c on c.cliente_id = p.cliente_id
     where p.created_at >= p_desde and p.created_at < p_hasta
  )
  select jsonb_build_object(
    'desde', p_desde,
    'hasta', p_hasta,
    'comentarios',    (select count(*) from ev),
    'dms_enviados',   (select count(*) from ev where estado = 'enviado'),
    'ofertas',        (select count(*) from ev where oferta_enviada_at is not null),
    'errores',        (select count(*) from ev where estado = 'error'),
    'personas_nuevas',(select count(*) from ct),
    'leads_crm',      (select count(*) from public.ig_contacts c
                        join public.clientes cl on cl.id = c.cliente_id
                        where cl.created_at >= p_desde and cl.created_at < p_hasta),
    'clics',          (select coalesce(sum(clics), 0) from public.ig_links
                        where ultimo_clic_at >= p_desde and ultimo_clic_at < p_hasta),
    'mensajes_in',    (select count(*) from public.ig_messages
                        where direccion = 'in' and created_at >= p_desde and created_at < p_hasta),
    'menciones',      (select count(*) from public.ig_contacts
                        where ultima_mencion_at >= p_desde and ultima_mencion_at < p_hasta),
    'presupuestos',   (select count(*) from pr),
    'aprobados',      (select count(*) from pr where estado = 'aprobado'),
    'ingresos',       (select coalesce(sum(total), 0) from pr where estado = 'aprobado'),
    'publicaciones',  (select count(*) from public.ig_media_stats
                        where publicado_at >= p_desde and publicado_at < p_hasta)
  ) into v;
  return v;
end $$;

revoke all on function public.ig_period_stats(timestamptz, timestamptz) from public, anon;
grant execute on function public.ig_period_stats(timestamptz, timestamptz) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Actividad de la audiencia: comentarios por día de semana × hora (America/Santiago)
-- -----------------------------------------------------------------------------
create or replace function public.ig_activity_heatmap(p_dias integer default 90)
returns table (dow integer, hora integer, n integer)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.ig_can_read() then
    raise exception 'forbidden';
  end if;
  return query
    select extract(dow from e.created_at at time zone 'America/Santiago')::int,
           extract(hour from e.created_at at time zone 'America/Santiago')::int,
           count(*)::int
      from public.ig_comment_events e
     where e.created_at >= now() - make_interval(days => greatest(1, least(p_dias, 365)))
       and e.from_id <> 'eliminado'
     group by 1, 2;
end $$;

revoke all on function public.ig_activity_heatmap(integer) from public, anon;
grant execute on function public.ig_activity_heatmap(integer) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Ranking de contenido: métricas de Meta + lo que generó el bot en cada post
-- -----------------------------------------------------------------------------
create or replace function public.ig_content_ranking()
returns table (
  media_id text, media_product_type text, media_type text, caption text, permalink text,
  thumbnail_url text, publicado_at timestamptz,
  likes integer, comments integer, reach integer, views integer, saved integer, shares integer,
  interactions integer, follows integer, profile_visits integer, avg_watch_ms integer,
  comentarios_bot integer, dms integer, ofertas integer, leads integer, clics integer
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.ig_can_read() then
    raise exception 'forbidden';
  end if;
  return query
    select s.media_id, s.media_product_type, s.media_type, s.caption, s.permalink, s.thumbnail_url, s.publicado_at,
           s.likes, s.comments, s.reach, s.views, s.saved, s.shares, s.interactions, s.follows, s.profile_visits, s.avg_watch_ms,
           coalesce(ev.total, 0)::int,
           coalesce(ev.dms, 0)::int,
           coalesce(ev.ofertas, 0)::int,
           coalesce(ld.leads, 0)::int,
           coalesce(lk.clics, 0)::int
      from public.ig_media_stats s
      left join (
        select e.media_id,
               count(*) as total,
               count(*) filter (where e.estado = 'enviado') as dms,
               count(*) filter (where e.oferta_enviada_at is not null) as ofertas
          from public.ig_comment_events e
         group by e.media_id
      ) ev on ev.media_id = s.media_id
      left join (
        select x.media_id, count(distinct c.ig_user_id) as leads
          from public.ig_comment_events x
          join public.ig_contacts c on c.ig_user_id = x.from_id and c.cliente_id is not null
         group by x.media_id
      ) ld on ld.media_id = s.media_id
      left join (
        select l.media_id, sum(l.clics) as clics from public.ig_links l group by l.media_id
      ) lk on lk.media_id = s.media_id
     order by s.publicado_at desc nulls last;
end $$;

revoke all on function public.ig_content_ranking() from public, anon;
grant execute on function public.ig_content_ranking() to authenticated, service_role;
