import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckCircle2, Clock, AlertTriangle, Calendar, Phone, Mail, Users, ListTodo, Search, Trash2, StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import type { Tarea } from "@/types/crm";

export default function Tareas() {
    const [tareas, setTareas] = useState<Tarea[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [clientes, setClientes] = useState<any[]>([]);
    const [filtro, setFiltro] = useState("todas");
    const [search, setSearch] = useState("");
    const [filtroCliente, setFiltroCliente] = useState("todos");
    const [quickAdd, setQuickAdd] = useState("");
    const [editingNote, setEditingNote] = useState<string | null>(null);
    const [noteText, setNoteText] = useState("");
    const [form, setForm] = useState({
        titulo: "",
        descripcion: "",
        tipo: "tarea",
        prioridad: "media",
        cliente_id: "",
        fecha_vencimiento: "",
    });

    useEffect(() => { loadTareas(); loadClientes(); }, []);

    const loadTareas = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabaseCRM
                .from("tareas")
                .select("*, clientes(nombre, empresa)")
                .eq("usuario_id", user.id)
                .order("fecha_vencimiento", { ascending: true, nullsFirst: false });
            if (error) throw error;
            setTareas(data || []);
        } catch { toast.error("Error cargando tareas"); }
        finally { setLoading(false); }
    };

    const loadClientes = async () => {
        const { data } = await supabase.from("clientes").select("id, nombre, empresa").order("nombre");
        setClientes(data || []);
    };

    const handleCreate = async () => {
        if (!form.titulo) { toast.error("El título es obligatorio"); return; }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error } = await supabaseCRM.from("tareas").insert({
                usuario_id: user.id,
                titulo: form.titulo,
                descripcion: form.descripcion || null,
                tipo: form.tipo,
                prioridad: form.prioridad,
                cliente_id: form.cliente_id || null,
                fecha_vencimiento: form.fecha_vencimiento || null,
            });
            if (error) throw error;
            toast.success("Tarea creada");
            setDialogOpen(false);
            setForm({ titulo: "", descripcion: "", tipo: "tarea", prioridad: "media", cliente_id: "", fecha_vencimiento: "" });
            loadTareas();
        } catch (e: any) { toast.error("Error: " + e.message); }
    };

    const toggleCompletar = async (tarea: Tarea) => {
        const newEstado = tarea.estado === "completada" ? "pendiente" : "completada";
        setTareas(prev => prev.map(t => t.id === tarea.id ? { ...t, estado: newEstado, fecha_completada: newEstado === "completada" ? new Date().toISOString() : null } : t));
        const { error } = await supabaseCRM.from("tareas").update({
            estado: newEstado,
            fecha_completada: newEstado === "completada" ? new Date().toISOString() : null,
        }).eq("id", tarea.id);
        if (error) { toast.error("Error actualizando"); loadTareas(); }
    };

    const handleQuickAdd = async () => {
        if (!quickAdd.trim()) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error } = await supabaseCRM.from("tareas").insert({
                usuario_id: user.id,
                titulo: quickAdd.trim(),
                tipo: "tarea",
                prioridad: "media",
            });
            if (error) throw error;
            setQuickAdd("");
            toast.success("Tarea añadida");
            loadTareas();
        } catch { toast.error("Error creando tarea"); }
    };

    const handleDelete = async (id: string) => {
        setTareas(prev => prev.filter(t => t.id !== id));
        const { error } = await supabaseCRM.from("tareas").delete().eq("id", id);
        if (error) { toast.error("Error eliminando"); loadTareas(); }
        else toast.success("Tarea eliminada");
    };

    const handleSaveNote = async (id: string) => {
        const { error } = await supabaseCRM.from("tareas").update({ descripcion: noteText }).eq("id", id);
        if (error) toast.error("Error guardando nota");
        else {
            setTareas(prev => prev.map(t => t.id === id ? { ...t, descripcion: noteText } : t));
            setEditingNote(null);
        }
    };

    const filtered = tareas.filter((t) => {
        if (filtro === "pendientes" && t.estado !== "pendiente") return false;
        if (filtro === "completadas" && t.estado !== "completada") return false;
        if (filtro === "vencidas" && !(t.estado === "pendiente" && t.fecha_vencimiento && new Date(t.fecha_vencimiento) < new Date())) return false;
        if (filtroCliente !== "todos" && t.cliente_id !== filtroCliente) return false;
        if (search && !t.titulo.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const pendientes = tareas.filter(t => t.estado === "pendiente").length;
    const completadas = tareas.filter(t => t.estado === "completada").length;
    const vencidas = tareas.filter(t => t.estado === "pendiente" && t.fecha_vencimiento && new Date(t.fecha_vencimiento) < new Date()).length;

    // Pagination
    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const getPrioridadBadge = (p: string) => {
        switch (p) {
            case "urgente": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Urgente</Badge>;
            case "alta": return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Alta</Badge>;
            case "media": return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Media</Badge>;
            case "baja": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Baja</Badge>;
            default: return <Badge variant="secondary">{p}</Badge>;
        }
    };

    const getTipoIcon = (tipo: string) => {
        switch (tipo) {
            case "llamada": return <Phone className="w-4 h-4 text-green-400" />;
            case "reunion": return <Users className="w-4 h-4 text-blue-400" />;
            case "email": return <Mail className="w-4 h-4 text-purple-400" />;
            case "seguimiento": return <Clock className="w-4 h-4 text-orange-400" />;
            default: return <ListTodo className="w-4 h-4 text-primary" />;
        }
    };

    const isVencida = (t: Tarea) => t.estado === "pendiente" && t.fecha_vencimiento && new Date(t.fecha_vencimiento) < new Date();

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
                        <p className="text-muted-foreground mt-1">Gestiona tus tareas y actividades programadas</p>
                    </div>
                    <Button onClick={() => setDialogOpen(true)} className="gap-2 gradient-button">
                        <Plus className="w-4 h-4" /> Nueva Tarea
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pendientes</p>
                                <p className="text-2xl font-bold text-yellow-400">{pendientes}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-yellow-500/10"><Clock className="w-5 h-5 text-yellow-400" /></div>
                        </div>
                    </Card>
                    <Card className="p-4 border-green-500/20 bg-green-500/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Completadas</p>
                                <p className="text-2xl font-bold text-green-400">{completadas}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/10"><CheckCircle2 className="w-5 h-5 text-green-400" /></div>
                        </div>
                    </Card>
                    <Card className="p-4 border-red-500/20 bg-red-500/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Vencidas</p>
                                <p className="text-2xl font-bold text-red-400">{vencidas}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-red-500/10"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
                        </div>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={filtro} onValueChange={setFiltro}>
                    <TabsList>
                        <TabsTrigger value="todas">Todas ({tareas.length})</TabsTrigger>
                        <TabsTrigger value="pendientes">Pendientes ({pendientes})</TabsTrigger>
                        <TabsTrigger value="vencidas">Vencidas ({vencidas})</TabsTrigger>
                        <TabsTrigger value="completadas">Completadas ({completadas})</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Search + Client Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar tareas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todos los clientes" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos los clientes</SelectItem>
                            {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* Quick Add — Notion style */}
                <div className="flex gap-2">
                    <Input
                        placeholder="+ Añadir tarea rápida...  (Enter para crear)"
                        value={quickAdd}
                        onChange={(e) => setQuickAdd(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                        className="bg-muted/30 border-dashed"
                    />
                    <Button size="icon" variant="ghost" onClick={handleQuickAdd} disabled={!quickAdd.trim()}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {/* Task List */}
                <div className="space-y-2">
                    {loading ? (
                        <Card className="p-8 text-center text-muted-foreground">Cargando...</Card>
                    ) : filtered.length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground">No hay tareas en esta categoría</Card>
                    ) : (
                        paginated.map((tarea) => (
                            <Card
                                key={tarea.id}
                                className={`p-4 transition-all hover:shadow-md group ${tarea.estado === "completada" ? "opacity-60" : ""} ${isVencida(tarea) ? "border-red-500/30 bg-red-500/5" : ""}`}
                            >
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={tarea.estado === "completada"}
                                        onCheckedChange={() => toggleCompletar(tarea)}
                                        className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                            <div className="flex items-center gap-2">
                                                {getTipoIcon(tarea.tipo)}
                                                <span className={`font-medium ${tarea.estado === "completada" ? "line-through text-muted-foreground" : ""}`}>
                                                    {tarea.titulo}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getPrioridadBadge(tarea.prioridad)}
                                                {isVencida(tarea) && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">⚠ Vencida</Badge>}
                                            </div>
                                        </div>
                                        {tarea.descripcion && <p className="text-sm text-muted-foreground mb-1">{tarea.descripcion}</p>}
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                            {tarea.clientes && <span>👤 {tarea.clientes.nombre}</span>}
                                            {tarea.fecha_vencimiento && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(tarea.fecha_vencimiento).toLocaleDateString("es-CL")}
                                                </span>
                                            )}
                                            <span className="capitalize">{tarea.tipo}</span>
                                        </div>
                                        {/* Inline note editing */}
                                        {editingNote === tarea.id ? (
                                            <div className="mt-2 flex gap-2">
                                                <Textarea
                                                    value={noteText}
                                                    onChange={(e) => setNoteText(e.target.value)}
                                                    rows={2}
                                                    className="text-sm"
                                                    placeholder="Escribe una nota..."
                                                    autoFocus
                                                />
                                                <div className="flex flex-col gap-1">
                                                    <Button size="sm" variant="default" onClick={() => handleSaveNote(tarea.id)}>Guardar</Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingNote(null)}>Cancelar</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setEditingNote(tarea.id); setNoteText(tarea.descripcion || ""); }}
                                                className="mt-1 text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                                            >
                                                <StickyNote className="w-3 h-3" />
                                                {tarea.descripcion ? "Editar nota" : "Añadir nota"}
                                            </button>
                                        )
                                        }
                                    </div>
                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => handleDelete(tarea.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {filtered.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border">
                        <p className="text-xs text-muted-foreground">
                            Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
                        </p>
                        <div className="flex gap-1">
                            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Nueva Tarea</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Título *</Label>
                            <Input placeholder="Ej: Llamar a cliente para seguimiento" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                        </div>
                        <div>
                            <Label>Descripción</Label>
                            <Textarea placeholder="Detalles..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Tipo</Label>
                                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tarea">Tarea</SelectItem>
                                        <SelectItem value="llamada">Llamada</SelectItem>
                                        <SelectItem value="reunion">Reunión</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="seguimiento">Seguimiento</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Prioridad</Label>
                                <Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="baja">Baja</SelectItem>
                                        <SelectItem value="media">Media</SelectItem>
                                        <SelectItem value="alta">Alta</SelectItem>
                                        <SelectItem value="urgente">Urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Cliente (opcional)</Label>
                            <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Sin cliente" /></SelectTrigger>
                                <SelectContent>
                                    {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre} {c.empresa ? `(${c.empresa})` : ""}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Fecha de vencimiento</Label>
                            <Input type="datetime-local" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} className="gradient-button">Crear Tarea</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
