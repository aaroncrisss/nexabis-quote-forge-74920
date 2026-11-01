-- =============================================================================
-- ALIGN TASKS, TASK_COMMENTS & TASK_HISTORY COLUMNS WITH ROADMAP VIEWS
-- =============================================================================

alter table public.tasks drop constraint if exists tasks_type_check;
alter table public.tasks add constraint tasks_type_check
  check (type in ('Rompelínea','Diaria','Proyecto','Operacional','Seguimiento','Mejora','Incidente','Reunión','Análisis','Estratégica','Administrativa'));

alter table public.tasks drop constraint if exists tasks_effort_check;
update public.tasks set effort = 'Medio' where effort = 'M';
update public.tasks set effort = 'Bajo'  where effort = 'S';
update public.tasks set effort = 'Alto'  where effort = 'L';
alter table public.tasks alter column effort set default 'Medio';
alter table public.tasks add constraint tasks_effort_check
  check (effort in ('Alto','Medio','Bajo','S','M','L'));

alter table public.tasks
  add column if not exists requester           text references public.team_members (id) on delete set null,
  add column if not exists category            text not null default '',
  add column if not exists blockers            text not null default '',
  add column if not exists expected_result     text not null default '',
  add column if not exists links               text not null default '',
  add column if not exists recurring_enabled   boolean not null default false,
  add column if not exists recurring_frequency text not null default 'Semanal'
    check (recurring_frequency in ('Diaria','Días hábiles','Semanal','Quincenal','Mensual','Personalizada')),
  add column if not exists objective           text not null default '',
  add column if not exists expected_impact     text not null default '',
  add column if not exists success_indicator   text not null default '',
  add column if not exists next_milestone      text not null default '',
  add column if not exists updated_by          text references public.team_members (id) on delete set null;

-- task_comments: admitir tanto body como text
alter table public.task_comments alter column text drop not null;
alter table public.task_comments drop constraint if exists task_comments_text_check;
alter table public.task_comments add column if not exists body text not null default '';
update public.task_comments set body = coalesce(text, '') where body = '' and text is not null;

create or replace function private.task_comments_before_insert() returns trigger
language plpgsql security definer set search_path = '' set row_security = off as $$
begin
  new.author := coalesce(private.current_member_id(), new.author);
  new.body   := btrim(coalesce(nullif(new.body, ''), new.text, ''));
  new.text   := new.body;
  new.mentions := coalesce(
    array(
      select distinct m.id
      from public.team_members m
      where m.id = any(coalesce(new.mentions, '{}'))
         or position(lower('@' || split_part(m.name, ' ', 1)) in lower(new.body)) > 0
         or position(lower('@' || m.initials) in lower(new.body)) > 0
    ),
    '{}'
  );
  return new;
end $$;

-- task_history: admitir tanto from_value/to_value como from_val/to_val
alter table public.task_history
  add column if not exists from_value text,
  add column if not exists to_value   text;

update public.task_history
   set from_value = coalesce(from_value, from_val),
       to_value   = coalesce(to_value, to_val)
 where from_value is null and to_value is null;

create or replace function private.task_history_sync_cols() returns trigger
language plpgsql security definer set search_path = '' set row_security = off as $$
begin
  new.from_value := coalesce(new.from_value, new.from_val);
  new.to_value   := coalesce(new.to_value, new.to_val);
  new.from_val   := coalesce(new.from_val, new.from_value);
  new.to_val     := coalesce(new.to_val, new.to_value);
  return new;
end $$;

drop trigger if exists task_history_sync_cols on public.task_history;
create trigger task_history_sync_cols
  before insert or update on public.task_history
  for each row execute function private.task_history_sync_cols();
