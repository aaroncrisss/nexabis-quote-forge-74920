import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Plus,
  FileSignature,
  Search,
  Trash2,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Eye,
  Printer,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import type { Contrato } from "@/types/crm";
import { EmptyState } from "@/components/ui/empty-state";

export default function Contratos() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [previewContrato, setPreviewContrato] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);

  const [form, setForm] = useState({
    cliente_id: "",
    titulo: "",
    descripcion: "",
    valor: "",
    moneda: "CLP",
    estado: "borrador",
    fecha_inicio: "",
    fecha_fin: "",
    renovacion_auto: false,
  });

  useEffect(() => {
    loadContratos();
    loadClientes();
  }, []);

  const loadContratos = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabaseCRM
        .from("contratos")
        .select("*, clientes(nombre, empresa)")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setContratos(data || []);
    } catch {
      toast.error("Error cargando contratos");
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    const { data } = await supabase.from("clientes").select("id, nombre, empresa").order("nombre");
    setClientes(data || []);
  };

  const handleCreate = async () => {
    if (!form.cliente_id || !form.titulo) {
      toast.error("Cliente y título son obligatorios");
      return;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabaseCRM.from("contratos").insert({
        usuario_id: user.id,
        cliente_id: form.cliente_id,
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        valor: parseFloat(form.valor) || null,
        moneda: form.moneda,
        estado: form.estado,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
        renovacion_auto: form.renovacion_auto,
      });
      if (error) throw error;
      toast.success("Contrato creado");
      setDialogOpen(false);
      setForm({
        cliente_id: "",
        titulo: "",
        descripcion: "",
        valor: "",
        moneda: "CLP",
        estado: "borrador",
        fecha_inicio: "",
        fecha_fin: "",
        renovacion_auto: false,
      });
      loadContratos();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabaseCRM.from("contratos").delete().eq("id", deleteId);
    if (error) toast.error("Error eliminando");
    else {
      toast.success("Contrato eliminado");
      setDeleteId(null);
      loadContratos();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabaseCRM
      .from("contratos")
      .update({ estado: newStatus })
      .eq("id", id);
    if (error) toast.error("Error");
    else {
      toast.success("Estado actualizado");
      loadContratos();
    }
  };

  const filtered = contratos.filter((c) => {
    const matchSearch =
      c.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      c.clientes?.nombre?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === "todos" || c.estado === filtroEstado;
    return (search === "" || matchSearch) && matchEstado;
  });

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const proximosVencer = contratos.filter((c) => {
    if (c.estado !== "activo" || !c.fecha_fin) return false;
    const diff = (new Date(c.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "borrador":
        return (
          <Badge variant="secondary" className="text-[10px] h-5">
            Borrador
          </Badge>
        );
      case "activo":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] h-5">
            Activo
          </Badge>
        );
      case "vencido":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] h-5">
            Vencido
          </Badge>
        );
      case "cancelado":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-[10px] h-5">
            Cancelado
          </Badge>
        );
      case "renovado":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] h-5">
            Renovado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px] h-5">
            {estado}
          </Badge>
        );
    }
  };

  const exportToCsv = () => {
    if (filtered.length === 0) {
      toast.error("No hay contratos para exportar");
      return;
    }
    const headers = ["Título", "Cliente", "Valor", "Moneda", "Estado", "Inicio", "Fin", "Renovación Auto"];
    const rows = filtered.map((c) => [
      `"${(c.titulo || "").replace(/"/g, '""')}"`,
      `"${(c.clientes?.nombre || "").replace(/"/g, '""')}"`,
      c.valor || 0,
      `"${c.moneda || "CLP"}"`,
      `"${c.estado}"`,
      `"${c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString("es-CL") : ""}"`,
      `"${c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString("es-CL") : ""}"`,
      c.renovacion_auto ? "Sí" : "No",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexabis-contratos-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Contratos exportados en CSV");
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-heading font-bold gradient-text flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-primary" />
              Contratos
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gestiona contratos con tus clientes
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={exportToCsv}
              className="h-8 text-xs px-3 border-border/80 hover:bg-card flex-1 sm:flex-none gap-1.5"
              title="Exportar contratos a CSV"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              Exportar CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5 flex-1 sm:flex-none"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Contrato
            </Button>
          </div>
        </div>

        {/* Alert: Próximos a vencer */}
        {proximosVencer.length > 0 && (
          <Card className="p-3.5 border-orange-500/30 bg-orange-500/5">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-orange-400">
                  Contratos próximos a vencer
                </p>
                <p className="text-xs text-muted-foreground">
                  {proximosVencer.map((c) => c.titulo).join(", ")} — vencen en los próximos 30 días
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3.5 border-border/60 bg-card/60 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Total
                </p>
                <p className="text-lg md:text-xl font-bold font-mono">{contratos.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileSignature className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-green-500/20 bg-green-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Activos
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-green-400">
                  {contratos.filter((c) => c.estado === "activo").length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-orange-500/20 bg-orange-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Por Vencer
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-orange-400">
                  {proximosVencer.length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-primary/20 bg-primary/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Valor Activos
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-primary">
                  $
                  {contratos
                    .filter((c) => c.estado === "activo")
                    .reduce((s, c) => s + Number(c.valor || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar contrato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs md:text-sm"
            />
          </div>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="overflow-hidden transition-all duration-200 hover:border-primary/40">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    Título
                  </th>
                  <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase hidden md:table-cell">
                    Cliente
                  </th>
                  <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    Valor
                  </th>
                  <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">
                    Período
                  </th>
                  <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    Estado
                  </th>
                  <th className="text-right p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">
                      Cargando...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">
                      No hay contratos
                    </td>
                  </tr>
                ) : (
                  paginated.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/50 hover:bg-accent/5 transition-colors"
                    >
                      <td className="p-2.5">
                        <div>
                          <p className="text-xs md:text-sm font-medium">{c.titulo}</p>
                          {c.renovacion_auto && (
                            <span className="text-[10px] text-muted-foreground">
                              🔄 Auto-renovable
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 text-xs text-muted-foreground hidden md:table-cell">
                        {c.clientes?.nombre} {c.clientes?.empresa ? `— ${c.clientes.empresa}` : ""}
                      </td>
                      <td className="p-2.5">
                        {c.valor ? (
                          <>
                            <span className="font-bold font-mono text-xs md:text-sm">
                              ${Number(c.valor).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-1">
                              {c.moneda}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                        {c.fecha_inicio ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(c.fecha_inicio).toLocaleDateString("es-CL")} –{" "}
                            {c.fecha_fin
                              ? new Date(c.fecha_fin).toLocaleDateString("es-CL")
                              : "Indef."}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-2.5">{getEstadoBadge(c.estado)}</td>
                      <td className="p-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            onClick={() => setPreviewContrato(c)}
                            title="Ver detalles del contrato"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {c.estado === "borrador" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-green-400 px-2"
                              onClick={() => handleStatusChange(c.id, "activo")}
                            >
                              Activar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-400"
                            onClick={() => setDeleteId(c.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between p-2.5 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Mostrando {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
              </p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-heading">Nuevo Contrato</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Cliente *</Label>
              <Select
                value={form.cliente_id}
                onValueChange={(v) => setForm({ ...form, cliente_id: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} {c.empresa ? `(${c.empresa})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Título *</Label>
              <Input
                className="h-8 text-xs"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Contrato mantenimiento web"
              />
            </div>
            <div>
              <Label className="text-xs">Descripción</Label>
              <Textarea
                className="text-xs"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Valor</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs">Moneda</Label>
                <Select value={form.moneda} onValueChange={(v) => setForm({ ...form, moneda: v })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLP">CLP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="UF">UF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Fecha Inicio</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Fecha Fin</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={form.fecha_fin}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Switch
                checked={form.renovacion_auto}
                onCheckedChange={(v) => setForm({ ...form, renovacion_auto: v })}
              />
              <Label className="text-xs">Renovación automática</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              className="h-8 text-xs px-3 gradient-button font-heading font-semibold"
            >
              Crear Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-heading">¿Eliminar contrato?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-8 text-xs bg-red-500 hover:bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Contract Detail Modal */}
      <Dialog open={!!previewContrato} onOpenChange={() => setPreviewContrato(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {previewContrato && (
            <div className="space-y-4 py-2">
              <div className="flex items-start justify-between border-b pb-3 border-border/80">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">
                    Acuerdo & Contrato
                  </span>
                  <h2 className="text-lg font-bold font-heading text-foreground mt-0.5">
                    {previewContrato.titulo}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cliente: {previewContrato.clientes?.nombre || "—"} {previewContrato.clientes?.empresa ? `(${previewContrato.clientes.empresa})` : ""}
                  </p>
                </div>
                <div>{getEstadoBadge(previewContrato.estado)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-card/60 border border-border/60">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Valor del Acuerdo
                  </p>
                  <p className="text-base font-bold font-mono gradient-text mt-0.5">
                    ${Number(previewContrato.valor || 0).toLocaleString()} {previewContrato.moneda || "CLP"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Vigencia
                  </p>
                  <p className="font-medium text-foreground mt-0.5">
                    {previewContrato.fecha_inicio ? new Date(previewContrato.fecha_inicio).toLocaleDateString("es-CL") : "—"}{" "}
                    hasta {previewContrato.fecha_fin ? new Date(previewContrato.fecha_fin).toLocaleDateString("es-CL") : "Indefinido"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Renovación automática: {previewContrato.renovacion_auto ? "Sí ✓" : "No"}
                  </p>
                </div>
              </div>

              {previewContrato.descripcion ? (
                <div className="space-y-1.5 text-xs p-3.5 rounded-xl bg-card/40 border border-border/40">
                  <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                    Cláusulas y Términos del Servicio
                  </p>
                  <div className="text-foreground whitespace-pre-wrap leading-relaxed text-xs">
                    {previewContrato.descripcion}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Sin descripción ni cláusulas específicas cargadas.</p>
              )}

              <DialogFooter className="flex items-center justify-between gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => window.print()}
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir / Guardar PDF
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs px-3 gradient-button font-heading font-semibold"
                  onClick={() => setPreviewContrato(null)}
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
