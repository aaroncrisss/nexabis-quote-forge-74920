import { serve } from "https://deno.land/std@0.177.1/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await req.json().catch(() => null);

        // MercadoPago puede enviar en el body o en los query params
        const url = new URL(req.url);
        const topic = body?.type || url.searchParams.get('topic') || url.searchParams.get('type');
        const paymentId = body?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id');

        console.log("▶ Webhook recibido:", { topic, paymentId, body });

        if (!paymentId) {
            console.log("⚠ Webhook sin payment ID, respondiendo 200 OK");
            return new Response('OK', { status: 200 });
        }

        if (topic !== 'payment') {
            console.log(`⚠ Topic '${topic}' ignorado (solo procesamos 'payment')`);
            return new Response('OK', { status: 200 });
        }

        return await processPaymentUpdate(String(paymentId));

    } catch (error: any) {
        console.error('🔥 Webhook error:', error.message);
        // MP espera 200 incluso en errores para no reintentar indefinidamente
        return new Response('Webhook Error', { status: 200 });
    }
});

async function processPaymentUpdate(paymentId: string) {
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');

    if (!mpAccessToken) {
        console.error("❌ MP_ACCESS_TOKEN no configurado en webhook");
        return new Response('OK', { status: 200 });
    }

    // Obtener info del pago desde MP
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` }
    });

    if (mpResponse.status >= 400) {
        console.error(`❌ Pago ${paymentId} no encontrado en MP:`, mpResponse.status);
        return new Response('OK', { status: 200 });
    }

    const paymentInfo = await mpResponse.json();
    const { status, external_reference, transaction_amount } = paymentInfo;

    console.log("▶ Pago MP obtenido:", { paymentId, status, external_reference });

    // external_reference debe ser "presupuesto_{ID}_pago_{NUM}"
    if (!external_reference?.startsWith('presupuesto_')) {
        console.log("⚠ external_reference no pertenece a esta app:", external_reference);
        return new Response('OK', { status: 200 });
    }

    const match = external_reference.match(/^presupuesto_(.+)_pago_(\d)$/);
    if (!match) {
        console.error("❌ external_reference con formato incorrecto:", external_reference);
        return new Response('OK', { status: 200 });
    }

    const presupuestoId = match[1];
    const pagoNum = parseInt(match[2], 10);

    const updateData: Record<string, any> = {};
    if (pagoNum === 1) {
        updateData.mp_pago_1_status = status;
        updateData.mp_pago_1_monto = transaction_amount;
        updateData.mp_pago_1_id = String(paymentId);
    } else if (pagoNum === 2) {
        updateData.mp_pago_2_status = status;
        updateData.mp_pago_2_monto = transaction_amount;
        updateData.mp_pago_2_id = String(paymentId);
    } else {
        console.error("❌ pagoNum inválido:", pagoNum);
        return new Response('OK', { status: 200 });
    }

    const { error } = await supabaseAdmin
        .from('presupuestos')
        .update(updateData)
        .eq('id', presupuestoId);

    if (error) {
        console.error("❌ Error actualizando BD via webhook:", error);
    } else {
        console.log(`✅ Presupuesto ${presupuestoId} actualizado: pago ${pagoNum} → ${status}`);
    }

    return new Response('OK', { status: 200 });
}
