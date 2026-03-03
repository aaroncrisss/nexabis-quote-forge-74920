import React from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, Sparkles, User, FileText, Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Documentacion = () => {
    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link to="/cotizador">
                        <Button variant="ghost" size="icon" className="shrink-0 bg-background/50 hover:bg-background/80">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
                            <BookOpen className="w-8 h-8" />
                            Documentación del Cotizador AI
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Aprende a sacar el máximo provecho de las estimaciones automatizadas
                        </p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <Card className="glass-card border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                Cómo funciona la IA
                            </CardTitle>
                            <CardDescription>
                                Entendiendo el rol del asistente virtual en tus presupuestos
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-muted-foreground">
                            <p>
                                El Cotizador Inteligente utiliza un modelo avanzado de lenguaje (Google Gemini) configurado sistemáticamente para comportarse como un analista de proyectos de tu propia industria.
                            </p>
                            <p>
                                Al ingresar un requerimiento (ej. "Construir quincho de 40m2"), la IA desglosa el trabajo en **Módulos Lógicos** (ej. Fundaciones, Obra Gruesa, Terminaciones), asigna un nivel de prioridad y de riesgo a cada uno, y realiza una estimación de horas base de mano de obra según estándares de la industria.
                            </p>
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-200 mt-4">
                                <strong>Aviso Importante:</strong> La estimación generada es estrictamente preliminar. La IA proporciona una estructura sólida para que no comiences desde cero, pero debes revisar sus horas y cálculos de riesgo antes de aprobarlos definitivos para un cliente.
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Settings className="w-5 h-5 text-indigo-400" />
                                Configuración por Rubro (Industria)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-muted-foreground">
                            <p>
                                La plataforma se adapta dinámicamente según la industria de tu empresa (Tecnología, Construcción, Consultoría, etc). Esta configuración define qué parámetros se le consultan a la Inteligencia Artificial.
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Textos adaptables:</strong> Si eres de construcción, se te preguntará por "Tipo de Obra". Si eres de medicina, "Servicio Médico".</li>
                                <li><strong>Costos especiales:</strong> Al cambiar de rubro notarás campos adicionales (ej. "Costo por Sesión" o "Presupuesto de Materiales"). </li>
                                <li><strong>Cálculo de Costos Fijos:</strong> Todo lo que ingreses en los "Parámetros Específicos" afecta a la IA para agregar un valor explícito en moneda a tu presupuesto. Ojo, esto no contabiliza como "Mano de Obra" multiplicable.</li>
                            </ul>
                            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm mt-2">
                                <em>¿Necesitas probar otro rubro?</em> Puedes cambiar la industria de tu sistema dirigiéndote al menú <strong>Admin {"->"} Ajustes</strong>.
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                El Flujo del Presupuesto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-muted-foreground">
                            <ol className="list-decimal pl-5 space-y-3">
                                <li><strong>Cotizador AI:</strong> Introduces la idea, la IA calcula la viabilidad y estructura los módulos base.</li>
                                <li><strong>Editor Visual:</strong> Se crea un "Proyecto". Aquí puedes ajustar y refinar las horas de cada módulo generado por la IA de forma granular.</li>
                                <li><strong>Generación:</strong> Finalmente, pasas la estructuración a un "Presupuesto", donde puedes aplicar un IVA, descuentos globales y crear el documento estilizado PDF para tu cliente.</li>
                            </ol>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Documentacion;