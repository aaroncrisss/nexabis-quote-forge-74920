import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, TrendingUp, Clock, Check, Moon, Sun } from "lucide-react";
import nexabisLogo from "@/assets/Logo-Nexabis.png";
import { useEffect, useState } from "react";

const Landing = () => {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    const isDark = stored === null ? true : stored === "true";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark", newMode);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-shrink-0">
            <img src={nexabisLogo} alt="NEXABIS" className="h-10 w-10" />
            <span className="text-xl font-heading font-bold gradient-text">NEXABIS</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end w-full sm:w-auto">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="flex-shrink-0">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Link to="/login">
              <Button variant="ghost" className="w-full sm:w-auto">Iniciar Sesión</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gradient-nexabis hover:opacity-90 transition-opacity w-full sm:w-auto">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-heading font-bold">
            Crea presupuestos{" "}
            <span className="gradient-text">profesionales</span>{" "}
            en minutos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema exclusivo por invitación para empresas. Crea, envía y gestiona presupuestos 
            profesionales con cálculo automático de IVA, promociones inteligentes y nomenclatura profesional.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="bg-gradient-nexabis hover:opacity-90 transition-opacity text-lg px-8">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 hover-glow transition-all bg-card/50 backdrop-blur-sm border-border">
            <div className="w-12 h-12 rounded-lg bg-gradient-nexabis flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-heading font-bold mb-3">Ahorra Tiempo</h3>
            <p className="text-muted-foreground">
              Crea presupuestos profesionales en minutos con plantillas personalizables 
              y cálculos automáticos.
            </p>
          </Card>

          <Card className="p-8 hover-glow transition-all bg-card/50 backdrop-blur-sm border-border">
            <div className="w-12 h-12 rounded-lg bg-gradient-nexabis flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-heading font-bold mb-3">Seguimiento en Tiempo Real</h3>
            <p className="text-muted-foreground">
              Monitorea el estado de tus cotizaciones y recibe notificaciones cuando 
              tus clientes las aprueben o rechacen.
            </p>
          </Card>

          <Card className="p-8 hover-glow transition-all bg-card/50 backdrop-blur-sm border-border">
            <div className="w-12 h-12 rounded-lg bg-gradient-nexabis flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-heading font-bold mb-3">Gestión Completa</h3>
            <p className="text-muted-foreground">
              Administra clientes, ítems, descuentos y términos. Exporta a PDF 
              con tu marca incluida.
            </p>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-heading font-bold text-center mb-12">
            Por qué elegir <span className="gradient-text">NEXABIS</span>
          </h2>
          <div className="space-y-6">
            {[
              "Nomenclatura profesional automática (NEX-2025-0001)",
              "Cálculo automático de IVA 19%",
              "Promociones inteligentes configurables",
              "Control de acceso por invitación",
              "Múltiples monedas (USD/CLP)",
              "Modo oscuro/claro para impresión",
              "Enlaces compartibles seguros",
              "Gestión completa de clientes"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-card/50 border border-border">
                <div className="w-8 h-8 rounded-full bg-gradient-nexabis flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 text-center bg-gradient-nexabis animate-gradient">
          <h2 className="text-4xl font-heading font-bold text-white mb-4">
            ¿Tu empresa necesita presupuestos profesionales?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            NEXABIS Quotes es un sistema exclusivo por invitación para empresas que buscan profesionalizar su proceso comercial.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 text-lg px-8">
              Iniciar Sesión
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={nexabisLogo} alt="NEXABIS" className="h-6 w-6" />
            <span className="font-heading font-bold gradient-text">NEXABIS TECH</span>
          </div>
          <p>© 2025 NEXABIS. Presupuestos profesionales en minutos.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
