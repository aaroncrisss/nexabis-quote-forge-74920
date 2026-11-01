import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Calendar, Clock, ArrowRight, FolderKanban, Trash2 } from "lucide-react";
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
import { toast } from "sonner";

export default function Proyectos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proyectos, setProyectos] = useState<any[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("proyectos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProyectos(data || []);
    } catch (error: any) {
      console.error("Error loading projects:", error);
      toast.error("Error al cargar proyectos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // 1. Desvincular presupuestos asociados para no romper presupuestos existentes
      await supabase.from("presupuestos").update({ proyecto_id: null }).eq("proyecto_id", id);

      // 2. Desvincular tareas asociadas
      await supabase.from("tasks").update({ proyecto_id: null, project: "General" }).eq("proyecto_id", id);
      await supabase.from("tareas").update({ proyecto_id: null }).eq("proyecto_id", id);

      // 3. Eliminar estimaciones y módulos hijos
      const { data: ests } = await supabase.from("estimaciones").select("id").eq("proyecto_id", id);
      if (ests && ests.length > 0) {
        const estIds = ests.map((e) => e.id);
        await supabase.from("modulos_estimacion").delete().in("estimacion_id", estIds);
        await supabase.from("estimaciones").delete().eq("proyecto_id", id);
      }

      // 4. Eliminar el proyecto
      const { error } = await supabase.from("proyectos").delete().eq("id", id);
      if (error) throw error;

      setProyectos(proyectos.filter((p) => p.id !== id));
      toast.success("Proyecto eliminado correctamente");
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast.error(`Error al eliminar: ${error.message || "Verifica dependencias"}`);
    }
  };

  const getUrgencyColor = (urgencia: string) => {
    switch (urgencia?.toLowerCase()) {
      case "baja":
        return "bg-green-500 hover:bg-green-600";
      case "media":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "alta":
        return "bg-orange-500 hover:bg-orange-600";
      case "crítica":
      case "critica":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-slate-500";
    }
  };

  const totalProyectos = proyectos.length;
  const activosCount = proyectos.filter(
    (p) => !p.estado || p.estado === "activo" || p.estado === "en_progreso"
  ).length;
  const completadosCount = proyectos.filter(
    (p) => p.estado === "completado" || p.estado === "cerrado"
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-heading font-bold gradient-text flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              Mis Proyectos
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gestiona y da seguimiento a tus estimaciones guardadas
            </p>
          </div>
          <Link to="/cotizador">
            <Button
              size="sm"
              className="h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5 w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Proyecto
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-3.5 border-primary/20 bg-primary/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Total Proyectos
                </p>
                <p className="text-lg md:text-xl font-bold font-mono">{totalProyectos}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-amber-500/20 bg-amber-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  En Progreso
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-amber-400">{activosCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-emerald-500/20 bg-emerald-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Completados
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-emerald-400">
                  {completadosCount}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : proyectos.length === 0 ? (
          <Card className="border-dashed border-2 transition-all duration-200 hover:border-primary/40">
            <CardContent className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3">
              <div className="p-3 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-heading font-semibold">
                  No tienes proyectos guardados
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Utiliza el Cotizador IA para generar tu primera estimación y guárdala como proyecto.
                </p>
              </div>
              <Link to="/cotizador">
                <Button
                  size="sm"
                  className="h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5 mt-2"
                >
                  Ir al Cotizador
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {proyectos.map((proyecto) => (
              <Card
                key={proyecto.id}
                className="group border-border/60 bg-card/60 hover:bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)] flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 w-fit">
                      {proyecto.tipo || "Proyecto"}
                    </Badge>
                    {proyecto.urgencia && (
                      <Badge
                        className={`${getUrgencyColor(
                          proyecto.urgencia
                        )} text-white border-0 text-[10px] px-2 py-0 h-5`}
                      >
                        {proyecto.urgencia}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm md:text-base font-heading font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                    {proyecto.nombre}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2 min-h-[2rem]">
                    {proyecto.descripcion || "Sin descripción"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 py-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary/70" />
                      {new Date(proyecto.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5 capitalize">
                      <Clock className="w-3.5 h-3.5 text-amber-400/80" />
                      {(proyecto.estado || "En progreso").replace("_", " ")}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-2 flex gap-2 border-t border-border/40 mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5 group-hover:bg-primary/10 group-hover:text-primary"
                    onClick={() => navigate(`/proyectos/${proyecto.id}`)}
                  >
                    Ver Detalles{" "}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-heading">
                          ¿Estás seguro?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs">
                          Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto y
                          todas sus estimaciones asociadas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="h-8 text-xs">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(proyecto.id)}
                          className="h-8 text-xs bg-destructive hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
