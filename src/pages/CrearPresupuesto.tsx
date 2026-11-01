import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClienteStep } from "@/components/presupuesto/ClienteStep";
import { ItemsStep } from "@/components/presupuesto/ItemsStep";
import { TermsStep } from "@/components/presupuesto/TermsStep";
import { PreviewStep } from "@/components/presupuesto/PreviewStep";
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Sparkles, FileText } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import DashboardLayout from "@/components/DashboardLayout";

export interface PresupuestoItem {
  descripcion: string;
  cantidad: number;
  precio_unitario: number | string;
  total: number;
}

export interface PresupuestoData {
  cliente_id: string;
  titulo: string;
  items: PresupuestoItem[];
  moneda: string;
  descuento_tipo: string | null;
  descuento_valor: number;
  validez_dias: number;
  forma_pago: string;
  terminos: string;
  notas_trabajo: string;
  iva_porcentaje: number;
  modo_impresion: string;
  promocion_aplicada: string | null;
  proyecto_id?: string | null;
}

interface LocationState {
  fromCotizador?: boolean;
  clienteId?: string;
  proyectoId?: string;
  titulo?: string;
  items?: PresupuestoItem[];
  descripcion?: string;
}

export default function CrearPresupuesto() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { canCreate, getBlockMessage, loading: subLoading } = useSubscription();

  const locationState = location.state as LocationState | null;
  const initialClienteId = searchParams.get("clienteId") || locationState?.clienteId || "";

  const [presupuesto, setPresupuesto] = useState<PresupuestoData>({
    cliente_id: initialClienteId,
    titulo: locationState?.titulo || "",
    items: locationState?.items || [],
    moneda: "CLP",
    descuento_tipo: null,
    descuento_valor: 0,
    validez_dias: 15,
    forma_pago: "50% anticipo, 50% contra entrega",
    terminos: "",
    notas_trabajo: locationState?.descripcion || "",
    iva_porcentaje: 19,
    modo_impresion: "dark",
    promocion_aplicada: null,
    proyecto_id: locationState?.proyectoId || null,
  });

  useEffect(() => {
    if (locationState?.fromCotizador && locationState.items && locationState.items.length > 0) {
      if (locationState.clienteId) {
        setStep(2);
      }
      toast({
        title: "Datos importados del cotizador",
        description: "Puedes editar los items y precios antes de continuar",
      });
    }
  }, []);

  const updatePresupuesto = (data: Partial<PresupuestoData>) => {
    setPresupuesto((prev) => ({ ...prev, ...data }));
  };

  const calculateTotals = () => {
    const subtotal = presupuesto.items.reduce((sum, item) => sum + item.total, 0);
    let descuento_total = 0;

    if (presupuesto.descuento_tipo === "porcentaje") {
      descuento_total = (subtotal * presupuesto.descuento_valor) / 100;
    } else if (presupuesto.descuento_tipo === "fijo") {
      descuento_total = presupuesto.descuento_valor;
    }

    const iva_monto = subtotal * 0.19;
    const neto = subtotal * 0.81;
    const total = subtotal - descuento_total;

    return {
      subtotal,
      descuento_total,
      iva_monto,
      neto,
      total,
    };
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("No autenticado");

      const { subtotal, descuento_total, iva_monto, total } = calculateTotals();

      const payload = {
        usuario_id: userData.user.id,
        cliente_id: presupuesto.cliente_id,
        titulo: presupuesto.titulo,
        numero: `NEX-${Date.now().toString().slice(-6)}`,
        moneda: presupuesto.moneda,
        subtotal,
        descuento_tipo: presupuesto.descuento_tipo,
        descuento_valor: presupuesto.descuento_valor || 0,
        descuento_total,
        iva_porcentaje: presupuesto.iva_porcentaje,
        iva_monto,
        total,
        validez_dias: presupuesto.validez_dias,
        forma_pago: presupuesto.forma_pago,
        terminos: presupuesto.terminos,
        notas_trabajo: presupuesto.notas_trabajo,
        estado: "pendiente",
        modo_impresion: presupuesto.modo_impresion,
        promocion_aplicada: presupuesto.promocion_aplicada,
        proyecto_id: presupuesto.proyecto_id || null,
      };

      const { data: presupuestoData, error: presupuestoError } = await supabase
        .from("presupuestos")
        .insert([payload])
        .select()
        .single();

      if (presupuestoError) throw presupuestoError;

      const itemsToInsert = presupuesto.items.map((item, index) => ({
        presupuesto_id: presupuestoData.id,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: parseFloat(String(item.precio_unitario)) || 0,
        total: item.total,
        orden: index,
      }));

      const { error: itemsError } = await supabase
        .from("items_presupuesto")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      try {
        const { data: cliData } = await supabase
          .from("clientes")
          .select("nombre, empresa, telefono, email")
          .eq("id", presupuesto.cliente_id)
          .maybeSingle();

        await fetch("https://myn8n.aaroncristech.cloud/webhook/presupuestos-nexabis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            presupuesto_id: presupuestoData.id,
            numero: presupuestoData.numero,
            titulo: presupuestoData.titulo,
            cliente_id: presupuesto.cliente_id,
            cliente: cliData || null,
            cliente_nombre: cliData?.nombre || "",
            cliente_telefono: cliData?.telefono || "",
            total: total,
            moneda: presupuesto.moneda,
            estado: "pendiente",
            link_publico: `${window.location.origin}/presupuesto/${presupuestoData.token}`,
            enviar_whatsapp_cliente: true,
            fecha: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        // Webhook failure is non-critical, silently ignore
      }

      toast({
        title: "¡Presupuesto creado!",
        description: "El presupuesto se ha guardado exitosamente.",
      });

      navigate("/presupuestos");
    } catch (error: any) {
      console.error("Error completo al guardar:", error);
      toast({
        title: "Error al guardar (Detalles Técnicos)",
        description: `Código: ${error.code} - Mensaje: ${error.message} - Detalles: ${error.details || "N/A"}`,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setLoading(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return presupuesto.cliente_id && presupuesto.titulo;
    if (step === 2) return presupuesto.items.length > 0;
    if (step === 3) return presupuesto.validez_dias > 0;
    return true;
  };

  const steps = [
    { number: 1, title: "Cliente" },
    { number: 2, title: "Items" },
    { number: 3, title: "Términos" },
    { number: 4, title: "Vista Previa" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Subscription Gate */}
        {!subLoading && !canCreate && (
          <Card className="p-4 border-destructive/50 bg-destructive/10">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-heading font-semibold text-destructive">
                  No puedes crear presupuestos
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{getBlockMessage()}</p>
              </div>
              <Link to="/suscripcion">
                <Button size="sm" className="h-8 text-xs px-3 gradient-button gap-1.5 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  Mejorar Plan
                </Button>
              </Link>
            </div>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg md:text-xl font-heading font-bold gradient-text flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Crear Nuevo Presupuesto
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">
                Completa los pasos para generar tu presupuesto profesional
              </p>
              {presupuesto.proyecto_id && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-400">
                  🔗 Vinculado al Proyecto
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 md:gap-2 overflow-x-auto py-1">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center flex-shrink-0">
              <div
                className={`flex items-center gap-1.5 px-2.5 md:px-3.5 py-1.5 rounded-lg transition-all text-xs ${
                  step === s.number
                    ? "bg-gradient-to-r from-primary via-secondary to-accent text-white font-semibold shadow-sm"
                    : step > s.number
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center font-bold text-[11px]">
                  {step > s.number ? <Check className="w-3 h-3" /> : s.number}
                </div>
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {idx < steps.length - 1 && <div className="w-4 md:w-10 h-0.5 bg-muted mx-1" />}
            </div>
          ))}
        </div>

        <Card className="p-4 bg-card/60 backdrop-blur border-primary/20 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
          {step === 1 && (
            <ClienteStep
              clienteId={presupuesto.cliente_id}
              titulo={presupuesto.titulo}
              onUpdate={updatePresupuesto}
            />
          )}
          {step === 2 && (
            <ItemsStep
              items={presupuesto.items}
              moneda={presupuesto.moneda}
              descuentoTipo={presupuesto.descuento_tipo}
              descuentoValor={presupuesto.descuento_valor}
              promocionAplicada={presupuesto.promocion_aplicada}
              onUpdate={updatePresupuesto}
              calculateTotals={calculateTotals}
            />
          )}
          {step === 3 && (
            <TermsStep
              validezDias={presupuesto.validez_dias}
              formaPago={presupuesto.forma_pago}
              terminos={presupuesto.terminos}
              notasTrabajo={presupuesto.notas_trabajo}
              onUpdate={updatePresupuesto}
            />
          )}
          {step === 4 && <PreviewStep presupuesto={presupuesto} totals={calculateTotals()} />}

          <div className="flex flex-col sm:flex-row justify-between gap-2.5 mt-5 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => (step > 1 ? setStep(step - 1) : navigate("/presupuestos"))}
              disabled={loading}
              className="h-8 text-xs w-full sm:w-auto gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {step === 1 ? "Cancelar" : "Anterior"}
            </Button>

            {step < 4 ? (
              <Button
                size="sm"
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext()}
                className="h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5 w-full sm:w-auto"
              >
                Siguiente
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={loading}
                className="h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5 w-full sm:w-auto"
              >
                <Check className="w-3.5 h-3.5" />
                {loading ? "Creando..." : "Crear Presupuesto"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
