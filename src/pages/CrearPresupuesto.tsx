import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  iva_porcentaje: number;
  modo_impresion: string;
  promocion_aplicada: string | null;
}

export default function CrearPresupuesto() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [presupuesto, setPresupuesto] = useState<PresupuestoData>({
    cliente_id: "",
    titulo: "",
    items: [],
    moneda: "CLP",
    descuento_tipo: null,
    descuento_valor: 0,
    validez_dias: 15,
    forma_pago: "50% anticipo, 50% contra entrega",
    terminos: "",
    iva_porcentaje: 19,
    modo_impresion: "dark",
    promocion_aplicada: null,
  });

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

      const { data: presupuestoData, error: presupuestoError } = await supabase
        .from("presupuestos")
        .insert([{
          usuario_id: userData.user.id,
          cliente_id: presupuesto.cliente_id,
          titulo: presupuesto.titulo,
          numero: "", // El trigger lo generará automáticamente
          moneda: presupuesto.moneda,
          subtotal,
          descuento_tipo: presupuesto.descuento_tipo,
          descuento_valor: presupuesto.descuento_valor,
          descuento_total,
          iva_porcentaje: presupuesto.iva_porcentaje,
          iva_monto,
          total,
          validez_dias: presupuesto.validez_dias,
          forma_pago: presupuesto.forma_pago,
          terminos: presupuesto.terminos,
          estado: "pendiente",
          modo_impresion: presupuesto.modo_impresion,
          promocion_aplicada: presupuesto.promocion_aplicada,
        }])
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Crear Nuevo Presupuesto</h1>
        <p className="text-muted-foreground">Complete los pasos para generar su presupuesto profesional</p>
      </div>

      <div className="flex items-center justify-center mb-8 gap-2">
        {steps.map((s, idx) => (
          <div key={s.number} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                step === s.number
                  ? "bg-gradient-to-r from-primary via-accent to-warning text-black"
                  : step > s.number
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center font-bold">
                {step > s.number ? <Check className="w-4 h-4" /> : s.number}
              </div>
              <span className="font-semibold hidden sm:inline">{s.title}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="w-12 h-0.5 bg-muted mx-2" />
            )}
          </div>
        ))}
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
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
            onUpdate={updatePresupuesto}
          />
        )}
        {step === 4 && (
          <PreviewStep
            presupuesto={presupuesto}
            totals={calculateTotals()}
          />
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : navigate("/presupuestos")}
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step === 1 ? "Cancelar" : "Anterior"}
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
              variant="default"
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              variant="default"
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
