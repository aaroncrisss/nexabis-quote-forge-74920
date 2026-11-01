import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  BookOpen,
  Lightbulb,
  ClipboardList,
  User,
  ArrowRight,
  Trash2,
  Edit3,
  Briefcase,
  CheckSquare,
} from "lucide-react";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIAS = ["Idea", "Proyecto", "Personal", "Seguimiento", "General"];

const Espacio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notas, setNotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentNota, setCurrentNota] = useState<any>(null);
  const [newContenido, setNewContenido] = useState("");
  const [newCategoria, setNewCategoria] = useState("General");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) loadNotas();
  }, [user]);

  const loadNotas = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabaseCRM
        .from("notas_cliente")
        .select("*")
        .is("cliente_id", null)
        .eq("usuario_id", user?.id)
        .order("created_at", { ascending: false });

      // Fallback para recuperar notas creadas si cliente_id no pudo ser null
      if ((!data || data.length === 0) && user?.id) {
        const { data: allNotes } = await supabaseCRM
          .from("notas_cliente")
          .select("*")
          .eq("usuario_id", user.id)
          .order("created_at", { ascending: false });
        if (allNotes && allNotes.length > 0) {
          data = allNotes;
        }
      }

      if (error && (!data || data.length === 0)) {
        console.error("Error fetching notes:", error);
        throw error;
      }

      setNotas(data || []);
    } catch (error: any) {
      toast.error("Error al cargar notas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToTask = async (
    nota: any,
    targetScope?: "Nexabis" | "Trabajo" | "Diaria"
  ) => {
    if (!user) return;
    try {
      const { data: tm } = await supabaseCRM
        .from("team_members")
        .select("id")
        .eq("user_id", user.id)
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
      const nextId = `NEX-${maxNum + 1}`;

      const rawText = String(nota.contenido || "").trim();
      const firstLine = rawText.split("\n")[0].slice(0, 90) || "Tarea desde Espacio";
      const scope =
        targetScope ||
        (nota.tipo === "Personal"
          ? "Diaria"
          : nota.tipo === "Proyecto"
          ? "Nexabis"
          : "Trabajo");

      const { error } = await supabaseCRM.from("tasks").insert({
        id: nextId,
        title: firstLine,
        description: rawText,
        type: scope === "Diaria" ? "Diaria" : "Operacional",
        category: scope,
        priority: "P2",
        status: "Por hacer",
        progress: 0,
        project: scope === "Diaria" ? "Personal / Día" : nota.tipo || "Espacio",
        assignee: assigneeId,
        requester: assigneeId,
        creator: assigneeId,
        updated_by: assigneeId,
        start_date: new Date().toISOString().slice(0, 10),
        deadline: scope === "Diaria" ? new Date().toISOString().slice(0, 10) : null,
      });

      if (error) throw error;
      toast.success(`Nota convertida en tarea ${nextId} (${scope})`, {
        action: {
          label: "Ver en Tablero",
          onClick: () => navigate(`/tareas?ambito=${scope}`),
        },
      });
    } catch (err: any) {
      toast.error("No se pudo convertir en tarea: " + (err?.message || "Error"));
    }
  };

  const handleSaveNota = async () => {
    if (!newContenido.trim()) {
      toast.error("El contenido no puede estar vacío");
      return;
    }

    setIsSaving(true);
    try {
      if (currentNota?.id) {
        const { error } = await supabaseCRM
          .from("notas_cliente")
          .update({
            contenido: newContenido,
            tipo: newCategoria,
          })
          .eq("id", currentNota.id)
          .eq("usuario_id", user?.id);

        if (error) throw error;
        toast.success("Nota actualizada");
      } else {
        let { error } = await supabaseCRM.from("notas_cliente").insert({
          contenido: newContenido,
          tipo: newCategoria,
          usuario_id: user?.id,
          cliente_id: null,
        });

        // Fallback defensivo si cliente_id tiene restricción NOT NULL en la base de datos
        if (error && (error.message?.includes("cliente_id") || error.code === "23502")) {
          const { data: firstCli } = await supabase.from("clientes").select("id").limit(1).maybeSingle();
          if (firstCli?.id) {
            const fallbackRes = await supabaseCRM.from("notas_cliente").insert({
              contenido: newContenido,
              tipo: newCategoria,
              usuario_id: user?.id,
              cliente_id: firstCli.id,
            });
            error = fallbackRes.error;
          }
        }

        if (error) throw error;
        toast.success("Nota creada");
      }

      setIsDialogOpen(false);
      loadNotas();
    } catch (error: any) {
      toast.error("Error al guardar nota");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNota = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta nota?")) return;
    try {
      const { error } = await supabaseCRM
        .from("notas_cliente")
        .delete()
        .eq("id", id)
        .eq("usuario_id", user?.id);

      if (error) throw error;
      toast.success("Nota eliminada");
      loadNotas();
    } catch (error) {
      toast.error("Error al eliminar nota");
    }
  };

  const openDialog = (nota?: any) => {
    if (nota) {
      setCurrentNota(nota);
      setNewContenido(nota.contenido || "");
      setNewCategoria(nota.tipo || "General");
    } else {
      setCurrentNota(null);
      setNewContenido("");
      setNewCategoria("General");
    }
    setIsDialogOpen(true);
  };

  const filteredNotas = notas.filter((n) => {
    const matchesSearch = n.contenido?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = filtroCategoria === "Todas" || n.tipo === filtroCategoria;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.max(1, Math.ceil(filteredNotas.length / PAGE_SIZE));
  const paginatedNotas = filteredNotas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getIconForCategory = (cat: string) => {
    switch (cat) {
      case "Idea":
        return <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />;
      case "Proyecto":
        return <Briefcase className="w-3.5 h-3.5 text-blue-400" />;
      case "Personal":
        return <User className="w-3.5 h-3.5 text-purple-400" />;
      case "Seguimiento":
        return <ClipboardList className="w-3.5 h-3.5 text-green-400" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-foreground/50" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-xl font-heading font-bold gradient-text flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Espacio de Trabajo & Ideas
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tus notas rápidas, ideas y apuntes — conviértelos en tareas de Nexabis, Trabajo o
              Diarias con 1 clic
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => openDialog()}
            className="h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5 w-full sm:w-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva Nota
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-3.5 border-primary/20 bg-primary/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Total Notas
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-primary">
                  {notas.length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-yellow-500/20 bg-yellow-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Ideas
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-yellow-400">
                  {notas.filter((n) => n.tipo === "Idea").length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                <Lightbulb className="w-4 h-4" />
              </div>
            </div>
          </Card>
          <Card className="p-3.5 border-blue-500/20 bg-blue-500/5 transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Proyectos
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-blue-400">
                  {notas.filter((n) => n.tipo === "Proyecto").length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar en tus notas..."
              className="pl-9 h-8 text-xs md:text-sm bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
            <Button
              variant={filtroCategoria === "Todas" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroCategoria("Todas")}
              className="h-8 text-xs rounded-full px-3"
            >
              Todas
            </Button>
            {CATEGORIAS.map((cat) => (
              <Button
                key={cat}
                variant={filtroCategoria === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroCategoria(cat)}
                className="h-8 text-xs rounded-full gap-1.5 px-3"
              >
                {getIconForCategory(cat)}
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredNotas.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground bg-card/30 border-dashed">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm font-medium mb-1">No hay notas todavía</p>
            <p className="text-xs mb-3">Usa este espacio como tu block de notas rápido.</p>
            <Button
              size="sm"
              onClick={() => openDialog()}
              variant="outline"
              className="h-8 text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Crear mi primera nota
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedNotas.map((nota) => (
              <Card
                key={nota.id}
                className="p-4 flex flex-col h-[195px] transition-all duration-200 hover:border-primary/40 hover:shadow-[0_4px_20px_-4px_rgba(255,92,92,0.15)] group overflow-hidden relative cursor-pointer"
                onClick={() => openDialog(nota)}
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Convertir en Tarea en el Tablero"
                    className="h-7 w-7 text-blue-400 hover:text-blue-300 bg-background/80 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConvertToTask(nota);
                    }}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDialog(nota);
                    }}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-500/10 bg-background/80 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNota(nota.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant="outline"
                    className="gap-1 rounded-full text-[10px] h-5 bg-background"
                  >
                    {getIconForCategory(nota.tipo)}
                    {nota.tipo || "General"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(nota.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs whitespace-pre-wrap text-foreground/90 line-clamp-4 leading-relaxed">
                    {nota.contenido}
                  </p>
                </div>
                <div
                  className="pt-2 mt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Enviar a Tablero:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleConvertToTask(nota, "Nexabis")}
                      className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-medium"
                    >
                      🏢 Nexabis
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConvertToTask(nota, "Trabajo")}
                      className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 font-medium"
                    >
                      💼 Trabajo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConvertToTask(nota, "Diaria")}
                      className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-medium"
                    >
                      ☀️ Diaria
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredNotas.length > PAGE_SIZE && (
          <div className="flex items-center justify-between p-2.5 bg-card/50 rounded-lg border mt-4">
            <p className="text-xs text-muted-foreground">
              Mostrando {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, filteredNotas.length)} de {filteredNotas.length}
            </p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="text-base font-heading flex items-center justify-between">
              <span>{currentNota ? "Editar Nota" : "Nueva Nota"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 p-4 overflow-y-auto">
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIAS.map((cat) => (
                <Badge
                  key={cat}
                  variant={newCategoria === cat ? "default" : "outline"}
                  className="cursor-pointer gap-1 px-2.5 py-0.5 text-xs"
                  onClick={() => setNewCategoria(cat)}
                >
                  {getIconForCategory(cat)}
                  {cat}
                </Badge>
              ))}
            </div>
            <Textarea
              placeholder="Escribe tu nota aquí... (Soporte Markdown básico)"
              className="min-h-[35vh] resize-none border-muted bg-background/50 focus-visible:ring-1 p-3 font-mono text-xs md:text-sm leading-relaxed"
              value={newContenido}
              onChange={(e) => setNewContenido(e.target.value)}
            />
          </div>
          <DialogFooter className="px-4 py-3 border-t bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveNota}
              disabled={isSaving}
              className="h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              Guardar Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Espacio;
