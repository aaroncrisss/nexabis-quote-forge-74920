
const ALLOWED_ORIGINS = [
  'https://nexabistech.com',
  'https://www.nexabistech.com',
  'http://localhost:8080',
  'http://localhost:5173',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL') || '';

// ============================================================
// MULTI-RUBRO PROMPT SYSTEM — NEXABIS INTELLIGENCE v2.0
// ============================================================

interface RubroConfig {
  label: string;
  systemContext: string;
  timeRanges: string;
  moduleExamples: string;
}

const RUBRO_CONFIGS: Record<string, RubroConfig> = {
  tecnologia: {
    label: "Tecnología / Software",
    systemContext: "Eres un analista técnico senior especializado en estimación de proyectos de software y tecnología digital.",
    timeRanges: `⏱️ RANGOS DE TIEMPO BASE — TECNOLOGÍA:
🔐 Usuarios / Accesos:
- Autenticación básica (email+password, OAuth): 6-8 horas
- Perfiles / roles simples: 5-7 horas
- Acceso por link / token: 4-6 horas
- SSO / Integración LDAP: 10-14 horas
🖼️ Multimedia:
- Subida de imágenes con preview: 3-5 horas
- Galerías / visualización: 4-6 horas
- Manejo archivos / validaciones: 2-4 horas
💬 Interacción / Formularios:
- Formularios simples: 2-4 horas
- Comentarios / muro interactivo: 8-10 horas
- Notificaciones en tiempo real: 6-8 horas
🎨 Frontend / UX:
- Maquetación base: 6-8 horas
- Responsive design: 4-6 horas
- Ajustes UX / refinamiento: 3-5 horas
🧠 Backend / API:
- Modelado base de datos: 3-5 horas
- Endpoints CRUD: 4-6 horas
- Lógica de negocio: 5-7 horas
- Integraciones externas (API): 6-8 horas
🛒 eCommerce:
- Setup tienda: 6-8 horas
- Productos / inventario: 4-6 horas
- Checkout / pagos: 6-8 horas
💳 Pagos:
- Integración pasarela: 6-8 horas
- Pruebas pagos: 3-5 horas
🚀 Infraestructura:
- Configuración servidor: 3-5 horas
- Deploy productivo: 1-2 horas
- CI/CD pipeline: 4-6 horas
🧪 QA / Cierre:
- Testing funcional: 4-6 horas
- Correcciones: 3-5 horas
- Validación final: 2-3 horas
🤖 Inteligencia Artificial / Bots:
- Setup LLM básico o APIs (OpenAI, Anthropic): 4-8 horas
- Desarrollo de Flujos Conversacionales y Estado (n8n, LangChain): 15-25 horas
- Sistema RAG (vectores, embeddings, ingestión básica): 8-12 horas
- Integración de Visión Computacional (API externa): 4-8 horas
- Optimización de Prompts y Testing IA: 4-8 horas`,
    moduleExamples: "Ejemplos de módulos: Autenticación, Dashboard, CRUD Productos, API REST, Integración Pagos, Panel Admin, Landing Page, etc."
  },

  construccion: {
    label: "Construcción / Obra civil",
    systemContext: "Eres un analista senior especializado en estimación de proyectos de construcción, obra civil y arquitectura. Conoces normativas, etapas de obra, y presupuestos de construcción.",
    timeRanges: `⏱️ RANGOS DE TIEMPO BASE — CONSTRUCCIÓN (en días-hombre):
📐 Diseño y Planificación:
- Levantamiento topográfico: 8-16 horas
- Planos arquitectónicos (por planta): 16-24 horas
- Ingeniería estructural: 20-40 horas
- Permisos municipales / trámites: 8-16 horas
- Estudio de suelos: 8-12 horas
🏗️ Obra Gruesa:
- Excavación y preparación terreno: 16-32 horas
- Fundaciones / cimientos: 24-48 horas
- Estructura (muros, pilares, vigas): 40-80 horas
- Techumbre / cubierta: 16-32 horas
🔧 Instalaciones:
- Eléctrica domiciliaria: 16-24 horas
- Sanitaria (agua potable + alcantarillado): 16-24 horas
- Gas: 8-12 horas
- Climatización / HVAC: 12-24 horas
🎨 Terminaciones:
- Revestimientos (pisos, muros): 16-32 horas
- Pintura interior + exterior: 12-24 horas
- Carpintería (puertas, closets): 12-20 horas
- Ventanas / vidrios: 8-16 horas
🏁 Cierre / Entrega:
- Inspección final: 4-8 horas
- Recepción municipal: 8-16 horas
- Documentación entregable: 4-8 horas`,
    moduleExamples: "Ejemplos de módulos: Movimiento de Tierras, Fundaciones, Albañilería, Instalación Eléctrica, Gasfitería, Techumbre, Terminaciones, Paisajismo, etc."
  },

  consultoria: {
    label: "Consultoría / Asesoría",
    systemContext: "Eres un analista senior especializado en estimación de proyectos de consultoría empresarial, asesoría estratégica y servicios profesionales.",
    timeRanges: `⏱️ RANGOS DE TIEMPO BASE — CONSULTORÍA:
🔍 Diagnóstico:
- Levantamiento de información: 8-16 horas
- Entrevistas stakeholders: 4-8 horas
- Análisis de situación actual: 8-12 horas
- Benchmark / investigación de mercado: 8-16 horas
📊 Análisis y Estrategia:
- Análisis de datos: 8-16 horas
- Diseño de estrategia: 12-20 horas
- Modelamiento financiero: 8-16 horas
- Definición de KPIs: 4-8 horas
📋 Entregables:
- Informe ejecutivo: 6-10 horas
- Presentación directiva: 4-8 horas
- Manual de procesos: 12-20 horas
- Roadmap de implementación: 6-10 horas
🎓 Capacitación:
- Diseño de talleres: 6-10 horas
- Ejecución de talleres (por sesión): 4-6 horas
- Material de apoyo: 4-8 horas
📈 Seguimiento:
- Sessions de coaching: 2-4 horas (por sesión)
- Reportes de avance: 3-5 horas
- Ajustes al plan: 4-8 horas`,
    moduleExamples: "Ejemplos de módulos: Diagnóstico Organizacional, Plan Estratégico, Estudio de Mercado, Capacitación Equipos, Informe Final, Seguimiento Mensual, etc."
  },

  diseno: {
    label: "Diseño / Creatividad",
    systemContext: "Eres un analista senior especializado en estimación de proyectos de diseño gráfico, branding, UX/UI y creatividad visual.",
    timeRanges: `⏱️ RANGOS DE TIEMPO BASE — DISEÑO:
🎨 Identidad Visual:
- Logo (concepto + variantes): 12-20 horas
- Manual de marca: 16-24 horas
- Paleta de colores + tipografía: 4-6 horas
- Papelería corporativa: 6-10 horas
📱 UX/UI Design:
- Research de usuarios: 8-12 horas
- Wireframes (por pantalla): 2-4 horas
- Diseño UI high-fidelity (por pantalla): 3-5 horas
- Prototipo interactivo: 6-10 horas
- Design system: 12-20 horas
🖼️ Piezas Gráficas:
- Banner / header web: 2-4 horas
- Post redes sociales (set 5): 4-6 horas
- Flyer / afiche: 3-5 horas
- Catálogo / brochure (por página): 3-5 horas
📹 Multimedia:
- Edición video corto (30-60s): 6-10 horas
- Motion graphics: 8-14 horas
- Fotografía de producto (set): 4-8 horas`,
    moduleExamples: "Ejemplos de módulos: Branding Completo, Diseño Web UI, Kit Redes Sociales, Catálogo Digital, Prototipo Figma, etc."
  },

  marketing: {
    label: "Marketing / Publicidad",
    systemContext: "Eres un analista senior especializado en estimación de proyectos de marketing digital, publicidad y estrategia de contenidos.",
    timeRanges: `⏱️ RANGOS DE TIEMPO BASE — MARKETING:
📊 Estrategia:
- Plan de marketing digital: 12-20 horas
- Análisis de competencia: 6-10 horas
- Definición de buyer personas: 4-8 horas
- Planificación de contenidos (mensual): 6-10 horas
🎯 Publicidad Digital:
- Setup campaña Google Ads: 6-10 horas
- Setup campaña Meta Ads: 6-10 horas
- Optimización mensual: 8-12 horas
- Creación de creativos (set): 4-8 horas
✍️ Contenido:
- Copywriting web (por página): 2-4 horas
- Blog posts (por artículo): 3-5 horas
- Email marketing (secuencia 5 emails): 8-12 horas
- Script video: 3-5 horas
📈 SEO:
- Auditoría SEO: 8-14 horas
- Optimización on-page: 8-12 horas
- Link building (mensual): 6-10 horas
- Keywords research: 4-8 horas
🤖 Automatización:
- Setup CRM: 8-12 horas
- Flujos de automatización: 6-10 horas
- Chatbot básico: 8-14 horas`,
    moduleExamples: "Ejemplos de módulos: Plan de Contenidos, Campaña Google Ads, SEO On-Page, Email Marketing, Social Media Management, Branding Digital, etc."
  },

  freelance: {
    label: "Freelance / Independiente",
    systemContext: "Eres un analista versátil especializado en estimación de proyectos freelance de cualquier tipo. Adaptas tu estimación al servicio específico que ofrece el freelancer.",
    timeRanges: `⏱️ RANGOS DE TIEMPO BASE — FREELANCE (adaptables):
📋 Gestión del Proyecto:
- Levantamiento de requerimientos: 2-4 horas
- Propuesta / presupuesto: 2-3 horas
- Comunicación con cliente: 2-4 horas
- Revisiones y ajustes: 3-6 horas
🔨 Ejecución:
- Tarea simple: 2-4 horas
- Tarea media: 4-8 horas
- Tarea compleja: 8-16 horas
- Investigación / aprendizaje: 2-6 horas
📦 Entrega:
- Preparación de entregables: 2-4 horas
- Documentación: 1-3 horas
- Soporte post-entrega: 2-4 horas

NOTA: Estos rangos son genéricos. Ajusta según el tipo de servicio freelance específico.`,
    moduleExamples: "Ejemplos: Diseño de Logo, Desarrollo Web, Traducción, Redacción, Fotografía, Video, Consultoría, etc."
  },

  energia: {
    label: "Energía / Climatización",
    systemContext: "Eres un analista senior especializado en estimación de proyectos de energía, climatización (HVAC), instalaciones eléctricas y eficiencia energética.",
    timeRanges: `⏱️ RANGOS DE TIEMPO BASE — ENERGÍA/HVAC:
🔍 Evaluación Inicial:
- Visita técnica / levantamiento: 4-8 horas
- Cálculo de carga térmica: 6-10 horas
- Estudio de eficiencia energética: 8-16 horas
- Propuesta técnica: 4-8 horas
⚡ Instalación Eléctrica:
- Tablero eléctrico: 8-16 horas
- Cableado / canalizaciones: 12-24 horas
- Sistemas de respaldo (UPS/generador): 8-12 horas
- Paneles solares: 16-32 horas
❄️ Climatización:
- Split residencial: 4-6 horas
- Sistema VRF comercial: 24-48 horas
- Ductos / distribución aire: 16-32 horas
- Calefacción central: 16-24 horas
🔧 Mantención:
- Mantención preventiva equipo: 2-4 horas
- Limpieza y recarga refrigerante: 2-3 horas
- Diagnóstico de fallas: 2-6 horas
📋 Documentación:
- Certificación SEC: 4-8 horas
- Manual de operación: 4-6 horas
- Garantías / post-venta: 2-4 horas`,
    moduleExamples: "Ejemplos de módulos: Instalación Aire Acondicionado, Tablero Eléctrico, Paneles Solares, Eficiencia Energética, Mantención Preventiva, etc."
  },

  salud: {
    label: "Salud / Bienestar",
    systemContext: "Eres un analista senior especializado en estimación de proyectos del sector salud, bienestar, clínicas y servicios médicos.",
    timeRanges: `⏱️ RANGOS DE TIEMPO BASE — SALUD:
📋 Consultoría / Planificación:
- Evaluación de procesos clínicos: 8-16 horas
- Diseño de protocolos: 12-20 horas
- Plan de implementación: 8-12 horas
🏥 Infraestructura Clínica:
- Habilitación de box / consulta: 16-24 horas
- Equipamiento médico: 8-16 horas
- Sistemas informáticos clínicos: 20-40 horas
👥 Capacitación:
- Inducción personal (por grupo): 4-8 horas
- Capacitación protocolos: 6-10 horas
- Simulacros: 4-6 horas
📊 Gestión:
- Fichas clínicas digitales: 12-20 horas
- Agendamiento de citas: 8-14 horas
- Reportería / indicadores: 8-12 horas
📱 Digital:
- Plataforma telemedicina: 20-40 horas
- App de pacientes: 30-50 horas
- Portal de resultados: 12-20 horas`,
    moduleExamples: "Ejemplos de módulos: Sistema de Agendamiento, Ficha Clínica Digital, Telemedicina, Capacitación Personal, Portal Pacientes, etc."
  },

  educacion: {
    label: "Educación / Formación",
    systemContext: "Eres un analista senior especializado en estimación de proyectos educativos, plataformas e-learning y formación profesional.",
    timeRanges: `⏱️ RANGOS DE TIEMPO BASE — EDUCACIÓN:
📚 Diseño Instruccional:
- Análisis de necesidades: 6-10 horas
- Diseño curricular (por módulo): 8-14 horas
- Creación de contenido (por lección): 4-8 horas
- Evaluaciones / rúbricas: 3-6 horas
🖥️ Plataforma E-learning:
- Setup LMS (Moodle/similar): 12-20 horas
- Configuración cursos: 6-10 horas
- Integración videoconferencia: 4-8 horas
- Gamificación: 10-16 horas
📹 Producción de Contenido:
- Video educativo (por unidad): 6-12 horas
- Presentaciones interactivas: 4-8 horas
- Quizzes / ejercicios: 3-5 horas
- Material descargable: 2-4 horas
📊 Gestión Académica:
- Sistema de notas: 8-14 horas
- Reportes de progreso: 6-10 horas
- Certificación automática: 6-10 horas
👨‍🏫 Capacitación:
- Formación de formadores: 6-10 horas
- Soporte técnico docente: 4-6 horas
- Piloto / prueba: 4-8 horas`,
    moduleExamples: "Ejemplos de módulos: Plataforma LMS, Diseño Curricular, Videos Educativos, Sistema de Evaluación, Reportes de Progreso, etc."
  },

  otro: {
    label: "Otro",
    systemContext: "Eres un analista senior versátil especializado en estimación de proyectos de cualquier industria. Adaptas tu metodología según el contexto del proyecto.",
    timeRanges: `⏱️ RANGOS DE TIEMPO BASE — GENERAL (adaptables):
📋 Planificación:
- Levantamiento de requerimientos: 4-8 horas
- Diseño de solución: 8-16 horas
- Planificación detallada: 6-10 horas
🔨 Ejecución:
- Componente simple: 4-8 horas
- Componente mediano: 8-16 horas
- Componente complejo: 16-32 horas
- Integración entre componentes: 4-8 horas
📊 Gestión:
- Seguimiento / coordinación: 4-8 horas
- Control de calidad: 4-8 horas
- Documentación: 4-8 horas
📦 Entrega:
- Testing / verificación: 4-8 horas
- Capacitación: 4-8 horas
- Entrega y cierre: 2-4 horas

NOTA: Adapta estos rangos al contexto específico del proyecto.`,
    moduleExamples: "Adapta los nombres de módulos al tipo de proyecto específico."
  }
};

function buildSystemPrompt(rubro: string): string {
  const config = RUBRO_CONFIGS[rubro] || RUBRO_CONFIGS['otro'];

  return `${config.systemContext}

REGLAS OBLIGATORIAS:
- NO defines precios ni valores hora
- NO inventas alcances no descritos por el usuario
- Estimas horas por módulo basándote en la información proporcionada Y en los RANGOS DE TIEMPO BASE definidos abajo
- Los rangos son GUÍAS FLEXIBLES, no reglas absolutas - ajusta según complejidad real del proyecto
- Detectas riesgos técnicos reales
- Justificas cada estimación de forma breve y técnica
- Si hay ambigüedad, marcas nivel de confianza bajo y agregas suposiciones
- SIEMPRE devuelves ÚNICAMENTE JSON válido, sin texto adicional

${config.timeRanges}

NOTA: Estos tiempos varían según el proyecto específico. Ajusta según el contexto real.

${config.moduleExamples}

📊 SISTEMA DE PRIORIDADES (CRÍTICO):
Cada módulo debe tener una prioridad de 1 a 4:

**Prioridad 1 - CRÍTICO**: 
- Sin esto, el proyecto literalmente NO FUNCIONA
- Criterio: ¿El proyecto existe sin esto? Si NO → Prioridad 1

**Prioridad 2 - ESENCIAL**:
- Funcionalidad CORE del negocio, razón principal del proyecto
- Criterio: ¿Es la razón por la que el cliente paga? Si SÍ → Prioridad 2

**Prioridad 3 - IMPORTANTE**:
- Mejora significativa de experiencia, pero el MVP funciona sin esto
- Criterio: ¿Los usuarios se quejarán si falta? Si SÍ → Prioridad 3

**Prioridad 4 - OPCIONAL**:
- Nice-to-have, puede agregarse en futuras fases
- Criterio: ¿Es un "sería lindo tener"? Si SÍ → Prioridad 4

ESTRUCTURA JSON OBLIGATORIA:
{
  "complejidad": "baja | media | alta",
  "modulos": [
    {
      "nombre": "Nombre del módulo",
      "cantidad": número (MÍNIMO 1. Úsalo si el usuario pide múltiples unidades. Ej: si pide instalar 2 RAM, cantidad=2. Para servicios generales usa 1),
      "horasEstimadas": número (HORAS TOTALES. Ej: si toma 2h instalar 1 RAM y la cantidad es 2, aquí pones 4),
      "prioridad": número (1=crítico, 2=esencial, 3=importante, 4=opcional),
      "nivelRiesgo": "bajo | medio | alto",
      "justificacion": "Texto breve y técnico",
      "costoFijo": número (opcional - incluye SOLO costos de MATERIALES TOTALES o licencias extraídos explícitamente del prompt. Ej: Costo RAM = 1000, cantidad 2 => costoFijo = 2000)
    }
  ],
  "horasTotales": número (suma de TODAS las horasEstimadas de todos los módulos),
  "riesgosClave": ["Riesgo identificado"],
  "suposiciones": ["Supuesto realizado"],
  "nivelConfianza": "alto | medio | bajo",
  "ajustePresupuesto": {
    "excedePresupuesto": boolean,
    "mensajeAjuste": "Mensaje claro y profesional",
    "modulosRecomendados": ["Nombre módulo 1"],
    "modulosExcluidos": ["Nombre módulo opcional"]
  }
}

INSTRUCCIONES CRÍTICAS PARA ajustePresupuesto:

**REGLA FUNDAMENTAL 1**: El presupuesto del cliente es SOLO INFORMATIVO. SIEMPRE debes estimar el proyecto COMPLETO con todos los módulos necesarios, independientemente del presupuesto.

**REGLA FUNDAMENTAL 2**: La estimación de horas de cada módulo debe ser OBJETIVA basada en los rangos. **NUNCA** rebajes las horas de los módulos individuales para intentar que el total quepa en el presupuesto.

1. SIEMPRE DEBES INCLUIR el objeto "ajustePresupuesto" en tu respuesta JSON.

2. Si NO recibes "horasMaximas":
   - excedePresupuesto = false
   - mensajeAjuste = "No se especificó límite de presupuesto."
   - modulosRecomendados = TODOS los módulos (copia la lista completa)
   - modulosExcluidos = []

3. Si recibes "horasMaximas" y horasTotales <= horasMaximas:
   - excedePresupuesto = false
   - mensajeAjuste = "¡Excelente noticia! El proyecto completo cabe dentro de tu presupuesto de [X] horas. Te sobrarían [Y] horas."
   - modulosRecomendados = TODOS los módulos
   - modulosExcluidos = []

4. Si recibes "horasMaximas" y horasTotales > horasMaximas:
   - excedePresupuesto = true
   - modulosRecomendados = TODOS los módulos (NO ELIMINES NADA)
   - modulosExcluidos = [] (SIEMPRE vacío)
   - mensajeAjuste = Sugerir PLAN DE FASES:
   
   "El proyecto completo requiere [X] horas, pero tu presupuesto es de [Y] horas.

   📦 **FASE 1 - MVP Funcional** ([Z] horas - dentro de presupuesto):
   - [Módulos prioridad 1 y 2 que quepan]
   - Entregable: [Funcionalidad mínima viable]
   
   📦 **FASE 2 - Funcionalidades Completas** ([W] horas adicionales):
   - [Módulos restantes]
   
   💰 **Inversión total estimada**: [X] horas
   📈 **Para completar**: [diferencia] horas adicionales"

REGLA DE ORO: **NUNCA** elimines módulos de la estimación principal por presupuesto.`;
}

// ============================================================
// HTTP HANDLER
// ============================================================

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { tipoProyecto, descripcion, funcionalidades, urgencia, horasMaximas, rubro, parametrosExtra } = await req.json();

    // Build rubro-aware system prompt
    const activeRubro = rubro || 'tecnologia';
    const systemPrompt = buildSystemPrompt(activeRubro);
    const rubroLabel = RUBRO_CONFIGS[activeRubro]?.label || activeRubro;

    const userPrompt = `Analiza el siguiente requerimiento y genera una estimación técnica USANDO LOS RANGOS DE TIEMPO BASE del sistema.

RUBRO / INDUSTRIA: ${rubroLabel}
TIPO DE PROYECTO: ${tipoProyecto}

DESCRIPCIÓN DEL REQUERIMIENTO:
${descripcion}

FUNCIONALIDADES SOLICITADAS:
${funcionalidades && funcionalidades.length > 0 ? funcionalidades.map((f: string, i: number) => (i + 1) + ". " + f).join('\n') : 'No especificadas'}

NIVEL DE URGENCIA: ${urgencia}

${horasMaximas ? `LÍMITE DE HORAS (PRESUPUESTO): ${horasMaximas} horas. Ajusta el alcance si es necesario.` : 'Sin límite de presupuesto especificado.'}

${parametrosExtra && Object.keys(parametrosExtra).length > 0 ?
        `PARÁMETROS ESPECÍFICOS PROPORCIONADOS POR EL USUARIO:
  ${JSON.stringify(parametrosExtra, null, 2)}
  INSTRUCCIÓN CRÍTICA PARA PARÁMETROS: Si la información provista arriba implica costos monetarios explícitos u operacionales (ej. "cantidad sesiones: 4" y "costo sesión: 50000" => Total 200000; o "costo repuesto: 350000"), DEBES crear un módulo específico o asignarlo al módulo correspondiente usando EXCLUSIVAMENTE el campo \`costoFijo\` en el JSON con el valor monetario total resultante. NO sumes este dinero falso como horas.`
        : ''}

IMPORTANTE: Usa los RANGOS DE TIEMPO BASE de tu rubro (${rubroLabel}) para estimar cada módulo. Adapta los nombres de los módulos a la terminología propia de la industria.

Genera la estimación en formato JSON según la estructura requerida.`;

    console.log(`[cotizador] Rubro: ${activeRubro}, Tipo: ${tipoProyecto}`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: userPrompt }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    const data = await response.json();
    console.log('Gemini API Response Status:', response.status);

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      throw new Error(`Gemini API Error: ${JSON.stringify(data)}`);
    }

    let textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      throw new Error('No content in Gemini response');
    }

    // Clean up markdown code blocks if present
    textResponse = textResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    return new Response(textResponse, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});