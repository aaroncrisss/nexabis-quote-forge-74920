import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Calendar, FileText, CheckCircle2, Clock, AlertTriangle, ShieldAlert, BadgeDollarSign } from "lucide-react";
import { toast } from "sonner";

export default function ProyectoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [proyecto, setProyecto] = useState<any>(null);
    const [estimaciones, setEstimaciones] = useState<any[]>([]);
    const [modulos, setModulos] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<string>("checklist");

    useEffect(() => {
        if (id) {
            loadProjectData();
        }
    }, [id]);

    const loadProjectData = async () => {
        try {
            setLoading(true);
            // Cargar proyecto
            const { data: proj, error: errProj } = await supabase
                .from('proyectos')
                .select('*')
                .eq('id', id)
                .single();

            if (errProj) throw errProj;
            setProyecto(proj);

            // Cargar estimaciones
            const { data: ests, error: errEsts } = await supabase
                .from('estimaciones')
                .select('*')
                .eq('proyecto_id', id)
                .order('es_elegida', { ascending: false }); // Mostrar elegida primero

            if (errEsts) throw errEsts;
            setEstimaciones(ests);

            if (ests && ests.length > 0) {
                // Cargar módulos de la estimación principal (la primera o elegida)
                loadModules(ests[0].id);
            }
        } catch (error: any) {
            console.error("Error cargando proyecto:", error);
            toast.error("Error al cargar el proyecto");
        } finally {
            setLoading(false);
        }
    };

    const loadModules = async (estimacionId: string) => {
        const { data: mods, error } = await supabase
            .from('modulos_estimacion')
            .select('*')
            .eq('estimacion_id', estimacionId)
            .eq('es_excluido', false) // Solo mostrar los incluidos
            .order('prioridad', { ascending: true }); // Críticos primero

        if (error) {
            console.error("Error cargando módulos:", error);
            return;
        }
        setModulos(mods || []);
    };

    const toggleModuleStatus = async (moduloId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completado' ? 'pendiente' : 'completado';

        // Optimistic update
        setModulos(prev => prev.map(m => m.id === moduloId ? { ...m, estado: newStatus } : m));

        const { error } = await supabase
            .from('modulos_estimacion')
            .update({ estado: newStatus })
            .eq('id', moduloId);

        if (error) {
            toast.error("Error al actualizar estado");
            // Revertir
            setModulos(prev => prev.map(m => m.id === moduloId ? { ...m, estado: currentStatus } : m));
        }
    };

    const calculateProgress = () => {
        if (modulos.length === 0) return 0;
        const completed = modulos.filter(m => m.estado === 'completado').length;
        return Math.round((completed / modulos.length) * 100);
    };

    const handleCreateBudget = () => {
        if (!proyecto || !activeEstimacion) return;

        // Map modules to budget items
        const items = modulos.map(m => ({
            descripcion: m.nombre,
            cantidad: 1,
            precio_unitario: Math.round((m.horas_estimadas * activeEstimacion.costo_total) / activeEstimacion.total_horas), // Approximate unit price derived from total cost/hours
            total: Math.round((m.horas_estimadas * activeEstimacion.costo_total) / activeEstimacion.total_horas)
        }));

        navigate('/crear', {
            state: {
                fromCotizador: true,
                proyectoId: proyecto.id,
                clienteId: proyecto.cliente_id,
                titulo: `Presupuesto para ${proyecto.nombre}`,
                descripcion: proyecto.descripcion,
                items: items
            }
        });
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
                    <Button onClick={() => navigate('/dashboard')} className="mt-4">Volver al Dashboard</Button>
                </div>
            </DashboardLayout>
        );
    }

    const activeEstimacion = estimaciones.find(e => e.id === modulos[0]?.estimacion_id) || estimaciones[0];

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="gap-2 text-muted-foreground hover:text-primary pl-0"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver
                </Button>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{proyecto.nombre}</h1>
                            <Badge variant={proyecto.estado === 'activo' ? 'default' : 'secondary'}>
                                {proyecto.estado?.toUpperCase()}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-2 max-w-2xl">{proyecto.descripcion}</p>
                        <Button onClick={handleCreateBudget} className="mt-4 gap-2 gradient-button">
                            <BadgeDollarSign className="w-4 h-4" />
                            Generar Presupuesto Formal
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 bg-secondary/10 p-4 rounded-lg border border-secondary/20">
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Progreso</p>
                            <p className="text-2xl font-bold text-primary">{calculateProgress()}%</p>
                        </div>
                        <div className="w-24 h-24 relative flex items-center justify-center">
                            {/* Simple Circle Progress Placeholder */}
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/20" />
                                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={`${calculateProgress() * 2.51} 251`} className="text-primary rotate-[-90deg] origin-center transition-all duration-1000 ease-out" />
                            </svg>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="checklist" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="checklist">Checklist de Implementación</TabsTrigger>
                        <TabsTrigger value="detalles">Detalles y Riesgos</TabsTrigger>
                        <TabsTrigger value="versiones">Versiones del Presupuesto</TabsTrigger>
                    </TabsList>

                    <TabsContent value="checklist" className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                Módulos a Desarrollar ({modulos.length})
                            </h3>
                            <div className="flex gap-2">
                                {estimaciones.map(est => (
                                    <Button
                                        key={est.id}
                                        variant={activeEstimacion?.id === est.id ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => loadModules(est.id)}
                                        className="text-xs"
                                    >
                                        {est.titulo}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-3">
                            {modulos.map((modulo) => (
                                <Card key={modulo.id} className={`transition-all hover:bg-accent/5 ${modulo.estado === 'completado' ? 'opacity-70 bg-secondary/5' : ''}`}>
                                    <div className="p-4 flex items-start gap-4">
                                        <Checkbox
                                            checked={modulo.estado === 'completado'}
                                            onCheckedChange={() => toggleModuleStatus(modulo.id, modulo.estado || 'pendiente')}
                                            className="mt-1"
                                        />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`font-medium ${modulo.estado === 'completado' ? 'line-through text-muted-foreground' : ''}`}>
                                                    {modulo.nombre}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`${modulo.prioridad === 1 ? "border-red-500 text-red-500 bg-red-500/10" :
                                                        modulo.prioridad === 2 ? "border-orange-500 text-orange-500 bg-orange-500/10" : "border-slate-500"
                                                        }`}>
                                                        {modulo.prioridad === 1 ? 'Crítico' : modulo.prioridad === 2 ? 'Esencial' : 'Opcional'}
                                                    </Badge>
                                                    <Badge variant="secondary">{modulo.horas_estimadas}h</Badge>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{modulo.descripcion || modulo.justificacion}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="detalles">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                                        Riesgos Identificados
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc list-inside space-y-2 text-sm">
                                        {activeEstimacion?.riesgos?.map((r: string, i: number) => (
                                            <li key={i} className="text-muted-foreground">{r}</li>
                                        )) || <p>No hay riesgos registrados.</p>}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShieldAlert className="w-5 h-5 text-blue-500" />
                                        Suposiciones
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc list-inside space-y-2 text-sm">
                                        {activeEstimacion?.suposiciones?.map((s: string, i: number) => (
                                            <li key={i} className="text-muted-foreground">{s}</li>
                                        )) || <p>No hay suposiciones registradas.</p>}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
