import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, Copy, Plus, Search, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Presupuestos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [filteredPresupuestos, setFilteredPresupuestos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadPresupuestos();
  }, []);

  useEffect(() => {
    filterPresupuestos();
  }, [presupuestos, searchTerm, estadoFilter]);

  const filterPresupuestos = () => {
    let filtered = [...presupuestos];

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (estadoFilter !== "todos") {
      filtered = filtered.filter((p) => p.estado === estadoFilter);
    }

    setFilteredPresupuestos(filtered);
  };

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

  const handleDuplicate = async (presupuesto: any) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: newPresupuesto, error: presupuestoError } = await supabase
        .from("presupuestos")
        .insert([{
          usuario_id: userData.user.id,
          cliente_id: presupuesto.cliente_id,
          titulo: `${presupuesto.titulo} (Copia)`,
          numero: "TEMP",
          moneda: presupuesto.moneda,
          subtotal: presupuesto.subtotal,
          descuento_tipo: presupuesto.descuento_tipo,
          descuento_valor: presupuesto.descuento_valor,
          descuento_total: presupuesto.descuento_total,
          total: presupuesto.total,
          validez_dias: presupuesto.validez_dias,
          forma_pago: presupuesto.forma_pago,
          terminos: presupuesto.terminos,
          estado: "pendiente",
        }])
        .select()
        .single();

      if (presupuestoError) throw presupuestoError;

      const { data: items } = await supabase
        .from("items_presupuesto")
        .select("*")
        .eq("presupuesto_id", presupuesto.id);

      if (items && items.length > 0) {
        const newItems = items.map((item: any) => ({
          presupuesto_id: newPresupuesto.id,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          total: item.total,
          orden: item.orden,
        }));

        await supabase.from("items_presupuesto").insert(newItems);
      }

      toast({
        title: "¡Presupuesto duplicado!",
        description: "El presupuesto se ha duplicado exitosamente",
      });

      loadPresupuestos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("presupuestos")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto se ha eliminado correctamente",
      });

      loadPresupuestos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/presupuesto/${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "¡Enlace copiado!",
      description: "El enlace del presupuesto se ha copiado al portapapeles",
    });
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
          <div className="flex-1">
            <h1 className="text-4xl font-bold gradient-text">Presupuestos</h1>
            <p className="text-muted-foreground">Gestiona todos tus presupuestos</p>
          </div>
          <Button onClick={() => navigate("/crear")} variant="default" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Crear Nuevo
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por cliente, número o título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="aprobado">Aprobado</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : filteredPresupuestos.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchTerm || estadoFilter !== "todos" ? "No se encontraron presupuestos" : "No hay presupuestos aún"}
            </p>
            <Button onClick={() => navigate("/crear")} variant="default">
              Crear tu primer presupuesto
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPresupuestos.map((p) => (
              <Card key={p.id} className="p-6 bg-card/50 border-primary/20 hover-glow transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg">{p.numero}</h3>
                      {getEstadoBadge(p.estado)}
                    </div>
                    <p className="font-semibold">{p.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {p.clientes?.empresa || p.clientes?.nombre}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Fecha: {new Date(p.fecha).toLocaleDateString()} | Vence: {new Date(p.fecha_vencimiento).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right space-y-3">
                    <p className="text-2xl font-bold gradient-text">
                      {p.moneda === "USD" ? "$" : "$"} {Number(p.total).toLocaleString()} {p.moneda}
                    </p>
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyLink(p.token)}
                        title="Copiar enlace"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/presupuesto/${p.token}`, "_blank")}
                        title="Ver presupuesto"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicate(p)}
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteId(p.id)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El presupuesto y todos sus items serán eliminados permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      </DashboardLayout>
    );
  };

export default Presupuestos;
