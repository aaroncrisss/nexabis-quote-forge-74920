import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Eye, Trash2 } from "lucide-react";

const Presupuestos = () => {
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresupuestos();
  }, []);

  const loadPresupuestos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("presupuestos")
        .select("*, clientes(nombre, empresa)")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });

      setPresupuestos(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      pendiente: <Badge className="bg-primary">Pendiente</Badge>,
      aprobado: <Badge className="bg-accent text-accent-foreground">Aprobado</Badge>,
      rechazado: <Badge variant="destructive">Rechazado</Badge>,
      vencido: <Badge variant="secondary">Vencido</Badge>,
    };
    return badges[estado as keyof typeof badges] || null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-heading font-bold gradient-text">Presupuestos</h1>
          <Link to="/crear">
            <Button className="bg-gradient-nexabis">Crear Nuevo</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : presupuestos.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No hay presupuestos aún</p>
            <Link to="/crear">
              <Button className="bg-gradient-nexabis">Crear tu primer presupuesto</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {presupuestos.map((p) => (
              <Card key={p.id} className="p-6 bg-card/50 border-border hover-glow transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-heading font-bold text-lg">{p.numero}</h3>
                      {getEstadoBadge(p.estado)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Cliente: {p.clientes?.empresa || p.clientes?.nombre}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Fecha: {new Date(p.fecha).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-2xl font-heading font-bold gradient-text">
                      {p.moneda} ${Number(p.total).toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Presupuestos;
