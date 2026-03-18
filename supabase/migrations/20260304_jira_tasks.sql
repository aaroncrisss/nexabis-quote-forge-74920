-- Migración para el tablero Jira-like de Tareas
-- Transforma los estados antiguos al nuevo estándar del Kanban

-- 1. Mover "pendiente" a "to_do"
UPDATE public.tareas 
SET estado = 'to_do' 
WHERE estado = 'pendiente';

-- 2. Mover "completada" a "done"
UPDATE public.tareas 
SET estado = 'done' 
WHERE estado = 'completada';
