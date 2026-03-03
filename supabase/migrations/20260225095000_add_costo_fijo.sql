ALTER TABLE modulos_estimacion ADD COLUMN IF NOT EXISTS costo_fijo NUMERIC DEFAULT 0;

-- Recargar la caché del esquema de PostgREST para que reconozca la nueva columna de inmediato
NOTIFY pgrst, reload_schema;
