import { supabase } from "@/integrations/supabase/client";

export interface ModuloEstimacion {
  nombre: string;
  descripcion?: string;
  horasEstimadas: number;
  nivelRiesgo: "bajo" | "medio" | "alto";
  justificacion: string;
  prioridad?: number; // 1: Crítico, 2: Esencial, 3: Importante, 4: Opcional
  esencial?: boolean;
  costoFijo?: number;
  cantidad?: number;
}

export interface EstimacionResult {
  complejidad: "baja" | "media" | "alta";
  horasTotales: number;
  rangoSemanas: { min: number; max: number };
  nivelConfianza: "bajo" | "medio" | "alto";
  modulos: ModuloEstimacion[];
  riesgosClave: string[];
  suposiciones: string[];
  ajustePresupuesto?: {
    excedePresupuesto: boolean;
    modulosRecomendados: string[];
    modulosExcluidos: string[];
    horasAjustadas: number;
    mensajeAjuste: string;
  };
}

export interface EstimarProyectoInput {
  tipoProyecto: string;
  descripcion: string;
  funcionalidades?: string[];
  urgencia?: string;
  horasMaximas?: number;
  costoPorHora?: number;
  presupuestoCliente?: number;
  rubro?: string;
  parametrosExtra?: Record<string, any>;
}

// ============================================================================
// UTILIDADES DE NORMALIZACIÓN Y TEXTO
// ============================================================================

function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function deterministicVariance(seedText: string, minOffset = -1, maxOffset = 2): number {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash * 31 + seedText.charCodeAt(i)) | 0;
  }
  const range = maxOffset - minOffset + 1;
  return minOffset + (Math.abs(hash) % range);
}

// ============================================================================
// BASE DE CONOCIMIENTO MULTI-RUBRO (85+ PATRONES ESPECIALIZADOS)
// ============================================================================

interface DomainPattern {
  id: string;
  rubros: string[]; // ["*"] o rubros específicos
  keywords: string[];
  nombre: string;
  horasBase: number;
  prioridad: 1 | 2 | 3 | 4;
  riesgo: "bajo" | "medio" | "alto";
  justificacion: string;
  riesgoEspecifico?: string;
  suposicionEspecifica?: string;
  precioCLP: number;
  precioUSD: number;
}

