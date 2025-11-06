import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PresupuestoData } from "@/pages/CrearPresupuesto";
import { FileText } from "lucide-react";

interface PreviewStepProps {
  presupuesto: PresupuestoData;
  totals: { subtotal: number; descuento_total: number; iva_monto: number; total: number };
}

export function PreviewStep({ presupuesto, totals }: PreviewStepProps) {
  const [cliente, setCliente] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [presupuesto.cliente_id]);

  const loadData = async () => {
    const { data: clienteData } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", presupuesto.cliente_id)
      .single();

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      setProfile(profileData);
    }

    setCliente(clienteData);
  };

  const simbolo = presupuesto.moneda === "USD" ? "$" : "$";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text mb-4">Paso 4: Vista Previa</h2>
        <p className="text-muted-foreground mb-6">Revise el presupuesto antes de crearlo</p>
      </div>

      <div className="border border-primary/20 rounded-lg p-8 bg-background/50 space-y-6">
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
              <p className="font-bold">{profile?.nombre_empresa || profile?.nombre || "Tu Empresa"}</p>
              {profile?.direccion && <p>{profile.direccion}</p>}
              {profile?.telefono && <p>{profile.telefono}</p>}
              {profile?.email && <p>{profile.email}</p>}
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-3xl font-bold gradient-text mb-2">{presupuesto.titulo}</h3>
            <p className="text-sm text-muted-foreground">Fecha: {new Date().toLocaleDateString()}</p>
            <p className="text-sm text-muted-foreground">
              Válido por {presupuesto.validez_dias} días
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
              {presupuesto.items.map((item, index) => (
                <tr key={index} className="border-b border-primary/10">
                  <td className="py-3 px-2">{item.descripcion}</td>
                  <td className="text-center py-3 px-2">{item.cantidad}</td>
                  <td className="text-right py-3 px-2">
                    {simbolo} {item.precio_unitario.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-2 font-semibold">
                    {simbolo} {item.total.toLocaleString()}
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
                {simbolo} {totals.subtotal.toLocaleString()}
              </span>
            </div>
            {totals.descuento_total > 0 && (
              <div className="flex justify-between text-warning">
                <span>Descuento:</span>
                <span>
                  - {simbolo} {totals.descuento_total.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-accent">
              <span>IVA ({presupuesto.iva_porcentaje}%):</span>
              <span>
                {simbolo} {totals.iva_monto.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-2xl font-bold gradient-text border-t border-primary/20 pt-2">
              <span>TOTAL:</span>
              <span>
                {simbolo} {totals.total.toLocaleString()} {presupuesto.moneda}
              </span>
            </div>
          </div>
        </div>

        {presupuesto.forma_pago && (
          <div className="border-t border-primary/20 pt-4">
            <h4 className="font-bold mb-2">Forma de Pago:</h4>
            <p className="text-sm text-muted-foreground">{presupuesto.forma_pago}</p>
          </div>
        )}

        {presupuesto.terminos && (
          <div className="border-t border-primary/20 pt-4">
            <h4 className="font-bold mb-2">Términos y Condiciones:</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{presupuesto.terminos}</p>
          </div>
        )}
      </div>
    </div>
  );
}
