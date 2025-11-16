import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Lock } from "lucide-react";

const Configuracion = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profile, setProfile] = useState({
    nombre: "",
    email: "",
    nombre_empresa: "",
    direccion: "",
    telefono: "",
    rut: "",
    plantilla_tyc: "",
    moneda_predeterminada: "CLP",
    logo_url: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) setProfile(data);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona una imagen");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Delete old logo if exists
      if (profile.logo_url) {
        const oldPath = profile.logo_url.split('/logos/')[1];
        if (oldPath) {
          await supabase.storage.from('logos').remove([oldPath]);
        }
      }

      const { error: uploadError, data } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setProfile({ ...profile, logo_url: publicUrl });
      toast.success("Logo subido exitosamente");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (profile.logo_url) {
        const oldPath = profile.logo_url.split('/logos/')[1];
        if (oldPath) {
          await supabase.storage.from('logos').remove([oldPath]);
        }
      }

      setProfile({ ...profile, logo_url: "" });
      toast.success("Logo eliminado");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;
      
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Contraseña actualizada exitosamente");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Configuración guardada");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-4xl font-heading font-bold gradient-text">Configuración</h1>

        <Card className="p-6 space-y-6 bg-card/50 border-border">
          <div className="space-y-2">
            <Label>Logo de Empresa</Label>
            {profile.logo_url ? (
              <div className="flex items-center gap-4">
                <img src={profile.logo_url} alt="Logo" className="h-20 object-contain border border-border rounded p-2" />
                <Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo}>
                  <X className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            ) : (
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sube el logo de tu empresa (max 2MB)
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nombre Completo</Label>
            <Input value={profile.nombre} onChange={(e) => setProfile({ ...profile, nombre: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled />
          </div>

          <div className="space-y-2">
            <Label>Nombre de Empresa</Label>
            <Input value={profile.nombre_empresa} onChange={(e) => setProfile({ ...profile, nombre_empresa: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>RUT / Tax ID</Label>
            <Input value={profile.rut} onChange={(e) => setProfile({ ...profile, rut: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input value={profile.direccion} onChange={(e) => setProfile({ ...profile, direccion: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input value={profile.telefono} onChange={(e) => setProfile({ ...profile, telefono: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Moneda Predeterminada</Label>
            <Select value={profile.moneda_predeterminada} onValueChange={(v) => setProfile({ ...profile, moneda_predeterminada: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLP">CLP</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Términos y Condiciones por Defecto</Label>
            <Textarea 
              value={profile.plantilla_tyc} 
              onChange={(e) => setProfile({ ...profile, plantilla_tyc: e.target.value })}
              rows={4}
            />
          </div>

          <Button onClick={handleSave} disabled={loading} className="bg-gradient-nexabis w-full">
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </Card>

        <Card className="p-4 md:p-6 space-y-4 md:space-y-6 bg-card/50 border-border">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-heading font-bold">Cambiar Contraseña</h2>
          </div>

          <div className="space-y-2">
            <Label>Nueva Contraseña</Label>
            <Input 
              type="password" 
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="space-y-2">
            <Label>Confirmar Nueva Contraseña</Label>
            <Input 
              type="password" 
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Repite la contraseña"
            />
          </div>

          <Button 
            onClick={handleChangePassword} 
            disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            className="bg-gradient-nexabis w-full"
          >
            {changingPassword ? "Actualizando..." : "Cambiar Contraseña"}
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Configuracion;
