const ALLOWED_ORIGINS = [
    'https://nexabistech.com',
    'https://www.nexabistech.com',
    'http://localhost:8080',
    'http://localhost:5173',
];

function getCorsHeaders(req: Request) {
    const origin = req.headers.get('origin') || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (!GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const { items, target, moneda = 'CLP', rubro = 'general' } = await req.json();

        if (!items || !Array.isArray(items) || !target) {
            return new Response(JSON.stringify({ error: 'Faltan parámetros requeridos (items, target)' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const currentTotal = items.reduce((sum, item) => sum + (Number(item.cantidad) * Number(item.precio_unitario)), 0);

        const systemPrompt = `Eres un consultor financiero experto en el rubro: ${rubro}. 
Un cliente te pide ajustar un presupuesto.
El costo total actual es ${currentTotal} ${moneda}, pero su presupuesto máximo objetivo es de ${target} ${moneda}.

TU MISIÓN: Reducir los costos o ajustar las cantidades/alcance para que el nuevo total se acerque lo máximo posible a ${target} ${moneda} sin superar ese valor, priorizando mantener la calidad.

REGLAS OBLIGATORIAS:
- Evalúa los items originales proveídos.
- Puedes reducir moderadamente los \`precio_unitario\` (descuento estratégico).
- Puedes reducir \`cantidad\` si tiene sentido, o eliminar un item no esencial (poniendo cantidad 0 o no incluyéndolo).
- Mantén la misma estructura JSON retornando OBLIGATORIAMENTE UN ARRAY DE ITEMS.
- Evita dejar un precio en 0 a menos que sea realmente gratuito.
- SIEMPRE devuelve ÚNICAMENTE un JSON válido, sin delimitadores \`\`\`json ni texto adicional.

ESTRUCTURA JSON OBLIGATORIA:
{
  "items": [
    {
      "descripcion": "string (mantén el original o añade '(Optimizado)')",
      "cantidad": number (entero o decimal),
      "precio_unitario": number (valor monetario ajustado)
    }
  ]
}`;

        console.log(`[optimize_budget] Rubro: ${rubro}, Moneda: ${moneda}, Actual: ${currentTotal}, Target: ${target}`);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: systemPrompt },
                            { text: `ÍTEMS ACTUALES:\n${JSON.stringify(items, null, 2)}` }
                        ]
                    }
                ],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            })
        });

        const data = await response.json();
        console.log('Gemini API Response Status:', response.status);

        if (!response.ok) {
            console.error('Gemini API Error:', data);
            throw new Error(`Gemini API Error: ${JSON.stringify(data)}`);
        }

        let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
            throw new Error('No content in Gemini response');
        }

        // Clean up markdown code blocks if present
        textResponse = textResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');

        return new Response(textResponse, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
