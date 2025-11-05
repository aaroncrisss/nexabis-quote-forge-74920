import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/browserClient";
import { toast } from "sonner";

const Configuracion = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    nombre: "",
    email: "",
    nombre_empresa: "",
    direccion: "",
    telefono: "",
    rut: "",
    plantilla_tyc: "",
    moneda_predeterminada: "CLP",
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
      </div>
    </DashboardLayout>
  );
};

export default Configuracion;
