import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Settings, LogOut, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/browserClient";
import { toast } from "sonner";
import nexabisLogo from "@/assets/Logo-Nexabis.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate("/");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/presupuestos", icon: FileText, label: "Presupuestos" },
    { to: "/configuracion", icon: Settings, label: "Configuración" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={nexabisLogo} alt="NEXABIS" className="h-8 w-8" />
            <span className="text-lg font-heading font-bold gradient-text">NEXABIS</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/crear">
              <Button className="bg-gradient-nexabis hover:opacity-90 transition-opacity gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Presupuesto
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Sidebar + Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card/30 min-h-[calc(100vh-57px)] p-4">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 ${
                      isActive ? "bg-gradient-nexabis text-white" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
