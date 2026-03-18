-- Agregar la columna opcional a tareas para rastrear si pertenecen a un modulo especifico
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS modulo_id UUID REFERENCES public.modulos_estimacion(id) ON DELETE SET NULL;

-- 1. Trigger para actualizar el estado del módulo cuando la tarea Kanban (hija) cambie
CREATE OR REPLACE FUNCTION public.sync_task_to_modulo()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la tarea esta vinculada a un modulo y el estado cambió
    IF NEW.modulo_id IS NOT NULL AND NEW.estado IS DISTINCT FROM OLD.estado THEN
        
        -- Si la tarea se mueve a 'done', completamos el modulo
        IF NEW.estado = 'done' THEN
            UPDATE public.modulos_estimacion SET estado = 'completado' WHERE id = NEW.modulo_id;
        -- Si la tarea pasa de 'done' a cualquier otro estado (ej to_do), devolvemos el modulo a pendiente
        ELSIF OLD.estado = 'done' AND NEW.estado != 'done' THEN
            UPDATE public.modulos_estimacion SET estado = 'pendiente' WHERE id = NEW.modulo_id;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe para recrearlo seguro
DROP TRIGGER IF EXISTS tr_sync_task_status ON public.tareas;
CREATE TRIGGER tr_sync_task_status
AFTER UPDATE OF estado ON public.tareas
FOR EACH ROW
EXECUTE FUNCTION public.sync_task_to_modulo();

-- 2. Trigger inverso: Si alguien marca el checkbox de modulo en ProyectoDetalle.tsx a "completado",
-- mueve la tarea clonada en el Kanban a "done" para que no quede huerfana en el carril "to_do"
CREATE OR REPLACE FUNCTION public.sync_modulo_to_task()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estado del modulo cambió
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        
        IF NEW.estado = 'completado' THEN
            -- Buscamos si existe una tarea ligada y la pasamos a done
            UPDATE public.tareas SET estado = 'done', fecha_completada = NOW() WHERE modulo_id = NEW.id;
        ELSIF NEW.estado = 'pendiente' THEN
            -- Si lo des-marcaron por error, lo pasamos a In Progress o To_do
            UPDATE public.tareas SET estado = 'in_progress', fecha_completada = NULL WHERE modulo_id = NEW.id AND estado = 'done';
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_modulo_status ON public.modulos_estimacion;
CREATE TRIGGER tr_sync_modulo_status
AFTER UPDATE OF estado ON public.modulos_estimacion
FOR EACH ROW
EXECUTE FUNCTION public.sync_modulo_to_task();

-- NOTA IMPORTANTE PARA EL USER:
-- Para la creación automatica inicial (Crear tarjeta Kanban cuando se crea un módulo):
-- Actualmente los modulos se crean en bulk al generar estimaciones, muchas veces como 'borradores'.
-- No es recomendable llenar tu Kanban de tareas basura por modulos que quizás el cliente rechace (presupuesto rechazado).
-- Si quieres que esto pase en el futuro de forma automatica al pasar un proyecto a 'Activo', 
-- podemos añadir un boton "Generar Tareas del Tablero" en ProyectoDetalle.tsx.
-- Por ahora, dejemos esta sincronización bidireccional limpia y escalable.
