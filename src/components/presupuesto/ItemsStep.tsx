import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { PresupuestoItem } from "@/pages/CrearPresupuesto";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ItemsStepProps {
  items: PresupuestoItem[];
  moneda: string;
  descuentoTipo: string | null;
  descuentoValor: number;
  promocionAplicada: string | null;
  onUpdate: (data: any) => void;
  calculateTotals: () => { subtotal: number; descuento_total: number; iva_monto: number; total: number };
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
        { descripcion: "", cantidad: 1, precio_unitario: "", total: 0 },
      ],
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "cantidad" || field === "precio_unitario") {
      const cantidad = newItems[index].cantidad;
      const precio = parseFloat(String(newItems[index].precio_unitario)) || 0;
      newItems[index].total = cantidad * precio;
    }

    onUpdate({ items: newItems });
  };

  const removeItem = (index: number) => {
    onUpdate({ items: items.filter((_, i) => i !== index) });
  };

  const { subtotal, descuento_total, iva_monto, total } = calculateTotals();
  const simbolo = moneda === "USD" ? "$" : "$";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text mb-4">Paso 2: Agregar Items</h2>
        <p className="text-muted-foreground mb-6">Defina los productos o servicios del presupuesto</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Label>Moneda</Label>
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

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="p-4 bg-muted/30 rounded-lg border border-primary/10 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5">
                <Label>Descripción</Label>
                <Input
                  value={item.descripcion}
                  onChange={(e) => updateItem(index, "descripcion", e.target.value)}
                  placeholder="Servicio o producto"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={item.cantidad}
                  onChange={(e) => updateItem(index, "cantidad", parseFloat(e.target.value) || 0)}
                  min="1"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Precio Unit.</Label>
                <Input
                  type="number"
                  value={item.precio_unitario}
                  onChange={(e) => updateItem(index, "precio_unitario", parseFloat(e.target.value) || 0)}
                  min="0"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Total</Label>
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

        <Button onClick={addItem} variant="outline" className="w-full gradient-border">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Item
        </Button>
      </div>

      <div className="border-t border-primary/20 pt-6 space-y-4">
        <div className="space-y-4">
          <div>
            <Label>Promoción (Opcional)</Label>
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

          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Tipo de Descuento Adicional</Label>
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
                <Label>Valor del Descuento</Label>
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

        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-warning/10 p-6 rounded-lg space-y-2">
          <div className="flex justify-between text-lg">
            <span className="text-muted-foreground">Subtotal (sin IVA):</span>
            <span className="font-bold">
              {simbolo} {Math.round(subtotal).toLocaleString()}
            </span>
          </div>
          {descuento_total > 0 && (
            <div className="flex justify-between text-lg text-warning">
              <span>Descuento:</span>
              <span className="font-bold">
                - {simbolo} {Math.round(descuento_total).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between text-lg text-accent">
            <span>IVA (19%):</span>
            <span className="font-bold">
              {simbolo} {Math.round(iva_monto).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-2xl border-t border-primary/20 pt-2">
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
