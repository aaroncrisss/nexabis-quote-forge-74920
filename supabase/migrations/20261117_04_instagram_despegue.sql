-- Aviso de despegue: 1 h después de publicar un Reel se miden vistas/alcance/compartidos y,
-- si va ≥ 1,5× la mediana de vistas de tus Reels, se avisa por WhatsApp con acciones para empujarlo.
alter table public.ig_posts add column if not exists despegue_revisado_at timestamptz;
alter table public.ig_posts add column if not exists despegue jsonb;
