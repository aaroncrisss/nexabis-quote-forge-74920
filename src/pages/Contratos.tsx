import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, FileSignature, Search, Trash2, AlertTriangle, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import type { Contrato } from "@/types/crm";

export default function Contratos() {
    const [contratos, setContratos] = useState<Contrato[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [clientes, setClientes] = useState<any[]>([]);

    const [form, setForm] = useState({
        cliente_id: "",
        titulo: "",
        descripcion: "",
        valor: "",
        moneda: "CLP",
        estado: "borrador",
        fecha_inicio: "",
        fecha_fin: "",
        renovacion_auto: false,
    });

    useEffect(() => { loadContratos(); loadClientes(); }, []);

    const loadContratos = async () => {
        try {
            const { data, error } = await supabaseCRM
                .from("contratos")
                .select("*, clientes(nombre, empresa)")
                .order("created_at", { ascending: false });
            if (error) throw error;
            setContratos(data || []);
        } catch { toast.error("Error cargando contratos"); }
        finally { setLoading(false); }
    };

    const loadClientes = async () => {
        const { data } = await supabase.from("clientes").select("id, nombre, empresa").order("nombre");
        setClientes(data || []);
    };

    const handleCreate = async () => {
        if (!form.cliente_id || !form.titulo) { toast.error("Cliente y título son obligatorios"); return; }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error } = await supabaseCRM.from("contratos").insert({
                usuario_id: user.id,
                cliente_id: form.cliente_id,
                titulo: form.titulo,
                descripcion: form.descripcion || null,
                valor: parseFloat(form.valor) || null,
                moneda: form.moneda,
                estado: form.estado,
                fecha_inicio: form.fecha_inicio || null,
                fecha_fin: form.fecha_fin || null,
                renovacion_auto: form.renovacion_auto,
            });
            if (error) throw error;
            toast.success("Contrato creado");
            setDialogOpen(false);
            setForm({ cliente_id: "", titulo: "", descripcion: "", valor: "", moneda: "CLP", estado: "borrador", fecha_inicio: "", fecha_fin: "", renovacion_auto: false });
            loadContratos();
        } catch (e: any) { toast.error("Error: " + e.message); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const { error } = await supabaseCRM.from("contratos").delete().eq("id", deleteId);
        if (error) toast.error("Error eliminando");
        else { toast.success("Contrato eliminado"); setDeleteId(null); loadContratos(); }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        const { error } = await supabaseCRM.from("contratos").update({ estado: newStatus }).eq("id", id);
        if (error) toast.error("Error");
        else { toast.success("Estado actualizado"); loadContratos(); }
    };

    const filtered = contratos.filter((c) => {
        const matchSearch = c.titulo?.toLowerCase().includes(search.toLowerCase()) ||
            c.clientes?.nombre?.toLowerCase().includes(search.toLowerCase());
        const matchEstado = filtroEstado === "todos" || c.estado === filtroEstado;
        return (search === "" || matchSearch) && matchEstado;
    });

    const proximosVencer = contratos.filter((c) => {
        if (c.estado !== "activo" || !c.fecha_fin) return false;
        const diff = (new Date(c.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
    });

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case "borrador": return <Badge variant="secondary">Borrador</Badge>;
            case "activo": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Activo</Badge>;
            case "vencido": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Vencido</Badge>;
            case "cancelado": return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Cancelado</Badge>;
            case "renovado": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Renovado</Badge>;
            default: return <Badge variant="secondary">{estado}</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
                        <p className="text-muted-foreground mt-1">Gestiona contratos con tus clientes</p>
                    </div>
                    <Button onClick={() => setDialogOpen(true)} className="gap-2 gradient-button">
                        <Plus className="w-4 h-4" /> Nuevo Contrato
                    </Button>
                </div>

                {/* Alert: Próximos a vencer */}
                {proximosVencer.length > 0 && (
                    <Card className="p-4 border-orange-500/30 bg-orange-500/5">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-400" />
                            <div>
                                <p className="font-medium text-orange-400">Contratos próximos a vencer</p>
                                <p className="text-sm text-muted-foreground">
                                    {proximosVencer.map((c) => c.titulo).join(", ")} — vencen en los próximos 30 días
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <p className="text-xs text-muted-foreground uppercase">Total</p>
                        <p className="text-2xl font-bold">{contratos.length}</p>
                    </Card>
                    <Card className="p-4 border-green-500/20 bg-green-500/5">
                        <p className="text-xs text-muted-foreground uppercase">Activos</p>
                        <p className="text-2xl font-bold text-green-400">{contratos.filter((c) => c.estado === "activo").length}</p>
                    </Card>
                    <Card className="p-4 border-orange-500/20 bg-orange-500/5">
                        <p className="text-xs text-muted-foreground uppercase">Por Vencer</p>
                        <p className="text-2xl font-bold text-orange-400">{proximosVencer.length}</p>
                    </Card>
                    <Card className="p-4 border-primary/20 bg-primary/5">
                        <p className="text-xs text-muted-foreground uppercase">Valor Total Activos</p>
                        <p className="text-2xl font-bold text-primary">
                            ${contratos.filter((c) => c.estado === "activo").reduce((s, c) => s + Number(c.valor || 0), 0).toLocaleString()}
                        </p>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar contrato..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="borrador">Borrador</SelectItem>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="vencido">Vencido</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {loading ? (
                        <Card className="p-8 text-center text-muted-foreground">Cargando...</Card>
                    ) : filtered.length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground">No hay contratos</Card>
                    ) : (
                        filtered.map((c) => (
                            <Card key={c.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <FileSignature className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{c.titulo}</p>
                                            <p className="text-sm text-muted-foreground">{c.clientes?.nombre} {c.clientes?.empresa ? `— ${c.clientes.empresa}` : ""}</p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                {c.fecha_inicio && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> {new Date(c.fecha_inicio).toLocaleDateString("es-CL")} - {c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString("es-CL") : "Indefinido"}
                                                    </span>
                                                )}
                                                {c.renovacion_auto && <span>🔄 Auto-renovable</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {c.valor && (
                                            <span className="font-bold text-lg">${Number(c.valor).toLocaleString()} <span className="text-xs text-muted-foreground">{c.moneda}</span></span>
                                        )}
                                        {getEstadoBadge(c.estado)}
                                        <div className="flex gap-1">
                                            {c.estado === "borrador" && (
                                                <Button size="sm" variant="ghost" className="text-green-400 text-xs" onClick={() => handleStatusChange(c.id, "activo")}>Activar</Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="text-red-400" onClick={() => setDeleteId(c.id)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Create Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Nuevo Contrato</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Cliente *</Label>
                            <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                                <SelectContent>
                                    {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre} {c.empresa ? `(${c.empresa})` : ""}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Título *</Label>
                            <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Contrato mantenimiento web" />
                        </div>
                        <div>
                            <Label>Descripción</Label>
                            <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Valor</Label>
                                <Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0" />
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
                                <Label>Fecha Inicio</Label>
                                <Input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
                            </div>
                            <div>
                                <Label>Fecha Fin</Label>
                                <Input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch checked={form.renovacion_auto} onCheckedChange={(v) => setForm({ ...form, renovacion_auto: v })} />
                            <Label>Renovación automática</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} className="gradient-button">Crear Contrato</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar contrato?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
