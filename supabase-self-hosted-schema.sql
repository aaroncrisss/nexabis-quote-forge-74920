-- =====================================================
-- NEXABIS - Schema Completo para Supabase Self-Hosted
-- =====================================================
-- Este script contiene todas las tablas, funciones,
-- triggers y políticas RLS necesarias para la aplicación
-- =====================================================

-- =====================================================
-- 1. EXTENSIONES
-- =====================================================

-- Asegurarse de que las extensiones necesarias estén habilitadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. ENUMS
-- =====================================================

-- Enum para roles de usuario
CREATE TYPE public.app_role AS ENUM ('admin', 'usuario');

-- =====================================================
-- 3. TABLAS
-- =====================================================

-- Tabla: profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  email text NOT NULL,
  rut text,
  nombre_empresa text,
  logo_url text,
  direccion text,
  telefono text,
  plantilla_tyc text DEFAULT 'Los presupuestos son válidos por el tiempo especificado. Se requiere anticipo del 50% para comenzar el proyecto.',
  moneda_predeterminada text DEFAULT 'CLP',
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Tabla: usuarios_permitidos
CREATE TABLE public.usuarios_permitidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  activo boolean DEFAULT true,
  invitado_por uuid REFERENCES auth.users(id),
  fecha_invitacion timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Tabla: clientes
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text,
  empresa text,
  direccion text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: presupuestos
CREATE TABLE public.presupuestos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero text NOT NULL,
  codigo_auto text,
  titulo text NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  validez_dias integer NOT NULL DEFAULT 15,
  fecha_vencimiento date,
  subtotal numeric NOT NULL DEFAULT 0,
  descuento_tipo text,
  descuento_valor numeric DEFAULT 0,
  descuento_total numeric DEFAULT 0,
  iva_porcentaje numeric DEFAULT 19,
  iva_monto numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  moneda text NOT NULL DEFAULT 'CLP',
  estado text NOT NULL DEFAULT 'pendiente',
  forma_pago text,
  terminos text,
  notas_trabajo text,
  promocion_aplicada text,
  comentarios_cliente text,
  token text NOT NULL DEFAULT gen_random_uuid()::text,
  modo_impresion text DEFAULT 'dark',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: items_presupuesto
CREATE TABLE public.items_presupuesto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  cantidad numeric NOT NULL DEFAULT 1,
  precio_unitario numeric NOT NULL,
  total numeric NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabla: promociones
CREATE TABLE public.promociones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  descuento_porcentaje numeric NOT NULL,
  monto_minimo numeric NOT NULL,
  fecha_inicio date,
  fecha_fin date,
  activa boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla: notificaciones
CREATE TABLE public.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  mensaje text NOT NULL,
  visto boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 4. FUNCIONES AUXILIARES
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Función para calcular fecha de vencimiento
CREATE OR REPLACE FUNCTION public.calculate_fecha_vencimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.fecha_vencimiento = NEW.fecha + (NEW.validez_dias || ' days')::INTERVAL;
  RETURN NEW;
END;
$$;

-- Función para generar número de presupuesto
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  year_part TEXT;
  counter INTEGER;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SPLIT_PART(numero, '-', 3) AS INTEGER)), 0) + 1
  INTO counter
  FROM public.presupuestos
  WHERE usuario_id = NEW.usuario_id
  AND numero LIKE 'NEX-' || year_part || '-%';
  
  NEW.numero := 'NEX-' || year_part || '-' || LPAD(counter::TEXT, 4, '0');
  NEW.codigo_auto := NEW.numero;
  RETURN NEW;
END;
$$;

-- Función para verificar si un email está permitido
CREATE OR REPLACE FUNCTION public.email_permitido(email_check text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_permitidos
    WHERE email = email_check
      AND activo = TRUE
  )
$$;

-- Función para verificar si un usuario tiene un rol específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Función para verificar acceso por token
CREATE OR REPLACE FUNCTION public.can_view_presupuesto_by_token(presupuesto_id uuid, provided_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.presupuestos
    WHERE id = presupuesto_id
      AND token = provided_token
  )
$$;

-- Función para crear perfil al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Trigger: Actualizar updated_at en profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Actualizar updated_at en clientes
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Actualizar updated_at en presupuestos
CREATE TRIGGER update_presupuestos_updated_at
  BEFORE UPDATE ON public.presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Actualizar updated_at en promociones
CREATE TRIGGER update_promociones_updated_at
  BEFORE UPDATE ON public.promociones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Calcular fecha de vencimiento en presupuestos
CREATE TRIGGER calculate_presupuesto_vencimiento
  BEFORE INSERT OR UPDATE ON public.presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_fecha_vencimiento();

-- Trigger: Generar número de presupuesto
CREATE TRIGGER generate_presupuesto_number
  BEFORE INSERT ON public.presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_quote_number();