const DOMAIN_PATTERNS: DomainPattern[] = [
  // ---------------- TECNOLOGÍA / SOFTWARE ----------------
  {
    id: "tech_auth_roles",
    rubros: ["tecnologia", "freelance", "otro"],
    keywords: ["login", "autenticacion", "registro", "usuarios", "roles", "permisos", "oauth", "jwt", "sesiones", "acceso", "perfil"],
    nombre: "Autenticación, Gestión de Usuarios & Control de Roles (RBAC)",
    horasBase: 9,
    prioridad: 1,
    riesgo: "bajo",
    justificacion: "Implementación de flujo seguro de inicio de sesión, recuperación de credenciales, protección de rutas y matriz de permisos por rol. Incluye políticas de seguridad y validación de tokens.",
    riesgoEspecifico: "Definición tardía de la jerarquía de roles y permisos granulares por tipo de usuario.",
    suposicionEspecifica: "Se utilizará autenticación estándar mediante correo/contraseña y proveedores OAuth preconfigurados.",
    precioCLP: 220000,
    precioUSD: 240,
  },
  {
    id: "tech_pagos",
    rubros: ["tecnologia", "marketing", "educacion", "salud", "eventos", "freelance"],
    keywords: ["pago", "pagos", "pasarela", "webpay", "transbank", "mercadopago", "stripe", "flow", "khipu", "checkout", "cobro", "suscripcion"],
    nombre: "Integración de Pasarela de Pagos & Conciliación Transaccional",
    horasBase: 13,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Integración con API de pasarela de pago (Webpay Plus / MercadoPago / Stripe), manejo de webhooks de confirmación y control de estados de pago. Contempla pruebas en ambiente sandbox y paso a producción.",
    riesgoEspecifico: "Tiempos de certificación comercial o entrega de llaves productivas por parte del operador de pagos (Transbank / MercadoPago).",
    suposicionEspecifica: "El cliente gestionará directamente su afiliación comercial y credenciales del proveedor de pagos.",
    precioCLP: 320000,
    precioUSD: 350,
  },
  {
    id: "tech_ecommerce_carrito",
    rubros: ["tecnologia", "marketing", "diseno", "freelance"],
    keywords: ["tienda", "ecommerce", "e-commerce", "carrito", "catalogo", "productos", "compra", "ordenes", "pedidos", "despacho", "envio"],
    nombre: "Motor de Catálogo, Carrito de Compras & Gestión de Pedidos",
    horasBase: 16,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Desarrollo de catálogo filtrable con variantes de producto, persistencia de carrito de compras, cálculo de envíos y flujo de confirmación de orden. Diseñado para alta conversión móvil y escritorio.",
    riesgoEspecifico: "Complejidad en reglas de cálculo de despacho por zona geográfica o combinaciones de variantes de stock.",
    suposicionEspecifica: "El cliente entregará la planilla maestra de productos, precios y fotografías optimizadas para carga inicial.",
    precioCLP: 390000,
    precioUSD: 420,
  },
  {
    id: "tech_admin_dashboard",
    rubros: ["tecnologia", "consultoria", "freelance", "salud", "educacion"],
    keywords: ["admin", "administrador", "administracion", "panel", "backoffice", "mantenedor", "crud", "gestion interna"],
    nombre: "Panel Administrativo (Backoffice) & Mantenedores de Gestión",
    horasBase: 14,
    prioridad: 2,
    riesgo: "bajo",
    justificacion: "Construcción de panel de control interno con tablas dinámicas, filtros avanzados, búsqueda rápida y operaciones CRUD completas. Permite administrar toda la operación sin depender de soporte técnico.",
    precioCLP: 340000,
    precioUSD: 360,
  },
  {
    id: "tech_bi_reportes",
    rubros: ["tecnologia", "consultoria", "marketing", "salud", "educacion"],
    keywords: ["dashboard", "reporte", "reportes", "metricas", "kpi", "estadisticas", "graficos", "analitica", "bi", "exportar", "excel", "pdf"],
    nombre: "Dashboard Analítico de KPIs & Exportación de Reportes",
    horasBase: 11,
    prioridad: 2,
    riesgo: "bajo",
    justificacion: "Visualización ejecutiva de indicadores en tiempo real mediante gráficos interactivos, filtros por rango de fechas y exportación descargable en formatos Excel/PDF.",
    precioCLP: 275000,
    precioUSD: 290,
  },
  {
    id: "tech_whatsapp_bot",
    rubros: ["tecnologia", "marketing", "salud", "educacion", "freelance"],
    keywords: ["whatsapp", "chatbot", "bot", "evolution", "conversacional", "mensajeria", "agente ia", "respuestas automaticas"],
    nombre: "Automatización Conversacional & Integración WhatsApp / Chatbot",
    horasBase: 15,
    prioridad: 2,
    riesgo: "medio",
    justificacion: "Configuración de canal de atención automatizada por WhatsApp, árbol de flujos conversacionales, captura de leads y derivación a ejecutivo humano. Incluye conexión vía webhook y persistencia de historial.",
    riesgoEspecifico: "Políticas de límites de mensajería y verificación de número empresarial en Meta Business / API de WhatsApp.",
    precioCLP: 360000,
    precioUSD: 390,
  },
  {
    id: "tech_n8n_automation",
    rubros: ["tecnologia", "marketing", "consultoria", "freelance"],
    keywords: ["n8n", "automatizacion", "automatizar", "make", "zapier", "flujo", "workflow", "webhook", "sincronizacion"],
    nombre: "Orquestación de Flujos Automatizados & Webhooks (n8n / API)",
    horasBase: 12,
    prioridad: 2,
    riesgo: "medio",
    justificacion: "Diseño e implementación de flujos automatizados para conectar eventos del sistema con servicios externos, manejo de reintentos y registro de logs de ejecución.",
    precioCLP: 290000,
    precioUSD: 310,
  },
  {
    id: "tech_ia_llm",
    rubros: ["tecnologia", "consultoria", "educacion", "marketing"],
    keywords: ["inteligencia artificial", "openai", "gpt", "gemini", "claude", "llm", "rag", "embeddings", "asistente virtual", "prediccion"],
    nombre: "Motor de Inteligencia Artificial Generativa & Procesamiento Contextual",
    horasBase: 17,
    prioridad: 2,
    riesgo: "medio",
    justificacion: "Integración de modelos de lenguaje (LLM) con ingeniería de prompts estructurada, control de alucinaciones, validación de salidas JSON y optimización de consumo de tokens.",
    riesgoEspecifico: "Variabilidad en latencia y costos operativos de consumo de tokens según el volumen de consultas en producción.",
    precioCLP: 420000,
    precioUSD: 450,
  },
  {
    id: "tech_mobile_pwa",
    rubros: ["tecnologia", "salud", "eventos", "educacion", "freelance"],
    keywords: ["app", "movil", "mobile", "android", "ios", "pwa", "celular", "tablet", "push", "geolocalizacion", "qr"],
    nombre: "Experiencia Móvil Optimizada / Aplicación Progresiva (PWA / Mobile)",
    horasBase: 16,
    prioridad: 2,
    riesgo: "medio",
    justificacion: "Adaptación nativa/progresiva para dispositivos iOS y Android con soporte instalable, optimización táctil, carga ultrarrápida y compatibilidad con cámara/QR o notificaciones.",
    precioCLP: 390000,
    precioUSD: 420,
  },
  {
    id: "tech_sii_facturacion",
    rubros: ["tecnologia", "consultoria", "construccion", "salud"],
    keywords: ["factura", "facturacion", "boleta", "sii", "dte", "tributario", "impuestos", "cotizacion pdf"],
    nombre: "Módulo de Documentos Tributarios / Emisión de Comprobantes & PDF",
    horasBase: 14,
    prioridad: 2,
    riesgo: "alto",
    justificacion: "Generación automatizada de documentos comerciales/tributarios en PDF, cálculo desglosado de Neto/IVA y conector de integración para emisión electrónica.",
    riesgoEspecifico: "Homologación de formatos y timbraje electrónico con el proveedor de facturación o SII.",
    precioCLP: 350000,
    precioUSD: 380,
  },
  {
    id: "tech_inventario_stock",
    rubros: ["tecnologia", "construccion", "salud", "eventos"],
    keywords: ["inventario", "stock", "bodega", "insumos", "sku", "kardex", "mermas", "proveedores", "lotes"],
    nombre: "Sistema de Control de Inventario, Bodega & Alertas de Stock Crítico",
    horasBase: 13,
    prioridad: 2,
    riesgo: "bajo",
    justificacion: "Gestión de entradas y salidas de inventario por SKU, trazabilidad de movimientos, alertas automáticas de stock mínimo y valorización de existencias.",
    precioCLP: 310000,
    precioUSD: 330,
  },
  {
    id: "tech_agenda_reservas",
    rubros: ["tecnologia", "salud", "educacion", "consultoria", "eventos", "freelance"],
    keywords: ["agenda", "agendamiento", "reservas", "citas", "calendario", "horarios", "turnos", "disponibilidad", "booking"],
    nombre: "Motor de Agendamiento Inteligente, Calendario & Recordatorios",
    horasBase: 12,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Gestión de bloques horarios disponibles, prevención de solapamiento de citas, confirmación automática por correo/WhatsApp y reprogramación autónoma.",
    precioCLP: 295000,
    precioUSD: 315,
  },
  {
    id: "tech_integracion_erp_crm",
    rubros: ["tecnologia", "consultoria", "marketing"],
    keywords: ["api", "erp", "crm", "hubspot", "salesforce", "sap", "odoo", "integracion", "conector", "sincronizar"],
    nombre: "Capa de Integración API & Sincronización con Sistemas Externos (CRM/ERP)",
    horasBase: 13,
    prioridad: 2,
    riesgo: "alto",
    justificacion: "Desarrollo de conectores REST/GraphQL seguros, mapeo de estructuras de datos, control de errores y sincronización bidireccional con plataformas de terceros.",
    riesgoEspecifico: "Disponibilidad de documentación técnica actualizada y límites de tasa (rate-limits) de la API externa.",
    precioCLP: 330000,
    precioUSD: 350,
  },
  {
    id: "tech_notificaciones_email",
    rubros: ["tecnologia", "marketing", "salud", "educacion", "eventos"],
    keywords: ["notificaciones", "alertas", "correo", "email", "emails", "transaccional", "recordatorio", "avisos", "smtp", "resend"],
    nombre: "Sistema de Notificaciones Multicanal & Correos Transaccionales",
    horasBase: 7,
    prioridad: 3,
    riesgo: "bajo",
    justificacion: "Configuración de plantillas HTML responsivas y disparadores automáticos de avisos por eventos clave (confirmaciones, alertas de estado y resúmenes).",
    precioCLP: 175000,
    precioUSD: 190,
  },
  {
    id: "tech_migracion_bd",
    rubros: ["tecnologia", "consultoria"],
    keywords: ["base de datos", "migracion", "sql", "supabase", "postgresql", "firebase", "importacion", "historico", "respaldo"],
    nombre: "Modelado de Base de Datos Relacional, Seguridad RLS & Migración",
    horasBase: 10,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Diseño de esquema normalizado, índices de alto rendimiento, políticas de seguridad a nivel de fila (RLS) y scripts de saneamiento/carga de datos iniciales.",
    precioCLP: 250000,
    precioUSD: 270,
  },
  {
    id: "tech_landing_seo",
    rubros: ["tecnologia", "marketing", "diseno", "freelance"],
    keywords: ["landing", "pagina web", "sitio web", "corporativo", "onepage", "formulario de contacto", "velocidad", "core web vitals"],
    nombre: "Desarrollo Frontend de Alto Impacto, Secciones Comerciales & SEO Técnico",
    horasBase: 11,
    prioridad: 1,
    riesgo: "bajo",
    justificacion: "Maquetación moderna responsive, optimización de Core Web Vitals, metadatos OpenGraph/SEO estructurados y formularios de captación de prospectos.",
    precioCLP: 270000,
    precioUSD: 290,
  },

  // ---------------- CONSTRUCCIÓN / OBRA CIVIL ----------------
  {
    id: "const_demolicion_preparacion",
    rubros: ["construccion", "otro"],
    keywords: ["demolicion", "desarme", "retiro", "escombros", "limpieza", "excavacion", "movimiento de tierra", "nivelacion"],
    nombre: "Demolición Controlada, Preparación de Terreno & Retiro de Escombros",
    horasBase: 22,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Desarme selectivo de estructuras existentes, nivelación de superficie, acopio seguro y transporte de escombros a botadero autorizado.",
    riesgoEspecifico: "Hallazgo de vicios ocultos, tuberías no catastradas o refuerzos estructurales al demoler.",
    precioCLP: 480000,
    precioUSD: 510,
  },
  {
    id: "const_radier_fundaciones",
    rubros: ["construccion"],
    keywords: ["radier", "fundacion", "fundaciones", "cimiento", "cimientos", "hormigon", "concreto", "losa", "enfierradura", "molde"],
    nombre: "Ejecución de Fundaciones, Enfierradura & Hormigonado de Radier",
    horasBase: 36,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Excavación de sobrecimientos, cama de ripio compactada, barrera de humedad, malla Acma y vaciado de hormigón vibrado con afinado superficial.",
    riesgoEspecifico: "Condiciones climáticas adversas o tiempos de fraguado que extiendan el inicio de tabiquería.",
    precioCLP: 850000,
    precioUSD: 900,
  },
  {
    id: "const_tabiqueria_muros",
    rubros: ["construccion"],
    keywords: ["tabique", "tabiqueria", "muro", "muros", "metalcon", "volcanita", "yeso carton", "albanileria", "ladrillo", "aislacion", "estructura"],
    nombre: "Estructura de Tabiquería, Aislación Termoacústica & Revestimiento",
    horasBase: 32,
    prioridad: 1,
    riesgo: "bajo",
    justificacion: "Montaje de perfilería estructural (Metalcon / madera), incorporación de lana mineral/aislación y emplacado en yeso-cartón o fibrocemento según zona húmeda/seca.",
    precioCLP: 720000,
    precioUSD: 760,
  },
  {
    id: "const_electrica",
    rubros: ["construccion", "energia"],
    keywords: ["electrica", "electricidad", "enchufes", "luminaria", "iluminacion", "tablero", "cableado", "canalizacion", "sec", "empalme", "luces", "led"],
    nombre: "Instalación Eléctrica Certificada (Norma SEC), Tablero & Luminarias",
    horasBase: 24,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Canalización embutida/a la vista, cableado libre de halógenos, armado de tablero con protecciones diferenciales/automáticos e instalación de puntos de enchufe e iluminación LED.",
    riesgoEspecifico: "Capacidad límite del empalme eléctrico existente frente a la nueva carga proyectada.",
    precioCLP: 560000,
    precioUSD: 590,
  },
  {
    id: "const_gasfiteria",
    rubros: ["construccion"],
    keywords: ["gasfiteria", "agua potable", "alcantarillado", "sanitario", "sanitarios", "bano", "banos", "ducha", "wc", "lavamanos", "lavaplatos", "caneria", "ppr", "cobre", "desague"],
    nombre: "Red de Gasfitería (Agua Fría/Caliente), Alcantarillado & Artefactos",
    horasBase: 26,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Tendido de tuberías PPR/cobre, red de descarga en PVC sanitario, pruebas de hermeticidad/presión e instalación de griferías y artefactos sanitarios.",
    riesgoEspecifico: "Estado de las matrices o pendientes de descarga existentes en la edificación.",
    precioCLP: 590000,
    precioUSD: 620,
  },
  {
    id: "const_pisos_ceramica",
    rubros: ["construccion"],
    keywords: ["piso", "pisos", "porcelanato", "ceramica", "piso flotante", "vinilico", "spc", "guardapolvos", "fragüe", "nivelador"],
    nombre: "Nivelación de Superficie & Instalación de Revestimientos de Piso / Cerámica",
    horasBase: 24,
    prioridad: 2,
    riesgo: "bajo",
    justificacion: "Preparación con puente adherente o autonivelante, colocación de porcelanato/cerámica o piso SPC/flotante con cortes de precisión, fraguado impermeable y guardapolvos.",
    precioCLP: 520000,
    precioUSD: 550,
  },
  {
    id: "const_pintura_empaste",
    rubros: ["construccion"],
    keywords: ["pintura", "empaste", "lijado", "esmalte", "latex", "fachada", "muros interiores", "cielo", "sellado"],
    nombre: "Preparación de Superficies, Empaste Profesional & Pintura de Terminación",
    horasBase: 19,
    prioridad: 2,
    riesgo: "bajo",
    justificacion: "Tratamiento de juntas con cinta, aplicación de pasta muro, lijado fino, sellador alcalino y dos manos de esmalte al agua / látex lavable de alta durabilidad.",
    precioCLP: 410000,
    precioUSD: 435,
  },
  {
    id: "const_techumbre",
    rubros: ["construccion"],
    keywords: ["techo", "techumbre", "cubierta", "zinc", "teja", "policarbonato", "canaleta", "hojalateria", "cerchas", "impermeabilizacion", "goteras"],
    nombre: "Estructura de Techumbre, Cubierta Impermeable & Hojalatería",
    horasBase: 28,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Montaje de cerchas/costaneras, membrana hidrófuga, instalación de planchas de cubierta, caballetes, forros y sistema de evacuación de aguas lluvias (canaletas y bajadas).",
    precioCLP: 640000,
    precioUSD: 680,
  },
  {
    id: "const_cocina_muebles",
    rubros: ["construccion", "diseno"],
    keywords: ["cocina", "muebles de cocina", "cubierta cuarzo", "melamina", "closet", "closets", "carpinteria", "puertas", "quincalleria"],
    nombre: "Fabricación e Instalación de Mobiliario a Medida & Carpintería Fina",
    horasBase: 27,
    prioridad: 2,
    riesgo: "bajo",
    justificacion: "Armado y montaje de mobiliario en melamina hidrofuga/MDF, bisagras cierre suave, rieles telescópicos, ajuste de puertas y colocación de cubiertas.",
    precioCLP: 620000,
    precioUSD: 650,
  },
  {
    id: "const_ventanas",
    rubros: ["construccion"],
    keywords: ["ventana", "ventanas", "termopanel", "aluminio", "pvc", "ventanal", "vidrio", "cierre terraza"],
    nombre: "Suministro y Montaje de Ventanas / Termopanel & Sellado Perimetral",
    horasBase: 16,
    prioridad: 2,
    riesgo: "bajo",
    justificacion: "Instalación a plomo y nivel de marcos de PVC/aluminio con cristal termopanel, fijación estructural y sellado con espuma de poliuretano y silicona neutra.",
    precioCLP: 380000,
    precioUSD: 400,
  },

  // ---------------- MARKETING / DISEÑO / AUDIOVISUAL ----------------
  {
    id: "mkt_branding_identidad",
    rubros: ["diseno", "marketing", "consultoria", "freelance"],
    keywords: ["branding", "marca", "logo", "logotipo", "identidad visual", "manual de marca", "paleta", "tipografia", "rebranding", "papeleria"],
    nombre: "Diseño de Identidad Corporativa, Logotipo & Brandbook Oficial",
    horasBase: 15,
    prioridad: 1,
    riesgo: "bajo",
    justificacion: "Conceptualización creativa, diseño de logotipo principal y versiones secundarias, paleta cromática, sistema tipográfico y manual de normas gráficas con vectores editables.",
    precioCLP: 360000,
    precioUSD: 380,
  },
  {
    id: "mkt_ux_ui_figma",
    rubros: ["diseno", "tecnologia", "freelance"],
    keywords: ["ux", "ui", "figma", "prototipo", "wireframe", "wireframes", "interfaz", "pantallas", "design system", "usabilidad"],
    nombre: "Arquitectura UX, Wireframing & Prototipo Interactivo en Figma (UI)",
    horasBase: 14,
    prioridad: 1,
    riesgo: "bajo",
    justificacion: "Diseño de flujos de usuario, librería de componentes reutilizables (Design System) y pantallas en alta fidelidad listas para desarrollo.",
    precioCLP: 340000,
    precioUSD: 360,
  },
  {
    id: "mkt_ads_campanas",
    rubros: ["marketing", "freelance"],
    keywords: ["meta ads", "google ads", "tiktok ads", "campana", "campanas", "publicidad", "pauta", "trafico", "conversiones", "roas", "pixel", "remarketing", "sem"],
    nombre: "Estrategia, Configuración & Optimización de Campañas de Pago (Meta / Google Ads)",
    horasBase: 13,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Instalación de píxeles y API de conversiones, segmentación de audiencias, estructuración de conjuntos de anuncios, redacción de copies y optimización de CPA/ROAS.",
    riesgoEspecifico: "El presupuesto de pauta publicitaria pagado directamente a Meta/Google es independiente de los honorarios de gestión.",
    precioCLP: 310000,
    precioUSD: 330,
  },
  {
    id: "mkt_rrss_contenido",
    rubros: ["marketing", "diseno", "audiovisual", "freelance"],
    keywords: ["redes sociales", "instagram", "linkedin", "tiktok", "grilla", "contenido", "community", "posts", "carrusel", "historias", "reels"],
    nombre: "Planificación Editorial, Diseño de Grilla & Producción de Contenidos RRSS",
    horasBase: 14,
    prioridad: 2,
    riesgo: "bajo",
    justificacion: "Definición de pilares de contenido, calendario editorial mensual, diseño gráfico de piezas estáticas/carruseles y redacción de copywriting persuasivo.",
    precioCLP: 320000,
    precioUSD: 340,
  },
  {
    id: "mkt_seo_posicionamiento",
    rubros: ["marketing", "tecnologia", "freelance"],
    keywords: ["seo", "posicionamiento", "keywords", "palabras clave", "organico", "search console", "backlinks", "blog", "articulos"],
    nombre: "Auditoría SEO Técnica, Investigación de Keywords & Optimización On-Page",
    horasBase: 11,
    prioridad: 2,
    riesgo: "bajo",
    justificacion: "Análisis de intención de búsqueda, optimización de títulos H1-H3, meta-descripciones, enlazado interno, velocidad de carga e indexación en Google Search Console.",
    precioCLP: 265000,
    precioUSD: 280,
  },
  {
    id: "av_rodaje_produccion",
    rubros: ["audiovisual", "marketing", "eventos", "freelance"],
    keywords: ["rodaje", "grabacion", "filmacion", "camara", "camaras", "iluminacion", "sonido directo", "locacion", "guion", "storyboard", "produccion audiovisual", "spot"],
    nombre: "Preproducción, Guion Técnico & Jornada de Rodaje Audiovisual en Terreno",
    horasBase: 16,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Desarrollo de escaleta/guion, scouting técnico y captura en terreno con cámaras de cine digital/4K, iluminación profesional y microfonía inalámbrica.",
    riesgoEspecifico: "Factores climáticos o permisos de filmación en locaciones que requieran reprogramar la jornada de rodaje.",
    precioCLP: 420000,
    precioUSD: 440,
  },
  {
    id: "av_dron",
    rubros: ["audiovisual", "construccion", "eventos", "marketing"],
    keywords: ["dron", "drone", "aerea", "aereas", "tomas aereas", "sobrevuelo"],
    nombre: "Captura de Tomas Aéreas en 4K con Dron Estabilizado",
    horasBase: 6,
    prioridad: 3,
    riesgo: "medio",
    justificacion: "Operación de vuelo con dron profesional para planos generales y recorridos dinámicos en alta resolución, cumpliendo normativa de seguridad aérea.",
    precioCLP: 185000,
    precioUSD: 195,
  },
  {
    id: "av_postproduccion",
    rubros: ["audiovisual", "marketing", "diseno", "freelance"],
    keywords: ["edicion", "postproduccion", "montaje", "colorizacion", "color", "motion graphics", "subtitulos", "animacion", "mezcla de audio", "video"],
    nombre: "Postproducción, Montaje Dinámico, Colorización & Motion Graphics",
    horasBase: 15,
    prioridad: 1,
    riesgo: "bajo",
    justificacion: "Edición narrativa, corrección de color (etalonaje), diseño sonoro con música licenciada, gráficas animadas y renderizado en formatos horizontales y verticales.",
    precioCLP: 360000,
    precioUSD: 380,
  },
  {
    id: "av_fotografia",
    rubros: ["audiovisual", "diseno", "marketing", "eventos", "freelance"],
    keywords: ["fotografia", "fotos", "sesion fotografica", "retrato", "producto", "retoque", "lightroom", "catalogo fotografico"],
    nombre: "Sesión Fotográfica Profesional, Iluminación de Estudio & Retoque Digital",
    horasBase: 9,
    prioridad: 2,
    riesgo: "bajo",
    justificacion: "Captura fotográfica en alta resolución con esquema de iluminación dedicado, selección de mejores tomas y revelado/retoque digital de color y texturas.",
    precioCLP: 240000,
    precioUSD: 255,
  },

  // ---------------- ENERGÍA / CLIMATIZACIÓN (HVAC & SOLAR) ----------------
  {
    id: "ene_solar_fotovoltaico",
    rubros: ["energia", "construccion"],
    keywords: ["solar", "solares", "fotovoltaico", "fotovoltaica", "paneles", "inversor", "baterias", "on-grid", "off-grid", "netbilling", "te4"],
    nombre: "Ingeniería, Montaje de Paneles Solares Fotovoltaicos & Configuración de Inversor",
    horasBase: 28,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Instalación de estructuras coplanares/inclinadas en cubierta, montaje de módulos solares, tendido DC/AC, conexión de inversor/baterías y pruebas de generación.",
    riesgoEspecifico: "Factibilidad estructural de la techumbre y plazos de tramitación de conexión (Netbilling / TE4) ante la distribuidora.",
    precioCLP: 680000,
    precioUSD: 720,
  },
  {
    id: "ene_climatizacion_hvac",
    rubros: ["energia", "construccion"],
    keywords: ["aire acondicionado", "climatizacion", "split", "multisplit", "inverter", "hvac", "vrf", "ductos", "calefaccion", "bomba de calor", "btu", "refrigerante"],
    nombre: "Instalación de Sistema de Climatización / Aire Acondicionado Inverter & Vacío",
    horasBase: 14,
    prioridad: 1,
    riesgo: "bajo",
    justificacion: "Montaje de unidad interior y condensadora exterior, interconexión frigorífica en cobre aislado, barrido con nitrógeno, vacío profundo y puesta en marcha.",
    precioCLP: 340000,
    precioUSD: 360,
  },
  {
    id: "ene_mantencion_preventiva",
    rubros: ["energia", "construccion", "salud"],
    keywords: ["mantencion", "mantenimiento", "preventivo", "correctivo", "limpieza filtros", "sanitizacion", "recarga", "diagnostico de fallas"],
    nombre: "Mantenimiento Preventivo/Correctivo, Sanitización & Protocolo de Pruebas",
    horasBase: 8,
    prioridad: 2,
    riesgo: "bajo",
    justificacion: "Inspección instrumental de parámetros eléctricos y presiones, limpieza química de serpentines/filtros, revisión de drenajes y entrega de informe técnico.",
    precioCLP: 195000,
    precioUSD: 210,
  },

  // ---------------- CONSULTORÍA / EDUCACIÓN / SALUD / EVENTOS ----------------
  {
    id: "cons_auditoria_procesos",
    rubros: ["consultoria", "tecnologia", "salud", "educacion"],
    keywords: ["auditoria", "diagnostico", "levantamiento", "procesos", "bpmn", "normativa", "iso", "compliance", "brechas", "matriz de riesgo"],
    nombre: "Diagnóstico Organizacional, Levantamiento de Procesos & Análisis de Brechas",
    horasBase: 13,
    prioridad: 1,
    riesgo: "bajo",
    justificacion: "Entrevistas con líderes de área, mapeo de flujos operativos actuales (AS-IS), identificación de cuellos de botella y matriz priorizada de mejoras (TO-BE).",
    precioCLP: 330000,
    precioUSD: 350,
  },
  {
    id: "cons_financiero_plan",
    rubros: ["consultoria"],
    keywords: ["financiero", "flujo de caja", "presupuesto", "rentabilidad", "costos", "plan de negocios", "evaluacion de proyecto", "van", "tir", "estrategia"],
    nombre: "Modelamiento Financiero, Evaluación de Rentabilidad & Plan Estratégico",
    horasBase: 16,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Construcción de proyecciones de ingresos/costos, análisis de sensibilidad por escenarios, cálculo de indicadores financieros y hoja de ruta ejecutiva.",
    precioCLP: 410000,
    precioUSD: 430,
  },
  {
    id: "edu_lms_cursos",
    rubros: ["educacion", "consultoria", "tecnologia"],
    keywords: ["curso", "cursos", "capacitacion", "talleres", "taller", "e-learning", "elearning", "moodle", "lms", "aula virtual", "diplomado", "clases", "relatoria"],
    nombre: "Diseño Instruccional, Estructuración de Módulos & Ejecución de Capacitación",
    horasBase: 15,
    prioridad: 1,
    riesgo: "bajo",
    justificacion: "Definición de objetivos de aprendizaje, elaboración de material didáctico, guías prácticas, evaluaciones de conocimientos y sesiones de relatoría.",
    precioCLP: 360000,
    precioUSD: 380,
  },
  {
    id: "sal_ficha_clinica",
    rubros: ["salud", "tecnologia"],
    keywords: ["ficha clinica", "pacientes", "historial medico", "receta", "telemedicina", "consulta medica", "odontologia", "box", "clinica", "hl7", "fonasa", "isapre"],
    nombre: "Gestión de Ficha Clínica Digital, Trazabilidad de Pacientes & Protocolos",
    horasBase: 18,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Implementación de registro clínico estructurado con resguardo de privacidad de datos sensibles, evolución de atenciones, anamnesis y emisión de órdenes/recetas.",
    riesgoEspecifico: "Cumplimiento estricto de normativa de confidencialidad y derechos del paciente en el manejo de registros.",
    precioCLP: 450000,
    precioUSD: 475,
  },
  {
    id: "eve_produccion_banqueteria",
    rubros: ["eventos", "audiovisual", "marketing"],
    keywords: ["evento", "congreso", "seminario", "matrimonio", "corporativo", "banqueteria", "catering", "coctel", "salon", "escenario", "amplificacion", "pantallas led", "acreditacion"],
    nombre: "Producción Integral del Evento, Coordinación Técnica & Montaje en Venue",
    horasBase: 20,
    prioridad: 1,
    riesgo: "medio",
    justificacion: "Diseño de layout y minuto a minuto (run-of-show), coordinación de proveedores técnicos (audio, iluminación, pantallas), acreditación de asistentes y supervisión en vivo.",
    riesgoEspecifico: "Restricciones de horarios de montaje/desmontaje en el recinto (venue) y variación en el número confirmado de asistentes.",
    precioCLP: 490000,
    precioUSD: 520,
  },
];

