import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ArrowLeft, Mail, Phone, Building, MapPin, Globe, Calendar, DollarSign,
    FileText, FolderKanban, StickyNote, Paperclip, FileSignature, Plus, Send, Tag, User, CreditCard, ListTodo, Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";

export default function ClienteDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [cliente, setCliente] = useState<any>(null);
    const [pagos, setPagos] = useState<any[]>([]);
    const [presupuestos, setPresupuestos] = useState<any[]>([]);
    const [proyectos, setProyectos] = useState<any[]>([]);
    const [notas, setNotas] = useState<any[]>([]);
    const [contratos, setContratos] = useState<any[]>([]);
    const [tareas, setTareas] = useState<any[]>([]);
    const [oportunidades, setOportunidades] = useState<any[]>([]);

    // Note form
    const [notaDialog, setNotaDialog] = useState(false);
    const [notaForm, setNotaForm] = useState({ contenido: "", tipo: "nota" });

    useEffect(() => { if (id) loadAll(); }, [id]);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [clienteRes, pagosRes, presupuestosRes, proyectosRes, notasRes, contratosRes, tareasRes, oppsRes] = await Promise.all([
                supabase.from("clientes").select("*").eq("id", id).single(),
                supabaseCRM.from("pagos").select("*").eq("cliente_id", id).order("fecha_pago", { ascending: false }),
                supabase.from("presupuestos").select("*").eq("cliente_id", id).order("created_at", { ascending: false }),
                supabase.from("proyectos").select("*").eq("cliente_id", id).order("created_at", { ascending: false }),
                supabaseCRM.from("notas_cliente").select("*").eq("cliente_id", id).order("created_at", { ascending: false }),
                supabaseCRM.from("contratos").select("*").eq("cliente_id", id).order("created_at", { ascending: false }),
                supabaseCRM.from("tareas").select("*").eq("cliente_id", id).order("created_at", { ascending: false }),
                supabaseCRM.from("oportunidades").select("*").eq("cliente_id", id).order("created_at", { ascending: false }),
            ]);

            if (clienteRes.error) throw clienteRes.error;
            setCliente(clienteRes.data);
            setPagos(pagosRes.data || []);
            setPresupuestos(presupuestosRes.data || []);
            setProyectos(proyectosRes.data || []);
            setNotas(notasRes.data || []);
            setContratos(contratosRes.data || []);
            setTareas(tareasRes.data || []);
            setOportunidades(oppsRes.data || []);
        } catch (e: any) {
            toast.error("Error cargando cliente");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNota = async () => {
        if (!notaForm.contenido) { toast.error("Escribe algo"); return; }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error } = await supabaseCRM.from("notas_cliente").insert({
                usuario_id: user.id,
                cliente_id: id,
                contenido: notaForm.contenido,
                tipo: notaForm.tipo,
            });
            if (error) throw error;
            toast.success("Nota agregada");
            setNotaDialog(false);
            setNotaForm({ contenido: "", tipo: "nota" });
            loadAll();
        } catch (e: any) { toast.error("Error: " + e.message); }
    };

    const handleUpdateEtapa = async (etapa: string) => {
        const { error } = await supabaseCRM.from("clientes").update({ etapa_ciclo: etapa }).eq("id", id);
        if (error) toast.error("Error");
        else { toast.success("Etapa actualizada"); loadAll(); }
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

    if (!cliente) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold">Cliente no encontrado</h2>
                    <Button onClick={() => navigate("/clientes")} className="mt-4">Volver a Clientes</Button>
                </div>
            </DashboardLayout>
        );
    }

    const totalPagado = pagos.filter(p => p.estado === "completado").reduce((s, p) => s + Number(p.monto), 0);
    const totalFacturado = presupuestos.filter(p => p.estado === "aprobado").reduce((s, p) => s + Number(p.total), 0);
    const balance = totalFacturado - totalPagado;
    const presupuestosActivos = presupuestos.filter(p => p.estado === "pendiente" || p.estado === "aprobado").length;
    const tareasActivas = tareas.filter(t => t.estado === "pendiente").length;

    const getEtapaBadge = (etapa: string) => {
        switch (etapa) {
            case "lead": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Lead</Badge>;
            case "prospecto": return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Prospecto</Badge>;
            case "cliente": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Cliente</Badge>;
            case "inactivo": return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Inactivo</Badge>;
            default: return <Badge variant="secondary">{etapa || "Lead"}</Badge>;
        }
    };

    const getNotaIcon = (tipo: string) => {
        switch (tipo) {
            case "llamada": return <Phone className="w-4 h-4 text-green-400" />;
            case "reunion": return <User className="w-4 h-4 text-blue-400" />;
            case "email": return <Mail className="w-4 h-4 text-purple-400" />;
            default: return <StickyNote className="w-4 h-4 text-yellow-400" />;
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
                <Button variant="ghost" onClick={() => navigate("/clientes")} className="gap-2 text-muted-foreground hover:text-primary pl-0">
                    <ArrowLeft className="w-4 h-4" /> Volver a Clientes
                </Button>

                {/* Client Header */}
                <Card className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-2xl font-bold text-primary">
                                {cliente.nombre?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-bold">{cliente.nombre}</h1>
                                    {getEtapaBadge(cliente.etapa_ciclo)}
                                </div>
                                {cliente.empresa && <p className="text-muted-foreground flex items-center gap-2"><Building className="w-4 h-4" /> {cliente.empresa}</p>}
                                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    {cliente.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {cliente.email}</span>}
                                    {cliente.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {cliente.telefono}</span>}
                                    {cliente.direccion && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {cliente.direccion}</span>}
                                    {cliente.sitio_web && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {cliente.sitio_web}</span>}
                                </div>
                                {cliente.industria && <p className="text-xs text-muted-foreground mt-1">Industria: {cliente.industria} | Fuente: {cliente.fuente || "Directo"}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={cliente.etapa_ciclo || "lead"} onValueChange={handleUpdateEtapa}>
                                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lead">Lead</SelectItem>
                                    <SelectItem value="prospecto">Prospecto</SelectItem>
                                    <SelectItem value="cliente">Cliente</SelectItem>
                                    <SelectItem value="inactivo">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 border-green-500/20 bg-green-500/5">
                        <p className="text-xs text-muted-foreground uppercase">Total Pagado</p>
                        <p className="text-xl font-bold text-green-400">${totalPagado.toLocaleString()}</p>
                    </Card>
                    <Card className="p-4 border-primary/20 bg-primary/5">
                        <p className="text-xs text-muted-foreground uppercase">Presupuestos Activos</p>
                        <p className="text-xl font-bold text-primary">{presupuestosActivos}</p>
                    </Card>
                    <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
                        <p className="text-xs text-muted-foreground uppercase">Oportunidades</p>
                        <p className="text-xl font-bold text-yellow-400">{oportunidades.filter(o => o.estado === "abierta").length}</p>
                    </Card>
                    <Card className="p-4 border-orange-500/20 bg-orange-500/5">
                        <p className="text-xs text-muted-foreground uppercase">Tareas Pendientes</p>
                        <p className="text-xl font-bold text-orange-400">{tareasActivas}</p>
                    </Card>
                </div>

                {/* Balance Card */}
                {totalFacturado > 0 && (
                    <Card className={`p-4 ${balance > 0 ? "border-red-500/20 bg-red-500/5" : "border-green-500/20 bg-green-500/5"}`}>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Total Facturado</p>
                                    <p className="text-lg font-bold">${totalFacturado.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Total Pagado</p>
                                    <p className="text-lg font-bold text-green-400">${totalPagado.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Saldo Pendiente</p>
                                    <p className={`text-lg font-bold ${balance > 0 ? "text-red-400" : "text-green-400"}`}>
                                        ${Math.abs(balance).toLocaleString()} {balance <= 0 && "✓"}
                                    </p>
                                </div>
                            </div>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/pagos")}>
                                <CreditCard className="w-3 h-3" /> Registrar Pago
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/pagos")}>
                        <CreditCard className="w-3 h-3" /> Registrar Pago
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/tareas")}>
                        <ListTodo className="w-3 h-3" /> Nueva Tarea
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/pipeline")}>
                        <Target className="w-3 h-3" /> Nueva Oportunidad
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setNotaDialog(true)}>
                        <StickyNote className="w-3 h-3" /> Agregar Nota
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("/crear")}>
                        <FileText className="w-3 h-3" /> Nuevo Presupuesto
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="actividad">
                    <TabsList className="flex-wrap">
                        <TabsTrigger value="actividad">📋 Actividad</TabsTrigger>
                        <TabsTrigger value="pagos">💰 Pagos ({pagos.length})</TabsTrigger>
                        <TabsTrigger value="presupuestos">📄 Presupuestos ({presupuestos.length})</TabsTrigger>
                        <TabsTrigger value="proyectos">📁 Proyectos ({proyectos.length})</TabsTrigger>
                        <TabsTrigger value="notas">📝 Notas ({notas.length})</TabsTrigger>
                        <TabsTrigger value="contratos">📑 Contratos ({contratos.length})</TabsTrigger>
                    </TabsList>

                    {/* Activity Tab */}
                    <TabsContent value="actividad" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Timeline de Actividad</h3>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => setNotaDialog(true)}>
                                <Plus className="w-3 h-3" /> Agregar Nota
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {/* Merge notas + pagos + presupuestos into timeline */}
                            {[
                                ...notas.map(n => ({ date: n.created_at, type: "nota", data: n })),
                                ...pagos.map(p => ({ date: p.fecha_pago, type: "pago", data: p })),
                                ...presupuestos.slice(0, 5).map(p => ({ date: p.created_at, type: "presupuesto", data: p })),
                                ...tareas.map(t => ({ date: t.created_at, type: "tarea", data: t })),
                                ...oportunidades.map(o => ({ date: o.created_at, type: "oportunidad", data: o })),
                                ...contratos.map(c => ({ date: c.created_at, type: "contrato", data: c })),
                            ]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .slice(0, 20)
                                .map((item, idx) => (
                                    <div key={idx} className="flex gap-3 p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                                        <div className="mt-1">
                                            {item.type === "nota" && getNotaIcon(item.data.tipo)}
                                            {item.type === "pago" && <DollarSign className="w-4 h-4 text-green-400" />}
                                            {item.type === "presupuesto" && <FileText className="w-4 h-4 text-primary" />}
                                            {item.type === "tarea" && <ListTodo className="w-4 h-4 text-orange-400" />}
                                            {item.type === "oportunidad" && <Target className="w-4 h-4 text-purple-400" />}
                                            {item.type === "contrato" && <FileSignature className="w-4 h-4 text-pink-400" />}
                                        </div>
                                        <div className="flex-1">
                                            {item.type === "nota" && (
                                                <>
                                                    <p className="text-sm">{item.data.contenido}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 capitalize">{item.data.tipo} — {new Date(item.data.created_at).toLocaleString("es-CL")}</p>
                                                </>
                                            )}
                                            {item.type === "pago" && (
                                                <>
                                                    <p className="text-sm">Pago recibido: <strong className="text-green-400">${Number(item.data.monto).toLocaleString()}</strong> via {item.data.metodo_pago}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{new Date(item.data.fecha_pago).toLocaleString("es-CL")}</p>
                                                </>
                                            )}
                                            {item.type === "presupuesto" && (
                                                <>
                                                    <p className="text-sm">Presupuesto <strong>{item.data.numero}</strong>: {item.data.titulo} — ${Number(item.data.total).toLocaleString()}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{item.data.estado?.toUpperCase()} — {new Date(item.data.created_at).toLocaleString("es-CL")}</p>
                                                </>
                                            )}
                                            {item.type === "tarea" && (
                                                <>
                                                    <p className="text-sm">Tarea: <strong>{item.data.titulo}</strong> — {item.data.estado}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{new Date(item.data.created_at).toLocaleString("es-CL")}</p>
                                                </>
                                            )}
                                            {item.type === "oportunidad" && (
                                                <>
                                                    <p className="text-sm">Oportunidad: <strong>{item.data.titulo}</strong> — <span className="text-purple-400">${Number(item.data.valor).toLocaleString()}</span></p>
                                                    <p className="text-xs text-muted-foreground mt-1">{item.data.estado?.toUpperCase()} — {new Date(item.data.created_at).toLocaleString("es-CL")}</p>
                                                </>
                                            )}
                                            {item.type === "contrato" && (
                                                <>
                                                    <p className="text-sm">Contrato: <strong>{item.data.titulo}</strong></p>
                                                    <p className="text-xs text-muted-foreground mt-1">{item.data.estado} — {new Date(item.data.created_at).toLocaleString("es-CL")}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            {notas.length === 0 && pagos.length === 0 && presupuestos.length === 0 && tareas.length === 0 && oportunidades.length === 0 && contratos.length === 0 && (
                                <Card className="p-8 text-center text-muted-foreground">No hay actividad registrada</Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Payments Tab */}
                    <TabsContent value="pagos" className="space-y-4">
                        <h3 className="text-lg font-semibold">Historial de Pagos</h3>
                        {pagos.length === 0 ? (
                            <Card className="p-8 text-center text-muted-foreground">No hay pagos registrados</Card>
                        ) : (
                            <Card className="overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Monto</th>
                                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Método</th>
                                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagos.map(p => (
                                            <tr key={p.id} className="border-b border-border/50">
                                                <td className="p-3 font-bold">${Number(p.monto).toLocaleString()} <span className="text-xs text-muted-foreground">{p.moneda}</span></td>
                                                <td className="p-3 text-sm capitalize">{p.metodo_pago}</td>
                                                <td className="p-3">
                                                    <Badge className={p.estado === "completado" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                                                        {p.estado}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-sm text-muted-foreground">{new Date(p.fecha_pago).toLocaleDateString("es-CL")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Budgets Tab */}
                    <TabsContent value="presupuestos" className="space-y-4">
                        <h3 className="text-lg font-semibold">Presupuestos</h3>
                        {presupuestos.length === 0 ? (
                            <Card className="p-8 text-center text-muted-foreground">No hay presupuestos</Card>
                        ) : (
                            <div className="space-y-2">
                                {presupuestos.map(p => (
                                    <Card key={p.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open(`/presupuesto/${p.token}`, "_blank")}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold font-mono">{p.numero}</p>
                                                <p className="text-sm text-muted-foreground">{p.titulo}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">${Number(p.total).toLocaleString()}</p>
                                                <Badge variant={p.estado === "aprobado" ? "default" : p.estado === "rechazado" ? "destructive" : "secondary"}>
                                                    {p.estado?.toUpperCase()}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Projects Tab */}
                    <TabsContent value="proyectos" className="space-y-4">
                        <h3 className="text-lg font-semibold">Proyectos</h3>
                        {proyectos.length === 0 ? (
                            <Card className="p-8 text-center text-muted-foreground">No hay proyectos</Card>
                        ) : (
                            <div className="space-y-2">
                                {proyectos.map(p => (
                                    <Card key={p.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/proyectos/${p.id}`)}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{p.nombre}</p>
                                                <p className="text-sm text-muted-foreground">{p.tipo}</p>
                                            </div>
                                            <Badge variant={p.estado === "activo" ? "default" : "secondary"}>
                                                {p.estado?.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Notes Tab */}
                    <TabsContent value="notas" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Notas & Interacciones</h3>
                            <Button size="sm" className="gap-1 gradient-button" onClick={() => setNotaDialog(true)}>
                                <Plus className="w-3 h-3" /> Nueva Nota
                            </Button>
                        </div>
                        {notas.length === 0 ? (
                            <Card className="p-8 text-center text-muted-foreground">No hay notas</Card>
                        ) : (
                            <div className="space-y-3">
                                {notas.map(n => (
                                    <Card key={n.id} className="p-4">
                                        <div className="flex items-start gap-3">
                                            {getNotaIcon(n.tipo)}
                                            <div className="flex-1">
                                                <p className="text-sm whitespace-pre-wrap">{n.contenido}</p>
                                                <p className="text-xs text-muted-foreground mt-2 capitalize">
                                                    {n.tipo} — {new Date(n.created_at).toLocaleString("es-CL")}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Contracts Tab */}
                    <TabsContent value="contratos" className="space-y-4">
                        <h3 className="text-lg font-semibold">Contratos</h3>
                        {contratos.length === 0 ? (
                            <Card className="p-8 text-center text-muted-foreground">No hay contratos</Card>
                        ) : (
                            <div className="space-y-2">
                                {contratos.map(c => (
                                    <Card key={c.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{c.titulo}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString("es-CL") : "—"} - {c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString("es-CL") : "Indefinido"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {c.valor && <span className="font-bold">${Number(c.valor).toLocaleString()}</span>}
                                                <Badge className={c.estado === "activo" ? "bg-green-500/20 text-green-400" : ""}>{c.estado}</Badge>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Add Note Dialog */}
            <Dialog open={notaDialog} onOpenChange={setNotaDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Agregar Nota</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Tipo</Label>
                            <Select value={notaForm.tipo} onValueChange={(v) => setNotaForm({ ...notaForm, tipo: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="nota">📝 Nota</SelectItem>
                                    <SelectItem value="llamada">📞 Llamada</SelectItem>
                                    <SelectItem value="reunion">👥 Reunión</SelectItem>
                                    <SelectItem value="email">✉️ Email</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Contenido</Label>
                            <Textarea value={notaForm.contenido} onChange={(e) => setNotaForm({ ...notaForm, contenido: e.target.value })} placeholder="Escribe tu nota aquí..." rows={4} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNotaDialog(false)}>Cancelar</Button>
                        <Button onClick={handleAddNota} className="gradient-button">Guardar Nota</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
