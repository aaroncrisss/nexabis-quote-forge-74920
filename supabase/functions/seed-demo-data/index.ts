import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Creating demo data for user:', user.id);

    // Crear 8 clientes demo
    const clientesDemo = [
      { nombre: 'María González', empresa: 'Tech Solutions SpA', email: 'maria@techsolutions.cl', telefono: '+56 9 1234 5678' },
      { nombre: 'Juan Pérez', empresa: 'Inversiones JLP', email: 'juan@jlp.cl', telefono: '+56 9 8765 4321' },
      { nombre: 'Carolina Silva', empresa: null, email: 'carolina.silva@email.com', telefono: '+56 9 5555 1234' },
      { nombre: 'Roberto Fuentes', empresa: 'Constructora RF', email: 'roberto@constructorarf.cl', telefono: '+56 9 9999 8888' },
      { nombre: 'Andrea Morales', empresa: 'AM Consulting', email: 'andrea@amconsulting.cl', telefono: '+56 9 7777 6666' },
      { nombre: 'Diego Ramírez', empresa: 'Digital Marketing DR', email: 'diego@dmdr.cl', telefono: '+56 9 3333 2222' },
      { nombre: 'Valentina Torres', empresa: null, email: 'valentina.torres@gmail.com', telefono: '+56 9 1111 9999' },
      { nombre: 'Sebastián Vega', empresa: 'Vega & Asociados', email: 'sebastian@vega.cl', telefono: '+56 9 4444 5555' },
    ];

    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .insert(clientesDemo.map(c => ({ ...c, usuario_id: user.id })))
      .select();

    if (clientesError) throw clientesError;

    console.log('Created clients:', clientes.length);

    // Crear presupuestos con datos de los últimos 6 meses
    const estados = ['pendiente', 'aprobado', 'rechazado', 'vencido'];
    const monedas = ['CLP', 'USD'];
    const presupuestos = [];

    for (let i = 0; i < 15; i++) {
      const cliente = clientes[Math.floor(Math.random() * clientes.length)];
      const mesAtras = Math.floor(Math.random() * 6);
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - mesAtras);

      const moneda = monedas[Math.floor(Math.random() * monedas.length)];
      const subtotal = Math.floor(Math.random() * 5000000) + 500000;
      const descuento = Math.random() > 0.7 ? Math.floor(subtotal * 0.1) : 0;
      const total = subtotal - descuento;

      presupuestos.push({
        usuario_id: user.id,
        cliente_id: cliente.id,
        titulo: [
          'Desarrollo Web Corporativo',
          'Diseño de Marca',
          'Consultoría Digital',
          'Sistema CRM Personalizado',
          'E-commerce Completo',
          'Marketing Digital',
          'Aplicación Móvil',
          'Rediseño de Sitio Web',
        ][Math.floor(Math.random() * 8)],
        fecha: fecha.toISOString().split('T')[0],
        validez_dias: 15,
        subtotal,
        descuento_valor: descuento > 0 ? 10 : 0,
        descuento_tipo: descuento > 0 ? 'porcentaje' : null,
        descuento_total: descuento,
        total,
        moneda,
        estado: estados[Math.floor(Math.random() * estados.length)],
        forma_pago: '50% anticipo, 50% contra entrega',
        terminos: 'Los presupuestos son válidos por el tiempo especificado.',
      });
    }

    const { data: presupuestosCreados, error: presupuestosError } = await supabase
      .from('presupuestos')
      .insert(presupuestos)
      .select();

    if (presupuestosError) throw presupuestosError;

    console.log('Created presupuestos:', presupuestosCreados.length);

    // Crear items para cada presupuesto
    const itemsDescripciones = [
      'Diseño de interfaz',
      'Desarrollo frontend',
      'Desarrollo backend',
      'Base de datos',
      'Integración de APIs',
      'Testing y QA',
      'Deploy y hosting',
      'Capacitación',
      'Soporte técnico',
      'Mantenimiento',
    ];

    for (const presupuesto of presupuestosCreados) {
      const numItems = Math.floor(Math.random() * 4) + 2; // 2-5 items
      const items = [];

      for (let i = 0; i < numItems; i++) {
        const cantidad = Math.floor(Math.random() * 10) + 1;
        const precioUnitario = Math.floor(Math.random() * 500000) + 50000;
        const total = cantidad * precioUnitario;

        items.push({
          presupuesto_id: presupuesto.id,
          descripcion: itemsDescripciones[Math.floor(Math.random() * itemsDescripciones.length)],
          cantidad,
          precio_unitario: precioUnitario,
          total,
          orden: i,
        });
      }

      const { error: itemsError } = await supabase
        .from('items_presupuesto')
        .insert(items);

      if (itemsError) {
        console.error('Error creating items for presupuesto:', presupuesto.id, itemsError);
      }
    }

    console.log('Demo data created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Datos de demostración creados exitosamente',
        data: {
          clientes: clientes.length,
          presupuestos: presupuestosCreados.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
