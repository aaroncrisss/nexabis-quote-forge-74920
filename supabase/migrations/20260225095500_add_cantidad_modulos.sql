ALTER TABLE modulos_estimacion ADD COLUMN IF NOT EXISTS cantidad NUMERIC DEFAULT 1;

-- Recargar la caché del esquema de PostgREST
NOTIFY pgrst, reload_schema;
