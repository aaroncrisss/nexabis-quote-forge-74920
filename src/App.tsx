import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";

// Lazy-loaded pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Presupuestos = lazy(() => import("./pages/Presupuestos"));
const CrearPresupuesto = lazy(() => import("./pages/CrearPresupuesto"));
const PresupuestoPublico = lazy(() => import("./pages/PresupuestoPublico"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const Clientes = lazy(() => import("./pages/Clientes"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Cotizador = lazy(() => import("./pages/Cotizador"));
const Proyectos = lazy(() => import("./pages/Proyectos"));
const ProyectoDetalle = lazy(() => import("./pages/ProyectoDetalle"));
const MiSuscripcion = lazy(() => import("./pages/MiSuscripcion"));
const Documentacion = lazy(() => import("./pages/Documentacion"));
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

// Auto-redirect to /dashboard if user is already logged in
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
              <Route path="/" element={<SmartLanding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/presupuestos" element={<ProtectedRoute><Presupuestos /></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
              <Route path="/proyectos" element={<ProtectedRoute><Proyectos /></ProtectedRoute>} />
              <Route path="/cotizador" element={<ProtectedRoute><Cotizador /></ProtectedRoute>} />
              <Route path="/crear" element={<ProtectedRoute><CrearPresupuesto /></ProtectedRoute>} />
              <Route path="/presupuesto/:token" element={<PresupuestoPublico />} />
              <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
              <Route path="/proyectos/:id" element={<ProtectedRoute><ProyectoDetalle /></ProtectedRoute>} />
              <Route path="/suscripcion" element={<ProtectedRoute><MiSuscripcion /></ProtectedRoute>} />
              <Route path="/documentacion" element={<ProtectedRoute><Documentacion /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

