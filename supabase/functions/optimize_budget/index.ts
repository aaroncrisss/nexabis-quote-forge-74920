function getCorsHeaders(_req: Request) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

function buildOptimizedFallback(items: any[], target: number, moneda: string, fixedIds: string[] = []) {
  const isRounding = moneda === "CLP";
  const fixedSet = new Set(fixedIds || []);

  const parsed = items.map((item, idx) => {
    const qty = Math.max(1, Number(item.cantidad || 1));
    const unit = Math.max(0, Number(item.precio_unitario || 0));
    const isFixed = Boolean((item.id && fixedSet.has(String(item.id))) || fixedSet.has(String(idx)));
    return {
      idx,
      descripcion: String(item.descripcion || `Ítem ${idx + 1}`),
      cantidad: qty,
      precio_unitario: unit,
      subtotal: qty * unit,
      isFixed,
    };
  });

  const currentTotal = parsed.reduce((sum, item) => sum + item.subtotal, 0);
  if (currentTotal <= 0 || target <= 0) {
    return parsed.map((i) => ({
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
    }));
  }

  const fixedTotal = parsed.filter((i) => i.isFixed).reduce((s, i) => s + i.subtotal, 0);
  const adjustable = parsed.filter((i) => !i.isFixed);
  const adjustableTotal = adjustable.reduce((s, i) => s + i.subtotal, 0);
  const targetAdjustable = Math.max(0, target - fixedTotal);

  if (adjustable.length === 0 || adjustableTotal <= 0) {
    return parsed.map((i) => ({
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
    }));
  }

  const ratio = targetAdjustable / adjustableTotal;

  const optimized = parsed.map((item) => {
    if (item.isFixed) {
      return {
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      };
    }
    const newUnitRaw = item.precio_unitario * ratio;
    const step = isRounding ? (newUnitRaw >= 10000 ? 500 : 100) : 1;
    const newUnit = isRounding ? Math.round(newUnitRaw / step) * step : Math.round(newUnitRaw * 100) / 100;
    const cleanDesc = item.descripcion.replace(/\s*\((?:Alcance Ajustado|Alcance MVP|Optimizado)\)\s*$/i, "");
    return {
      descripcion: ratio < 0.85 ? `${cleanDesc} (Alcance Ajustado)` : cleanDesc,
      cantidad: item.cantidad,
      precio_unitario: Math.max(0, newUnit),
    };
  });

  const lastAdjIdx = [...parsed].reverse().find((i) => !i.isFixed)?.idx;
  if (lastAdjIdx !== undefined && optimized[lastAdjIdx]) {
    const sumOthers = optimized.reduce(
      (s, it, idx) => (idx === lastAdjIdx ? s : s + it.cantidad * it.precio_unitario),
      0
    );
    const last = optimized[lastAdjIdx];
    const remaining = Math.max(0, target - sumOthers);
    last.precio_unitario = Math.round((remaining / (last.cantidad || 1)) * 100) / 100;
    if (isRounding) last.precio_unitario = Math.round(last.precio_unitario);
  }

  return optimized;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const items = body.items;
    const target = Number(body.target || body.target_budget || 0);
    const moneda = body.moneda || body.currency || "CLP";
    const rubro = body.rubro || "general";

    if (!items || !Array.isArray(items) || !target) {
      return new Response(JSON.stringify({ error: "Faltan parámetros requeridos (items, target)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!GEMINI_API_KEY) {
      const optimized = buildOptimizedFallback(items, target, moneda);
      return new Response(
        JSON.stringify({
          items: optimized,
          optimized_items: optimized,
          explanation: "Ítems ajustados proporcionalmente para cumplir el presupuesto objetivo.",
          _fallback: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentTotal = items.reduce(
      (sum, item) => sum + Number(item.cantidad) * Number(item.precio_unitario),
      0
    );

    const systemPrompt = `Eres un consultor financiero experto en el rubro: ${rubro}. 
Un cliente te pide ajustar un presupuesto.
El costo total actual es ${currentTotal} ${moneda}, pero su presupuesto máximo objetivo es de ${target} ${moneda}.

TU MISIÓN: Reducir los costos o ajustar las cantidades/alcance para que el nuevo total se acerque lo máximo posible a ${target} ${moneda} sin superar ese valor, priorizando mantener la calidad.

ESTRUCTURA JSON OBLIGATORIA:
{
  "items": [
    {
      "descripcion": "string (mantén el original o añade '(Optimizado)')",
      "cantidad": number,
      "precio_unitario": number
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
              parts: [{ text: systemPrompt }, { text: `ÍTEMS ACTUALES:\n${JSON.stringify(items, null, 2)}` }],
            },
          ],
          generationConfig: { response_mime_type: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      const optimized = buildOptimizedFallback(items, target, moneda);
      return new Response(JSON.stringify({ items: optimized, optimized_items: optimized, _fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      const optimized = buildOptimizedFallback(items, target, moneda);
      return new Response(JSON.stringify({ items: optimized, optimized_items: optimized, _fallback: true }), {
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
