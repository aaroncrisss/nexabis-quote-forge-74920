-- =============================================================================
-- POST-MIGRATION: LÍDERES NEXABIS, REALTIME, ALERTAS CRM + WHATSAPP RPCs
-- =============================================================================

-- 1. Ampliar tipos de notificación para incluir presupuestos y WhatsApp
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('assigned','priority','mention','blocked','p0','rompelinea','crm_comment','crm_reminder','budget','whatsapp'));

-- 2. Asegurar que los 3 socios/líderes de Nexabis tengan rol de líder en Feedback & Desarrollo
insert into public.fb_lideres (member_id)
select id from public.team_members where id in ('cristobal_abarca', 'cristopher_lynch', 'cristobal_cuevas')
on conflict do nothing;

-- Actualizar funciones de acceso de Feedback con row_security = off (seguridad PostgreSQL 17)
create or replace function private.fb_es_lider() returns boolean
language sql stable security definer set search_path = '' set row_security = off as $$
  select exists (
    select 1 from public.fb_lideres l
    join public.team_members t on t.id = l.member_id
    where t.user_id = (select auth.uid())
  ) or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and lower(coalesce(p.email, '')) in ('cr.abarca.a@gmail.com', 'cristopher910@gmail.com', 'cristobal.cuevasp@gmail.com')
  )
$$;

create or replace function private.fb_es_mi_persona(p_persona uuid) returns boolean
language sql stable security definer set search_path = '' set row_security = off as $$
  select exists (
    select 1 from public.fb_personas p
    where p.id = p_persona and p.member_id is not null and p.member_id = (select private.current_member_id())
  )
$$;

create or replace function private.fb_es_mi_objetivo(p_objetivo uuid) returns boolean
language sql stable security definer set search_path = '' set row_security = off as $$
  select exists (
    select 1 from public.fb_objetivos o
    join public.fb_personas p on p.id = o.persona_id
    where o.id = p_objetivo and p.member_id is not null and p.member_id = (select private.current_member_id())
  )
$$;

create or replace function private.fb_rol_visible(p_rol uuid) returns boolean
language sql stable security definer set search_path = '' set row_security = off as $$
  select exists (
    select 1 from public.fb_persona_roles pr
    join public.fb_personas p on p.id = pr.persona_id
    where pr.rol_id = p_rol and p.member_id is not null and p.member_id = (select private.current_member_id())
  )
$$;

create or replace function private.fb_sesion_visible(p_sesion uuid) returns boolean
language sql stable security definer set search_path = '' set row_security = off as $$
  select exists (
    select 1 from public.fb_sesiones s
    join public.fb_personas p on p.id = s.persona_id
    where s.id = p_sesion and s.estado = 'publicada' and p.member_id is not null and p.member_id = (select private.current_member_id())
  )
$$;

-- 3. Asegurar tablas de Roadmap en supabase_realtime (idempotente)
do $$
declare
  t text;
