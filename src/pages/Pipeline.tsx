import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, GripVertical, DollarSign, TrendingUp, Target, BarChart3, Search } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import type { PipelineEtapa, Oportunidad } from "@/types/crm";

const DEFAULT_STAGES = [
  { nombre: "Prospección", color: "#FF5C5C", orden: 0 },
  { nombre: "Contacto", color: "#FF8042", orden: 1 },
  { nombre: "Propuesta", color: "#FFC24D", orden: 2 },
  { nombre: "Negociación", color: "#38BDF8", orden: 3 },
  { nombre: "Cierre Ganado", color: "#10B981", orden: 4 },
];

export default function Pipeline() {
  const [etapas, setEtapas] = useState<PipelineEtapa[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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

  useEffect(() => {
    const qClienteId = searchParams.get("clienteId");
    if (qClienteId) {
      setForm((prev) => ({ ...prev, cliente_id: qClienteId }));
      setDialogOpen(true);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let { data: stagesData, error: stagesError } = await supabaseCRM
        .from("pipeline_etapas")
        .select("*")
        .order("orden");

      if (stagesError) throw stagesError;

      if (!stagesData || stagesData.length === 0) {
        const inserts = DEFAULT_STAGES.map((s) => ({ ...s, usuario_id: user.id }));
        const { data: newStages, error: insertError } = await supabaseCRM
          .from("pipeline_etapas")
          .insert(inserts)
          .select();
        if (insertError) throw insertError;
        stagesData = newStages;
      }

      setEtapas(stagesData || []);

      const { data: oppsData, error: oppsError } = await supabaseCRM
        .from("oportunidades")
        .select("*, clientes(nombre, empresa)")
        .order("created_at");
      if (oppsError) throw oppsError;
      setOportunidades(oppsData || []);

      const { data: clientesData } = await supabase
        .from("clientes")
        .select("id, nombre, empresa")
        .order("nombre");
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

    setOportunidades((prev) =>
      prev.map((o) => (o.id === draggableId ? { ...o, etapa_id: newEtapaId } : o))
    );

    const { error } = await supabaseCRM
      .from("oportunidades")
      .update({ etapa_id: newEtapaId })
      .eq("id", draggableId);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      setForm({
        cliente_id: "",
        titulo: "",
        valor: "",
        probabilidad: "50",
        fecha_cierre_esperada: "",
        notas: "",
      });
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

  const totalValor = oportunidades
    .filter((o) => o.estado === "abierta")
    .reduce((s, o) => s + Number(o.valor), 0);
  const totalDeals = oportunidades.filter((o) => o.estado === "abierta").length;
  const wonDeals = oportunidades
    .filter((o) => o.estado === "ganada")
    .reduce((s, o) => s + Number(o.valor), 0);

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
              <Target className="w-5 h-5 text-primary" />
              Pipeline de Ventas
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gestiona tus oportunidades y proceso de ventas
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setSelectedEtapa(etapas[0]?.id || "");
              setDialogOpen(true);
            }}
            className="h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5 w-full sm:w-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva Oportunidad
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-3.5 border-primary/20 bg-primary/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Pipeline Activo ({totalDeals})
                </p>
                <p className="text-lg md:text-xl font-bold font-mono">
                  ${totalValor.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Target className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-green-500/20 bg-green-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Ganados
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-green-400">
                  ${wonDeals.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-yellow-500/20 bg-yellow-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Tasa Conversión
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-yellow-400">
                  {oportunidades.length > 0
                    ? Math.round(
                        (oportunidades.filter((o) => o.estado === "ganada").length /
                          oportunidades.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar oportunidad o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs bg-card/60"
          />
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4 min-h-[420px]">
            {etapas.map((etapa) => {
              const stageOpps = oportunidades.filter(
                (o) =>
                  o.etapa_id === etapa.id &&
                  o.estado === "abierta" &&
                  (search === "" ||
                    o.titulo?.toLowerCase().includes(search.toLowerCase()) ||
                    o.clientes?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
                    o.clientes?.empresa?.toLowerCase().includes(search.toLowerCase()))
              );
              const stageValue = stageOpps.reduce((s, o) => s + Number(o.valor), 0);

              return (
                <div key={etapa.id} className="flex-shrink-0 w-[260px]">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: etapa.color }}
                      />
                      <h3 className="text-xs font-heading font-semibold">{etapa.nombre}</h3>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {stageOpps.length}
                      </Badge>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      ${stageValue.toLocaleString()}
                    </span>
                  </div>

                  <Droppable droppableId={etapa.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-[360px] p-2 rounded-xl border border-dashed transition-colors ${
                          snapshot.isDraggingOver
                            ? "border-primary/50 bg-primary/5"
                            : "border-border/50 bg-muted/10"
                        }`}
                      >
                        {stageOpps.map((opp, index) => (
                          <Draggable key={opp.id} draggableId={opp.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)] ${
                                  snapshot.isDragging ? "shadow-xl ring-2 ring-primary/30" : ""
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-0.5 text-muted-foreground/50"
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex-1 space-y-1.5 min-w-0">
                                    <p className="font-medium text-xs leading-tight truncate">
                                      {opp.titulo}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                      {opp.clientes?.nombre}{" "}
                                      {opp.clientes?.empresa ? `• ${opp.clientes.empresa}` : ""}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold font-mono text-primary flex items-center gap-0.5">
                                        <DollarSign className="w-3 h-3" />
                                        {Number(opp.valor).toLocaleString()}
                                      </span>
                                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                        {opp.probabilidad}%
                                      </Badge>
                                    </div>
                                    {opp.fecha_cierre_esperada && (
                                      <p className="text-[10px] text-muted-foreground">
                                        Cierre:{" "}
                                        {new Date(opp.fecha_cierre_esperada).toLocaleDateString(
                                          "es-CL"
                                        )}
                                      </p>
                                    )}
                                    <div className="flex gap-1 pt-0.5">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-[10px] text-green-400 hover:text-green-300 px-1.5"
                                        onClick={() => handleUpdateEstado(opp.id, "ganada")}
                                      >
                                        ✓ Ganada
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-[10px] text-red-400 hover:text-red-300 px-1.5"
                                        onClick={() => handleUpdateEstado(opp.id, "perdida")}
                                      >
                                        ✗ Perdida
                                      </Button>
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
                          className="w-full border border-dashed border-border/50 text-muted-foreground hover:text-foreground h-8 text-xs"
                          onClick={() => {
                            setSelectedEtapa(etapa.id);
                            setDialogOpen(true);
                          }}
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
            <DialogTitle className="text-base font-heading">Nueva Oportunidad</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Título *</Label>
              <Input
                className="h-8 text-xs md:text-sm"
                placeholder="Ej: Rediseño web para cliente"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Cliente *</Label>
              <Select
                value={form.cliente_id}
                onValueChange={(v) => setForm({ ...form, cliente_id: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} {c.empresa ? `(${c.empresa})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Etapa</Label>
              <Select value={selectedEtapa} onValueChange={setSelectedEtapa}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Valor ($)</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  placeholder="0"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Probabilidad (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  className="h-8 text-xs"
                  value={form.probabilidad}
                  onChange={(e) => setForm({ ...form, probabilidad: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Fecha de cierre esperada</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={form.fecha_cierre_esperada}
                onChange={(e) => setForm({ ...form, fecha_cierre_esperada: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Notas</Label>
              <Textarea
                className="text-xs"
                placeholder="Notas adicionales..."
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateOportunidad}
              className="h-8 text-xs px-3 gradient-button font-heading font-semibold"
            >
              Crear Oportunidad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
