import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, AlertTriangle, Calendar, Phone, Mail, Users, ListTodo, Search, Trash2, GripVertical, AlertCircle, FolderDot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import type { Tarea } from "@/types/crm";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const COLUMNS = [
    { id: "to_do", title: "📝 To Do", color: "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800" },
    { id: "in_progress", title: "⏳ In Progress", color: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30" },
    { id: "blocked", title: "⛔ Blocked", color: "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30" },
    { id: "done", title: "✅ Done", color: "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30" }
];

export default function Tareas() {
    const [tareas, setTareas] = useState<Tarea[]>([]);
    const [loading, setLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [clientes, setClientes] = useState<any[]>([]);
    const [proyectos, setProyectos] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [filtroCliente, setFiltroCliente] = useState("todos");
    const [quickAdd, setQuickAdd] = useState("");

    // For editing a task inside the generic Sheet
    const [editingTask, setEditingTask] = useState<Tarea | null>(null);
    const [form, setForm] = useState({
        titulo: "",
        descripcion: "",
        tipo: "tarea",
        prioridad: "media",
        estado: "to_do",
        cliente_id: "",
        proyecto_id: "",
        fecha_vencimiento: "",
    });

    useEffect(() => { loadTareas(); loadClientes(); loadProyectos(); }, []);

    const loadTareas = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            // Manejamos los estados antiguos por defecto como to_do o done si no han corrido el migrador
            const { data, error } = await supabaseCRM
                .from("tareas")
                .select("*, clientes(nombre, empresa), proyectos(nombre)")
                .eq("usuario_id", user.id)
                .order("fecha_vencimiento", { ascending: true, nullsFirst: false });
            if (error) throw error;

            // Map legacy states to new Jira states if needed
            const normalizedData = (data || []).map(t => ({
                ...t,
                estado: t.estado === 'pendiente' ? 'to_do' : t.estado === 'completada' ? 'done' : t.estado || 'to_do'
            }));
            setTareas(normalizedData);
        } catch { toast.error("Error cargando tareas"); }
        finally { setLoading(false); }
    };

    const loadClientes = async () => {
        const { data } = await supabase.from("clientes").select("id, nombre, empresa").order("nombre");
        setClientes(data || []);
    };

    const loadProyectos = async () => {
        const { data } = await supabase.from("proyectos").select("id, nombre, cliente_id").order("nombre");
        setProyectos(data || []);
    };

    const openCreateSheet = () => {
        setEditingTask(null);
        setForm({ titulo: "", descripcion: "", tipo: "tarea", prioridad: "media", estado: "to_do", cliente_id: "", proyecto_id: "", fecha_vencimiento: "" });
        setSheetOpen(true);
    };

    const openEditSheet = (tarea: Tarea) => {
        setEditingTask(tarea);
        setForm({
            titulo: tarea.titulo,
            descripcion: tarea.descripcion || "",
            tipo: tarea.tipo || "tarea",
            prioridad: tarea.prioridad || "media",
            estado: tarea.estado || "to_do",
            cliente_id: tarea.cliente_id || "",
            proyecto_id: tarea.proyecto_id || "",
            fecha_vencimiento: tarea.fecha_vencimiento ? new Date(tarea.fecha_vencimiento).toISOString().slice(0, 16) : "",
        });
        setSheetOpen(true);
    };

    const handleSave = async () => {
        if (!form.titulo) { toast.error("El título es obligatorio"); return; }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const payload = {
                titulo: form.titulo,
                descripcion: form.descripcion || null,
                tipo: form.tipo,
                prioridad: form.prioridad,
                estado: form.estado,
                cliente_id: form.cliente_id === "none" ? null : (form.cliente_id || null),
                proyecto_id: form.proyecto_id === "none" ? null : (form.proyecto_id || null),
                fecha_vencimiento: form.fecha_vencimiento || null,
                fecha_completada: form.estado === "done" && (!editingTask || editingTask.estado !== "done") ? new Date().toISOString() : null
            };

            if (editingTask) {
                const { error } = await supabaseCRM.from("tareas").update(payload).eq("id", editingTask.id);
                if (error) throw error;
                toast.success("Tarea actualizada");
            } else {
                const { error } = await supabaseCRM.from("tareas").insert({ ...payload, usuario_id: user.id });
                if (error) throw error;
                toast.success("Tarea creada");
            }
            setSheetOpen(false);
            loadTareas();
        } catch (e: any) { toast.error("Error: " + e.message); }
    };

    const handleDelete = async (id: string) => {
        setTareas(prev => prev.filter(t => t.id !== id));
        const { error } = await supabaseCRM.from("tareas").delete().eq("id", id);
        if (error) { toast.error("Error eliminando"); loadTareas(); }
        else { toast.success("Tarea eliminada"); setSheetOpen(false); }
    };

    const handleQuickAdd = async (columnId = "to_do") => {
        if (!quickAdd.trim()) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error } = await supabaseCRM.from("tareas").insert({
                usuario_id: user.id,
                titulo: quickAdd.trim(),
                tipo: "tarea",
                prioridad: "media",
                estado: columnId
            });
            if (error) throw error;
            setQuickAdd("");
            toast.success("Tarea añadida");
            loadTareas();
        } catch { toast.error("Error creando tarea"); }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newEstado = destination.droppableId;
        const tareaMoved = tareas.find(t => t.id === draggableId);
        if (!tareaMoved) return;

        // Optimistic UI update
        const updatedTareas = Array.from(tareas);
        const taskIndex = updatedTareas.findIndex(t => t.id === draggableId);

        updatedTareas[taskIndex] = {
            ...updatedTareas[taskIndex],
            estado: newEstado,
            fecha_completada: newEstado === "done" ? new Date().toISOString() : null
        };
        setTareas(updatedTareas);

        // Supabase DB update
        const { error } = await supabaseCRM.from("tareas").update({
            estado: newEstado,
            fecha_completada: newEstado === "done" ? new Date().toISOString() : null
        }).eq("id", draggableId);

        if (error) {
            toast.error("Error moviendo tarea");
            loadTareas(); // revert sync
        }
    };

    const filtered = tareas.filter((t) => {
        if (filtroCliente !== "todos" && t.cliente_id !== filtroCliente) return false;
        if (search && !t.titulo.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const isVencida = (t: Tarea) => t.estado !== "done" && t.fecha_vencimiento && new Date(t.fecha_vencimiento) < new Date();

    const getPrioridadBadge = (p: string) => {
        switch (p) {
            case "urgente": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 cursor-default px-1 py-0 text-[10px] uppercase">Urgente</Badge>;
            case "alta": return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 cursor-default px-1 py-0 text-[10px] uppercase">Alta</Badge>;
            case "media": return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 cursor-default px-1 py-0 text-[10px] uppercase">Media</Badge>;
            case "baja": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-default px-1 py-0 text-[10px] uppercase">Baja</Badge>;
            default: return null;
        }
    };

    const getTipoIcon = (tipo: string) => {
        switch (tipo) {
            case "llamada": return <Phone className="w-3.5 h-3.5 text-green-500" />;
            case "reunion": return <Users className="w-3.5 h-3.5 text-blue-500" />;
            case "email": return <Mail className="w-3.5 h-3.5 text-purple-500" />;
            case "seguimiento": return <Clock className="w-3.5 h-3.5 text-orange-500" />;
            default: return <ListTodo className="w-3.5 h-3.5 text-primary" />;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 h-[calc(100vh-80px)] flex flex-col pt-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tablero de Tareas</h1>
                        <p className="text-muted-foreground mt-1">Arrastra y suelta tus tareas en el flujo de trabajo</p>
                    </div>
                    <Button onClick={openCreateSheet} className="gap-2 gradient-button">
                        <Plus className="w-4 h-4" /> Crear Tarea
                    </Button>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3 overflow-visible shrink-0 items-center justify-between bg-card/40 p-3 rounded-lg border">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
                        <div className="relative w-full md:w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Buscar por título..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                        </div>
                        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                            <SelectTrigger className="w-full sm:w-[220px] h-9"><SelectValue placeholder="Filtrar por Cliente" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los clientes</SelectItem>
                                {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <Input
                            placeholder="Añadir tarea rápida..."
                            value={quickAdd}
                            onChange={(e) => setQuickAdd(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                            className="bg-muted/30 border-dashed h-9 w-full sm:w-[250px]"
                        />
                    </div>
                </div>

                {/* KANBAN BOARD */}
                <div className="flex-1 min-h-0 overflow-x-auto pb-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex h-full items-center justify-center"><p className="text-muted-foreground animate-pulse">Cargando tablero...</p></div>
                    ) : (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <div className="flex h-full gap-4 items-start min-w-[1000px]">
                                {COLUMNS.map((col) => {
                                    const colTasks = filtered.filter(t => t.estado === col.id);
                                    return (
                                        <div key={col.id} className={`flex flex-col h-full min-h-[500px] w-[320px] rounded-xl border ${col.color}`}>
                                            <div className="flex items-center justify-between p-3 border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/10 rounded-t-xl shrink-0">
                                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                                    {col.title} <span className="bg-background/80 text-muted-foreground px-2 py-0.5 rounded-full text-xs font-mono">{colTasks.length}</span>
                                                </h3>
                                            </div>

                                            <Droppable droppableId={col.id}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={`flex-1 p-3 overflow-y-auto min-h-[150px] transition-colors space-y-3 ${snapshot.isDraggingOver ? "bg-black/5 dark:bg-white/5" : ""}`}
                                                    >
                                                        {colTasks.map((tarea, index) => (
                                                            <Draggable key={tarea.id} draggableId={tarea.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        onClick={() => openEditSheet(tarea)}
                                                                        className={`group bg-card border rounded-lg p-3 shadow-sm hover:border-primary/50 transition-all cursor-pointer select-none
                                                                            ${snapshot.isDragging ? "shadow-lg scale-105 rotate-2 z-50 ring-2 ring-primary border-primary" : ""}
                                                                            ${isVencida(tarea) ? "border-red-500/50 bg-red-500/5" : ""}
                                                                            ${tarea.estado === 'done' ? "opacity-60 hover:opacity-100" : ""}
                                                                        `}
                                                                    >
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                                                                                {getTipoIcon(tarea.tipo)}
                                                                                <p className={`text-sm font-medium leading-tight truncate ${tarea.estado === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                                                                    {tarea.titulo}
                                                                                </p>
                                                                            </div>
                                                                            <GripVertical className="w-4 h-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                                        </div>

                                                                        {tarea.descripcion && (
                                                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 pr-2">
                                                                                {tarea.descripcion}
                                                                            </p>
                                                                        )}

                                                                        <div className="flex flex-col gap-2 mt-auto pt-1">
                                                                            {tarea.clientes && (
                                                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 w-fit px-2 py-0.5 rounded-md truncate max-w-full">
                                                                                    👤 <span className="truncate">{tarea.clientes.nombre}</span>
                                                                                </div>
                                                                            )}
                                                                            {tarea.proyectos && (
                                                                                <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 w-fit px-2 py-0.5 rounded-md truncate max-w-full mt-1">
                                                                                    <FolderDot className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{tarea.proyectos.nombre}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex items-center justify-between mt-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    {getPrioridadBadge(tarea.prioridad)}
                                                                                    {isVencida(tarea) && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                                                                                </div>
                                                                                {tarea.fecha_vencimiento && (
                                                                                    <div className={`flex items-center gap-1 text-[10px] font-medium ${isVencida(tarea) ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                                                        <Calendar className="w-3 h-3" />
                                                                                        {new Date(tarea.fecha_vencimiento).toLocaleDateString("es-CL", { day: '2-digit', month: 'short' })}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    );
                                })}
                            </div>
                        </DragDropContext>
                    )}
                </div>
            </div>

            {/* Jira-Style Task Details Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto flex flex-col p-0 h-full">
                    <SheetHeader className="p-6 border-b shrink-0 bg-background/95 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex justify-between items-start">
                            <div>
                                <SheetTitle className="text-xl">{editingTask ? "Editar Tarea" : "Nueva Tarea"}</SheetTitle>
                                <SheetDescription>Agrega todos los detalles y enlaza al cliente.</SheetDescription>
                            </div>
                            {editingTask && (
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 -mt-2" onClick={() => handleDelete(editingTask.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </SheetHeader>

                    <div className="flex-1 p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider mb-2 block">QUÉ HAY QUE HACER</Label>
                                <Input placeholder="Ej: Llamar a cliente para seguimiento de cotización" className="font-medium text-lg h-12" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                            </div>

                            <div>
                                <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider mb-2 block">DESCRIPCIÓN EXTENDIDA</Label>
                                <Textarea placeholder="Agrega toda la información que necesites, notas de contexto, links, etc..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="min-h-[150px] resize-y bg-muted/30" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 bg-card/50 p-5 rounded-xl border border-border/50">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Estado (Columna)</Label>
                                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                                    <SelectTrigger className="font-medium">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="to_do">📝 To Do</SelectItem>
                                        <SelectItem value="in_progress">⏳ In Progress</SelectItem>
                                        <SelectItem value="blocked">⛔ Blocked</SelectItem>
                                        <SelectItem value="done">✅ Done</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Prioridad</Label>
                                <Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="urgente">🚨 Urgente</SelectItem>
                                        <SelectItem value="alta">🔴 Alta</SelectItem>
                                        <SelectItem value="media">🟡 Media</SelectItem>
                                        <SelectItem value="baja">🔵 Baja</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="md:col-span-1">
                                <Label className="text-xs text-muted-foreground mb-1 block">Cliente / Organización</Label>
                                <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                                    <SelectTrigger className={!form.cliente_id ? "text-muted-foreground" : ""}>
                                        <SelectValue placeholder="Enlazar a un cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" className="text-muted-foreground italic">Desvincular cliente</SelectItem>
                                        {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre} {c.empresa ? `(${c.empresa})` : ""}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="md:col-span-1">
                                <Label className="text-xs text-muted-foreground mb-1 block">Proyecto (Opcional)</Label>
                                <Select value={form.proyecto_id} onValueChange={(v) => setForm({ ...form, proyecto_id: v })}>
                                    <SelectTrigger className={!form.proyecto_id ? "text-muted-foreground" : ""}>
                                        <SelectValue placeholder="Vincular a un proyecto..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" className="text-muted-foreground italic">Ningún proyecto</SelectItem>
                                        {proyectos
                                            .filter(p => !form.cliente_id || form.cliente_id === "none" || p.cliente_id === form.cliente_id)
                                            .map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)
                                        }
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Tipo de Tarea</Label>
                                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tarea">Tarea general</SelectItem>
                                        <SelectItem value="llamada">Llamada telefónica</SelectItem>
                                        <SelectItem value="reunion">Reunión presencial/virtual</SelectItem>
                                        <SelectItem value="email">Enviar Email</SelectItem>
                                        <SelectItem value="seguimiento">Seguimiento</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Fecha límite (Vencimiento)</Label>
                                <Input type="datetime-local" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} className="cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="p-6 border-t shrink-0 bg-background/95 mt-auto">
                        <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} className="gradient-button min-w-[120px]">
                            {editingTask ? "Guardar cambios" : "Crear Tarea"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </DashboardLayout>
    );
}
