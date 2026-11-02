import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

// Lazy-loaded pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Presupuestos = lazy(() => import("./pages/Presupuestos"));
const CrearPresupuesto = lazy(() => import("./pages/CrearPresupuesto"));
const PresupuestoPublico = lazy(() => import("./pages/PresupuestoPublico"));
const LinkCorto = lazy(() => import("./pages/LinkCorto"));
const Privacidad = lazy(() => import("./pages/legal/Privacidad"));
const Terminos = lazy(() => import("./pages/legal/Terminos"));
const EliminarDatos = lazy(() => import("./pages/legal/EliminarDatos"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const Clientes = lazy(() => import("./pages/Clientes"));
const ClienteDetalle = lazy(() => import("./pages/ClienteDetalle"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Cotizador = lazy(() => import("./pages/Cotizador"));
const Proyectos = lazy(() => import("./pages/Proyectos"));
const ProyectoDetalle = lazy(() => import("./pages/ProyectoDetalle"));
const Espacio = lazy(() => import("./pages/Espacio"));
const MiSuscripcion = lazy(() => import("./pages/MiSuscripcion"));
const Documentacion = lazy(() => import("./pages/Documentacion"));
const ComprobantePago = lazy(() => import("./pages/ComprobantePago"));
const Pagos = lazy(() => import("./pages/Pagos"));
const Pipeline = lazy(() => import("./pages/Pipeline"));
const Tareas = lazy(() => import("./pages/Tareas"));
const Facturas = lazy(() => import("./pages/Facturas"));
const Contratos = lazy(() => import("./pages/Contratos"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Instagram = lazy(() => import("./pages/Instagram"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-muted-foreground">Cargando...</p>
    </div>
  </div>
);

function SmartLanding() {
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setChecking(false);
    });
  }, []);

  if (checking) return <PageLoader />;
  if (isLoggedIn) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<SmartLanding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/presupuesto/:token" element={<PresupuestoPublico />} />
              <Route path="/r/:code" element={<LinkCorto />} />
              <Route path="/privacidad" element={<Privacidad />} />
              <Route path="/privacy" element={<Privacidad />} />
              <Route path="/terminos" element={<Terminos />} />
              <Route path="/terms" element={<Terminos />} />
              <Route path="/eliminar-datos" element={<EliminarDatos />} />
              <Route path="/data-deletion" element={<EliminarDatos />} />
              <Route path="/comprobante/:token/:pagoNumero" element={<ComprobantePago />} />

              {/* Protected App Routes wrapped in persistent DashboardLayout shell */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/presupuestos" element={<Presupuestos />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/clientes/:id" element={<ClienteDetalle />} />
                <Route path="/proyectos" element={<Proyectos />} />
                <Route path="/pipeline" element={<Pipeline />} />
                <Route path="/instagram" element={<Instagram />} />
                <Route path="/tareas" element={<Tareas initialView="kanban" />} />
                <Route path="/roadmap" element={<Tareas initialView="roadmap" />} />
                <Route path="/rompelineas" element={<Tareas initialView="breakers" />} />
                <Route path="/feedback" element={<Tareas initialView="fb" />} />
                <Route path="/espacio" element={<Espacio />} />
                <Route path="/pagos" element={<Pagos />} />
                <Route path="/facturas" element={<Facturas />} />
                <Route path="/contratos" element={<Contratos />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/cotizador" element={<Cotizador />} />
                <Route path="/crear" element={<CrearPresupuesto />} />
                <Route path="/configuracion" element={<Configuracion />} />
                <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
                <Route path="/suscripcion" element={<MiSuscripcion />} />
                <Route path="/documentacion" element={<Documentacion />} />
                <Route path="/admin" element={<AdminPanel />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
