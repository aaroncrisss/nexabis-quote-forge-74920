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
        const { prompt, moneda = 'CLP', rubro = 'general' } = await req.json();

        if (!prompt) {
            return new Response(JSON.stringify({ error: 'Prompt is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const systemPrompt = `Eres un asistente inteligente especializado en la industria: ${rubro}. 
Tu objetivo es leer una descripción en lenguaje natural de un proyecto o la necesidad de un cliente, y convertirla en una lista estructurada de ítems cotizables (productos o servicios).

REGLAS OBLIGATORIAS:
- Extrae cada componente, servicio o producto mencionado o implícito en el texto.
- Asigna un nombre claro y profesional a cada ítem ("descripcion").
- Determina una cantidad lógica basada en el texto (por defecto 1).
- Estima un "precio_unitario" razonable en la moneda solicitada (${moneda}). 
  - Si es CLP (Pesos Chilenos), usa valores sin decimales (ej. 50000, 150000).
  - Si es USD (Dólares), usa valores típicos de mercado (ej. 50, 150, 500).
- SIEMPRE devuelve ÚNICAMENTE un JSON válido, sin delimitadores \`\`\`json ni texto adicional.

ESTRUCTURA JSON OBLIGATORIA:
{
  "items": [
    {
      "descripcion": "string (nombre del servicio/producto)",
      "cantidad": number (entero),
      "precio_unitario": number (valor monetario estimado)
    }
  ]
}`;

        console.log(`[nl_to_items] Rubro: ${rubro}, Moneda: ${moneda}`);

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
                            { text: `TEXTO DEL CLIENTE:\n${prompt}` }
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
