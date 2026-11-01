import { ListChecks, Zap, Users, User, Search, MessageSquare, AlertTriangle, AlertOctagon, CheckCircle2, Clock, TrendingUp, RefreshCw, Ban, Flag, Building2, Briefcase, Sun } from "lucide-react";

export const STATUSES = ["Backlog", "Por hacer", "En curso", "En revisión", "Bloqueada", "Terminada", "Cancelada"];
export const KANBAN_STATUSES = ["Backlog", "Por hacer", "En curso", "En revisión", "Bloqueada", "Terminada"];
export function statusCls(status, dark) {
  const light = {
    "Backlog": "bg-slate-100 text-slate-600",
    "Por hacer": "bg-slate-200 text-slate-700",
    "En curso": "bg-primary/10 text-primary border border-primary/20",
    "En revisión": "bg-secondary/15 text-secondary border border-secondary/20",
    "Bloqueada": "bg-red-50 text-red-700",
    "Terminada": "bg-emerald-50 text-emerald-700",
    "Cancelada": "bg-slate-100 text-slate-400",
  };
  const darkMap = {
    "Backlog": "bg-muted text-muted-foreground",
    "Por hacer": "bg-muted/80 text-foreground/90",
    "En curso": "bg-primary/15 text-primary border border-primary/25",
    "En revisión": "bg-secondary/15 text-secondary border border-secondary/25",
    "Bloqueada": "bg-red-500/15 text-red-400 border border-red-500/25",
    "Terminada": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
    "Cancelada": "bg-muted/50 text-muted-foreground/60",
  };
  return (dark ? darkMap : light)[status] || light["Backlog"];
}

export const CATEGORIES = ["Nexabis", "Trabajo", "Diaria"];
export const CATEGORY_META = {
  Nexabis: {
    id: "Nexabis",
    label: "Trabajo Nexabis",
    shortLabel: "Nexabis",
    emoji: "🏢",
    icon: Building2,
    description: "Agencia, clientes, proyectos de software, presupuestos y entregables",
    lightCls: "bg-primary/10 text-primary border-primary/30",
    darkCls: "bg-primary/15 text-primary border-primary/35",
    activeCls: "gradient-button text-white border-primary shadow-[0_0_15px_rgba(255,92,92,0.25)]",
  },
  Trabajo: {
    id: "Trabajo",
    label: "Trabajo Normal",
    shortLabel: "Trabajo",
    emoji: "💼",
    icon: Briefcase,
    description: "Empleo corporativo, Estrategia de Clientes, Feedback y reuniones",
    lightCls: "bg-secondary/15 text-secondary border-secondary/30",
    darkCls: "bg-secondary/15 text-secondary border-secondary/35",
    activeCls: "bg-secondary text-white border-secondary shadow-[0_0_15px_rgba(255,128,66,0.25)]",
  },
  Diaria: {
    id: "Diaria",
    label: "Diaria / Personal",
    shortLabel: "Diaria",
    emoji: "☀️",
    icon: Sun,
    description: "Rutinas del día, trámites personales, hábitos y recordatorios rápidos",
    lightCls: "bg-accent/15 text-amber-700 border-accent/40",
    darkCls: "bg-accent/15 text-accent border-accent/35",
    activeCls: "bg-accent text-accent-foreground font-semibold border-accent shadow-[0_0_15px_rgba(255,194,77,0.25)]",
  },
};

export function getTaskCategory(task) {
  if (!task) return "Nexabis";
  const raw = (task.category || "").trim();
  if (raw === "Nexabis" || raw === "Trabajo" || raw === "Diaria") return raw;
  if (task.type === "Diaria" || task.recurring?.enabled) return "Diaria";
  if (task.clienteId || task.proyectoId || task.cliente_id || task.proyecto_id) return "Nexabis";
  return "Nexabis";
}

export function categoryCls(cat, dark) {
  const meta = CATEGORY_META[cat] || CATEGORY_META.Nexabis;
  return dark ? meta.darkCls : meta.lightCls;
}

