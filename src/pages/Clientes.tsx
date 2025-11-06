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
import { Plus, Pencil, Trash2, Mail, Building, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

interface Cliente {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string;
  telefono: string | null;
  direccion: string | null;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    direccion: "",
  });

  useEffect(() => {
    loadClientes();
  }, []);

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
        telefono: cliente.telefono || "",
        direccion: cliente.direccion || "",
      });
    } else {
      setEditingCliente(null);
      setFormData({
        nombre: "",
        empresa: "",
        email: "",
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
        telefono: z.string().max(20),
        direccion: z.string().max(200),
      });

      const validation = clientSchema.safeParse({
        nombre: formData.nombre.trim(),
        empresa: formData.empresa.trim(),
        email: formData.email.trim(),
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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Clientes</h1>
            <p className="text-muted-foreground">Gestiona tu cartera de clientes</p>
          </div>
          <Button onClick={() => handleOpenDialog()} variant="default" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientes.map((cliente) => (
            <Card key={cliente.id} className="p-6 bg-card/50 border-border hover-glow transition-all">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{cliente.nombre}</h3>
                    {cliente.empresa && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="w-4 h-4" />
                        {cliente.empresa}
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
