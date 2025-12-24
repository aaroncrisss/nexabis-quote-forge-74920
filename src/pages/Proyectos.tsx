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
                .from('proyectos')
                .select('*')
                .order('created_at', { ascending: false });

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
            const { error } = await supabase
                .from('proyectos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setProyectos(proyectos.filter(p => p.id !== id));
            toast.success("Proyecto eliminado correctamente");
        } catch (error: any) {
            console.error("Error deleting project:", error);
            toast.error("Error al eliminar el proyecto");
        }
    };

    const getUrgencyColor = (urgencia: string) => {
        switch (urgencia?.toLowerCase()) {
            case 'baja': return 'bg-green-500 hover:bg-green-600';
            case 'media': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'alta': return 'bg-orange-500 hover:bg-orange-600';
            case 'crítica': case 'critica': return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-slate-500';
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Mis Proyectos</h1>
                        <p className="text-muted-foreground mt-1">Gestiona y da seguimiento a tus estimaciones guardadas</p>
                    </div>
                    <Link to="/cotizador">
                        <Button className="gradient-button gap-2">
                            <Plus className="w-4 h-4" />
                            Nuevo Proyecto
                        </Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : proyectos.length === 0 ? (
                    <Card className="border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                                <FolderKanban className="w-8 h-8 text-secondary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">No tienes proyectos guardados</h3>
                                <p className="text-muted-foreground mt-2 max-w-sm">
                                    Utiliza el Cotizador IA para generar tu primera estimación y guárdala como proyecto.
                                </p>
                            </div>
                            <Link to="/cotizador">
                                <Button variant="default" className="mt-4">
                                    Ir al Cotizador
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {proyectos.map((proyecto) => (
                            <Card key={proyecto.id} className="group hover:shadow-lg transition-all duration-300 border-primary/10 bg-card/50 hover:bg-card">
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-2">
                                        <Badge variant="outline" className="mb-2 w-fit">
                                            {proyecto.tipo}
                                        </Badge>
                                        {proyecto.urgencia && (
                                            <Badge className={`${getUrgencyColor(proyecto.urgencia)} text-white border-0`}>
                                                {proyecto.urgencia}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                                        {proyecto.nombre}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                        {proyecto.descripcion || "Sin descripción"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(proyecto.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>{proyecto.estado || 'En progreso'}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        className="flex-1 gap-2 group-hover:bg-primary/10 group-hover:text-primary"
                                        onClick={() => navigate(`/proyectos/${proyecto.id}`)}
                                    >
                                        Ver Detalles <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto y todas sus estimaciones asociadas.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(proyecto.id)} className="bg-destructive hover:bg-destructive/90">
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
