-- Create proyectos table
create table public.proyectos (
  id uuid not null default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id),
  cliente_id uuid references public.clientes(id),
  nombre text not null,
  descripcion text,
  tipo text not null,
  urgencia text,
  presupuesto_cliente numeric,
  estado text default 'borrador', -- 'borrador', 'activo', 'completado', 'archivado'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proyectos_pkey primary key (id)
);

-- Create estimaciones table (versions of the budget for a project)
create table public.estimaciones (
  id uuid not null default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  titulo text not null, -- e.g., "Presupuesto Completo", "MVP Ajustado"
  total_horas int not null,
  costo_total numeric not null,
  complejidad text,
  nivel_confianza text,
  riesgos jsonb, -- array of strings
  suposiciones jsonb, -- array of strings
  es_elegida boolean default false, -- flag for the selected estimation version
  created_at timestamptz not null default now(),
  constraint estimaciones_pkey primary key (id)
);

-- Create modulos_estimacion table (checklist items)
create table public.modulos_estimacion (
  id uuid not null default gen_random_uuid(),
  estimacion_id uuid not null references public.estimaciones(id) on delete cascade,
  nombre text not null,
  descripcion text,
  horas_estimadas int not null,
  prioridad int default 4, -- 1=Critical, 2=Essential, 3=Important, 4=Optional
  nivel_riesgo text,
  justificacion text,
  estado text default 'pendiente', -- 'pendiente', 'en_progreso', 'completado'
  es_excluido boolean default false, -- if excluded in this version
  created_at timestamptz not null default now(),
  constraint modulos_estimacion_pkey primary key (id)
);

-- Enable RLS
alter table public.proyectos enable row level security;
alter table public.estimaciones enable row level security;
alter table public.modulos_estimacion enable row level security;

-- Policies for proyectos
create policy "Users can view their own projets"
  on public.proyectos for select
  using (auth.uid() = usuario_id);

create policy "Users can insert their own projets"
  on public.proyectos for insert
  with check (auth.uid() = usuario_id);

create policy "Users can update their own projets"
  on public.proyectos for update
  using (auth.uid() = usuario_id);

create policy "Users can delete their own projets"
  on public.proyectos for delete
  using (auth.uid() = usuario_id);

-- Policies for estimaciones (via project ownership)
create policy "Users can view estimaciones of their projects"
  on public.estimaciones for select
  using (exists (select 1 from public.proyectos p where p.id = estimaciones.proyecto_id and p.usuario_id = auth.uid()));

create policy "Users can insert estimaciones to their projects"
  on public.estimaciones for insert
  with check (exists (select 1 from public.proyectos p where p.id = estimaciones.proyecto_id and p.usuario_id = auth.uid()));

create policy "Users can update estimaciones of their projects"
  on public.estimaciones for update
  using (exists (select 1 from public.proyectos p where p.id = estimaciones.proyecto_id and p.usuario_id = auth.uid()));

create policy "Users can delete estimaciones of their projects"
  on public.estimaciones for delete
  using (exists (select 1 from public.proyectos p where p.id = estimaciones.proyecto_id and p.usuario_id = auth.uid()));

-- Policies for modulos_estimacion (via estimation -> project ownership)
create policy "Users can view modules of their estimations"
  on public.modulos_estimacion for select
  using (exists (
    select 1 from public.estimaciones e
    join public.proyectos p on p.id = e.proyecto_id
    where e.id = modulos_estimacion.estimacion_id and p.usuario_id = auth.uid()
  ));

create policy "Users can insert modules to their estimations"
  on public.modulos_estimacion for insert
  with check (exists (
    select 1 from public.estimaciones e
    join public.proyectos p on p.id = e.proyecto_id
    where e.id = modulos_estimacion.estimacion_id and p.usuario_id = auth.uid()
  ));

create policy "Users can update modules of their estimations"
  on public.modulos_estimacion for update
  using (exists (
    select 1 from public.estimaciones e
    join public.proyectos p on p.id = e.proyecto_id
    where e.id = modulos_estimacion.estimacion_id and p.usuario_id = auth.uid()
  ));

create policy "Users can delete modules of their estimations"
  on public.modulos_estimacion for delete
  using (exists (
    select 1 from public.estimaciones e
    join public.proyectos p on p.id = e.proyecto_id
    where e.id = modulos_estimacion.estimacion_id and p.usuario_id = auth.uid()
  ));
