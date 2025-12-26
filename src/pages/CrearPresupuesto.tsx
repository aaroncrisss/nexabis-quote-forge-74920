import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClienteStep } from "@/components/presupuesto/ClienteStep";
import { ItemsStep } from "@/components/presupuesto/ItemsStep";
import { TermsStep } from "@/components/presupuesto/TermsStep";
import { PreviewStep } from "@/components/presupuesto/PreviewStep";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

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
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Check if coming from cotizador
  const locationState = location.state as LocationState | null;

  const [presupuesto, setPresupuesto] = useState<PresupuestoData>({
    cliente_id: locationState?.clienteId || "",
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

  // Si viene del cotizador con datos, saltar al paso 2 (items)
  useEffect(() => {
    if (locationState?.fromCotizador && locationState.items && locationState.items.length > 0) {
      // Si ya tiene cliente, ir directo a items
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
    // Los precios de items YA incluyen IVA
    const total_con_iva = presupuesto.items.reduce((sum, item) => sum + item.total, 0);
    let descuento_total = 0;

    if (presupuesto.descuento_tipo === "porcentaje") {
      descuento_total = (total_con_iva * presupuesto.descuento_valor) / 100;
    } else if (presupuesto.descuento_tipo === "fijo") {
      descuento_total = presupuesto.descuento_valor;
    }

    const total_con_descuento = total_con_iva - descuento_total;

    // Extraer el IVA del total (precios incluyen IVA)
    const factor_iva = presupuesto.iva_porcentaje / 100;
    const subtotal_sin_iva = total_con_descuento / (1 + factor_iva);
    const iva_monto = total_con_descuento - subtotal_sin_iva;

    return {
      subtotal: subtotal_sin_iva,
      descuento_total,
      iva_monto,
      total: total_con_descuento
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

      console.log("Enviando payload a Supabase:", payload);

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

      // Enviar webhook a n8n
      try {
        await fetch("https://myn8n.aaroncristech.cloud/webhook/presupuestos-nexabis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            presupuesto_id: presupuestoData.id,
            numero: presupuestoData.numero,
            cliente_id: presupuesto.cliente_id,
            total: total,
            moneda: presupuesto.moneda,
            estado: "pendiente",
            fecha: new Date().toISOString(),
          }),
        });
      } catch (webhookError) {
        console.log("Error enviando webhook:", webhookError);
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
        description: `Código: ${error.code} - Mensaje: ${error.message} - Detalles: ${error.details || 'N/A'}`,
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
    <div className="container mx-auto py-4 md:py-8 px-4 max-w-6xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold gradient-text mb-2">Crear Nuevo Presupuesto</h1>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm md:text-base text-muted-foreground">Complete los pasos para generar su presupuesto profesional</p>
          {presupuesto.proyecto_id && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              🔗 Vinculado al Proyecto
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center mb-6 md:mb-8 gap-1 md:gap-2 overflow-x-auto">
        {steps.map((s, idx) => (
          <div key={s.number} className="flex items-center flex-shrink-0">
            <div
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg transition-all ${step === s.number
                ? "bg-gradient-to-r from-primary via-accent to-warning text-black"
                : step > s.number
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
                }`}
            >
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-background/20 flex items-center justify-center font-bold text-xs md:text-sm">
                {step > s.number ? <Check className="w-3 h-3 md:w-4 md:h-4" /> : s.number}
              </div>
              <span className="font-semibold text-xs md:text-sm hidden sm:inline">{s.title}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="w-6 md:w-12 h-0.5 bg-muted mx-1 md:mx-2" />
            )}
          </div>
        ))}
      </div>

      <Card className="p-4 md:p-6 bg-card/50 backdrop-blur border-primary/20">
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
        {step === 4 && (
          <PreviewStep
            presupuesto={presupuesto}
            totals={calculateTotals()}
          />
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 md:mt-8">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : navigate("/presupuestos")}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step === 1 ? "Cancelar" : "Anterior"}
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
              variant="default"
              className="w-full sm:w-auto"
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              variant="default"
              className="w-full sm:w-auto"
            >
              <Check className="w-4 h-4 mr-2" />
              {loading ? "Creando..." : "Crear Presupuesto"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
