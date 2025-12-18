import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Actúas como un analista técnico senior de estimación de proyectos digitales.

REGLAS OBLIGATORIAS:
- NO defines precios ni valores hora
- NO inventas alcances no descritos por el usuario
- Estimas horas por módulo basándote en la información proporcionada
- Detectas riesgos técnicos reales
- Justificas cada estimación de forma breve y técnica
- Si hay ambigüedad, marcas nivel de confianza bajo y agregas suposiciones
- SIEMPRE devuelves ÚNICAMENTE JSON válido, sin texto adicional

Tu respuesta DEBE ser un JSON con esta estructura exacta:
{
  "complejidad": "baja | media | alta",
  "modulos": [
    {
      "nombre": "Nombre del módulo",
      "horasEstimadas": número,
      "nivelRiesgo": "bajo | medio | alto",
      "justificacion": "Texto breve y técnico"
    }
  ],
  "horasTotales": número,
  "riesgosClave": ["Riesgo identificado"],
  "suposiciones": ["Supuesto realizado para la estimación"],
  "nivelConfianza": "alto | medio | bajo"
}`;

interface CotizadorRequest {
  tipoProyecto: string;
  descripcion: string;
  funcionalidades: string[];
  urgencia: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipoProyecto, descripcion, funcionalidades, urgencia }: CotizadorRequest = await req.json();

    if (!tipoProyecto || !descripcion) {
      return new Response(
        JSON.stringify({ error: 'Tipo de proyecto y descripción son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = `Analiza el siguiente requerimiento y genera una estimación técnica:

TIPO DE PROYECTO: ${tipoProyecto}

DESCRIPCIÓN DEL REQUERIMIENTO:
${descripcion}

FUNCIONALIDADES SOLICITADAS:
${funcionalidades.length > 0 ? funcionalidades.map((f, i) => `${i + 1}. ${f}`).join('\n') : 'No especificadas'}

NIVEL DE URGENCIA: ${urgencia}

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