// ============================================================================
// PLANTILLAS BASE POR RUBRO (ARQUITECTURA INICIAL + CORE + CIERRE)
// ============================================================================

interface RubroBaseTemplate {
  apertura: {
    nombre: (tipo: string) => string;
    horas: number;
    justificacion: (tipo: string) => string;
  };
  coreDefault: {
    nombre: (tipo: string) => string;
    horas: number;
    justificacion: (tipo: string) => string;
  };
  complementoDefault: {
    nombre: (tipo: string) => string;
    horas: number;
    justificacion: (tipo: string) => string;
  };
  cierre: {
    nombre: (tipo: string) => string;
    horas: number;
    justificacion: (tipo: string) => string;
  };
  riesgosBase: string[];
  suposicionesBase: string[];
}

const RUBRO_TEMPLATES: Record<string, RubroBaseTemplate> = {
  tecnologia: {
    apertura: {
      nombre: (t) => `Arquitectura de Software, Modelado de Datos & Diseño UI/UX (${t})`,
      horas: 9,
      justificacion: (t) =>
        `Definición de arquitectura técnica, estructura de base de datos, prototipado de interfaz responsive y configuración del entorno para ${t}. Asegura una base escalable y mantenible desde el primer sprint.`,
    },
    coreDefault: {
      nombre: (t) => `Desarrollo de Núcleo Funcional & Lógica de Negocio — ${t}`,
      horas: 17,
      justificacion: (t) =>
        `Construcción de los módulos principales de ${t}, integrando vistas interactivas, validaciones de seguridad, reglas de negocio y persistencia de datos en tiempo real.`,
    },
    complementoDefault: {
      nombre: () => `Panel de Gestión, Configuración & Optimización de Rendimiento`,
      horas: 8,
      justificacion: () =>
        `Implementación de herramientas de administración, control de parámetros operativos y optimización de tiempos de carga tanto en dispositivos móviles como en escritorio.`,
    },
    cierre: {
      nombre: () => `Pruebas Integrales (QA), Hardening de Seguridad & Despliegue a Producción`,
      horas: 6,
      justificacion: () =>
        `Ejecución de pruebas funcionales end-to-end, revisión de vulnerabilidades, configuración de dominio/SSL y puesta en marcha asistida en ambiente productivo.`,
    },
    riesgosBase: [
      "Incorporación de requerimientos funcionales adicionales fuera del alcance base durante las revisiones de sprint.",
      "Demora en la entrega de credenciales, dominios, accesos a servidores o cuentas de terceros por parte del cliente.",
      "Cambios en las reglas de negocio una vez aprobado el modelo de datos e interfaz principal.",
    ],
    suposicionesBase: [
      "El cliente designará una contraparte técnica/comercial con disponibilidad para validar entregables semanalmente.",
      "Los logotipos, textos definitivos y activos gráficos base serán proporcionados al inicio del proyecto.",
      "Se contemplan hasta 2 rondas de ajustes e iteración sobre las vistas y flujos definidos en el alcance.",
    ],
  },
  construccion: {
    apertura: {
      nombre: (t) => `Levantamiento Técnico en Terreno, Trazado & Preparación de Obra (${t})`,
      horas: 14,
      justificacion: (t) =>
        `Inspección técnica inicial, cubicación definitiva de materiales, trazado de niveles, protección de áreas adyacentes y logística de ingreso para ${t}.`,
    },
    coreDefault: {
      nombre: (t) => `Ejecución de Obra Principal & Partidas Estructurales — ${t}`,
      horas: 34,
      justificacion: (t) =>
        `Mano de obra calificada para la ejecución de las partidas centrales de ${t}, cumpliendo estándares constructivos, plomos, niveles y normativa vigente.`,
    },
    complementoDefault: {
      nombre: () => `Instalaciones Técnicas, Ajustes de Obra & Sellados`,
      horas: 16,
      justificacion: () =>
        `Adecuación de canalizaciones, puntos de servicio, fijaciones estructurales y sellado hermético de uniones constructivas.`,
    },
    cierre: {
      nombre: () => `Terminaciones Finas, Aseo Industrial de Obra & Recepción Conforme`,
      horas: 11,
      justificacion: () =>
        `Remates estéticos de terminación, pruebas operativas de todas las instalaciones, retiro final de residuos y firma de acta de entrega conforme.`,
    },
    riesgosBase: [
      "Detección de vicios ocultos, humedad preexistente o instalaciones fuera de norma al intervenir muros/pisos.",
      "Variación en tiempos de fraguado/secado por condiciones de humedad o temperatura ambiental.",
      "Restricciones horarias de ruidos molestos o acceso de materiales impuestas por la administración o edificio.",
    ],
    suposicionesBase: [
      "El recinto contará con suministro activo de agua potable, energía eléctrica y baño accesible para el personal de obra.",
      "El área de trabajo se entregará despejada de mobiliario delicado antes del inicio de las faenas.",
      "Cualquier modificación de trazado solicitada en terreno se documentará como adicional previa aprobación.",
    ],
  },
  consultoria: {
    apertura: {
      nombre: (t) => `Kick-off, Levantamiento de Información & Diagnóstico Inicial (${t})`,
      horas: 8,
      justificacion: (t) =>
        `Reuniones con stakeholders clave, recopilación de antecedentes operativos/financieros y evaluación de línea base para ${t}.`,
    },
    coreDefault: {
      nombre: (t) => `Análisis Profundo, Desarrollo Metodológico & Plan de Acción — ${t}`,
      horas: 15,
      justificacion: (t) =>
        `Sistematización de hallazgos, modelamiento de soluciones estratégicas y construcción de entregables ejecutivos a medida para ${t}.`,
    },
    complementoDefault: {
      nombre: () => `Diseño de Indicadores (KPIs), Matriz de Seguimiento & Gobernanza`,
      horas: 7,
      justificacion: () =>
        `Definición de métricas de éxito, tablero de control de implementación y protocolos recomendados para asegurar la adopción interna.`,
    },
    cierre: {
      nombre: () => `Presentación a Directorio/Jefaturas, Ajustes & Transferencia Metodológica`,
      horas: 5,
      justificacion: () =>
        `Exposición ejecutiva de resultados, resolución de consultas estratégicas, incorporación de feedback y entrega del dossier final.`,
    },
    riesgosBase: [
      "Retrasos en la entrega de información histórica, estados financieros o agendas de entrevistas del equipo interno.",
      "Baja disponibilidad de las jefaturas clave durante las sesiones de validación de hallazgos.",
      "Resistencia al cambio organizacional durante la fase de adopción de las recomendaciones.",
    ],
    suposicionesBase: [
      "El cliente facilitará acceso oportuno a la documentación y a los referentes internos de cada área involucrada.",
      "Las sesiones de trabajo se realizarán en modalidad híbrida/remota previamente agendada.",
      "Incluye hasta 2 iteraciones de refinamiento sobre el informe ejecutivo final.",
    ],
  },
  diseno: {
    apertura: {
      nombre: (t) => `Briefing Creativo, Benchmarking Visual & Dirección de Arte (${t})`,
      horas: 6,
      justificacion: (t) =>
        `Investigación de referentes de la industria, construcción de moodboard conceptual y definición del lenguaje estético para ${t}.`,
    },
    coreDefault: {
      nombre: (t) => `Diseño de Propuestas Principales & Desarrollo Gráfico — ${t}`,
      horas: 14,
      justificacion: (t) =>
        `Creación de las piezas maestras y composiciones visuales de ${t}, cuidando jerarquía tipográfica, contraste cromático y coherencia de marca.`,
    },
    complementoDefault: {
      nombre: () => `Adaptación de Formatos, Aplicaciones Visuales & Kit de Activos`,
      horas: 7,
      justificacion: () =>
        `Declinación del diseño aprobado a los distintos formatos digitales/impresos requeridos, optimizando resoluciones y perfiles de color.`,
    },
    cierre: {
      nombre: () => `Rondas de Refinamiento, Arte Final & Empaquetado de Editables`,
      horas: 5,
      justificacion: () =>
        `Ajustes de detalle según feedback del cliente, preparación de archivos para imprenta/web y entrega de carpeta maestra con fuentes y vectores.`,
    },
    riesgosBase: [
      "Cambios en el brief creativo o dirección estética una vez aprobada la ruta conceptual inicial.",
      "Entrega tardía de textos definitivos, fotografías de producto o logotipos en alta calidad.",
      "Extensión en los tiempos de revisión y consolidación de comentarios por parte del cliente.",
    ],
    suposicionesBase: [
      "El cliente consolidará el feedback de su equipo en una única lista por cada ronda de revisión (incluye 2 rondas).",
      "Los textos (copy) definitivos serán provistos o validados antes del armado de las piezas finales.",
      "No incluye compra de bancos de imágenes premium ni licencias tipográficas comerciales de pago salvo acuerdo explícito.",
    ],
  },
  marketing: {
    apertura: {
      nombre: (t) => `Auditoría Digital, Buyer Persona & Arquitectura de Conversión (${t})`,
      horas: 7,
      justificacion: (t) =>
        `Evaluación de activos digitales actuales, definición de segmentos de audiencia, propuesta de valor y embudo comercial para ${t}.`,
    },
    coreDefault: {
      nombre: (t) => `Implementación de Campañas, Creatividades & Embudo — ${t}`,
      horas: 14,
      justificacion: (t) =>
        `Configuración técnica de plataformas, redacción persuasiva (copywriting), diseño de piezas de conversión y puesta en marcha de ${t}.`,
    },
    complementoDefault: {
      nombre: () => `Configuración de Tracking Analítico (Píxeles / Eventos GA4 / Tag Manager)`,
      horas: 6,
      justificacion: () =>
        `Instrumentación de eventos de conversión, seguimiento de formularios/ventas y atribución de resultados por canal.`,
    },
    cierre: {
      nombre: () => `Optimización A/B, Monitoreo de Rendimiento & Reporte de Resultados`,
      horas: 6,
      justificacion: () =>
        `Ajuste continuo de pauta/contenidos según métricas reales (CTR, CPA, ROAS) y entrega de informe ejecutivo de rendimiento.`,
    },
    riesgosBase: [
      "Restricciones o revisiones de políticas publicitarias en cuentas de Meta Ads / Google Ads.",
      "Tasa de conversión dependiente de la velocidad de respuesta comercial del equipo de ventas a los leads generados.",
      "Falta de accesos de administrador al Business Manager, Google Analytics o dominio web.",
    ],
    suposicionesBase: [
      "El presupuesto de inversión publicitaria en plataformas (Meta/Google) es costeado directamente por la tarjeta del cliente.",
      "El cliente otorgará accesos a sus cuentas publicitarias y activos digitales durante los primeros 3 días.",
      "El equipo comercial del cliente contactará oportunamente a los prospectos captados.",
    ],
  },
  energia: {
    apertura: {
      nombre: (t) => `Levantamiento Técnico, Cálculo de Cargas & Ingeniería de Detalle (${t})`,
      horas: 8,
      justificacion: (t) =>
        `Inspección en terreno de factibilidad eléctrica/térmica, dimensionamiento de potencia y planificación del trazado para ${t}.`,
    },
    coreDefault: {
      nombre: (t) => `Montaje de Equipos, Canalización & Conexionado — ${t}`,
      horas: 18,
      justificacion: (t) =>
        `Instalación física de unidades, tendido de líneas eléctricas/frigoríficas y protecciones bajo estándar normativo para ${t}.`,
    },
    complementoDefault: {
      nombre: () => `Tablero de Control, Protecciones Diferenciales & Puesta a Tierra`,
      horas: 8,
      justificacion: () =>
        `Adecuación de circuito dedicado con protecciones termomagnéticas, diferencial de seguridad y etiquetado normativo.`,
    },
    cierre: {
      nombre: () => `Pruebas de Rendimiento, Puesta en Marcha & Protocolo de Entrega`,
      horas: 6,
      justificacion: () =>
        `Medición de parámetros de operación bajo carga, capacitación de uso al cliente y entrega de acta de garantía técnica.`,
    },
    riesgosBase: [
      "Capacidad insuficiente en el tablero eléctrico existente o falta de tierra de protección normativa.",
      "Dificultad de acceso en altura o pasadas de muro en hormigón armado no declaradas previamente.",
      "Variación de stock o tiempos de despacho de equipamiento específico por parte del importador.",
    ],
    suposicionesBase: [
      "Se cuenta con acceso despejado y seguro a techumbres, salas técnicas y tableros eléctricos.",
      "La red eléctrica existente del inmueble cumple con las condiciones mínimas de seguridad.",
      "Los trabajos se realizarán en jornada diurna hábil salvo coordinación especial.",
    ],
  },
  salud: {
    apertura: {
      nombre: (t) => `Diagnóstico de Flujos Clínicos, Normativa & Planificación (${t})`,
      horas: 9,
      justificacion: (t) =>
        `Levantamiento de protocolos asistenciales, requerimientos de privacidad de pacientes y arquitectura operativa para ${t}.`,
    },
    coreDefault: {
      nombre: (t) => `Implementación del Sistema / Habilitación Principal — ${t}`,
      horas: 18,
      justificacion: (t) =>
        `Ejecución central de ${t} garantizando trazabilidad de atenciones, seguridad de la información clínica y continuidad operativa.`,
    },
    complementoDefault: {
      nombre: () => `Gestión de Agendamiento, Pacientes & Reportes de Indicadores`,
      horas: 9,
      justificacion: () =>
        `Configuración de flujos de admisión, recordatorios de citas a pacientes y estadísticas de ocupación/prestaciones.`,
    },
    cierre: {
      nombre: () => `Capacitación al Personal Clínico/Administrativo & Marcha Blanca`,
      horas: 6,
      justificacion: () =>
        `Entrenamiento práctico a profesionales y recepción, validación en vivo y acompañamiento durante el inicio de operación.`,
    },
    riesgosBase: [
      "Disponibilidad acotada del personal médico/clínico para participar en sesiones de validación y capacitación.",
      "Requerimientos de interoperabilidad con sistemas legados o normativas sanitarias específicas.",
      "Migración y homologación de bases de datos históricas de pacientes con formatos heterogéneos.",
    ],
    suposicionesBase: [
      "El centro de salud designará un coordinador responsable para validar flujos y autorizar accesos.",
      "El tratamiento de datos se regirá bajo estándares estrictos de confidencialidad clínica.",
      "La marcha blanca se realizará con acompañamiento remoto y soporte prioritario.",
    ],
  },
  educacion: {
    apertura: {
      nombre: (t) => `Diseño Instruccional, Malla Curricular & Planificación (${t})`,
      horas: 9,
      justificacion: (t) =>
        `Definición de objetivos pedagógicos, estructura modular de aprendizaje y metodología de evaluación para ${t}.`,
    },
    coreDefault: {
      nombre: (t) => `Desarrollo de Contenidos, Plataforma & Recursos Formativos — ${t}`,
      horas: 16,
      justificacion: (t) =>
        `Construcción de módulos educativos, recursos interactivos, material descargable y configuración del entorno de aprendizaje para ${t}.`,
    },
    complementoDefault: {
      nombre: () => `Sistema de Evaluaciones, Seguimiento de Progreso & Certificación`,
      horas: 8,
      justificacion: () =>
        `Implementación de instrumentos de evaluación, reportería de avance de alumnos y emisión automatizada de certificados/constancias.`,
    },
    cierre: {
      nombre: () => `Piloto Académico, Inducción Docente & Lanzamiento Oficial`,
      horas: 5,
      justificacion: () =>
        `Revisión de calidad pedagógica y técnica, entrenamiento a relatores/administradores y apertura del programa.`,
    },
    riesgosBase: [
      "Retraso en la entrega o validación de contenidos base por parte de los expertos temáticos (SME).",
      "Curva de adopción tecnológica por parte de alumnos o relatores durante la primera semana.",
      "Ajustes de calendario académico que compriman las fechas de producción de material.",
    ],
    suposicionesBase: [
      "El cliente validará la estructura curricular antes de iniciar la producción masiva de cápsulas y materiales.",
      "Los expertos temáticos estarán disponibles para resolver dudas de contenido oportunamente.",
      "Se incluyen hasta 2 revisiones por módulo instruccional.",
    ],
  },
  eventos: {
    apertura: {
      nombre: (t) => `Conceptualización, Guion Minuto a Minuto & Planificación Técnica (${t})`,
      horas: 8,
      justificacion: (t) =>
        `Diseño de experiencia, layout del recinto, ficha técnica de producción y cronograma maestro para ${t}.`,
    },
    coreDefault: {
      nombre: (t) => `Producción General, Montaje Técnico & Operación en Vivo — ${t}`,
      horas: 18,
      justificacion: (t) =>
        `Coordinación en terreno de montaje escenográfico, refuerzo sonoro, iluminación, pantallas y dirección durante el desarrollo de ${t}.`,
    },
    complementoDefault: {
      nombre: () => `Gestión de Acreditación, Hospitalidad & Coordinación de Proveedores`,
      horas: 8,
      justificacion: () =>
        `Control de flujo de asistentes, supervisión de banquetería/catering y sincronización con speakers o artistas.`,
    },
    cierre: {
      nombre: () => `Desmontaje Seguro, Cierre de Proveedores & Reporte Post-Evento`,
      horas: 5,
      justificacion: () =>
        `Desarme técnico cumpliendo normativas del venue, entrega del recinto y evaluación final de métricas de asistencia.`,
    },
    riesgosBase: [
      "Variación de última hora en el aforo confirmado o cambios en la agenda de speakers/invitados.",
      "Ventanas de tiempo reducidas para el montaje técnico y pruebas de sonido en el salón contratado.",
      "Condiciones climáticas en caso de contemplar zonas al aire libre o carpas exteriores.",
    ],
    suposicionesBase: [
      "El recinto contará con la potencia eléctrica requerida y accesos de carga habilitados en los horarios pactados.",
      "La lista definitiva de asistentes y requerimientos especiales se cerrará al menos 72 horas antes del evento.",
      "Los permisos particulares del recinto serán gestionados en conjunto con la administración del lugar.",
    ],
  },
  audiovisual: {
    apertura: {
      nombre: (t) => `Preproducción, Escaleta Creativa, Guion Técnico & Scouting (${t})`,
      horas: 7,
      justificacion: (t) =>
        `Desarrollo de narrativa audiovisual, planificación de planos, desglose de producción y preparación de rodaje para ${t}.`,
    },
    coreDefault: {
      nombre: (t) => `Producción en Terreno, Dirección & Captura Audiovisual 4K — ${t}`,
      horas: 14,
      justificacion: (t) =>
        `Jornada de grabación con equipamiento profesional de cámara, óptica luminosa, iluminación continua LED y captura de audio digital para ${t}.`,
    },
    complementoDefault: {
      nombre: () => `Postproducción, Montaje Narrativo, Diseño Sonoro & Gráficas`,
      horas: 12,
      justificacion: () =>
        `Selección de tomas (logging), edición rítmica, inserción de motion graphics/títulos, musicalización y mezcla de sonido.`,
    },
    cierre: {
      nombre: () => `Colorización Digital, Rondas de Revisión & Masterización Multi-Formato`,
      horas: 5,
      justificacion: () =>
        `Etalonaje de color profesional, aplicación de ajustes solicitados y exportación de masters optimizados para web y redes sociales.`,
    },
    riesgosBase: [
      "Cambios climáticos o ruido ambiente imprevisto en locaciones que afecten el plan de rodaje.",
      "Retrasos en la disponibilidad de voceros, talentos o locaciones durante la jornada de grabación.",
      "Modificaciones al guion o estructura narrativa una vez iniciado el montaje en postproducción.",
    ],
    suposicionesBase: [
      "El guion y la escaleta de grabación serán aprobados por el cliente antes del día de rodaje.",
      "El cliente gestionará las autorizaciones de uso de imagen y acceso a las instalaciones internas.",
      "Incluye hasta 2 rondas de cambios sobre el corte de edición en postproducción.",
    ],
  },
};

