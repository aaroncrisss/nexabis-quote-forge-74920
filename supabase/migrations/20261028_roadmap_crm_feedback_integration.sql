-- =============================================================================
-- UNIFIED MIGRATION: ROADMAP & OPERACIONES + PROGRAMACIÓN CRM + FEEDBACK & DESARROLLO
-- Integrado con Nexabis Quote Forge (clientes, proyectos, presupuestos, modulos_estimacion, profiles)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Esquema privado y utilidades base (compatibles con PostgreSQL 17 RLS)
-- -----------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.today_cl() returns date
language sql stable security definer set search_path = '' set row_security = off as $$
  select (now() at time zone 'America/Santiago')::date
$$;

create or replace function private.next_deadline(p_rec text, p_days int, p_base date) returns date
language sql immutable security definer set search_path = '' as $$
  select coalesce(p_base, (now() at time zone 'America/Santiago')::date) + case p_rec
    when 'Diaria'    then 1
    when 'Semanal'   then 7
    when 'Quincenal' then 14
    when 'Mensual'   then 30
    else greatest(1, coalesce(p_days, 7))
  end
$$;

-- -----------------------------------------------------------------------------
-- 2. Integrantes del equipo (public.team_members) sincronizados con public.profiles
-- -----------------------------------------------------------------------------
create table if not exists public.team_members (
  id          text primary key check (id ~ '^[a-z0-9_]{2,40}$'),
  user_id     uuid unique references auth.users (id) on delete set null,
  email       text unique check (email is null or length(btrim(email)) <= 200),
  name        text not null check (length(btrim(name)) between 1 and 80),
  initials    text not null check (length(btrim(initials)) between 1 and 4),
  role        text not null default '' check (length(role) <= 80),
  color       text not null default 'slate'
              check (color in ('blue','pink','amber','emerald','violet','cyan','orange','slate')),
  phone       text not null default '',
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.team_members add column if not exists phone text not null default '';

-- Semilla inicial con el equipo real de Nexabis desde public.profiles + miembros clave
insert into public.team_members (id, user_id, email, name, initials, role, color, phone, sort_order)
values
  ('cristobal_abarca', '94f1161f-81d2-444c-873a-e9424e55839f', 'cr.abarca.a@gmail.com', 'Cristóbal Abarca', 'CA', 'Director & Co-Founder', 'blue', '+56986343217', 1),
  ('cristopher_lynch', '3b3c9690-35fd-4d19-950c-8d56f671d5b0', 'cristopher910@gmail.com', 'Cristopher Lynch', 'CL', 'Tech Lead & Co-Founder', 'emerald', '', 2),
  ('cristobal_cuevas', '8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13', 'cristobal.cuevasp@gmail.com', 'Cristóbal Cuevas', 'CC', 'Head of Strategy & CRM', 'violet', '', 3)
on conflict (id) do update set
  user_id = coalesce(excluded.user_id, public.team_members.user_id),
  email   = coalesce(excluded.email, public.team_members.email),
  phone   = case when public.team_members.phone = '' then excluded.phone else public.team_members.phone end;

-- Funciones de identidad y pertenencia (con row_security = off para evitar recursión en PG17)
create or replace function private.current_member_id() returns text
language sql stable security definer set search_path = '' set row_security = off as $$
  select coalesce(
    (select id from public.team_members where user_id = (select auth.uid()) limit 1),
    (select id from public.team_members where lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', '')) limit 1),
    'cristobal_abarca'
  )
$$;

create or replace function private.is_member() returns boolean
language sql stable security definer set search_path = '' set row_security = off as $$
  select (select auth.uid()) is not null and (
    exists (select 1 from public.team_members where user_id = (select auth.uid()))
    or exists (select 1 from public.profiles where id = (select auth.uid()))
  )
$$;

-- Sincronización automática cuando se crea o actualiza un perfil en public.profiles
create or replace function private.sync_profile_to_team_member() returns trigger
language plpgsql security definer set search_path = '' set row_security = off as $$
declare
  v_slug text;
  v_initials text;
  v_name text;
begin
  v_name := coalesce(nullif(btrim(new.nombre_completo), ''), split_part(coalesce(new.email, 'usuario'), '@', 1));
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
      coalesce(nullif(btrim(new.empresa), ''), 'Equipo Nexabis'),
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

drop trigger if exists on_profile_sync_team_member on public.profiles;
create trigger on_profile_sync_team_member
  after insert or update on public.profiles
  for each row execute function private.sync_profile_to_team_member();

-- -----------------------------------------------------------------------------
-- 3. Tablas de Tareas / Roadmap / Operaciones (public.tasks, task_comments, task_history, notifications)
-- -----------------------------------------------------------------------------
create sequence if not exists public.task_num_seq start 101;

create table if not exists public.tasks (
  id                   text primary key default ('NEX-' || nextval('public.task_num_seq'))
                       check (id ~ '^(EST|NEX)-[0-9]+$'),
  title                text not null check (length(btrim(title)) between 1 and 300),
  description          text not null default '' check (length(description) <= 10000),
  type                 text not null default 'Operacional'
                       check (type in ('Estratégica','Operacional','Rompelínea','Mejora','Administrativa','Análisis')),
  priority             text not null default 'P2'
                       check (priority in ('P0','P1','P2','P3')),
  status               text not null default 'Por hacer'
                       check (status in ('Backlog','Por hacer','En curso','En revisión','Bloqueada','Terminada','Cancelada')),
  assignee             text references public.team_members (id) on delete set null,
  additional_assignees text[] not null default '{}',
  creator              text references public.team_members (id) on delete set null,
  start_date           date,
  deadline             date,
  original_deadline    date,
  completed_at         date,
  progress             smallint not null default 0 check (progress between 0 and 100),
  dependencies         text[] not null default '{}',
  blocker_reason       text not null default '' check (length(blocker_reason) <= 2000),
  blocker_owner        text references public.team_members (id) on delete set null,
  impact               text not null default 'Medio' check (impact in ('Alto','Medio','Bajo')),
  effort               text not null default 'M'     check (effort in ('S','M','L')),
  project              text not null default '' check (length(project) <= 120),
  tags                 text[] not null default '{}',
  subtasks             jsonb not null default '[]'::jsonb check (jsonb_typeof(subtasks) = 'array'),
  is_breaker           boolean not null default false,
  breaker_origin       text not null default '' check (length(breaker_origin) <= 300),
  interrupted_tasks    text[] not null default '{}',
  recurrence           text check (recurrence is null or recurrence in ('Diaria','Semanal','Quincenal','Mensual','Personalizada')),
  recurrence_days      int  check (recurrence_days is null or recurrence_days between 1 and 365),
  recurring_parent     text references public.tasks (id) on delete set null,
  -- Vínculos nativos con Nexabis CRM/Cotizador:
  cliente_id           uuid references public.clientes (id) on delete set null,
  proyecto_id          uuid references public.proyectos (id) on delete set null,
  modulo_id            uuid references public.modulos_estimacion (id) on delete set null,
  legacy_tarea_id      uuid unique,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists tasks_status_idx      on public.tasks (status);
create index if not exists tasks_assignee_idx    on public.tasks (assignee);
create index if not exists tasks_deadline_idx    on public.tasks (deadline);
create index if not exists tasks_priority_idx    on public.tasks (priority);
create index if not exists tasks_creator_idx     on public.tasks (creator);
create index if not exists tasks_blocker_idx     on public.tasks (blocker_owner);
create index if not exists tasks_parent_idx      on public.tasks (recurring_parent);
create index if not exists tasks_cliente_idx     on public.tasks (cliente_id);
create index if not exists tasks_proyecto_idx    on public.tasks (proyecto_id);
create index if not exists tasks_modulo_idx      on public.tasks (modulo_id);

create table if not exists public.task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    text not null references public.tasks (id) on delete cascade,
  author     text references public.team_members (id) on delete set null default private.current_member_id(),
  text       text not null check (length(btrim(text)) between 1 and 4000),
  mentions   text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists task_comments_task_idx   on public.task_comments (task_id, created_at);
create index if not exists task_comments_author_idx on public.task_comments (author);

create table if not exists public.task_history (
  id         uuid primary key default gen_random_uuid(),
  task_id    text not null references public.tasks (id) on delete cascade,
  actor      text references public.team_members (id) on delete set null,
  field      text not null,
  from_val   text,
  to_val     text,
  created_at timestamptz not null default now()
);
create index if not exists task_history_task_idx  on public.task_history (task_id, created_at);
create index if not exists task_history_actor_idx on public.task_history (actor);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('assigned','priority','mention','blocked','p0','rompelinea','crm_comment','crm_reminder','budget','whatsapp')),
  task_id    text references public.tasks (id) on delete cascade,
  task_title text not null default '',
  actor      text references public.team_members (id) on delete set null,
  target     text references public.team_members (id) on delete set null,
  message    text not null,
  link       text,
  created_at timestamptz not null default now()
);
create index if not exists notifications_created_idx on public.notifications (created_at desc);
create index if not exists notifications_target_idx  on public.notifications (target);
create index if not exists notifications_task_idx    on public.notifications (task_id);
create index if not exists notifications_actor_idx   on public.notifications (actor);

create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications (id) on delete cascade,
  member_id       text not null references public.team_members (id) on delete cascade default private.current_member_id(),
  read_at         timestamptz not null default now(),
  primary key (notification_id, member_id)
);
create index if not exists notification_reads_member_idx on public.notification_reads (member_id);

