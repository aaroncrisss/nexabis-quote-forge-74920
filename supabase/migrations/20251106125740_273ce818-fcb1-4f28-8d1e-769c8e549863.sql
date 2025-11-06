-- Crear enum para roles de usuario
CREATE TYPE public.app_role AS ENUM ('admin', 'usuario');

-- Tabla de roles de usuario (primero, sin políticas)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función para verificar roles (SECURITY DEFINER para evitar recursión)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Ahora sí, políticas para user_roles
CREATE POLICY "Usuarios pueden ver su propio rol"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden asignar roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden actualizar roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden eliminar roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tabla de usuarios permitidos
CREATE TABLE public.usuarios_permitidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  fecha_invitacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activo BOOLEAN DEFAULT TRUE,
  invitado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.usuarios_permitidos ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios_permitidos
CREATE POLICY "Solo admins pueden ver usuarios permitidos"
  ON public.usuarios_permitidos FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden agregar usuarios permitidos"
  ON public.usuarios_permitidos FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden actualizar usuarios permitidos"
  ON public.usuarios_permitidos FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden eliminar usuarios permitidos"
  ON public.usuarios_permitidos FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tabla de promociones
CREATE TABLE public.promociones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  descuento_porcentaje NUMERIC NOT NULL,
  monto_minimo NUMERIC NOT NULL,
  activa BOOLEAN DEFAULT TRUE,
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;

-- Políticas para promociones
CREATE POLICY "Todos pueden ver promociones activas"
  ON public.promociones FOR SELECT
  TO authenticated
  USING (activa = TRUE OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden gestionar promociones"
  ON public.promociones FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Agregar campos nuevos a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- Agregar campos nuevos a presupuestos
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS iva_porcentaje NUMERIC DEFAULT 19;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS iva_monto NUMERIC DEFAULT 0;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS modo_impresion TEXT DEFAULT 'dark';
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS promocion_aplicada TEXT;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS codigo_auto TEXT;

-- Trigger para actualizar updated_at en promociones
CREATE TRIGGER update_promociones_updated_at
  BEFORE UPDATE ON public.promociones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para validar email permitido (pública para registro)
CREATE OR REPLACE FUNCTION public.email_permitido(email_check TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_permitidos
    WHERE email = email_check
      AND activo = TRUE
  )
$$;