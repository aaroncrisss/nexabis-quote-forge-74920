function getCorsHeaders(_req: Request) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const CATALOG_RULES: Array<{
  keywords: string[];
  title: string;
  clp: number;
  usd: number;
}> = [
  { keywords: ["aire acondicionado", "split", "climatizador"], title: "Suministro e Instalación de Equipo Aire Acondicionado Split Inverter", clp: 285000, usd: 300 },
  { keywords: ["mantenimiento", "mantencion", "preventivo"], title: "Servicio de Mantenimiento Preventivo, Sanitización & Diagnóstico Técnico", clp: 85000, usd: 90 },
  { keywords: ["panel solar", "paneles solares", "fotovoltaico", "inversor"], title: "Provisión y Montaje de Sistema Solar Fotovoltaico & Inversor", clp: 450000, usd: 480 },
  { keywords: ["landing", "onepage"], title: "Diseño UI/UX y Desarrollo de Landing Page Optimizada para Conversión", clp: 240000, usd: 260 },
  { keywords: ["pagina web", "sitio web", "web corporativa"], title: "Desarrollo de Sitio Web Corporativo Responsive, Autoadministrable & SEO", clp: 420000, usd: 450 },
  { keywords: ["tienda online", "ecommerce", "e-commerce", "carrito"], title: "Desarrollo de Plataforma E-Commerce con Catálogo y Carrito de Compras", clp: 490000, usd: 520 },
  { keywords: ["webpay", "pasarela", "mercadopago", "stripe"], title: "Integración y Certificación de Pasarela de Pagos (Webpay / MercadoPago)", clp: 240000, usd: 255 },
  { keywords: ["panel", "dashboard", "backoffice", "inventario", "admin"], title: "Desarrollo de Panel Administrativo (Backoffice) y Módulo de Gestión", clp: 350000, usd: 375 },
  { keywords: ["login", "usuarios", "roles", "autenticacion"], title: "Módulo de Autenticación Segura, Perfiles de Usuario y Control de Roles", clp: 180000, usd: 195 },
  { keywords: ["whatsapp", "chatbot", "bot", "n8n", "automatizacion"], title: "Implementación de Flujo Automatizado / Chatbot con Integración WhatsApp", clp: 320000, usd: 340 },
  { keywords: ["logo", "branding", "identidad", "marca"], title: "Diseño de Identidad Visual, Logotipo Vectorial & Manual de Marca", clp: 260000, usd: 280 },
  { keywords: ["campana", "meta ads", "google ads", "publicidad", "pauta"], title: "Configuración, Segmentación y Optimización de Campaña Digital (Ads)", clp: 250000, usd: 270 },
  { keywords: ["seo", "posicionamiento"], title: "Auditoría SEO Técnica, Optimización On-Page e Indexación en Google", clp: 210000, usd: 225 },
  { keywords: ["video", "reels", "rodaje", "grabacion", "edicion"], title: "Producción, Rodaje en 4K y Postproducción de Pieza Audiovisual", clp: 290000, usd: 310 },
  { keywords: ["pintura", "empaste"], title: "Preparación de Superficie, Empaste y Pintura de Terminación", clp: 180000, usd: 195 },
  { keywords: ["radier", "hormigon", "fundaciones"], title: "Ejecución de Radier y Fundaciones en Hormigón Vibrado", clp: 480000, usd: 510 },
  { keywords: ["electrica", "tablero", "iluminacion", "enchufe"], title: "Instalación y Canalización Eléctrica Certificada (Norma SEC)", clp: 260000, usd: 280 },
  { keywords: ["gasfiteria", "sanitario", "bano"], title: "Instalación de Red de Gasfitería y Artefactos Sanitarios", clp: 340000, usd: 360 },
];

function extractQty(seg: string): number {
  const m = seg.match(/\b(\d{1,4})\b(?!\s*(?:%|horas|h|clp|usd|\$))/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 2000) return n;
  }
  const norm = normalizeText(seg);
  const words: Record<string, number> = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };
  for (const [w, val] of Object.entries(words)) {
    if (new RegExp(`(^|\\s)${w}\\s+`, "i").test(norm)) return val;
  }
  return 1;
}

function buildFallbackItems(prompt: string, moneda: string) {
  const isUSD = moneda === "USD";
  const baseRate = isUSD ? 35 : 25000;
  const rawSegments = prompt
    .split(/\n|;|•|,(?=\s*[A-Za-zÁÉÍÓÚáéíóúñÑ0-9]{2,})|\s+(?:y|e|además|más|incluyendo)\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4);

  if (rawSegments.length === 0) {
    return [
      {
        descripcion: prompt.trim() || "Desarrollo e implementación principal",
        cantidad: 1,
        precio_unitario: baseRate * 12,
      },
    ];
  }

  return rawSegments.map((seg) => {
    const norm = normalizeText(seg);
    const qty = extractQty(seg);
    const matched = CATALOG_RULES.find((r) => r.keywords.some((kw) => norm.includes(kw)));
    if (matched) {
      return {
        descripcion: matched.title,
        cantidad: qty,
        precio_unitario: isUSD ? matched.usd : matched.clp,
      };
    }

    const cleanSeg = seg.replace(/^(necesito|quiero|requiero|instalar|hacer|crear|cotizar)\s+/i, "").replace(/^\d+\s+/, "").trim();
    const cleanTitle = (cleanSeg || seg).charAt(0).toUpperCase() + (cleanSeg || seg).slice(1);
    return {
      descripcion: cleanTitle,
      cantidad: qty,
      precio_unitario: Math.round(9 * baseRate),
    };
  });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const prompt = body.prompt || body.description || "";
    const moneda = body.moneda || body.currency || "CLP";
    const rubro = body.rubro || "general";

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ items: buildFallbackItems(prompt, moneda), _fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt }, { text: `TEXTO DEL CLIENTE:\n${prompt}` }],
            },
          ],
          generationConfig: { response_mime_type: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      return new Response(JSON.stringify({ items: buildFallbackItems(prompt, moneda), _fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      return new Response(JSON.stringify({ items: buildFallbackItems(prompt, moneda), _fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    textResponse = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    return new Response(textResponse, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