-- -----------------------------------------------------------------------------
-- 4. Funciones y triggers de Tasks, Comments, History y Notifications
-- -----------------------------------------------------------------------------
create or replace function private.team_members_before_update() returns trigger
language plpgsql security definer set search_path = '' set row_security = off as $$
begin
  if new.id is distinct from old.id then
    raise exception 'member_id_immutable: el identificador del integrante no se puede cambiar';
  end if;
  new.email := nullif(lower(btrim(coalesce(new.email, ''))), '');
  if new.email is distinct from old.email then
    new.user_id := (select id from auth.users where lower(email) = new.email limit 1);
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists team_members_before_update on public.team_members;
create trigger team_members_before_update
  before update on public.team_members
  for each row execute function private.team_members_before_update();

create or replace function private.tasks_before_write() returns trigger
language plpgsql security definer set search_path = '' set row_security = off as $$
declare
  v_today date := private.today_cl();
  v_member text := private.current_member_id();
begin
  new.title := btrim(new.title);

  -- Sincronizar nombre de proyecto si se seleccionó proyecto_id y project está vacío
  if new.proyecto_id is not null and coalesce(btrim(new.project), '') = '' then
    select left(nombre, 120), cliente_id
      into new.project, new.cliente_id
      from public.proyectos
     where id = new.proyecto_id;
    new.project := coalesce(new.project, '');
  end if;

  if new.is_breaker or new.type = 'Rompelínea' then
    new.is_breaker := true;
    new.type := 'Rompelínea';
  end if;

  if tg_op = 'INSERT' then
    if new.id is null or btrim(new.id) = '' then
      new.id := 'NEX-' || nextval('public.task_num_seq');
    end if;
    if new.creator is null then
      new.creator := v_member;
    end if;
    if new.original_deadline is null and new.deadline is not null then
      new.original_deadline := new.deadline;
    end if;
    if new.status = 'Terminada' then
      new.progress := 100;
      new.completed_at := coalesce(new.completed_at, v_today);
    end if;
  else
    new.created_at := old.created_at;
    new.updated_at := now();
    if old.original_deadline is null and new.deadline is not null then
      new.original_deadline := new.deadline;
    end if;
    if new.status = 'Terminada' and old.status is distinct from 'Terminada' then
      new.progress := 100;
      new.completed_at := v_today;
    elsif new.status <> 'Terminada' and old.status = 'Terminada' then
      new.completed_at := null;
    end if;
  end if;

  new.additional_assignees := coalesce(
    array(
      select distinct x from unnest(coalesce(new.additional_assignees, '{}')) as x
      where x is not null and x <> coalesce(new.assignee, '')
    ),
    '{}'
  );

  return new;
