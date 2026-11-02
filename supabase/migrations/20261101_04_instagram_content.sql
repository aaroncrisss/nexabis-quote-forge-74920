-- =============================================================================
-- 20261101_04_instagram_content.sql
-- Panel completo de Instagram:
--   * ig_campaigns       : "pedir que me sigan" antes de enviar + ventana de fechas
--   * ig_posts           : publicaciones programadas (reel / imagen / historia) que se
--                          publican solas y activan una campaña sobre el post publicado
--   * ig_recursos        : archivos (PDF, etc.) en Storage con link propio
--                          https://nexabistech.com/r/<slug>
--   * resolve_link()     : resuelve /r/<código> (recurso o link rastreable) y cuenta el clic
--   * Buckets            : ig-media (videos/imágenes a publicar) y recursos (PDFs)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Campañas: seguir antes de recibir + ventana de fechas
-- -----------------------------------------------------------------------------
alter table public.ig_campaigns
  add column if not exists requiere_seguir boolean not null default false,
  add column if not exists mensaje_seguir  text not null default
    '¡Hola {username}! 🙌 Para enviarte el contenido, primero sígueme en @cris.nexabis y luego toca el botón 👇',
  add column if not exists mensaje_no_sigue text not null default
    'Aún no me sigues 👀 Sígueme en @cris.nexabis y vuelve a tocar el botón para recibirlo.',
  add column if not exists activa_desde timestamptz,
  add column if not exists activa_hasta timestamptz;

-- -----------------------------------------------------------------------------
-- 2. Publicaciones programadas
-- -----------------------------------------------------------------------------
create table if not exists public.ig_posts (
  id             uuid primary key default gen_random_uuid(),
  tipo           text not null default 'reel' check (tipo in ('reel', 'imagen', 'historia')),
  media_url      text not null,                 -- URL pública que Meta descarga
  storage_path   text,                          -- ruta en el bucket ig-media
  es_video       boolean not null default true,
  caption        text not null default '',
  compartir_feed boolean not null default true, -- reels: mostrar también en el feed
  publicar_en    timestamptz not null,
  estado         text not null default 'programado'
                 check (estado in ('borrador', 'programado', 'procesando', 'publicado', 'error')),
  campaign_id    uuid references public.ig_campaigns (id) on delete set null,
  container_id   text,
  media_id       text,
  permalink      text,
  error          text,
  intentos       integer not null default 0,
  publicado_at   timestamptz,
  created_by     uuid references auth.users (id) on delete set null default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists ig_posts_due_idx on public.ig_posts (estado, publicar_en);

alter table public.ig_posts enable row level security;
drop policy if exists ig_posts_all on public.ig_posts;
create policy ig_posts_all on public.ig_posts for all to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));

drop trigger if exists ig_posts_touch on public.ig_posts;
create trigger ig_posts_touch before update on public.ig_posts
  for each row execute function private.ig_touch();

-- -----------------------------------------------------------------------------
-- 3. Recursos (archivos con link propio)
-- -----------------------------------------------------------------------------
create table if not exists public.ig_recursos (
  slug          text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  titulo        text not null,
  destino       text not null,                 -- URL pública del archivo (o externa)
  storage_path  text,                          -- ruta en el bucket recursos
  mime          text,
  bytes         bigint,
  clics         integer not null default 0,
  ultimo_clic_at timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.ig_recursos enable row level security;
drop policy if exists ig_recursos_all on public.ig_recursos;
create policy ig_recursos_all on public.ig_recursos for all to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));

-- -----------------------------------------------------------------------------
-- 4. Resolver /r/<código> (público): link rastreable o recurso
-- -----------------------------------------------------------------------------
create or replace function public.resolve_link(p_code text)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_dest text;
begin
  if p_code is null or length(p_code) > 60 then
    return null;
  end if;

  -- Links rastreables por persona (token hex)
  if p_code ~ '^[a-f0-9]{6,40}$' then
    v_dest := public.ig_register_click(p_code);
    if v_dest is not null then
      return v_dest;
    end if;
  end if;

  update public.ig_recursos
     set clics = clics + 1, ultimo_clic_at = now()
   where slug = lower(p_code)
  returning destino into v_dest;
  return v_dest;
end $$;

revoke all on function public.resolve_link(text) from public;
grant execute on function public.resolve_link(text) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 5. Storage
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('ig-media', 'ig-media', true), ('recursos', 'recursos', true)
on conflict (id) do nothing;

drop policy if exists ig_storage_insert on storage.objects;
drop policy if exists ig_storage_update on storage.objects;
drop policy if exists ig_storage_delete on storage.objects;
create policy ig_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('ig-media', 'recursos') and (select private.is_member()));
create policy ig_storage_update on storage.objects for update to authenticated
  using (bucket_id in ('ig-media', 'recursos') and (select private.is_member()));
create policy ig_storage_delete on storage.objects for delete to authenticated
  using (bucket_id in ('ig-media', 'recursos') and (select private.is_member()));