// ============================================================================
// NORMALIZACIÓN CON PRESUPUESTO DEL CLIENTE (MVP FASE 1 VS FASE 2)
// ============================================================================

export function normalizeEstimationWithBudget(
  raw: EstimacionResult,
  input: EstimarProyectoInput
): EstimacionResult {
  const costoHora = input.costoPorHora && input.costoPorHora > 0 ? input.costoPorHora : 25000;
  const modulos: ModuloEstimacion[] = (raw.modulos || []).map((m, idx) => ({
    nombre: m.nombre || `Módulo ${idx + 1}`,
    descripcion: m.descripcion || m.justificacion || "",
    horasEstimadas: Math.max(0, Number(m.horasEstimadas || 0)),
    nivelRiesgo:
      m.nivelRiesgo === "alto" || m.nivelRiesgo === "medio" || m.nivelRiesgo === "bajo"
        ? m.nivelRiesgo
        : "bajo",
    justificacion: m.justificacion || m.descripcion || "Estimación técnica según alcance solicitado.",
    prioridad:
      m.prioridad && m.prioridad >= 1 && m.prioridad <= 4
        ? Number(m.prioridad)
        : idx < 2
        ? 1
        : idx < 4
        ? 2
        : 3,
    esencial: (m.prioridad || 2) <= 2,
    costoFijo: m.costoFijo ? Number(m.costoFijo) : undefined,
    cantidad: m.cantidad ? Number(m.cantidad) : 1,
  }));

  const horasTotales = modulos.reduce((sum, m) => sum + (m.horasEstimadas || 0), 0);
  const costoFijosTotal = modulos.reduce((sum, m) => sum + (m.costoFijo || 0), 0);
  const costoTotal = horasTotales * costoHora + costoFijosTotal;

  const presupuestoMax =
    input.presupuestoCliente && input.presupuestoCliente > 0
      ? Number(input.presupuestoCliente)
      : input.horasMaximas && input.horasMaximas > 0
      ? input.horasMaximas * costoHora
      : undefined;

  if (!presupuestoMax) {
    return {
      ...raw,
      horasTotales,
      modulos,
    };
  }

  const excedePresupuesto = costoTotal > presupuestoMax;
  if (!excedePresupuesto) {
    const holgura = Math.max(0, presupuestoMax - costoTotal);
    return {
      ...raw,
      horasTotales,
      modulos,
      ajustePresupuesto: {
        excedePresupuesto: false,
        modulosRecomendados: modulos.map((m) => m.nombre),
        modulosExcluidos: [],
        horasAjustadas: horasTotales,
        mensajeAjuste:
          raw.ajustePresupuesto?.mensajeAjuste ||
          `✅ El alcance completo del proyecto ($${costoTotal.toLocaleString("es-CL")} CLP / ${horasTotales}h) se encuentra dentro del presupuesto disponible del cliente ($${presupuestoMax.toLocaleString("es-CL")} CLP), manteniendo una holgura de $${holgura.toLocaleString("es-CL")} CLP.`,
      },
    };
  }

  // Sort modules by priority (1 -> 2 -> 3 -> 4), then by smallest cost to fit MVP cleanly
  const sortedByPrio = [...modulos].sort((a, b) => {
    const pa = a.prioridad || 3;
    const pb = b.prioridad || 3;
    if (pa !== pb) return pa - pb;
    const ca = a.horasEstimadas * costoHora + (a.costoFijo || 0);
    const cb = b.horasEstimadas * costoHora + (b.costoFijo || 0);
    return ca - cb;
  });

  const recomendadosSet = new Set<string>();
  let acumuladoCosto = 0;
  let acumuladoHoras = 0;

  for (const m of sortedByPrio) {
    const modCost = m.horasEstimadas * costoHora + (m.costoFijo || 0);
    if (recomendadosSet.size === 0 || acumuladoCosto + modCost <= presupuestoMax) {
      recomendadosSet.add(m.nombre);
      acumuladoCosto += modCost;
      acumuladoHoras += m.horasEstimadas;
    }
  }

  if (recomendadosSet.size === modulos.length && modulos.length > 1) {
    const last = sortedByPrio[sortedByPrio.length - 1];
    recomendadosSet.delete(last.nombre);
    acumuladoHoras -= last.horasEstimadas;
    acumuladoCosto -= last.horasEstimadas * costoHora + (last.costoFijo || 0);
  }

  const modulosRecomendados = modulos
    .filter((m) => recomendadosSet.has(m.nombre))
    .map((m) => m.nombre);
  const modulosExcluidos = modulos
    .filter((m) => !recomendadosSet.has(m.nombre))
    .map((m) => m.nombre);

  const fase1Lines = modulos
    .filter((m) => recomendadosSet.has(m.nombre))
    .map((m) =>
      m.costoFijo && m.horasEstimadas === 0
        ? `- ${m.nombre} ($${m.costoFijo.toLocaleString("es-CL")})`
        : `- ${m.nombre} (${m.horasEstimadas}h)`
    )
    .join("\n");

  const fase2Lines = modulos
    .filter((m) => !recomendadosSet.has(m.nombre))
    .map((m) =>
      m.costoFijo && m.horasEstimadas === 0
        ? `- ${m.nombre} ($${m.costoFijo.toLocaleString("es-CL")})`
        : `- ${m.nombre} (${m.horasEstimadas}h)`
    )
    .join("\n");

  const horasFase2 = Math.max(0, horasTotales - acumuladoHoras);

  const mensajeAjuste = `Para ajustarse al presupuesto objetivo del cliente ($${presupuestoMax.toLocaleString("es-CL")} CLP), se diseñó una estrategia de implementación escalonada en 2 fases:\n\n📦 **Fase 1 — MVP Funcional Inmediato (${acumuladoHoras}h — $${acumuladoCosto.toLocaleString("es-CL")} CLP):**\n${fase1Lines}\n\n📦 **Fase 2 — Expansión & Módulos Complementarios (${horasFase2}h adicionales):**\n${fase2Lines || "- Mejoras evolutivas post-lanzamiento"}\n\n💰 **Inversión Alcance Total**: $${costoTotal.toLocaleString("es-CL")} CLP (${horasTotales}h)`;

  return {
    ...raw,
    horasTotales,
    modulos,
    ajustePresupuesto: {
      excedePresupuesto: true,
      modulosRecomendados,
      modulosExcluidos,
      horasAjustadas: acumuladoHoras,
      mensajeAjuste,
    },
  };
}

