import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, FileText, Settings, LogOut, Plus, Users, Moon, Sun, Shield, Menu, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import nexabisLogo from "@/assets/Logo-Nexabis.png";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdmin } = useAuth();

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

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/cotizador", icon: Calculator, label: "Cotizador" },
    { to: "/presupuestos", icon: FileText, label: "Presupuestos" },
    { to: "/clientes", icon: Users, label: "Clientes" },
    { to: "/configuracion", icon: Settings, label: "Configuración" },
    ...(isAdmin ? [{ to: "/admin", icon: Shield, label: "Admin" }] : []),
  ];

  const NavLinks = () => (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to;
        return (
          <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start gap-3"
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );

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
        <aside className="hidden lg:block w-64 border-r border-border bg-card/30 min-h-[calc(100vh-57px)] p-4">
          <NavLinks />
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
