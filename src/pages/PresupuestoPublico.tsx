import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, FileText, Printer, Download, Moon, Sun } from "lucide-react";

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

      // Enviar webhook a n8n
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
      } catch (webhookError) {
        console.log("Error enviando webhook:", webhookError);
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
    // Create a temporary iframe for printing
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-2xl gradient-text">Cargando presupuesto...</div>
      </div>
    );
  }

  if (!presupuesto) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Presupuesto no encontrado</h1>
          <p className="text-muted-foreground">El enlace puede ser inválido o haber expirado</p>
        </Card>
      </div>
    );
  }

  const simbolo = presupuesto.moneda === "USD" ? "$" : "$";
  const isVencido = new Date(presupuesto.fecha_vencimiento) < new Date();
  const yaRespondido = presupuesto.estado !== "pendiente";

  return (
    <div className={`min-h-screen py-8 px-4 ${darkMode ? 'dark bg-background' : 'bg-gray-50'}`}>
      <div className="container mx-auto max-w-4xl">
        <div className="print:hidden mb-6 flex justify-between items-center">
          <div>
            {profile?.logo_url && (
              <img src={profile.logo_url} alt="Logo" className="h-12" />
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setDarkMode(!darkMode)} 
              variant="outline" 
              size="icon"
              className={darkMode ? 'text-white border-white hover:bg-white/10' : ''}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button 
              onClick={handleDownloadPDF} 
              variant="outline"
              className={darkMode ? 'text-white border-white hover:bg-white/10' : ''}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            <Button 
              onClick={handlePrint} 
              variant="outline"
              className={darkMode ? 'text-white border-white hover:bg-white/10' : ''}
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        <Card className="p-8 space-y-6">
          <div className="flex justify-between items-start border-b border-primary/20 pb-6">
            <div>
              {profile?.logo_url ? (
                <img src={profile.logo_url} alt="Logo" className="h-16 mb-4" />
              ) : (
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-8 h-8 text-primary" />
                  <span className="text-2xl font-bold gradient-text">PRESUPUESTO</span>
                </div>
              )}
              <div className="text-sm space-y-1">
                <p className="font-bold">{profile?.nombre_empresa || profile?.nombre}</p>
                {profile?.direccion && <p>{profile.direccion}</p>}
                {profile?.telefono && <p>{profile.telefono}</p>}
                {profile?.email && <p>{profile.email}</p>}
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-3xl font-bold gradient-text mb-2">{presupuesto.titulo}</h3>
              <p className="text-sm text-muted-foreground">N°: {presupuesto.numero}</p>
              <p className="text-sm text-muted-foreground">
                Fecha: {new Date(presupuesto.fecha).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Válido hasta: {new Date(presupuesto.fecha_vencimiento).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-2">Cliente:</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p className="font-semibold text-foreground">{cliente?.nombre}</p>
              {cliente?.empresa && <p>{cliente.empresa}</p>}
              <p>{cliente?.email}</p>
              {cliente?.telefono && <p>{cliente.telefono}</p>}
            </div>
          </div>

          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left py-3 px-2">Descripción</th>
                  <th className="text-center py-3 px-2">Cantidad</th>
                  <th className="text-right py-3 px-2">Precio Unit.</th>
                  <th className="text-right py-3 px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-primary/10">
                    <td className="py-3 px-2">{item.descripcion}</td>
                    <td className="text-center py-3 px-2">{item.cantidad}</td>
                    <td className="text-right py-3 px-2">
                      {simbolo} {parseFloat(item.precio_unitario).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-2 font-semibold">
                      {simbolo} {parseFloat(item.total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal (sin IVA):</span>
                <span>
                  {simbolo} {Math.round(parseFloat(presupuesto.subtotal)).toLocaleString()}
                </span>
              </div>
              {presupuesto.descuento_total > 0 && (
                <div className="flex justify-between text-warning">
                  <span>Descuento:</span>
                  <span>
                    - {simbolo} {Math.round(parseFloat(presupuesto.descuento_total)).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-accent">
                <span>IVA ({presupuesto.iva_porcentaje}%):</span>
                <span>
                  {simbolo} {Math.round(parseFloat(presupuesto.iva_monto)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-2xl font-bold gradient-text border-t border-primary/20 pt-2">
                <span>TOTAL:</span>
                <span>
                  {simbolo} {Math.round(parseFloat(presupuesto.total)).toLocaleString()} {presupuesto.moneda}
                </span>
              </div>
            </div>
          </div>

          {presupuesto.notas_trabajo && (
            <div className="border-t border-primary/20 pt-4">
              <h4 className="font-bold mb-2">Notas del Trabajo:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{presupuesto.notas_trabajo}</p>
            </div>
          )}

          {presupuesto.forma_pago && (
            <div className="border-t border-primary/20 pt-4">
              <h4 className="font-bold mb-2">Forma de Pago:</h4>
              <p className="text-sm text-muted-foreground">{presupuesto.forma_pago}</p>
            </div>
          )}

          {presupuesto.terminos && (
            <div className="border-t border-primary/20 pt-4">
              <h4 className="font-bold mb-2">Términos y Condiciones:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {presupuesto.terminos}
              </p>
            </div>
          )}

          {yaRespondido && (
            <div
              className={`print:hidden border-t border-primary/20 pt-6 text-center p-4 rounded-lg ${
                presupuesto.estado === "aprobado"
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
                <span className="text-xl font-bold">
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

          {!yaRespondido && (
            <div className="print:hidden border-t border-primary/20 pt-6 space-y-4">
              {isVencido && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-center">
                  <p className="text-yellow-500 font-semibold">Este presupuesto ha vencido</p>
                  <p className="text-sm text-muted-foreground mt-1">
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

              <div className="flex gap-4">
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

        <div className="print:hidden text-center mt-6 text-sm text-muted-foreground">
          Powered by <span className="gradient-text font-bold">NEXABIS TECH</span>
        </div>
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
