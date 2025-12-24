-- Function to handle budget status changes
CREATE OR REPLACE FUNCTION public.handle_budget_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If the budget is rejected
  IF OLD.estado <> 'rechazado' AND NEW.estado = 'rechazado' THEN
    -- If there is a linked project, update its status to 'cancelado' (or 'archivado' if you prefer)
    -- We'll check if project is currently active or draft
    UPDATE public.proyectos
    SET estado = 'cancelado',
        updated_at = now()
    WHERE id = NEW.proyecto_id;
  END IF;

  -- If the budget is approved
  IF OLD.estado <> 'aprobado' AND NEW.estado = 'aprobado' THEN
    -- Make the project active if it was draft
    UPDATE public.proyectos
    SET estado = 'activo',
        updated_at = now()
    WHERE id = NEW.proyecto_id
    AND estado = 'borrador';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger creation
CREATE TRIGGER on_budget_status_update
  AFTER UPDATE OF estado ON public.presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_budget_status_change();