export const PRIORITIES = ["P0", "P1", "P2", "P3"];
export const PRIORITY_LABEL = { P0: "P0 · Urgente", P1: "P1 · Alta", P2: "P2 · Normal", P3: "P3 · Baja" };
export const PRIORITY_DOT = { P0: "bg-red-500", P1: "bg-secondary", P2: "bg-primary", P3: "bg-muted-foreground" };
export function prioCls(id, dark) {
  const light = {
    P0: "bg-red-50 text-red-700",
    P1: "bg-orange-50 text-orange-700",
    P2: "bg-primary/10 text-primary",
    P3: "bg-slate-100 text-slate-500",
  };
  const darkMap = {
    P0: "bg-red-500/15 text-red-400 border border-red-500/25",
    P1: "bg-secondary/15 text-secondary border border-secondary/25",
    P2: "bg-primary/15 text-primary border border-primary/25",
    P3: "bg-muted text-muted-foreground",
  };
  return (dark ? darkMap : light)[id] || light.P2;
}
export const PW = { P0: 4, P1: 3, P2: 2, P3: 1 };

export const TYPES = ["Rompelínea", "Diaria", "Proyecto", "Operacional", "Seguimiento", "Mejora", "Incidente", "Reunión", "Análisis"];
export const TYPE_META = {
  "Rompelínea": { icon: Zap, color: "bg-primary" },
  "Diaria": { icon: RefreshCw, color: "bg-accent" },
  "Proyecto": { icon: Flag, color: "bg-secondary" },
  "Operacional": { icon: ListChecks, color: "bg-slate-500" },
  "Seguimiento": { icon: Clock, color: "bg-teal-500" },
  "Mejora": { icon: TrendingUp, color: "bg-emerald-500" },
  "Incidente": { icon: AlertOctagon, color: "bg-red-500" },
  "Reunión": { icon: Users, color: "bg-amber-500" },
  "Análisis": { icon: Search, color: "bg-orange-500" },
};
export const NOTIF_META = {
  assigned: { icon: User, color: "text-primary" },
  priority: { icon: Flag, color: "text-secondary" },
  mention: { icon: MessageSquare, color: "text-accent" },
  blocked: { icon: Ban, color: "text-purple-500" },
  p0: { icon: AlertTriangle, color: "text-red-500" },
  rompelinea: { icon: Zap, color: "text-primary" },
  crm_comment: { icon: MessageSquare, color: "text-secondary" },
  crm_reminder: { icon: Clock, color: "text-accent" },
};
export const FREQS = ["Diaria", "Días hábiles", "Semanal", "Quincenal", "Mensual", "Personalizada"];
export const IMPACTS = ["Alto", "Medio", "Bajo"];
export const EFFORTS = ["Alto", "Medio", "Bajo"];
export const EW = { Alto: 3, Medio: 2, Bajo: 1 };

export function riskCls(risk, dark) {
  const light = { "Vencida": "bg-red-50 text-red-700", "Bloqueada": "bg-purple-50 text-purple-700", "Atención": "bg-amber-50 text-amber-700", "En plazo": "bg-emerald-50 text-emerald-700" };
  const darkMap = { "Vencida": "bg-red-500/15 text-red-400", "Bloqueada": "bg-purple-500/15 text-purple-400", "Atención": "bg-amber-500/15 text-amber-400", "En plazo": "bg-emerald-500/15 text-emerald-400" };
  return (dark ? darkMap : light)[risk];
}
export const RISK_ICON = { "Vencida": AlertTriangle, "Bloqueada": Ban, "Atención": Clock, "En plazo": CheckCircle2 };

export const PROJECT_PALETTE = [
  { light: "bg-primary/10 text-primary", dark: "bg-primary/15 text-primary" },
  { light: "bg-secondary/10 text-secondary", dark: "bg-secondary/15 text-secondary" },
  { light: "bg-amber-50 text-amber-700", dark: "bg-accent/15 text-accent" },
  { light: "bg-emerald-50 text-emerald-700", dark: "bg-emerald-500/15 text-emerald-400" },
  { light: "bg-rose-50 text-rose-700", dark: "bg-rose-500/15 text-rose-400" },
  { light: "bg-cyan-50 text-cyan-700", dark: "bg-cyan-500/15 text-cyan-400" },
];
export function projectCls(name, dark) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const p = PROJECT_PALETTE[h % PROJECT_PALETTE.length];
  return dark ? p.dark : p.light;
}
