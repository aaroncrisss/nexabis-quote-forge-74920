import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Pencil,
  Trash2,
  Mail,
  Building,
  Phone,
  MapPin,
  Search,
  Grid3x3,
  List,
  Users,
  UserPlus,
  Building2,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { EmptyState } from "@/components/ui/empty-state";

interface Cliente {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string;
  rut?: string;
  telefono: string | null;
  direccion: string | null;
}

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    email: "",
    rut: "",
    telefono: "",
    direccion: "",
  });

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    const filtered = clientes.filter((cliente) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        cliente.nombre.toLowerCase().includes(searchLower) ||
        cliente.email.toLowerCase().includes(searchLower) ||
        (cliente.empresa && cliente.empresa.toLowerCase().includes(searchLower)) ||
        (cliente.telefono && cliente.telefono.toLowerCase().includes(searchLower))
      );
    });
    setFilteredClientes(filtered);
  }, [searchTerm, clientes]);

  // Pagination
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredClientes.length / PAGE_SIZE));
  const paginated = filteredClientes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // KPIs
  const totalClientes = clientes.length;
  const nuevosEsteMes = clientes.filter((c: any) => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const conEmpresa = clientes.filter((c) => c.empresa).length;

  const loadClientes = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("usuario_id", userData.user.id)
        .order("nombre");

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        nombre: cliente.nombre,
        empresa: cliente.empresa || "",
        email: cliente.email,
        rut: cliente.rut || "",
        telefono: cliente.telefono || "",
        direccion: cliente.direccion || "",
      });
    } else {
      setEditingCliente(null);
      setFormData({
        nombre: "",
        empresa: "",
        email: "",
        rut: "",
        telefono: "",
        direccion: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.nombre || !formData.email) {
        toast.error("Nombre y email son requeridos");
        return;
      }

      const clientSchema = z.object({
        nombre: z.string().min(2).max(100),
        empresa: z.string().max(100),
        email: z.string().email("Correo electrónico inválido").max(255).toLowerCase(),
        rut: z.string().max(20).optional(),
        telefono: z.string().max(20),
        direccion: z.string().max(200),
      });

      const validation = clientSchema.safeParse({
        nombre: formData.nombre.trim(),
        empresa: formData.empresa.trim(),
        email: formData.email.trim(),
        rut: formData.rut?.trim(),
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
      });

      if (!validation.success) {
        const error = validation.error.errors[0];
        toast.error(error?.message || "Por favor verifica los datos ingresados");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      if (editingCliente) {
        const { error } = await supabase
          .from("clientes")
          .update({
            nombre: validation.data.nombre,
            empresa: validation.data.empresa || null,
            email: validation.data.email,
            rut: validation.data.rut || null,
            telefono: validation.data.telefono || null,
            direccion: validation.data.direccion || null,
          })
          .eq("id", editingCliente.id);

        if (error) throw error;
        toast.success("Cliente actualizado");
      } else {
        const { error } = await supabase.from("clientes").insert([
          {
            usuario_id: userData.user.id,
            nombre: validation.data.nombre,
            empresa: validation.data.empresa || null,
            email: validation.data.email,
            rut: validation.data.rut || null,
            telefono: validation.data.telefono || null,
            direccion: validation.data.direccion || null,
          },
        ]);

        if (error) throw error;
        toast.success("Cliente creado");
      }

      setDialogOpen(false);
      loadClientes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const exportToCsv = () => {
    if (filteredClientes.length === 0) {
      toast.error("No hay clientes para exportar");
      return;
    }
    const headers = ["Nombre", "Empresa", "Email", "RUT", "Teléfono", "Dirección"];
    const rows = filteredClientes.map((c) => [
      `"${(c.nombre || "").replace(/"/g, '""')}"`,
      `"${(c.empresa || "").replace(/"/g, '""')}"`,
      `"${(c.email || "").replace(/"/g, '""')}"`,
      `"${(c.rut || "").replace(/"/g, '""')}"`,
      `"${(c.telefono || "").replace(/"/g, '""')}"`,
      `"${(c.direccion || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexabis-clientes-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Listado de clientes exportado en CSV");
  };

  const handleDelete = async () => {
    if (!clienteToDelete) return;

    try {
      // 1. Desvincular presupuestos asociados
      await supabase.from("presupuestos").update({ cliente_id: null }).eq("cliente_id", clienteToDelete);

      // 2. Desvincular proyectos asociados
      await supabase.from("proyectos").update({ cliente_id: null }).eq("cliente_id", clienteToDelete);

      // 3. Desvincular contratos asociados
      await supabase.from("contratos").update({ cliente_id: null }).eq("cliente_id", clienteToDelete);

      // 4. Desvincular facturas asociadas
      await supabase.from("facturas").update({ cliente_id: null }).eq("cliente_id", clienteToDelete);

      // 5. Desvincular pagos asociados
      await supabase.from("pagos").update({ cliente_id: null }).eq("cliente_id", clienteToDelete);

      // 6. Eliminar el cliente
      const { error } = await supabase.from("clientes").delete().eq("id", clienteToDelete);

      if (error) throw error;
      toast.success("Cliente eliminado correctamente");
      loadClientes();
    } catch (error: any) {
      toast.error(`Error al eliminar: ${error.message || "Verifica dependencias"}`);
    } finally {
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-muted-foreground">Cargando clientes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-heading font-bold gradient-text flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Clientes
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Gestiona tu cartera de clientes</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={exportToCsv}
              className="h-8 text-xs px-3 border-border/80 hover:bg-card flex-1 sm:flex-none gap-1.5"
              title="Exportar listado a archivo CSV"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              Exportar CSV
            </Button>
            <Button
              size="sm"
              onClick={() => handleOpenDialog()}
              className="h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5 flex-1 sm:flex-none"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-3.5 border-primary/20 bg-primary/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Total Clientes
                </p>
                <p className="text-lg md:text-xl font-bold font-mono">{totalClientes}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-green-500/20 bg-green-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Nuevos Este Mes
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-green-400">
                  {nuevosEsteMes}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                <UserPlus className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-blue-500/20 bg-blue-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Con Empresa
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-blue-400">{conEmpresa}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
            <Input
              placeholder="Buscar por nombre, email, empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-xs md:text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((cliente) => (
              <Card
                key={cliente.id}
                className="p-4 bg-card/60 border-border/60 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="space-y-0.5 flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/clientes/${cliente.id}`)}
                    >
                      <h3 className="text-sm md:text-base font-heading font-semibold hover:text-primary transition-colors truncate">
                        {cliente.nombre}
                      </h3>
                      {cliente.empresa && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                          <Building className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{cliente.empresa}</span>
                        </div>
                      )}
                      {cliente.rut && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="font-semibold">RUT:</span> {cliente.rut}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenDialog(cliente)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setClienteToDelete(cliente.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-border/40 pt-2.5">
                    <div className="flex items-center gap-2 text-muted-foreground truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                    {cliente.telefono && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {cliente.telefono}
                      </div>
                    )}
                    {cliente.direccion && (
                      <div className="flex items-center gap-2 text-muted-foreground truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cliente.direccion}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredClientes.map((cliente) => (
              <Card
                key={cliente.id}
                className="p-3.5 bg-card/60 border-border/60 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                    <div
                      className="flex-1 min-w-[140px] cursor-pointer"
                      onClick={() => navigate(`/clientes/${cliente.id}`)}
                    >
                      <h3 className="text-sm font-heading font-semibold hover:text-primary transition-colors">
                        {cliente.nombre}
                      </h3>
                      {cliente.empresa && (
                        <p className="text-xs text-muted-foreground">{cliente.empresa}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {cliente.email}
                    </div>
                    {cliente.telefono && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {cliente.telefono}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpenDialog(cliente)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setClienteToDelete(cliente.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredClientes.length > PAGE_SIZE && (
          <div className="flex items-center justify-between p-2.5 bg-card/50 rounded-lg border">
            <p className="text-xs text-muted-foreground">
              Mostrando {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, filteredClientes.length)} de {filteredClientes.length}
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

        {clientes.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aún no tienes clientes registrados"
            description="Comienza agregando tu primer cliente o prospecto para generar cotizaciones, proyectos y seguimiento."
            actionLabel="Crear mi primer cliente"
            onAction={() => handleOpenDialog()}
          />
        ) : filteredClientes.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Sin resultados para la búsqueda"
            description={`No se encontraron clientes que coincidan con "${searchTerm}". Intenta con otro término o limpia el filtro.`}
            actionLabel="Limpiar búsqueda"
            onAction={() => setSearchTerm("")}
          />
        ) : null}
      </div>

      {/* Dialog for create/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-base font-heading">
              {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingCliente
                ? "Actualiza los datos del cliente"
                : "Completa los datos del nuevo cliente"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-xs">
                Nombre *
              </Label>
              <Input
                id="nombre"
                className="h-8 text-xs md:text-sm"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="empresa" className="text-xs">
                Empresa
              </Label>
              <Input
                id="empresa"
                className="h-8 text-xs md:text-sm"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                placeholder="Empresa S.A."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rut" className="text-xs">
                RUT / Identificación Fiscal
              </Label>
              <Input
                id="rut"
                className="h-8 text-xs md:text-sm font-mono"
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                placeholder="76.123.456-7"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                className="h-8 text-xs md:text-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefono" className="text-xs">
                Teléfono
              </Label>
              <Input
                id="telefono"
                className="h-8 text-xs md:text-sm"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="direccion" className="text-xs">
                Dirección
              </Label>
              <Input
                id="direccion"
                className="h-8 text-xs md:text-sm"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Av. Principal 123, Santiago"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              className="h-8 text-xs px-3 gradient-button font-heading font-semibold"
            >
              {editingCliente ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-heading">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Esta acción no se puede deshacer. El cliente será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
