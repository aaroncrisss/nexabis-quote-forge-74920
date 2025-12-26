import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Calculator,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Sparkles,
  FileText,
  Zap,
  ArrowRight,
  DollarSign,
  Eye,
  EyeOff,
  Save
} from "lucide-react";

interface Modulo {
  nombre: string;
  horasEstimadas: number;
  nivelRiesgo: "bajo" | "medio" | "alto";
  justificacion: string;
  prioridad?: number;
  esencial?: boolean; // Mantener por compatibilidad hacia atrás
}

interface AjustePresupuesto {
  excedePresupuesto: boolean;
  mensajeAjuste: string;
  modulosRecomendados: string[];
  modulosExcluidos: string[];
}

interface Estimacion {
  complejidad: "baja" | "media" | "alta";
  modulos: Modulo[];
  horasTotales: number;
  riesgosClave: string[];
  suposiciones: string[];
  nivelConfianza: "alto" | "medio" | "bajo";
  ajustePresupuesto?: AjustePresupuesto;
}

interface Cliente {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string;
  rut?: string;
}

const TIPOS_PROYECTO = [
  { value: "web", label: "Sitio Web" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "app", label: "Aplicación Móvil" },
  { value: "automatizacion", label: "Automatización" },
  { value: "marketing", label: "Marketing Digital" },
  { value: "software", label: "Software a Medida" },
  { value: "otro", label: "Otro" },
];

const NIVELES_URGENCIA = [
  { value: "baja", label: "Baja (sin fecha límite)" },
  { value: "media", label: "Media (1-2 meses)" },
  { value: "alta", label: "Alta (2-4 semanas)" },
  { value: "urgente", label: "Urgente (menos de 2 semanas)" },
];

