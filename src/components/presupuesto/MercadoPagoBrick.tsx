import { useState, useEffect } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MercadoPagoBrickProps {
    presupuestoId: string;
    presupuestoToken: string;
    pagoNumero: 1 | 2;
    monto: number;
    onSuccess: (status: string) => void;
    onCancel?: () => void;
}

export function MercadoPagoBrick({ presupuestoId, presupuestoToken, pagoNumero, monto, onSuccess }: MercadoPagoBrickProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentResult, setPaymentResult] = useState<{ status: string; detail: string } | null>(null);
    const [sdkReady, setSdkReady] = useState(false);

    useEffect(() => {
        const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
        console.log('[Payment Brick] Inicializando SDK con Public Key:', publicKey?.substring(0, 15) + '...');

        if (publicKey) {
            initMercadoPago(publicKey, { locale: 'es-CL' });
            setSdkReady(true);
        } else {
            console.error('[Payment Brick] VITE_MP_PUBLIC_KEY no encontrada');
            toast.error('Error de configuración: falta la clave pública de Mercado Pago');
        }
    }, []);

    const handleSubmit = async (formData: any) => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            console.log('[Payment Brick] formData recibido del Brick:', JSON.stringify(formData));

            const { data, error } = await supabase.functions.invoke('mp-create-payment', {
                body: {
                    presupuesto_id: presupuestoId,
                    pago_numero: pagoNumero,
                    formData: formData,
                },
            });

            if (error) {
                throw new Error(`Error de conexión: ${error.message}`);
            }

            console.log('[Payment Brick] Respuesta del servidor:', JSON.stringify(data));

            if (data?.success === false || data?.error) {
                throw new Error(data.error || 'Error procesando el pago');
            }

            if (data?.status === 'approved') {
                setPaymentResult({ status: 'approved', detail: data.status_detail });
                toast.success('¡Pago aprobado exitosamente!');
                onSuccess(data.status);
            } else if (data?.status === 'rejected') {
                setPaymentResult({ status: 'rejected', detail: data.status_detail });
                toast.error(`Pago rechazado: ${data.status_detail}`);
                setIsProcessing(false);
            } else if (data?.status === 'in_process' || data?.status === 'pending') {
                setPaymentResult({ status: 'pending', detail: data.status_detail });
                toast.info('Pago pendiente de confirmación');
                onSuccess(data.status);
            } else {
                throw new Error(`Estado inesperado: ${data?.status}`);
            }

        } catch (err: any) {
            console.error('[Payment Brick] Error:', err);
            toast.error(err.message || 'Error al procesar el pago');
            setIsProcessing(false);
        }
    };

    // Si ya se procesó el pago, mostrar resultado
    if (paymentResult) {
        const isApproved = paymentResult.status === 'approved';
        const isPending = paymentResult.status === 'pending';

        return (
            <div className={`w-full p-6 rounded-lg border text-center space-y-3 ${isApproved ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' :
                isPending ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800' :
                    'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
                }`}>
                {isApproved ? (
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                ) : isPending ? (
                    <Loader2 className="w-12 h-12 text-yellow-500 mx-auto animate-spin" />
                ) : (
                    <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                )}
                <h3 className="text-lg font-semibold">
                    {isApproved ? '¡Pago Aprobado!' :
                        isPending ? 'Pago Pendiente' :
                            'Pago Rechazado'}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {isApproved ? 'Tu pago fue procesado correctamente.' :
                        isPending ? 'Tu pago está siendo procesado.' :
                            `Motivo: ${paymentResult.detail}. Puedes intentar nuevamente.`}
                </p>
                {(isApproved || isPending) && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/comprobante/${presupuestoToken}/${pagoNumero}`, '_blank')}
                        >
                            <ExternalLink className="w-4 h-4 mr-1" /> Ver Comprobante
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/comprobante/${presupuestoToken}/${pagoNumero}`);
                                toast.success('¡Link del comprobante copiado!');
                            }}
                        >
                            <Copy className="w-4 h-4 mr-1" /> Copiar Link
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    if (!sdkReady) {
        return (
            <div className="w-full flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                <span>Cargando formulario de pago...</span>
            </div>
        );
    }

    return (
        <div className="w-full">
            <Payment
                initialization={{
                    amount: monto,
                }}
                customization={{
                    paymentMethods: {
                        creditCard: 'all',
                        debitCard: 'all',
                    },
                    visual: {
                        style: {
                            theme: 'default',
                        },
                    },
                }}
                onSubmit={handleSubmit}
                onReady={() => {
                    console.log('[Payment Brick] Brick listo');
                }}
                onError={(error: any) => {
                    console.error('[Payment Brick] Error del Brick:', error);
                    toast.error('Error cargando el formulario de pago');
                }}
            />
        </div>
    );
}
