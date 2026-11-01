import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Plus,
  Users,
  Moon,
  Sun,
  Shield,
  Menu,
  Calculator,
  FolderKanban,
  CreditCard,
  DollarSign,
  Target,
  ListTodo,
  Receipt,
  FileSignature,
  BarChart3,
  BookOpen,
  Flag,
  Zap,
  Award,
  MessageSquare,
  Building2,
  Briefcase,
  SunMedium,
  PanelLeftClose,
  PanelLeftOpen,
  CheckSquare,
  Download,
  Calendar,
  ChevronDown,
  Sparkles,
  LayoutGrid,
  Instagram,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import nexabisLogo from "@/assets/Logo-Nexabis.png";
import { useEffect, useState, createContext, useContext, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { checkWhatsAppConnection } from "@/lib/whatsapp";

const DashboardLayoutContext = createContext<boolean>(false);

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isNested = useContext(DashboardLayoutContext);

  // If already rendered inside an outer persistent DashboardLayout, avoid re-rendering layout shell
  if (isNested) {
    return <>{children}</>;
  }

  return (
    <DashboardLayoutContext.Provider value={true}>
      <DashboardLayoutShell>{children}</DashboardLayoutShell>
    </DashboardLayoutContext.Provider>
  );
};

const getInitialOpenGroups = (path: string, search: string): Record<string, boolean> => {
  const groups: Record<string, boolean> = {
    "Centro de Mando": false,
    "Mis 3 Ámbitos": false,
    "Agencia & CRM": false,
    "Estrategia & Equipo": false,
    "Finanzas & Sistema": false,
  };

  if (search.includes("ambito=")) {
    groups["Mis 3 Ámbitos"] = true;
  } else if (
    path === "/dashboard" ||
    path === "/tareas" ||
    search.includes("vista=mine") ||
    search.includes("vista=month")
  ) {
    groups["Centro de Mando"] = true;
  } else if (
    ["/cotizador", "/presupuestos", "/crear", "/proyectos", "/clientes", "/pipeline", "/instagram", "/espacio"].some((p) =>
      path.startsWith(p)
    )
  ) {
    groups["Agencia & CRM"] = true;
  } else if (["/roadmap", "/rompelineas", "/feedback"].includes(path)) {
    groups["Estrategia & Equipo"] = true;
  } else if (
    ["/pagos", "/facturas", "/contratos", "/reportes", "/configuracion", "/suscripcion", "/admin"].includes(path)
  ) {
    groups["Finanzas & Sistema"] = true;
  } else {
    groups["Centro de Mando"] = true;
  }

  return groups;
};

