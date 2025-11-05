import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/browserClient";

interface TermsStepProps {
  validezDias: number;
  formaPago: string;
  terminos: string;
  onUpdate: (data: any) => void;
}

export function TermsStep({ validezDias, formaPago, terminos, onUpdate }: TermsStepProps) {
  useEffect(() => {
    loadDefaultTerminos();
  }, []);

  const loadDefaultTerminos = async () => {
    if (terminos) return; // Ya tiene términos personalizados

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plantilla_tyc")
      .eq("id", userData.user.id)
      .single();

    if (profile?.plantilla_tyc) {
      onUpdate({ terminos: profile.plantilla_tyc });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text mb-4">Paso 3: Términos y Condiciones</h2>
        <p className="text-muted-foreground mb-6">Configure la validez y condiciones del presupuesto</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="validez">Validez del Presupuesto (días)</Label>
          <Input
            id="validez"
            type="number"
            value={validezDias}
            onChange={(e) => onUpdate({ validez_dias: parseInt(e.target.value) || 15 })}
            min="1"
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            El presupuesto será válido por {validezDias} días desde su creación
          </p>
        </div>

        <div>
          <Label htmlFor="forma_pago">Forma de Pago</Label>
          <Input
            id="forma_pago"
            value={formaPago}
            onChange={(e) => onUpdate({ forma_pago: e.target.value })}
            placeholder="50% anticipo, 50% contra entrega"
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="terminos">Términos y Condiciones</Label>
          <Textarea
            id="terminos"
            value={terminos}
            onChange={(e) => onUpdate({ terminos: e.target.value })}
            placeholder="Los presupuestos son válidos por el tiempo especificado. Se requiere anticipo del 50% para comenzar el proyecto."
            rows={6}
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Estos términos aparecerán en el presupuesto enviado al cliente
          </p>
        </div>
      </div>
    </div>
  );
}
