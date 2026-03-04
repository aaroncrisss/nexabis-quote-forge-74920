import { serve } from "https://deno.land/std@0.177.1/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import nodemailer from "npm:nodemailer@6"

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
        const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN') || "TEST-6198284746887366-030209-651c769c5813de435955834dfa3446c5-274622983"; // VENDEDOR FICTICIO - TEST (para Bricks)
        console.log("▶ VENDEDOR TOKEN ACTIVO:", `${mpAccessToken.substring(0, 15)}...`);

        if (!mpAccessToken) {
            return new Response(JSON.stringify({
                success: false,
                error: "MP_ACCESS_TOKEN no configurado."
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
        const payload = await req.json();
        const { presupuesto_id, pago_numero, formData: rawFormData } = payload;

        console.log("▶ rawFormData recibido:", JSON.stringify(rawFormData));

        // Payment Brick envía: { paymentType, selectedPaymentMethod, formData: { token, payment_method_id, ... } }
        // Extraer el formData interno si existe
        const formData = rawFormData?.formData || rawFormData;
        console.log("▶ formData extraído:", JSON.stringify(formData));

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

        // ── Construir payload para Payment API (Bricks) ──
        const mpPayload: Record<string, any> = {
            transaction_amount: transactionAmount,
            token: formData.token,
            description: `Presupuesto ${presupuesto.numero} - Pago ${pago_numero}/2`,
            installments: formData.installments || 1,
            payment_method_id: formData.payment_method_id,
            issuer_id: formData.issuer_id,
            payer: {
                email: formData.payer?.email || formData.email || "test@test.com",
                identification: formData.payer?.identification || undefined,
            },
            external_reference: `presupuesto_${presupuesto_id}_pago_${pago_numero}`,
        };

        console.log("▶ mpPayload (Payment):", JSON.stringify(mpPayload));

        // ── Llamar a la API de Pagos de MercadoPago ──
        const idempotencyKey = `nexabis-pay-${presupuesto_id}-pago${pago_numero}-${Date.now()}`;
        const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
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
                error: mpData.message || 'Error procesando el pago',
                mp_status: mpResponse.status,
                mp_error: mpData,
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        }

        // ── Actualizar BD con resultado del pago ──
        const updateData: Record<string, any> = {};
        if (pago_numero === 1) {
            updateData.mp_pago_1_id = String(mpData.id);
            updateData.mp_pago_1_status = mpData.status;
            updateData.mp_pago_1_monto = transactionAmount;
            if (mpData.status === 'approved') {
                updateData.estado_pago = 'pago_1_completado';
            }
        } else {
            updateData.mp_pago_2_id = String(mpData.id);
            updateData.mp_pago_2_status = mpData.status;
            if (mpData.status === 'approved') {
                updateData.estado_pago = 'pagado_total';
            }
        }

        const { error: updateError } = await supabaseAdmin
            .from('presupuestos')
            .update(updateData)
            .eq('id', presupuesto_id);

        if (updateError) {
            console.error("⚠ Error guardando en BD:", updateError);
        }

        console.log(`✅ Pago ${pago_numero} OK. ID: ${mpData.id}, Status: ${mpData.status}`);

        // ── Enviar email con comprobante (fire-and-forget) ──
        if (mpData.status === 'approved') {
            const sendReceiptEmail = async () => {
                try {
                    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com';
                    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
                    const smtpUser = Deno.env.get('SMTP_USER') || 'pagos@presupuestos.nexabistech.com';
                    const smtpPass = Deno.env.get('SMTP_PASS') || '';

                    if (!smtpPass) {
                        console.warn("⚠ SMTP_PASS no configurado, no se envía email.");
                        return;
                    }

                    // Obtener datos del cliente
                    const { data: clienteData } = await supabaseAdmin
                        .from('clientes')
                        .select('nombre, email, empresa')
                        .eq('id', presupuesto.cliente_id)
                        .single();

                    const clienteEmail = mpPayload.payer.email;
                    const clienteNombre = clienteData?.nombre || 'Cliente';
                    const siteUrl = Deno.env.get('SITE_URL') || 'https://nexabistech.com';
                    const comprobanteUrl = `${siteUrl}/comprobante/${presupuesto.token}/${pago_numero}`;

                    const transporter = nodemailer.createTransport({
                        host: smtpHost,
                        port: smtpPort,
                        secure: true, // SSL
                        auth: { user: smtpUser, pass: smtpPass },
                    });

                    const formatMoney = (val: number) => {
                        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: presupuesto.moneda || 'CLP' }).format(val);
                    };

                    const htmlEmail = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f5;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:16px 16px 0 0;padding:40px 30px;text-align:center;color:white;">
      <div style="font-size:48px;margin-bottom:10px;">✅</div>
      <h1 style="margin:0;font-size:24px;">¡Pago Confirmado!</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">Comprobante de transacción</p>
    </div>
    <div style="background:white;border-radius:0 0 16px 16px;padding:30px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
      <div style="text-align:center;padding-bottom:20px;border-bottom:1px solid #e4e4e7;">
        <p style="margin:0;color:#71717a;font-size:13px;">Monto pagado</p>
        <p style="margin:8px 0;font-size:36px;font-weight:bold;color:#18181b;">${formatMoney(transactionAmount)}</p>
        <span style="background:#f4f4f5;padding:4px 12px;border-radius:12px;font-size:12px;color:#52525b;">Pago ${pago_numero} de 2</span>
      </div>
      <table style="width:100%;margin:20px 0;font-size:14px;color:#3f3f46;">
        <tr>
          <td style="padding:8px 0;color:#71717a;">N° Presupuesto</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;">${presupuesto.numero}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#71717a;">ID Transacción</td>
          <td style="padding:8px 0;text-align:right;font-family:monospace;font-size:12px;">${mpData.id}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#71717a;">Estado</td>
          <td style="padding:8px 0;text-align:right;"><span style="background:#dcfce7;color:#16a34a;padding:2px 8px;border-radius:8px;font-size:12px;font-weight:600;">Aprobado</span></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#71717a;">Fecha</td>
          <td style="padding:8px 0;text-align:right;">${new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#71717a;">Total presupuesto</td>
          <td style="padding:8px 0;text-align:right;">${formatMoney(totalMonto)}</td>
        </tr>
      </table>
      <div style="text-align:center;margin:24px 0;">
        <a href="${comprobanteUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:white;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;">Ver Comprobante Completo</a>
      </div>
      <p style="text-align:center;font-size:12px;color:#a1a1aa;margin:24px 0 0;">
        Comprobante generado por <strong>NEXABIS TECH</strong>
      </p>
    </div>
  </div>
</body>
</html>`;

                    const subject = `✅ Comprobante de Pago - Presupuesto ${presupuesto.numero} (Pago ${pago_numero}/2)`;

                    // Enviar al pagador (cliente)
                    if (clienteEmail && clienteEmail !== 'test@test.com') {
                        await transporter.sendMail({
                            from: `"NEXABIS Pagos" <${smtpUser}>`,
                            to: clienteEmail,
                            subject,
                            html: htmlEmail,
                        });
                        console.log(`📧 Email enviado al cliente: ${clienteEmail}`);
                    }

                    // Enviar copia al vendedor
                    await transporter.sendMail({
                        from: `"NEXABIS Pagos" <${smtpUser}>`,
                        to: smtpUser,
                        subject: `[COPIA] ${subject} - Cliente: ${clienteNombre}`,
                        html: htmlEmail,
                    });
                    console.log(`📧 Email copia enviado al vendedor: ${smtpUser}`);

                } catch (emailError: any) {
                    console.error("⚠ Error enviando email (no bloquea el pago):", emailError.message);
                }
            };

            // Fire-and-forget: no esperamos a que termine para responder
            sendReceiptEmail();
        }

        return new Response(JSON.stringify({
            success: true,
            payment_id: mpData.id,
            status: mpData.status,
            status_detail: mpData.status_detail,
        }), {
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
