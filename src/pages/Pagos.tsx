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
    const [facturasCliente, setFacturasCliente] = useState<any[]>([]);
    const [proyectosCliente, setProyectosCliente] = useState<any[]>([]);

    const [selectedPresupuesto, setSelectedPresupuesto] = useState<any>(null);

    // Form state
    const [form, setForm] = useState({
        cliente_id: "",
        presupuesto_id: "",
        factura_id: "",
        proyecto_id: "",
        numero_cuota: "",
        monto: "",
        moneda: "CLP",
        metodo_pago: "transferencia",
        referencia: "",
        estado: "completado",
        notas: "",
        fecha_pago: new Date().toISOString().slice(0, 10),
    });

    useEffect(() => {
        loadPagos();
        loadClientes();
    }, []);

    const loadPagos = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabaseCRM
                .from("pagos")
                .select("*, clientes(nombre, empresa)")
                .eq("usuario_id", user.id)
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

    const loadClientData = async (clienteId: string) => {
        const [presRes, facRes, proRes] = await Promise.all([
            supabase.from("presupuestos").select("id, numero, titulo, total, forma_pago, mp_pago_1_status, mp_pago_1_monto, mp_pago_2_status, mp_pago_2_monto, proyecto_id").eq("cliente_id", clienteId).order("created_at", { ascending: false }),
            supabaseCRM.from("facturas").select("id, numero, titulo, total, estado").eq("cliente_id", clienteId).order("created_at", { ascending: false }),
            supabase.from("proyectos").select("id, nombre, estado").eq("cliente_id", clienteId).order("created_at", { ascending: false }),
        ]);
        setPresupuestos(presRes.data || []);
        setFacturasCliente(facRes.data || []);
        setProyectosCliente(proRes.data || []);
        setSelectedPresupuesto(null);
    };

    const handleSelectPresupuesto = (presupuestoId: string) => {
        const pres = presupuestos.find(p => p.id === presupuestoId);
        setSelectedPresupuesto(pres || null);
        const autoProyecto = pres?.proyecto_id || "";
        setForm(prev => ({
            ...prev,
            presupuesto_id: presupuestoId,
            numero_cuota: "",
            monto: "",
            proyecto_id: autoProyecto || prev.proyecto_id,
        }));
    };

    const handleSelectCuota = (cuota: string) => {
        if (!selectedPresupuesto) return;
        const total = parseFloat(selectedPresupuesto.total);
        const pago1Monto = parseFloat(selectedPresupuesto.mp_pago_1_monto) || Math.round(total / 2);
        const pago2Monto = Math.round(total - pago1Monto);
        const autoMonto = cuota === "1" ? pago1Monto : pago2Monto;
        setForm(prev => ({ ...prev, numero_cuota: cuota, monto: String(autoMonto) }));
    };

    const handleSubmit = async () => {
        if (!form.cliente_id || !form.monto) {
            toast.error("Cliente y monto son obligatorios");
            return;
        }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const cuotaNotas = form.numero_cuota && form.presupuesto_id
                ? `Cuota ${form.numero_cuota}/2 del presupuesto${form.notas ? " — " + form.notas : ""}`
                : form.notas || null;

            const { error } = await supabaseCRM.from("pagos").insert({
                usuario_id: user.id,
                cliente_id: form.cliente_id,
                presupuesto_id: form.presupuesto_id || null,
                monto: parseFloat(form.monto),
                moneda: form.moneda,
                metodo_pago: form.metodo_pago,
                referencia: form.referencia || null,
                estado: form.estado,
                notas: cuotaNotas,
                fecha_pago: form.fecha_pago ? new Date(form.fecha_pago).toISOString() : new Date().toISOString(),
            });
            if (error) throw error;

            // Update presupuesto pago status if cuota selected
            if (form.presupuesto_id && form.numero_cuota && form.estado === "completado") {
                const cuotaNum = parseInt(form.numero_cuota);
                const updateFields: Record<string, any> = {};
                if (cuotaNum === 1) {
                    updateFields.mp_pago_1_status = "approved";
                    updateFields.mp_pago_1_monto = parseFloat(form.monto);
                } else {
                    updateFields.mp_pago_2_status = "approved";
                    updateFields.mp_pago_2_monto = parseFloat(form.monto);
                }
                await supabase.from("presupuestos").update(updateFields).eq("id", form.presupuesto_id);
            }

            toast.success(form.numero_cuota
                ? `Pago ${form.numero_cuota}/2 registrado y vinculado al presupuesto ✅`
                : "Pago registrado correctamente"
            );
            setDialogOpen(false);
            setSelectedPresupuesto(null);
            setForm({ cliente_id: "", presupuesto_id: "", factura_id: "", proyecto_id: "", numero_cuota: "", monto: "", moneda: "CLP", metodo_pago: "transferencia", referencia: "", estado: "completado", notas: "", fecha_pago: new Date().toISOString().slice(0, 10) });
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

    const MP_COMISION = 0.0266;
    const getComision = (p: any) => p.metodo_pago === "mercadopago" ? Number(p.monto) * MP_COMISION : 0;
    const getNeto = (p: any) => Number(p.monto) - getComision(p);

    const totalIngresos = pagos.filter((p) => p.estado === "completado").reduce((sum, p) => sum + Number(p.monto), 0);
    const totalComisiones = pagos.filter((p) => p.estado === "completado").reduce((sum, p) => sum + getComision(p), 0);
    const totalNeto = totalIngresos - totalComisiones;
    const totalPendiente = pagos.filter((p) => p.estado === "pendiente").reduce((sum, p) => sum + Number(p.monto), 0);
    const pagosMes = pagos.filter((p) => {
        const d = new Date(p.fecha_pago);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.estado === "completado";
    });
    const ingresosMes = pagosMes.reduce((sum, p) => sum + Number(p.monto), 0);

    // Pagination
    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

                {/* Commission Info */}
                {totalComisiones > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="p-4 border-emerald-500/20 bg-emerald-500/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Ingreso Neto</p>
                                    <p className="text-2xl font-bold text-emerald-400">${Math.round(totalNeto).toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-500/10"><DollarSign className="w-5 h-5 text-emerald-400" /></div>
                            </div>
                        </Card>
                        <Card className="p-4 border-red-500/20 bg-red-500/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Comisiones MP (2.66%)</p>
                                    <p className="text-2xl font-bold text-red-400">-${Math.round(totalComisiones).toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-red-500/10"><CreditCard className="w-5 h-5 text-red-400" /></div>
                            </div>
                        </Card>
                    </div>
                )}

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
                                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Neto</th>
                                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Método</th>
                                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Referencia</th>
                                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                                    <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No hay pagos registrados</td></tr>
                                ) : (
                                    paginated.map((p) => (
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
                                            <td className="p-3 hidden lg:table-cell">
                                                {p.metodo_pago === "mercadopago" ? (
                                                    <div>
                                                        <span className="font-semibold text-emerald-400">${Math.round(getNeto(p)).toLocaleString()}</span>
                                                        <p className="text-[10px] text-red-400">-${Math.round(getComision(p)).toLocaleString()} com.</p>
                                                    </div>
                                                ) : (
                                                    <span className="font-semibold text-emerald-400">${Number(p.monto).toLocaleString()}</span>
                                                )}
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
                    {/* Pagination */}
                    {filtered.length > PAGE_SIZE && (
                        <div className="flex items-center justify-between p-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground">
                                Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
                            </p>
                            <div className="flex gap-1">
                                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
                            </div>
                        </div>
                    )}
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
                            <Select value={form.cliente_id} onValueChange={(v) => { setForm({ ...form, cliente_id: v, presupuesto_id: "", factura_id: "", proyecto_id: "" }); loadClientData(v); }}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                                <SelectContent>
                                    {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre} {c.empresa ? `(${c.empresa})` : ""}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {presupuestos.length > 0 && (
                            <div>
                                <Label>Presupuesto (opcional)</Label>
                                <Select value={form.presupuesto_id} onValueChange={handleSelectPresupuesto}>
                                    <SelectTrigger><SelectValue placeholder="Vincular a presupuesto" /></SelectTrigger>
                                    <SelectContent>
                                        {presupuestos.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.numero} — ${Number(p.total).toLocaleString()}
                                                {p.mp_pago_1_status === "approved" && p.mp_pago_2_status === "approved" ? " ✅ 100%" : p.mp_pago_1_status === "approved" ? " (Pago 1 ✅)" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {/* Cuota selector when a presupuesto is linked */}
                        {selectedPresupuesto && (
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                                <Label className="text-sm font-semibold">¿Qué cuota estás registrando?</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectCuota("1")}
                                        className={`p-3 rounded-lg border text-left transition-all ${form.numero_cuota === "1"
                                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                                            : selectedPresupuesto.mp_pago_1_status === "approved"
                                                ? "border-green-500/30 bg-green-500/5 opacity-60"
                                                : "border-border hover:border-primary/50"
                                            }`}
                                        disabled={selectedPresupuesto.mp_pago_1_status === "approved"}
                                    >
                                        <p className="font-medium text-sm">Pago 1 (Anticipo)</p>
                                        <p className="text-lg font-bold">${Math.round(parseFloat(selectedPresupuesto.total) / 2).toLocaleString()}</p>
                                        <p className={`text-xs mt-1 ${selectedPresupuesto.mp_pago_1_status === "approved" ? "text-green-400" : "text-muted-foreground"}`}>
                                            {selectedPresupuesto.mp_pago_1_status === "approved" ? "✅ Ya pagado" : "⏳ Pendiente"}
                                        </p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectCuota("2")}
                                        className={`p-3 rounded-lg border text-left transition-all ${form.numero_cuota === "2"
                                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                                            : selectedPresupuesto.mp_pago_2_status === "approved"
                                                ? "border-green-500/30 bg-green-500/5 opacity-60"
                                                : "border-border hover:border-primary/50"
                                            }`}
                                        disabled={selectedPresupuesto.mp_pago_2_status === "approved"}
                                    >
                                        <p className="font-medium text-sm">Pago 2 (Final)</p>
                                        <p className="text-lg font-bold">${Math.round(parseFloat(selectedPresupuesto.total) - (parseFloat(selectedPresupuesto.mp_pago_1_monto) || parseFloat(selectedPresupuesto.total) / 2)).toLocaleString()}</p>
                                        <p className={`text-xs mt-1 ${selectedPresupuesto.mp_pago_2_status === "approved" ? "text-green-400" : "text-muted-foreground"}`}>
                                            {selectedPresupuesto.mp_pago_2_status === "approved" ? "✅ Ya pagado" : "⏳ Pendiente"}
                                        </p>
                                    </button>
                                </div>
                                {selectedPresupuesto.mp_pago_1_status === "approved" && selectedPresupuesto.mp_pago_2_status === "approved" && (
                                    <p className="text-xs text-green-400 text-center font-medium">🎉 Este presupuesto ya está completamente pagado</p>
                                )}
                            </div>
                        )}
                        {facturasCliente.length > 0 && (
                            <div>
                                <Label>Factura (opcional)</Label>
                                <Select value={form.factura_id} onValueChange={(v) => setForm({ ...form, factura_id: v === "none" ? "" : v })}>
                                    <SelectTrigger><SelectValue placeholder="Vincular a factura" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin vincular</SelectItem>
                                        {facturasCliente.map((f) => <SelectItem key={f.id} value={f.id}>{f.numero} — ${Number(f.total).toLocaleString()} ({f.estado})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {proyectosCliente.length > 0 && (
                            <div>
                                <Label>Proyecto (opcional)</Label>
                                <Select value={form.proyecto_id} onValueChange={(v) => setForm({ ...form, proyecto_id: v === "none" ? "" : v })}>
                                    <SelectTrigger><SelectValue placeholder="Vincular a proyecto" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin vincular</SelectItem>
                                        {proyectosCliente.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre} ({p.estado})</SelectItem>)}
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
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Fecha del Pago</Label>
                                <Input type="date" value={form.fecha_pago} onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })} />
                            </div>
                            <div>
                                <Label>Referencia / Nro. Transferencia</Label>
                                <Input placeholder="Ej: 123456789" value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} />
                            </div>
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
