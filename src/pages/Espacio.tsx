import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, BookOpen, Lightbulb, ClipboardList, User, ArrowRight, Trash2, Edit3, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIAS = ["Idea", "Proyecto", "Personal", "Seguimiento", "General"];

const Espacio = () => {
    const { user } = useAuth();
    const [notas, setNotas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("Todas");

    // Pagination
    const PAGE_SIZE = 12;
    const [page, setPage] = useState(1);

    // Dialog state
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
            // Fetch all notes where cliente_id is null (workspace notes)
            const { data, error } = await supabaseCRM
                .from("notas_cliente")
                .select("*")
                .is("cliente_id", null)
                .eq("usuario_id", user?.id)
                .order("created_at", { ascending: false });

            if (error) {
                // If it fails because cliente_id can't be null, we might need a workaround. Let's cross that bridge if we come to it.
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
                        tipo: newCategoria
                    })
                    .eq("id", currentNota.id)
                    .eq("usuario_id", user?.id);

                if (error) throw error;
                toast.success("Nota actualizada");
            } else {
                const { error } = await supabaseCRM
                    .from("notas_cliente")
                    .insert({
                        contenido: newContenido,
                        tipo: newCategoria,
                        usuario_id: user?.id,
                        cliente_id: null // Explicitly null for workspace notes
                    });

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

    // Derived states
    const filteredNotas = notas.filter(n => {
        const matchesSearch = n.contenido?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = filtroCategoria === "Todas" || n.tipo === filtroCategoria;
        return matchesSearch && matchesCat;
    });

    const totalPages = Math.max(1, Math.ceil(filteredNotas.length / PAGE_SIZE));
    const paginatedNotas = filteredNotas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const getIconForCategory = (cat: string) => {
        switch (cat) {
            case "Idea": return <Lightbulb className="w-4 h-4 text-yellow-400" />;
            case "Proyecto": return <Briefcase className="w-4 h-4 text-blue-400" />;
            case "Personal": return <User className="w-4 h-4 text-purple-400" />;
            case "Seguimiento": return <ClipboardList className="w-4 h-4 text-green-400" />;
            default: return <BookOpen className="w-4 h-4 text-foreground/50" />;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Espacio de Trabajo</h1>
                        <p className="text-sm text-muted-foreground mt-1">Tus notas, ideas y documentación centralizada</p>
                    </div>
                    <Button onClick={() => openDialog()} className="gap-2 gradient-button">
                        <Plus className="w-4 h-4" /> Nueva Nota
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 border-primary/20 bg-primary/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Notas</p>
                                <p className="text-2xl font-bold text-primary">{notas.length}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10"><BookOpen className="w-5 h-5 text-primary" /></div>
                        </div>
                    </Card>
                    <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Ideas</p>
                                <p className="text-2xl font-bold text-yellow-400">{notas.filter(n => n.tipo === "Idea").length}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-yellow-500/10"><Lightbulb className="w-5 h-5 text-yellow-400" /></div>
                        </div>
                    </Card>
                    <Card className="p-4 border-blue-500/20 bg-blue-500/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Proyectos</p>
                                <p className="text-2xl font-bold text-blue-400">{notas.filter(n => n.tipo === "Proyecto").length}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/10"><Briefcase className="w-5 h-5 text-blue-400" /></div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar en tus notas..."
                            className="pl-9 bg-card"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                        <Button
                            variant={filtroCategoria === "Todas" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFiltroCategoria("Todas")}
                            className="rounded-full"
                        >
                            Todas
                        </Button>
                        {CATEGORIAS.map(cat => (
                            <Button
                                key={cat}
                                variant={filtroCategoria === cat ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFiltroCategoria(cat)}
                                className="rounded-full gap-1.5"
                            >
                                {getIconForCategory(cat)}
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredNotas.length === 0 ? (
                    <Card className="p-12 text-center text-muted-foreground bg-card/30 border-dashed">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium mb-1">No hay notas todavía</p>
                        <p className="text-sm mb-4">Usa este espacio como tu block de notas estilo Notion.</p>
                        <Button onClick={() => openDialog()} variant="outline" className="gap-2">
                            <Plus className="w-4 h-4" /> Crear mi primera nota
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedNotas.map((nota) => (
                            <Card key={nota.id} className="p-5 flex flex-col h-[200px] hover:shadow-md transition-all group overflow-hidden relative cursor-pointer" onClick={() => openDialog(nota)}>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); openDialog(nota); }}>
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10 bg-background/80 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); handleDeleteNota(nota.id); }}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between mb-3">
                                    <Badge variant="outline" className="gap-1 rounded-full text-[10px] bg-background">
                                        {getIconForCategory(nota.tipo)}
                                        {nota.tipo || "General"}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(nota.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm whitespace-pre-wrap text-foreground/90 line-clamp-5 leading-relaxed">
                                        {nota.contenido}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {filteredNotas.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border mt-6">
                        <p className="text-xs text-muted-foreground">
                            Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredNotas.length)} de {filteredNotas.length}
                        </p>
                        <div className="flex gap-1">
                            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Editor Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="flex items-center justify-between">
                            <span>{currentNota ? "Editar Nota" : "Nueva Nota"}</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 p-6 overflow-y-auto">
                        <div className="flex gap-2 flex-wrap">
                            {CATEGORIAS.map(cat => (
                                <Badge
                                    key={cat}
                                    variant={newCategoria === cat ? "default" : "outline"}
                                    className="cursor-pointer gap-1 px-3 py-1"
                                    onClick={() => setNewCategoria(cat)}
                                >
                                    {getIconForCategory(cat)}
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                        <Textarea
                            placeholder="Escribe tu nota aquí... (Soporte Markdown básico)"
                            className="min-h-[40vh] resize-none text-base border-muted bg-background/50 focus-visible:ring-1 p-4 font-mono text-sm leading-relaxed"
                            value={newContenido}
                            onChange={(e) => setNewContenido(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveNota} disabled={isSaving} className="gap-2">
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <ArrowRight className="w-4 h-4" />
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
