import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Trash2,
  Copy,
  Plus,
  Search,
  ExternalLink,
  Grid3x3,
  List,
  ArchiveRestore,
  KanbanSquare,
  FileText,
  CheckCircle2,
  Clock,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { KanbanBoard } from "@/components/presupuesto/KanbanBoard";
import { EmptyState } from "@/components/ui/empty-state";
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
  const [viewMode, setViewMode] = useState<"grid" | "list" | "kanban">("grid");
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
      filtered = filtered.filter(
        (p) =>
          p.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.clientes?.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (estadoFilter !== "todos") {
      filtered = filtered.filter((p) => p.estado === estadoFilter);
    }

    setFilteredPresupuestos(filtered);
  };

  const loadPresupuestos = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
        .insert([
          {
            usuario_id: userData.user.id,
            cliente_id: presupuesto.cliente_id,
            titulo: `${presupuesto.titulo} (Copia)`,
            numero: "", // Dispara trigger generate_presupuesto_numero en Postgres
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
          },
        ])
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

  const handleConvertToProject = async (presupuesto: any) => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: items, error: itemsError } = await supabase
        .from("items_presupuesto")
        .select("*")
        .eq("presupuesto_id", presupuesto.id);

      if (itemsError) throw itemsError;

      const totalHoras = items?.reduce((acc, item) => acc + (item.cantidad || 0), 0) || 0;
      const costoHoraImplicito = totalHoras > 0 ? presupuesto.total / totalHoras : 0;

      const { data: proyecto, error: projError } = await supabase
        .from("proyectos")
        .insert([
          {
            usuario_id: userData.user.id,
            cliente_id: presupuesto.cliente_id,
            nombre: presupuesto.titulo,
            descripcion: `Proyecto generado a partir del presupuesto #${presupuesto.numero || "S/N"}`,
            tipo: "Web",
            presupuesto_cliente: presupuesto.total,
            estado: "activo",
          },
        ])
        .select()
        .single();

      if (projError) throw projError;

      const { data: estimacion, error: estError } = await supabase
        .from("estimaciones")
        .insert([
          {
            proyecto_id: proyecto.id,
            titulo: "Estimación Base (Desde Presupuesto)",
            total_horas: totalHoras,
            costo_total: presupuesto.total,
            costo_hora: costoHoraImplicito,
            es_elegida: true,
            complejidad: "media",
            nivel_confianza: "alto",
          },
        ])
        .select()
        .single();

      if (estError) throw estError;

      if (items && items.length > 0) {
        const modulos = items.map((item) => ({
          estimacion_id: estimacion.id,
          nombre: item.descripcion,
          descripcion: `Item del presupuesto: ${item.descripcion}`,
          horas_estimadas: item.cantidad || 0,
          prioridad: 2,
          estado: "pendiente",
        }));

        const { error: modError } = await supabase.from("modulos_estimacion").insert(modulos);
        if (modError) throw modError;
      }

      const { error: updateError } = await supabase
        .from("presupuestos")
        .update({ proyecto_id: proyecto.id })
        .eq("id", presupuesto.id);

      if (updateError) throw updateError;

      toast({
        title: "¡Proyecto Creado!",
        description: "El presupuesto se ha convertido en proyecto correctamente.",
      });

      navigate(`/proyectos/${proyecto.id}`);
    } catch (error: any) {
      console.error("Error converting to project:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (filteredPresupuestos.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay presupuestos para exportar con los filtros actuales.",
      });
      return;
    }
    const headers = ["Número", "Título", "Cliente", "Total", "Moneda", "Estado", "Fecha", "Vencimiento"];
    const rows = filteredPresupuestos.map((p) => [
      `"${p.numero || ""}"`,
      `"${(p.titulo || "").replace(/"/g, '""')}"`,
      `"${(p.clientes?.empresa || p.clientes?.nombre || "").replace(/"/g, '""')}"`,
      p.total || 0,
      `"${p.moneda || "CLP"}"`,
      `"${p.estado || "pendiente"}"`,
      `"${p.fecha || ""}"`,
      `"${p.fecha_vencimiento || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexabis-presupuestos-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Exportación completada",
      description: "Se ha descargado el archivo CSV con tus presupuestos.",
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      // 1. Desvincular facturas y pagos asociados a este presupuesto
      await supabase.from("facturas").update({ presupuesto_id: null }).eq("presupuesto_id", deleteId);
      await supabase.from("pagos").update({ presupuesto_id: null }).eq("presupuesto_id", deleteId);

      // 2. Eliminar items de este presupuesto
      await supabase.from("items_presupuesto").delete().eq("presupuesto_id", deleteId);

      // 3. Eliminar el presupuesto
      const { error } = await supabase.from("presupuestos").delete().eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto y sus items se han eliminado correctamente",
      });

      loadPresupuestos();
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message || "Verifica dependencias del presupuesto",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setPresupuestos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, estado: newStatus } : p))
      );

      const { error } = await supabase
        .from("presupuestos")
        .update({ estado: newStatus })
        .eq("id", id);

      if (error) {
        loadPresupuestos();
        throw error;
      }

      toast({
        title: "Estado actualizado",
        description: `El presupuesto ha sido movido a ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
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
      pendiente: <Badge className="bg-primary text-[10px] h-5">Pendiente</Badge>,
      aprobado: <Badge className="bg-accent text-accent-foreground text-[10px] h-5">Aprobado</Badge>,
      rechazado: (
        <Badge variant="destructive" className="text-[10px] h-5">
          Rechazado
        </Badge>
      ),
      vencido: (
        <Badge variant="secondary" className="text-[10px] h-5">
          Vencido
        </Badge>
      ),
    };
    return badges[estado as keyof typeof badges] || null;
  };

  const totalPresupuestos = presupuestos.length;
  const aprobadosCount = presupuestos.filter((p) => p.estado === "aprobado").length;
  const pendientesCount = presupuestos.filter((p) => p.estado === "pendiente").length;

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-heading font-bold gradient-text flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Presupuestos
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Gestiona todos tus presupuestos</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={exportToCsv}
              className="h-8 text-xs px-3 border-border/80 hover:bg-card flex-1 sm:flex-none gap-1.5"
              title="Exportar presupuestos a CSV"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              Exportar CSV
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/crear")}
              className="h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5 flex-1 sm:flex-none"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear Nuevo
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-3.5 border-primary/20 bg-primary/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Total Presupuestos
                </p>
                <p className="text-lg md:text-xl font-bold font-mono">{totalPresupuestos}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-emerald-500/20 bg-emerald-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Aprobados
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-emerald-400">
                  {aprobadosCount}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-amber-500/20 bg-amber-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Pendientes
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-amber-400">
                  {pendientesCount}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
            <Input
              placeholder="Buscar por número, empresa o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-xs md:text-sm"
            />
          </div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-full sm:w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="aprobado">Aprobado</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1.5">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
              title="Vista de cuadrícula"
            >
              <Grid3x3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
              title="Vista de lista"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("kanban")}
              title="Vista Kanban"
            >
              <KanbanSquare className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-muted-foreground">Cargando presupuestos...</div>
        ) : filteredPresupuestos.length === 0 ? (
          searchTerm || estadoFilter !== "todos" ? (
            <EmptyState
              icon={Search}
              title="Sin presupuestos encontrados"
              description={`No hay presupuestos que coincidan con "${searchTerm || estadoFilter}". Prueba a cambiar los filtros o el término de búsqueda.`}
              actionLabel="Restablecer filtros"
              onAction={() => {
                setSearchTerm("");
                setEstadoFilter("todos");
              }}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="Aún no has generado presupuestos"
              description="Crea propuestas comerciales transparentes y de alto impacto para tus clientes o genéralas con el cotizador inteligente."
              actionLabel="Crear mi primer presupuesto"
              onAction={() => navigate("/crear")}
              secondaryActionLabel="Ir al Cotizador"
              onSecondaryAction={() => navigate("/cotizador")}
            />
          )
        ) : viewMode === "grid" ? (
          <div className="space-y-3">
            {filteredPresupuestos.map((p) => (
              <Card
                key={p.id}
                className="p-4 bg-card/60 border-border/60 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold font-mono text-sm md:text-base">{p.numero}</h3>
                      {getEstadoBadge(p.estado)}
                    </div>
                    <p className="font-semibold text-sm">{p.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      Cliente: {p.clientes?.empresa || p.clientes?.nombre} · Fecha:{" "}
                      {p.fecha ? new Date(p.fecha).toLocaleDateString("es-CL") : "Hoy"} | Vence:{" "}
                      {p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString("es-CL") : "Sin vencimiento"}
                    </p>
                  </div>
                  <div className="flex lg:flex-col items-center lg:items-end justify-between gap-2 w-full lg:w-auto">
                    <p className="text-base md:text-lg font-bold font-mono gradient-text">
                      ${Number(p.total).toLocaleString()} {p.moneda}
                    </p>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => copyLink(p.token)}
                        title="Copiar enlace"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => window.open(`/presupuesto/${p.token}`, "_blank")}
                        title="Ver presupuesto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 hidden sm:inline-flex"
                        onClick={() => handleDuplicate(p)}
                        title="Duplicar"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      {!p.proyecto_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConvertToProject(p)}
                          title="Convertir a Proyecto"
                          className="h-7 w-7 p-0 hidden sm:inline-flex text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        >
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteId(p.id)}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-2 overflow-x-auto">
            <div className="min-w-[700px]">
              {filteredPresupuestos.map((p) => (
                <Card
                  key={p.id}
                  className="p-3.5 bg-card/60 border-border/60 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)] mb-2"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="min-w-[100px]">
                        <p className="text-[11px] text-muted-foreground">Número</p>
                        <p className="font-mono font-semibold text-xs md:text-sm">{p.numero}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-muted-foreground">Título</p>
                        <p className="font-semibold text-xs md:text-sm">{p.titulo}</p>
                      </div>
                      <div className="min-w-[140px]">
                        <p className="text-[11px] text-muted-foreground">Cliente</p>
                        <p className="text-xs md:text-sm">{p.clientes?.nombre}</p>
                      </div>
                      <div className="min-w-[100px]">
                        <p className="text-[11px] text-muted-foreground">Total</p>
                        <p className="font-semibold font-mono text-sm">
                          ${Number(p.total).toLocaleString()}
                        </p>
                      </div>
                      <div className="min-w-[90px]">{getEstadoBadge(p.estado)}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => copyLink(p.token)}
                        title="Copiar enlace"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => window.open(`/presupuesto/${p.token}`, "_blank")}
                        title="Ver presupuesto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => handleDuplicate(p)}
                        title="Duplicar"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      {!p.proyecto_id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleConvertToProject(p)}
                          title="Convertir a Proyecto"
                          className="h-7 w-7 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        >
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(p.id)}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : viewMode === "kanban" ? (
          <div className="mt-2">
            <KanbanBoard
              presupuestos={filteredPresupuestos}
              onStatusChange={handleStatusChange}
              onCopyLink={copyLink}
              onDuplicate={handleDuplicate}
              onConvertToProject={handleConvertToProject}
              onDelete={(id) => setDeleteId(id)}
            />
          </div>
        ) : null}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-heading">
                ¿Eliminar presupuesto?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Esta acción no se puede deshacer. El presupuesto y todos sus items serán eliminados
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-8 text-xs">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="h-8 text-xs bg-destructive text-destructive-foreground"
              >
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