end $$;

create or replace function private.push_notification(
  p_type text, p_task public.tasks, p_actor text, p_target text, p_msg text
) returns void
language plpgsql security definer set search_path = '' set row_security = off as $$
declare
  v_nid uuid;
begin
  insert into public.notifications (type, task_id, task_title, actor, target, message)
  values (p_type, p_task.id, p_task.title, p_actor, p_target, p_msg)
  returning id into v_nid;

  if p_actor is not null then
    insert into public.notification_reads (notification_id, member_id)
    values (v_nid, p_actor)
    on conflict do nothing;
  end if;
end $$;

create or replace function private.tasks_after_insert() returns trigger
language plpgsql security definer set search_path = '' set row_security = off as $$
declare
  v_actor text := coalesce(private.current_member_id(), new.creator);
  v_actor_name text;
begin
  insert into public.task_history (task_id, actor, field, from_val, to_val)
  values (new.id, v_actor, 'creación', null, new.status);

  select name into v_actor_name from public.team_members where id = v_actor;
  v_actor_name := coalesce(v_actor_name, 'Sistema');

  if new.assignee is not null and new.assignee is distinct from v_actor then
    perform private.push_notification(
      'assigned', new, v_actor, new.assignee,
      v_actor_name || ' te asignó "' || new.title || '"'
    );
  end if;

  if new.is_breaker then
    perform private.push_notification(
      'rompelinea', new, v_actor, null,
      'Rompelínea registrado: "' || new.title || '"'
    );
  elsif new.priority = 'P0' then
    perform private.push_notification(
      'p0', new, v_actor, null,
      'Nueva P0 crítica: "' || new.title || '"'
    );
  end if;

  return null;
