-- Herramientas de crecimiento (17 de noviembre de 2026)
-- 1) Historia automática: al publicarse un Reel, se programa una historia con el mismo video (+20 min).
-- 2) Aviso por WhatsApp de cada comentario nuevo (resumen por pasada del cron).
-- 3) Opciones de publicación de la API: portada del Reel, colaboradores y nombre del audio.

alter table public.ig_settings add column if not exists auto_historia boolean not null default true;
alter table public.ig_settings add column if not exists alerta_comentarios boolean not null default true;

alter table public.ig_posts add column if not exists portada_url text;          -- cover_url (Reels)
alter table public.ig_posts add column if not exists colaboradores text[] not null default '{}'; -- collaborators (máx. 3)
alter table public.ig_posts add column if not exists audio_nombre text;          -- audio_name (Reels, solo audio original)
alter table public.ig_posts add column if not exists origen_post_id uuid;        -- historia automática: post que la generó
