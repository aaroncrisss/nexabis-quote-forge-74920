-- Add rut column to clientes table
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS rut text;
