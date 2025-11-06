-- Actualizar funciones existentes para agregar search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nombre, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    NEW.email
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_fecha_vencimiento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.fecha_vencimiento = NEW.fecha + (NEW.validez_dias || ' days')::INTERVAL;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  year_part TEXT;
  counter INTEGER;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SPLIT_PART(numero, '-', 3) AS INTEGER)), 0) + 1
  INTO counter
  FROM public.presupuestos
  WHERE usuario_id = NEW.usuario_id
  AND numero LIKE 'NEX-' || year_part || '-%';
  
  NEW.numero := 'NEX-' || year_part || '-' || LPAD(counter::TEXT, 4, '0');
  NEW.codigo_auto := NEW.numero;
  RETURN NEW;
END;
$function$;