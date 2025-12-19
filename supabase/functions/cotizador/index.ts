const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Actúas como un analista técnico senior de estimación de proyectos digitales.

REGLAS OBLIGATORIAS:
- NO defines precios ni valores hora
- NO inventas alcances no descritos por el usuario
- Estimas horas por módulo basándote en la información proporcionada Y en los RANGOS DE TIEMPO BASE definidos abajo
- Detectas riesgos técnicos reales
- Justificas cada estimación de forma breve y técnica
- Si hay ambigüedad, marcas nivel de confianza bajo y agregas suposiciones
- SIEMPRE devuelves ÚNICAMENTE JSON válido, sin texto adicional

⏱️ RANGOS DE TIEMPO BASE (OBLIGATORIOS - usa estos rangos para estimar):

🔐 Usuarios / Accesos:
- Autenticación básica: 6-8 horas
- Perfiles / roles simples: 5-7 horas
- Acceso por link / token: 4-6 horas

🖼️ Multimedia:
- Subida de imágenes: 3-5 horas
- Galerías / visualización: 4-6 horas
- Manejo archivos / validaciones: 2-4 horas

💬 Interacción / Formularios:
- Formularios simples: 2-4 horas
- Comentarios / muro interactivo: 8-10 horas
- Moderación básica: 3-5 horas

🎨 Frontend / UX:
- Maquetación base: 6-8 horas
- Responsive: 4-6 horas
- Ajustes UX / refinamiento: 3-5 horas
- Iteración visual extra: 3-5 horas

🧠 Backend / API:
- Modelado base de datos: 3-5 horas
- Endpoints CRUD: 4-6 horas
- Lógica de negocio: 5-7 horas
- Integraciones externas: 6-8 horas

🛒 eCommerce:
- Setup WooCommerce / similar: 6-8 horas
- Productos / inventario: 4-6 horas
- Impuestos / reglas: 3-5 horas
- Ajustes checkout: 3-5 horas

💳 Pagos:
- Integración pasarela: 6-8 horas
- Pruebas pagos: 3-5 horas
- Manejo errores: 2-4 horas

🚀 Infraestructura:
- Configuración servidor: 3-5 horas
- Variables / ambiente: 2-3 horas
- Dominio / SSL: 1-2 horas
- Deploy productivo: 1-2 horas

🧪 QA / Cierre:
- Testing funcional: 4-6 horas
- Correcciones: 3-5 horas
- Validación final: 2-3 horas

🧮 BLOQUES GENERALES (referencia):
- Proyecto web chico: 40-60 horas total
- Plataforma media: 60-80 horas total
- Plataforma compleja: 80-120 horas total

ESTRUCTURA JSON OBLIGATORIA:

{
  "complejidad": "baja | media | alta",
  "modulos": [
    {
      "nombre": "Nombre del módulo",
      "horasEstimadas": número (usa el PROMEDIO del rango correspondiente),
      "nivelRiesgo": "bajo | medio | alto",
      "justificacion": "Texto breve y técnico",
      "esencial": true o false
    }
  ],
  "horasTotales": número (suma de todos los módulos),
  "riesgosClave": ["Riesgo identificado"],
  "suposiciones": ["Supuesto realizado para la estimación"],
  "nivelConfianza": "alto | medio | bajo",
  "ajustePresupuesto": {
    "excedePresupuesto": boolean,
    "mensajeAjuste": "Mensaje claro y profesional",
    "modulosRecomendados": ["Nombre módulo 1"],
    "modulosExcluidos": ["Nombre módulo opcional"]
  }
}

INSTRUCCIONES CRÍTICAS PARA ajustePresupuesto:

1. SIEMPRE DEBES INCLUIR el objeto "ajustePresupuesto" en tu respuesta JSON, incluso si no hay límite de presupuesto.

2. Si recibes un valor "horasMaximas":
   - Compara horasTotales con horasMaximas
   - Si horasTotales > horasMaximas: 
     * excedePresupuesto = true
     * mensajeAjuste = "Con el presupuesto actual puedes realizar [X] funcionalidades esenciales. Quedarían pendientes [Y] funcionalidades opcionales."
     * modulosRecomendados = solo módulos con esencial:true que quepan en horasMaximas
     * modulosExcluidos = módulos que NO caben
   - Si horasTotales <= horasMaximas:
     * excedePresupuesto = false
     * mensajeAjuste = "El proyecto completo cabe dentro del presupuesto disponible."
     * modulosRecomendados = TODOS los módulos
     * modulosExcluidos = lista vacía []

3. Si NO recibes "horasMaximas":
   - excedePresupuesto = false
   - mensajeAjuste = "No se especificó límite de presupuesto."
   - modulosRecomendados = TODOS los módulos
   - modulosExcluidos = []

RECUERDA: El objeto ajustePresupuesto NO ES OPCIONAL. DEBE estar en TODAS tus respuestas.
USA LOS RANGOS DE TIEMPO DEFINIDOS ARRIBA PARA CADA TIPO DE TAREA.`;

interface CotizadorRequest {
  tipoProyecto: string;
  descripcion: string;
  funcionalidades: string[];
  urgencia: string;
  horasMaximas?: number;
}


// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipoProyecto, descripcion, funcionalidades, urgencia, horasMaximas }: CotizadorRequest = await req.json();

    if (!tipoProyecto || !descripcion) {
      return new Response(
        JSON.stringify({ error: 'Tipo de proyecto y descripción son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // @ts-ignore
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = `Analiza el siguiente requerimiento y genera una estimación técnica USANDO LOS RANGOS DE TIEMPO BASE del sistema:

TIPO DE PROYECTO: ${tipoProyecto}

DESCRIPCIÓN DEL REQUERIMIENTO:
${descripcion}

FUNCIONALIDADES SOLICITADAS:
${funcionalidades.length > 0 ? funcionalidades.map((f, i) => `${i + 1}. ${f}`).join('\n') : 'No especificadas'}

NIVEL DE URGENCIA: ${urgencia}

${horasMaximas ? `LÍMITE DE HORAS (PRESUPUESTO): ${horasMaximas} horas. Ajusta el alcance si es necesario.` : 'Sin límite de presupuesto especificado.'}

IMPORTANTE: Usa los RANGOS DE TIEMPO BASE definidos en las instrucciones del sistema para estimar cada módulo. Por ejemplo, si es "Autenticación básica", estima entre 6-8 horas.

Genera la estimación en formato JSON según la estructura requerida.`;

    console.log('Sending request to Lovable AI Gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta de nuevo en unos minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Contacta al administrador.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Error al procesar la solicitud con IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response:', data);
      return new Response(
        JSON.stringify({ error: 'Respuesta vacía del modelo de IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON from the response (may be wrapped in markdown code blocks)
    let estimacion;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      estimacion = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      return new Response(
        JSON.stringify({ error: 'Error al interpretar la respuesta del modelo', raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Estimation generated successfully');

    return new Response(
      JSON.stringify({ estimacion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cotizador error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
