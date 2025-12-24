-- Add proyecto_id column to presupuestos table
ALTER TABLE public.presupuestos 
ADD COLUMN proyecto_id uuid REFERENCES public.proyectos(id);

-- Create index for better performance
CREATE INDEX idx_presupuestos_proyecto_id ON public.presupuestos(proyecto_id);
