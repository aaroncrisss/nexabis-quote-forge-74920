import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, FileText, CheckCircle2, Plus, DollarSign, Users, Target, ListTodo, AlertTriangle, Receipt, FileSignature, Clock, ArrowUpRight, CreditCard, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DemoDataButton } from "@/components/DemoDataButton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Line, ComposedChart } from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    // Financial
    totalIngresos: 0,
    totalNeto: 0,
    totalComisiones: 0,
    ingresosMes: 0,
    ingresosMesNeto: 0,
    ingresosMesAnterior: 0,
    cambioMensual: 0,
    // Clients
    totalClientes: 0,
    clientesNuevosMes: 0,
    // Pipeline
    pipelineValor: 0,
    pipelineCount: 0,
    // Budgets
    presupuestosPendientes: 0,
    presupuestosPendientesValor: 0,
    // Tasks
    tareasPendientes: 0,
    tareasVencidas: 0,
    // Invoices
    facturasSinCobrar: 0,
    facturasSinCobrarValor: 0,
    // Contracts
    contratosProximosVencer: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [actividad, setActividad] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all data in parallel
      const [
        clientesRes, pagosRes, presupuestosRes, tareasRes,
        facturasRes, contratosRes, oportunidadesRes, notasRes
      ] = await Promise.all([
        supabaseCRM.from("clientes").select("id, nombre, empresa, created_at").eq("usuario_id", user.id),
        supabaseCRM.from("pagos").select("id, monto, estado, fecha_pago, metodo_pago, cliente_id, clientes(nombre)").eq("usuario_id", user.id),
        supabase.from("presupuestos").select("id, total, estado, titulo, numero, created_at, fecha_vencimiento").eq("usuario_id", user.id),
        supabaseCRM.from("tareas").select("id, titulo, estado, prioridad, fecha_vencimiento, created_at").eq("usuario_id", user.id),
        supabaseCRM.from("facturas").select("id, total, estado, numero, titulo, created_at").eq("usuario_id", user.id),
        supabaseCRM.from("contratos").select("id, titulo, estado, fecha_fin, created_at").eq("usuario_id", user.id),
        supabaseCRM.from("oportunidades").select("id, titulo, valor, estado, created_at").eq("usuario_id", user.id),
        supabaseCRM.from("notas_cliente").select("id, contenido, tipo, created_at").eq("usuario_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      const clientes = clientesRes.data || [];
      const pagos = pagosRes.data || [];
      const presupuestos = presupuestosRes.data || [];
      const tareas = tareasRes.data || [];
      const facturas = facturasRes.data || [];
      const contratos = contratosRes.data || [];
      const oportunidades = oportunidadesRes.data || [];
      const notas = notasRes.data || [];

      const now = new Date();
      const mesActualStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const mesAnteriorStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Financial KPIs
      const MP_COMISION = 0.0266;
      const getComision = (p: any) => p.metodo_pago === "mercadopago" ? Number(p.monto) * MP_COMISION : 0;

      const pagosCompletados = pagos.filter(p => p.estado === "completado");
      const totalIngresos = pagosCompletados.reduce((s, p) => s + Number(p.monto), 0);
      const totalComisiones = pagosCompletados.reduce((s, p) => s + getComision(p), 0);
      const totalNeto = totalIngresos - totalComisiones;

      const pagosMes = pagosCompletados.filter(p => new Date(p.fecha_pago) >= mesActualStart);
      const ingresosMes = pagosMes.reduce((s, p) => s + Number(p.monto), 0);
      const ingresosMesNeto = ingresosMes - pagosMes.reduce((s, p) => s + getComision(p), 0);

      const ingresosMesAnterior = pagosCompletados
        .filter(p => {
          const d = new Date(p.fecha_pago);
          return d >= mesAnteriorStart && d < mesActualStart;
        })
        .reduce((s, p) => s + Number(p.monto), 0);
      const cambioMensual = ingresosMesAnterior > 0
        ? Math.round(((ingresosMes - ingresosMesAnterior) / ingresosMesAnterior) * 100)
        : ingresosMes > 0 ? 100 : 0;

      // Clients
      const clientesNuevosMes = clientes.filter(c => new Date(c.created_at) >= mesActualStart).length;

      // Pipeline
      const oportunidadesAbiertas = oportunidades.filter(o => o.estado === "abierta");
      const pipelineValor = oportunidadesAbiertas.reduce((s, o) => s + Number(o.valor), 0);

      // Budgets
      const presupuestosPendientes = presupuestos.filter(p => p.estado === "pendiente");

      // Tasks
      const tareasPendientes = tareas.filter(t => ["to_do", "in_progress", "blocked"].includes(t.estado));
      const tareasVencidas = tareasPendientes.filter(t => t.fecha_vencimiento && new Date(t.fecha_vencimiento) < now);

      // Invoices
      const facturasSinCobrar = facturas.filter(f => ["enviada", "borrador"].includes(f.estado));

      // Contracts expiring in 30 days
      const treintaDias = new Date();
      treintaDias.setDate(treintaDias.getDate() + 30);
      const contratosProximos = contratos.filter(c =>
        c.estado === "activo" && c.fecha_fin &&
        new Date(c.fecha_fin) >= now && new Date(c.fecha_fin) <= treintaDias
      );

      setStats({
        totalIngresos,
        totalNeto,
        totalComisiones,
        ingresosMes,
        ingresosMesNeto,
        ingresosMesAnterior,
        cambioMensual,
        totalClientes: clientes.length,
        clientesNuevosMes,
        pipelineValor,
        pipelineCount: oportunidadesAbiertas.length,
        presupuestosPendientes: presupuestosPendientes.length,
        presupuestosPendientesValor: presupuestosPendientes.reduce((s, p) => s + Number(p.total), 0),
        tareasPendientes: tareasPendientes.length,
        tareasVencidas: tareasVencidas.length,
        facturasSinCobrar: facturasSinCobrar.length,
        facturasSinCobrarValor: facturasSinCobrar.reduce((s, f) => s + Number(f.total), 0),
        contratosProximosVencer: contratosProximos.length,
      });

      // Chart: Ingresos por mes (últimos 6 meses)
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const chartArr = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const monthPagos = pagosCompletados.filter(p => {
          const pd = new Date(p.fecha_pago);
          return pd >= d && pd < nextMonth;
        });
        const ingresosBrutos = monthPagos.reduce((s, p) => s + Number(p.monto), 0);
        const mesComisiones = monthPagos.reduce((s, p) => s + getComision(p), 0);
        chartArr.push({
          mes: monthNames[d.getMonth()],
          ingresos: ingresosBrutos,
          neto: ingresosBrutos - mesComisiones,
          count: monthPagos.length,
        });
      }
      setChartData(chartArr);

      // Activity timeline — merge latest events
      const timeline: any[] = [];

      pagos.slice(0, 8).forEach(p => timeline.push({
        date: p.fecha_pago,
        type: "pago",
        icon: "💰",
        text: `Pago ${p.estado === "completado" ? "recibido" : p.estado}: $${Number(p.monto).toLocaleString()} via ${p.metodo_pago}`,
        sub: (p.clientes as any)?.nombre || "",
      }));

      presupuestos.slice(0, 5).forEach(p => timeline.push({
        date: p.created_at,
        type: "presupuesto",
        icon: "📄",
        text: `Presupuesto ${p.numero}: ${p.titulo}`,
        sub: `$${Number(p.total).toLocaleString()} — ${p.estado?.toUpperCase()}`,
      }));

      tareas.filter(t => t.estado === "completada").slice(0, 5).forEach(t => timeline.push({
        date: t.created_at,
        type: "tarea",
        icon: "✅",
        text: `Tarea completada: ${t.titulo}`,
        sub: "",
      }));

      notas.slice(0, 5).forEach(n => timeline.push({
        date: n.created_at,
        type: "nota",
        icon: "📝",
        text: n.contenido?.substring(0, 80) + (n.contenido?.length > 80 ? "..." : ""),
        sub: n.tipo,
      }));

      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActividad(timeline.slice(0, 12));

    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Cargando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">Dashboard CRM</h1>
            <p className="text-sm text-muted-foreground mt-1">Vista completa de tu negocio</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DemoDataButton />
            <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/pagos")}>
              <CreditCard className="w-3.5 h-3.5" /> Registrar Pago
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/tareas")}>
              <ListTodo className="w-3.5 h-3.5" /> Nueva Tarea
            </Button>
            <Button size="sm" className="gap-1 gradient-button" onClick={() => navigate("/crear")}>
              <Plus className="w-3.5 h-3.5" /> Presupuesto
            </Button>
          </div>
        </div>

        {/* Alertas Panel */}
        {(stats.tareasVencidas > 0 || stats.contratosProximosVencer > 0 || stats.facturasSinCobrar > 0) && (
          <div className="flex flex-col gap-3">
            {stats.tareasVencidas > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Tareas Vencidas</p>
                    <p className="text-xs opacity-90">Tienes {stats.tareasVencidas} tareas que ya pasaron su fecha límite de entrega.</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-red-500/20 text-red-500 flex-shrink-0" onClick={() => navigate("/tareas")}>
                  Ir a Tareas →
                </Button>
              </div>
            )}
            {stats.contratosProximosVencer > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Contratos Próximos a Vencer</p>
                    <p className="text-xs opacity-90">Hay {stats.contratosProximosVencer} contratos que vencen en los próximos 30 días.</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-orange-500/20 text-orange-500 flex-shrink-0" onClick={() => navigate("/contratos")}>
                  Ir a Contratos →
                </Button>
              </div>
            )}
            {stats.facturasSinCobrar > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-600 dark:text-yellow-400">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Facturas Sin Cobrar</p>
                    <p className="text-xs opacity-90">Tienes {stats.facturasSinCobrar} facturas emitidas por un total de ${Math.round(stats.facturasSinCobrarValor).toLocaleString()} pendientes de cobro.</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex-shrink-0" onClick={() => navigate("/facturas")}>
                  Ir a Facturas →
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Row 1: Main Financial KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-green-500/20 bg-green-500/5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-500/10"><DollarSign className="w-4 h-4 text-green-400" /></div>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Ingreso Neto Total</p>
            <p className="text-2xl font-bold text-green-400">${Math.round(stats.totalNeto).toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Bruto: ${Math.round(stats.totalIngresos).toLocaleString()} | Comisiones: -${Math.round(stats.totalComisiones).toLocaleString()}</p>
          </Card>

          <Card className="p-4 border-primary/20 bg-primary/5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary/10"><Calendar className="w-4 h-4 text-primary" /></div>
              {stats.cambioMensual !== 0 && (
                <Badge className={`text-xs ${stats.cambioMensual > 0 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                  {stats.cambioMensual > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {stats.cambioMensual > 0 ? "+" : ""}{stats.cambioMensual}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Neto del Mes</p>
            <p className="text-2xl font-bold">${Math.round(stats.ingresosMesNeto).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Bruto: ${Math.round(stats.ingresosMes).toLocaleString()}</p>
          </Card>

          <Card className="p-4 border-blue-500/20 bg-blue-500/5 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/clientes")}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10"><Users className="w-4 h-4 text-blue-400" /></div>
              {stats.clientesNuevosMes > 0 && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                  +{stats.clientesNuevosMes} este mes
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Clientes</p>
            <p className="text-2xl font-bold text-blue-400">{stats.totalClientes}</p>
            <p className="text-xs text-muted-foreground mt-1">Clientes activos en cartera</p>
          </Card>

          <Card className="p-4 border-purple-500/20 bg-purple-500/5 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/pipeline")}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10"><Target className="w-4 h-4 text-purple-400" /></div>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Pipeline</p>
            <p className="text-2xl font-bold text-purple-400">${stats.pipelineValor.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.pipelineCount} oportunidades abiertas</p>
          </Card>
        </div>

        {/* Row 2: Secondary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/presupuestos")}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10"><FileText className="w-4 h-4 text-yellow-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Presupuestos Pendientes</p>
                <p className="text-lg font-bold">{stats.presupuestosPendientes}</p>
                <p className="text-xs text-muted-foreground">${stats.presupuestosPendientesValor.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${stats.tareasVencidas > 0 ? "border-red-500/30" : ""}`} onClick={() => navigate("/tareas")}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10"><ListTodo className="w-4 h-4 text-orange-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Tareas Pendientes</p>
                <p className="text-lg font-bold">{stats.tareasPendientes}</p>
                {stats.tareasVencidas > 0 && (
                  <p className="text-xs text-red-400 font-medium">⚠ {stats.tareasVencidas} vencidas</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/facturas")}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10"><Receipt className="w-4 h-4 text-cyan-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Facturas sin Cobrar</p>
                <p className="text-lg font-bold">{stats.facturasSinCobrar}</p>
                <p className="text-xs text-muted-foreground">${stats.facturasSinCobrarValor.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${stats.contratosProximosVencer > 0 ? "border-orange-500/30" : ""}`} onClick={() => navigate("/contratos")}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10"><FileSignature className="w-4 h-4 text-pink-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Contratos por Vencer</p>
                <p className="text-lg font-bold">{stats.contratosProximosVencer}</p>
                <p className="text-xs text-muted-foreground">Próximos 30 días</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Chart + Activity */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Chart - takes 3 cols */}
          <Card className="lg:col-span-3 p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Ingresos — Últimos 6 Meses</h3>
            {chartData.some(d => d.ingresos > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number, name: string) => [
                      `$${Math.round(value).toLocaleString()}`,
                      name === "neto" ? "Ingreso Neto" : name === "ingresos" ? "Ingreso Bruto" : name
                    ]}
                  />
                  <Bar dataKey="neto" fill="url(#dashGradient)" radius={[6, 6, 0, 0]} name="neto" />
                  <Line type="monotone" dataKey="neto" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Tendencia" />
                  <Line type="monotone" dataKey="ingresos" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeWidth={1} dot={false} name="ingresos" />
                  <defs>
                    <linearGradient id="dashGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                <div className="text-center">
                  <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Sin datos de ingresos aún</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => navigate("/pagos")}>Registrar primer pago</Button>
                </div>
              </div>
            )}
          </Card>

          {/* Activity - takes 2 cols */}
          <Card className="lg:col-span-2 p-4 max-h-[400px] overflow-y-auto">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider sticky top-0 bg-card pb-2">Actividad Reciente</h3>
            {actividad.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <div className="text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin actividad aún</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {actividad.map((item, idx) => (
                  <div key={idx} className="flex gap-3 py-2 border-b border-border/30 last:border-0">
                    <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-tight truncate">{item.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.sub && <span className="text-xs text-muted-foreground">{item.sub}</span>}
                        <span className="text-xs text-muted-foreground/60">
                          {formatRelativeDate(item.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return date.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

export default Dashboard;