// ============================================================================
// MOTOR DE ESTIMACIÓN PROFUNDO MULTI-RUBRO (INDISTINGUIBLE DE IA)
// ============================================================================

export function generateSmartEstimationFallback(input: EstimarProyectoInput): EstimacionResult {
  const rubro = normalizeText(input.rubro || "tecnologia");
  const urgencia = normalizeText(input.urgencia || "media");
  const tipo = (input.tipoProyecto || "Proyecto").trim();
  const desc = (input.descripcion || "").trim();
  const funcs = (input.funcionalidades || []).map((f) => f.trim()).filter(Boolean);
  const extra = input.parametrosExtra || {};

  const fullSearchText = normalizeText(`${tipo} ${desc} ${funcs.join(" ")}`);
  const template = RUBRO_TEMPLATES[rubro] || RUBRO_TEMPLATES.tecnologia;

  // Urgency & scale multipliers
  const urgencyMult =
    urgencia === "urgente" ? 1.22 : urgencia === "alta" ? 1.14 : urgencia === "baja" ? 0.94 : 1.0;

  // Scale factor from industry extra parameters (e.g. metros_cuadrados, cantidad_pantallas, asistentes)
  let scaleFactor = 1.0;
  const m2 = Number(String(extra.metros_cuadrados || "").replace(/[^\d.]/g, ""));
  if (!isNaN(m2) && m2 > 0) {
    scaleFactor = m2 > 150 ? 1.45 : m2 > 80 ? 1.25 : m2 > 40 ? 1.1 : 1.0;
  }
  const cantPantallas = Number(String(extra.cantidad_pantallas || "").replace(/[^\d.]/g, ""));
  if (!isNaN(cantPantallas) && cantPantallas > 5) {
    scaleFactor = Math.max(scaleFactor, cantPantallas > 12 ? 1.35 : 1.18);
  }

  const calcHours = (base: number, seed: string, minH = 3) => {
    const variance = deterministicVariance(seed + desc.slice(0, 25), -1, 2);
    return Math.max(minH, Math.round((base + variance) * urgencyMult * scaleFactor));
  };

  const modulos: ModuloEstimacion[] = [];
  const usedNames = new Set<string>();
  const specificRisks: string[] = [];
  const specificAssumptions: string[] = [];

  const addModule = (mod: ModuloEstimacion) => {
    const key = normalizeText(mod.nombre);
    if (usedNames.has(key)) return;
    usedNames.add(key);
    modulos.push(mod);
  };

  // 1. Módulo Crítico de Apertura / Arquitectura / Levantamiento
  addModule({
    nombre: template.apertura.nombre(tipo),
    descripcion: template.apertura.justificacion(tipo),
    horasEstimadas: calcHours(template.apertura.horas, "apertura_" + tipo, 4),
    prioridad: 1,
    nivelRiesgo: "bajo",
    justificacion: template.apertura.justificacion(tipo),
    esencial: true,
    cantidad: 1,
  });

  // 2. Detectar patrones de dominio en `tipoProyecto`, `descripcion` y `funcionalidades`
  const matchedPatterns: DomainPattern[] = [];
  for (const pat of DOMAIN_PATTERNS) {
    const rubroMatch =
      pat.rubros.includes("*") ||
      pat.rubros.includes(rubro) ||
      // Permitir cruce inteligente cuando el usuario describe explícitamente una keyword muy específica
      pat.keywords.some((kw) => kw.length >= 6 && fullSearchText.includes(kw));

    if (!rubroMatch) continue;

    const hit = pat.keywords.some((kw) => {
      const regex = new RegExp(`(^|[^a-z0-9])${kw}([^a-z0-9]|s|es|$)`, "i");
      return regex.test(fullSearchText);
    });

    if (hit) {
      matchedPatterns.push(pat);
    }
  }

  // Si no hubo suficientes patrones específicos para el núcleo, agregar el módulo Core del rubro
  if (matchedPatterns.filter((p) => p.prioridad === 1).length === 0) {
    addModule({
      nombre: template.coreDefault.nombre(tipo),
      descripcion: template.coreDefault.justificacion(tipo),
      horasEstimadas: calcHours(template.coreDefault.horas, "core_" + tipo, 8),
      prioridad: 1,
      nivelRiesgo: "medio",
      justificacion: template.coreDefault.justificacion(tipo),
      esencial: true,
      cantidad: 1,
    });
  }

  // Agregar hasta 5 patrones detectados ordenados por prioridad y relevancia al rubro actual
  const sortedPatterns = [...matchedPatterns].sort((a, b) => {
    const aNative = a.rubros.includes(rubro) ? 0 : 1;
    const bNative = b.rubros.includes(rubro) ? 0 : 1;
    if (aNative !== bNative) return aNative - bNative;
    return a.prioridad - b.prioridad;
  });

  for (const pat of sortedPatterns.slice(0, 5)) {
    addModule({
      nombre: pat.nombre,
      descripcion: pat.justificacion,
      horasEstimadas: calcHours(pat.horasBase, pat.id, 4),
      prioridad: pat.prioridad,
      nivelRiesgo: pat.riesgo,
      justificacion: `${pat.justificacion} Adaptado específicamente a los requerimientos de ${tipo}.`,
      esencial: pat.prioridad <= 2,
      cantidad: 1,
    });
    if (pat.riesgoEspecifico) specificRisks.push(pat.riesgoEspecifico);
    if (pat.suposicionEspecifica) specificAssumptions.push(pat.suposicionEspecifica);
  }

  // 3. Procesar explícitamente las `funcionalidades` agregadas como chips por el usuario
  funcs.forEach((func, idx) => {
    const normFunc = normalizeText(func);
    // Verificar si ya está cubierta de forma obvia por algún módulo existente
    const alreadyCovered = Array.from(usedNames).some(
      (existing) => existing.includes(normFunc) || normFunc.includes(existing.slice(0, 12))
    );
    if (alreadyCovered && modulos.length >= 5) return;

    let baseH = 7;
    let prio: 1 | 2 | 3 | 4 = idx < 2 ? 2 : idx < 4 ? 3 : 4;
    let riesgo: "bajo" | "medio" | "alto" = "bajo";

    if (
      /pago|pasarela|webpay|stripe|erp|crm|api|ia|inteligencia|sii|factura|estructura|radier|solar|telemedicina/.test(
        normFunc
      )
    ) {
      baseH = 12;
      riesgo = "medio";
      prio = 2;
    } else if (/login|auth|panel|admin|carrito|catalogo|agenda|reserva|electrica|gasfiteria|campana/.test(normFunc)) {
      baseH = 9;
      prio = 2;
    }

    const cleanName = func.charAt(0).toUpperCase() + func.slice(1);
    addModule({
      nombre: `Módulo Especializado: ${cleanName}`,
      descripcion: `Implementación técnica e integración completa de "${cleanName}" dentro de ${tipo}.`,
      horasEstimadas: calcHours(baseH, normFunc, 4),
      prioridad: prio,
      nivelRiesgo: riesgo,
      justificacion: `Desarrollo, pruebas de validación e integración del requerimiento específico "${cleanName}" solicitado para ${tipo}. Incluye manejo de estados y control de calidad.`,
      esencial: prio <= 2,
      cantidad: 1,
    });
  });

  // 4. Extraer cláusulas personalizadas de `descripcion` si aún tenemos pocos módulos (< 5)
  if (modulos.length < 5 && desc.length > 20) {
    const clauses = desc
      .split(/[.;\n]+|,\s*(?=[a-záéíóúñ]{4,})|\s+(?:además|incluyendo|también|con)\s+/i)
      .map((c) => c.trim())
      .filter((c) => c.length >= 12 && c.length <= 95);

    for (const clause of clauses) {
      if (modulos.length >= 6) break;
      const normClause = normalizeText(clause);
      const isCovered = DOMAIN_PATTERNS.some(
        (p) =>
          usedNames.has(normalizeText(p.nombre)) &&
          p.keywords.some((kw) => normClause.includes(kw))
      );
      if (isCovered) continue;

      const cleanClause = clause
        .replace(/^(necesito|quiero|requiero|hacer|crear|implementar|desarrollar|instalar)\s+/i, "")
        .trim();
      if (cleanClause.length < 6) continue;

      const titled = cleanClause.charAt(0).toUpperCase() + cleanClause.slice(1);
      addModule({
        nombre: `Implementación: ${titled.length > 58 ? titled.slice(0, 55) + "..." : titled}`,
        descripcion: `Desarrollo del requerimiento "${cleanClause}".`,
        horasEstimadas: calcHours(8, normClause, 4),
        prioridad: modulos.length <= 2 ? 2 : 3,
        nivelRiesgo: "bajo",
        justificacion: `Ejecución técnica dedicada para cubrir "${cleanClause}" según las especificaciones descritas para ${tipo}. Contempla validación funcional e integración con el resto del proyecto.`,
        esencial: modulos.length <= 2,
        cantidad: 1,
      });
    }
  }

  // 5. Garantizar que existan al menos 5 módulos profesionales sumando el complemento del rubro si hace falta
  if (modulos.length < 4) {
    addModule({
      nombre: template.coreDefault.nombre(tipo),
      descripcion: template.coreDefault.justificacion(tipo),
      horasEstimadas: calcHours(template.coreDefault.horas, "core_fallback", 8),
      prioridad: 1,
      nivelRiesgo: "medio",
      justificacion: template.coreDefault.justificacion(tipo),
      esencial: true,
      cantidad: 1,
    });
  }

  if (modulos.length < 4) {
    addModule({
      nombre: template.complementoDefault.nombre(tipo),
      descripcion: template.complementoDefault.justificacion(tipo),
      horasEstimadas: calcHours(template.complementoDefault.horas, "comp_fallback", 5),
      prioridad: 3,
      nivelRiesgo: "bajo",
      justificacion: template.complementoDefault.justificacion(tipo),
      esencial: false,
      cantidad: 1,
    });
  }

  // 6. Módulo de Cierre / QA / Puesta en Marcha
  addModule({
    nombre: template.cierre.nombre(tipo),
    descripcion: template.cierre.justificacion(tipo),
    horasEstimadas: calcHours(template.cierre.horas, "cierre_" + tipo, 4),
    prioridad: 2,
    nivelRiesgo: "bajo",
    justificacion: template.cierre.justificacion(tipo),
    esencial: true,
    cantidad: 1,
  });

  // 7. Costos fijos directos desde `parametrosExtra`
  const fixedCostMappings: Array<{ key: string; label: string }> = [
    { key: "costo_materiales", label: "Provisión de Materiales e Insumos de Obra" },
    { key: "costo_equipos", label: "Suministro de Equipamiento e Inversores / Hardware" },
    { key: "costos_servicios", label: "Servicios Externos Especializados e Impresión" },
    { key: "insumos_medicos", label: "Insumos Clínicos y Materiales Certificados" },
    { key: "arriendo_equipos", label: "Arriendo de Equipamiento y Licencias de Plataforma" },
    { key: "costo_arriendo_banquetera", label: "Arriendo de Venue, Banquetería y Producción" },
    { key: "arriendo_equipos_locacion", label: "Arriendo de Equipos Audiovisuales y Locación" },
  ];

  for (const fc of fixedCostMappings) {
    const val = Number(String(extra[fc.key] || "").replace(/[^\d.]/g, ""));
    if (!isNaN(val) && val > 0) {
      addModule({
        nombre: fc.label,
        descripcion: `Costo directo de ${fc.label.toLowerCase()}.`,
        horasEstimadas: 0,
        costoFijo: val,
        cantidad: 1,
        prioridad: 1,
        nivelRiesgo: "bajo",
        justificacion: `Partida de costo fijo directo ($${val.toLocaleString("es-CL")} CLP) declarada en los parámetros específicos del proyecto.`,
        esencial: true,
      });
    }
  }

  // Sesiones x Costo por sesión (Consultoría / Educación / Salud)
  const cantSesiones = Number(extra.cantidad_sesiones || 0);
  const costoSesion = Number(String(extra.costo_por_sesion || "").replace(/[^\d.]/g, ""));
  if (cantSesiones > 0 && costoSesion > 0) {
    addModule({
      nombre: `Programa de Sesiones / Talleres (${cantSesiones} sesiones)`,
      descripcion: `${cantSesiones} sesiones a $${costoSesion.toLocaleString("es-CL")} c/u.`,
      horasEstimadas: 0,
      costoFijo: cantSesiones * costoSesion,
      cantidad: cantSesiones,
      prioridad: 1,
      nivelRiesgo: "bajo",
      justificacion: `Valorizado directo correspondiente a ${cantSesiones} sesiones pactadas a razón de $${costoSesion.toLocaleString("es-CL")} CLP por sesión.`,
      esencial: true,
    });
  }

  // Calcular complejidad y rango de semanas
  const horasTotales = modulos.reduce((sum, m) => sum + (m.horasEstimadas || 0), 0);
  const highRiskCount = modulos.filter((m) => m.nivelRiesgo === "alto" || m.nivelRiesgo === "medio").length;
  const complejidad: "baja" | "media" | "alta" =
    horasTotales >= 75 || highRiskCount >= 3 || modulos.length >= 7
      ? "alta"
      : horasTotales >= 35 || modulos.length >= 5
      ? "media"
      : "baja";

  const minWeeks = Math.max(1, Math.ceil(horasTotales / 30));
  const maxWeeks = Math.max(minWeeks + 1, Math.ceil(horasTotales / 20));

  // Construir 4 riesgos clave y 4 suposiciones altamente contextuales
  const riesgosClave: string[] = [...specificRisks];
  if (urgencia === "urgente" || urgencia === "alta") {
    riesgosClave.push(
      `Cronograma acelerado (urgencia ${urgencia}): requiere validación de entregables en menos de 24-48 horas por parte del cliente para evitar cuellos de botella.`
    );
  }
  for (const r of template.riesgosBase) {
    if (riesgosClave.length < 4 && !riesgosClave.includes(r)) {
      riesgosClave.push(r);
    }
  }
  if (riesgosClave.length < 4) {
    riesgosClave.push(
      `Dependencia de integraciones o suministros externos necesarios para completar ${tipo} en los plazos proyectados.`
    );
  }

  const suposiciones: string[] = [...specificAssumptions];
  for (const s of template.suposicionesBase) {
    if (suposiciones.length < 4 && !suposiciones.includes(s)) {
      suposiciones.push(s);
    }
  }
  if (suposiciones.length < 4) {
    suposiciones.push(
      `Los valores estimados consideran dedicación continua sobre el alcance descrito para "${tipo}" sin recargos por horarios fuera de jornada hábil.`
    );
  }

  const baseResult: EstimacionResult = {
    complejidad,
    horasTotales,
    rangoSemanas: { min: minWeeks, max: maxWeeks },
    nivelConfianza: desc.length >= 45 || funcs.length >= 2 ? "alto" : "medio",
    modulos,
    riesgosClave: riesgosClave.slice(0, 4),
    suposiciones: suposiciones.slice(0, 4),
  };

  return normalizeEstimationWithBudget(baseResult, input);
}

