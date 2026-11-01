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
import { Plus, FileText, Search, Trash2, Send, CheckCircle2, Clock, Eye, Printer, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import type { Factura } from "@/types/crm";
import { EmptyState } from "@/components/ui/empty-state";

export default function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewFactura, setPreviewFactura] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [presupuestos, setPresupuestos] = useState<any[]>([]);

  const [form, setForm] = useState({
    cliente_id: "",
    presupuesto_id: "",
    titulo: "",
    notas: "",
    items: [{ descripcion: "", cantidad: "1", precio_unitario: "", total: "" }],
  });

  useEffect(() => {
    loadFacturas();
    loadClientes();
  }, []);

  const loadFacturas = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabaseCRM
        .from("facturas")
        .select("*, clientes(nombre, empresa, email, rut, telefono, direccion)")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setFacturas(data || []);
    } catch {
      toast.error("Error cargando facturas");
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    const { data } = await supabase.from("clientes").select("id, nombre, empresa").order("nombre");
    setClientes(data || []);
  };

  const loadPresupuestos = async (clienteId: string) => {
    const { data } = await supabase
      .from("presupuestos")
      .select("id, numero, titulo, total, items_presupuesto(*)")
      .eq("cliente_id", clienteId)
      .eq("estado", "aprobado")
      .order("created_at", { ascending: false });
    setPresupuestos(data || []);
  };

  const handlePresupuestoSelect = (presupuestoId: string) => {
    const p = presupuestos.find((pr) => pr.id === presupuestoId);
    if (p) {
      const items = (p.items_presupuesto || []).map((item: any) => ({
        descripcion: item.descripcion,
        cantidad: String(item.cantidad),
        precio_unitario: String(item.precio_unitario),
        total: String(item.total),
      }));
      setForm({
        ...form,
        presupuesto_id: presupuestoId,
        titulo: `Factura - ${p.titulo}`,
        items: items.length > 0 ? items : form.items,
      });
    }
  };

  const calcTotal = () =>
    form.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === "cantidad" || field === "precio_unitario") {
      const cant = parseFloat(newItems[index].cantidad) || 0;
      const precio = parseFloat(newItems[index].precio_unitario) || 0;
      newItems[index].total = String(cant * precio);
    }
    setForm({ ...form, items: newItems });
  };

  const handleCreate = async () => {
    if (!form.cliente_id || !form.titulo || form.items.length === 0) {
      toast.error("Cliente, título e items son obligatorios");
      return;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const subtotal = calcTotal();
      const ivaMonto = subtotal * 0.19;

      const { data: factura, error } = await supabaseCRM
        .from("facturas")
        .insert({
          usuario_id: user.id,
          cliente_id: form.cliente_id,
          presupuesto_id: form.presupuesto_id || null,
          numero: "",
          titulo: form.titulo,
          subtotal,
          iva_porcentaje: 19,
          iva_monto: ivaMonto,
          total: subtotal + ivaMonto,
          notas: form.notas || null,
        })
        .select()
        .single();

      if (error) throw error;

      const itemsToInsert = form.items
        .filter((i) => i.descripcion)
        .map((item, idx) => ({
          factura_id: factura.id,
          descripcion: item.descripcion,
          cantidad: parseFloat(item.cantidad) || 1,
          precio_unitario: parseFloat(item.precio_unitario) || 0,
          total: parseFloat(item.total) || 0,
          orden: idx,
        }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabaseCRM
          .from("items_factura")
          .insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      toast.success("Factura creada correctamente");
      setDialogOpen(false);
      setForm({
        cliente_id: "",
        presupuesto_id: "",
        titulo: "",
        notas: "",
        items: [{ descripcion: "", cantidad: "1", precio_unitario: "", total: "" }],
      });
      loadFacturas();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabaseCRM
      .from("facturas")
      .update({ estado: newStatus })
      .eq("id", id);
    if (error) toast.error("Error actualizando");
    else {
      toast.success("Estado actualizado");
      loadFacturas();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabaseCRM.from("facturas").delete().eq("id", deleteId);
    if (error) toast.error("Error eliminando");
    else {
      toast.success("Factura eliminada");
      setDeleteId(null);
      loadFacturas();
    }
  };

  const filtered = facturas.filter((f) => {
    const matchSearch =
      f.numero?.toLowerCase().includes(search.toLowerCase()) ||
      f.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      f.clientes?.nombre?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === "todos" || f.estado === filtroEstado;
    return (search === "" || matchSearch) && matchEstado;
  });

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "borrador":
        return (
          <Badge variant="secondary" className="text-[10px] h-5">
            Borrador
          </Badge>
        );
      case "enviada":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] h-5">
            Enviada
          </Badge>
        );
      case "pagada":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] h-5">
            Pagada
          </Badge>
        );
      case "vencida":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] h-5">
            Vencida
          </Badge>
        );
      case "cancelada":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-[10px] h-5">
            Cancelada
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

  const totalFacturado = facturas.reduce((s, f) => s + Number(f.total), 0);
  const totalPagado = facturas
    .filter((f) => f.estado === "pagada")
    .reduce((s, f) => s + Number(f.total), 0);
  const totalPendiente = facturas
    .filter((f) => ["enviada", "borrador"].includes(f.estado))
    .reduce((s, f) => s + Number(f.total), 0);

  const exportToCsv = () => {
    if (filtered.length === 0) {
      toast.error("No hay facturas para exportar");
      return;
    }
    const headers = ["Número", "Título", "Cliente", "Total", "Estado", "Emisión", "Vencimiento"];
    const rows = filtered.map((f) => [
      `"${f.numero || ""}"`,
      `"${(f.titulo || "").replace(/"/g, '""')}"`,
      `"${(f.clientes?.nombre || "").replace(/"/g, '""')}"`,
      f.total,
      `"${f.estado}"`,
      `"${f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString("es-CL") : ""}"`,
      `"${f.fecha_vencimiento ? new Date(f.fecha_vencimiento).toLocaleDateString("es-CL") : ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexabis-facturas-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Facturas exportadas en CSV");
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-heading font-bold gradient-text flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Facturas
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Emite y gestiona facturas para tus clientes
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={exportToCsv}
              className="h-8 text-xs px-3 border-border/80 hover:bg-card flex-1 sm:flex-none gap-1.5"
              title="Exportar facturas a CSV"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              Exportar CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5 flex-1 sm:flex-none"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Factura
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-3.5 border-primary/20 bg-primary/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Total Facturado
                </p>
                <p className="text-lg md:text-xl font-bold font-mono">
                  ${totalFacturado.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-green-500/20 bg-green-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Pagado
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-green-400">
                  ${totalPagado.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-yellow-500/20 bg-yellow-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Pendiente
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-yellow-400">
                  ${totalPendiente.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, título, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs md:text-sm"
            />
          </div>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="enviada">Enviada</SelectItem>
              <SelectItem value="pagada">Pagada</SelectItem>
              <SelectItem value="vencida">Vencida</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
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
                    Número
                  </th>
                  <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    Título
                  </th>
                  <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase hidden md:table-cell">
                    Cliente
                  </th>
                  <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    Total
                  </th>
                  <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    Estado
                  </th>
                  <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">
                    Fecha
                  </th>
                  <th className="text-right p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-xs text-muted-foreground">
                      Cargando...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-xs text-muted-foreground">
                      No hay facturas
                    </td>
                  </tr>
                ) : (
                  paginated.map((f) => (
                    <tr
                      key={f.id}
                      className="border-b border-border/50 hover:bg-accent/5 transition-colors"
                    >
                      <td className="p-2.5 font-mono text-xs font-bold">{f.numero}</td>
                      <td className="p-2.5 text-xs md:text-sm">{f.titulo}</td>
                      <td className="p-2.5 text-xs hidden md:table-cell text-muted-foreground">
                        {f.clientes?.nombre}
                      </td>
                      <td className="p-2.5 font-bold font-mono text-xs md:text-sm">
                        ${Number(f.total).toLocaleString()}
                      </td>
                      <td className="p-2.5">{getEstadoBadge(f.estado)}</td>
                      <td className="p-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                        {new Date(f.fecha_emision).toLocaleDateString("es-CL")}
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            onClick={() => setPreviewFactura(f)}
                            title="Ver e imprimir factura"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {f.estado === "borrador" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-blue-400 px-2"
                              onClick={() => handleStatusChange(f.id, "enviada")}
                            >
                              <Send className="w-3 h-3 mr-1" /> Enviar
                            </Button>
                          )}
                          {f.estado === "enviada" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-green-400 px-2"
                              onClick={() => handleStatusChange(f.id, "pagada")}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Pagada
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-400"
                            onClick={() => setDeleteId(f.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-heading">Nueva Factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Cliente *</Label>
              <Select
                value={form.cliente_id}
                onValueChange={(v) => {
                  setForm({ ...form, cliente_id: v });
                  loadPresupuestos(v);
                }}
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
            {presupuestos.length > 0 && (
              <div>
                <Label className="text-xs">Importar desde Presupuesto</Label>
                <Select value={form.presupuesto_id} onValueChange={handlePresupuestoSelect}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Seleccionar presupuesto aprobado" />
                  </SelectTrigger>
                  <SelectContent>
                    {presupuestos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.numero} — ${Number(p.total).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs">Título *</Label>
              <Input
                className="h-8 text-xs"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Factura desarrollo web"
              />
            </div>

            {/* Items */}
            <div>
              <Label className="text-xs">Items</Label>
              <div className="space-y-2 mt-1.5">
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <Input
                      className="col-span-5 h-8 text-xs"
                      placeholder="Descripción"
                      value={item.descripcion}
                      onChange={(e) => updateItem(idx, "descripcion", e.target.value)}
                    />
                    <Input
                      className="col-span-2 h-8 text-xs"
                      type="number"
                      placeholder="Cant"
                      value={item.cantidad}
                      onChange={(e) => updateItem(idx, "cantidad", e.target.value)}
                    />
                    <Input
                      className="col-span-2 h-8 text-xs"
                      type="number"
                      placeholder="Precio"
                      value={item.precio_unitario}
                      onChange={(e) => updateItem(idx, "precio_unitario", e.target.value)}
                    />
                    <Input
                      className="col-span-2 h-8 text-xs font-mono"
                      type="number"
                      placeholder="Total"
                      value={item.total}
                      readOnly
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="col-span-1 h-8 w-8 text-red-400"
                      onClick={() =>
                        setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
                      }
                      disabled={form.items.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() =>
                    setForm({
                      ...form,
                      items: [
                        ...form.items,
                        { descripcion: "", cantidad: "1", precio_unitario: "", total: "" },
                      ],
                    })
                  }
                >
                  <Plus className="w-3 h-3 mr-1" /> Agregar Item
                </Button>
              </div>
            </div>

            <div className="text-right space-y-0.5 border-t pt-2.5 font-mono">
              <p className="text-xs text-muted-foreground">
                Subtotal: ${calcTotal().toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                IVA (19%): ${(calcTotal() * 0.19).toLocaleString()}
              </p>
              <p className="text-sm font-bold">Total: ${(calcTotal() * 1.19).toLocaleString()}</p>
            </div>

            <div>
              <Label className="text-xs">Notas</Label>
              <Textarea
                className="text-xs"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                rows={2}
              />
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
              Crear Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-heading">¿Eliminar factura?</AlertDialogTitle>
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
      {/* Invoice Preview Dialog */}
      <Dialog open={!!previewFactura} onOpenChange={() => setPreviewFactura(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {previewFactura && (
            <div className="space-y-5 py-2">
              <div className="flex items-start justify-between border-b pb-4 border-border/80">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">
                    Factura Comercial
                  </span>
                  <h2 className="text-xl font-bold font-mono text-foreground mt-0.5">
                    {previewFactura.numero}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{previewFactura.titulo}</p>
                </div>
                <div className="text-right">
                  <div className="mb-1">{getEstadoBadge(previewFactura.estado)}</div>
                  <p className="text-[11px] text-muted-foreground">
                    Emisión: {previewFactura.fecha_emision ? new Date(previewFactura.fecha_emision).toLocaleDateString("es-CL") : "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Vence: {previewFactura.fecha_vencimiento ? new Date(previewFactura.fecha_vencimiento).toLocaleDateString("es-CL") : "—"}
                  </p>
                </div>
              </div>

              {/* Client & Issuer */}
              <div className="grid grid-cols-2 gap-4 text-xs p-3 rounded-xl bg-card/60 border border-border/60">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Cliente / Receptor
                  </p>
                  <p className="font-semibold text-foreground">
                    {previewFactura.clientes?.nombre || "Cliente"}
                  </p>
                  {previewFactura.clientes?.empresa && (
                    <p className="text-muted-foreground">{previewFactura.clientes.empresa}</p>
                  )}
                  {previewFactura.clientes?.rut && (
                    <p className="font-mono text-muted-foreground">RUT: {previewFactura.clientes.rut}</p>
                  )}
                  {previewFactura.clientes?.email && (
                    <p className="text-muted-foreground">{previewFactura.clientes.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Emisor
                  </p>
                  <p className="font-semibold gradient-text">Nexabis Technologies</p>
                  <p className="text-muted-foreground">contacto@nexabistech.com</p>
                  <p className="text-muted-foreground">+56 9 8634 3217</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-border/60 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b border-border/60">
                    <tr>
                      <th className="p-2 text-left font-medium">Descripción</th>
                      <th className="p-2 text-center font-medium w-16">Cant.</th>
                      <th className="p-2 text-right font-medium w-24">Unitario</th>
                      <th className="p-2 text-right font-medium w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(previewFactura.items || []).map((it: any, idx: number) => (
                      <tr key={idx} className="border-b border-border/40">
                        <td className="p-2">{it.descripcion || "Item"}</td>
                        <td className="p-2 text-center font-mono">{it.cantidad || 1}</td>
                        <td className="p-2 text-right font-mono">${Number(it.precio_unitario || 0).toLocaleString()}</td>
                        <td className="p-2 text-right font-mono font-medium">${Number(it.total || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Neto:</span>
                    <span className="font-mono">${Number(previewFactura.subtotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>IVA (19%):</span>
                    <span className="font-mono">${Number(previewFactura.iva || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-border">
                    <span className="gradient-text">Total:</span>
                    <span className="font-mono gradient-text font-bold text-base">
                      ${Number(previewFactura.total || 0).toLocaleString()} CLP
                    </span>
                  </div>
                </div>
              </div>

              {previewFactura.notas && (
                <div className="p-3 rounded-lg bg-card/40 border border-border/40 text-xs">
                  <p className="font-semibold text-muted-foreground mb-0.5">Notas y Términos:</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{previewFactura.notas}</p>
                </div>
              )}

              <DialogFooter className="flex items-center justify-between gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => window.print()}
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs px-3 gradient-button font-heading font-semibold"
                  onClick={() => setPreviewFactura(null)}
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
