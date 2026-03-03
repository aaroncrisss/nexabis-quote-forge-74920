import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Sparkles, Wand2, Loader2, DollarSign } from "lucide-react";
import { PresupuestoItem } from "@/pages/CrearPresupuesto";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";

interface ItemsStepProps {
  items: PresupuestoItem[];
  moneda: string;
  descuentoTipo: string | null;
  descuentoValor: number;
  promocionAplicada: string | null;
  onUpdate: (data: any) => void;
  calculateTotals: () => { subtotal: number; descuento_total: number; iva_monto: number; neto?: number; total: number };
}

export function ItemsStep({
  items,
  moneda,
  descuentoTipo,
  descuentoValor,
  promocionAplicada,
  onUpdate,
  calculateTotals,
}: ItemsStepProps) {
  const [promociones, setPromociones] = useState<any[]>([]);
  const { toast } = useToast();

  // AI generation state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // AI Optimization state
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [optimizeTarget, setOptimizeTarget] = useState("");
  const [isOptimizeLoading, setIsOptimizeLoading] = useState(false);

  const { rubro } = useSubscription();

  useEffect(() => {
    loadPromociones();
  }, []);

  const loadPromociones = async () => {
    const { data } = await supabase
      .from("promociones")
      .select("*")
      .eq("activa", true)
      .order("nombre");

    setPromociones(data || []);
  };

  const handlePromocionChange = (value: string) => {
    const simbolo = moneda === "USD" ? "$" : "$";

    if (value === "ninguna") {
      onUpdate({
        promocion_aplicada: null,
        descuento_tipo: null,
        descuento_valor: 0
      });
    } else {
      const promo = promociones.find(p => p.nombre === value);
      if (promo) {
        const { subtotal } = calculateTotals();

        // Validar si cumple el monto mínimo
        if (subtotal < promo.monto_minimo) {
          toast({
            title: "Promoción no aplicable",
            description: `Esta promoción requiere un monto mínimo de ${simbolo} ${promo.monto_minimo.toLocaleString()}`,
            variant: "destructive",
          });
          onUpdate({
            promocion_aplicada: null,
            descuento_tipo: null,
            descuento_valor: 0
          });
          return;
        }

        // Validar fechas de vigencia
        const now = new Date();
        if (promo.fecha_inicio) {
          const inicio = new Date(promo.fecha_inicio);
          if (now < inicio) {
            toast({
              title: "Promoción no disponible",
              description: `Esta promoción estará disponible a partir del ${inicio.toLocaleDateString()}`,
              variant: "destructive",
            });
            onUpdate({
              promocion_aplicada: null,
              descuento_tipo: null,
              descuento_valor: 0
            });
            return;
          }
        }
        if (promo.fecha_fin) {
          const fin = new Date(promo.fecha_fin);
          if (now > fin) {
            toast({
              title: "Promoción expirada",
              description: `Esta promoción expiró el ${fin.toLocaleDateString()}`,
              variant: "destructive",
            });
            onUpdate({
              promocion_aplicada: null,
              descuento_tipo: null,
              descuento_valor: 0
            });
            return;
          }
        }

        onUpdate({
          promocion_aplicada: value,
          descuento_tipo: "porcentaje",
          descuento_valor: promo.descuento_porcentaje
        });
      }
    }
  };

  const addItem = () => {
    onUpdate({
      items: [
        ...items,
        { descripcion: "", cantidad: "", precio_unitario: "", total: "" },
      ],
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];

    if (field === "cantidad" || field === "precio_unitario") {
      // Keep the value as is (including empty string)
      newItems[index] = { ...newItems[index], [field]: value };
      // Calculate total only with numeric values
      const cantidadStr = field === 'cantidad' ? value : String(newItems[index].cantidad || '');
      const precioStr = field === 'precio_unitario' ? value : String(newItems[index].precio_unitario || '');
      const cantidad = cantidadStr === '' ? 0 : (parseFloat(cantidadStr) || 0);
      const precio = precioStr === '' ? 0 : (parseFloat(precioStr) || 0);
      newItems[index].total = cantidad * precio;
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    onUpdate({ items: newItems });
  };

  const removeItem = (index: number) => {
    onUpdate({ items: items.filter((_, i) => i !== index) });
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);

    try {
      const response = await fetch("https://supabase.nexabistech.com/functions/v1/nl_to_items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          moneda,
          rubro: rubro || "tecnologia"
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al procesar");

      if (data.items && Array.isArray(data.items)) {
        // Formatear items
        const newItems = data.items.map((i: any) => ({
          descripcion: i.descripcion,
          cantidad: String(i.cantidad || 1),
          precio_unitario: String(i.precio_unitario || 0),
          total: (i.cantidad || 1) * (i.precio_unitario || 0)
        }));

        onUpdate({
          items: [...items, ...newItems]
        });

        toast({
          title: "Ítems generados",
          description: `Se agregaron ${newItems.length} ítems desde la IA.`,
        });

        setAiPrompt("");
        setIsAiModalOpen(false);
      } else {
        throw new Error("Formato de respuesta inválido");
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar los ítems",
        variant: "destructive"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleOptimizeGenerate = async () => {
    const targetValue = parseFloat(optimizeTarget);
    if (isNaN(targetValue) || targetValue <= 0 || items.length === 0) return;
    setIsOptimizeLoading(true);

    try {
      const response = await fetch("https://supabase.nexabistech.com/functions/v1/optimize_budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          target: targetValue,
          moneda,
          rubro: rubro || "tecnologia"
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al procesar");

      if (data.items && Array.isArray(data.items)) {
        const newItems = data.items.map((i: any) => ({
          descripcion: i.descripcion,
          cantidad: String(i.cantidad || 0),
          precio_unitario: String(i.precio_unitario || 0),
          total: (i.cantidad || 0) * (i.precio_unitario || 0)
        }));

        onUpdate({
          items: newItems
        });

        toast({
          title: "Presupuesto Optimizado",
          description: `Los ítems han sido ajustados al nuevo objetivo.`,
        });

        setOptimizeTarget("");
        setIsOptimizeModalOpen(false);
      } else {
        throw new Error("Formato de respuesta inválido");
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "No se pudo optimizar el presupuesto",
        variant: "destructive"
      });
    } finally {
      setIsOptimizeLoading(false);
    }
  };

  const { subtotal, descuento_total, iva_monto, neto, total } = calculateTotals();
  const simbolo = moneda === "USD" ? "$" : "$";

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold gradient-text mb-3 md:mb-4">Paso 2: Agregar Items</h2>
        <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">Defina los productos o servicios del presupuesto</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4 md:mb-6">
        <div className="flex-1">
          <Label className="text-sm md:text-base">Moneda</Label>
          <Select value={moneda} onValueChange={(value) => onUpdate({ moneda: value })}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLP">CLP (Peso Chileno)</SelectItem>
              <SelectItem value="USD">USD (Dólar)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        {items.map((item, index) => (
          <div key={index} className="p-3 md:p-4 bg-muted/30 rounded-lg border border-primary/10 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5">
                <Label className="text-sm">Descripción</Label>
                <Input
                  value={item.descripcion}
                  onChange={(e) => updateItem(index, "descripcion", e.target.value)}
                  placeholder="Servicio o producto"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm">Cantidad</Label>
                <Input
                  type="number"
                  value={item.cantidad}
                  onChange={(e) => updateItem(index, "cantidad", e.target.value)}
                  placeholder=""
                  min="1"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm">Precio Unit.</Label>
                <Input
                  type="number"
                  value={item.precio_unitario}
                  onChange={(e) => updateItem(index, "precio_unitario", e.target.value)}
                  placeholder=""
                  min="0"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm">Total</Label>
                <Input
                  value={`${simbolo} ${item.total.toLocaleString()}`}
                  disabled
                  className="mt-1 font-bold"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-3 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={addItem} variant="outline" className="flex-1 gradient-border">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Item Manual
            </Button>

            <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  <Sparkles className="w-4 h-4" />
                  Magia IA: Crear desde texto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-indigo-500" />
                    Generador Inteligente de Ítems
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Describe lo que necesitas cotizar</Label>
                    <Textarea
                      placeholder="Ej: Necesito instalar 3 aires acondicionados split y hacer mantenimiento a 2 equipos industriales..."
                      className="min-h-[120px] resize-none focus-visible:ring-indigo-500"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      La IA detectará automáticamente tu rubro (<span className="capitalize">{rubro || 'tecnología'}</span>) y estimará cantidades y precios en {moneda}.
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setIsAiModalOpen(false)}>Cancelar</Button>
                    <Button
                      onClick={handleAiGenerate}
                      disabled={!aiPrompt.trim() || isAiLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 min-w-[150px]"
                    >
                      {isAiLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generar Ítems
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {items.length > 0 && (
              <Dialog open={isOptimizeModalOpen} onOpenChange={setIsOptimizeModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 border-indigo-500 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 gap-2">
                    <DollarSign className="w-4 h-4" />
                    Optimizar Target IA
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      Optimizar Presupuesto
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Presupuesto Objetivo ({moneda})</Label>
                      <Input
                        type="number"
                        placeholder="Ej: 500000"
                        value={optimizeTarget}
                        onChange={(e) => setOptimizeTarget(e.target.value)}
                        className="focus-visible:ring-indigo-500"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        La IA ajustará cantidades, precios o alcance de los ítems actuales para acercarse a este valor.
                      </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="ghost" onClick={() => setIsOptimizeModalOpen(false)}>Cancelar</Button>
                      <Button
                        onClick={handleOptimizeGenerate}
                        disabled={!optimizeTarget || isOptimizeLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                      >
                        {isOptimizeLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Ajustar Ítems"
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-primary/20 pt-4 md:pt-6 space-y-4">
        <div className="space-y-4">
          <div>
            <Label className="text-sm md:text-base">Promoción (Opcional)</Label>
            <Select
              value={promocionAplicada || "ninguna"}
              onValueChange={handlePromocionChange}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Seleccionar promoción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguna">Sin promoción</SelectItem>
                {promociones.map((promo) => (
                  <SelectItem key={promo.id} value={promo.nombre}>
                    {promo.nombre} ({promo.descuento_porcentaje}% off)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {promocionAplicada && promociones.find(p => p.nombre === promocionAplicada) && (
              <p className="text-xs text-muted-foreground mt-1">
                {promociones.find(p => p.nombre === promocionAplicada)?.descripcion}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm md:text-base">Tipo de Descuento Adicional</Label>
              <Select
                value={descuentoTipo || "ninguno"}
                onValueChange={(value) =>
                  onUpdate({ descuento_tipo: value === "ninguno" ? null : value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Sin descuento</SelectItem>
                  <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                  <SelectItem value="fijo">Valor fijo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {descuentoTipo && descuentoTipo !== "ninguno" && (
              <div className="flex-1">
                <Label className="text-sm md:text-base">Valor del Descuento</Label>
                <Input
                  type="number"
                  value={descuentoValor}
                  onChange={(e) => onUpdate({ descuento_valor: parseFloat(e.target.value) || 0 })}
                  placeholder={descuentoTipo === "porcentaje" ? "10" : "5000"}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-warning/10 p-4 md:p-6 rounded-lg space-y-2">
          <div className="flex justify-between text-base md:text-lg">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-bold">
              {simbolo} {Math.round(subtotal).toLocaleString()}
            </span>
          </div>
          {neto !== undefined && (
            <div className="flex justify-between text-base md:text-lg text-muted-foreground">
              <span>Valor Neto:</span>
              <span className="font-bold">
                {simbolo} {Math.round(neto).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between text-base md:text-lg text-accent">
            <span>IVA (19%):</span>
            <span className="font-bold">
              {simbolo} {Math.round(iva_monto).toLocaleString()}
            </span>
          </div>
          {descuento_total > 0 && (
            <div className="flex justify-between text-base md:text-lg text-warning">
              <span>Descuento {descuentoTipo === 'porcentaje' ? `(${descuentoValor}%)` : ''}:</span>
              <span className="font-bold">
                - {simbolo} {Math.round(descuento_total).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xl md:text-2xl border-t border-primary/20 pt-2">
            <span className="gradient-text font-bold">TOTAL:</span>
            <span className="gradient-text font-bold">
              {simbolo} {Math.round(total).toLocaleString()} {moneda}
            </span>
          </div>
          {moneda === "CLP" && (
            <p className="text-xs text-muted-foreground text-right pt-1">
              ≈ USD ${(total / 950).toFixed(2)} (aprox.)
            </p>
          )}
          {moneda === "USD" && (
            <p className="text-xs text-muted-foreground text-right pt-1">
              ≈ ${(total * 950).toLocaleString()} CLP (aprox.)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
