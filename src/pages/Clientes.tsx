import { useEffect, useState } from "react";
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
import { Plus, Pencil, Trash2, Mail, Building, Phone, MapPin, Search, Grid3x3, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { formatRUT } from "@/lib/rutUtils";

interface Cliente {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string;
  rut: string | null;
  telefono: string | null;
  direccion: string | null;
}

export default function Clientes() {
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

      // Validate client data
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

  const handleDelete = async () => {
    if (!clienteToDelete) return;

    try {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", clienteToDelete);

      if (error) throw error;
      toast.success("Cliente eliminado");
      loadClientes();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Cargando clientes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold gradient-text mb-2">Clientes</h1>
            <p className="text-sm md:text-base text-muted-foreground">Gestiona tu cartera de clientes</p>
          </div>
          <Button onClick={() => handleOpenDialog()} variant="default" size="default" className="w-full sm:w-auto">
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, email, empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredClientes.map((cliente) => (
              <Card key={cliente.id} className="p-4 md:p-6 bg-card/50 border-border hover-glow transition-all">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-semibold text-base md:text-lg">{cliente.nombre}</h3>
                      {cliente.empresa && (
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                          <Building className="w-4 h-4" />
                          {cliente.empresa}
                        </div>
                      )}
                      {cliente.rut && (
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                          <span className="font-semibold">RUT:</span> {cliente.rut}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(cliente)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setClienteToDelete(cliente.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {cliente.email}
                    </div>
                    {cliente.telefono && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {cliente.telefono}
                      </div>
                    )}
                    {cliente.direccion && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {cliente.direccion}
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
              <Card key={cliente.id} className="p-4 bg-card/50 border-border hover-glow transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <h3 className="font-semibold">{cliente.nombre}</h3>
                      {cliente.empresa && (
                        <p className="text-sm text-muted-foreground">{cliente.empresa}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {cliente.email}
                    </div>
                    {cliente.rut && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-semibold">RUT:</span>
                        {cliente.rut}
                      </div>
                    )}
                    {cliente.telefono && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {cliente.telefono}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(cliente)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setClienteToDelete(cliente.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredClientes.length === 0 && clientes.length > 0 && (
          <Card className="p-12 bg-card/50 border-border text-center">
            <p className="text-muted-foreground mb-4">No se encontraron clientes</p>
          </Card>
        )}

        {clientes.length === 0 && (
          <Card className="p-12 bg-card/50 border-border text-center">
            <p className="text-muted-foreground mb-4">No tienes clientes registrados</p>
            <Button onClick={() => handleOpenDialog()} variant="default">
              <Plus className="w-4 h-4 mr-2" />
              Crear tu primer cliente
            </Button>
          </Card>
        )}
      </div>

      {/* Dialog for create/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {editingCliente
                ? "Actualiza los datos del cliente"
                : "Completa los datos del nuevo cliente"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                value={formData.empresa}
                onChange={(e) =>
                  setFormData({ ...formData, empresa: e.target.value })
                }
                placeholder="Empresa S.A."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rut">RUT</Label>
              <Input
                id="rut"
                value={formData.rut}
                onChange={(e) =>
                  setFormData({ ...formData, rut: formatRUT(e.target.value) })
                }
                placeholder="12.345.678-9"
                maxLength={12}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) =>
                  setFormData({ ...formData, direccion: e.target.value })
                }
                placeholder="Av. Principal 123, Santiago"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} variant="default">
              {editingCliente ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
