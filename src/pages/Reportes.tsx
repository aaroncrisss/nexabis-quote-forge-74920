import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, DollarSign, Download, PieChart, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartPie, Pie, Cell, LineChart, Line, Legend, Funnel, FunnelChart } from "recharts";

const COLORS = ["#8b5cf6", "#6366f1", "#f59e0b", "#22c55e", "#ef4444", "#06b6d4", "#ec4899", "#f97316"];

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

    useEffect(() => { loadReports(); }, [periodo]);

    const loadReports = async () => {
        try {
            setLoading(true);
            const mesesAtras = parseInt(periodo);
            const fechaDesde = new Date();
            fechaDesde.setMonth(fechaDesde.getMonth() - mesesAtras);

            // Load all data in parallel
            const [clientesRes, pagosRes, presupuestosRes, oportunidadesRes, etapasRes] = await Promise.all([
                supabaseCRM.from("clientes").select("id, nombre, empresa, etapa_ciclo, fuente, created_at"),
                supabaseCRM.from("pagos").select("id, monto, estado, fecha_pago, cliente_id, clientes(nombre)").gte("fecha_pago", fechaDesde.toISOString()),
                supabase.from("presupuestos").select("id, total, estado, created_at"),
                supabaseCRM.from("oportunidades").select("id, valor, estado, etapa_id").eq("estado", "abierta"),
                supabaseCRM.from("pipeline_etapas").select("id, nombre, color, orden").order("orden"),
            ]);

            const clientes = clientesRes.data || [];
            const pagos = pagosRes.data || [];
            const presupuestos = presupuestosRes.data || [];
            const oportunidades = oportunidadesRes.data || [];
            const etapas = etapasRes.data || [];

            // Ingresos mensuales
            const monthMap: Record<string, number> = {};
            pagos.filter(p => p.estado === "completado").forEach(p => {
                const d = new Date(p.fecha_pago);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                monthMap[key] = (monthMap[key] || 0) + Number(p.monto);
            });
            const ingresosMensuales = Object.entries(monthMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([mes, total]) => ({ mes, total }));

            // Clientes por etapa
            const etapaCount: Record<string, number> = {};
            clientes.forEach(c => { etapaCount[c.etapa_ciclo || "lead"] = (etapaCount[c.etapa_ciclo || "lead"] || 0) + 1; });
            const clientesPorEtapa = Object.entries(etapaCount).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

            // Clientes por fuente
            const fuenteCount: Record<string, number> = {};
            clientes.forEach(c => { fuenteCount[c.fuente || "directo"] = (fuenteCount[c.fuente || "directo"] || 0) + 1; });
            const clientesPorFuente = Object.entries(fuenteCount).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

            // Pipeline funnel
            const pipeline = etapas.map(e => ({
                name: e.nombre,
                value: oportunidades.filter(o => o.etapa_id === e.id).reduce((s, o) => s + Number(o.valor), 0),
                count: oportunidades.filter(o => o.etapa_id === e.id).length,
                fill: e.color,
            }));

            // Top clientes por pagos
            const clientePagos: Record<string, { nombre: string; total: number }> = {};
            pagos.filter(p => p.estado === "completado").forEach(p => {
                if (!clientePagos[p.cliente_id]) clientePagos[p.cliente_id] = { nombre: (p.clientes as any)?.nombre || "?", total: 0 };
                clientePagos[p.cliente_id].total += Number(p.monto);
            });
            const topClientes = Object.values(clientePagos).sort((a, b) => b.total - a.total).slice(0, 10);

            // Presupuestos por estado
            const estadoCount: Record<string, number> = {};
            presupuestos.forEach(p => { estadoCount[p.estado || "pendiente"] = (estadoCount[p.estado || "pendiente"] || 0) + 1; });
            const presupuestosPorEstado = Object.entries(estadoCount).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

            setData({
                ingresosMensuales,
                clientesPorEtapa,
                clientesPorFuente,
                pipeline,
                topClientes,
                presupuestosPorEstado,
                resumen: {
                    totalClientes: clientes.length,
                    totalIngresos: pagos.filter(p => p.estado === "completado").reduce((s, p) => s + Number(p.monto), 0),
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
        const rows = tableData.map(row => Object.values(row).join(",")).join("\n");
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
                <div className="flex h-[80vh] items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Reportes & Analítica</h1>
                        <p className="text-muted-foreground mt-1">Visualiza el rendimiento de tu negocio</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={periodo} onValueChange={setPeriodo}>
                            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3">Últimos 3 meses</SelectItem>
                                <SelectItem value="6">Últimos 6 meses</SelectItem>
                                <SelectItem value="12">Últimos 12 meses</SelectItem>
                                <SelectItem value="24">Últimos 2 años</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV(data.topClientes, "top_clientes")}>
                            <Download className="w-4 h-4" /> CSV
                        </Button>
                    </div>
                </div>

                {/* KPI Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Clientes</p>
                                <p className="text-2xl font-bold">{data.resumen.totalClientes}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 border-green-500/20 bg-green-500/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10"><DollarSign className="w-5 h-5 text-green-400" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Ingresos</p>
                                <p className="text-2xl font-bold text-green-400">${data.resumen.totalIngresos.toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/10"><BarChart3 className="w-5 h-5 text-yellow-400" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Presupuestos</p>
                                <p className="text-2xl font-bold text-yellow-400">{data.resumen.totalPresupuestos}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 border-purple-500/20 bg-purple-500/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10"><Target className="w-5 h-5 text-purple-400" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Oportunidades</p>
                                <p className="text-2xl font-bold text-purple-400">{data.resumen.totalProyectos}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Tabs defaultValue="ingresos">
                    <TabsList className="flex-wrap">
                        <TabsTrigger value="ingresos">💰 Ingresos</TabsTrigger>
                        <TabsTrigger value="clientes">👥 Clientes</TabsTrigger>
                        <TabsTrigger value="pipeline">🎯 Pipeline</TabsTrigger>
                        <TabsTrigger value="ranking">🏆 Ranking</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ingresos" className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Ingresos Mensuales</h3>
                            {data.ingresosMensuales.length > 0 ? (
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={data.ingresosMensuales}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Ingresos ($)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-muted-foreground py-10">No hay datos de ingresos en este período</p>
                            )}
                        </Card>
                    </TabsContent>

                    <TabsContent value="clientes" className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Clientes por Etapa</h3>
                                {data.clientesPorEtapa.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartPie>
                                            <Pie data={data.clientesPorEtapa} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                                {data.clientesPorEtapa.map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </RechartPie>
                                    </ResponsiveContainer>
                                ) : <p className="text-center text-muted-foreground py-10">Sin datos</p>}
                            </Card>
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Clientes por Fuente</h3>
                                {data.clientesPorFuente.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartPie>
                                            <Pie data={data.clientesPorFuente} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                                {data.clientesPorFuente.map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </RechartPie>
                                    </ResponsiveContainer>
                                ) : <p className="text-center text-muted-foreground py-10">Sin datos</p>}
                            </Card>
                        </div>

                        {/* Presupuestos por estado */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Presupuestos por Estado</h3>
                            {data.presupuestosPorEstado.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={data.presupuestosPorEstado} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Cantidad" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="text-center text-muted-foreground py-10">Sin datos</p>}
                        </Card>
                    </TabsContent>

                    <TabsContent value="pipeline" className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Pipeline de Ventas — Valor por Etapa</h3>
                            {data.pipeline.length > 0 ? (
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={data.pipeline}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Valor ($)">
                                            {data.pipeline.map((entry: any, idx: number) => <Cell key={idx} fill={entry.fill || COLORS[idx % COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="text-center text-muted-foreground py-10">Sin datos de pipeline</p>}
                        </Card>

                        {/* Pipeline detail table */}
                        <Card className="overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/30">
                                        <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Etapa</th>
                                        <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Oportunidades</th>
                                        <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Valor Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.pipeline.map((p: any, idx: number) => (
                                        <tr key={idx} className="border-b border-border/50">
                                            <td className="p-3 flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.fill }} />
                                                {p.name}
                                            </td>
                                            <td className="p-3">{p.count}</td>
                                            <td className="p-3 font-bold">${p.value.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </TabsContent>

                    <TabsContent value="ranking" className="space-y-6">
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Top Clientes por Ingresos</h3>
                                <Button variant="outline" size="sm" onClick={() => exportCSV(data.topClientes, "top_clientes")}>
                                    <Download className="w-3 h-3 mr-1" /> CSV
                                </Button>
                            </div>
                            {data.topClientes.length > 0 ? (
                                <div className="space-y-3">
                                    {data.topClientes.map((c: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? "bg-yellow-500/20 text-yellow-400" :
                                                    idx === 1 ? "bg-gray-400/20 text-gray-400" :
                                                        idx === 2 ? "bg-orange-600/20 text-orange-500" :
                                                            "bg-muted/50 text-muted-foreground"
                                                    }`}>
                                                    {idx + 1}
                                                </div>
                                                <span className="font-medium">{c.nombre}</span>
                                            </div>
                                            <span className="font-bold text-lg text-primary">${c.total.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-center text-muted-foreground py-10">Sin datos de pagos</p>}
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
