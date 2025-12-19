import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import nexabisLogo from "@/assets/Logo-Nexabis.png";
import { z } from "zod";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
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
      // Verificar si el email está permitido
      const { data: permitido, error: checkError } = await supabase.rpc("email_permitido", {
        email_check: validation.data.email,
      });

      if (checkError) {
        toast.error("Error al verificar el email");
        return;
      }

      if (!permitido) {
        toast.error("Tu correo no está autorizado. Contacta con el administrador.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          data: {
            nombre: validation.data.nombre,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success("¡Cuenta creada exitosamente!");
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
          <p className="text-muted-foreground">
            Registra tu cuenta (solo por invitación)
          </p>
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
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
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
