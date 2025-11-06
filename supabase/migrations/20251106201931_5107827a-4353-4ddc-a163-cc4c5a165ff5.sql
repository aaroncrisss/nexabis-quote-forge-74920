-- Agregar campo de notas de trabajo al presupuesto
ALTER TABLE public.presupuestos
ADD COLUMN notas_trabajo TEXT;

COMMENT ON COLUMN public.presupuestos.notas_trabajo IS 'Descripción detallada del trabajo a realizar';