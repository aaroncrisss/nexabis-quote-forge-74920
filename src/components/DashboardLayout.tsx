import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, FileText, Settings, LogOut, Plus, Users, Moon, Sun, Shield, Menu, Calculator, FolderKanban, CreditCard, DollarSign, Target, ListTodo, Receipt, FileSignature, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import nexabisLogo from "@/assets/Logo-Nexabis.png";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin } = useAuth();
  const { tier, isTrial, trialDaysLeft, isPremium } = useSubscription();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate("/");
  };

  const navSections = [
    {
      label: "Principal",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      ],
    },
    {
      label: "Herramientas",
      items: [
        { to: "/cotizador", icon: Calculator, label: "Cotizador" },
        { to: "/presupuestos", icon: FileText, label: "Presupuestos" },
        { to: "/proyectos", icon: FolderKanban, label: "Proyectos" },
      ],
    },
    {
      label: "CRM",
      items: [
        { to: "/clientes", icon: Users, label: "Clientes" },
        { to: "/pipeline", icon: Target, label: "Pipeline" },
        { to: "/tareas", icon: ListTodo, label: "Tareas" },
      ],
    },
    {
      label: "Finanzas",
      items: [
        { to: "/pagos", icon: DollarSign, label: "Pagos" },
        { to: "/facturas", icon: Receipt, label: "Facturas" },
        { to: "/contratos", icon: FileSignature, label: "Contratos" },
      ],
    },
    {
      label: "Analítica",
      items: [
        { to: "/reportes", icon: BarChart3, label: "Reportes" },
      ],
    },
    {
      label: "Sistema",
      items: [
        { to: "/configuracion", icon: Settings, label: "Configuración" },
        { to: "/suscripcion", icon: CreditCard, label: "Mi Suscripción" },
        ...(isAdmin ? [{ to: "/admin", icon: Shield, label: "Admin" }] : []),
      ],
    },
  ];

  const NavLinks = () => (
    <nav className="space-y-5">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 px-3">
            {section.label}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 py-3 px-4 h-auto text-sm font-medium rounded-xl transition-all duration-200 relative
                      ${isActive
                        ? "bg-primary/10 text-primary shadow-[0_0_20px_rgba(139,92,246,0.25)] border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-primary/5 hover:shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                      }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-gradient-to-b from-primary via-accent to-warning" />
                    )}
                    <Icon className={`w-[18px] h-[18px] ${isActive ? "text-primary" : ""}`} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const SubscriptionBadge = () => {
    if (isPremium) {
      return (
        <Link to="/suscripcion" className="block px-3 mb-4">
          <Badge className="w-full justify-center py-1.5 gradient-button font-heading text-xs tracking-wider cursor-pointer">
            ✨ PRO
          </Badge>
        </Link>
      );
    }
    if (isTrial && trialDaysLeft !== null) {
      return (
        <Link to="/suscripcion" className="block px-3 mb-4">
          <Badge variant="outline" className="w-full justify-center py-1.5 border-nexabis-orange/50 text-nexabis-orange font-heading text-xs tracking-wider hover:bg-nexabis-orange/10 cursor-pointer">
            TRIAL — {trialDaysLeft}d restantes
          </Badge>
        </Link>
      );
    }
    return (
      <Link to="/suscripcion" className="block px-3 mb-4">
        <Badge variant="secondary" className="w-full justify-center py-1.5 font-heading text-xs tracking-wider hover:bg-secondary/80 cursor-pointer">
          FREE
        </Badge>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <div className="flex items-center gap-3 mb-6">
                  <img src={nexabisLogo} alt="NEXABIS" className="h-8 w-8" />
                  <span className="text-lg font-heading font-bold gradient-text">NEXABIS</span>
                </div>
                <NavLinks />
                <div className="mt-6">
                  <SubscriptionBadge />
                </div>
              </SheetContent>
            </Sheet>

            <img src={nexabisLogo} alt="NEXABIS" className="h-8 w-8" />
            <span className="text-base md:text-lg font-heading font-bold gradient-text hidden sm:inline">NEXABIS</span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/crear" className="hidden sm:block">
              <Button variant="default" size="default" className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Nuevo Presupuesto</span>
                <span className="md:hidden">Nuevo</span>
              </Button>
            </Link>
            <Link to="/crear" className="sm:hidden">
              <Button variant="default" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Sidebar + Content */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-border bg-card/30 min-h-[calc(100vh-57px)] p-4 flex flex-col">
          <NavLinks />
          <div className="mt-6">
            <SubscriptionBadge />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
