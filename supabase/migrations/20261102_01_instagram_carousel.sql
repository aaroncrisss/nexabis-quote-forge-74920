-- =============================================================================
-- 20261102_01_instagram_carousel.sql
-- Publicaciones programadas: carruseles (2 a 10 imágenes/videos)
--   * tipo 'carrusel'
--   * media_items   : [{ "url": "...", "es_video": bool, "path": "..." }]
--   * children_ids  : contenedores hijos creados en Meta (se procesan antes del padre)
-- =============================================================================

alter table public.ig_posts drop constraint if exists ig_posts_tipo_check;
alter table public.ig_posts
  add constraint ig_posts_tipo_check check (tipo in ('reel', 'imagen', 'historia', 'carrusel'));

alter table public.ig_posts
  add column if not exists media_items  jsonb not null default '[]'::jsonb,
  add column if not exists children_ids text[];
