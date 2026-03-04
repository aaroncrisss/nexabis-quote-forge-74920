-- =====================================================
-- NEXABIS CRM — Migración de Transformación CRM
-- Fecha: 2026-03-04
-- =====================================================
-- Este script agrega todas las tablas necesarias para
-- convertir la app de presupuestos en un CRM completo
-- =====================================================

-- =====================================================
-- 1. NUEVOS CAMPOS EN CLIENTES
-- =====================================================

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS industria TEXT,
  ADD COLUMN IF NOT EXISTS fuente TEXT DEFAULT 'directo',
  ADD COLUMN IF NOT EXISTS etapa_ciclo TEXT DEFAULT 'lead',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS notas TEXT,
  ADD COLUMN IF NOT EXISTS sitio_web TEXT,
  ADD COLUMN IF NOT EXISTS valor_total DECIMAL(12,2) DEFAULT 0;

-- =====================================================
-- 2. TABLA: pagos
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE SET NULL,
  factura_id uuid, -- FK added after facturas table creation
  monto DECIMAL(12,2) NOT NULL,
  moneda TEXT DEFAULT 'CLP',
  metodo_pago TEXT NOT NULL DEFAULT 'transferencia',
  referencia TEXT,
  mp_payment_id TEXT,
  estado TEXT DEFAULT 'completado',
  fecha_pago TIMESTAMPTZ DEFAULT now(),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. TABLA: facturas
-- =====================================================

CREATE TABLE IF NOT EXISTS public.facturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  titulo TEXT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  iva_porcentaje DECIMAL(5,2) DEFAULT 19,
  iva_monto DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  moneda TEXT DEFAULT 'CLP',
  estado TEXT DEFAULT 'borrador',
  fecha_emision DATE DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. TABLA: items_factura
-- =====================================================

CREATE TABLE IF NOT EXISTS public.items_factura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id uuid NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(10,2) DEFAULT 1,
  precio_unitario DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK from pagos to facturas now that facturas exists
ALTER TABLE public.pagos
  ADD CONSTRAINT fk_pagos_factura
  FOREIGN KEY (factura_id) REFERENCES public.facturas(id) ON DELETE SET NULL;

-- =====================================================
-- 5. TABLA: pipeline_etapas
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pipeline_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  color TEXT DEFAULT '#8b5cf6',
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. TABLA: oportunidades (deals)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.oportunidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  etapa_id uuid NOT NULL REFERENCES public.pipeline_etapas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  valor DECIMAL(12,2) DEFAULT 0,
  moneda TEXT DEFAULT 'CLP',
  probabilidad INT DEFAULT 50,
  fecha_cierre_esperada DATE,
  notas TEXT,
  estado TEXT DEFAULT 'abierta',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. TABLA: tareas
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  oportunidad_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT DEFAULT 'tarea',
  prioridad TEXT DEFAULT 'media',
  estado TEXT DEFAULT 'pendiente',
  fecha_vencimiento TIMESTAMPTZ,
  fecha_completada TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 8. TABLA: notas_cliente
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notas_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  tipo TEXT DEFAULT 'nota',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 9. TABLA: documentos
-- =====================================================

CREATE TABLE IF NOT EXISTS public.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo_mime TEXT,
  tamano_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 10. TABLAS: etiquetas + cliente_etiquetas
-- =====================================================

CREATE TABLE IF NOT EXISTS public.etiquetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(usuario_id, nombre)
);

CREATE TABLE IF NOT EXISTS public.cliente_etiquetas (
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  etiqueta_id uuid NOT NULL REFERENCES public.etiquetas(id) ON DELETE CASCADE,
  PRIMARY KEY (cliente_id, etiqueta_id)
);

-- =====================================================
-- 11. TABLA: contratos
-- =====================================================

CREATE TABLE IF NOT EXISTS public.contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  valor DECIMAL(12,2),
  moneda TEXT DEFAULT 'CLP',
  estado TEXT DEFAULT 'borrador',
  fecha_inicio DATE,
  fecha_fin DATE,
  renovacion_auto BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 12. TRIGGERS updated_at
-- =====================================================

CREATE TRIGGER update_pagos_updated_at
  BEFORE UPDATE ON public.pagos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facturas_updated_at
  BEFORE UPDATE ON public.facturas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oportunidades_updated_at
  BEFORE UPDATE ON public.oportunidades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tareas_updated_at
  BEFORE UPDATE ON public.tareas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 13. FUNCIÓN: Generar número de factura
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
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
  FROM public.facturas
  WHERE usuario_id = NEW.usuario_id
  AND numero LIKE 'FAC-' || year_part || '-%';
  
  NEW.numero := 'FAC-' || year_part || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_factura_number
  BEFORE INSERT ON public.facturas
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invoice_number();

-- =====================================================
-- 14. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_factura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

-- Policies: pagos
CREATE POLICY "Users can view own pagos" ON public.pagos FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can create own pagos" ON public.pagos FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own pagos" ON public.pagos FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own pagos" ON public.pagos FOR DELETE USING (auth.uid() = usuario_id);

-- Policies: facturas
CREATE POLICY "Users can view own facturas" ON public.facturas FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can create own facturas" ON public.facturas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own facturas" ON public.facturas FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own facturas" ON public.facturas FOR DELETE USING (auth.uid() = usuario_id);

