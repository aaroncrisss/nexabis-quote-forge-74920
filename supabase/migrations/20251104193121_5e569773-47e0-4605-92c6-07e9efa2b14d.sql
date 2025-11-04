-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  nombre_empresa TEXT,
  logo_url TEXT,
  direccion TEXT,
  telefono TEXT,
  rut TEXT,
  plantilla_tyc TEXT DEFAULT 'Los presupuestos son válidos por el tiempo especificado. Se requiere anticipo del 50% para comenzar el proyecto.',
  moneda_predeterminada TEXT DEFAULT 'CLP' CHECK (moneda_predeterminada IN ('USD', 'CLP')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  empresa TEXT,
  email TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create presupuestos (quotes) table
CREATE TABLE public.presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  validez_dias INTEGER NOT NULL DEFAULT 15,
  fecha_vencimiento DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'vencido')),
  moneda TEXT NOT NULL DEFAULT 'CLP' CHECK (moneda IN ('USD', 'CLP')),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  descuento_tipo TEXT CHECK (descuento_tipo IN ('porcentaje', 'fijo')),
  descuento_valor DECIMAL(12, 2) DEFAULT 0,
  descuento_total DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  forma_pago TEXT,
  terminos TEXT,
  comentarios_cliente TEXT,
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create items_presupuesto table
CREATE TABLE public.items_presupuesto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(10, 2) NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notificaciones table
CREATE TABLE public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  presupuesto_id UUID REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('aprobado', 'rechazado', 'vencido', 'recordatorio')),
  mensaje TEXT NOT NULL,
  visto BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for clientes
CREATE POLICY "Users can view own clients" ON public.clientes
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can create own clients" ON public.clientes
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own clients" ON public.clientes
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own clients" ON public.clientes
  FOR DELETE USING (auth.uid() = usuario_id);

-- RLS Policies for presupuestos
CREATE POLICY "Users can view own presupuestos" ON public.presupuestos
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Anyone can view presupuesto by token" ON public.presupuestos
  FOR SELECT USING (true);

CREATE POLICY "Users can create own presupuestos" ON public.presupuestos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own presupuestos" ON public.presupuestos
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own presupuestos" ON public.presupuestos
  FOR DELETE USING (auth.uid() = usuario_id);

-- RLS Policies for items_presupuesto
CREATE POLICY "Users can view items of own presupuestos" ON public.items_presupuesto
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.presupuestos
      WHERE presupuestos.id = items_presupuesto.presupuesto_id
      AND presupuestos.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view items by presupuesto token" ON public.items_presupuesto
  FOR SELECT USING (true);

CREATE POLICY "Users can create items for own presupuestos" ON public.items_presupuesto
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.presupuestos
      WHERE presupuestos.id = items_presupuesto.presupuesto_id
      AND presupuestos.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items of own presupuestos" ON public.items_presupuesto
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.presupuestos
      WHERE presupuestos.id = items_presupuesto.presupuesto_id
      AND presupuestos.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items of own presupuestos" ON public.items_presupuesto
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.presupuestos
      WHERE presupuestos.id = items_presupuesto.presupuesto_id
      AND presupuestos.usuario_id = auth.uid()
    )
  );

-- RLS Policies for notificaciones
CREATE POLICY "Users can view own notifications" ON public.notificaciones
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can update own notifications" ON public.notificaciones
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_presupuestos_updated_at
  BEFORE UPDATE ON public.presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate fecha_vencimiento
CREATE OR REPLACE FUNCTION public.calculate_fecha_vencimiento()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_vencimiento = NEW.fecha + (NEW.validez_dias || ' days')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate expiration date
CREATE TRIGGER calculate_presupuesto_vencimiento
  BEFORE INSERT OR UPDATE OF fecha, validez_dias ON public.presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.calculate_fecha_vencimiento();

-- Function to generate sequential quote numbers
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  counter INTEGER;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SPLIT_PART(numero, '-', 2) AS INTEGER)), 0) + 1
  INTO counter
  FROM public.presupuestos
  WHERE usuario_id = NEW.usuario_id
  AND numero LIKE 'NX-' || year_part || '-%';
  
  NEW.numero := 'NX-' || year_part || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate quote number
CREATE TRIGGER generate_presupuesto_numero
  BEFORE INSERT ON public.presupuestos
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION public.generate_quote_number();

-- Create indexes for better performance
CREATE INDEX idx_presupuestos_usuario ON public.presupuestos(usuario_id);
CREATE INDEX idx_presupuestos_cliente ON public.presupuestos(cliente_id);
CREATE INDEX idx_presupuestos_token ON public.presupuestos(token);
CREATE INDEX idx_presupuestos_estado ON public.presupuestos(estado);
CREATE INDEX idx_clientes_usuario ON public.clientes(usuario_id);
CREATE INDEX idx_items_presupuesto ON public.items_presupuesto(presupuesto_id);
CREATE INDEX idx_notificaciones_usuario ON public.notificaciones(usuario_id);
