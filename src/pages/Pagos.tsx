import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Plus, Search, TrendingUp, CreditCard, Banknote, ArrowUpRight, ArrowDownRight, Calendar, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import type { Pago } from "@/types/crm";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function Pagos() {
    const navigate = useNavigate();
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos");
    const [filtroMetodo, setFiltroMetodo] = useState("todos");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [clientes, setClientes] = useState<any[]>([]);
    const [presupuestos, setPresupuestos] = useState<any[]>([]);

    // Form state
    const [form, setForm] = useState({
        cliente_id: "",
        presupuesto_id: "",
        monto: "",
        moneda: "CLP",
        metodo_pago: "transferencia",
        referencia: "",
        estado: "completado",
        notas: "",
    });

    useEffect(() => {
        loadPagos();
        loadClientes();
    }, []);

    const loadPagos = async () => {
        try {
            const { data, error } = await supabaseCRM
                .from("pagos")
                .select("*, clientes(nombre, empresa)")
                .order("fecha_pago", { ascending: false });
            if (error) throw error;
            setPagos(data || []);
        } catch (e: any) {
            toast.error("Error cargando pagos");
        } finally {
            setLoading(false);
        }
    };

    const loadClientes = async () => {
        const { data } = await supabase.from("clientes").select("id, nombre, empresa").order("nombre");
        setClientes(data || []);
    };

    const loadPresupuestos = async (clienteId: string) => {
        const { data } = await supabase
            .from("presupuestos")
            .select("id, numero, titulo, total")
            .eq("cliente_id", clienteId)
            .order("created_at", { ascending: false });
        setPresupuestos(data || []);
    };

    const handleSubmit = async () => {
        if (!form.cliente_id || !form.monto) {
            toast.error("Cliente y monto son obligatorios");
            return;
        }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabaseCRM.from("pagos").insert({
                usuario_id: user.id,
                cliente_id: form.cliente_id,
                presupuesto_id: form.presupuesto_id || null,
                monto: parseFloat(form.monto),
                moneda: form.moneda,
                metodo_pago: form.metodo_pago,
                referencia: form.referencia || null,
                estado: form.estado,
                notas: form.notas || null,
            });
            if (error) throw error;
            toast.success("Pago registrado correctamente");
            setDialogOpen(false);
            setForm({ cliente_id: "", presupuesto_id: "", monto: "", moneda: "CLP", metodo_pago: "transferencia", referencia: "", estado: "completado", notas: "" });
            loadPagos();
        } catch (e: any) {
            toast.error("Error al registrar pago: " + e.message);
        }
    };

    const filtered = pagos.filter((p) => {
        const matchSearch =
            p.clientes?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
            p.referencia?.toLowerCase().includes(search.toLowerCase()) ||
            p.clientes?.empresa?.toLowerCase().includes(search.toLowerCase());
        const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado;
        const matchMetodo = filtroMetodo === "todos" || p.metodo_pago === filtroMetodo;
        return (search === "" || matchSearch) && matchEstado && matchMetodo;
    });

    const totalIngresos = pagos.filter((p) => p.estado === "completado").reduce((sum, p) => sum + Number(p.monto), 0);
    const totalPendiente = pagos.filter((p) => p.estado === "pendiente").reduce((sum, p) => sum + Number(p.monto), 0);
    const pagosMes = pagos.filter((p) => {
        const d = new Date(p.fecha_pago);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.estado === "completado";
    });
    const ingresosMes = pagosMes.reduce((sum, p) => sum + Number(p.monto), 0);

    const monthlyData = () => {
        const months: Record<string, number> = {};
        pagos
            .filter((p) => p.estado === "completado")
            .forEach((p) => {
                const d = new Date(p.fecha_pago);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                months[key] = (months[key] || 0) + Number(p.monto);
            });
        return Object.entries(months)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([mes, total]) => ({ mes: mes.slice(5), total }));
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case "completado": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completado</Badge>;
            case "pendiente": return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendiente</Badge>;
            case "fallido": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Fallido</Badge>;
            case "reembolsado": return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Reembolsado</Badge>;
            default: return <Badge variant="secondary">{estado}</Badge>;
        }
    };

    const getMetodoIcon = (metodo: string) => {
        switch (metodo) {
            case "transferencia": return <Banknote className="w-4 h-4" />;
            case "mercadopago": return <CreditCard className="w-4 h-4" />;
            case "tarjeta": return <CreditCard className="w-4 h-4" />;
            default: return <DollarSign className="w-4 h-4" />;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
                        <p className="text-muted-foreground mt-1">Gestiona todos los pagos recibidos de tus clientes</p>
                    </div>
                    <Button onClick={() => setDialogOpen(true)} className="gap-2 gradient-button">
                        <Plus className="w-4 h-4" /> Registrar Pago
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 border-green-500/20 bg-green-500/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Recibido</p>
                                <p className="text-2xl font-bold text-green-400">${totalIngresos.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/10"><TrendingUp className="w-5 h-5 text-green-400" /></div>
                        </div>
                    </Card>
                    <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pendiente</p>
                                <p className="text-2xl font-bold text-yellow-400">${totalPendiente.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-yellow-500/10"><ArrowUpRight className="w-5 h-5 text-yellow-400" /></div>
                        </div>
                    </Card>
                    <Card className="p-4 border-primary/20 bg-primary/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Este Mes</p>
                                <p className="text-2xl font-bold text-primary">${ingresosMes.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10"><Calendar className="w-5 h-5 text-primary" /></div>
                        </div>
                    </Card>
                </div>

                {/* Chart */}
                {monthlyData().length > 0 && (
                    <Card className="p-4">
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Ingresos Mensuales</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={monthlyData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                                    labelStyle={{ color: "hsl(var(--foreground))" }}
                                />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar por cliente, referencia..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="completado">Completado</SelectItem>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="fallido">Fallido</SelectItem>
                            <SelectItem value="reembolsado">Reembolsado</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Método" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos los métodos</SelectItem>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                            <SelectItem value="mercadopago">MercadoPago</SelectItem>
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                            <SelectItem value="tarjeta">Tarjeta</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Cliente</th>
                                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Monto</th>
                                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Método</th>
                                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Referencia</th>
                                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay pagos registrados</td></tr>
                                ) : (
                                    filtered.map((p) => (
                                        <tr key={p.id} className="border-b border-border/50 hover:bg-accent/5 transition-colors">
                                            <td className="p-3">
                                                <div>
                                                    <p className="font-medium">{p.clientes?.nombre || "—"}</p>
                                                    <p className="text-xs text-muted-foreground">{p.clientes?.empresa || ""}</p>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className="font-bold text-lg">${Number(p.monto).toLocaleString()}</span>
                                                <span className="text-xs text-muted-foreground ml-1">{p.moneda}</span>
                                            </td>
                                            <td className="p-3 hidden md:table-cell">
                                                <div className="flex items-center gap-2 text-sm">
                                                    {getMetodoIcon(p.metodo_pago)}
                                                    <span className="capitalize">{p.metodo_pago}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 hidden md:table-cell text-sm text-muted-foreground">{p.referencia || "—"}</td>
                                            <td className="p-3">{getEstadoBadge(p.estado)}</td>
                                            <td className="p-3 hidden sm:table-cell text-sm text-muted-foreground">
                                                {new Date(p.fecha_pago).toLocaleDateString("es-CL")}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Dialog: Register Payment */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Registrar Pago</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Cliente *</Label>
                            <Select value={form.cliente_id} onValueChange={(v) => { setForm({ ...form, cliente_id: v, presupuesto_id: "" }); loadPresupuestos(v); }}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                                <SelectContent>
                                    {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre} {c.empresa ? `(${c.empresa})` : ""}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {presupuestos.length > 0 && (
                            <div>
                                <Label>Presupuesto (opcional)</Label>
                                <Select value={form.presupuesto_id} onValueChange={(v) => setForm({ ...form, presupuesto_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Vincular a presupuesto" /></SelectTrigger>
                                    <SelectContent>
                                        {presupuestos.map((p) => <SelectItem key={p.id} value={p.id}>{p.numero} — ${Number(p.total).toLocaleString()}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Monto *</Label>
                                <Input type="number" placeholder="0" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
                            </div>
                            <div>
                                <Label>Moneda</Label>
                                <Select value={form.moneda} onValueChange={(v) => setForm({ ...form, moneda: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CLP">CLP</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="UF">UF</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Método de Pago</Label>
                                <Select value={form.metodo_pago} onValueChange={(v) => setForm({ ...form, metodo_pago: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="transferencia">Transferencia</SelectItem>
                                        <SelectItem value="efectivo">Efectivo</SelectItem>
                                        <SelectItem value="mercadopago">MercadoPago</SelectItem>
                                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                        <SelectItem value="otro">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Estado</Label>
                                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="completado">Completado</SelectItem>
                                        <SelectItem value="pendiente">Pendiente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Referencia / Nro. Transferencia</Label>
                            <Input placeholder="Ej: 123456789" value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} />
                        </div>
                        <div>
                            <Label>Notas</Label>
                            <Textarea placeholder="Notas adicionales..." value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} className="gradient-button">Registrar Pago</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
