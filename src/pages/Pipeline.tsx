import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, GripVertical, DollarSign, TrendingUp, Target, BarChart3 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import type { PipelineEtapa, Oportunidad } from "@/types/crm";

const DEFAULT_STAGES = [
    { nombre: "Prospección", color: "#6366f1", orden: 0 },
    { nombre: "Contacto", color: "#8b5cf6", orden: 1 },
    { nombre: "Propuesta", color: "#f59e0b", orden: 2 },
    { nombre: "Negociación", color: "#f97316", orden: 3 },
    { nombre: "Cierre", color: "#22c55e", orden: 4 },
];

export default function Pipeline() {
    const [etapas, setEtapas] = useState<PipelineEtapa[]>([]);
    const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [clientes, setClientes] = useState<any[]>([]);
    const [selectedEtapa, setSelectedEtapa] = useState("");
    const [form, setForm] = useState({
        cliente_id: "",
        titulo: "",
        valor: "",
        probabilidad: "50",
        fecha_cierre_esperada: "",
        notas: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Load stages
            let { data: stagesData, error: stagesError } = await supabaseCRM
                .from("pipeline_etapas")
                .select("*")
                .order("orden");

            if (stagesError) throw stagesError;

            // Create default stages if none exist
            if (!stagesData || stagesData.length === 0) {
                const inserts = DEFAULT_STAGES.map((s) => ({ ...s, usuario_id: user.id }));
                const { data: newStages, error: insertError } = await supabaseCRM.from("pipeline_etapas").insert(inserts).select();
                if (insertError) throw insertError;
                stagesData = newStages;
            }

            setEtapas(stagesData || []);

            // Load opportunities
            const { data: oppsData, error: oppsError } = await supabaseCRM
                .from("oportunidades")
                .select("*, clientes(nombre, empresa)")
                .order("created_at");
            if (oppsError) throw oppsError;
            setOportunidades(oppsData || []);

            // Load clients
            const { data: clientesData } = await supabase.from("clientes").select("id, nombre, empresa").order("nombre");
            setClientes(clientesData || []);
        } catch (e: any) {
            toast.error("Error cargando pipeline");
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const { draggableId, destination } = result;
        const newEtapaId = destination.droppableId;

        // Optimistic update
        setOportunidades((prev) =>
            prev.map((o) => (o.id === draggableId ? { ...o, etapa_id: newEtapaId } : o))
        );

        const { error } = await supabaseCRM.from("oportunidades").update({ etapa_id: newEtapaId }).eq("id", draggableId);
        if (error) {
            toast.error("Error moviendo oportunidad");
            loadData();
        }
    };

    const handleCreateOportunidad = async () => {
        if (!form.titulo || !form.cliente_id || !selectedEtapa) {
            toast.error("Título, cliente y etapa son obligatorios");
            return;
        }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabaseCRM.from("oportunidades").insert({
                usuario_id: user.id,
                cliente_id: form.cliente_id,
                etapa_id: selectedEtapa,
                titulo: form.titulo,
                valor: parseFloat(form.valor) || 0,
                probabilidad: parseInt(form.probabilidad) || 50,
                fecha_cierre_esperada: form.fecha_cierre_esperada || null,
                notas: form.notas || null,
            });

            if (error) throw error;
            toast.success("Oportunidad creada");
            setDialogOpen(false);
            setForm({ cliente_id: "", titulo: "", valor: "", probabilidad: "50", fecha_cierre_esperada: "", notas: "" });
            loadData();
        } catch (e: any) {
            toast.error("Error: " + e.message);
        }
    };

    const handleUpdateEstado = async (id: string, estado: string) => {
        const { error } = await supabaseCRM.from("oportunidades").update({ estado }).eq("id", id);
        if (error) toast.error("Error actualizando");
        else loadData();
    };

    const totalValor = oportunidades.filter((o) => o.estado === "abierta").reduce((s, o) => s + Number(o.valor), 0);
    const totalDeals = oportunidades.filter((o) => o.estado === "abierta").length;
    const wonDeals = oportunidades.filter((o) => o.estado === "ganada").reduce((s, o) => s + Number(o.valor), 0);

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
                        <h1 className="text-3xl font-bold tracking-tight">Pipeline de Ventas</h1>
                        <p className="text-muted-foreground mt-1">Gestiona tus oportunidades y proceso de ventas</p>
                    </div>
                    <Button onClick={() => { setSelectedEtapa(etapas[0]?.id || ""); setDialogOpen(true); }} className="gap-2 gradient-button">
                        <Plus className="w-4 h-4" /> Nueva Oportunidad
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10"><Target className="w-5 h-5 text-primary" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Pipeline Activo</p>
                                <p className="text-2xl font-bold">${totalValor.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{totalDeals} oportunidades</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 border-green-500/20 bg-green-500/5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-green-500/10"><TrendingUp className="w-5 h-5 text-green-400" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Ganados</p>
                                <p className="text-2xl font-bold text-green-400">${wonDeals.toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-yellow-500/10"><BarChart3 className="w-5 h-5 text-yellow-400" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Tasa Conversión</p>
                                <p className="text-2xl font-bold text-yellow-400">
                                    {oportunidades.length > 0
                                        ? Math.round((oportunidades.filter((o) => o.estado === "ganada").length / oportunidades.length) * 100)
                                        : 0}%
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Kanban Board */}
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
                        {etapas.map((etapa) => {
                            const stageOpps = oportunidades.filter((o) => o.etapa_id === etapa.id && o.estado === "abierta");
                            const stageValue = stageOpps.reduce((s, o) => s + Number(o.valor), 0);

                            return (
                                <div key={etapa.id} className="flex-shrink-0 w-[280px]">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: etapa.color }} />
                                            <h3 className="text-sm font-semibold">{etapa.nombre}</h3>
                                            <Badge variant="secondary" className="text-xs">{stageOpps.length}</Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground">${stageValue.toLocaleString()}</span>
                                    </div>

                                    <Droppable droppableId={etapa.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`space-y-2 min-h-[400px] p-2 rounded-xl border border-dashed transition-colors ${snapshot.isDraggingOver ? "border-primary/50 bg-primary/5" : "border-border/50 bg-muted/10"
                                                    }`}
                                            >
                                                {stageOpps.map((opp, index) => (
                                                    <Draggable key={opp.id} draggableId={opp.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <Card
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={`p-3 cursor-grab active:cursor-grabbing transition-shadow ${snapshot.isDragging ? "shadow-xl ring-2 ring-primary/30" : "hover:shadow-md"
                                                                    }`}
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <div {...provided.dragHandleProps} className="mt-1 text-muted-foreground/50">
                                                                        <GripVertical className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="flex-1 space-y-2">
                                                                        <p className="font-medium text-sm leading-tight">{opp.titulo}</p>
                                                                        <p className="text-xs text-muted-foreground">{opp.clientes?.nombre} {opp.clientes?.empresa ? `• ${opp.clientes.empresa}` : ""}</p>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-sm font-bold text-primary flex items-center gap-1">
                                                                                <DollarSign className="w-3 h-3" />
                                                                                {Number(opp.valor).toLocaleString()}
                                                                            </span>
                                                                            <Badge variant="outline" className="text-xs">{opp.probabilidad}%</Badge>
                                                                        </div>
                                                                        {opp.fecha_cierre_esperada && (
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Cierre: {new Date(opp.fecha_cierre_esperada).toLocaleDateString("es-CL")}
                                                                            </p>
                                                                        )}
                                                                        <div className="flex gap-1 pt-1">
                                                                            <Button size="sm" variant="ghost" className="h-6 text-xs text-green-400 hover:text-green-300 px-2" onClick={() => handleUpdateEstado(opp.id, "ganada")}>✓ Ganada</Button>
                                                                            <Button size="sm" variant="ghost" className="h-6 text-xs text-red-400 hover:text-red-300 px-2" onClick={() => handleUpdateEstado(opp.id, "perdida")}>✗ Perdida</Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}

                                                <Button
                                                    variant="ghost"
                                                    className="w-full border border-dashed border-border/50 text-muted-foreground hover:text-foreground h-10 text-xs"
                                                    onClick={() => { setSelectedEtapa(etapa.id); setDialogOpen(true); }}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> Agregar
                                                </Button>
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>

            {/* Dialog: New Opportunity */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nueva Oportunidad</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Título *</Label>
                            <Input placeholder="Ej: Rediseño web para cliente" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                        </div>
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
                            <Label>Etapa</Label>
                            <Select value={selectedEtapa} onValueChange={setSelectedEtapa}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {etapas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Valor ($)</Label>
                                <Input type="number" placeholder="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
                            </div>
                            <div>
                                <Label>Probabilidad (%)</Label>
                                <Input type="number" min="0" max="100" value={form.probabilidad} onChange={(e) => setForm({ ...form, probabilidad: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <Label>Fecha de cierre esperada</Label>
                            <Input type="date" value={form.fecha_cierre_esperada} onChange={(e) => setForm({ ...form, fecha_cierre_esperada: e.target.value })} />
                        </div>
                        <div>
                            <Label>Notas</Label>
                            <Textarea placeholder="Notas adicionales..." value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateOportunidad} className="gradient-button">Crear Oportunidad</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