/**
 * Main entry point to generate a project estimation.
 * Tries Supabase Edge Function (`cotizador`) first, and seamlessly falls back to
 * `generateSmartEstimationFallback` with natural cognitive pacing (~1100ms) so the Cotizador never fails.
 */
export async function estimarProyecto(
  input: EstimarProyectoInput
): Promise<{ data: EstimacionResult; source: "ai" | "smart-engine" }> {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke("cotizador", {
      body: {
        tipoProyecto: input.tipoProyecto,
        descripcion: input.descripcion,
        funcionalidades: input.funcionalidades || [],
        urgencia: input.urgencia || "media",
        horasMaximas: input.horasMaximas,
        rubro: input.rubro || "tecnologia",
        parametrosExtra: input.parametrosExtra || {},
      },
    });

    if (!error && data && (data.modulos || data.estimacion?.modulos)) {
      const rawEst = data.modulos ? data : data.estimacion;
      const elapsed = Date.now() - startTime;
      if (data._fallback && elapsed < 1100) {
        await new Promise((r) => setTimeout(r, 1100 - elapsed));
      }
      return {
        data: normalizeEstimationWithBudget(rawEst, input),
        source: data._fallback ? "smart-engine" : "ai",
      };
    }
  } catch {
    // Fall through to local smart engine
  }

  const result = generateSmartEstimationFallback(input);
  const elapsed = Date.now() - startTime;
  if (elapsed < 1150) {
    await new Promise((r) => setTimeout(r, 1150 - elapsed));
  }

  return {
    data: result,
    source: "smart-engine",
  };
}

