import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, UserPlus, Users, TrendingUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";

interface UsuarioPermitido {
  id: string;
  email: string;
  fecha_invitacion: string;
  activo: boolean;
}

interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
}

interface Promocion {
  id: string;
  nombre: string;
  descripcion: string | null;
  descuento_porcentaje: number;
  monto_minimo: number;
  activa: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

export default function AdminPanel() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [usuariosPermitidos, setUsuariosPermitidos] = useState<UsuarioPermitido[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<UserWithProfile[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Formulario de promociones
  const [promoForm, setPromoForm] = useState({
    nombre: "",
    descripcion: "",
    descuento_porcentaje: "",
    monto_minimo: "",
    fecha_inicio: "",
    fecha_fin: "",
    activa: true,
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/dashboard");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadUsuariosPermitidos();
      loadPromociones();
      loadRegisteredUsers();
    }
  }, [isAdmin]);

  const loadUsuariosPermitidos = async () => {
    const { data, error } = await supabase
      .from("usuarios_permitidos")
      .select("*")
      .order("fecha_invitacion", { ascending: false });

    if (error) {
      toast.error("Error al cargar usuarios permitidos");
    } else {
      setUsuariosPermitidos(data || []);
    }
  };

  const loadPromociones = async () => {
    const { data, error } = await supabase
      .from("promociones")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar promociones");
    } else {
      setPromociones(data || []);
    }
  };