-- Policies: items_factura
CREATE POLICY "Users can view items of own facturas" ON public.items_factura FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.facturas WHERE facturas.id = items_factura.factura_id AND facturas.usuario_id = auth.uid()));
CREATE POLICY "Users can create items for own facturas" ON public.items_factura FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.facturas WHERE facturas.id = items_factura.factura_id AND facturas.usuario_id = auth.uid()));
CREATE POLICY "Users can update items of own facturas" ON public.items_factura FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.facturas WHERE facturas.id = items_factura.factura_id AND facturas.usuario_id = auth.uid()));
CREATE POLICY "Users can delete items of own facturas" ON public.items_factura FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.facturas WHERE facturas.id = items_factura.factura_id AND facturas.usuario_id = auth.uid()));

-- Policies: pipeline_etapas
CREATE POLICY "Users can view own pipeline_etapas" ON public.pipeline_etapas FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can create own pipeline_etapas" ON public.pipeline_etapas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own pipeline_etapas" ON public.pipeline_etapas FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own pipeline_etapas" ON public.pipeline_etapas FOR DELETE USING (auth.uid() = usuario_id);

-- Policies: oportunidades
CREATE POLICY "Users can view own oportunidades" ON public.oportunidades FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can create own oportunidades" ON public.oportunidades FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own oportunidades" ON public.oportunidades FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own oportunidades" ON public.oportunidades FOR DELETE USING (auth.uid() = usuario_id);

-- Policies: tareas
CREATE POLICY "Users can view own tareas" ON public.tareas FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can create own tareas" ON public.tareas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own tareas" ON public.tareas FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own tareas" ON public.tareas FOR DELETE USING (auth.uid() = usuario_id);

-- Policies: notas_cliente
CREATE POLICY "Users can view own notas_cliente" ON public.notas_cliente FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can create own notas_cliente" ON public.notas_cliente FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own notas_cliente" ON public.notas_cliente FOR DELETE USING (auth.uid() = usuario_id);

-- Policies: documentos
CREATE POLICY "Users can view own documentos" ON public.documentos FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can create own documentos" ON public.documentos FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own documentos" ON public.documentos FOR DELETE USING (auth.uid() = usuario_id);

-- Policies: etiquetas
CREATE POLICY "Users can view own etiquetas" ON public.etiquetas FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can create own etiquetas" ON public.etiquetas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own etiquetas" ON public.etiquetas FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own etiquetas" ON public.etiquetas FOR DELETE USING (auth.uid() = usuario_id);

-- Policies: cliente_etiquetas
CREATE POLICY "Users can view own cliente_etiquetas" ON public.cliente_etiquetas FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.clientes WHERE clientes.id = cliente_etiquetas.cliente_id AND clientes.usuario_id = auth.uid()));
CREATE POLICY "Users can create own cliente_etiquetas" ON public.cliente_etiquetas FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.clientes WHERE clientes.id = cliente_etiquetas.cliente_id AND clientes.usuario_id = auth.uid()));
CREATE POLICY "Users can delete own cliente_etiquetas" ON public.cliente_etiquetas FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.clientes WHERE clientes.id = cliente_etiquetas.cliente_id AND clientes.usuario_id = auth.uid()));

-- Policies: contratos
CREATE POLICY "Users can view own contratos" ON public.contratos FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can create own contratos" ON public.contratos FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own contratos" ON public.contratos FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own contratos" ON public.contratos FOR DELETE USING (auth.uid() = usuario_id);

-- =====================================================
-- 15. ÍNDICES DE PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pagos_usuario_id ON public.pagos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cliente_id ON public.pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON public.pagos(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON public.pagos(estado);

CREATE INDEX IF NOT EXISTS idx_facturas_usuario_id ON public.facturas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente_id ON public.facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON public.facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_numero ON public.facturas(numero);

CREATE INDEX IF NOT EXISTS idx_items_factura_factura_id ON public.items_factura(factura_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_etapas_usuario_id ON public.pipeline_etapas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_etapas_orden ON public.pipeline_etapas(orden);

CREATE INDEX IF NOT EXISTS idx_oportunidades_usuario_id ON public.oportunidades(usuario_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_cliente_id ON public.oportunidades(cliente_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_etapa_id ON public.oportunidades(etapa_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_estado ON public.oportunidades(estado);

CREATE INDEX IF NOT EXISTS idx_tareas_usuario_id ON public.tareas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tareas_cliente_id ON public.tareas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON public.tareas(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_fecha_vencimiento ON public.tareas(fecha_vencimiento);

CREATE INDEX IF NOT EXISTS idx_notas_cliente_cliente_id ON public.notas_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_cliente_id ON public.documentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_etiquetas_cliente ON public.cliente_etiquetas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_etiquetas_etiqueta ON public.cliente_etiquetas(etiqueta_id);

CREATE INDEX IF NOT EXISTS idx_contratos_usuario_id ON public.contratos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente_id ON public.contratos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_estado ON public.contratos(estado);

CREATE INDEX IF NOT EXISTS idx_clientes_etapa_ciclo ON public.clientes(etapa_ciclo);
CREATE INDEX IF NOT EXISTS idx_clientes_fuente ON public.clientes(fuente);

-- =====================================================
-- 16. STORAGE BUCKET PARA DOCUMENTOS
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for documentos
CREATE POLICY "Authenticated users can upload documentos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own documentos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own documentos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

-- =====================================================
-- 17. DATOS INICIALES: Pipeline por defecto
-- =====================================================
-- Las etapas se crean per-user al primer acceso desde la app.
-- No se insertan datos aquí, se manejan en el frontend.

-- =====================================================
-- FIN DE MIGRACIÓN CRM
-- =====================================================
