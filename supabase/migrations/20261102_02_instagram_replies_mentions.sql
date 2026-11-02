-- =============================================================================
-- 20261102_02_instagram_replies_mentions.sql
--   * ig_respuestas : respuestas guardadas para la Bandeja y los comentarios
--   * ig_settings   : auto-respuesta a menciones en historias
--   * ig_contacts   : contador de menciones (y anti-spam: 1 respuesta cada 12 h)
-- =============================================================================

create table if not exists public.ig_respuestas (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  texto      text not null,
  orden      integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.ig_respuestas enable row level security;
drop policy if exists ig_respuestas_all on public.ig_respuestas;
create policy ig_respuestas_all on public.ig_respuestas for all to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));

insert into public.ig_respuestas (titulo, texto, orden)
select * from (values
  ('Saludo', '¡Hola {username}! 👋 Gracias por escribir. ¿En qué te puedo ayudar?', 1),
  ('Agendar llamada', 'Coordinemos una llamada corta para ver tu caso 📞 ¿Qué día y hora te acomoda?', 2),
  ('Cotización', 'Te preparo una cotización sin costo 🙌 Cuéntame qué necesitas y para cuándo.', 3)
) v(titulo, texto, orden)
where not exists (select 1 from public.ig_respuestas);

alter table public.ig_settings
  add column if not exists story_mention_activo  boolean not null default false,
  add column if not exists story_mention_mensaje text not null default
    '¡Gracias por mencionarme en tu historia, {username}! 🙌 Te lo agradezco mucho.',
  add column if not exists story_mention_link    text;

alter table public.ig_contacts
  add column if not exists menciones         integer not null default 0,
  add column if not exists ultima_mencion_at timestamptz;
