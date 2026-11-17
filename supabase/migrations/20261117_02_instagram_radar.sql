-- Radar de ideas: revisa a diario las cuentas de la competencia (business_discovery, sin IA)
-- y guarda sus posts con un "score" = interacción / mediana de esa cuenta.
-- Un score de 3 o más quiere decir que ese post rindió 3 veces su normal: una idea probada.

create table if not exists public.ig_competidores (
  username       text primary key,
  activo         boolean not null default true,
  nota           text,
  seguidores     integer,
  mediana        numeric,
  posts_semana   numeric,
  error          text,
  actualizado_at timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists public.ig_radar_posts (
  media_id     text primary key,
  username     text not null references public.ig_competidores(username) on delete cascade,
  caption      text,
  tipo         text,                 -- REEL | CARRUSEL | FOTO
  permalink    text,
  likes        integer not null default 0,
  comments     integer not null default 0,
  publicado_at timestamptz,
  score        numeric not null default 0,
  formulas     text[] not null default '{}',
  estado       text not null default 'nuevo' check (estado in ('nuevo', 'guardado', 'descartado', 'usado')),
  avisado      boolean not null default false,
  updated_at   timestamptz not null default now()
);

create index if not exists ig_radar_posts_score_idx on public.ig_radar_posts (publicado_at desc, score desc);

alter table public.ig_settings add column if not exists radar_synced_at timestamptz;
alter table public.ig_settings add column if not exists radar_score_min numeric not null default 3;

-- Equipo: lee y administra; la Edge Function escribe con service_role.
alter table public.ig_competidores enable row level security;
alter table public.ig_radar_posts enable row level security;

drop policy if exists ig_competidores_all on public.ig_competidores;
create policy ig_competidores_all on public.ig_competidores for all to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));

drop policy if exists ig_radar_posts_select on public.ig_radar_posts;
create policy ig_radar_posts_select on public.ig_radar_posts for select to authenticated
  using ((select private.is_member()));
drop policy if exists ig_radar_posts_update on public.ig_radar_posts;
create policy ig_radar_posts_update on public.ig_radar_posts for update to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));

-- Cuentas iniciales (lista de Cris, 17 de noviembre de 2026)
insert into public.ig_competidores (username) values
  ('diegodavila.ai'), ('alejomartinez.k'), ('maxecomm__'), ('calbornoz.ia'), ('jayson_security'),
  ('datosmotion'), ('nzstudio__._'), ('subproceso'), ('davidmadrazo.ia'), ('claudecode_es'),
  ('bencorde'), ('juanpe.divisual'), ('midu.dev'), ('iterixs'), ('santiremedio'),
  ('neutra.labs_'), ('evy_agent'), ('dotcsv'), ('soydalto')
on conflict (username) do nothing;