  const loadRegisteredUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar usuarios registrados");
    } else {
      setRegisteredUsers(data || []);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    // Validate email
    const emailSchema = z.string().email().max(255).toLowerCase();
    const validation = emailSchema.safeParse(newEmail.trim());
    
    if (!validation.success) {
      toast.error("Por favor ingresa un correo electrónico válido");
      return;
    }

    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("usuarios_permitidos").insert([
      {
        email: validation.data,
        invitado_por: userData.user?.id,
      },
    ]);

    if (error) {
      if (error.code === "23505") {
        toast.error("Este email ya está en la lista");
      } else {
        toast.error("Error al invitar usuario");
      }
    } else {
      toast.success("Usuario invitado exitosamente");
      setNewEmail("");
      loadUsuariosPermitidos();
    }
    setLoading(false);
  };

  const handleToggleUsuario = async (id: string, activo: boolean) => {
    const { error } = await supabase
      .from("usuarios_permitidos")
      .update({ activo: !activo })
      .eq("id", id);

    if (error) {
      toast.error("Error al actualizar usuario");
    } else {
      toast.success(activo ? "Usuario desactivado" : "Usuario activado");
      loadUsuariosPermitidos();
    }
  };

  const handleDeleteUsuario = async (id: string) => {
    if (!confirm("¿Eliminar este email de la lista de permitidos?")) return;

    const { error } = await supabase
      .from("usuarios_permitidos")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar usuario");
    } else {
      toast.success("Usuario eliminado");
      loadUsuariosPermitidos();
    }
  };

  const handleCreatePromocion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.nombre || !promoForm.descuento_porcentaje || !promoForm.monto_minimo) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    // Validate promotion data
    const promotionSchema = z.object({
      nombre: z.string().min(1).max(100),
      descripcion: z.string().max(500),
      descuento_porcentaje: z.number().min(0).max(100),
      monto_minimo: z.number().min(0),
    });

    const validation = promotionSchema.safeParse({
      nombre: promoForm.nombre,
      descripcion: promoForm.descripcion,
      descuento_porcentaje: parseFloat(promoForm.descuento_porcentaje),
      monto_minimo: parseFloat(promoForm.monto_minimo),
    });

    if (!validation.success) {
      toast.error("Por favor verifica que todos los campos sean válidos");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("promociones").insert([
      {
        nombre: validation.data.nombre,
        descripcion: validation.data.descripcion || null,
        descuento_porcentaje: validation.data.descuento_porcentaje,
        monto_minimo: validation.data.monto_minimo,
        fecha_inicio: promoForm.fecha_inicio || null,
        fecha_fin: promoForm.fecha_fin || null,
        activa: promoForm.activa,
      },
    ]);

    if (error) {
      toast.error("Error al crear promoción");
    } else {
      toast.success("Promoción creada exitosamente");
      setPromoForm({
        nombre: "",
        descripcion: "",
        descuento_porcentaje: "",
        monto_minimo: "",
        fecha_inicio: "",
        fecha_fin: "",
        activa: true,
      });
      loadPromociones();
    }
    setLoading(false);
  };

  const handleTogglePromocion = async (id: string, activa: boolean) => {
    const { error } = await supabase
      .from("promociones")
      .update({ activa: !activa })
      .eq("id", id);

    if (error) {
      toast.error("Error al actualizar promoción");
    } else {
      toast.success(activa ? "Promoción desactivada" : "Promoción activada");
      loadPromociones();
    }
  };

  const handleDeletePromocion = async (id: string) => {
    if (!confirm("¿Eliminar esta promoción?")) return;

    const { error } = await supabase.from("promociones").delete().eq("id", id);

    if (error) {
      toast.error("Error al eliminar promoción");
    } else {
      toast.success("Promoción eliminada");
      loadPromociones();
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !newPassword) return;

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('change-user-password', {
        body: { 
          userId: selectedUserId, 
          newPassword: newPassword 
        }
      });

      if (error) throw error;

      toast.success("Contraseña actualizada exitosamente");
      setNewPassword("");
      setSelectedUserId(null);
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error("Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold gradient-text mb-2">Panel de Administración</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gestiona usuarios e invitaciones para NEXABIS Quotes</p>
        </div>

        <Tabs defaultValue="usuarios" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="usuarios" className="gap-1 md:gap-2 flex-col md:flex-row py-2 md:py-3 text-xs md:text-sm">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Usuarios Permitidos</span>
              <span className="sm:hidden">Permitidos</span>
            </TabsTrigger>
            <TabsTrigger value="registrados" className="gap-1 md:gap-2 flex-col md:flex-row py-2 md:py-3 text-xs md:text-sm">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Usuarios Registrados</span>
              <span className="sm:hidden">Registrados</span>
            </TabsTrigger>
            <TabsTrigger value="promociones" className="gap-1 md:gap-2 flex-col md:flex-row py-2 md:py-3 text-xs md:text-sm">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
              <span>Promociones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-4 md:space-y-6">
            {/* Formulario de invitación */}
            <Card className="p-4 md:p-6 bg-card/50 backdrop-blur border-primary/20">
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm md:text-base">Invitar Usuario por Email</Label>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      className="flex-1"
                    />
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invitar
                    </Button>
                  </div>
                </div>
              </form>
            </Card>

            {/* Lista de usuarios permitidos */}
            <Card className="p-4 md:p-6 bg-card/50 backdrop-blur border-primary/20">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Usuarios Permitidos ({usuariosPermitidos.length})</h2>
              <div className="space-y-2">
                {usuariosPermitidos.length === 0 ? (
                  <p className="text-sm md:text-base text-muted-foreground text-center py-8">No hay usuarios invitados</p>
                ) : (
                  usuariosPermitidos.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-background/50 rounded-lg border border-border gap-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm md:text-base">{usuario.email}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Invitado el {new Date(usuario.fecha_invitacion).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${usuario.id}`} className="text-xs md:text-sm">
                            {usuario.activo ? "Activo" : "Inactivo"}
                          </Label>
                          <Switch
                            id={`active-${usuario.id}`}
                            checked={usuario.activo}
                            onCheckedChange={() => handleToggleUsuario(usuario.id, usuario.activo)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUsuario(usuario.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="registrados" className="space-y-4 md:space-y-6">
            {/* Formulario de cambio de contraseña */}
            <Card className="p-4 md:p-6 bg-card/50 backdrop-blur border-primary/20">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="user-select" className="text-sm md:text-base">Cambiar Contraseña de Usuario</Label>
                  <div className="space-y-2 mt-2">
                    <select
                      id="user-select"
                      className="w-full p-2 rounded-md border bg-background text-sm md:text-base"
                      value={selectedUserId || ""}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      required
                    >
                      <option value="">Selecciona un usuario</option>
                      {registeredUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="password"
                      placeholder="Nueva contraseña (mín. 6 caracteres)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <Button type="submit" disabled={loading || !selectedUserId} className="w-full sm:w-auto">
                      Cambiar Contraseña
                    </Button>
                  </div>
                </div>
              </form>
            </Card>

            {/* Lista de usuarios registrados */}
            <Card className="p-4 md:p-6 bg-card/50 backdrop-blur border-primary/20">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Usuarios Registrados ({registeredUsers.length})</h2>
              <div className="space-y-2">
                {registeredUsers.length === 0 ? (
                  <p className="text-sm md:text-base text-muted-foreground text-center py-8">No hay usuarios registrados</p>
                ) : (
                  registeredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 md:p-4 bg-background/50 rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm md:text-base">{user.email}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Registrado el {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="promociones" className="space-y-4 md:space-y-6">
            {/* Formulario de promociones */}
            <Card className="p-4 md:p-6 bg-card/50 backdrop-blur border-primary/20">
              <form onSubmit={handleCreatePromocion} className="space-y-4">
                <h2 className="text-lg md:text-xl font-semibold mb-4">Crear Nueva Promoción</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre" className="text-sm md:text-base">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={promoForm.nombre}
                      onChange={(e) => setPromoForm({ ...promoForm, nombre: e.target.value })}
                      placeholder="Ej: Descuento por Volumen"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descuento" className="text-sm md:text-base">Descuento (%) *</Label>
                    <Input
                      id="descuento"
                      type="number"
                      step="0.01"
                      value={promoForm.descuento_porcentaje}
                      onChange={(e) => setPromoForm({ ...promoForm, descuento_porcentaje: e.target.value })}
                      placeholder="10"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="monto" className="text-sm md:text-base">Monto Mínimo *</Label>
                    <Input
                      id="monto"
                      type="number"
                      value={promoForm.monto_minimo}
                      onChange={(e) => setPromoForm({ ...promoForm, monto_minimo: e.target.value })}
                      placeholder="100000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha_inicio" className="text-sm md:text-base">Fecha Inicio (opcional)</Label>
                    <Input
                      id="fecha_inicio"
                      type="date"
                      value={promoForm.fecha_inicio}
                      onChange={(e) => setPromoForm({ ...promoForm, fecha_inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha_fin" className="text-sm md:text-base">Fecha Fin (opcional)</Label>
                    <Input
                      id="fecha_fin"
                      type="date"
                      value={promoForm.fecha_fin}
                      onChange={(e) => setPromoForm({ ...promoForm, fecha_fin: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-0 md:pt-6">
                    <Switch
                      checked={promoForm.activa}
                      onCheckedChange={(checked) => setPromoForm({ ...promoForm, activa: checked })}
                    />
                    <Label>Activa</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="descripcion" className="text-sm md:text-base">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={promoForm.descripcion}
                    onChange={(e) => setPromoForm({ ...promoForm, descripcion: e.target.value })}
                    placeholder="Descripción de la promoción"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Crear Promoción
                </Button>
              </form>
            </Card>

            {/* Lista de promociones */}
            <Card className="p-4 md:p-6 bg-card/50 backdrop-blur border-primary/20">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Promociones Actuales ({promociones.length})</h2>
              <div className="space-y-2">
                {promociones.length === 0 ? (
                  <p className="text-sm md:text-base text-muted-foreground text-center py-8">No hay promociones creadas</p>
                ) : (
                  promociones.map((promo) => (
                    <div
                      key={promo.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-background/50 rounded-lg border border-border gap-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm md:text-base">{promo.nombre}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {promo.descuento_porcentaje}% descuento en compras sobre ${promo.monto_minimo.toLocaleString()}
                        </p>
                        {(promo.fecha_inicio || promo.fecha_fin) && (
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Vigencia: {promo.fecha_inicio ? new Date(promo.fecha_inicio).toLocaleDateString() : "Sin inicio"} - {promo.fecha_fin ? new Date(promo.fecha_fin).toLocaleDateString() : "Sin fin"}
                          </p>
                        )}
                        {promo.descripcion && (
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">{promo.descripcion}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`promo-${promo.id}`} className="text-xs md:text-sm">
                            {promo.activa ? "Activa" : "Inactiva"}
                          </Label>
                          <Switch
                            id={`promo-${promo.id}`}
                            checked={promo.activa}
                            onCheckedChange={() => handleTogglePromocion(promo.id, promo.activa)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePromocion(promo.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
