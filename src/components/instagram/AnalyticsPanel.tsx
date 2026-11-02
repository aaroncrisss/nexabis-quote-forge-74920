import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, ExternalLink, Mail, MessageCircle, RefreshCw, Send, Trophy, TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import { DIAS, slotLabel, nextOccurrence, type BestTimes } from "./analytics";

type Invoke = (body: Record<string, unknown>) => Promise<Record<string, unknown>>;

type Period = Record<string, number | string>;

type RankRow = {
  media_id: string;
  media_product_type: string | null;
  media_type: string | null;
  caption: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  publicado_at: string | null;
  likes: number | null;
  comments: number | null;
  reach: number | null;
  views: number | null;
  saved: number | null;
  shares: number | null;
  interactions: number | null;
  follows: number | null;
  profile_visits: number | null;
  avg_watch_ms: number | null;
  comentarios_bot: number;
  dms: number;
  ofertas: number;
  leads: number;
  clics: number;
};

type Settings = {
  stats_synced_at: string | null;
  followers_count: number | null;
  resumen_semanal: boolean;
  resumen_email: string | null;
  resumen_enviado_at: string | null;
  whatsapp_numero: string | null;
  resumen_por_whatsapp: boolean;
  alertas_whatsapp: boolean;
};

type Kpi = { valor: number; anterior: number; delta: number };
type Resumen = { id: number; semana_desde: string; semana_hasta: string; datos: { kpis?: Record<string, Kpi>; whatsapp?: string }; email_enviado: boolean; email_error: string | null; created_at: string };

const KPIS: { key: string; label: string; money?: boolean }[] = [
  { key: "comentarios", label: "Comentarios" },
  { key: "dms_enviados", label: "DMs automáticos" },
  { key: "ofertas", label: "Ofertas entregadas" },
  { key: "clics", label: "Clics en links" },
  { key: "mensajes_in", label: "Mensajes recibidos" },
  { key: "leads_crm", label: "Leads en CRM" },
  { key: "menciones", label: "Menciones" },
  { key: "ingresos", label: "Ingresos", money: true },
];

const SORTS: { key: keyof RankRow | "engagement" | "save_rate"; label: string }[] = [
  { key: "reach", label: "Alcance" },
  { key: "views", label: "Reproducciones" },
  { key: "engagement", label: "Tasa de interacción" },
  { key: "saved", label: "Guardados" },
  { key: "shares", label: "Compartidos" },
  { key: "leads", label: "Leads generados" },
  { key: "dms", label: "DMs enviados" },
  { key: "follows", label: "Seguidores ganados" },
  { key: "publicado_at", label: "Más recientes" },
];

const TIPO = (r: RankRow) => (r.media_product_type === "REELS" ? "Reel" : r.media_type === "CAROUSEL_ALBUM" ? "Carrusel" : "Post");
const clp = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
const num = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString("es-CL") : "—");
const rate = (a: number | null, b: number | null) => (a != null && b ? a / b : null);

