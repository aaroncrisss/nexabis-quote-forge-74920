import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import nexabisLogo from "@/assets/Logo-Nexabis.png";
import { z } from "zod";
import { Sparkles } from "lucide-react";

const RUBROS = [
  { value: "tecnologia", label: "Tecnología / Software" },
  { value: "construccion", label: "Construcción / Obra civil" },
  { value: "consultoria", label: "Consultoría / Asesoría" },
  { value: "diseno", label: "Diseño / Creatividad" },
  { value: "marketing", label: "Marketing / Publicidad" },
  { value: "freelance", label: "Freelance / Independiente" },
  { value: "energia", label: "Energía / Climatización" },
  { value: "salud", label: "Salud / Bienestar" },
  { value: "educacion", label: "Educación / Formación" },
  { value: "otro", label: "Otro" },
];

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    rubro: "tecnologia",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    // Validate registration data
    const registerSchema = z.object({
      nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
      email: z.string().email("Correo electrónico inválido").max(255).toLowerCase(),
      password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100),
    });

    const validation = registerSchema.safeParse({
      nombre: formData.nombre.trim(),
      email: formData.email.trim(),
      password: formData.password,
    });

    if (!validation.success) {
      const error = validation.error.errors[0];
      toast.error(error?.message || "Por favor verifica los datos ingresados");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          data: {
            nombre: validation.data.nombre,
            rubro: formData.rubro,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update rubro in profile after creation
        await supabase
          .from("profiles")
          .update({ rubro: formData.rubro })
          .eq("id", data.user.id);

        toast.success("¡Cuenta creada exitosamente! Tienes 14 días de prueba gratis.");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-card/50 backdrop-blur-sm">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img src={nexabisLogo} alt="NEXABIS" className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-heading font-bold gradient-text">
            Crear Cuenta
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-nexabis-orange" />
            <span>Prueba gratis por 14 días — sin tarjeta de crédito</span>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              type="text"
              placeholder="Tu nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rubro">¿A qué te dedicas?</Label>
            <Select
              value={formData.rubro}
              onValueChange={(value) => setFormData({ ...formData, rubro: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tu rubro" />
              </SelectTrigger>
              <SelectContent>
                {RUBROS.map((rubro) => (
                  <SelectItem key={rubro.value} value={rubro.value}>
                    {rubro.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-nexabis hover:opacity-90 transition-opacity"
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Comenzar Prueba Gratis"}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground block">
            ← Volver al inicio
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