const Cotizador = () => {
  const navigate = useNavigate();

  // Form state
  const [tipoProyecto, setTipoProyecto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [funcionalidades, setFuncionalidades] = useState<string[]>([]);
  const [nuevaFuncionalidad, setNuevaFuncionalidad] = useState("");
  const [urgencia, setUrgencia] = useState("");

  // Client state
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    empresa: "",
    email: "",
    rut: "",
    telefono: "",
    direccion: "",
  });

  // UI state
  const [mostrarAjuste, setMostrarAjuste] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [estimacion, setEstimacion] = useState<Estimacion | null>(null);
  const [costoPorHora, setCostoPorHora] = useState(25000); // CLP por defecto
  const [presupuestoCliente, setPresupuestoCliente] = useState<string>("");
  const [proyecto, setProyecto] = useState<any>(null); // Track saved project

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre, empresa, email")
      .order("nombre");

    if (!error && data) {
      setClientes(data);
    }
  };

  const handleCreateCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.email) {
      toast.error("Nombre y email son requeridos");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from("clientes")
      .insert({
        ...nuevoCliente,
        usuario_id: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("No se pudo crear el cliente");
      return;
    }

    toast.success("Cliente creado exitosamente");
    setClientes([...clientes, data]);
    setClienteId(data.id);
    setIsClientDialogOpen(false);
    setNuevoCliente({ nombre: "", empresa: "", email: "", rut: "", telefono: "", direccion: "" });
  };

  const addFuncionalidad = () => {
    if (nuevaFuncionalidad.trim()) {
      setFuncionalidades([...funcionalidades, nuevaFuncionalidad.trim()]);
      setNuevaFuncionalidad("");
    }
  };

  const removeFuncionalidad = (index: number) => {
    setFuncionalidades(funcionalidades.filter((_, i) => i !== index));
  };

  const handleEstimar = async () => {
    if (!tipoProyecto || !descripcion) {
      toast.error("Completa el tipo de proyecto y la descripción");
      return;
    }

    setIsLoading(true);
    setEstimacion(null);

    // Calcular horas maximas basadas en presupuesto
    let horasMaximas = undefined;
    if (presupuestoCliente && !isNaN(Number(presupuestoCliente))) {
      horasMaximas = Math.floor(Number(presupuestoCliente) / costoPorHora);
    }

    try {
      // Llamar al endpoint de tu Supabase Self-Hosted
      const response = await fetch(
        "https://supabase.nexabistech.com/functions/v1/cotizador",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipoProyecto,
            descripcion,
            funcionalidades,
            urgencia: urgencia || "media",
            horasMaximas
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Function error:", data);
        toast.error(data.error || "Error al generar la estimación");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // The Edge Function returns the estimation object directly, not wrapped in an "estimacion" key
      if (data && data.modulos) {
        setEstimacion(data);
        toast.success("Estimación generada exitosamente");
      } else if (data?.estimacion) {
        // Fallback for backward compatibility if we change the backend structure
        setEstimacion(data.estimacion);
        toast.success("Estimación generada exitosamente");
      } else {
        console.error("Respuesta inesperada:", data);
        toast.error("Formato de respuesta inválido");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const getComplejidadColor = (complejidad: string) => {
    switch (complejidad) {
      case "baja": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "media": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "alta": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getRiesgoColor = (riesgo: string) => {
    switch (riesgo) {
      case "bajo": return "text-green-400";
      case "medio": return "text-yellow-400";
      case "alto": return "text-red-400";
      default: return "text-muted-foreground";
    }
  };

  const getConfianzaIcon = (confianza: string) => {
    switch (confianza) {
      case "alto": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "medio": return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "bajo": return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return null;
    }
  };

  /* --------------------------------------------------------------------------------
   * PERSISTENCIA DE PROYECTO
   * -------------------------------------------------------------------------------- */
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProject = async () => {
    if (!estimacion || !tipoProyecto) return;

    try {
      setIsSaving(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión para guardar un proyecto");
        return;
      }

      // Assuming 'nombreProyecto' and 'urgency' are defined elsewhere or derived.
      // For this change, we'll use the existing 'tipoProyecto' and 'urgencia' for context if 'nombreProyecto' and 'urgency' are not defined.
      // If 'nombreProyecto' and 'urgency' are meant to be new variables, they should be declared.
      // As per instruction, I'm replacing with 'nombreProyecto' and 'urgency' directly.
      const nombreProyecto = `Proyecto ${tipoProyecto} - ${new Date().toLocaleDateString()}`; // Placeholder, assuming it's derived or defined.
      const urgency = urgencia; // Placeholder, assuming it's derived or defined.

      // 1. Crear el Proyecto
      const { data: proyecto, error: errorProyecto } = await supabase
        .from('proyectos')
        .insert({
          usuario_id: user.id,
          cliente_id: clienteId || null, // Guardar el cliente seleccionado
          nombre: nombreProyecto,
          descripcion: descripcion,
          tipo: tipoProyecto,
          urgencia: urgency,
          presupuesto_cliente: presupuestoCliente ? parseInt(presupuestoCliente) : null,
          estado: 'borrador' // Inicia como borrador
        })
        .select()
        .single();

      if (errorProyecto) throw errorProyecto;
      if (!proyecto) throw new Error("No se pudo crear el proyecto");

      // Actualizar estado local
      setProyecto(proyecto);

      // Usar la variable local actualizada para las siguientes operaciones
      const proy = proyecto;

      const { data: estCompleta, error: errorEstCompleta } = await supabase
        .from('estimaciones')
        .insert({
          proyecto_id: proy.id,
          titulo: "Alcance Completo",
          total_horas: Math.ceil(estimacion.horasTotales), // Round up to match int column
          costo_total: estimacion.horasTotales * costoPorHora,
          costo_hora: costoPorHora, // Guardar el valor de la hora
          complejidad: estimacion.complejidad,
          nivel_confianza: estimacion.nivelConfianza,
          riesgos: estimacion.riesgosClave,
          suposiciones: estimacion.suposiciones,
          es_elegida: !estimacion.ajustePresupuesto?.excedePresupuesto // Es la elegida si no excede presupuesto
        })
        .select()
        .single();

      if (errorEstCompleta) throw errorEstCompleta;

      // Helper para mapear prioridades
      const mapPrioridad = (p: string | number | undefined): number => {
        if (typeof p === 'number') return p;
        if (!p) return 4;
        const lower = p.toString().toLowerCase();
        if (lower.includes('crit') || lower.includes('crít')) return 1; // Critical
        if (lower.includes('esen')) return 2; // Essential
        if (lower.includes('imp')) return 3; // Important
        return 4; // Optional (default)
      };

      // 3. Guardar módulos de la versión Completa
      if (estCompleta) {
        const modulosInsert = estimacion.modulos.map(m => ({
          estimacion_id: estCompleta.id,
          nombre: m.nombre,
          horas_estimadas: Math.ceil(m.horasEstimadas), // Round up
          prioridad: mapPrioridad(m.prioridad),
          nivel_riesgo: m.nivelRiesgo,
          justificacion: m.justificacion,
          es_excluido: false,
          estado: 'pendiente'
        }));

        const { error: errorModulos } = await supabase.from('modulos_estimacion').insert(modulosInsert);
        if (errorModulos) throw errorModulos;
      }

      // 4. Si excede presupuesto, guardar la Versión "MVP" (Solo sugeridos)
      if (estimacion.ajustePresupuesto?.excedePresupuesto) {
        // Calcular totales del MVP
        const modulosMVP = estimacion.modulos.filter(m =>
          estimacion.ajustePresupuesto?.modulosRecomendados.includes(m.nombre)
        );
        const horasMVP = modulosMVP.reduce((acc, m) => acc + m.horasEstimadas, 0);

        const { data: estMVP, error: errorEstMVP } = await supabase
          .from('estimaciones')
          .insert({
            proyecto_id: proy.id,
            titulo: "MVP Sugerido (Ajustado a Presupuesto)",
            total_horas: Math.ceil(horasMVP), // Round up
            costo_total: horasMVP * costoPorHora,
            costo_hora: costoPorHora, // Guardar costo hora también aquí
            complejidad: estimacion.complejidad,
            nivel_confianza: estimacion.nivelConfianza,
            riesgos: estimacion.riesgosClave,
            suposiciones: estimacion.suposiciones,
            es_elegida: true // Esta será la recomendada/elegida por defecto
          })
          .select()
          .single();

        if (errorEstMVP) throw errorEstMVP;

        // Guardar módulos del MVP (marcamos como excluidos los que no están)
        if (estMVP) {
          const modulosMVPInsert = estimacion.modulos.map(m => {
            const isIncluded = estimacion.ajustePresupuesto?.modulosRecomendados.includes(m.nombre);
            return {
              estimacion_id: estMVP.id,
              nombre: m.nombre,
              horas_estimadas: Math.ceil(m.horasEstimadas), // Round up
              prioridad: mapPrioridad(m.prioridad),
              nivel_riesgo: m.nivelRiesgo,
              justificacion: m.justificacion,
              es_excluido: !isIncluded, // Marcamos como excluido si no está en recomendados
              estado: 'pendiente'
            };
          });

          const { error: errorModulosMVP } = await supabase.from('modulos_estimacion').insert(modulosMVPInsert);
          if (errorModulosMVP) throw errorModulosMVP;
        }
      }

      toast.success("¡Proyecto guardado exitosamente!");
      navigate(`/proyectos/${proy.id}`);

    } catch (error: any) {
      console.error("Error al guardar proyecto:", error);
      toast.error(`Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const calcularCostoTotal = () => {
    if (!estimacion) return 0;
    return estimacion.horasTotales * costoPorHora;
  };

  const convertirAPresupuesto = (usarAjuste: boolean = false) => {
    if (!estimacion) return;

    // Determinar qué módulos incluir
    // Si usamos ajuste (alternativa), filtramos por recomendaciones
    // Si NO usamos ajuste (completo), usamos todos los módulos originales
    const modulosFinales = usarAjuste && estimacion.ajustePresupuesto
      ? estimacion.modulos.filter(m => estimacion.ajustePresupuesto?.modulosRecomendados.includes(m.nombre))
      : estimacion.modulos;

    const items = modulosFinales.map((modulo) => ({
      descripcion: modulo.nombre, // Solo el nombre del módulo
      cantidad: 1, // Cantidad siempre 1
      precio_unitario: modulo.horasEstimadas * costoPorHora, // Precio total del módulo
      total: modulo.horasEstimadas * costoPorHora,
    }));

    // Obtener el tipo de proyecto legible
    const tipoLabel = TIPOS_PROYECTO.find(t => t.value === tipoProyecto)?.label || tipoProyecto;

    navigate("/crear", {
      state: {
        fromCotizador: true,
        clienteId,
        proyectoId: proyecto?.id, // Pass project ID if available
        titulo: `${tipoLabel} - Estimación IA`,
        items,
        descripcion,
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold gradient-text flex items-center gap-3">
              <Sparkles className="w-7 h-7 md:w-8 md:h-8" />
              Cotizador Inteligente
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Estima horas, complejidad y ajusta al presupuesto de tu cliente
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {/* Form Section */}
          <Card className="glass-card border-primary/20">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Datos del Proyecto
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Ingresa los requerimientos y el presupuesto disponible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6 pt-0">
              {/* Cliente */}
              <div>
                <Label className="text-sm">Cliente (opcional)</Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
                  <Select value={clienteId} onValueChange={setClienteId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{cliente.nombre}</span>
                            {cliente.empresa && (
                              <span className="text-muted-foreground text-xs">({cliente.empresa})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">Nombre *</Label>
                          <Input
                            value={nuevoCliente.nombre}
                            onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                            placeholder="Juan Pérez"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">RUT</Label>
                          <Input
                            value={nuevoCliente.rut}
                            onChange={(e) => setNuevoCliente({ ...nuevoCliente, rut: e.target.value })}
                            placeholder="12.345.678-9"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Empresa</Label>
                          <Input
                            value={nuevoCliente.empresa}
                            onChange={(e) => setNuevoCliente({ ...nuevoCliente, empresa: e.target.value })}
                            placeholder="Empresa S.A."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Email *</Label>
                          <Input
                            type="email"
                            value={nuevoCliente.email}
                            onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                            placeholder="cliente@email.com"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Teléfono</Label>
                          <Input
                            value={nuevoCliente.telefono}
                            onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                            placeholder="+56 9 1234 5678"
                            className="mt-1"
                          />
                        </div>
                        <Button onClick={handleCreateCliente} className="w-full">
                          Crear Cliente
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Tipo de proyecto */}
              <div>
                <Label className="text-sm">Tipo de Proyecto *</Label>
                <Select value={tipoProyecto} onValueChange={setTipoProyecto}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PROYECTO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Presupuesto y Costo Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Costo Hora (CLP)</Label>
                  <Input
                    type="number"
                    value={costoPorHora}
                    onChange={(e) => setCostoPorHora(Number(e.target.value))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm">Presupuesto Cliente</Label>
                  <Input
                    type="number"
                    value={presupuestoCliente}
                    onChange={(e) => setPresupuestoCliente(e.target.value)}
                    placeholder="Opcional"
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <Label className="text-sm">Descripción del Requerimiento *</Label>
                <Textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe lo que el cliente necesita, los objetivos del proyecto, funcionalidades principales, etc."
                  className="mt-1.5 min-h-[120px]"
                />
              </div>

              {/* Funcionalidades */}
              <div>
                <Label className="text-sm">Funcionalidades Específicas</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={nuevaFuncionalidad}
                    onChange={(e) => setNuevaFuncionalidad(e.target.value)}
                    placeholder="Ej: Sistema de login, carrito de compras..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFuncionalidad())}
                  />
                  <Button variant="outline" size="icon" onClick={addFuncionalidad}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {funcionalidades.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {funcionalidades.map((func, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pr-1">
                        {func}
                        <button
                          onClick={() => removeFuncionalidad(index)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Urgencia */}
              <div>
                <Label className="text-sm">Nivel de Urgencia</Label>
                <Select value={urgencia} onValueChange={setUrgencia}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Seleccionar urgencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIVELES_URGENCIA.map((nivel) => (
                      <SelectItem key={nivel.value} value={nivel.value}>
                        {nivel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleEstimar}
                disabled={isLoading || !tipoProyecto || !descripcion}
                className="w-full gradient-button gap-2"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analizando con IA...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    Generar Estimación
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-4">
            {isLoading && (
              <Card className="glass-card border-primary/20">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium">Analizando requerimientos...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gemini está procesando la información
                  </p>
                </CardContent>
              </Card>
            )}

            {estimacion && !isLoading && (
              <>
                {/* Summary Card */}
                <Card className="glass-card border-primary/20">
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-lg md:text-xl flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Resumen de Estimación
                      </span>
                      <Badge className={getComplejidadColor(estimacion.complejidad)}>
                        Complejidad {estimacion.complejidad}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <p className="text-2xl md:text-3xl font-bold">{estimacion.horasTotales}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Horas totales</p>
                      </div>
                      <div className="text-center p-4 bg-secondary/50 rounded-lg">
                        <div className="flex justify-center mb-2">
                          {getConfianzaIcon(estimacion.nivelConfianza)}
                        </div>
                        <p className="text-lg md:text-xl font-bold capitalize">{estimacion.nivelConfianza}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">Nivel de confianza</p>
                      </div>
                    </div>

                    <div className="p-4 bg-accent/10 rounded-lg border border-accent/30 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Costo estimado:</span>
                      <span className="text-xl font-bold text-primary">
                        ${calcularCostoTotal().toLocaleString("es-CL")} CLP
                      </span>
                    </div>

                    {/* Ajuste de Presupuesto */}
                    {/* Ajuste de Presupuesto - Visual Mejorada */}
                    {estimacion.ajustePresupuesto && estimacion.ajustePresupuesto.excedePresupuesto && (
                      <div className={`p-4 rounded-lg space-y-3 transition-all duration-300 ${mostrarAjuste ? 'bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-red-500/10 border border-red-500/20'}`}>
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-2 font-medium ${mostrarAjuste ? 'text-indigo-400' : 'text-red-400'}`}>
                            {mostrarAjuste ? <Sparkles className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            <span>{mostrarAjuste ? "Propuesta de Fases (IA)" : "Excede Presupuesto Cliente"}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMostrarAjuste(!mostrarAjuste)}
                            className={`${mostrarAjuste ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10' : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'} h-8 gap-2 transition-colors`}
                          >
                            {mostrarAjuste ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {mostrarAjuste ? "Ocultar Propuesta" : "Ver Solución Sugerida"}
                          </Button>
                        </div>

                        {mostrarAjuste ? (
                          <div className="text-sm text-foreground/90 bg-background/50 p-4 rounded-md border border-indigo-500/10 relative overflow-hidden">
                            {/* Gradient accent */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500/50"></div>

                            <div className="whitespace-pre-wrap pl-2 space-y-2">
                              {estimacion.ajustePresupuesto.mensajeAjuste.split('\n').map((line, i) => {
                                // Simple formatting for **bold** text
                                const parts = line.split(/(\*\*.*?\*\*)/g);
                                return (
                                  <div key={i} className={`${line.trim().startsWith('📦') || line.trim().startsWith('💰') ? 'mt-3 font-medium' : ''}`}>
                                    {parts.map((part, j) => {
                                      if (part.startsWith('**') && part.endsWith('**')) {
                                        return <span key={j} className="font-bold text-indigo-400">{part.slice(2, -2)}</span>;
                                      }
                                      return <span key={j}>{part}</span>;
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                            El presupuesto permite cubrir solo una parte de los requerimientos.
                          </div>
                        )}
                      </div>
                    )}
                    {estimacion.ajustePresupuesto && !estimacion.ajustePresupuesto.excedePresupuesto && presupuestoCliente && (
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-green-400 font-medium">
                          <CheckCircle className="w-5 h-5" />
                          <span>Dentro del Presupuesto</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          El proyecto es viable con el presupuesto actual.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      {/* 1. GUARDAR PROYECTO - Siempre visible primero */}
                      <Button
                        onClick={handleSaveProject}
                        disabled={isSaving || !!proyecto}
                        variant={proyecto ? "outline" : "default"}
                        className={`w-full gap-2 ${proyecto ? 'border-green-500 text-green-500' : 'gradient-button'}`}
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : proyecto ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {isSaving ? "Guardando..." : proyecto ? "✓ Proyecto Guardado" : "1. Guardar Proyecto"}
                      </Button>

                      {/* 2. PRESUPUESTO - Solo visible después de guardar */}
                      {proyecto ? (
                        estimacion.ajustePresupuesto?.excedePresupuesto && mostrarAjuste ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Button
                              onClick={() => convertirAPresupuesto(true)}
                              className="w-full bg-green-600 hover:bg-green-700 gap-2"
                            >
                              <DollarSign className="w-4 h-4" />
                              Alternativa Ajustada
                            </Button>
                            <Button
                              onClick={() => convertirAPresupuesto(false)}
                              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 gap-2"
                              variant="outline"
                            >
                              <FileText className="w-4 h-4" />
                              Presupuesto Completo
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => convertirAPresupuesto(false)}
                            className="w-full gradient-button gap-2"
                            size="lg"
                          >
                            <ArrowRight className="w-4 h-4" />
                            2. Crear Presupuesto (Vinculado)
                          </Button>
                        )
                      ) : (
                        <p className="text-xs text-center text-muted-foreground">
                          💡 Guarda el proyecto primero para generar un presupuesto vinculado
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Modules */}
                <Card className="glass-card border-primary/20">
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-lg md:text-xl">Desglose por Módulo</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0 space-y-3">
                    {estimacion.modulos.map((modulo, index) => {
                      const isExcluded = mostrarAjuste && estimacion.ajustePresupuesto?.modulosExcluidos.includes(modulo.nombre);
                      return (
                        <div key={index} className={`p-3 rounded-lg border ${isExcluded ? 'bg-red-500/5 border-red-500/20 opacity-70' : 'bg-secondary/30 border-transparent'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`font-medium text-sm md:text-base ${isExcluded ? 'line-through text-muted-foreground' : ''}`}>{modulo.nombre}</p>
                                {modulo.prioridad ? (
                                  <Badge className={`text-xs h-5 ${modulo.prioridad === 1 ? "bg-red-500 hover:bg-red-600 border-red-600" :
                                    modulo.prioridad === 2 ? "bg-orange-500 hover:bg-orange-600 border-orange-600" :
                                      modulo.prioridad === 3 ? "bg-blue-500 hover:bg-blue-600 border-blue-600" :
                                        "bg-slate-500 hover:bg-slate-600 border-slate-600"
                                    }`}>
                                    {modulo.prioridad === 1 ? "Crítico" :
                                      modulo.prioridad === 2 ? "Esencial" :
                                        modulo.prioridad === 3 ? "Importante" : "Opcional"}
                                  </Badge>
                                ) : modulo.esencial && <Badge variant="outline" className="text-xs h-5">Esencial</Badge>}
                                {isExcluded && <Badge variant="destructive" className="text-xs h-5">Excluido por Presupuesto</Badge>}
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                {modulo.justificacion}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-primary">{modulo.horasEstimadas}h</p>
                              <p className={`text-xs capitalize ${getRiesgoColor(modulo.nivelRiesgo)}`}>
                                Riesgo {modulo.nivelRiesgo}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                {/* Risks & Assumptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {estimacion.riesgosClave.length > 0 && (
                    <Card className="glass-card border-red-500/20">
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm md:text-base flex items-center gap-2 text-red-400">
                          <AlertTriangle className="w-4 h-4" />
                          Riesgos Clave
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <ul className="space-y-1 text-xs md:text-sm">
                          {estimacion.riesgosClave.map((riesgo, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              {riesgo}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {estimacion.suposiciones.length > 0 && (
                    <Card className="glass-card border-yellow-500/20">
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm md:text-base flex items-center gap-2 text-yellow-400">
                          <AlertTriangle className="w-4 h-4" />
                          Suposiciones
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <ul className="space-y-1 text-xs md:text-sm">
                          {estimacion.suposiciones.map((sup, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-yellow-400">•</span>
                              {sup}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}

            {!estimacion && !isLoading && (
              <Card className="glass-card border-dashed border-2 border-muted">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <Calculator className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Completa el formulario para generar una estimación
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    El análisis con IA te dará horas estimadas, riesgos y ajustes de presupuesto
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Cotizador;