export function AnalyticsPanel({
  invoke,
  connected,
  best,
  onSchedule,
  onReloadBest,
}: {
  invoke: Invoke;
  connected: boolean;
  best: BestTimes | null;
  onSchedule: (d: Date) => void;
  onReloadBest: () => void;
}) {
  const [days, setDays] = useState(7);
  const [cur, setCur] = useState<Period | null>(null);
  const [prev, setPrev] = useState<Period | null>(null);
  const [rank, setRank] = useState<RankRow[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [resumenes, setResumenes] = useState<Resumen[]>([]);
  const [ready, setReady] = useState(true);
  const [sort, setSort] = useState<string>("reach");
  const [tipo, setTipo] = useState("todos");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const now = new Date();
    const desde = new Date(now.getTime() - days * 86400_000);
    const antes = new Date(desde.getTime() - days * 86400_000);
    const [a, b, r, s, h] = await Promise.all([
      supabaseCRM.rpc("ig_period_stats", { p_desde: desde.toISOString(), p_hasta: now.toISOString() }),
      supabaseCRM.rpc("ig_period_stats", { p_desde: antes.toISOString(), p_hasta: desde.toISOString() }),
      supabaseCRM.rpc("ig_content_ranking"),
      supabaseCRM
        .from("ig_settings")
        .select("stats_synced_at, followers_count, resumen_semanal, resumen_email, resumen_enviado_at, whatsapp_numero, resumen_por_whatsapp, alertas_whatsapp")
        .eq("id", 1)
        .maybeSingle(),
      supabaseCRM.from("ig_resumenes").select("*").order("created_at", { ascending: false }).limit(8),
    ]);
    setReady(!a.error);
    setCur((a.data as Period) ?? null);
    setPrev((b.data as Period) ?? null);
    setRank((r.data as RankRow[]) ?? []);
    setSettings((s.data as Settings) ?? null);
    setResumenes((h.data as Resumen[]) ?? []);
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (key: string, body: Record<string, unknown>, ok: (r: Record<string, unknown>) => string | null) => {
    setBusy(key);
    try {
      const r = await invoke(body);
      if (r.ok === false) throw new Error(String(r.error));
      const msg = ok(r);
      if (msg) toast.success(msg);
      await load();
      if (key === "sync") onReloadBest();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const saveSettings = async (patch: Partial<Settings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    const { error } = await supabaseCRM
      .from("ig_settings")
      .update({
        resumen_semanal: next.resumen_semanal,
        resumen_email: next.resumen_email?.trim() || null,
        whatsapp_numero: next.whatsapp_numero?.replace(/[^\d+]/g, "") || null,
        resumen_por_whatsapp: next.resumen_por_whatsapp,
        alertas_whatsapp: next.alertas_whatsapp,
      })
      .eq("id", 1);
    if (error) toast.error(error.message);
  };

  // ----- Ranking -----
  const rows = useMemo(() => {
    const val = (r: RankRow): number => {
      if (sort === "engagement") return rate(r.interactions, r.reach) ?? -1;
      if (sort === "save_rate") return rate(r.saved, r.reach) ?? -1;
      if (sort === "publicado_at") return r.publicado_at ? new Date(r.publicado_at).getTime() : 0;
      const v = r[sort as keyof RankRow];
      return typeof v === "number" ? v : -1;
    };
    return rank.filter((r) => tipo === "todos" || TIPO(r) === tipo).sort((a, b) => val(b) - val(a));
  }, [rank, sort, tipo]);

  // ----- Insights automáticos -----
  const insights = useMemo(() => {
    const out: string[] = [];
    const withReach = rank.filter((r) => r.reach != null);
    if (withReach.length >= 3) {
      const byType = new Map<string, number[]>();
      for (const r of withReach) byType.set(TIPO(r), [...(byType.get(TIPO(r)) ?? []), r.reach!]);
      const avgs = [...byType.entries()].map(([t, v]) => ({ t, avg: v.reduce((a, b) => a + b, 0) / v.length, n: v.length })).filter((x) => x.n >= 1);
      avgs.sort((a, b) => b.avg - a.avg);
      if (avgs.length >= 2 && avgs[1].avg > 0) {
        const x = avgs[0].avg / avgs[1].avg;
        if (x >= 1.2) out.push(`Tus ${avgs[0].t.toLowerCase()}s llegan a ${Math.round(avgs[0].avg)} personas en promedio: ${x.toFixed(1)}× más que tus ${avgs[1].t.toLowerCase()}s.`);
      }
      const sorted = [...withReach].sort((a, b) => (b.reach ?? 0) - (a.reach ?? 0));
      const avg = withReach.reduce((a, r) => a + (r.reach ?? 0), 0) / withReach.length;
      if (sorted[0] && avg && sorted[0].reach! > avg * 1.8) {
        out.push(`Tu mejor publicación llegó a ${sorted[0].reach} personas (${(sorted[0].reach! / avg).toFixed(1)}× tu promedio). Repite ese formato o tema.`);
      }
      const saves = withReach.filter((r) => r.saved != null && r.reach);
      if (saves.length >= 3) {
        const top = [...saves].sort((a, b) => rate(b.saved, b.reach)! - rate(a.saved, a.reach)!)[0];
        if (top.saved) out.push(`"${(top.caption ?? "").slice(0, 50)}…" es lo que más guardan (${((rate(top.saved, top.reach) ?? 0) * 100).toFixed(1)}% del alcance): ese tipo de contenido educa y genera confianza.`);
      }
    }
    const leadsPosts = rank.filter((r) => r.leads > 0 || r.ofertas > 0);
    if (leadsPosts.length) {
      const top = [...leadsPosts].sort((a, b) => b.leads - a.leads || b.ofertas - a.ofertas)[0];
      out.push(`El post que más vende: "${(top.caption ?? "").slice(0, 50)}…" con ${top.ofertas} ofertas entregadas y ${top.leads} leads.`);
    } else if (rank.length) {
      out.push("Ningún post ha generado leads todavía: agrega una campaña de palabra clave (ej: comenta GUIA) a tus próximos reels.");
    }
    const noCampaign = rank.filter((r) => (r.comments ?? 0) > 0 && r.comentarios_bot === 0).length;
    if (noCampaign >= 2) out.push(`${noCampaign} publicaciones tienen comentarios pero ninguna campaña los procesó: oportunidades de lead perdidas.`);
    if (best?.top[0]) out.push(`Tu mejor horario para publicar: ${slotLabel(best.top[0])}.`);
    return out;
  }, [rank, best]);

  if (!ready) return <Card className="p-4 text-xs text-muted-foreground">Aplica la migración 20261102_03 para ver la analítica.</Card>;

  return (
    <div className="space-y-3">
      {/* ---------- KPIs ---------- */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Resultados</h2>
            <p className="text-[11px] text-muted-foreground">Comparado con los {days} días anteriores</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="14">Últimos 14 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" disabled={!connected || busy === "sync"} onClick={() => run("sync", { action: "sync_stats" }, (r) => `${r.posts} publicaciones actualizadas`)}>
              <RefreshCw className={`w-3.5 h-3.5 ${busy === "sync" ? "animate-spin" : ""}`} /> Actualizar
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {KPIS.map((k) => {
            const v = Number(cur?.[k.key] ?? 0);
            const p = Number(prev?.[k.key] ?? 0);
            const delta = p ? Math.round(((v - p) / p) * 100) : v ? 100 : 0;
            const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
            return (
              <div key={k.key} className="rounded-lg bg-muted/40 p-2.5">
                <p className="text-[11px] text-muted-foreground">{k.label}</p>
                <p className="text-lg font-semibold">{k.money ? clp(v) : v.toLocaleString("es-CL")}</p>
                <p className={`text-[10px] flex items-center gap-0.5 ${delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                  <Icon className="w-3 h-3" /> {delta > 0 ? "+" : ""}{delta}% · antes {k.money ? clp(p) : p}
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {settings?.followers_count != null && <>👥 {settings.followers_count.toLocaleString("es-CL")} seguidores · </>}
          Estadísticas de Meta actualizadas {settings?.stats_synced_at ? new Date(settings.stats_synced_at).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }) : "nunca"} (se actualizan solas cada 6 h)
        </p>
      </Card>

      {/* ---------- Recomendaciones ---------- */}
      {insights.length > 0 && (
        <Card className="p-4 space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="w-4 h-4 text-primary" /> Qué hacer ahora</h2>
          <ul className="space-y-1.5 text-xs">
            {insights.map((t) => (
              <li key={t} className="flex gap-2"><span className="text-primary">•</span><span>{t}</span></li>
            ))}
          </ul>
        </Card>
      )}

      {/* ---------- Mejor hora ---------- */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2"><CalendarClock className="w-4 h-4 text-primary" /> Mejor hora para publicar</h2>
            <p className="text-[11px] text-muted-foreground">
              Basado en {best?.sources.audiencia ? "cuándo están conectados tus seguidores, " : ""}
              {best?.sources.comentarios ?? 0} comentarios de tu audiencia y el alcance de {best?.sources.posts ?? 0} publicaciones.
              {best && !best.sources.audiencia && best.sources.comentarios < 5 && best.sources.posts < 3 && " Aún hay pocos datos: se usan horarios típicos de Instagram en Chile."}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {best?.top.map((s, i) => (
              <Button key={`${s.dow}-${s.hour}`} size="sm" variant={i === 0 ? "default" : "outline"} className="h-8 text-xs gap-1" onClick={() => onSchedule(nextOccurrence(s))}>
                {i === 0 && <Trophy className="w-3.5 h-3.5" />} {slotLabel(s)}
              </Button>
            ))}
          </div>
        </div>
        {best && <Heatmap grid={best.grid} />}
        <p className="text-[10px] text-muted-foreground">Toca un horario para programar una publicación en esa fecha.</p>
      </Card>

      {/* ---------- Ranking ---------- */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Ranking de contenido</h2>
          <div className="flex gap-2">
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Reel">Reels</SelectItem>
                <SelectItem value="Post">Posts</SelectItem>
                <SelectItem value="Carrusel">Carruseles</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => <SelectItem key={s.key} value={s.key}>Ordenar: {s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin datos todavía. Presiona “Actualizar” para traer las estadísticas de tus publicaciones.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground text-left">
                <tr>
                  <th className="py-1.5 pr-2">#</th>
                  <th className="py-1.5 pr-3">Publicación</th>
                  <th className="py-1.5 pr-3 text-right">Alcance</th>
                  <th className="py-1.5 pr-3 text-right">Reprod.</th>
                  <th className="py-1.5 pr-3 text-right" title="Interacciones / alcance">Interacción</th>
                  <th className="py-1.5 pr-3 text-right">Guard.</th>
                  <th className="py-1.5 pr-3 text-right">Comp.</th>
                  <th className="py-1.5 pr-3 text-right">Seguid.</th>
                  <th className="py-1.5 pr-3 text-right" title="DMs automáticos enviados">DMs</th>
                  <th className="py-1.5 pr-3 text-right">Clics</th>
                  <th className="py-1.5 text-right">Leads</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 30).map((r, i) => {
                  const er = rate(r.interactions, r.reach);
                  return (
                    <tr key={r.media_id} className="border-t border-border/50">
                      <td className="py-1.5 pr-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-1.5 pr-3">
                        <div className="flex items-center gap-2 min-w-[220px]">
                          {r.thumbnail_url ? <img src={r.thumbnail_url} alt="" className="w-9 h-9 rounded object-cover shrink-0" /> : <div className="w-9 h-9 rounded bg-muted shrink-0" />}
                          <div className="min-w-0">
                            <p className="truncate max-w-[260px]">{r.caption || "Sin texto"}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Badge variant="outline" className="text-[9px] h-4 px-1">{TIPO(r)}</Badge>
                              {r.publicado_at && new Date(r.publicado_at).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                              {r.avg_watch_ms != null && <> · {(r.avg_watch_ms / 1000).toFixed(1)} s vistos</>}
                              {r.permalink && <a href={r.permalink} target="_blank" rel="noreferrer" className="hover:text-foreground"><ExternalLink className="w-3 h-3" /></a>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-1.5 pr-3 text-right font-medium">{num(r.reach)}</td>
                      <td className="py-1.5 pr-3 text-right">{num(r.views)}</td>
                      <td className="py-1.5 pr-3 text-right">{er != null ? `${(er * 100).toFixed(1)}%` : "—"}</td>
                      <td className="py-1.5 pr-3 text-right">{num(r.saved)}</td>
                      <td className="py-1.5 pr-3 text-right">{num(r.shares)}</td>
                      <td className="py-1.5 pr-3 text-right">{num(r.follows)}</td>
                      <td className="py-1.5 pr-3 text-right">{r.dms || ""}</td>
                      <td className="py-1.5 pr-3 text-right">{r.clics || ""}</td>
                      <td className={`py-1.5 text-right ${r.leads ? "text-green-400 font-semibold" : ""}`}>{r.leads || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ---------- Resumen semanal + WhatsApp ---------- */}
      {settings && (
        <Card className="p-4 space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Resumen semanal y alertas</h2>
            <p className="text-[11px] text-muted-foreground">
              Cada lunes a las 9:00 recibes tu semana por correo y WhatsApp. Las alertas te avisan al instante de leads nuevos, DMs que necesitan respuesta y menciones.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2 rounded-md border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Resumen semanal</Label>
                <Switch checked={settings.resumen_semanal} onCheckedChange={(v) => saveSettings({ resumen_semanal: v })} />
              </div>
              <Input
                value={settings.resumen_email ?? ""}
                onChange={(e) => setSettings({ ...settings, resumen_email: e.target.value })}
                onBlur={() => saveSettings({})}
                placeholder="Correo (vacío = correo del dueño de la cuenta)"
                className="h-8 text-xs"
              />
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">También por WhatsApp</Label>
                <Switch checked={settings.resumen_por_whatsapp} onCheckedChange={(v) => saveSettings({ resumen_por_whatsapp: v })} />
              </div>
            </div>
            <div className="space-y-2 rounded-md border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Alertas por WhatsApp</Label>
                <Switch checked={settings.alertas_whatsapp} onCheckedChange={(v) => saveSettings({ alertas_whatsapp: v })} />
              </div>
              <Input
                value={settings.whatsapp_numero ?? ""}
                onChange={(e) => setSettings({ ...settings, whatsapp_numero: e.target.value })}
                onBlur={() => saveSettings({})}
                placeholder="Tu WhatsApp, ej: 56912345678"
                className="h-8 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 w-full"
                disabled={!settings.whatsapp_numero || busy === "wa"}
                onClick={() => run("wa", { action: "test_whatsapp" }, () => "Mensaje de prueba enviado a tu WhatsApp")}
              >
                <Send className="w-3 h-3" /> Probar WhatsApp
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">
              Último resumen: {settings.resumen_enviado_at ? new Date(settings.resumen_enviado_at).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }) : "nunca"}
            </p>
            <Button
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={busy === "sum"}
              onClick={() =>
                run("sum", { action: "weekly_summary" }, (r) =>
                  r.enviado ? "Resumen enviado" : r.email_error ? `Resumen guardado (correo: ${r.email_error})` : "Resumen generado",
                )
              }
            >
              <Send className="w-3.5 h-3.5" /> {busy === "sum" ? "Enviando…" : "Enviar resumen ahora"}
            </Button>
          </div>
          {resumenes.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold">Historial</p>
              {resumenes.map((r) => {
                const k = r.datos?.kpis ?? {};
                return (
                  <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-muted/40 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium">
                      {new Date(r.semana_desde).toLocaleDateString("es-CL", { day: "numeric", month: "short" })} – {new Date(r.semana_hasta).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                    </span>
                    <span>{k.comentarios?.valor ?? 0} coment.</span>
                    <span>{k.ofertas?.valor ?? 0} ofertas</span>
                    <span>{k.leads_crm?.valor ?? 0} leads</span>
                    <span>{clp(k.ingresos?.valor ?? 0)}</span>
                    <span className="ml-auto flex gap-1">
                      <Badge variant="outline" className={`text-[9px] h-4 px-1 ${r.email_enviado ? "text-green-400" : "text-muted-foreground"}`} title={r.email_error ?? ""}>
                        {r.email_enviado ? "correo ✓" : "correo ✗"}
                      </Badge>
                      {r.datos?.whatsapp && r.datos.whatsapp !== "desactivado" && (
                        <Badge variant="outline" className={`text-[9px] h-4 px-1 ${r.datos.whatsapp === "enviado" ? "text-green-400" : "text-red-400"}`} title={r.datos.whatsapp}>
                          {r.datos.whatsapp === "enviado" ? "WhatsApp ✓" : "WhatsApp ✗"}
                        </Badge>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/** Mapa de calor día × hora (escala de un solo color, 0 = nada, 1 = mejor). */
function Heatmap({ grid }: { grid: number[][] }) {
  const order = [1, 2, 3, 4, 5, 6, 0]; // lunes primero
  const hours = Array.from({ length: 24 }, (_, h) => h);
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-[2px] text-[9px] text-muted-foreground" style={{ gridTemplateColumns: `32px repeat(24, minmax(14px, 1fr))` }}>
        <span />
        {hours.map((h) => (
          <span key={h} className="text-center">{h % 3 === 0 ? h : ""}</span>
        ))}
        {order.map((d) => (
          <div key={d} className="contents">
            <span className="pr-1 text-right leading-[14px]">{DIAS[d]}</span>
            {hours.map((h) => {
              const v = grid[d][h];
              return (
                <span
                  key={h}
                  title={`${DIAS[d]} ${String(h).padStart(2, "0")}:00 · ${Math.round(v * 100)}/100`}
                  className="h-[14px] rounded-[2px] bg-primary"
                  style={{ opacity: 0.06 + v * 0.94 }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-1 text-[9px] text-muted-foreground">
        <span>Menos</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map((o) => <span key={o} className="w-3 h-2.5 rounded-[2px] bg-primary" style={{ opacity: o }} />)}
        <span>Más</span>
      </div>
    </div>
  );
}
