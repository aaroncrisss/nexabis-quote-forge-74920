-- ====================================================================
-- Migración 20261029_08: Robustez en notas personales y borrado de clientes
-- ====================================================================

-- 1. Permitir notas personales sin cliente vinculado en /espacio
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'notas_cliente' 
      AND column_name = 'cliente_id' 
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.notas_cliente ALTER COLUMN cliente_id DROP NOT NULL;
  END IF;
END $$;

-- 2. Asegurar que eliminar un cliente no rompa proyectos asociados
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'proyectos_cliente_id_fkey') THEN
    ALTER TABLE public.proyectos DROP CONSTRAINT proyectos_cliente_id_fkey;
    ALTER TABLE public.proyectos 
      ADD CONSTRAINT proyectos_cliente_id_fkey 
      FOREIGN KEY (cliente_id) 
      REFERENCES public.clientes(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Asegurar que eliminar un cliente no rompa presupuestos asociados
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'presupuestos_cliente_id_fkey') THEN
    ALTER TABLE public.presupuestos DROP CONSTRAINT presupuestos_cliente_id_fkey;
    ALTER TABLE public.presupuestos 
      ADD CONSTRAINT presupuestos_cliente_id_fkey 
      FOREIGN KEY (cliente_id) 
      REFERENCES public.clientes(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Asegurar que eliminar un cliente no rompa facturas asociadas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'facturas_cliente_id_fkey') THEN
    ALTER TABLE public.facturas DROP CONSTRAINT facturas_cliente_id_fkey;
    ALTER TABLE public.facturas 
      ADD CONSTRAINT facturas_cliente_id_fkey 
      FOREIGN KEY (cliente_id) 
      REFERENCES public.clientes(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Asegurar que eliminar un cliente no rompa pagos asociados
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pagos_cliente_id_fkey') THEN
    ALTER TABLE public.pagos DROP CONSTRAINT pagos_cliente_id_fkey;
    ALTER TABLE public.pagos 
      ADD CONSTRAINT pagos_cliente_id_fkey 
      FOREIGN KEY (cliente_id) 
      REFERENCES public.clientes(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 6. Asegurar que eliminar un cliente no rompa contratos asociados
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contratos_cliente_id_fkey') THEN
    ALTER TABLE public.contratos DROP CONSTRAINT contratos_cliente_id_fkey;
    ALTER TABLE public.contratos 
      ADD CONSTRAINT contratos_cliente_id_fkey 
      FOREIGN KEY (cliente_id) 
      REFERENCES public.clientes(id) 
      ON DELETE SET NULL;
  END IF;
END $$;