end $$;

create or replace function private.tasks_after_update() returns trigger
language plpgsql security definer set search_path = '' set row_security = off as $$
declare
  v_actor text := private.current_member_id();
  v_actor_name text;
  v_from_name text;
  v_to_name text;
begin
  select name into v_actor_name from public.team_members where id = v_actor;
  v_actor_name := coalesce(v_actor_name, 'Sistema');

  if new.status is distinct from old.status then
    insert into public.task_history (task_id, actor, field, from_val, to_val)
    values (new.id, v_actor, 'estado', old.status, new.status);
  end if;

  if new.priority is distinct from old.priority then
    insert into public.task_history (task_id, actor, field, from_val, to_val)
    values (new.id, v_actor, 'prioridad', old.priority, new.priority);
  end if;

  if new.assignee is distinct from old.assignee then
    select name into v_from_name from public.team_members where id = old.assignee;
    select name into v_to_name   from public.team_members where id = new.assignee;
    insert into public.task_history (task_id, actor, field, from_val, to_val)
    values (new.id, v_actor, 'responsable', coalesce(v_from_name, 'Sin asignar'), coalesce(v_to_name, 'Sin asignar'));
  end if;

  if new.deadline is distinct from old.deadline then
    insert into public.task_history (task_id, actor, field, from_val, to_val)
    values (new.id, v_actor, 'fecha límite', coalesce(old.deadline::text, 'Sin fecha'), coalesce(new.deadline::text, 'Sin fecha'));
  end if;

  if new.progress is distinct from old.progress then
    insert into public.task_history (task_id, actor, field, from_val, to_val)
    values (new.id, v_actor, 'avance', old.progress || '%', new.progress || '%');
  end if;

  if new.is_breaker is distinct from old.is_breaker then
    insert into public.task_history (task_id, actor, field, from_val, to_val)
    values (new.id, v_actor, 'rompelínea', case when old.is_breaker then 'Sí' else 'No' end, case when new.is_breaker then 'Sí' else 'No' end);
  end if;

  if new.title is distinct from old.title then
    insert into public.task_history (task_id, actor, field, from_val, to_val)
    values (new.id, v_actor, 'título', old.title, new.title);
  end if;

  if new.assignee is distinct from old.assignee and new.assignee is not null and new.assignee is distinct from v_actor then
    perform private.push_notification(
      'assigned', new, v_actor, new.assignee,
      v_actor_name || ' te asignó "' || new.title || '"'
    );
  end if;

  if new.priority is distinct from old.priority then
    if new.priority = 'P0' then
      perform private.push_notification(
        'p0', new, v_actor, new.assignee,
        'Tarea crítica P0: "' || new.title || '"'
      );
    else
      perform private.push_notification(
        'priority', new, v_actor, new.assignee,
        '"' || new.title || '" cambió a prioridad ' || new.priority
      );
    end if;
  end if;

  if new.status = 'Bloqueada' and old.status is distinct from 'Bloqueada' then
    perform private.push_notification(
      'blocked', new, v_actor, coalesce(new.blocker_owner, new.assignee),
      '"' || new.title || '" quedó bloqueada' ||
      case when new.blocker_reason <> '' then ': ' || new.blocker_reason else '' end
    );
  end if;

  if new.is_breaker and not old.is_breaker then
    perform private.push_notification(
      'rompelinea', new, v_actor, new.assignee,
      '"' || new.title || '" fue marcada como Rompelínea'
    );
  end if;

  if new.status = 'Terminada' and old.status is distinct from 'Terminada' and new.recurrence is not null then
    if not exists (
      select 1 from public.tasks
      where recurring_parent = new.id and status not in ('Terminada','Cancelada')
    ) then
      insert into public.tasks (
        title, description, type, priority, status, assignee, additional_assignees, creator,
        start_date, deadline, original_deadline, progress, dependencies, impact, effort,
        project, tags, subtasks, recurrence, recurrence_days, recurring_parent,
        cliente_id, proyecto_id
      ) values (
        new.title, new.description,
        case when new.type = 'Rompelínea' then 'Operacional' else new.type end,
        new.priority, 'Por hacer', new.assignee, new.additional_assignees, v_actor,
        private.today_cl(),
        private.next_deadline(new.recurrence, new.recurrence_days, new.deadline),
        private.next_deadline(new.recurrence, new.recurrence_days, new.deadline),
        0, '{}', new.impact, new.effort, new.project, new.tags,
        coalesce(
          (select jsonb_agg(jsonb_set(elem, '{done}', 'false'::jsonb))
           from jsonb_array_elements(new.subtasks) as elem),
          '[]'::jsonb
        ),
        new.recurrence, new.recurrence_days, new.id,
        new.cliente_id, new.proyecto_id
      );
    end if;
  end if;

  return null;