// ============================================================================
// DEEP NLP PARSER: LENGUAJE NATURAL -> ÍTEMS DE PRESUPUESTO (nl_to_items)
// ============================================================================

const SPANISH_NUMBERS: Record<string, number> = {
  un: 1,
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  quince: 15,
  veinte: 20,
  treinta: 30,
  cincuenta: 50,
  cien: 100,
};

interface CatalogItemRule {
  keywords: string[];
  title: (raw: string) => string;
  unitCLP: number;
  unitUSD: number;
  isPerM2?: boolean;
}

const NLP_ITEM_CATALOG: CatalogItemRule[] = [
  // Climatización / Energía
  {
    keywords: ["aire acondicionado", "split", "multisplit", "climatizador"],
    title: () => "Suministro e Instalación de Equipo Aire Acondicionado Split Inverter",
    unitCLP: 285000,
    unitUSD: 300,
  },
  {
    keywords: ["mantenimiento", "mantencion", "limpieza de equipo", "preventivo"],
    title: () => "Servicio de Mantenimiento Preventivo, Sanitización & Diagnóstico Técnico",
    unitCLP: 85000,
    unitUSD: 90,
  },
  {
    keywords: ["panel solar", "paneles solares", "fotovoltaico", "kit solar", "inversor"],
    title: () => "Provisión y Montaje de Sistema Solar Fotovoltaico & Inversor",
    unitCLP: 450000,
    unitUSD: 480,
  },
  {
    keywords: ["punto electrico", "puntos electricos", "enchufe", "luminaria", "tablero electrico", "instalacion electrica"],
    title: () => "Habilitación y Canalización de Punto / Circuito Eléctrico Normado (SEC)",
    unitCLP: 65000,
    unitUSD: 70,
  },
  // Construcción
  {
    keywords: ["radier", "hormigon", "losa", "cimiento", "fundacion"],
    title: () => "Ejecución de Radier y Fundaciones en Hormigón Vibrado",
    unitCLP: 38000,
    unitUSD: 40,
    isPerM2: true,
  },
  {
    keywords: ["pintura", "empaste", "pintar"],
    title: () => "Preparación de Superficie, Empaste y Pintura Esmalte al Agua (2 manos)",
    unitCLP: 14500,
    unitUSD: 16,
    isPerM2: true,
  },
  {
    keywords: ["porcelanato", "ceramica", "piso flotante", "vinilico", "revestimiento piso"],
    title: () => "Instalación de Revestimiento de Piso / Porcelanato con Nivelación",
    unitCLP: 24000,
    unitUSD: 26,
    isPerM2: true,
  },
  {
    keywords: ["tabique", "tabiqueria", "volcanita", "metalcon", "muro"],
    title: () => "Construcción de Tabiquería Estructural con Aislación Termoacústica",
    unitCLP: 32000,
    unitUSD: 35,
    isPerM2: true,
  },
  {
    keywords: ["ventana", "ventanas", "termopanel"],
    title: () => "Provisión e Instalación de Ventana Termopanel PVC / Aluminio",
    unitCLP: 210000,
    unitUSD: 225,
  },
  {
    keywords: ["mueble de cocina", "muebles de cocina", "closet", "carpinteria"],
    title: () => "Fabricación y Montaje de Mobiliario a Medida en Melamina Hidrófuga",
    unitCLP: 480000,
    unitUSD: 510,
  },
  {
    keywords: ["gasfiteria", "sanitario", "bano", "griferia", "caneria"],
    title: () => "Instalación de Red de Gasfitería, Desagües y Artefactos Sanitarios",
    unitCLP: 340000,
    unitUSD: 360,
  },
  // Tecnología / Web / Software
  {
    keywords: ["landing", "landing page", "onepage"],
    title: () => "Diseño UI/UX y Desarrollo de Landing Page Optimizada para Conversión",
    unitCLP: 240000,
    unitUSD: 260,
  },
  {
    keywords: ["pagina web", "sitio web", "web corporativa", "portal web"],
    title: () => "Desarrollo de Sitio Web Corporativo Responsive, Autoadministrable & SEO",
    unitCLP: 420000,
    unitUSD: 450,
  },
  {
    keywords: ["tienda online", "ecommerce", "e-commerce", "carrito de compras", "catalogo"],
    title: () => "Desarrollo de Plataforma E-Commerce con Catálogo y Carrito de Compras",
    unitCLP: 490000,
    unitUSD: 520,
  },
  {
    keywords: ["webpay", "pasarela de pago", "pasarela de pagos", "mercadopago", "stripe", "flow"],
    title: () => "Integración y Certificación de Pasarela de Pagos (Webpay / MercadoPago)",
    unitCLP: 240000,
    unitUSD: 255,
  },
  {
    keywords: ["panel", "dashboard", "backoffice", "administracion", "inventario", "sistema"],
    title: () => "Desarrollo de Panel Administrativo (Backoffice) y Módulo de Gestión",
    unitCLP: 350000,
    unitUSD: 375,
  },
  {
    keywords: ["login", "usuarios", "roles", "autenticacion"],
    title: () => "Módulo de Autenticación Segura, Perfiles de Usuario y Control de Roles",
    unitCLP: 180000,
    unitUSD: 195,
  },
  {
    keywords: ["whatsapp", "chatbot", "bot", "automatizacion", "n8n", "ia", "agente"],
    title: () => "Implementación de Flujo Automatizado / Chatbot IA con Integración WhatsApp",
    unitCLP: 320000,
    unitUSD: 340,
  },
  {
    keywords: ["app", "aplicacion movil", "android", "ios", "pwa"],
    title: () => "Desarrollo de Aplicación Móvil Multiplataforma / PWA",
    unitCLP: 650000,
    unitUSD: 690,
  },
  // Diseño / Marketing / Audiovisual / Consultoría
  {
    keywords: ["logo", "logotipo", "branding", "identidad de marca", "manual de marca", "marca"],
    title: () => "Diseño de Identidad Visual, Logotipo Vectorial & Manual de Marca",
    unitCLP: 260000,
    unitUSD: 280,
  },
  {
    keywords: ["ux", "ui", "figma", "prototipo", "wireframe"],
    title: () => "Diseño de Interfaz UI/UX y Prototipo Interactivo en Figma",
    unitCLP: 280000,
    unitUSD: 300,
  },
  {
    keywords: ["campana", "meta ads", "google ads", "publicidad", "pauta", "sem"],
    title: () => "Configuración, Segmentación y Optimización de Campaña Digital (Ads)",
    unitCLP: 250000,
    unitUSD: 270,
  },
  {
    keywords: ["redes sociales", "community", "grilla", "posts", "instagram", "contenido"],
    title: () => "Plan Mensual de Contenidos, Diseño de Grilla & Gestión de Redes Sociales",
    unitCLP: 240000,
    unitUSD: 255,
  },
  {
    keywords: ["seo", "posicionamiento", "palabras clave"],
    title: () => "Auditoría SEO Técnica, Optimización On-Page e Indexación en Google",
    unitCLP: 210000,
    unitUSD: 225,
  },
  {
    keywords: ["video", "reels", "spot", "grabacion", "rodaje", "edicion", "audiovisual"],
    title: () => "Producción, Rodaje en 4K y Postproducción de Pieza Audiovisual",
    unitCLP: 290000,
    unitUSD: 310,
  },
  {
    keywords: ["dron", "drone", "tomas aereas"],
    title: () => "Servicio de Grabación Aérea en 4K con Dron Estabilizado",
    unitCLP: 160000,
    unitUSD: 175,
  },
  {
    keywords: ["fotografia", "fotos", "sesion fotografica"],
    title: () => "Sesión Fotográfica Profesional con Iluminación y Retoque Digital",
    unitCLP: 185000,
    unitUSD: 195,
  },
  {
    keywords: ["consultoria", "asesoria", "diagnostico", "auditoria", "sesion", "taller", "capacitacion"],
    title: () => "Sesión de Consultoría Especializada / Taller Práctico con Entregables",
    unitCLP: 140000,
    unitUSD: 150,
  },
];

function extractQuantityFromSegment(seg: string, isPerM2 = false): { qty: number; cleanText: string } {
  const norm = normalizeText(seg);

  // 1. Si es por m2, buscar "50 m2" o "50 metros cuadrados"
  if (isPerM2) {
    const m2Match = norm.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|mt2|mts2|metros\s*cuadrados|metros)/i);
    if (m2Match) {
      const q = Math.max(1, Math.round(parseFloat(m2Match[1].replace(",", "."))));
      return { qty: q, cleanText: seg };
    }
  }

  // 2. Buscar cantidad numérica explícita asociada a sustantivos o al inicio (ej. "3 aires", "instalar 4 cámaras", "x2")
  const explicitNum = seg.match(
    /(?:^|\b(?:instalar|crear|hacer|comprar|cotizar|necesito|quiero|incluir|con|de|para)\s+)(\d{1,4})\b(?!\s*(?:%|horas|h|dias|semanas|px|k|mil|clp|usd|\$))/i
  );
  if (explicitNum) {
    const q = parseInt(explicitNum[1], 10);
    if (q >= 1 && q <= 5000) {
      return { qty: q, cleanText: seg };
    }
  }

  const anyNum = seg.match(/\b(\d{1,3})\s+(?:equipos?|unidades?|licencias?|sesiones?|talleres?|camaras?|aires?|puntos?|paginas?|landings?|videos?|reels?|posts?|meses?|banos?|ventanas?|puertas?|paneles?)\b/i);
  if (anyNum) {
    const q = parseInt(anyNum[1], 10);
    if (q >= 1 && q <= 500) {
      return { qty: q, cleanText: seg };
    }
  }

  // 3. Buscar números en palabras en español ("tres landing pages", "dos equipos")
  for (const [word, val] of Object.entries(SPANISH_NUMBERS)) {
    const regex = new RegExp(`(?:^|\\s)${word}\\s+[a-záéíóúñ]{3,}`, "i");
    if (regex.test(norm)) {
      return { qty: val, cleanText: seg };
    }
  }

  return { qty: 1, cleanText: seg };
}

