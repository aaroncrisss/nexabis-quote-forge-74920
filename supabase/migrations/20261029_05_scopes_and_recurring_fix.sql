-- =============================================================================
-- 05: ÁMBITOS DE VIDA/TRABAJO (Nexabis, Trabajo, Diaria) + FIX TAREAS RECURRENTES
-- =============================================================================

-- 1. Backfill de categoría 'Nexabis' para las tareas vinculadas a proyectos/módulos de Nexabis
update public.tasks
   set category = 'Nexabis'
 where coalesce(category, '') = ''
   and (proyecto_id is not null or cliente_id is not null or modulo_id is not null or project <> '');

update public.tasks
   set category = 'Diaria'
 where coalesce(category, '') = ''
   and (type = 'Diaria' or recurring_enabled = true);

update public.tasks
   set category = 'Trabajo'
 where coalesce(category, '') = '';

-- 2. Soporte para 'Días hábiles' en private.next_deadline
create or replace function private.next_deadline(p_rec text, p_days int, p_base date) returns date
language plpgsql immutable security definer set search_path = '' as $$
declare
  base_d date := coalesce(p_base, (now() at time zone 'America/Santiago')::date);
  d date;
begin
  case p_rec
    when 'Diaria' then
      return base_d + 1;
    when 'Días hábiles' then
      d := base_d + 1;
      while extract(isodow from d) in (6, 7) loop
        d := d + 1;
      end loop;
      return d;
    when 'Semanal' then
      return base_d + 7;
    when 'Quincenal' then
      return base_d + 14;
    when 'Mensual' then
      return base_d + 30;
    else
      return base_d + greatest(1, coalesce(p_days, 7));
  end case;
end $$;

-- 3. Actualizar trigger de tareas recurrentes para soportar recurring_enabled + recurring_frequency + category
create or replace function private.tasks_after_update() returns trigger
language plpgsql security definer set search_path = '' set row_security = off as $$
declare
  v_actor text := private.current_member_id();
  v_actor_name text;
  v_from_name text;
  v_to_name text;
  v_freq text;
  v_next_dl date;
begin
  select name into v_actor_name from public.team_members where id = v_actor;
  v_actor_name := coalesce(v_actor_name, 'Sistema');

  if new.status is distinct from old.status then
    insert into public.task_history (task_id, actor, field, from_val, to_val, from_value, to_value)
    values (new.id, v_actor, 'estado', old.status, new.status, old.status, new.status);
  end if;

  if new.priority is distinct from old.priority then
    insert into public.task_history (task_id, actor, field, from_val, to_val, from_value, to_value)
    values (new.id, v_actor, 'prioridad', old.priority, new.priority, old.priority, new.priority);
  end if;

  if new.assignee is distinct from old.assignee then
    select name into v_from_name from public.team_members where id = old.assignee;
    select name into v_to_name   from public.team_members where id = new.assignee;
    insert into public.task_history (task_id, actor, field, from_val, to_val, from_value, to_value)
    values (new.id, v_actor, 'responsable', coalesce(v_from_name, 'Sin asignar'), coalesce(v_to_name, 'Sin asignar'), coalesce(v_from_name, 'Sin asignar'), coalesce(v_to_name, 'Sin asignar'));
  end if;

  if new.deadline is distinct from old.deadline then
    insert into public.task_history (task_id, actor, field, from_val, to_val, from_value, to_value)
    values (new.id, v_actor, 'fecha límite', coalesce(old.deadline::text, 'Sin fecha'), coalesce(new.deadline::text, 'Sin fecha'), coalesce(old.deadline::text, 'Sin fecha'), coalesce(new.deadline::text, 'Sin fecha'));
  end if;

  if new.progress is distinct from old.progress then
    insert into public.task_history (task_id, actor, field, from_val, to_val, from_value, to_value)
    values (new.id, v_actor, 'avance', old.progress || '%', new.progress || '%', old.progress || '%', new.progress || '%');
  end if;

  if new.title is distinct from old.title then
    insert into public.task_history (task_id, actor, field, from_val, to_val, from_value, to_value)
    values (new.id, v_actor, 'título', old.title, new.title, old.title, new.title);
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
      case when coalesce(new.blockers, new.blocker_reason, '') <> '' then ': ' || coalesce(nullif(new.blockers, ''), new.blocker_reason) else '' end
    );
  end if;

  if (new.is_breaker and not old.is_breaker) or (new.type = 'Rompelínea' and old.type is distinct from 'Rompelínea') then
    perform private.push_notification(
      'rompelinea', new, v_actor, new.assignee,
      '"' || new.title || '" fue marcada como Rompelínea'
    );
  end if;

  -- Generación automática de siguiente instancia para tareas recurrentes (diarias, días hábiles, semanales, etc.)
  if new.status = 'Terminada' and old.status is distinct from 'Terminada' and (new.recurring_enabled = true or new.recurrence is not null) then
    v_freq := coalesce(nullif(new.recurring_frequency, ''), new.recurrence, 'Semanal');
    v_next_dl := private.next_deadline(v_freq, new.recurrence_days, coalesce(new.deadline, private.today_cl()));
    if not exists (
      select 1 from public.tasks
      where recurring_parent = new.id and status not in ('Terminada','Cancelada')
    ) then
      insert into public.tasks (
        title, description, type, category, priority, status, assignee, additional_assignees, creator, requester,
        start_date, deadline, original_deadline, progress, dependencies, impact, effort,
        project, tags, subtasks, recurring_enabled, recurring_frequency, recurrence, recurrence_days, recurring_parent,
        cliente_id, proyecto_id
      ) values (
        new.title, new.description,
        case when new.type = 'Rompelínea' then 'Operacional' else new.type end,
        coalesce(nullif(new.category, ''), 'Diaria'),
        new.priority, 'Por hacer', new.assignee, new.additional_assignees, v_actor, new.requester,
        private.today_cl(),
        v_next_dl,
        v_next_dl,
        0, '{}', new.impact, new.effort, new.project, new.tags,
        coalesce(
          (select jsonb_agg(jsonb_set(elem, '{done}', 'false'::jsonb))
           from jsonb_array_elements(new.subtasks) as elem),
          '[]'::jsonb
        ),
        true, v_freq,
        case when v_freq in ('Diaria','Semanal','Quincenal','Mensual','Personalizada') then v_freq else null end,
        new.recurrence_days, new.id,
        new.cliente_id, new.proyecto_id
      );
    end if;
  end if;

  return null;
end $$;