end $$;

create or replace function private.task_comments_before_insert() returns trigger
language plpgsql security definer set search_path = '' set row_security = off as $$
begin
  new.author := coalesce(private.current_member_id(), new.author);
  new.text := btrim(new.text);
  new.mentions := coalesce(
    array(
      select distinct m.id
      from public.team_members m
      where m.id = any(coalesce(new.mentions, '{}'))
         or position(lower('@' || split_part(m.name, ' ', 1)) in lower(new.text)) > 0
         or position(lower('@' || m.initials) in lower(new.text)) > 0
    ),
    '{}'
  );
  return new;
end $$;

create or replace function private.task_comments_after_insert() returns trigger
language plpgsql security definer set search_path = '' set row_security = off as $$
declare
  v_task public.tasks;
  v_author_name text;
  v_m text;
begin
  select * into v_task from public.tasks where id = new.task_id;
  if not found then return null; end if;

  select name into v_author_name from public.team_members where id = new.author;
  v_author_name := coalesce(v_author_name, 'Alguien');

  foreach v_m in array new.mentions loop
    if v_m is distinct from new.author then
      perform private.push_notification(
        'mention', v_task, new.author, v_m,
        v_author_name || ' te mencionó en "' || v_task.title || '"'
      );
    end if;
  end loop;
  return null;
end $$;

drop trigger if exists tasks_before_write on public.tasks;
create trigger tasks_before_write
  before insert or update on public.tasks
  for each row execute function private.tasks_before_write();

drop trigger if exists tasks_after_insert on public.tasks;
create trigger tasks_after_insert
  after insert on public.tasks
  for each row execute function private.tasks_after_insert();

drop trigger if exists tasks_after_update on public.tasks;
create trigger tasks_after_update
  after update on public.tasks
  for each row execute function private.tasks_after_update();

drop trigger if exists task_comments_before_insert on public.task_comments;
create trigger task_comments_before_insert
  before insert on public.task_comments
  for each row execute function private.task_comments_before_insert();

drop trigger if exists task_comments_after_insert on public.task_comments;
create trigger task_comments_after_insert
  after insert on public.task_comments
  for each row execute function private.task_comments_after_insert();