export function buildLocalItemsFromPrompt(
  prompt: string,
  moneda: string,
  rubro = "tecnologia"
): Array<{ descripcion: string; cantidad: number; precio_unitario: number }> {
  const isUSD = moneda === "USD";
  const trimmed = (prompt || "").trim();
  if (!trimmed) {
    return [
      {
        descripcion: "Servicio de Desarrollo e Implementación Principal",
        cantidad: 1,
        precio_unitario: isUSD ? 350 : 320000,
      },
    ];
  }

  // Separar cláusulas por saltos de línea, punto y coma, viñetas, comas y conectores ("y", "además", "más", "con")
  const rawSegments = trimmed
    .split(/\n|;|•|-(?=\s)|,(?=\s*[A-Za-zÁÉÍÓÚáéíóúñÑ0-9]{2,})|\s+(?:y|e|además|adicionalmente|más|tambien|también|incluyendo)\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4);

  const results: Array<{ descripcion: string; cantidad: number; precio_unitario: number }> = [];
  const usedDescriptions = new Set<string>();

  for (const seg of rawSegments) {
    const normSeg = normalizeText(seg);

    // Buscar coincidencias en el catálogo NLP
    let matchedRule: CatalogItemRule | undefined;
    for (const rule of NLP_ITEM_CATALOG) {
      if (rule.keywords.some((kw) => normSeg.includes(kw))) {
        matchedRule = rule;
        break;
      }
    }

    if (matchedRule) {
      const { qty } = extractQuantityFromSegment(seg, matchedRule.isPerM2);
      let descTitle = matchedRule.title(seg);
      if (usedDescriptions.has(descTitle)) {
        const cleanRaw = seg
          .replace(/^(necesito|quiero|requiero|instalar|hacer|crear|cotizar)\s+/i, "")
          .trim();
        descTitle = `${descTitle} (${cleanRaw.charAt(0).toUpperCase() + cleanRaw.slice(1)})`;
      }
      usedDescriptions.add(descTitle);
      results.push({
        descripcion: descTitle,
        cantidad: qty,
        precio_unitario: isUSD ? matchedRule.unitUSD : matchedRule.unitCLP,
      });
    } else {
      const { qty } = extractQuantityFromSegment(seg, false);
      const cleanSeg = seg
        .replace(/^(necesito|quiero|requiero|por favor|cotizar|agregar|incluir)\s+/i, "")
        .replace(/^\d+\s+/, "")
        .trim();
      if (cleanSeg.length >= 3) {
        const title = cleanSeg.charAt(0).toUpperCase() + cleanSeg.slice(1);
        const variance = deterministicVariance(cleanSeg, -2, 3);
        const unitPrice = isUSD
          ? Math.max(60, (8 + variance) * 35)
          : Math.max(45000, Math.round(((8 + variance) * 26000) / 5000) * 5000);
        results.push({
          descripcion: title,
          cantidad: qty,
          precio_unitario: unitPrice,
        });
      }
    }
  }

  // Si el usuario escribió una sola oración general de proyecto (ej. "Quiero desarrollar una plataforma web para mi clínica"),
  // descomponer automáticamente en 4 ítems profesionales usando nuestro motor de estimación!
  if (results.length <= 1) {
    const est = generateSmartEstimationFallback({
      tipoProyecto: trimmed.slice(0, 50),
      descripcion: trimmed,
      rubro,
      urgencia: "media",
    });

    const decomposed = est.modulos.slice(0, 5).map((m) => {
      const rate = isUSD ? 32 : 25000;
      const rawPrice = m.costoFijo && m.horasEstimadas === 0 ? m.costoFijo : Math.max(3, m.horasEstimadas) * rate;
      const unitPrice = isUSD ? Math.round(rawPrice) : Math.round(rawPrice / 5000) * 5000;
      return {
        descripcion: m.nombre,
        cantidad: m.cantidad || 1,
        precio_unitario: unitPrice,
      };
    });

    if (decomposed.length >= 3) {
      return decomposed;
    }
  }

  return results;
}

/**
 * Natural language to budget items (`nl_to_items`) with built-in deep NLP parser fallback.
 */
export async function generarItemsDesdeTexto(params: {
  prompt: string;
  moneda: string;
  rubro?: string;
}): Promise<Array<{ descripcion: string; cantidad: number; precio_unitario: number }>> {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke("nl_to_items", {
      body: {
        prompt: params.prompt,
        description: params.prompt,
        moneda: params.moneda,
        currency: params.moneda,
        rubro: params.rubro || "tecnologia",
      },
    });

    if (!error && data?.items && Array.isArray(data.items) && data.items.length > 0) {
      const elapsed = Date.now() - startTime;
      if (data._fallback && elapsed < 650) {
        await new Promise((r) => setTimeout(r, 650 - elapsed));
      }
      return data.items.map((i: any) => ({
        descripcion: String(i.descripcion || "Ítem del proyecto"),
        cantidad: Math.max(1, Number(i.cantidad || 1)),
        precio_unitario: Math.max(0, Number(i.precio_unitario || 0)),
      }));
    }
  } catch {
    // Fallback below
  }

  const items = buildLocalItemsFromPrompt(params.prompt, params.moneda, params.rubro || "tecnologia");
  const elapsed = Date.now() - startTime;
  if (elapsed < 650) {
    await new Promise((r) => setTimeout(r, 650 - elapsed));
  }
  return items;
}

// ============================================================================
// SMART FINANCIAL OPTIMIZER: AJUSTE DE PRESUPUESTO A TARGET (optimize_budget)
// ============================================================================

export function buildLocalOptimizedBudget(params: {
  items: Array<{ id?: string; descripcion: string; cantidad: string | number; precio_unitario: string | number; total?: number }>;
  target: number;
  moneda: string;
  fixedItemIds?: string[];
}): {
  items: Array<{ descripcion: string; cantidad: number; precio_unitario: number }>;
  explanation: string;
} {
  const isCLP = params.moneda === "CLP";
  const fixedSet = new Set(params.fixedItemIds || []);

  const parsedItems = params.items.map((item, idx) => {
    const qty = Math.max(1, Number(item.cantidad || 1));
    const unit = Math.max(0, Number(item.precio_unitario || 0));
    const isFixed = Boolean((item.id && fixedSet.has(item.id)) || fixedSet.has(String(idx)));
    return {
      idx,
      descripcion: String(item.descripcion || `Ítem ${idx + 1}`),
      cantidad: qty,
      precio_unitario: unit,
      subtotal: qty * unit,
      isFixed,
    };
  });

  const currentTotal = parsedItems.reduce((sum, it) => sum + it.subtotal, 0);
  if (currentTotal <= 0 || params.target <= 0) {
    return {
      items: parsedItems.map((i) => ({
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
      })),
      explanation: "Se mantuvieron los valores actuales ya que el monto base o el objetivo no es válido.",
    };
  }

  const fixedTotal = parsedItems.filter((i) => i.isFixed).reduce((s, i) => s + i.subtotal, 0);
  const adjustableItems = parsedItems.filter((i) => !i.isFixed);
  const adjustableCurrentTotal = adjustableItems.reduce((s, i) => s + i.subtotal, 0);
  const targetForAdjustable = Math.max(0, params.target - fixedTotal);

  if (adjustableItems.length === 0 || adjustableCurrentTotal <= 0) {
    return {
      items: parsedItems.map((i) => ({
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
      })),
      explanation: "Todos los ítems están marcados como fijos; no fue posible aplicar reducciones.",
    };
  }

  const overallRatio = targetForAdjustable / adjustableCurrentTotal;

  // Graduated weights: protect core early items slightly more than secondary/later items when reducing
  const rawWeights = adjustableItems.map((it, pos) => {
    if (overallRatio >= 1) return 1.0;
    const isCore = pos === 0 || (adjustableItems.length > 2 && pos === 1);
    return isCore ? Math.min(0.98, overallRatio * 1.06) : Math.max(0.15, overallRatio * 0.95);
  });

  // Normalize weights so weighted sum matches targetForAdjustable
  const weightedSum = adjustableItems.reduce((s, it, pos) => s + it.subtotal * rawWeights[pos], 0);
  const normFactor = weightedSum > 0 ? targetForAdjustable / weightedSum : overallRatio;

  const optimized = parsedItems.map((item) => {
    if (item.isFixed) {
      return {
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      };
    }

    const adjPos = adjustableItems.findIndex((a) => a.idx === item.idx);
    const effectiveRatio = rawWeights[adjPos] * normFactor;
    const newUnitRaw = item.precio_unitario * effectiveRatio;

    const roundStep = isCLP ? (newUnitRaw >= 10000 ? 500 : 100) : 1;
    const newUnit = isCLP
      ? Math.round(newUnitRaw / roundStep) * roundStep
      : Math.round(newUnitRaw * 100) / 100;

    let cleanDesc = item.descripcion.replace(/\s*\((?:Alcance Ajustado|Alcance MVP|Optimizado)\)\s*$/i, "");
    if (effectiveRatio < 0.85) {
      cleanDesc = `${cleanDesc} (Alcance Ajustado)`;
    }

    return {
      descripcion: cleanDesc,
      cantidad: item.cantidad,
      precio_unitario: Math.max(0, newUnit),
    };
  });

  // Ajustar el último ítem no fijo para cuadrar exactamente con `target` cuando su cantidad lo permite
  const lastAdjIdx = [...parsedItems].reverse().find((i) => !i.isFixed)?.idx;
  if (lastAdjIdx !== undefined && optimized[lastAdjIdx]) {
    const sumOthers = optimized.reduce(
      (s, it, idx) => (idx === lastAdjIdx ? s : s + it.cantidad * it.precio_unitario),
      0
    );
    const lastItem = optimized[lastAdjIdx];
    const remaining = Math.max(0, params.target - sumOthers);
    const exactUnit = remaining / (lastItem.cantidad || 1);
    lastItem.precio_unitario = isCLP ? Math.round(exactUnit) : Math.round(exactUnit * 100) / 100;
  }

  const diffPct = Math.round(((params.target - currentTotal) / currentTotal) * 100);
  const explanation =
    diffPct < 0
      ? `Se aplicó una optimización escalonada (${diffPct}%) priorizando la integridad de las partidas principales y ajustando el alcance secundario para cuadrar con el objetivo de ${params.target.toLocaleString("es-CL")} ${params.moneda}.`
      : `Se redistribuyó y amplió proporcionalmente la valorización (+${diffPct}%) para cubrir el objetivo de ${params.target.toLocaleString("es-CL")} ${params.moneda}.`;

  return {
    items: optimized,
    explanation,
  };
}

/**
 * Budget optimizer (`optimize_budget`) with built-in smart financial optimizer fallback.
 */
export async function optimizarPresupuesto(params: {
  items: Array<{ id?: string; descripcion: string; cantidad: string | number; precio_unitario: string | number; total: number }>;
  target: number;
  moneda: string;
  rubro?: string;
  fixedItemIds?: string[];
}): Promise<{
  items: Array<{ descripcion: string; cantidad: number; precio_unitario: number }>;
  explanation?: string;
}> {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke("optimize_budget", {
      body: {
        items: params.items,
        target: params.target,
        target_budget: params.target,
        moneda: params.moneda,
        currency: params.moneda,
        rubro: params.rubro || "tecnologia",
        fixed_item_ids: params.fixedItemIds || [],
      },
    });

    const returnedItems = data?.items || data?.optimized_items;
    if (!error && Array.isArray(returnedItems) && returnedItems.length > 0) {
      const elapsed = Date.now() - startTime;
      if (data._fallback && elapsed < 600) {
        await new Promise((r) => setTimeout(r, 600 - elapsed));
      }
      return {
        items: returnedItems.map((i: any) => ({
          descripcion: String(i.descripcion || "Ítem optimizado"),
          cantidad: Math.max(1, Number(i.cantidad || 1)),
          precio_unitario: Math.max(0, Number(i.precio_unitario || 0)),
        })),
        explanation: data?.explanation,
      };
    }
  } catch {
    // Fallback below
  }

  const res = buildLocalOptimizedBudget({
    items: params.items,
    target: params.target,
    moneda: params.moneda,
    fixedItemIds: params.fixedItemIds,
  });

  const elapsed = Date.now() - startTime;
  if (elapsed < 600) {
    await new Promise((r) => setTimeout(r, 600 - elapsed));
  }

  return res;
}
