-- Ensure trigger exists for auto-generating quote numbers
DROP TRIGGER IF EXISTS generate_quote_number_trigger ON public.presupuestos;

CREATE TRIGGER generate_quote_number_trigger
  BEFORE INSERT ON public.presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_quote_number();