-- Reels de prueba (Trial Reels): Meta los muestra primero solo a no seguidores.
-- La Edge Function envía trial_params { graduation_strategy: "SS_PERFORMANCE" } al crear el contenedor
-- y, si la cuenta no es elegible, publica como Reel normal y deja prueba=false.
alter table public.ig_posts add column if not exists prueba boolean not null default false;
