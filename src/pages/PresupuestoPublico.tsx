import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, FileText, Printer, Download, Moon, Sun } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";

export default function PresupuestoPublico() {
  const { token } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [presupuesto, setPresupuesto] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [comentarios, setComentarios] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (token) {
      loadPresupuesto();
    }
  }, [token]);

  const loadPresupuesto = async () => {
    try {
      const { data: presupuestoData, error: presupuestoError } = await supabase
        .from("presupuestos")
        .select("*")
        .eq("token", token)
        .single();

      if (presupuestoError) throw presupuestoError;

      const { data: itemsData } = await supabase
        .from("items_presupuesto")
        .select("*")
        .eq("presupuesto_id", presupuestoData.id)
        .order("orden");

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
      setItems(itemsData || []);
      setCliente(clienteData);
      setProfile(profileData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cargar el presupuesto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (nuevoEstado: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("presupuestos")
        .update({
          estado: nuevoEstado,
          comentarios_cliente: comentarios || null,
        })
        .eq("id", presupuesto.id);

      if (error) throw error;

      try {
        await fetch("https://myn8n.aaroncristech.cloud/webhook/presupuestos-nexabis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            presupuesto_id: presupuesto.id,
            numero: presupuesto.numero,
            estado: nuevoEstado,
            comentarios_cliente: comentarios,
            fecha_respuesta: new Date().toISOString(),
          }),
        });
      } catch {
        // Webhook failure is non-critical
      }

      toast({
        title: nuevoEstado === "aprobado" ? "¡Presupuesto Aprobado!" : "Presupuesto Rechazado",
        description:
          nuevoEstado === "aprobado"
            ? "Gracias por aprobar el presupuesto. Te contactaremos pronto."
            : "Gracias por tu respuesta. Estamos a tu disposición para cualquier consulta.",
      });

      setPresupuesto({ ...presupuesto, estado: nuevoEstado });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo procesar tu respuesta",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const content = document.documentElement.outerHTML;
    const doc = printFrame.contentWindow?.document;

    if (doc) {
      doc.open();
      doc.write(content);
      doc.close();

      setTimeout(() => {
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 100);
      }, 250);
    }
  };

  const fmt = (val: number) => formatCurrency(val, presupuesto?.moneda || "CLP");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl gradient-text">Cargando presupuesto...</div>
      </div>
    );
  }

  if (!presupuesto) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm w-full">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Presupuesto no encontrado</h1>
          <p className="text-muted-foreground">El enlace puede ser inválido o haber expirado</p>
        </Card>
      </div>
    );
  }

  const isVencido = new Date(presupuesto.fecha_vencimiento) < new Date();
  const yaRespondido = presupuesto.estado !== "pendiente";

  return (
    <div className={`min-h-screen py-4 sm:py-8 px-3 sm:px-4 ${darkMode ? 'dark bg-background' : 'bg-gray-50'}`}>
      <div className="container mx-auto max-w-4xl">
        {/* Toolbar */}
        <div className="print:hidden mb-4 sm:mb-6 flex flex-wrap justify-between items-center gap-2">
          <div className="flex-shrink-0">
            {profile?.logo_url && (
              <img src={profile.logo_url} alt="Logo" className="h-10 sm:h-12" />
            )}
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <Button
              onClick={() => setDarkMode(!darkMode)}
              variant="outline"
              size="icon"
              className={`h-9 w-9 ${darkMode ? 'text-white border-white/20 hover:bg-white/10' : ''}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              size="sm"
              className={`h-9 ${darkMode ? 'text-white border-white/20 hover:bg-white/10' : ''}`}
            >
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className={`h-9 ${darkMode ? 'text-white border-white/20 hover:bg-white/10' : ''}`}
            >
              <Printer className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Imprimir</span>
            </Button>
          </div>
        </div>

        <Card className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
          {/* Header: stacked on mobile, side-by-side on desktop */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 border-b border-primary/20 pb-5 sm:pb-6">
            <div className="order-1">
              {profile?.logo_url ? (
                <img src={profile.logo_url} alt="Logo" className="h-12 sm:h-16 mb-3 sm:mb-4" />
              ) : (
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  <span className="text-xl sm:text-2xl font-bold gradient-text">PRESUPUESTO</span>
                </div>
              )}
              <div className="text-sm space-y-1">
                <p className="font-bold">{profile?.nombre_empresa || profile?.nombre}</p>
                {profile?.direccion && <p>{profile.direccion}</p>}
                {profile?.telefono && <p>{profile.telefono}</p>}
                {profile?.email && <p>{profile.email}</p>}
              </div>
            </div>
            <div className="order-2 md:text-right">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-2">{presupuesto.titulo}</h3>
              <p className="text-sm text-muted-foreground">N°: {presupuesto.numero}</p>
              <p className="text-sm text-muted-foreground">
                Fecha: {new Date(presupuesto.fecha).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Válido hasta: {new Date(presupuesto.fecha_vencimiento).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Client info */}
          <div>
            <h4 className="font-bold mb-2">Cliente:</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p className="font-semibold text-foreground">{cliente?.nombre}</p>
              {cliente?.empresa && <p>{cliente.empresa}</p>}
              <p>{cliente?.email}</p>
              {cliente?.telefono && <p>{cliente.telefono}</p>}
            </div>
          </div>

          {/* Items table — horizontally scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[500px] px-4 sm:px-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left py-3 px-2 text-xs sm:text-sm">Descripción</th>
                    <th className="text-center py-3 px-2 text-xs sm:text-sm w-16">Cant.</th>
                    <th className="text-right py-3 px-2 text-xs sm:text-sm w-28">P. Unit.</th>
                    <th className="text-right py-3 px-2 text-xs sm:text-sm w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b border-primary/10">
                      <td className="py-3 px-2 text-xs sm:text-sm">{item.descripcion}</td>
                      <td className="text-center py-3 px-2 text-xs sm:text-sm">{item.cantidad}</td>
                      <td className="text-right py-3 px-2 text-xs sm:text-sm whitespace-nowrap">
                        {fmt(parseFloat(item.precio_unitario))}
                      </td>
                      <td className="text-right py-3 px-2 text-xs sm:text-sm font-semibold whitespace-nowrap">
                        {fmt(parseFloat(item.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals — full width on mobile */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="whitespace-nowrap">{fmt(parseFloat(presupuesto.subtotal))}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Valor Neto:</span>
                <span className="whitespace-nowrap">{fmt(parseFloat(presupuesto.subtotal) * 0.81)}</span>
              </div>
              <div className="flex justify-between text-accent">
                <span>IVA ({presupuesto.iva_porcentaje}%):</span>
                <span className="whitespace-nowrap">{fmt(parseFloat(presupuesto.iva_monto))}</span>
              </div>
              {presupuesto.descuento_total > 0 && (
                <div className="flex justify-between text-warning">
                  <span>Descuento {presupuesto.descuento_tipo === 'porcentaje' ? `(${presupuesto.descuento_valor}%)` : ''}:</span>
                  <span className="whitespace-nowrap">
                    - {fmt(parseFloat(presupuesto.descuento_total))}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg sm:text-2xl font-bold gradient-text border-t border-primary/20 pt-2">
                <span>TOTAL:</span>
                <span className="whitespace-nowrap">
                  {fmt(parseFloat(presupuesto.total))} {presupuesto.moneda}
                </span>
              </div>
            </div>
          </div>

          {/* Work notes, payment, terms */}
          {presupuesto.notas_trabajo && (
            <div className="border-t border-primary/20 pt-4">
              <h4 className="font-bold mb-2 text-sm sm:text-base">Notas del Trabajo:</h4>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">{presupuesto.notas_trabajo}</p>
            </div>
          )}

          {presupuesto.forma_pago && (
            <div className="border-t border-primary/20 pt-4">
              <h4 className="font-bold mb-2 text-sm sm:text-base">Forma de Pago:</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">{presupuesto.forma_pago}</p>
            </div>
          )}

          {presupuesto.terminos && (
            <div className="border-t border-primary/20 pt-4">
              <h4 className="font-bold mb-2 text-sm sm:text-base">Términos y Condiciones:</h4>
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">
                {presupuesto.terminos}
              </p>
            </div>
          )}

          {/* Powered by NEXABIS — inside card footer */}
          <div className="border-t border-primary/10 pt-4 text-center">
            <p className="text-[11px] text-muted-foreground/50">
              Powered by <span className="gradient-text font-semibold">NEXABIS TECH</span>
            </p>
          </div>

          {/* Already responded */}
          {yaRespondido && (
            <div
              className={`print:hidden border-t border-primary/20 pt-6 text-center p-4 rounded-lg ${presupuesto.estado === "aprobado"
                ? "bg-green-500/10 border-green-500/20"
                : "bg-red-500/10 border-red-500/20"
                }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                {presupuesto.estado === "aprobado" ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                <span className="text-lg sm:text-xl font-bold">
                  {presupuesto.estado === "aprobado" ? "Presupuesto Aprobado" : "Presupuesto Rechazado"}
                </span>
              </div>
              {presupuesto.comentarios_cliente && (
                <p className="text-sm text-muted-foreground mt-2">
                  Comentarios: {presupuesto.comentarios_cliente}
                </p>
              )}
            </div>
          )}

          {/* Pending response */}
          {!yaRespondido && (
            <div className="print:hidden border-t border-primary/20 pt-6 space-y-4">
              {isVencido && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 sm:p-4 rounded-lg text-center">
                  <p className="text-yellow-500 font-semibold text-sm sm:text-base">Este presupuesto ha vencido</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Aún puedes responder, pero te recomendamos contactar con nosotros
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Comentarios adicionales (opcional)
                </label>
                <Textarea
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  placeholder="Agrega cualquier comentario o consulta..."
                  rows={3}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={() => handleResponse("aprobado")}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-primary via-secondary to-accent text-white font-semibold hover:opacity-90 transition-all"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Aprobar Presupuesto
                </Button>
                <Button
                  onClick={() => handleResponse("rechazado")}
                  disabled={submitting}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Rechazar
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