-- Trigger: Crear perfil al registrar usuario nuevo
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_permitidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Políticas RLS: profiles
-- =====================================================

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Public can view profiles via presupuesto"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.presupuestos
    WHERE presupuestos.usuario_id = profiles.id
  ));

-- =====================================================
-- Políticas RLS: user_roles
-- =====================================================

CREATE POLICY "Usuarios pueden ver su propio rol"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden asignar roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden actualizar roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden eliminar roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- Políticas RLS: usuarios_permitidos
-- =====================================================

CREATE POLICY "Solo admins pueden ver usuarios permitidos"
  ON public.usuarios_permitidos FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden agregar usuarios permitidos"
  ON public.usuarios_permitidos FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden actualizar usuarios permitidos"
  ON public.usuarios_permitidos FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden eliminar usuarios permitidos"
  ON public.usuarios_permitidos FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- Políticas RLS: clientes
-- =====================================================

CREATE POLICY "Users can view own clients"
  ON public.clientes FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create own clients"
  ON public.clientes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own clients"
  ON public.clientes FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own clients"
  ON public.clientes FOR DELETE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Public can view clientes via presupuesto"
  ON public.clientes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.presupuestos
    WHERE presupuestos.cliente_id = clientes.id
  ));

-- =====================================================
-- Políticas RLS: presupuestos
-- =====================================================

CREATE POLICY "Users can view own presupuestos"
  ON public.presupuestos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create own presupuestos"
  ON public.presupuestos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own presupuestos"
  ON public.presupuestos FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own presupuestos"
  ON public.presupuestos FOR DELETE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Public can view presupuesto by valid token"
  ON public.presupuestos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Anonymous can view presupuesto by token check"
  ON public.presupuestos FOR SELECT
  USING (true);

-- =====================================================
-- Políticas RLS: items_presupuesto
-- =====================================================

CREATE POLICY "Users can view items of own presupuestos"
  ON public.items_presupuesto FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.presupuestos
    WHERE presupuestos.id = items_presupuesto.presupuesto_id
      AND presupuestos.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can view items of accessible presupuestos"
  ON public.items_presupuesto FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.presupuestos
    WHERE presupuestos.id = items_presupuesto.presupuesto_id
      AND (presupuestos.usuario_id = auth.uid() OR auth.uid() IS NULL)
  ));

CREATE POLICY "Users can create items for own presupuestos"
  ON public.items_presupuesto FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.presupuestos
    WHERE presupuestos.id = items_presupuesto.presupuesto_id
      AND presupuestos.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can update items of own presupuestos"
  ON public.items_presupuesto FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.presupuestos
    WHERE presupuestos.id = items_presupuesto.presupuesto_id
      AND presupuestos.usuario_id = auth.uid()
  ));

CREATE POLICY "Users can delete items of own presupuestos"
  ON public.items_presupuesto FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.presupuestos
    WHERE presupuestos.id = items_presupuesto.presupuesto_id
      AND presupuestos.usuario_id = auth.uid()
  ));

-- =====================================================
-- Políticas RLS: promociones
-- =====================================================

CREATE POLICY "Todos pueden ver promociones activas"
  ON public.promociones FOR SELECT
  USING (activa = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden gestionar promociones"
  ON public.promociones FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- Políticas RLS: notificaciones
-- =====================================================

CREATE POLICY "Users can view own notifications"
  ON public.notificaciones FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can update own notifications"
  ON public.notificaciones FOR UPDATE
  USING (auth.uid() = usuario_id);

-- =====================================================
-- 7. STORAGE BUCKETS
-- =====================================================

-- Crear bucket para logos (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para logos
CREATE POLICY "Public can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update own logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete own logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos'
    AND auth.uid() IS NOT NULL
  );

-- =====================================================
-- 8. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_clientes_usuario_id ON public.clientes(usuario_id);
CREATE INDEX idx_clientes_email ON public.clientes(email);
CREATE INDEX idx_presupuestos_usuario_id ON public.presupuestos(usuario_id);
CREATE INDEX idx_presupuestos_cliente_id ON public.presupuestos(cliente_id);
CREATE INDEX idx_presupuestos_token ON public.presupuestos(token);
CREATE INDEX idx_presupuestos_numero ON public.presupuestos(numero);
CREATE INDEX idx_presupuestos_estado ON public.presupuestos(estado);
CREATE INDEX idx_items_presupuesto_presupuesto_id ON public.items_presupuesto(presupuesto_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_notificaciones_usuario_id ON public.notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_visto ON public.notificaciones(visto);

-- =====================================================
-- 9. DATOS INICIALES (OPCIONAL)
-- =====================================================

-- Puedes insertar aquí datos iniciales como promociones por defecto
-- INSERT INTO public.promociones (nombre, descripcion, descuento_porcentaje, monto_minimo)
-- VALUES ('Promoción de Lanzamiento', 'Descuento especial', 10, 100000);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Para crear un usuario admin inicial, después de registrar un usuario:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('[UUID_DEL_USUARIO]', 'admin');
