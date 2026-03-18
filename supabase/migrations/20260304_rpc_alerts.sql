-- Migracion para crear el RPC de alertas
CREATE OR REPLACE FUNCTION public.get_crm_alerts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  t_count INT;
  c_count INT;
  f_count INT;
  p_count INT;
  pg_count INT;
  pg_sum DECIMAL;
  cl_count INT;
BEGIN
  SELECT count(*) INTO t_count FROM public.tareas WHERE estado IN ('to_do', 'in_progress', 'blocked') AND fecha_vencimiento < now();
  SELECT count(*) INTO c_count FROM public.contratos WHERE estado='activo' AND fecha_fin BETWEEN current_date AND current_date + interval '30 days';
  SELECT count(*) INTO f_count FROM public.facturas WHERE estado IN ('borrador', 'enviada');
  SELECT count(*) INTO p_count FROM public.presupuestos WHERE estado='pendiente' AND fecha_vencimiento BETWEEN current_date AND current_date + interval '3 days';
  SELECT count(*), COALESCE(sum(monto), 0) INTO pg_count, pg_sum FROM public.pagos WHERE estado='completado' AND date(fecha_pago) = current_date;
  SELECT count(*) INTO cl_count FROM public.clientes WHERE date_trunc('month', created_at) = date_trunc('month', current_date);

  RETURN json_build_object(
    'tareas_vencidas', t_count,
    'contratos_proximos', c_count,
    'facturas', f_count,
    'presupuestos_vencer', p_count,
    'pagos_hoy', pg_count,
    'total_hoy', pg_sum,
    'clientes_mes', cl_count
  );
END;
$$;
