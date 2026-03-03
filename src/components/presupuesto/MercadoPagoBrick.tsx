import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';

interface MercadoPagoBrickProps {
    presupuestoId: string;
    pagoNumero: 1 | 2;
    monto: number;
    onSuccess: (status: string) => void;
    onCancel?: () => void;
}

export function MercadoPagoBrick({ presupuestoId, pagoNumero, monto, onSuccess }: MercadoPagoBrickProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCheckoutPro = async () => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            console.log('[Checkout Pro] Iniciando creación de preferencia...');

            // Llama a la Edge Function que ahora genera la Preferencia de Pago
            const { data, error } = await supabase.functions.invoke('mp-create-payment', {
                body: {
                    presupuesto_id: presupuestoId,
                    pago_numero: pagoNumero,
                    formData: {
                        // Enviamos un token simulado para evitar cambiar el tipado en el backend
                        // ya que el backend de Preferences de MP no usa token de tarjeta directamente
                        token: 'checkout-pro-redirect',
                    },
                },
            });

            if (error) {
                throw new Error(`Error de conexión con el servidor: ${error.message}`);
            }

            if (data?.success === false || data?.error) {
                throw new Error(`Error al crear preferencia: ${data.error || 'Desconocido'}`);
            }

            // data.init_point es la URL segura de Mercado Pago
            const initPoint = data.init_point;

            if (!initPoint) {
                throw new Error('El servidor no devolvió una URL de pago válida');
            }

            console.log('[Checkout Pro] Redirigiendo a:', initPoint);
            toast.info('Redirigiendo a Mercado Pago seguro...');

            // Redirigir la ventana a Mercado Pago
            window.location.href = initPoint;

        } catch (err: any) {
            console.error('[Checkout Pro] Error:', err);
            toast.error(err.message || 'Error al iniciar el pago');
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center justify-center p-6 space-y-4 bg-muted/30 rounded-lg border border-border">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    Pagar con Mercado Pago
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Serás redirigido a la plataforma segura de Mercado Pago para completar tu pago usando cualquier tarjeta, efectivo o dinero en cuenta.
                </p>
            </div>

            <Button
                onClick={handleCheckoutPro}
                className="w-full max-w-sm bg-[#009EE3] hover:bg-[#0088CC] text-white py-6 text-lg font-medium tracking-wide flex items-center justify-center gap-2 group transition-all"
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Iniciando pago...
                    </>
                ) : (
                    <>
                        Ir a Pagar
                        <ExternalLink className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </>
                )}
            </Button>

            <div className="flex items-center gap-2 opacity-60">
                <img src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadopago/logo__small@2x.png" alt="Mercado Pago" className="h-4" />
                <span className="text-xs font-medium">Checkout Pro de alta de seguridad</span>
            </div>
        </div>
    );
}
