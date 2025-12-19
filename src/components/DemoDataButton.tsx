import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Database } from "lucide-react";
import { useState } from "react";

export function DemoDataButton() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCreateDemoData = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("No hay sesión activa");
      }

      const response = await supabase.functions.invoke("seed-demo-data", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "¡Datos demo creados!",
        description: "Se han generado 8 clientes y 15 presupuestos de ejemplo",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
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

  return (
    <Button
      onClick={handleCreateDemoData}
      disabled={loading}
      className="bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground font-semibold hover:opacity-90 transition-all hover:shadow-lg"
    >
      <Database className="w-4 h-4 mr-2" />
      {loading ? "Creando datos..." : "Generar Datos Demo"}
    </Button>
  );
}
