-- Add costo_hora column to estimaciones table
ALTER TABLE public.estimaciones 
ADD COLUMN costo_hora numeric;

-- Comment for documentation
COMMENT ON COLUMN public.estimaciones.costo_hora IS 'Hourly rate used for this estimation version';