-- -----------------------------------------------------------------------------
-- 5. Migración de datos existentes de public.tareas -> public.tasks y sincronización con modulos_estimacion
-- -----------------------------------------------------------------------------
insert into public.tasks (
  title, description, type, priority, status, assignee, creator,
  start_date, deadline, original_deadline, completed_at, progress,
  project, tags, cliente_id, proyecto_id, modulo_id, legacy_tarea_id, created_at
)
select
  left(coalesce(nullif(btrim(t.titulo), ''), 'Tarea sin título'), 300),
  left(coalesce(t.descripcion, ''), 10000),
  case
    when t.modulo_id is not null then 'Operacional'
    when t.prioridad = 'urgente' then 'Estratégica'
    else 'Operacional'
  end,
  case t.prioridad
    when 'urgente' then 'P0'
    when 'alta'    then 'P1'
    when 'media'   then 'P2'
    when 'baja'    then 'P3'
    else 'P2'
  end,
  case t.estado
    when 'to_do'       then 'Por hacer'
    when 'in_progress' then 'En curso'
    when 'blocked'     then 'Bloqueada'
    when 'done'        then 'Terminada'
    else 'Por hacer'
  end,
  coalesce(
    (select tm.id from public.team_members tm where tm.user_id = t.usuario_id limit 1),
    'cristobal_abarca'
  ),
  coalesce(
    (select tm.id from public.team_members tm where tm.user_id = t.usuario_id limit 1),
    'cristobal_abarca'
  ),
  (t.created_at at time zone 'America/Santiago')::date,
  (t.fecha_vencimiento at time zone 'America/Santiago')::date,
  (t.fecha_vencimiento at time zone 'America/Santiago')::date,
  case when t.estado = 'done' then coalesce((t.fecha_completada at time zone 'America/Santiago')::date, (t.created_at at time zone 'America/Santiago')::date) else null end,
  case t.estado
    when 'done'        then 100
    when 'in_progress' then 50
    else 0
  end,
  coalesce((select left(p.nombre, 120) from public.proyectos p where p.id = t.proyecto_id), ''),
  case when t.tipo is not null and btrim(t.tipo) <> '' then array[btrim(t.tipo)] else '{}'::text[] end,
  coalesce(t.cliente_id, (select p.cliente_id from public.proyectos p where p.id = t.proyecto_id)),
  t.proyecto_id,
  t.modulo_id,
  t.id,
  coalesce(t.created_at, now())
from public.tareas t
where not exists (
  select 1 from public.tasks tk where tk.legacy_tarea_id = t.id
);

-- Sincronización bidireccional entre public.tasks, public.tareas y public.modulos_estimacion
create or replace function public.sync_task_to_modulo_and_legacy()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_modulo_estado text;
  v_tarea_estado text;
  v_tarea_prio text;
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  v_modulo_estado := case
    when new.status = 'Terminada' then 'completado'
    when new.status in ('En curso', 'En revisión') then 'en_desarrollo'
    else 'pendiente'
  end;

  v_tarea_estado := case
    when new.status = 'Terminada' then 'done'
    when new.status in ('En curso', 'En revisión') then 'in_progress'
    when new.status = 'Bloqueada' then 'blocked'
    else 'to_do'
  end;

  v_tarea_prio := case new.priority
    when 'P0' then 'urgente'
    when 'P1' then 'alta'
    when 'P2' then 'media'
    else 'baja'
  end;

  if new.modulo_id is not null then
    update public.modulos_estimacion
       set estado = v_modulo_estado
     where id = new.modulo_id
       and estado is distinct from v_modulo_estado;
  end if;

  if new.legacy_tarea_id is not null then
    update public.tareas
       set titulo      = new.title,
           descripcion = new.description,
           estado      = v_tarea_estado,
           prioridad   = v_tarea_prio,
           proyecto_id = new.proyecto_id,
           cliente_id  = new.cliente_id
     where id = new.legacy_tarea_id;
  end if;

  return new;
end $$;

drop trigger if exists trigger_sync_task_to_modulo on public.tasks;
create trigger trigger_sync_task_to_modulo
  after insert or update on public.tasks
  for each row execute function public.sync_task_to_modulo_and_legacy();

-- Actualizar el trigger existente de public.tareas y public.modulos_estimacion para sincronizar con public.tasks
create or replace function public.sync_modulo_to_task()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if new.estado is distinct from old.estado then
    update public.tareas
       set estado = case
         when new.estado = 'completado' then 'done'
         when new.estado = 'en_desarrollo' then 'in_progress'
         else 'to_do'
       end
     where modulo_id = new.id;

    update public.tasks
       set status = case
             when new.estado = 'completado' then 'Terminada'
             when new.estado = 'en_desarrollo' then 'En curso'
             else 'Por hacer'
           end,
           progress = case
             when new.estado = 'completado' then 100
             when new.estado = 'en_desarrollo' then greatest(progress, 50)
             else progress
           end
     where modulo_id = new.id;
  end if;
  return new;
end $$;

