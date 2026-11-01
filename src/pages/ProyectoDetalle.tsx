import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  BadgeDollarSign,
  Play,
  Check,
  Archive,
  ListTodo,
  DollarSign,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function ProyectoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proyecto, setProyecto] = useState<any>(null);
  const [estimaciones, setEstimaciones] = useState<any[]>([]);
  const [modulos, setModulos] = useState<any[]>([]);
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [tareasProyecto, setTareasProyecto] = useState<any[]>([]);
  const [pagosProyecto, setPagosProyecto] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const { data: proj, error: errProj } = await supabase
        .from("proyectos")
        .select("*")
        .eq("id", id)
        .single();

      if (errProj) throw errProj;
      setProyecto(proj);

      const { data: ests, error: errEsts } = await supabase
        .from("estimaciones")
        .select("*")
        .eq("proyecto_id", id)
        .order("es_elegida", { ascending: false });

      if (errEsts) throw errEsts;
      setEstimaciones(ests);

      if (ests && ests.length > 0) {
        loadModules(ests[0].id);
      }

      const { data: presups, error: errPresups } = await supabase
        .from("presupuestos")
        .select("*, clientes(nombre, empresa)")
        .eq("proyecto_id", id)
        .order("created_at", { ascending: false });

      if (!errPresups) {
        setPresupuestos(presups || []);
      }

      // Cargar tareas del proyecto desde public.tasks (tablero unificado)
      const { data: tareasData } = await supabaseCRM
        .from("tasks")
        .select("*")
        .eq("proyecto_id", id)
        .order("created_at", { ascending: false });
      setTareasProyecto(tareasData || []);

      // Cargar pagos del proyecto
      const { data: pagosData } = await supabaseCRM
        .from("pagos")
        .select("*, clientes(nombre)")
        .eq("proyecto_id", id)
        .order("fecha_pago", { ascending: false });
      setPagosProyecto(pagosData || []);
    } catch (error: any) {
      console.error("Error cargando proyecto:", error);
      toast.error("Error al cargar el proyecto");
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async (estimacionId: string) => {
    const { data: mods, error } = await supabase
      .from("modulos_estimacion")
      .select("*")
      .eq("estimacion_id", estimacionId)
      .eq("es_excluido", false)
      .order("prioridad", { ascending: true });

    if (error) {
      console.error("Error cargando módulos:", error);
      return;
    }
    setModulos(mods || []);
  };

  const toggleModuleStatus = async (moduloId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completado" ? "pendiente" : "completado";
    setModulos((prev) => prev.map((m) => (m.id === moduloId ? { ...m, estado: newStatus } : m)));

    const { error } = await supabase
      .from("modulos_estimacion")
      .update({ estado: newStatus })
      .eq("id", moduloId);

    if (error) {
      toast.error("Error al actualizar estado");
      setModulos((prev) => prev.map((m) => (m.id === moduloId ? { ...m, estado: currentStatus } : m)));
    }
  };

  const handleSyncToKanban = async () => {
    if (!proyecto || modulos.length === 0) return;

    try {
      toast.loading("Sincronizando módulos con el Tablero Kanban...");
      const userRes = await supabase.auth.getUser();
      if (!userRes.data.user) throw new Error("No user");
      const userId = userRes.data.user.id;

      const { data: tm } = await supabaseCRM
        .from("team_members")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      let assigneeId = tm?.id;
      if (!assigneeId) {
        const { data: anyMember } = await supabaseCRM
          .from("team_members")
          .select("id")
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle();
        assigneeId = anyMember?.id || "cristobal_abarca";
      }

      const { data: allIds } = await supabaseCRM.from("tasks").select("id");
      let maxNum = 100;
      for (const r of allIds || []) {
        const m = /(\d+)$/.exec(String(r.id || ""));
        if (m) maxNum = Math.max(maxNum, Number(m[1]));
      }

      let createdCount = 0;
      for (const mod of modulos) {
        const { data: existing } = await supabaseCRM
          .from("tasks")
          .select("id")
          .eq("modulo_id", mod.id)
          .maybeSingle();

        if (!existing) {
          maxNum += 1;
          const taskId = `NEX-${maxNum}`;
          const isDone = mod.estado === "completado";
          await supabaseCRM.from("tasks").insert({
            id: taskId,
            title: `[Módulo] ${mod.nombre}`,
            description: mod.descripcion || mod.justificacion || "",
            type: "Proyecto",
            category: "Nexabis",
            priority:
              mod.prioridad === 1
                ? "P0"
                : mod.prioridad === 2
                ? "P1"
                : mod.prioridad === 3
                ? "P2"
                : "P3",
            status: isDone ? "Terminada" : "Por hacer",
            progress: isDone ? 100 : 0,
            project: proyecto.nombre || "Proyecto Nexabis",
            assignee: assigneeId,
            requester: assigneeId,
            creator: assigneeId,
            updated_by: assigneeId,
            start_date: new Date().toISOString().slice(0, 10),
            cliente_id: proyecto.cliente_id || null,
            proyecto_id: proyecto.id,
            modulo_id: mod.id,
            completed_at: isDone ? new Date().toISOString().slice(0, 10) : null,
          });
          createdCount += 1;
        }
      }

      const { data: tareasData } = await supabaseCRM
        .from("tasks")
        .select("*")
        .eq("proyecto_id", id)
        .order("created_at", { ascending: false });
      setTareasProyecto(tareasData || []);

      toast.dismiss();
      toast.success(
        createdCount > 0
          ? `${createdCount} módulo(s) enviados al Tablero Kanban (🏢 Trabajo Nexabis)`
          : "Todos los módulos ya están sincronizados en el Tablero Kanban"
      );
    } catch (e: any) {
      toast.dismiss();
      toast.error("Hubo un error añadiendo los módulos al Kanban");
      console.error(e);
    }
  };

  const calculateProgress = () => {
    if (modulos.length === 0) return 0;
    const completed = modulos.filter((m) => m.estado === "completado").length;
    return Math.round((completed / modulos.length) * 100);
  };

  const handleCreateBudget = () => {
    if (!proyecto || !activeEstimacion) return;

    const costoHora =
      activeEstimacion.costo_hora && activeEstimacion.costo_hora > 0
        ? activeEstimacion.costo_hora
        : activeEstimacion.total_horas > 0
        ? Math.round(activeEstimacion.costo_total / activeEstimacion.total_horas)
        : 25000;

    const items = modulos.map((m) => {
      const cantidad = m.cantidad && m.cantidad > 0 ? m.cantidad : 1;
      const costoFijo = m.costo_fijo || 0;
      if (costoFijo > 0 && (!m.horas_estimadas || m.horas_estimadas === 0)) {
        return {
          descripcion: m.nombre,
          cantidad,
          precio_unitario: Math.round(costoFijo / cantidad),
          total: costoFijo,
        };
      }
      const totalMod = Math.round(m.horas_estimadas * costoHora + costoFijo);
      return {
        descripcion: costoFijo > 0 ? `${m.nombre} (Incluye Extras)` : m.nombre,
        cantidad,
        precio_unitario: Math.round(totalMod / cantidad),
        total: totalMod,
      };
    });

    navigate("/crear", {
      state: {
        fromCotizador: true,
        proyectoId: proyecto.id,
        clienteId: proyecto.cliente_id,
        titulo: `Presupuesto para ${proyecto.nombre}`,
        descripcion: proyecto.descripcion,
        items: items,
      },
    });
  };

  const ESTADOS_FLUJO = ["borrador", "activo", "en_progreso", "completado", "cerrado"];
  const ESTADO_ICONS: Record<string, any> = {
    borrador: <FileText className="w-4 h-4" />,
    activo: <Play className="w-4 h-4" />,
    en_progreso: <Clock className="w-4 h-4" />,
    completado: <Check className="w-4 h-4" />,
    cerrado: <Archive className="w-4 h-4" />,
  };

  const handleChangeEstado = async (nuevoEstado: string) => {
    const { error } = await supabase.from("proyectos").update({ estado: nuevoEstado }).eq("id", id);
    if (error) {
      toast.error("Error cambiando estado");
    } else {
      toast.success(`Proyecto actualizado a: ${nuevoEstado}`);
      setProyecto({ ...proyecto, estado: nuevoEstado });
    }
  };

  const handleDeleteProject = async () => {
    if (!proyecto) return;
    try {
      // 1. Desvincular presupuestos asociados
      await supabase.from("presupuestos").update({ proyecto_id: null }).eq("proyecto_id", proyecto.id);

      // 2. Desvincular tareas
      await supabase.from("tasks").update({ proyecto_id: null, project: "General" }).eq("proyecto_id", proyecto.id);
      await supabase.from("tareas").update({ proyecto_id: null }).eq("proyecto_id", proyecto.id);

      // 3. Eliminar estimaciones y módulos
      const { data: ests } = await supabase.from("estimaciones").select("id").eq("proyecto_id", proyecto.id);
      if (ests && ests.length > 0) {
        const estIds = ests.map((e) => e.id);
        await supabase.from("modulos_estimacion").delete().in("estimacion_id", estIds);
        await supabase.from("estimaciones").delete().eq("proyecto_id", proyecto.id);
      }

      // 4. Eliminar el proyecto
      const { error } = await supabase.from("proyectos").delete().eq("id", proyecto.id);
      if (error) throw error;

      toast.success("Proyecto eliminado correctamente");
      navigate("/proyectos");
    } catch (e: any) {
      toast.error(`Error al eliminar: ${e.message || "Verifica dependencias"}`);
    }
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

  if (!proyecto) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold">Proyecto no encontrado</h2>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Volver al Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const activeEstimacion =
    estimaciones.find((e) => e.id === modulos[0]?.estimacion_id) || estimaciones[0];

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/proyectos")}
          className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-primary pl-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a Proyectos
        </Button>

        <Card className="p-4 border-border/60 bg-card/60 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg md:text-xl font-heading font-bold gradient-text flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {proyecto.nombre}
                </h1>
                <Badge variant={proyecto.estado === "activo" ? "default" : "secondary"} className="text-[10px] h-5">
                  {proyecto.estado?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">{proyecto.descripcion}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleCreateBudget}
                  className="h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5"
                >
                  <BadgeDollarSign className="w-3.5 h-3.5" />
                  Generar Presupuesto Formal
                </Button>
                <div className="flex flex-wrap gap-1.5">
                  {ESTADOS_FLUJO.map((est) => (
                    <Button
                      key={est}
                      size="sm"
                      variant={proyecto.estado === est ? "default" : "outline"}
                      className={`h-7 text-[11px] px-2.5 gap-1 capitalize ${proyecto.estado === est ? "" : "opacity-75"}`}
                      onClick={() => handleChangeEstado(est)}
                      disabled={proyecto.estado === est}
                    >
                      {ESTADO_ICONS[est]}
                      {est.replace("_", " ")}
                    </Button>
                  ))}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1 px-2"
                      title="Eliminar proyecto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-base font-heading">¿Eliminar este proyecto?</AlertDialogTitle>
                      <AlertDialogDescription className="text-xs">
                        Esta acción desvinculará las tareas y presupuestos asociados y eliminará las estimaciones del proyecto.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="h-8 text-xs">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteProject}
                        className="h-8 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        Eliminar Proyecto
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-primary/5 p-3.5 rounded-lg border border-primary/20 self-start">
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Progreso</p>
                <p className="text-lg md:text-xl font-bold font-mono text-primary">{calculateProgress()}%</p>
              </div>
              <div className="w-14 h-14 relative flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted/20"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${calculateProgress() * 2.51} 251`}
                    className="text-primary rotate-[-90deg] origin-center transition-all duration-1000 ease-out"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="checklist" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="checklist" className="text-xs h-7 px-3">Checklist ({modulos.length})</TabsTrigger>
            <TabsTrigger value="tareas" className="text-xs h-7 px-3">Tareas en Tablero ({tareasProyecto.length})</TabsTrigger>
            <TabsTrigger value="pagos" className="text-xs h-7 px-3">Pagos ({pagosProyecto.length})</TabsTrigger>
            <TabsTrigger value="detalles" className="text-xs h-7 px-3">Detalles y Riesgos</TabsTrigger>
            <TabsTrigger value="versiones" className="text-xs h-7 px-3">Presupuesto Vinculado</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm md:text-base font-heading font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Módulos a Desarrollar ({modulos.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncToKanban}
                  className="h-8 text-xs gap-1.5 text-blue-500 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Push a Tablero Kanban
                </Button>
                {estimaciones.map((est) => (
                  <Button
                    key={est.id}
                    variant={activeEstimacion?.id === est.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => loadModules(est.id)}
                    className="h-8 text-xs hidden sm:flex"
                  >
                    {est.titulo}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2.5">
              {modulos.map((modulo) => (
                <Card
                  key={modulo.id}
                  className={`transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)] ${
                    modulo.estado === "completado" ? "opacity-70 bg-secondary/5" : ""
                  }`}
                >
                  <div className="p-3.5 flex items-start gap-3">
                    <Checkbox
                      checked={modulo.estado === "completado"}
                      onCheckedChange={() =>
                        toggleModuleStatus(modulo.id, modulo.estado || "pendiente")
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`text-sm font-medium ${
                            modulo.estado === "completado"
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {modulo.nombre}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-5 ${
                              modulo.prioridad === 1
                                ? "border-red-500 text-red-500 bg-red-500/10"
                                : modulo.prioridad === 2
                                ? "border-orange-500 text-orange-500 bg-orange-500/10"
                                : modulo.prioridad === 3
                                ? "border-blue-500 text-blue-500 bg-blue-500/10"
                                : "border-slate-500"
                            }`}
                          >
                            {modulo.prioridad === 1
                              ? "Crítico"
                              : modulo.prioridad === 2
                              ? "Esencial"
                              : modulo.prioridad === 3
                              ? "Importante"
                              : "Opcional"}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] h-5 font-mono">{modulo.horas_estimadas}h</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {modulo.descripcion || modulo.justificacion}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tareas del Proyecto (Sincronizadas con public.tasks) */}
          <TabsContent value="tareas" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm md:text-base font-heading font-semibold flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-orange-400" />
                Tareas del Proyecto ({tareasProyecto.length})
              </h3>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate("/tareas?ambito=Nexabis")}>
                Abrir en Tablero Kanban →
              </Button>
            </div>
            {tareasProyecto.length === 0 ? (
              <Card className="p-6 text-center text-xs text-muted-foreground">
                No hay tareas vinculadas a este proyecto. Usa el botón &ldquo;Push a Tablero Kanban&rdquo; para enviar los módulos al tablero.
              </Card>
            ) : (
              <div className="space-y-2">
                {tareasProyecto.map((t) => {
                  const statusVal = t.status || "Por hacer";
                  const isDone = statusVal === "Terminada";
                  return (
                    <Card key={t.id} className={`p-3.5 transition-all duration-200 hover:border-primary/40 ${isDone ? "opacity-60 bg-muted/20" : ""}`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-muted-foreground">{t.id}</span>
                            <p
                              className={`text-sm font-medium truncate ${
                                isDone ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {t.title || t.titulo}
                            </p>
                          </div>
                          {(t.description || t.descripcion) && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {t.description || t.descripcion}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                          <Badge variant="secondary" className="text-[10px] h-5">{t.priority || t.prioridad || "P2"}</Badge>
                          <Select
                            value={statusVal}
                            onValueChange={async (newStatus) => {
                              setTareasProyecto((prev) =>
                                prev.map((x) => (x.id === t.id ? { ...x, status: newStatus } : x))
                              );
                              await supabaseCRM
                                .from("tasks")
                                .update({
                                  status: newStatus,
                                  progress: newStatus === "Terminada" ? 100 : t.progress || 0,
                                  completed_at:
                                    newStatus === "Terminada"
                                      ? new Date().toISOString().slice(0, 10)
                                      : null,
                                })
                                .eq("id", t.id);
                            }}
                          >
                            <SelectTrigger
                              className={`w-full sm:w-[150px] h-8 text-xs font-semibold ${
                                statusVal === "Terminada"
                                  ? "bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200"
                                  : statusVal === "En curso"
                                  ? "bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200"
                                  : statusVal === "Bloqueada"
                                  ? "bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200"
                                  : "bg-slate-100/50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200"
                              }`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Backlog">📋 Backlog</SelectItem>
                              <SelectItem value="Por hacer">📝 Por hacer</SelectItem>
                              <SelectItem value="En curso">⏳ En curso</SelectItem>
                              <SelectItem value="En revisión">🔍 En revisión</SelectItem>
                              <SelectItem value="Bloqueada">⛔ Bloqueada</SelectItem>
                              <SelectItem value="Terminada">✅ Terminada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Pagos del Proyecto */}
          <TabsContent value="pagos" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm md:text-base font-heading font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                Pagos del Proyecto ({pagosProyecto.length})
              </h3>
            </div>
            {pagosProyecto.length === 0 ? (
              <Card className="p-6 text-center text-xs text-muted-foreground">
                No hay pagos vinculados a este proyecto
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                          Cliente
                        </th>
                        <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                          Monto
                        </th>
                        <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                          Estado
                        </th>
                        <th className="text-left p-2.5 text-[11px] font-semibold text-muted-foreground uppercase">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagosProyecto.map((p) => (
                        <tr key={p.id} className="border-b border-border/50">
                          <td className="p-2.5 text-xs">{p.clientes?.nombre || "—"}</td>
                          <td className="p-2.5 text-xs font-bold font-mono">${Number(p.monto).toLocaleString()}</td>
                          <td className="p-2.5">
                            <Badge
                              className={`text-[10px] h-5 ${
                                p.estado === "completado"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {p.estado}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-xs text-muted-foreground">
                            {p.fecha_pago
                              ? new Date(p.fecha_pago).toLocaleDateString("es-CL")
                              : "Fecha no registrada"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="detalles">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="transition-all duration-200 hover:border-primary/40">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm md:text-base font-heading font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Riesgos Identificados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <ul className="list-disc list-inside space-y-1.5 text-xs">
                    {activeEstimacion?.riesgos?.map((r: string, i: number) => (
                      <li key={i} className="text-muted-foreground">
                        {r}
                      </li>
                    )) || <p className="text-xs text-muted-foreground">No hay riesgos registrados.</p>}
                  </ul>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:border-primary/40">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm md:text-base font-heading font-semibold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-500" />
                    Suposiciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <ul className="list-disc list-inside space-y-1.5 text-xs">
                    {activeEstimacion?.suposiciones?.map((s: string, i: number) => (
                      <li key={i} className="text-muted-foreground">
                        {s}
                      </li>
                    )) || <p className="text-xs text-muted-foreground">No hay suposiciones registradas.</p>}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="versiones">
            <div className="space-y-3">
              <h3 className="text-sm md:text-base font-heading font-semibold flex items-center gap-2">
                <BadgeDollarSign className="w-4 h-4 text-yellow-500" />
                Presupuesto Vinculado
              </h3>
              {presupuestos.length === 0 ? (
                <Card className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    No hay presupuestos vinculados a este proyecto.
                  </p>
                  <Button size="sm" onClick={handleCreateBudget} className="mt-3 h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5">
                    <BadgeDollarSign className="w-3.5 h-3.5" />
                    Crear Presupuesto
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {presupuestos.map((p) => (
                    <Card key={p.id} className="p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-bold font-mono text-sm md:text-base">{p.numero}</p>
                          <p className="text-xs text-muted-foreground">{p.titulo}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Cliente: {p.clientes?.empresa || p.clientes?.nombre || "Sin asignar"}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="text-base md:text-lg font-bold font-mono text-primary">
                              ${Number(p.total || 0).toLocaleString()} {p.moneda}
                            </p>
                            <Badge
                              className="text-[10px] h-5"
                              variant={
                                p.estado === "aprobado"
                                  ? "default"
                                  : p.estado === "rechazado"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {p.estado?.toUpperCase()}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => window.open(`/presupuesto/${p.token}`, "_blank")}
                          >
                            Ver
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
