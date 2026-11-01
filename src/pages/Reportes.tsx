import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, DollarSign, Download, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartPie,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Nexabis Brand Extended Palette
const COLORS = ["#FF5C5C", "#FF8042", "#FFC24D", "#34D399", "#38BDF8", "#F472B6", "#A78BFA", "#F59E0B"];

export default function Reportes() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("12");
  const [data, setData] = useState<any>({
    ingresosMensuales: [],
    clientesPorEtapa: [],
    clientesPorFuente: [],
    pipeline: [],
    topClientes: [],
    presupuestosPorEstado: [],
    resumen: { totalClientes: 0, totalIngresos: 0, totalPresupuestos: 0, totalProyectos: 0 },
  });

  useEffect(() => {
    loadReports();
  }, [periodo]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const mesesAtras = parseInt(periodo);
      const fechaDesde = new Date();
      fechaDesde.setMonth(fechaDesde.getMonth() - mesesAtras);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [clientesRes, pagosRes, presupuestosRes, oportunidadesRes, etapasRes] =
        await Promise.all([
          supabaseCRM
            .from("clientes")
            .select("id, nombre, empresa, etapa_ciclo, fuente, created_at")
            .eq("usuario_id", user.id),
          supabaseCRM
            .from("pagos")
            .select("id, monto, estado, fecha_pago, cliente_id, clientes(nombre)")
            .eq("usuario_id", user.id)
            .gte("fecha_pago", fechaDesde.toISOString()),
          supabase
            .from("presupuestos")
            .select("id, total, estado, created_at")
            .eq("usuario_id", user.id),
          supabaseCRM
            .from("oportunidades")
            .select("id, valor, estado, etapa_id")
            .eq("usuario_id", user.id)
            .eq("estado", "abierta"),
          supabaseCRM
            .from("pipeline_etapas")
            .select("id, nombre, color, orden")
            .eq("usuario_id", user.id)
            .order("orden"),
        ]);

      const clientes = clientesRes.data || [];
      const pagos = pagosRes.data || [];
      const presupuestos = presupuestosRes.data || [];
      const oportunidades = oportunidadesRes.data || [];
      const etapas = etapasRes.data || [];

      const monthMap: Record<string, number> = {};
      pagos
        .filter((p) => p.estado === "completado")
        .forEach((p) => {
          const d = new Date(p.fecha_pago);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthMap[key] = (monthMap[key] || 0) + Number(p.monto);
        });
      const ingresosMensuales = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, total]) => ({ mes, total }));

      const etapaCount: Record<string, number> = {};
      clientes.forEach((c) => {
        etapaCount[c.etapa_ciclo || "lead"] = (etapaCount[c.etapa_ciclo || "lead"] || 0) + 1;
      });
      const clientesPorEtapa = Object.entries(etapaCount).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      const fuenteCount: Record<string, number> = {};
      clientes.forEach((c) => {
        fuenteCount[c.fuente || "directo"] = (fuenteCount[c.fuente || "directo"] || 0) + 1;
      });
      const clientesPorFuente = Object.entries(fuenteCount).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      const pipeline = etapas.map((e) => ({
        name: e.nombre,
        value: oportunidades
          .filter((o) => o.etapa_id === e.id)
          .reduce((s, o) => s + Number(o.valor), 0),
        count: oportunidades.filter((o) => o.etapa_id === e.id).length,
        fill: e.color,
      }));

      const clientePagos: Record<string, { nombre: string; total: number }> = {};
      pagos
        .filter((p) => p.estado === "completado")
        .forEach((p) => {
          if (!clientePagos[p.cliente_id])
            clientePagos[p.cliente_id] = {
              nombre: (p.clientes as any)?.nombre || "?",
              total: 0,
            };
          clientePagos[p.cliente_id].total += Number(p.monto);
        });
      const topClientes = Object.values(clientePagos)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      const estadoCount: Record<string, number> = {};
      presupuestos.forEach((p) => {
        estadoCount[p.estado || "pendiente"] = (estadoCount[p.estado || "pendiente"] || 0) + 1;
      });
      const presupuestosPorEstado = Object.entries(estadoCount).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      setData({
        ingresosMensuales,
        clientesPorEtapa,
        clientesPorFuente,
        pipeline,
        topClientes,
        presupuestosPorEstado,
        resumen: {
          totalClientes: clientes.length,
          totalIngresos: pagos
            .filter((p) => p.estado === "completado")
            .reduce((s, p) => s + Number(p.monto), 0),
          totalPresupuestos: presupuestos.length,
          totalProyectos: oportunidades.length,
        },
      });
    } catch (e: any) {
      toast.error("Error cargando reportes");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (tableData: any[], filename: string) => {
    if (!tableData.length) return;
    const headers = Object.keys(tableData[0]).join(",");
    const rows = tableData.map((row) => Object.values(row).join(",")).join("\n");
    const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-heading font-bold gradient-text flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Reportes & Analítica
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visualiza el rendimiento de tu negocio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[155px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
                <SelectItem value="24">Últimos 2 años</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs px-3 gap-1.5"
              onClick={() => exportCSV(data.topClientes, "top_clientes")}
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </Button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3.5 border-primary/20 bg-primary/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Clientes
                </p>
                <p className="text-lg md:text-xl font-bold font-mono">
                  {data.resumen.totalClientes}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-green-500/20 bg-green-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Ingresos
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-green-400">
                  ${data.resumen.totalIngresos.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-yellow-500/20 bg-yellow-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Presupuestos
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-yellow-400">
                  {data.resumen.totalPresupuestos}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-purple-500/20 bg-purple-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Oportunidades
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-purple-400">
                  {data.resumen.totalProyectos}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Target className="w-4 h-4" />
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="ingresos" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="ingresos" className="text-xs h-7 px-3">
              💰 Ingresos
            </TabsTrigger>
            <TabsTrigger value="clientes" className="text-xs h-7 px-3">
              👥 Clientes
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="text-xs h-7 px-3">
              🎯 Pipeline
            </TabsTrigger>
            <TabsTrigger value="ranking" className="text-xs h-7 px-3">
              🏆 Ranking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingresos" className="space-y-4">
            <Card className="p-4 transition-all duration-200 hover:border-primary/40">
              <h3 className="text-sm md:text-base font-heading font-semibold mb-3">
                Ingresos Mensuales
              </h3>
              {data.ingresosMensuales.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.ingresosMensuales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="total"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name="Ingresos ($)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-xs text-muted-foreground py-8">
                  No hay datos de ingresos en este período
                </p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="clientes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 transition-all duration-200 hover:border-primary/40">
                <h3 className="text-sm md:text-base font-heading font-semibold mb-3">
                  Clientes por Etapa
                </h3>
                {data.clientesPorEtapa.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <RechartPie>
                      <Pie
                        data={data.clientesPorEtapa}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {data.clientesPorEtapa.map((_: any, idx: number) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                    </RechartPie>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-8">Sin datos</p>
                )}
              </Card>
              <Card className="p-4 transition-all duration-200 hover:border-primary/40">
                <h3 className="text-sm md:text-base font-heading font-semibold mb-3">
                  Clientes por Fuente
                </h3>
                {data.clientesPorFuente.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <RechartPie>
                      <Pie
                        data={data.clientesPorFuente}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {data.clientesPorFuente.map((_: any, idx: number) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                    </RechartPie>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-8">Sin datos</p>
                )}
              </Card>
            </div>

            <Card className="p-4 transition-all duration-200 hover:border-primary/40">
              <h3 className="text-sm md:text-base font-heading font-semibold mb-3">
                Presupuestos por Estado
              </h3>
              {data.presupuestosPorEstado.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.presupuestosPorEstado} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Cantidad" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-xs text-muted-foreground py-8">Sin datos</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4">
            <Card className="p-4 transition-all duration-200 hover:border-primary/40">
              <h3 className="text-sm md:text-base font-heading font-semibold mb-3">
                Pipeline de Ventas — Valor por Etapa
              </h3>
              {data.pipeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.pipeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Valor ($)">
                      {data.pipeline.map((entry: any, idx: number) => (
                        <Cell key={idx} fill={entry.fill || COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-xs text-muted-foreground py-8">
                  Sin datos de pipeline
                </p>
              )}
            </Card>

            <Card className="overflow-hidden transition-all duration-200 hover:border-primary/40">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                        Etapa
                      </th>
                      <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                        Oportunidades
                      </th>
                      <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                        Valor Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pipeline.map((p: any, idx: number) => (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="p-2.5 text-xs flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: p.fill }}
                          />
                          {p.name}
                        </td>
                        <td className="p-2.5 text-xs font-mono">{p.count}</td>
                        <td className="p-2.5 text-xs font-bold font-mono">
                          ${p.value.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="ranking" className="space-y-4">
            <Card className="p-4 transition-all duration-200 hover:border-primary/40">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm md:text-base font-heading font-semibold">
                  Top Clientes por Ingresos
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => exportCSV(data.topClientes, "top_clientes")}
                >
                  <Download className="w-3 h-3" /> CSV
                </Button>
              </div>
              {data.topClientes.length > 0 ? (
                <div className="space-y-2">
                  {data.topClientes.map((c: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0
                              ? "bg-yellow-500/20 text-yellow-400"
                              : idx === 1
                              ? "bg-gray-400/20 text-gray-400"
                              : idx === 2
                              ? "bg-orange-600/20 text-orange-500"
                              : "bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className="text-xs md:text-sm font-medium">{c.nombre}</span>
                      </div>
                      <span className="font-bold font-mono text-sm md:text-base text-primary">
                        ${c.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground py-8">Sin datos de pagos</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
