import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useSearchParams } from "react-router-dom";
import {
  Instagram as InstagramIcon,
  MousePointerClick,
  Users,
  FileText,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Copy,
  Link2,
  Send,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { ContentScheduler } from "@/components/instagram/ContentScheduler";
import { InboxPanel } from "@/components/instagram/InboxPanel";
import { AnalyticsPanel } from "@/components/instagram/AnalyticsPanel";
import { useBestTimes } from "@/components/instagram/analytics";
import { PostsPanel } from "@/components/instagram/PostsPanel";
import { ResourcesManager, LINK_BASE, type Recurso } from "@/components/instagram/ResourcesManager";

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------
type Campaign = {
  id?: string;
  nombre: string;
  activa: boolean;
  prioridad: number;
  media_ids: string[];
  /** general = todos los posts · posts = solo sus videos (publicados o programados) */
  alcance?: "general" | "posts";
  keywords: string[];
  match_mode: "contiene" | "exacta" | "cualquiera";
  responder_dm: boolean;
  modo: "directo" | "dos_pasos";
  mensaje_inicial: string;
  boton_texto: string;
  mensaje_oferta: string;
  link_url: string | null;
  link_titulo: string;
  respuestas_publicas: string[];
  delay_segundos: number;
  una_vez_por_usuario: boolean;
  utm_activo: boolean;
  rastrear_clics: boolean;
  requiere_seguir?: boolean;
  mensaje_seguir?: string;
  mensaje_no_sigue?: string;
  activa_desde?: string | null;
  activa_hasta?: string | null;
};

type ScheduledPost = {
  id: string;
  tipo: string;
  caption: string;
  publicar_en: string;
  estado: string;
  campaign_id: string | null;
  media_url: string;
  es_video: boolean;
};

const scopeOf = (c: Pick<Campaign, "alcance" | "media_ids">): "general" | "posts" =>
  c.alcance ?? (c.media_ids.length ? "posts" : "general");

type IgSettings = {
  crm_sync: boolean;
  crm_owner_id: string | null;
  ai_enabled: boolean;
  ai_prompt: string;
  ai_link: string | null;
  ai_max_turnos_dia: number;
  story_mention_activo?: boolean;
  story_mention_mensaje?: string;
  story_mention_link?: string | null;
};

type IgContact = {
  ig_user_id: string;
  username: string | null;
  primer_contacto: string;
  ultimo_contacto: string;
  total_comentarios: number;
  oferta_enviada_at: string | null;
  ultima_campaign_id: string | null;
  cliente_id: string | null;
  clics: number;
  ai_pausado_hasta: string | null;
  notas: string | null;
  no_contactar?: boolean;
  menciones?: number;
};

type Funnel = {
  comentarios: number;
  con_campania: number;
  dms_enviados: number;
  ofertas: number;
  errores: number;
  clics: number;
  personas_clic: number;
  leads_crm: number;
  presupuestos: number;
  aprobados: number;
  ingresos: number;
  conversaciones_ia: number;
  por_campania: { campaign_id: string; enviados: number; ofertas: number; clics: number; leads: number }[];
};

type AccountStatus = {
  connected: boolean;
  ig_user_id: string | null;
  username: string | null;
  token_expires_at: string | null;
  token_refreshed_at: string | null;
  subscribed_fields: string[] | null;
};

type IgEvent = {
  id: number;
  comment_id: string;
  media_id: string | null;
  from_username: string | null;
  texto: string | null;
  campaign_id: string | null;
  estado: "recibido" | "enviado" | "omitido" | "error";
  motivo: string | null;
  public_reply_ok: boolean | null;
  oferta_enviada_at: string | null;
  created_at: string;
};

type Media = {
  id: string;
  caption?: string;
  media_type?: string;
  media_product_type?: string;
  thumbnail_url?: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
  comments_count?: number;
};

const FUNCTION_NAME = "instagram-webhook";
const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`;

const EMPTY_CAMPAIGN: Campaign = {
  nombre: "",
  activa: false,
  prioridad: 0,
  media_ids: [],
  alcance: "general",
  keywords: [],
  match_mode: "contiene",
  responder_dm: false,
  modo: "dos_pasos",
  mensaje_inicial: "¡Hola {username}! 👋 Vi tu comentario. ¿Te mando la info por aquí? Toca el botón 👇",
  boton_texto: "Sí, envíamela",
  mensaje_oferta: "Aquí tienes toda la info 🚀",
  link_url: "",
  link_titulo: "Ver oferta",
  respuestas_publicas: ["¡Te escribí por DM, {username}! 📩"],
  delay_segundos: 0,
  una_vez_por_usuario: true,
  utm_activo: true,
  rastrear_clics: false,
  requiere_seguir: false,
  mensaje_seguir: "¡Hola {username}! 🙌 Para enviarte el contenido, primero sígueme y luego toca el botón 👇",
  mensaje_no_sigue: "Aún no me sigues 👀 Sígueme y vuelve a tocar el botón para recibirlo.",
  activa_desde: null,
  activa_hasta: null,
};

// datetime-local <-> ISO
const isoToLocal = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const localToIso = (v: string) => (v ? new Date(v).toISOString() : null);

const V4_FIELDS = ["requiere_seguir", "mensaje_seguir", "mensaje_no_sigue", "activa_desde", "activa_hasta"] as const;

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
const clp = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n || 0);

const ESTADO_STYLES: Record<IgEvent["estado"], string> = {
  enviado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  omitido: "bg-muted text-muted-foreground border-border",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
  recibido: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const preview = (tpl: string, username = "maria.perez") =>
  (tpl || "").replace(/\{username\}|\{nombre\}/g, `@${username}`);

type IgResult = {
  ok?: boolean;
  error?: string;
  username?: string;
  subscribed?: boolean;
  subscribe_error?: string;
  media?: Media[];
  match?: { id: string; nombre: string; modo: string } | null;
  private_reply?: string;
  boton?: string | null;
  oferta?: string;
  link?: string | null;
  rastreo?: boolean;
  reply?: string;
  handoff?: boolean;
  ai_provider?: string | null;
  motivo?: string;
  solo_posts?: number;
  alcance?: "general" | "posts";
  tambien?: string[];
};

async function invokeIg(body: Record<string, unknown>): Promise<IgResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body });
  if (error) {
    // Intentar leer el mensaje de error del cuerpo
    let msg = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx?.json) msg = (await ctx.json())?.error ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return data as IgResult;
}

// -----------------------------------------------------------------------------
// Página
// -----------------------------------------------------------------------------
const TABS = ["campanias", "analitica", "bandeja", "publicaciones", "contenido", "archivos", "leads", "actividad"] as const;

export default function Instagram() {
  // Pestaña activa en la URL (?tab=bandeja): sobrevive a recargas y se puede compartir
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab") ?? "";
  const tab = (TABS as readonly string[]).includes(tabParam) ? tabParam : "campanias";
  const tabsRef = useRef<HTMLDivElement>(null);
  const [unread, setUnread] = useState(0);
  const { best, reload: reloadBest } = useBestTimes();
  const [presetDate, setPresetDate] = useState<Date | null>(null);
  const changeTab = (v: string) => {
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set("tab", v);
      return n;
    }, { replace: true });
    // Paneles a pantalla completa: llevar las pestañas arriba
    if (v === "bandeja" || v === "publicaciones") {
      requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [events, setEvents] = useState<IgEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [tokenInput, setTokenInput] = useState("");
  const [connecting, setConnecting] = useState(false);

  const [editing, setEditing] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  // Videos programados (aún no publicados) y los vinculados a la campaña en edición
  const [scheduled, setScheduled] = useState<ScheduledPost[]>([]);
  const [linkedPosts, setLinkedPosts] = useState<string[]>([]);
  const [v5, setV5] = useState(false);

  const [media, setMedia] = useState<Media[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const [simText, setSimText] = useState("info");
  const [simResult, setSimResult] = useState<IgResult | null>(null);

  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [contacts, setContacts] = useState<IgContact[]>([]);
  const [recursos, setRecursos] = useState<Pick<Recurso, "slug" | "titulo">[]>([]);
  const [v4, setV4] = useState(false);
  const [settings, setSettings] = useState<IgSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [st, cs, ev, fn, ct, se] = await Promise.all([
      supabaseCRM.rpc("ig_account_status"),
      supabaseCRM.from("ig_campaigns").select("*").order("prioridad", { ascending: false }).order("created_at"),
      supabaseCRM.from("ig_comment_events").select("*").order("created_at", { ascending: false }).limit(300),
      supabaseCRM.rpc("ig_funnel_stats"),
      supabaseCRM.from("ig_contacts").select("*").order("ultimo_contacto", { ascending: false }).limit(200),
      supabaseCRM.from("ig_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (st.error) toast.error(`Estado IG: ${st.error.message}`);
    setStatus((st.data as AccountStatus[] | null)?.[0] ?? null);
    if (cs.error) toast.error(`Campañas: ${cs.error.message}`);
    setCampaigns((cs.data as Campaign[]) ?? []);
    setEvents((ev.data as IgEvent[]) ?? []);
    // Las tablas/RPC nuevas pueden no existir aún si la migración 20261101_02 no se aplicó
    setFunnel(fn.error ? null : (fn.data as Funnel));
    setContacts(ct.error ? [] : ((ct.data as IgContact[]) ?? []));
    setSettings(se.error ? null : ((se.data as IgSettings | null) ?? null));
    setLoading(false);
    // Migración 20261101_04 (seguir, fechas, contenido, archivos)
    const rs = await supabaseCRM.from("ig_recursos").select("slug, titulo").order("created_at", { ascending: false });
    setV4(!rs.error);
    setRecursos((rs.data as Pick<Recurso, "slug" | "titulo">[]) ?? []);
    // Migración 20261102_05 (campañas generales vs. de video) y videos programados
    const [al, sp] = await Promise.all([
      supabaseCRM.from("ig_campaigns").select("alcance").limit(1),
      supabaseCRM
        .from("ig_posts")
        .select("id, tipo, caption, publicar_en, estado, campaign_id, media_url, es_video")
        .in("estado", ["programado", "procesando", "error"])
        .order("publicar_en"),
    ]);
    setV5(!al.error);
    setScheduled(sp.error ? [] : ((sp.data as ScheduledPost[]) ?? []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const campaignName = useMemo(() => {
    const m = new Map<string, string>();
    campaigns.forEach((c) => c.id && m.set(c.id, c.nombre));
    return m;
  }, [campaigns]);

  // Embudo: server-side (ig_funnel_stats) o, si la migración no está aplicada, últimos 300 eventos
  const stats = useMemo(() => {
    if (funnel) {
      return {
        comentarios: funnel.comentarios,
        enviados: funnel.dms_enviados,
        ofertas: funnel.ofertas,
        errores: funnel.errores,
        clics: funnel.clics,
        personasClic: funnel.personas_clic,
        leads: funnel.leads_crm,
        presupuestos: funnel.presupuestos,
        aprobados: funnel.aprobados,
        ingresos: Number(funnel.ingresos) || 0,
        conversacionesIa: funnel.conversaciones_ia,
      };
    }
    return {
      comentarios: events.length,
      enviados: events.filter((e) => e.estado === "enviado").length,
      ofertas: events.filter((e) => e.oferta_enviada_at).length,
      errores: events.filter((e) => e.estado === "error").length,
      clics: 0,
      personasClic: 0,
      leads: 0,
      presupuestos: 0,
      aprobados: 0,
      ingresos: 0,
      conversacionesIa: 0,
    };
  }, [events, funnel]);

  const campaignStats = useMemo(() => {
    const m = new Map<string, Funnel["por_campania"][number]>();
    funnel?.por_campania?.forEach((p) => m.set(p.campaign_id, p));
    return m;
  }, [funnel]);

  const daysLeft = status?.token_expires_at
    ? Math.round((new Date(status.token_expires_at).getTime() - Date.now()) / 86400000)
    : null;

  // ---------------------------------------------------------------------------
  // Acciones
  // ---------------------------------------------------------------------------
  const handleConnect = async () => {
    if (!tokenInput.trim()) return toast.error("Pega el token de acceso de Instagram");
    setConnecting(true);
    try {
      const r = await invokeIg({ action: "connect", access_token: tokenInput.trim() });
      if (!r.ok) throw new Error(r.error);
      toast.success(`Conectado como @${r.username}`);
      if (!r.subscribed) toast.warning(`Conectado, pero la suscripción a webhooks falló: ${r.subscribe_error}`);
      setTokenInput("");
      load();
    } catch (e) {
      toast.error((e as Error).message || "No se pudo conectar");
    } finally {
      setConnecting(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const r = await invokeIg({ action: "subscribe" });
      if (!r.ok) throw new Error(r.error);
      toast.success("Webhooks re-suscritos (comments, messages)");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleLoadMedia = async () => {
    setLoadingMedia(true);
    try {
      const r = await invokeIg({ action: "list_media" });
      if (!r.ok) throw new Error(r.error);
      setMedia(r.media ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleSimulate = async () => {
    try {
      setSimResult(await invokeIg({ action: "simulate", text: simText, username: "maria.perez" }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleActive = async (c: Campaign) => {
    const { error } = await supabaseCRM.from("ig_campaigns").update({ activa: !c.activa }).eq("id", c.id);
    if (error) return toast.error(error.message);
    setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, activa: !c.activa } : x)));
  };

  const deleteCampaign = async (c: Campaign) => {
    if (!confirm(`¿Eliminar la campaña "${c.nombre}"?`)) return;
    const { error } = await supabaseCRM.from("ig_campaigns").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Campaña eliminada");
    load();
  };

  const openEditor = (c: Campaign) => {
    setEditing({ ...c, alcance: scopeOf(c) });
    setLinkedPosts(c.id ? scheduled.filter((p) => p.campaign_id === c.id).map((p) => p.id) : []);
  };

  const saveCampaign = async () => {
    if (!editing) return;
    if (!editing.nombre.trim()) return toast.error("Ponle un nombre a la campaña");
    if (!editing.mensaje_oferta.trim()) return toast.error("El mensaje de la oferta es obligatorio");
    if (editing.link_url && !/^https?:\/\//i.test(editing.link_url)) return toast.error("El link debe partir con https://");
    setSaving(true);
    const { id, ...rest } = editing;
    // Si la migración 20261101_02 aún no está aplicada, no enviar columnas que no existen
    const { utm_activo, rastrear_clics, ...base } = rest;
    const withV2: Record<string, unknown> = settings ? { ...base, utm_activo, rastrear_clics } : { ...base };
    if (v4) {
      withV2.activa_desde = editing.activa_desde || null;
      withV2.activa_hasta = editing.activa_hasta || null;
    } else {
      for (const f of V4_FIELDS) delete withV2[f];
    }
    if (editing.activa_desde && editing.activa_hasta && editing.activa_hasta <= editing.activa_desde) {
      setSaving(false);
      return toast.error("La fecha de término debe ser posterior al inicio");
    }
    const scope = scopeOf(editing);
    if (scope === "posts" && !editing.media_ids.length && !linkedPosts.length) {
      setSaving(false);
      return toast.error("Campaña de video: elige al menos un reel publicado o un video programado");
    }
    if (scope === "general") withV2.media_ids = [];
    if (v5) withV2.alcance = scope;
    else delete withV2.alcance;
    const payload = withV2 as typeof base;
    const row = {
      ...withV2,
      link_url: payload.link_url?.trim() || null,
      keywords: payload.keywords.map((k) => k.trim()).filter(Boolean),
      respuestas_publicas: payload.respuestas_publicas.map((r) => r.trim()).filter(Boolean),
    };
    const { data: saved, error } = id
      ? await supabaseCRM.from("ig_campaigns").update(row).eq("id", id).select("id").single()
      : await supabaseCRM.from("ig_campaigns").insert(row).select("id").single();
    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }
    // Vincular / desvincular videos programados (al publicarse se suman a la campaña)
    const campId = (saved as { id: string } | null)?.id ?? id;
    if (campId && scope === "posts") {
      const before = scheduled.filter((p) => p.campaign_id === campId).map((p) => p.id);
      const add = linkedPosts.filter((x) => !before.includes(x));
      const remove = before.filter((x) => !linkedPosts.includes(x));
      const results = await Promise.all([
        add.length ? supabaseCRM.from("ig_posts").update({ campaign_id: campId }).in("id", add) : null,
        remove.length ? supabaseCRM.from("ig_posts").update({ campaign_id: null }).in("id", remove) : null,
      ]);
      const linkErr = results.find((r) => r?.error)?.error;
      if (linkErr) toast.error(`Videos programados: ${linkErr.message}`);
    }
    setSaving(false);
    toast.success("Campaña guardada");
    setEditing(null);
    load();
  };

  const saveMention = async (patch: Partial<IgSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    const { error } = await supabaseCRM
      .from("ig_settings")
      .update({
        story_mention_activo: !!next.story_mention_activo,
        story_mention_mensaje: next.story_mention_mensaje ?? "",
        story_mention_link: next.story_mention_link?.trim() || null,
      })
      .eq("id", 1);
    if (error) return toast.error(error.message);
    setSettings(next);
    toast.success("Menciones en historias guardado");
  };

  const saveSettings = async (patch?: Partial<IgSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSavingSettings(true);
    const { error } = await supabaseCRM
      .from("ig_settings")
      .update({
        crm_sync: next.crm_sync,
        ai_enabled: next.ai_enabled,
        ai_prompt: next.ai_prompt,
        ai_link: next.ai_link?.trim() || null,
        ai_max_turnos_dia: Math.min(100, Math.max(1, Number(next.ai_max_turnos_dia) || 15)),
      })
      .eq("id", 1);
    setSavingSettings(false);
    if (error) return toast.error(error.message);
    setSettings(next);
    toast.success("Configuración guardada");
  };


  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado");
  };

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-heading font-bold gradient-text flex items-center gap-2">
            <InstagramIcon className="w-5 h-5 text-primary" />
            Instagram Auto-DM
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cuando alguien comenta tus reels, le llega por DM lo que estás ofreciendo. Sin ManyChat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={load} className="h-8 text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
          </Button>
          <Button
            size="sm"
            onClick={() => openEditor({ ...EMPTY_CAMPAIGN })}
            className="h-8 text-xs px-3 gradient-button font-heading font-semibold gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva campaña
          </Button>
        </div>
      </div>

      {/* Conexión */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {status?.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            )}
            <p className="text-sm font-semibold">
              {status?.connected ? `Conectado como @${status.username}` : "Cuenta de Instagram no conectada"}
            </p>
            {status?.connected && daysLeft !== null && (
              <Badge variant="outline" className={daysLeft < 10 ? "text-orange-400 border-orange-500/40" : ""}>
                Token: {daysLeft} días (se valida/renueva cada lunes)
              </Badge>
            )}
            {status?.connected && daysLeft === null && (
              <Badge variant="outline">Token de página sin vencimiento</Badge>
            )}
          </div>
          {status?.connected && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleSubscribe}>
              Re-suscribir webhooks
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Callback URL (pégala en Meta → Webhooks)</Label>
            <div className="flex gap-2">
              <Input readOnly value={WEBHOOK_URL} className="h-8 text-xs font-mono" />
              <Button size="sm" variant="outline" className="h-8" onClick={() => copy(WEBHOOK_URL)}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">
              {status?.connected ? "Reemplazar token (opcional)" : "Token de acceso de Instagram (Generate token en Meta)"}
            </Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="IGAA..."
                className="h-8 text-xs font-mono"
              />
              <Button size="sm" className="h-8 text-xs gradient-button" onClick={handleConnect} disabled={connecting}>
                {connecting ? "Conectando..." : "Conectar"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Embudo de ventas */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Embudo de ventas</h2>
          {!funnel && !loading && (
            <span className="text-[11px] text-orange-400">Aplica la migración 20261101_02 para ver clics, leads y ventas</span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Comentarios", value: stats.comentarios, sub: null, icon: MessageCircle },
            { label: "DMs enviados", value: stats.enviados, sub: pct(stats.enviados, stats.comentarios), icon: Send },
            { label: "Ofertas", value: stats.ofertas, sub: pct(stats.ofertas, stats.enviados), icon: Link2 },
            { label: "Clics", value: stats.clics, sub: `${stats.personasClic} personas`, icon: MousePointerClick },
            { label: "Leads CRM", value: stats.leads, sub: pct(stats.leads, stats.ofertas), icon: Users },
            { label: "Presupuestos", value: stats.presupuestos, sub: `${stats.aprobados} aprobados`, icon: FileText },
            { label: "Ventas", value: clp(stats.ingresos), sub: pct(stats.aprobados, stats.leads), icon: DollarSign },
            { label: "Errores", value: stats.errores, sub: null, icon: AlertTriangle },
          ].map((s) => (
            <Card key={s.label} className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <s.icon className="w-3.5 h-3.5" /> {s.label}
              </div>
              <p className="text-xl font-bold mt-1 truncate">{s.value}</p>
              {s.sub && <p className="text-[10px] text-muted-foreground">{s.sub}</p>}
            </Card>
          ))}
        </div>
      </div>

      <Tabs ref={tabsRef} value={tab} onValueChange={changeTab} className="space-y-3 scroll-mt-4">
        <TabsList className="flex flex-wrap h-auto justify-start">
          <TabsTrigger value="campanias" className="text-xs">Campañas</TabsTrigger>
          <TabsTrigger value="analitica" className="text-xs">Analítica</TabsTrigger>
          <TabsTrigger value="bandeja" className="text-xs gap-1">
            Bandeja
            {unread > 0 && <span className="rounded-full bg-primary text-primary-foreground px-1.5 text-[10px] leading-4">{unread}</span>}
          </TabsTrigger>
          <TabsTrigger value="publicaciones" className="text-xs">Publicaciones</TabsTrigger>
          <TabsTrigger value="contenido" className="text-xs">Contenido</TabsTrigger>
          <TabsTrigger value="archivos" className="text-xs">Archivos</TabsTrigger>
          <TabsTrigger value="leads" className="text-xs">Leads ({contacts.length})</TabsTrigger>
          <TabsTrigger value="actividad" className="text-xs">Actividad</TabsTrigger>
        </TabsList>

      <TabsContent value="campanias" className="space-y-4">
      {settings && settings.story_mention_activo !== undefined && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Menciones en historias</h2>
              <p className="text-xs text-muted-foreground">
                Cuando alguien te menciona en su historia, le agradeces por DM automáticamente (máx. 1 vez cada 12 h por persona).
                Las menciones se cuentan en Leads.
              </p>
            </div>
            <Switch
              checked={!!settings.story_mention_activo}
              onCheckedChange={(v) => saveMention({ story_mention_activo: v })}
            />
          </div>
          {settings.story_mention_activo && (
            <div className="grid sm:grid-cols-[1fr_260px] gap-3">
              <Textarea
                rows={2}
                value={settings.story_mention_mensaje ?? ""}
                onChange={(e) => setSettings({ ...settings, story_mention_mensaje: e.target.value })}
                onBlur={() => saveMention({})}
                placeholder="¡Gracias por mencionarme, {username}! 🙌"
                className="text-xs"
              />
              <div className="space-y-1">
                <Input
                  value={settings.story_mention_link ?? ""}
                  onChange={(e) => setSettings({ ...settings, story_mention_link: e.target.value })}
                  onBlur={() => saveMention({})}
                  placeholder="Link opcional (cupón, PDF…)"
                  className="h-8 text-xs"
                />
                {recursos.length > 0 && (
                  <Select value="" onValueChange={(v) => saveMention({ story_mention_link: `${LINK_BASE}${v}` })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="…o un archivo subido" /></SelectTrigger>
                    <SelectContent>
                      {recursos.map((r) => <SelectItem key={r.slug} value={r.slug}>{r.titulo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
      {/* Campañas */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Campañas</h2>
        {campaigns.length === 0 && !loading ? (
          <EmptyState
            icon={InstagramIcon}
            title="Sin campañas"
            description="Crea una campaña: elige la palabra clave, el reel y el mensaje que quieres enviar."
            actionLabel="Nueva campaña"
            onAction={() => openEditor({ ...EMPTY_CAMPAIGN })}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {campaigns.map((c) => {
              const cs = c.id ? campaignStats.get(c.id) : undefined;
              const sent = cs?.enviados ?? events.filter((e) => e.campaign_id === c.id && e.estado === "enviado").length;
              return (
                <Card key={c.id} className={`p-4 space-y-2 ${c.activa ? "border-primary/40" : "opacity-80"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.modo === "dos_pasos" ? "Dos pasos (botón → link)" : "Directo (link en el 1er DM)"} ·{" "}
                        {(() => {
                          if (scopeOf(c) === "general") return "General · todos los posts";
                          const prog = scheduled.filter((p) => p.campaign_id === c.id).length;
                          const parts = [
                            c.media_ids.length ? `${c.media_ids.length} publicado(s)` : "",
                            prog ? `${prog} programado(s)` : "",
                          ].filter(Boolean);
                          return `🎬 De video · ${parts.join(" + ") || "sin videos"}`;
                        })()}{" "}
                        ·
                        prioridad {c.prioridad}
                      </p>
                    </div>
                    <Switch checked={c.activa} onCheckedChange={() => toggleActive(c)} />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.match_mode === "cualquiera" || c.keywords.length === 0 ? (
                      <Badge variant="secondary" className="text-[10px]">Cualquier comentario</Badge>
                    ) : (
                      c.keywords.map((k) => (
                        <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{preview(c.mensaje_oferta)}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      {sent} DMs{cs ? ` · ${cs.ofertas} ofertas · ${cs.clics} clics · ${cs.leads} leads` : " enviados"}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditor(c)} title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        title="Duplicar"
                        onClick={() => {
                          const { id, ...rest } = c;
                          openEditor({ ...rest, nombre: `${c.nombre} (copia)`, activa: false });
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => deleteCampaign(c)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Simulador */}
      <Card className="p-4 space-y-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-primary" /> Probar sin publicar
        </h2>
        <p className="text-xs text-muted-foreground">
          Escribe un comentario de ejemplo y verás qué campaña activa responde y con qué mensaje (no envía nada).
        </p>
        <div className="flex gap-2">
          <Input value={simText} onChange={(e) => setSimText(e.target.value)} className="h-8 text-xs" />
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSimulate}>
            Simular
          </Button>
        </div>
        {simResult && (
          <div className="text-xs rounded-lg bg-muted/40 p-3 space-y-1">
            {simResult.match ? (
              <>
                <p><b>Campaña:</b> {simResult.match.nombre}</p>
                {simResult.alcance === "posts" && (
                  <p className="text-amber-600 dark:text-amber-400">
                    🎬 Campaña de video: solo responde en {simResult.solo_posts ? `${simResult.solo_posts} post(s)` : "sus videos (aún sin publicar)"}. En otros posts no se activa.
                  </p>
                )}
                {!!simResult.tambien?.length && (
                  <p className="text-muted-foreground">También calzan (en sus videos): {simResult.tambien.join(", ")}</p>
                )}
                <p><b>DM 1:</b> {simResult.private_reply}</p>
                {simResult.boton && <p><b>Botón:</b> [{simResult.boton}]</p>}
                {simResult.match.modo === "dos_pasos" && <p><b>Al tocar el botón:</b> {simResult.oferta}</p>}
                {simResult.link && (
                  <p className="break-all">
                    <b>Link:</b> {simResult.link}
                    {simResult.rastreo && <span className="text-muted-foreground"> (se enviará como link rastreable)</span>}
                  </p>
                )}
              </>
            ) : (
              <p>{simResult.motivo ?? "Ninguna campaña activa responde a ese comentario."}</p>
            )}
          </div>
        )}
      </Card>

      </TabsContent>

      {/* Leads */}
      <TabsContent value="leads">
        <Card className="p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Leads de Instagram</h2>
            {settings && (
              <div className="flex items-center gap-2">
                <Label className="text-xs">Crear cliente + oportunidad en el CRM al entregar la oferta</Label>
                <Switch checked={settings.crm_sync} onCheckedChange={(v) => saveSettings({ crm_sync: v })} disabled={savingSettings} />
              </div>
            )}
          </div>
          {contacts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aún no hay contactos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground text-left">
                  <tr>
                    <th className="py-1.5 pr-3">Usuario</th>
                    <th className="py-1.5 pr-3">Último contacto</th>
                    <th className="py-1.5 pr-3">Coment.</th>
                    <th className="py-1.5 pr-3">Campaña</th>
                    <th className="py-1.5 pr-3">Oferta</th>
                    <th className="py-1.5 pr-3">Clics</th>
                    <th className="py-1.5 pr-3" title="Menciones en historias">Menc.</th>
                    <th className="py-1.5">CRM</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => {
                    return (
                      <tr key={c.ig_user_id} className="border-t border-border/50 align-top">
                        <td className="py-1.5 pr-3">
                          {c.username ? (
                            <a href={`https://instagram.com/${c.username}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                              @{c.username}
                            </a>
                          ) : (
                            <span className="text-muted-foreground font-mono">{c.ig_user_id.slice(0, 10)}…</span>
                          )}
                        </td>
                        <td className="py-1.5 pr-3 whitespace-nowrap">
                          {new Date(c.ultimo_contacto).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="py-1.5 pr-3">{c.total_comentarios}</td>
                        <td className="py-1.5 pr-3">{c.ultima_campaign_id ? campaignName.get(c.ultima_campaign_id) ?? "—" : "—"}</td>
                        <td className="py-1.5 pr-3">{c.no_contactar ? <span className="text-red-400" title="Pidió no ser contactado (STOP)">STOP</span> : c.oferta_enviada_at ? "✅" : ""}</td>
                        <td className="py-1.5 pr-3">{c.clics || ""}</td>
                        <td className="py-1.5 pr-3">{c.menciones || ""}</td>
                        <td className="py-1.5 pr-3">
                          {c.cliente_id ? (
                            <Link to={`/clientes/${c.cliente_id}`} className="text-primary hover:underline">Ver cliente</Link>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </TabsContent>

      <TabsContent value="analitica">
        <AnalyticsPanel
          invoke={invokeIg as (b: Record<string, unknown>) => Promise<Record<string, unknown>>}
          connected={!!status?.connected}
          best={best}
          onReloadBest={reloadBest}
          onSchedule={(d) => {
            setPresetDate(d);
            changeTab("contenido");
            toast.success(`Fecha sugerida: ${d.toLocaleString("es-CL", { weekday: "long", hour: "2-digit", minute: "2-digit" })}. Sube tu contenido y programa.`);
          }}
        />
      </TabsContent>

      {/* Montada siempre: mantiene el contador de "sin responder" aunque estés en otra pestaña */}
      <TabsContent value="bandeja" forceMount className="data-[state=inactive]:hidden">
        <InboxPanel
          invoke={invokeIg as (b: Record<string, unknown>) => Promise<Record<string, unknown>>}
          connected={!!status?.connected}
          onUnread={setUnread}
          quickReplies={recursos.map((r) => `Aquí tienes ${r.titulo} 👉 ${LINK_BASE}${r.slug}`)}
        />
      </TabsContent>

      <TabsContent value="publicaciones">
        <PostsPanel
          invoke={invokeIg as (b: Record<string, unknown>) => Promise<Record<string, unknown>>}
          connected={!!status?.connected}
          campaigns={campaigns}
          onNewCampaign={(mediaId) => openEditor({ ...EMPTY_CAMPAIGN, alcance: "posts", media_ids: [mediaId] })}
        />
      </TabsContent>

      <TabsContent value="contenido">
        <ContentScheduler
          campaigns={campaigns.map((c) => ({ id: c.id, nombre: c.nombre, alcance: scopeOf(c) }))}
          connected={!!status?.connected}
          invoke={invokeIg}
          onPublished={load}
          bestSlots={best?.top ?? []}
          presetDate={presetDate}
        />
      </TabsContent>

      <TabsContent value="archivos">
        <ResourcesManager onChange={load} />
      </TabsContent>

      <TabsContent value="actividad">
      {/* Actividad */}
      <Card className="p-4 space-y-2">
        <h2 className="text-sm font-semibold">Actividad reciente</h2>
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aún no llegan comentarios.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground text-left">
                <tr>
                  <th className="py-1.5 pr-3">Fecha</th>
                  <th className="py-1.5 pr-3">Usuario</th>
                  <th className="py-1.5 pr-3">Comentario</th>
                  <th className="py-1.5 pr-3">Campaña</th>
                  <th className="py-1.5 pr-3">Estado</th>
                  <th className="py-1.5">Oferta</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 50).map((e) => (
                  <tr key={e.id} className="border-t border-border/50 align-top">
                    <td className="py-1.5 pr-3 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-1.5 pr-3">
                      {e.from_username ? (
                        <a href={`https://instagram.com/${e.from_username}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          @{e.from_username}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="py-1.5 pr-3 max-w-[220px] truncate" title={e.texto ?? ""}>{e.texto}</td>
                    <td className="py-1.5 pr-3">{e.campaign_id ? campaignName.get(e.campaign_id) ?? "—" : "—"}</td>
                    <td className="py-1.5 pr-3">
                      <Badge variant="outline" className={`text-[10px] ${ESTADO_STYLES[e.estado]}`} title={e.motivo ?? ""}>
                        {e.estado}
                      </Badge>
                      {e.motivo && <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[180px] truncate" title={e.motivo}>{e.motivo}</p>}
                    </td>
                    <td className="py-1.5">{e.oferta_enviada_at ? "✅" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </TabsContent>
      </Tabs>

      {/* Editor de campaña */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar campaña" : "Nueva campaña"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input value={editing.nombre} onChange={(e) => setEditing({ ...editing, nombre: e.target.value })} placeholder="Reel landing pages - comenta WEB" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Prioridad</Label>
                  <Input type="number" value={editing.prioridad} onChange={(e) => setEditing({ ...editing, prioridad: Number(e.target.value) || 0 })} />
                </div>
              </div>

              {/* Disparador */}
              <div className="rounded-lg border border-border/60 p-3 space-y-3">
                <p className="text-xs font-semibold">1. ¿Cuándo se dispara?</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Palabras clave (separadas por coma)</Label>
                    <Input
                      value={editing.keywords.join(", ")}
                      onChange={(e) => setEditing({ ...editing, keywords: e.target.value.split(",") })}
                      placeholder="info, precio, quiero, web"
                      disabled={editing.match_mode === "cualquiera"}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Coincidencia</Label>
                    <Select value={editing.match_mode} onValueChange={(v) => setEditing({ ...editing, match_mode: v as Campaign["match_mode"] })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contiene">Contiene la palabra</SelectItem>
                        <SelectItem value="exacta">Comentario exacto</SelectItem>
                        <SelectItem value="cualquiera">Cualquier comentario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">¿Dónde responde?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ["general", "🌐 General", "Todos los posts, salvo que una campaña de video calce primero"],
                        ["posts", "🎬 De video", "Solo en los videos que elijas (publicados o programados)"],
                      ] as const
                    ).map(([val, title, desc]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEditing({ ...editing, alcance: val })}
                        className={`text-left rounded-md border-2 px-3 py-2 ${scopeOf(editing) === val ? "border-primary bg-primary/5" : "border-border/60 opacity-80 hover:opacity-100"}`}
                      >
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {scopeOf(editing) === "posts" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">
                      Reels publicados: {editing.media_ids.length ? `${editing.media_ids.length} seleccionado(s)` : "ninguno"}
                    </Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleLoadMedia} disabled={loadingMedia || !status?.connected}>
                        <ImageIcon className="w-3.5 h-3.5" /> {loadingMedia ? "Cargando..." : "Elegir reels"}
                      </Button>
                    </div>
                  </div>
                  {media.length > 0 && (
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto">
                      {media.map((m) => {
                        const selected = editing.media_ids.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            title={m.caption ?? m.id}
                            onClick={() =>
                              setEditing({
                                ...editing,
                                media_ids: selected ? editing.media_ids.filter((x) => x !== m.id) : [...editing.media_ids, m.id],
                              })
                            }
                            className={`relative aspect-square rounded-md overflow-hidden border-2 ${selected ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
                          >
                            <img src={m.thumbnail_url || m.media_url} alt="" className="w-full h-full object-cover" />
                            {selected && <CheckCircle2 className="absolute top-1 right-1 w-4 h-4 text-primary bg-background rounded-full" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <Label className="text-xs block pt-1">
                    Videos programados: {linkedPosts.length ? `${linkedPosts.length} vinculado(s)` : "ninguno"}
                  </Label>
                  {scheduled.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">No tienes videos programados. Prográmalos en la pestaña Contenido.</p>
                  ) : (
                    <div className="space-y-1 max-h-44 overflow-y-auto">
                      {scheduled.map((p) => {
                        const checked = linkedPosts.includes(p.id);
                        const otra = p.campaign_id && p.campaign_id !== editing.id ? campaigns.find((c) => c.id === p.campaign_id) : undefined;
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-2 rounded-md border px-2 py-1.5 cursor-pointer ${checked ? "border-primary bg-primary/5" : "border-border/60"}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setLinkedPosts(checked ? linkedPosts.filter((x) => x !== p.id) : [...linkedPosts, p.id])}
                            />
                            {p.es_video ? (
                              <video src={p.media_url} className="w-9 h-9 rounded object-cover" muted preload="metadata" />
                            ) : (
                              <img src={p.media_url} alt="" className="w-9 h-9 rounded object-cover" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs truncate">{p.caption || "(sin texto)"}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {p.tipo} · {new Date(p.publicar_en).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                                {p.estado !== "programado" && ` · ${p.estado}`}
                                {otra && checked === false && ` · vinculado a «${otra.nombre}»`}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Al publicarse, el video se suma solo a esta campaña. En otros videos esta campaña no responde.
                  </p>
                </div>
                )}

                <div className="flex items-center justify-between">
                  <Label className="text-xs">También responder si escriben la palabra clave por DM</Label>
                  <Switch checked={editing.responder_dm} onCheckedChange={(v) => setEditing({ ...editing, responder_dm: v })} />
                </div>

                {v4 && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Activa desde (opcional)</Label>
                      <Input
                        type="datetime-local"
                        value={isoToLocal(editing.activa_desde)}
                        onChange={(e) => setEditing({ ...editing, activa_desde: localToIso(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Activa hasta (opcional)</Label>
                      <Input
                        type="datetime-local"
                        value={isoToLocal(editing.activa_hasta)}
                        onChange={(e) => setEditing({ ...editing, activa_hasta: localToIso(e.target.value) })}
                      />
                    </div>
                    <p className="sm:col-span-2 text-[10px] text-muted-foreground -mt-1">
                      Fuera de estas fechas la campaña no responde, aunque esté activa. Ideal para promos con plazo.
                    </p>
                  </div>
                )}
              </div>

              {/* Mensajes */}
              <div className="rounded-lg border border-border/60 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">2. ¿Qué le enviamos?</p>
                  <Select value={editing.modo} onValueChange={(v) => setEditing({ ...editing, modo: v as Campaign["modo"] })}>
                    <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dos_pasos">Dos pasos (recomendado)</SelectItem>
                      <SelectItem value="directo">Directo (link en el primer DM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Usa <code>{"{username}"}</code> para nombrar a la persona.{" "}
                  {editing.modo === "dos_pasos"
                    ? "El primer DM lleva un botón; al tocarlo se abre la conversación y llega la oferta con botón-link (mejor entrega y sin caer en spam)."
                    : "El link va en el primer DM. Más simple, pero los links en solicitudes de mensaje se ven menos."}
                </p>

                {v4 && (
                  <div className="rounded-md border border-border/60 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <Label className="text-xs">Pedir que me sigan antes de enviar</Label>
                        <p className="text-[10px] text-muted-foreground">
                          Primer DM pide seguirte con un botón “Ya te sigo ✅”. Al tocarlo se verifica en Instagram: si te sigue recibe la oferta; si no, se le recuerda.
                        </p>
                      </div>
                      <Switch checked={!!editing.requiere_seguir} onCheckedChange={(v) => setEditing({ ...editing, requiere_seguir: v })} />
                    </div>
                    {editing.requiere_seguir && (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Mensaje pidiendo seguir</Label>
                          <Textarea rows={3} value={editing.mensaje_seguir ?? ""} onChange={(e) => setEditing({ ...editing, mensaje_seguir: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Si aún no te sigue</Label>
                          <Textarea rows={3} value={editing.mensaje_no_sigue ?? ""} onChange={(e) => setEditing({ ...editing, mensaje_no_sigue: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {editing.modo === "dos_pasos" && !editing.requiere_seguir && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Primer DM</Label>
                      <Textarea rows={3} value={editing.mensaje_inicial} onChange={(e) => setEditing({ ...editing, mensaje_inicial: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Texto del botón (máx 20)</Label>
                      <Input maxLength={20} value={editing.boton_texto} onChange={(e) => setEditing({ ...editing, boton_texto: e.target.value })} />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Mensaje con la oferta</Label>
                  <Textarea rows={4} value={editing.mensaje_oferta} onChange={(e) => setEditing({ ...editing, mensaje_oferta: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Link (landing, WhatsApp, checkout...)</Label>
                    <Input value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="https://..." />
                    {recursos.length > 0 && (
                      <Select value="" onValueChange={(v) => setEditing({ ...editing, link_url: `${LINK_BASE}${v}` })}>
                        <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="…o usar un archivo subido (PDF)" /></SelectTrigger>
                        <SelectContent>
                          {recursos.map((r) => (
                            <SelectItem key={r.slug} value={r.slug}>{r.titulo} · /r/{r.slug}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Texto botón link (máx 20)</Label>
                    <Input maxLength={20} value={editing.link_titulo} onChange={(e) => setEditing({ ...editing, link_titulo: e.target.value })} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2">
                    <Label className="text-xs">Agregar UTM al link (utm_source=instagram…)</Label>
                    <Switch checked={editing.utm_activo} onCheckedChange={(v) => setEditing({ ...editing, utm_activo: v })} />
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2">
                    <Label className="text-xs">Rastrear clics (link corto propio, cuenta quién abre)</Label>
                    <Switch checked={editing.rastrear_clics} onCheckedChange={(v) => setEditing({ ...editing, rastrear_clics: v })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Respuestas públicas en el comentario (una por línea, se elige al azar; vacío = no responder)</Label>
                  <Textarea
                    rows={3}
                    value={editing.respuestas_publicas.join("\n")}
                    onChange={(e) => setEditing({ ...editing, respuestas_publicas: e.target.value.split("\n") })}
                  />
                </div>
              </div>

              {/* Ajustes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Espera antes de responder (seg, 0–60)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={editing.delay_segundos}
                    onChange={(e) => setEditing({ ...editing, delay_segundos: Math.min(60, Math.max(0, Number(e.target.value) || 0)) })}
                  />
                </div>
                <div className="flex items-center justify-between pt-5">
                  <Label className="text-xs">Solo un DM por persona en esta campaña</Label>
                  <Switch checked={editing.una_vez_por_usuario} onCheckedChange={(v) => setEditing({ ...editing, una_vez_por_usuario: v })} />
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-2">
                <p className="font-semibold">Vista previa del DM</p>
                <div className="rounded-2xl bg-background px-3 py-2 w-fit max-w-[85%] whitespace-pre-wrap">
                  {preview(
                    editing.requiere_seguir
                      ? editing.mensaje_seguir ?? ""
                      : editing.modo === "dos_pasos"
                      ? editing.mensaje_inicial
                      : editing.mensaje_oferta,
                  )}
                  {editing.modo === "directo" && !editing.requiere_seguir && editing.link_url ? `\n\n👉 ${editing.link_url}` : ""}
                </div>
                {(editing.modo === "dos_pasos" || editing.requiere_seguir) && (
                  <>
                    <span className="inline-block rounded-full border border-primary/50 px-3 py-1 text-primary">
                      {editing.requiere_seguir ? "Ya te sigo ✅" : editing.boton_texto}
                    </span>
                    <div className="rounded-2xl bg-background px-3 py-2 w-fit max-w-[85%] whitespace-pre-wrap">
                      {preview(editing.mensaje_oferta)}
                      {editing.link_url && (
                        <div className="mt-2 rounded-md border border-border text-center py-1 text-primary">{editing.link_titulo}</div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Campaña activa</Label>
                <Switch checked={editing.activa} onCheckedChange={(v) => setEditing({ ...editing, activa: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button className="gradient-button" onClick={saveCampaign} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