const DashboardLayoutShell = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("nexabis_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [menuStyle, setMenuStyle] = useState<"dock" | "topbar">(() => {
    try {
      return (localStorage.getItem("nexabis_menu_style") as "dock" | "topbar") || "dock";
    } catch {
      return "dock";
    }
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    getInitialOpenGroups(location.pathname, location.search)
  );

  // Auto-expand the active section upon route change without closing what user toggled
  useEffect(() => {
    const activeGroups = getInitialOpenGroups(location.pathname, location.search);
    setOpenGroups((prev) => {
      const activeKey = Object.keys(activeGroups).find((k) => activeGroups[k]);
      if (activeKey && !prev[activeKey]) {
        return { ...prev, [activeKey]: true };
      }
      return prev;
    });
  }, [location.pathname, location.search]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [waConnected, setWaConnected] = useState<boolean | null>(null);
  const [pwaPrompt, setPwaPrompt] = useState<any>(() => (window as any).__deferredPwaPrompt || null);
  const [isStandalone, setIsStandalone] = useState(false);
  const { isAdmin } = useAuth();
  const { isTrial, trialDaysLeft, isPremium } = useSubscription();

  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    const isDark = stored === null ? true : stored === "true";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    checkWhatsAppConnection().then((st) => setWaConnected(st.connected));
  }, []);

  useEffect(() => {
    const checkStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as any)?.standalone === true;
    setIsStandalone(Boolean(checkStandalone));

    const onInstallAvailable = () => {
      setPwaPrompt((window as any).__deferredPwaPrompt || null);
    };
    const onInstalled = () => {
      setPwaPrompt(null);
      setIsStandalone(true);
      toast.success("¡Nexabis OS instalada en tu dispositivo!");
    };
    window.addEventListener("pwa-install-available", onInstallAvailable);
    window.addEventListener("pwa-installed", onInstalled);
    return () => {
      window.removeEventListener("pwa-install-available", onInstallAvailable);
      window.removeEventListener("pwa-installed", onInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    const promptEvent = pwaPrompt || (window as any).__deferredPwaPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === "accepted") {
        (window as any).__deferredPwaPrompt = null;
        setPwaPrompt(null);
      }
    } else {
      toast.info(
        "Para instalar en tu móvil: en iPhone toca 'Compartir → Agregar a inicio'; en Android o Chrome toca 'Instalar aplicación' en el menú del navegador."
      );
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark", newMode);
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("nexabis_sidebar_collapsed", String(next));
    } catch {
      // ignore
    }
  };

  const toggleMenuStyle = () => {
    const next = menuStyle === "dock" ? "topbar" : "dock";
    setMenuStyle(next);
    try {
      localStorage.setItem("nexabis_menu_style", next);
    } catch {
      // ignore
    }
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const current = prev[label] ?? false;
      return { ...prev, [label]: !current };
    });
  };

  const allExpanded = Object.values(openGroups).every(Boolean);
  const toggleAllGroups = () => {
    const next = !allExpanded;
    setOpenGroups({
      "Centro de Mando": next,
      "Mis 3 Ámbitos": next,
      "Agencia & CRM": next,
      "Estrategia & Equipo": next,
      "Finanzas & Sistema": next,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate("/");
  };

  const fullPath = location.pathname + location.search;

  const navSections = [
    {
      label: "Centro de Mando",
      badge: "OS",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Tablero Principal" },
        { to: "/tareas?vista=mine", icon: CheckSquare, label: "Mi Día & Mis Tareas" },
        { to: "/tareas?vista=month", icon: Calendar, label: "Tareas Mensuales" },
        { to: "/tareas", icon: ListTodo, label: "Board Kanban" },
      ],
    },
    {
      label: "Mis 3 Ámbitos",
      badge: "3",
      items: [
        { to: "/tareas?ambito=Nexabis", icon: Building2, label: "🏢 Trabajo Nexabis", tone: "text-primary" },
        { to: "/tareas?ambito=Trabajo", icon: Briefcase, label: "💼 Trabajo Normal", tone: "text-secondary" },
        { to: "/tareas?ambito=Diaria", icon: SunMedium, label: "☀️ Diarias & Personales", tone: "text-accent" },
      ],
    },
    {
      label: "Agencia & CRM",
      badge: "CRM",
      items: [
        { to: "/cotizador", icon: Calculator, label: "Cotizador Inteligente" },
        { to: "/presupuestos", icon: FileText, label: "Presupuestos" },
        { to: "/proyectos", icon: FolderKanban, label: "Proyectos" },
        { to: "/clientes", icon: Users, label: "Clientes" },
        { to: "/pipeline", icon: Target, label: "Pipeline Comercial" },
        { to: "/instagram", icon: Instagram, label: "Instagram Auto-DM" },
        { to: "/espacio", icon: BookOpen, label: "Espacio & Notas" },
      ],
    },
    {
      label: "Estrategia & Equipo",
      items: [
        { to: "/roadmap", icon: Flag, label: "Roadmap & Gantt" },
        { to: "/rompelineas", icon: Zap, label: "Rompelíneas" },
        { to: "/feedback", icon: Award, label: "Feedback & Desarrollo" },
      ],
    },
    {
      label: "Finanzas & Sistema",
      items: [
        { to: "/pagos", icon: DollarSign, label: "Pagos" },
        { to: "/facturas", icon: Receipt, label: "Facturas" },
        { to: "/contratos", icon: FileSignature, label: "Contratos" },
        { to: "/reportes", icon: BarChart3, label: "Reportes Financieros" },
        { to: "/configuracion", icon: Settings, label: "Configuración & WA" },
        { to: "/suscripcion", icon: CreditCard, label: "Suscripción" },
        ...(isAdmin ? [{ to: "/admin", icon: Shield, label: "Admin" }] : []),
      ],
    },
  ];

  const isItemActive = (itemTo: string) => {
    if (itemTo.includes("?")) {
      return fullPath === itemTo;
    }
    if (itemTo === "/tareas") {
      return (
        location.pathname === "/tareas" &&
        !location.search.includes("ambito=") &&
        !location.search.includes("vista=mine") &&
        !location.search.includes("vista=month")
      );
    }
    return location.pathname === itemTo;
  };

  const NavLinks = ({ isCompact = false }: { isCompact?: boolean }) => (
    <nav className="space-y-3">
      {navSections.map((section) => {
        const isOpen = openGroups[section.label] !== false;
        return (
          <div key={section.label} className="rounded-xl transition-all">
            {!isCompact && (
              <button
                type="button"
                onClick={() => toggleGroup(section.label)}
                className="w-full flex items-center justify-between text-[10px] font-heading font-bold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground mb-1 px-2.5 py-1 rounded-md transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span>{section.label}</span>
                  {(section as any).badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-mono">
                      {(section as any).badge}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
            )}
            {(isCompact || isOpen) && (
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      title={isCompact ? item.label : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center ${
                        isCompact ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2"
                      } rounded-xl text-xs font-medium transition-all duration-200 relative overflow-hidden group ${
                        isActive
                          ? "bg-gradient-to-r from-primary/20 via-secondary/10 to-transparent text-primary shadow-[0_4px_20px_-4px_rgba(255,92,92,0.3)] border border-primary/30 font-semibold translate-x-0.5"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:translate-x-0.5"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-primary via-secondary to-accent rounded-r-full" />
                      )}
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-200 shrink-0 ${
                          isActive
                            ? "bg-primary/20 text-primary scale-105"
                            : "bg-muted/50 group-hover:bg-primary/15 group-hover:scale-110"
                        }`}
                      >
                        <Icon
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isActive
                              ? "text-primary"
                              : `${(item as any).tone || ""} group-hover:text-primary`
                          }`}
                        />
                      </div>
                      {!isCompact && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {!isCompact && (
        <div className="pt-2 px-1 flex items-center justify-between border-t border-border/40 text-[10px] text-muted-foreground/70">
          <button
            type="button"
            onClick={toggleAllGroups}
            className="hover:text-foreground transition-colors font-medium"
          >
            {allExpanded ? "− Plegar todas las secciones" : "+ Desplegar todas las secciones"}
          </button>
        </div>
      )}
    </nav>
  );

  const SubscriptionBadge = ({ isCompact = false }: { isCompact?: boolean }) => {
    if (isCompact) return null;
    if (isPremium) {
      return (
        <Link to="/suscripcion" className="block px-2 mt-3">
          <Badge className="w-full justify-center py-1 gradient-button font-heading text-[11px] tracking-wider cursor-pointer">
            ✨ PRO ACTIVO
          </Badge>
        </Link>
      );
    }
    if (isTrial && trialDaysLeft !== null) {
      return (
        <Link to="/suscripcion" className="block px-2 mt-3">
          <Badge
            variant="outline"
            className="w-full justify-center py-1 border-nexabis-orange/50 text-nexabis-orange font-heading text-[11px] tracking-wider hover:bg-nexabis-orange/10 cursor-pointer"
          >
            TRIAL — {trialDaysLeft}d
          </Badge>
        </Link>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Nexabis OS Animated Glass TopBar */}
      <header className="h-14 border-b border-border/80 bg-card/75 backdrop-blur-xl sticky top-0 z-40 px-3 lg:px-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-68 p-4 bg-card/95 backdrop-blur-xl border-border overflow-y-auto">
              <div className="flex items-center gap-2.5 mb-5 px-2">
                <img src={nexabisLogo} alt="NEXABIS" className="h-8 w-8" />
                <div>
                  <span className="text-base font-heading font-bold gradient-text block leading-none">
                    NEXABIS OS
                  </span>
                  <span className="text-[10px] text-muted-foreground">Work · Life · CRM</span>
                </div>
              </div>
              <NavLinks />
              {!isStandalone && (
                <div className="px-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInstallPwa}
                    className="w-full text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Instalar App Móvil
                  </Button>
                </div>
              )}
              <SubscriptionBadge />
            </SheetContent>
          </Sheet>

          {/* Desktop Sidebar Collapse Toggle */}
          {menuStyle === "dock" && (
            <button
              onClick={toggleCollapsed}
              title={collapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
              className="hidden lg:inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-all"
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )}

          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <img
              src={nexabisLogo}
              alt="NEXABIS"
              className="h-7 w-7 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-base font-heading font-bold gradient-text tracking-tight">
                NEXABIS
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 font-heading font-semibold">
                <Sparkles className="w-2.5 h-2.5" />
                OS & CRM
              </span>
            </div>
          </Link>

          {/* Quick Scope Dock in TopBar */}
          <div className="hidden xl:flex items-center gap-1 ml-3 bg-muted/60 border border-border rounded-xl p-1">
            {[
              { to: "/tareas?ambito=Nexabis", label: "🏢 Nexabis", activeCls: "gradient-button text-white shadow-sm" },
              { to: "/tareas?ambito=Trabajo", label: "💼 Trabajo", activeCls: "bg-secondary text-white shadow-sm" },
              { to: "/tareas?ambito=Diaria", label: "☀️ Diarias", activeCls: "bg-accent text-accent-foreground font-semibold shadow-sm" },
              { to: "/tareas?vista=month", label: "📅 Mes", activeCls: "bg-primary/20 text-primary border border-primary/30" },
            ].map((pill) => {
              const active = fullPath === pill.to;
              return (
                <Link
                  key={pill.to}
                  to={pill.to}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                    active ? pill.activeCls : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                  }`}
                >
                  {pill.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Switch Menu Style (Floating Dock vs Top Horizontal Bar) */}
          <button
            type="button"
            onClick={toggleMenuStyle}
            title={
              menuStyle === "dock"
                ? "Cambiar a Menú Horizontal Superior"
                : "Cambiar a Menú Lateral Flotante"
            }
            className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-muted/40 hover:border-primary/40 text-[11px] text-muted-foreground hover:text-foreground transition-all"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-primary" />
            <span>{menuStyle === "dock" ? "Dock Lateral" : "Barra Superior"}</span>
          </button>

          {!isStandalone && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstallPwa}
              title="Instalar Nexabis como aplicación en tu móvil o escritorio"
              className="h-8 px-2.5 text-xs gap-1.5 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Instalar App</span>
            </Button>
          )}

          <Link
            to="/configuracion"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            title="WhatsApp Conectado (+56986343217 · Resumen diario 08:30 AM + Audio a Tarea)"
          >
            <MessageSquare className="w-3 h-3" />
            <span className="hidden md:inline">+569 8634 3217</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                waConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
          </Link>

          <Link to="/cotizador">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex h-8 px-2.5 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 font-heading"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Cotizador</span>
            </Button>
          </Link>

          <Link to="/crear">
            <Button size="sm" className="h-8 px-3 text-xs gap-1 gradient-button font-heading font-semibold">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Presupuesto</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleDarkMode}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Optional Horizontal Top Navigation Bar when menuStyle === 'topbar' */}
      {menuStyle === "topbar" && (
        <div className="hidden lg:flex items-center gap-1.5 px-5 py-2 border-b border-border bg-card/50 backdrop-blur-md overflow-x-auto">
          {navSections
            .flatMap((s) => s.items)
            .map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "gradient-button text-white shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </div>
      )}

      {/* Sidebar + Main Area */}
      <div className="flex flex-1 min-h-[calc(100vh-3.5rem)] pb-16 lg:pb-0">
        {/* Floating Glass Desktop Dock Sidebar */}
        {menuStyle === "dock" && (
          <aside
            className={`hidden lg:flex flex-col shrink-0 border-r border-border/80 bg-card/45 backdrop-blur-xl transition-all duration-300 ${
              collapsed ? "w-16 p-2" : "w-60 p-3"
            }`}
          >
            <div className="flex-1 overflow-y-auto pr-0.5">
              <NavLinks isCompact={collapsed} />
            </div>
            <SubscriptionBadge isCompact={collapsed} />
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-3 md:p-4 lg:p-5 min-w-0 overflow-x-hidden">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            {children || <Outlet />}
          </Suspense>
        </main>
      </div>

      {/* Mobile PWA Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around">
        {[
          { to: "/dashboard", icon: LayoutDashboard, label: "Tablero" },
          { to: "/tareas?vista=mine", icon: CheckSquare, label: "Mi Día" },
          { to: "/tareas?vista=month", icon: Calendar, label: "Mes" },
          { to: "/cotizador", icon: Calculator, label: "Cotizador" },
        ].map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-all ${
                active ? "text-primary font-semibold scale-105" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${active ? "text-primary" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-4 h-4 mb-0.5" />
          <span>Menú</span>
        </button>
      </nav>
    </div>
  );
};

export default DashboardLayout;
