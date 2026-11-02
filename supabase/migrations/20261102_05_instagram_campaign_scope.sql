-- =============================================================================
-- 20261102_05_instagram_campaign_scope.sql
-- Campañas generales vs. campañas de video:
--   alcance = 'general' -> responde en todos los posts (si ninguna campaña de video calza)
--   alcance = 'posts'   -> responde SOLO en sus posts (media_ids). Vacío = espera que se
--                          publique su video programado (ig_posts.campaign_id).
-- Las campañas de video tienen prioridad sobre las generales en su post.
-- =============================================================================

alter table public.ig_campaigns
  add column if not exists alcance text not null default 'general';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ig_campaigns_alcance_check') then
    alter table public.ig_campaigns
      add constraint ig_campaigns_alcance_check check (alcance in ('general', 'posts'));
  end if;
end $$;

-- Las campañas que ya tenían posts elegidos pasan a ser "de video"
update public.ig_campaigns
   set alcance = 'posts'
 where alcance = 'general' and coalesce(array_length(media_ids, 1), 0) > 0;

create index if not exists ig_posts_campaign_idx on public.ig_posts (campaign_id) where campaign_id is not null;
