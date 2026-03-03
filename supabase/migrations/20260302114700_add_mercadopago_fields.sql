-- Modificaciones para soportar pagos parciales 50/50 con MercadoPago

ALTER TABLE public.presupuestos 
ADD COLUMN IF NOT EXISTS mp_pago_1_monto DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS mp_pago_1_id TEXT,
ADD COLUMN IF NOT EXISTS mp_pago_1_status TEXT CHECK (mp_pago_1_status IN ('pending', 'approved', 'rejected', 'in_process', 'cancelled', 'refunded', 'charged_back')),
ADD COLUMN IF NOT EXISTS mp_pago_1_fecha TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mp_pago_2_monto DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS mp_pago_2_id TEXT,
ADD COLUMN IF NOT EXISTS mp_pago_2_status TEXT CHECK (mp_pago_2_status IN ('pending', 'approved', 'rejected', 'in_process', 'cancelled', 'refunded', 'charged_back')),
ADD COLUMN IF NOT EXISTS mp_pago_2_fecha TIMESTAMP WITH TIME ZONE;
