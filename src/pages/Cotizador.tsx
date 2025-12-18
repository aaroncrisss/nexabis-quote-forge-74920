import { useState, useEffect } from "react";
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
  Zap
} from "lucide-react";

interface Modulo {
  nombre: string;
  horasEstimadas: number;
  nivelRiesgo: "bajo" | "medio" | "alto";
  justificacion: string;
}

interface Estimacion {
  complejidad: "baja" | "media" | "alta";
  modulos: Modulo[];
  horasTotales: number;
  riesgosClave: string[];
  suposiciones: string[];
  nivelConfianza: "alto" | "medio" | "bajo";
}

interface Cliente {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string;
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
    telefono: "",
    direccion: "",
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [estimacion, setEstimacion] = useState<Estimacion | null>(null);

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
    setNuevoCliente({ nombre: "", empresa: "", email: "", telefono: "", direccion: "" });
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

    try {
      // Llamar directamente al endpoint de Lovable Cloud
      const response = await fetch(
        "https://xrncxmtscasysbqvmvkz.supabase.co/functions/v1/cotizador",
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

      if (data?.estimacion) {
        setEstimacion(data.estimacion);
        toast.success("Estimación generada exitosamente");
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
              Estima horas y complejidad antes de crear un presupuesto
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <Card className="glass-card border-primary/20">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Datos del Proyecto
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Ingresa los requerimientos del cliente para generar una estimación
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
                  <CardContent className="p-4 md:p-6 pt-0">
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
                  </CardContent>
                </Card>

                {/* Modules */}
                <Card className="glass-card border-primary/20">
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-lg md:text-xl">Desglose por Módulo</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0 space-y-3">
                    {estimacion.modulos.map((modulo, index) => (
                      <div key={index} className="p-3 bg-secondary/30 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm md:text-base">{modulo.nombre}</p>
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
                    ))}
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
                    El análisis con IA te dará horas estimadas, riesgos y más
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