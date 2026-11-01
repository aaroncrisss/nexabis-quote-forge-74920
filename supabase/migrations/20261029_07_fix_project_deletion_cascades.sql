-- Fix foreign key constraint on presupuestos to allow deleting projects cleanly
ALTER TABLE public.presupuestos
  DROP CONSTRAINT IF EXISTS presupuestos_proyecto_id_fkey,
  ADD CONSTRAINT presupuestos_proyecto_id_fkey
    FOREIGN KEY (proyecto_id)
    REFERENCES public.proyectos(id)
    ON DELETE SET NULL;