begin
  foreach t in array array['team_members','tasks','task_comments','task_history','notifications','notification_reads'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- 4. RPC unificado get_crm_alerts() para el Dashboard Frontend y el Workflow n8n de Alertas Diarias WhatsApp
create or replace function public.get_crm_alerts()
returns json
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_today date := private.today_cl();
  t_count int;
  t_p0_count int;
  t_blocked_count int;
  t_breaker_count int;
  c_count int;
  f_count int;
  p_count int;
  pg_count int;
  pg_sum decimal;
  cl_count int;
  fb_venc_count int;
  v_contratos json;
  v_facturas json;
  v_tareas json;
  v_presupuestos json;
begin
  -- Conteos sobre la nueva tabla public.tasks
  select count(*) into t_count
    from public.tasks
   where status not in ('Terminada', 'Cancelada')
     and deadline is not null
     and deadline < v_today;

  select count(*) into t_p0_count
    from public.tasks
   where status not in ('Terminada', 'Cancelada')
     and priority = 'P0';

  select count(*) into t_blocked_count
    from public.tasks
   where status = 'Bloqueada';

  select count(*) into t_breaker_count
    from public.tasks
   where status not in ('Terminada', 'Cancelada')
     and is_breaker = true;

  select count(*) into c_count
    from public.contratos
   where estado = 'activo'
     and fecha_fin between v_today and (v_today + 30);

  select count(*) into f_count
    from public.facturas
   where estado in ('borrador', 'enviada', 'vencida');

  select count(*) into p_count
    from public.presupuestos
   where estado = 'pendiente'
     and (fecha_vencimiento is null or fecha_vencimiento::date between (v_today - 7) and (v_today + 7));

  select count(*), coalesce(sum(monto), 0) into pg_count, pg_sum
    from public.pagos
   where estado = 'completado'
     and (fecha_pago at time zone 'America/Santiago')::date = v_today;

  select count(*) into cl_count
    from public.clientes
   where date_trunc('month', created_at) = date_trunc('month', now());

  select count(*) into fb_venc_count
    from public.fb_compromisos
   where estado not in ('cumplido', 'cancelado')
     and fecha_vencimiento < v_today;

  -- Detalle de contratos por vencer (próximos 15 días) para WhatsApp n8n
  select coalesce(json_agg(row_to_json(x)), '[]'::json) into v_contratos
  from (
    select c.id, c.titulo, coalesce(cl.nombre, cl.empresa, 'Cliente') as cliente_nombre, c.fecha_fin
      from public.contratos c
      left join public.clientes cl on cl.id = c.cliente_id
     where c.estado = 'activo'
       and c.fecha_fin between v_today and (v_today + 15)
     order by c.fecha_fin asc
     limit 10
  ) x;

  -- Detalle de facturas vencidas o pendientes de cobro para WhatsApp n8n
  select coalesce(json_agg(row_to_json(x)), '[]'::json) into v_facturas
  from (
    select f.id, f.numero, coalesce(cl.nombre, cl.empresa, 'Cliente') as cliente_nombre, f.total as monto_total, f.estado, f.fecha_vencimiento
      from public.facturas f
      left join public.clientes cl on cl.id = f.cliente_id
     where f.estado in ('enviada', 'vencida')
       and (f.fecha_vencimiento is null or f.fecha_vencimiento::date <= v_today)
     order by f.fecha_vencimiento asc nulls last
     limit 10
  ) x;

  -- Detalle de tareas urgentes (P0/P1), bloqueadas, rompelíneas o vencidas en public.tasks para WhatsApp n8n
  select coalesce(json_agg(row_to_json(x)), '[]'::json) into v_tareas
  from (
    select tk.id,
           tk.title as titulo,
           tk.priority as prioridad,
           tk.status as estado,
           tk.project as proyecto,
           tk.deadline as fecha_vencimiento,
           tk.is_breaker as es_rompelinea,
           coalesce(tm.name, tk.assignee, 'Sin asignar') as responsable,
           coalesce(tm.phone, '') as telefono_responsable
      from public.tasks tk
      left join public.team_members tm on tm.id = tk.assignee
     where tk.status not in ('Terminada', 'Cancelada')
       and (
         (tk.deadline is not null and tk.deadline <= v_today)
         or tk.priority in ('P0', 'P1')
         or tk.status = 'Bloqueada'
         or tk.is_breaker = true
       )
     order by
       case tk.priority when 'P0' then 1 when 'P1' then 2 when 'P2' then 3 else 4 end,
       tk.deadline asc nulls last
     limit 15
  ) x;

  -- Detalle de presupuestos pendientes para WhatsApp n8n
  select coalesce(json_agg(row_to_json(x)), '[]'::json) into v_presupuestos
  from (
    select p.id, p.numero, p.titulo, p.total, p.moneda, p.token, p.fecha_vencimiento,
           coalesce(cl.nombre, 'Cliente') as cliente_nombre,
           coalesce(cl.telefono, '') as cliente_telefono
      from public.presupuestos p
      left join public.clientes cl on cl.id = p.cliente_id
     where p.estado = 'pendiente'
     order by p.created_at desc
     limit 10
  ) x;

  return json_build_object(
    'tareas_vencidas', t_count,
    'tareas_p0', t_p0_count,
    'tareas_bloqueadas', t_blocked_count,
    'rompelineas_activos', t_breaker_count,
    'compromisos_fb_vencidos', fb_venc_count,
    'contratos_proximos', c_count,
    'facturas', f_count,
    'presupuestos_vencer', p_count,
    'pagos_hoy', pg_count,
    'total_hoy', pg_sum,
    'clientes_mes', cl_count,
    'contratos_por_vencer', v_contratos,
    'facturas_vencidas', v_facturas,
    'tareas_urgentes_vencidas', v_tareas,
    'presupuestos_pendientes', v_presupuestos
  );
end;
$$;

grant execute on function public.get_crm_alerts() to anon, authenticated, service_role;

-- 5. RPC para Recordatorio WhatsApp de Presupuestos Pendientes desde n8n
create or replace function public.get_pending_budgets_whatsapp()
returns json
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select coalesce(json_agg(row_to_json(x)), '[]'::json)
  from (
    select p.id,
           p.numero,
           p.titulo,
           p.total,
           p.moneda,
           p.token,
           p.estado,
           p.fecha_vencimiento,
           p.created_at,
           cl.nombre as cliente_nombre,
           cl.empresa as cliente_empresa,
           cl.telefono as cliente_telefono,
           cl.email as cliente_email
      from public.presupuestos p
      join public.clientes cl on cl.id = p.cliente_id
     where p.estado = 'pendiente'
       and cl.telefono is not null
       and length(regexp_replace(cl.telefono, '\D', '', 'g')) >= 8
     order by p.created_at desc
  ) x;
$$;

grant execute on function public.get_pending_budgets_whatsapp() to anon, authenticated, service_role;
