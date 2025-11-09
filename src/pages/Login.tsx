import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import nexabisLogo from "@/assets/Logo-Nexabis.png";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("¡Bienvenido de vuelta!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor ingresa tu correo electrónico");
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/configuracion`,
      });

      if (error) throw error;

      toast.success("Te hemos enviado un correo para restablecer tu contraseña");
      setShowReset(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar correo");
    } finally {
      setResetLoading(false);
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
            Iniciar Sesión
          </h1>
          <p className="text-muted-foreground">
            Ingresa a tu cuenta de NEXABIS
          </p>
        </div>

        {!showReset ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-nexabis hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Correo electrónico</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={resetLoading}
              />
              <p className="text-sm text-muted-foreground">
                Te enviaremos un correo para restablecer tu contraseña
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowReset(false)}
                disabled={resetLoading}
              >
                Volver
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-nexabis hover:opacity-90 transition-opacity"
                disabled={resetLoading}
              >
                {resetLoading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </form>
        )}

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Regístrate gratis
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

export default Login;