create or replace function public.sync_legacy_tarea_to_tasks()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_status text;
  v_prio text;
  v_assignee text;
  v_project text;
  v_cliente uuid;
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  v_status := case new.estado
    when 'done'        then 'Terminada'
    when 'in_progress' then 'En curso'
    when 'blocked'     then 'Bloqueada'
    else 'Por hacer'
  end;

  v_prio := case new.prioridad
    when 'urgente' then 'P0'
    when 'alta'    then 'P1'
    when 'media'   then 'P2'
    else 'P3'
  end;

  select id into v_assignee from public.team_members where user_id = new.usuario_id limit 1;
  v_assignee := coalesce(v_assignee, 'cristobal_abarca');

  if new.proyecto_id is not null then
    select left(nombre, 120), cliente_id into v_project, v_cliente from public.proyectos where id = new.proyecto_id;
  end if;

  insert into public.tasks (
    title, description, type, priority, status, assignee, creator,
    start_date, deadline, original_deadline, progress,
    project, tags, cliente_id, proyecto_id, modulo_id, legacy_tarea_id
  ) values (
    left(coalesce(nullif(btrim(new.titulo), ''), 'Tarea'), 300),
    left(coalesce(new.descripcion, ''), 10000),
    'Operacional',
    v_prio,
    v_status,
    v_assignee,
    v_assignee,
    private.today_cl(),
    (new.fecha_vencimiento at time zone 'America/Santiago')::date,
    (new.fecha_vencimiento at time zone 'America/Santiago')::date,
    case when v_status = 'Terminada' then 100 when v_status = 'En curso' then 50 else 0 end,
    coalesce(v_project, ''),
    case when new.tipo is not null and btrim(new.tipo) <> '' then array[btrim(new.tipo)] else '{}'::text[] end,
    coalesce(new.cliente_id, v_cliente),
    new.proyecto_id,
    new.modulo_id,
    new.id
  )
  on conflict (legacy_tarea_id) do update set
    title       = excluded.title,
    description = excluded.description,
    priority    = excluded.priority,
    status      = excluded.status,
    proyecto_id = excluded.proyecto_id,
    cliente_id  = excluded.cliente_id,
    modulo_id   = excluded.modulo_id;

  return new;
end $$;

drop trigger if exists trigger_sync_legacy_tarea_to_tasks on public.tareas;
create trigger trigger_sync_legacy_tarea_to_tasks
  after insert or update on public.tareas
  for each row execute function public.sync_legacy_tarea_to_tasks();

-- -----------------------------------------------------------------------------
-- 6. Permisos y RLS para Tareas / Roadmap
-- -----------------------------------------------------------------------------
grant usage, select on sequence public.task_num_seq to authenticated;
grant select, update on public.team_members to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert on public.task_comments to authenticated;
grant select on public.task_history to authenticated;
grant select, insert on public.notifications to authenticated;
grant select, insert, delete on public.notification_reads to authenticated;

alter table public.team_members       enable row level security;
alter table public.tasks              enable row level security;
alter table public.task_comments      enable row level security;
alter table public.task_history       enable row level security;
alter table public.notifications      enable row level security;
alter table public.notification_reads enable row level security;

drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members for select to authenticated using ((select private.is_member()));
drop policy if exists team_members_update on public.team_members;
create policy team_members_update on public.team_members for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated using ((select private.is_member()));
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated with check ((select private.is_member()));
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated using ((select private.is_member())) with check ((select private.is_member()));
drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated using ((select private.is_member()));

drop policy if exists task_comments_select on public.task_comments;
create policy task_comments_select on public.task_comments for select to authenticated using ((select private.is_member()));
drop policy if exists task_comments_insert on public.task_comments;
create policy task_comments_insert on public.task_comments for insert to authenticated with check ((select private.is_member()));

drop policy if exists task_history_select on public.task_history;
create policy task_history_select on public.task_history for select to authenticated using ((select private.is_member()));

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated using ((select private.is_member()));
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert to authenticated with check ((select private.is_member()));

drop policy if exists notification_reads_select on public.notification_reads;
create policy notification_reads_select on public.notification_reads for select to authenticated using ((select private.is_member()) and member_id = (select private.current_member_id()));
drop policy if exists notification_reads_insert on public.notification_reads;
create policy notification_reads_insert on public.notification_reads for insert to authenticated with check ((select private.is_member()) and member_id = (select private.current_member_id()));
drop policy if exists notification_reads_delete on public.notification_reads;
create policy notification_reads_delete on public.notification_reads for delete to authenticated using ((select private.is_member()) and member_id = (select private.current_member_id()));
