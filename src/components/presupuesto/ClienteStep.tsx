import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, User } from "lucide-react";

interface Cliente {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string;
}

interface ClienteStepProps {
  clienteId: string;
  titulo: string;
  onUpdate: (data: any) => void;
}

export function ClienteStep({ clienteId, titulo, onUpdate }: ClienteStepProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    direccion: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre, empresa, email")
      .order("nombre");

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
      return;
    }

    setClientes(data || []);
  };

  const handleCreateCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.email) {
      toast({
        title: "Error",
        description: "Nombre y email son requeridos",
        variant: "destructive",
      });
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from("clientes")
      .insert({
        ...nuevoCliente,
        usuario_id: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "¡Cliente creado!",
      description: "El cliente se ha agregado exitosamente",
    });

    setClientes([...clientes, data]);
    onUpdate({ cliente_id: data.id });
    setIsDialogOpen(false);
    setNuevoCliente({ nombre: "", empresa: "", email: "", telefono: "", direccion: "" });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold gradient-text mb-3 md:mb-4">Paso 1: Seleccionar Cliente</h2>
        <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">Elija un cliente existente o cree uno nuevo</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="cliente" className="text-sm md:text-base">Cliente</Label>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <Select value={clienteId} onValueChange={(value) => onUpdate({ cliente_id: value })}>
              <SelectTrigger className="flex-1 w-full">
                <SelectValue placeholder="Seleccione un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{cliente.nombre}</span>
                      {cliente.empresa && (
                        <span className="text-muted-foreground text-sm">({cliente.empresa})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gradient-border">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4 md:mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg md:text-xl">Crear Nuevo Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombre" className="text-sm">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={nuevoCliente.nombre}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                      placeholder="Juan Pérez"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="empresa" className="text-sm">Empresa</Label>
                    <Input
                      id="empresa"
                      value={nuevoCliente.empresa}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, empresa: e.target.value })}
                      placeholder="Empresa S.A."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={nuevoCliente.email}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                      placeholder="cliente@email.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono" className="text-sm">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={nuevoCliente.telefono}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                      placeholder="+56 9 1234 5678"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="direccion" className="text-sm">Dirección</Label>
                    <Input
                      id="direccion"
                      value={nuevoCliente.direccion}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                      placeholder="Av. Principal 123"
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleCreateCliente} className="w-full gradient-button">
                    Crear Cliente
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div>
          <Label htmlFor="titulo" className="text-sm md:text-base">Título del Presupuesto *</Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={(e) => onUpdate({ titulo: e.target.value })}
            placeholder="Desarrollo Web Corporativo"
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}
