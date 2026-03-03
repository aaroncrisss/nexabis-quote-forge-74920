import { serve } from "https://deno.land/std@0.177.1/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN') || "APP_USR-793833831986666-030216-49ae38a5a12a87a0832e03b13d1b7e58-3234524993"; // VENDEDOR FICTICIO - PRODUCCIÓN
        console.log("▶ VENDEDOR TOKEN ACTIVO:", `${mpAccessToken.substring(0, 15)}...`);

        console.log("▶ ENV:", {
            supabaseUrl: !!supabaseUrl,
            mpAccessToken: mpAccessToken ? `${mpAccessToken.substring(0, 12)}...` : 'MISSING ❌',
        });

        if (!mpAccessToken) {
            return new Response(JSON.stringify({
                success: false,
                error: "MP_ACCESS_TOKEN no configurado."
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
        const payload = await req.json();
        const { presupuesto_id, pago_numero, formData } = payload;

        console.log("▶ formData recibido:", JSON.stringify(formData));

        if (!presupuesto_id || !pago_numero || !formData) {
            return new Response(JSON.stringify({
                success: false, error: 'Faltan parámetros.'
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }

        // ── Obtener presupuesto de BD ──
        const { data: presupuesto, error: presupuestoError } = await supabaseAdmin
            .from('presupuestos')
            .select('*')
            .eq('id', presupuesto_id)
            .single();

        if (presupuestoError || !presupuesto) {
            return new Response(JSON.stringify({
                success: false, error: `Presupuesto no encontrado: ${presupuestoError?.message}`
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }

        // ── Calcular monto (CLP = entero, sin decimales) ──
        const totalMonto = Math.round(parseFloat(presupuesto.total));
        let transactionAmount: number;

        if (pago_numero === 1) {
            transactionAmount = Math.round(totalMonto / 2);
        } else if (pago_numero === 2) {
            const montoPago1 = Math.round(parseFloat(presupuesto.mp_pago_1_monto) || totalMonto / 2);
            transactionAmount = totalMonto - montoPago1;
        } else {
            return new Response(JSON.stringify({ success: false, error: 'pago_numero debe ser 1 o 2' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
            });
        }

        // ── Construir payload para Checkout Pro (Preferences) ──
        // Ref: https://www.mercadopago.com/developers/es/reference/preferences/_checkout_preferences/post

        const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:5173'; // Asegúrate de tener esta variable en Supabase o cambiarla por tu dominio real
        const returnUrl = `${appUrl}/presupuesto/${presupuesto.token}`;

        const mpPayload: Record<string, any> = {
            items: [
                {
                    id: `presupuesto_${presupuesto_id}_pago_${pago_numero}`,
                    title: `Presupuesto ${presupuesto.numero} - Pago ${pago_numero}/2`,
                    description: `Pago ${pago_numero} de 2 para el presupuesto ${presupuesto.numero}`,
                    currency_id: "CLP",
                    quantity: 1,
                    unit_price: transactionAmount,
                }
            ],
            back_urls: {
                success: returnUrl,
                failure: returnUrl,
                pending: returnUrl
            },
            // auto_return: "approved", // Desactivamos el auto_return porque Mercado Pago exige HTTPS para que funcione automáticamente
            payment_methods: {
                excluded_payment_methods: [
                    { id: "cmr" }, // Excluir métodos no deseados en Chile si es necesario
                ],
                excluded_payment_types: [
                    { id: "ticket" },
                    { id: "atm" },
                    { id: "bank_transfer" }
                ],
                installments: 12
            },
            external_reference: `presupuesto_${presupuesto_id}_pago_${pago_numero}`,
        };

        console.log("▶ mpPayload (Preference):", JSON.stringify(mpPayload));

        // ── Llamar a la API de Preferencias de MercadoPago ──
        const idempotencyKey = `nexabis-pref-${presupuesto_id}-pago${pago_numero}-${Date.now()}`;
        const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${mpAccessToken}`,
                "Content-Type": "application/json",
                "X-Idempotency-Key": idempotencyKey,
            },
            body: JSON.stringify(mpPayload),
        });

        const mpData = await mpResponse.json();
        console.log("▶ MP status:", mpResponse.status);
        console.log("▶ MP body:", JSON.stringify(mpData));

        if (mpResponse.status >= 400) {
            console.error("❌ MP Error:", JSON.stringify(mpData));
            return new Response(JSON.stringify({
                success: false,
                error: mpData.message || 'Error creando preferencia de pago',
                mp_status: mpResponse.status,
                mp_error: mpData,
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }

        // ── La BD no se marca como pagada aquí, se guarda solo el ID de referencia ──
        const updateData: Record<string, any> = {};
        if (pago_numero === 1) {
            updateData.mp_pago_1_id = String(mpData.id); // Guardar ID de preferencia
            updateData.mp_pago_1_status = 'pending_checkout';
        } else {
            updateData.mp_pago_2_id = String(mpData.id); // Guardar ID de preferencia
            updateData.mp_pago_2_status = 'pending_checkout';
        }

        const { error: updateError } = await supabaseAdmin
            .from('presupuestos')
            .update(updateData)
            .eq('id', presupuesto_id);

        if (updateError) {
            console.error("⚠ Error guardando en BD:", updateError);
        }

        console.log(`✅ Pago ${pago_numero} OK. ID: ${mpData.id}, Status: ${mpData.status}`);

        return new Response(JSON.stringify({ success: true, ...mpData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("🔥 Error inesperado:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
})
