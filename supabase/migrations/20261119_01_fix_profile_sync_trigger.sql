-- Fix: el trigger on_profile_sync_team_member usaba columnas que no existen en public.profiles
-- (new.nombre_completo -> new.nombre, new.empresa -> new.nombre_empresa). Con el error
-- "record "new" has no field "nombre_completo"" fallaba CUALQUIER insert/update de profiles
-- (cambiar logo, datos de empresa, plantilla de términos desde Configuración, etc.).
create or replace function private.sync_profile_to_team_member() returns trigger
language plpgsql security definer set search_path = '' set row_security = off as $$
declare
  v_slug text;
  v_initials text;
  v_name text;
begin
  v_name := coalesce(nullif(btrim(new.nombre), ''), split_part(coalesce(new.email, 'usuario'), '@', 1));
  v_slug := lower(regexp_replace(
    translate(v_name, 'áéíóúÁÉÍÓÚñÑäëïöüÄËÏÖÜ', 'aeiouAEIOUnNaeiouAEIOU'),
    '[^a-zA-Z0-9]+', '_', 'g'
  ));
  v_slug := regexp_replace(v_slug, '^_+|_+$', '', 'g');
  if length(v_slug) < 2 then
    v_slug := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  v_slug := left(v_slug, 40);

  v_initials := upper(left(
    coalesce(
      nullif((select string_agg(left(w, 1), '') from regexp_split_to_table(v_name, '\s+') as w), ''),
      left(v_name, 2)
    ),
    4
  ));

  -- Si ya existe por user_id o email, actualizar
  update public.team_members
     set user_id = new.id,
         email   = coalesce(nullif(lower(btrim(new.email)), ''), email),
         phone   = coalesce(nullif(btrim(new.telefono), ''), phone),
         updated_at = now()
   where user_id = new.id
      or (new.email is not null and lower(email) = lower(btrim(new.email)));

  if not found then
    insert into public.team_members (id, user_id, email, name, initials, role, color, phone, sort_order)
    values (
      v_slug,
      new.id,
      nullif(lower(btrim(new.email)), ''),
      left(v_name, 80),
      v_initials,
      coalesce(nullif(btrim(new.nombre_empresa), ''), 'Equipo Nexabis'),
      'cyan',
      coalesce(btrim(new.telefono), ''),
      (select coalesce(max(sort_order), 0) + 1 from public.team_members)
    )
    on conflict (id) do update set
      user_id = excluded.user_id,
      email   = coalesce(excluded.email, public.team_members.email),
      phone   = case when public.team_members.phone = '' then excluded.phone else public.team_members.phone end;
  end if;

  return new;
end $$;
