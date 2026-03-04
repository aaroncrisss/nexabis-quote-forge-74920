import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatCurrency";
import { CheckCircle, Printer, Download, Copy, Share2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ComprobantePago() {
    const { token, pagoNumero } = useParams();
    const [loading, setLoading] = useState(true);
    const [presupuesto, setPresupuesto] = useState<any>(null);
    const [cliente, setCliente] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (token) loadData();
    }, [token]);

    const loadData = async () => {
        try {
            const { data: presupuestoData, error } = await supabase
                .from("presupuestos")
                .select("*")
                .eq("token", token)
                .single();

            if (error) throw error;

            const { data: clienteData } = await supabase
                .from("clientes")
                .select("*")
                .eq("id", presupuestoData.cliente_id)
                .single();

            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", presupuestoData.usuario_id)
                .single();

            setPresupuesto(presupuestoData);
            setCliente(clienteData);
            setProfile(profileData);
        } catch {
            toast.error("No se pudo cargar el comprobante");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!receiptRef.current) return;
        toast.info("Generando PDF...");
        try {
            // Load html2pdf via script tag (more reliable than ESM import)
            const loadHtml2Pdf = (): Promise<any> => {
                return new Promise((resolve, reject) => {
                    if ((window as any).html2pdf) {
                        resolve((window as any).html2pdf);
                        return;
                    }
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js';
                    script.onload = () => resolve((window as any).html2pdf);
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            };

            const html2pdf = await loadHtml2Pdf();
            await html2pdf(receiptRef.current, {
                margin: 10,
                filename: `Comprobante_Pago_${presupuesto?.numero || ""}_Pago${pagoNumero}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            });
            toast.success("PDF descargado");
        } catch (err) {
            toast.error("Error generando PDF");
            console.error(err);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("¡Link copiado al portapapeles!");
    };

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: `Comprobante de Pago - ${presupuesto?.numero}`,
                text: `Comprobante de pago ${pagoNumero}/2 del presupuesto ${presupuesto?.numero}`,
                url: window.location.href,
            });
        } else {
            handleCopyLink();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!presupuesto) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                <Card className="p-8 text-center max-w-sm">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold mb-2">Comprobante no encontrado</h1>
                    <p className="text-muted-foreground text-sm">El enlace puede ser inválido o haber expirado.</p>
                </Card>
            </div>
        );
    }

    const pagoNum = parseInt(pagoNumero || "1");
    const pagoId = pagoNum === 1 ? presupuesto.mp_pago_1_id : presupuesto.mp_pago_2_id;
    const pagoStatus = pagoNum === 1 ? presupuesto.mp_pago_1_status : presupuesto.mp_pago_2_status;
    const totalMonto = parseFloat(presupuesto.total);
    const pagoMonto = pagoNum === 1
        ? Math.round(totalMonto / 2)
        : Math.round(totalMonto - (parseFloat(presupuesto.mp_pago_1_monto) || totalMonto / 2));
    const fmt = (val: number) => formatCurrency(val, presupuesto.moneda || "CLP");
    const isApproved = pagoStatus === "approved";
    const fechaPago = presupuesto.updated_at
        ? new Date(presupuesto.updated_at).toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "—";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 sm:p-8">
            {/* Action buttons - hidden on print */}
            <div className="print:hidden max-w-2xl mx-auto mb-4 flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4 mr-1" /> Copiar Link
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-1" /> Compartir
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                    <Download className="w-4 h-4 mr-1" /> Descargar PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-1" /> Imprimir
                </Button>
            </div>

            {/* Receipt Card */}
            <div ref={receiptRef}>
                <Card data-receipt-card className="max-w-2xl mx-auto overflow-hidden">
                    {/* Header with gradient */}
                    <div data-receipt-header className={`p-6 sm:p-8 text-center text-white ${isApproved
                        ? "bg-gradient-to-r from-green-500 to-emerald-600"
                        : "bg-gradient-to-r from-yellow-500 to-orange-500"
                        }`}>
                        <CheckCircle className="w-16 h-16 mx-auto mb-3 opacity-90" />
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                            {isApproved ? "¡Pago Confirmado!" : "Pago Pendiente"}
                        </h1>
                        <p className="text-white/80 text-sm">Comprobante de transacción</p>
                    </div>

                    {/* Amount section */}
                    <div data-receipt-amount className="text-center py-6 border-b">
                        <p className="text-sm text-muted-foreground mb-1">Monto pagado</p>
                        <p className="text-4xl font-bold tracking-tight">{fmt(pagoMonto)}</p>
                        <Badge variant="outline" className="mt-2">
                            Pago {pagoNum} de 2
                        </Badge>
                    </div>

                    {/* Details */}
                    <div className="p-6 sm:p-8 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">N° Presupuesto</p>
                                <p className="font-semibold">{presupuesto.numero}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Fecha de pago</p>
                                <p className="font-semibold">{fechaPago}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">ID Transacción</p>
                                <p className="font-mono text-xs">{pagoId || "—"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Estado</p>
                                <Badge className={isApproved ? "bg-green-500" : "bg-yellow-500"}>
                                    {isApproved ? "Aprobado" : pagoStatus || "Pendiente"}
                                </Badge>
                            </div>
                        </div>

                        <hr className="my-4" />

                        {/* Client info */}
                        <div className="space-y-2 text-sm">
                            <h3 className="font-bold text-base">Datos del Cliente</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-muted-foreground">Nombre</p>
                                    <p className="font-medium">{cliente?.nombre || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p className="font-medium">{cliente?.email || "—"}</p>
                                </div>
                                {cliente?.telefono && (
                                    <div>
                                        <p className="text-muted-foreground">Teléfono</p>
                                        <p className="font-medium">{cliente.telefono}</p>
                                    </div>
                                )}
                                {cliente?.empresa && (
                                    <div>
                                        <p className="text-muted-foreground">Empresa</p>
                                        <p className="font-medium">{cliente.empresa}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <hr className="my-4" />

                        {/* Payment summary */}
                        <div className="space-y-2 text-sm">
                            <h3 className="font-bold text-base">Resumen de Pagos</h3>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span>Total presupuesto</span>
                                    <span className="font-semibold">{fmt(totalMonto)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pago 1 (50% Anticipo)</span>
                                    <span className={`font-semibold ${presupuesto.mp_pago_1_status === "approved" ? "text-green-600" : ""}`}>
                                        {fmt(Math.round(totalMonto / 2))}
                                        {presupuesto.mp_pago_1_status === "approved" ? " ✅" : " ⏳"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pago 2 (50% Final)</span>
                                    <span className={`font-semibold ${presupuesto.mp_pago_2_status === "approved" ? "text-green-600" : ""}`}>
                                        {fmt(Math.round(totalMonto - (parseFloat(presupuesto.mp_pago_1_monto) || totalMonto / 2)))}
                                        {presupuesto.mp_pago_2_status === "approved" ? " ✅" : " ⏳"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Issuer info */}
                        {profile && (
                            <>
                                <hr className="my-4" />
                                <div className="text-center text-sm text-muted-foreground">
                                    <p className="font-medium text-foreground">{profile.nombre_empresa || profile.nombre || "NexaBis Tech"}</p>
                                    {(profile.email_empresa || profile.email) && <p>{profile.email_empresa || profile.email}</p>}
                                    {profile.telefono && <p>{profile.telefono}</p>}
                                </div>
                            </>
                        )}

                        {/* Footer */}
                        <div className="text-center pt-4 border-t">
                            <p className="text-[11px] text-muted-foreground/50">
                                Comprobante generado por <span className="font-semibold">NEXABIS TECH</span>
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          .print\\:hidden { display: none !important; }
          .min-h-screen { min-height: auto !important; padding: 0 !important; }
          [data-receipt-card] {
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
          [data-receipt-card] * {
            font-size: 90% !important;
          }
          [data-receipt-header] {
            padding: 20px !important;
          }
          [data-receipt-header] svg {
            width: 40px !important;
            height: 40px !important;
          }
          [data-receipt-header] h1 {
            font-size: 20px !important;
          }
          [data-receipt-amount] {
            padding: 12px 0 !important;
          }
          [data-receipt-amount] p:nth-child(2) {
            font-size: 28px !important;
          }
        }
      `}</style>
        </div>
    );
}
