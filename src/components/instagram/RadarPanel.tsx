import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bookmark, ExternalLink, Plus, Radar, RefreshCw, Trash2, X } from "lucide-react";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import { detectFormulas, viralScore, type PostStat } from "./formulas";

/**
 * Radar de ideas: posts de la competencia que rindieron muy sobre su normal.
 * Sin IA: business_discovery + score = interacción / mediana de la cuenta.
 */

type Competidor = {
  username: string;
  activo: boolean;
  seguidores: number | null;
  mediana: number | null;
  posts_semana: number | null;
  error: string | null;
  actualizado_at: string | null;
};

type RadarPost = {
  media_id: string;
  username: string;
  caption: string | null;
  tipo: string | null;
  permalink: string | null;
  likes: number;
  comments: number;
  publicado_at: string | null;
  score: number;
  formulas: string[];
  estado: "nuevo" | "guardado" | "descartado" | "usado";
};

export const FORMULA_LABEL: Record<string, string> = {
  comenta_palabra: "💬 Comenta PALABRA",
  gratis: "🎁 Gratis",
  github_repo: "⭐ Repo GitHub",
  rubro: "🏪 Por rubro",
  gancho_tu: "👉 Gancho «tu…»",
  lista_numero: "🔢 Lista",
  pov: "🎭 POV",
  pregunta: "❓ Pregunta",
  mandaselo: "📤 Mándaselo",
  guardalo: "🔖 Guárdalo",
  noticia: "📰 Noticia",
  historia_personal: "🙋 Historia personal",
  desafio: "🎯 Desafío",
};

type Props = {
  invoke: (b: Record<string, unknown>) => Promise<Record<string, unknown>>;
  connected: boolean;
};

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)} mil` : String(Math.round(n));

export function RadarPanel({ invoke, connected }: Props) {
  const [comps, setComps] = useState<Competidor[]>([]);
  const [posts, setPosts] = useState<RadarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [nuevo, setNuevo] = useState("");
  const [filtro, setFiltro] = useState<string | null>(null);
  const [vista, setVista] = useState<"ideas" | "comentar" | "guardadas" | "lab">("ideas");
  const [missing, setMissing] = useState(false);
  const [mine, setMine] = useState<PostStat[]>([]);

  useEffect(() => {
    const desde = new Date(Date.now() - 60 * 86400_000).toISOString();
    supabaseCRM
      .from("ig_media_stats")
      .select("media_id, caption, permalink, publicado_at, views, reach, likes, comments, shares, saved, avg_watch_ms")
      .gte("publicado_at", desde)
      .order("publicado_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setMine((data ?? []) as PostStat[]));
  }, []);

  // Laboratorio: tus posts por fórmula + comparación semana a semana
  const lab = useMemo(() => {
    const rows = mine.map((p) => ({ ...p, f: detectFormulas(p.caption), score: viralScore(p) }));
    const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
    const agg = (list: typeof rows) => {
      const n = list.length || 1;
      const sum = (k: keyof PostStat) => list.reduce((s, x) => s + Number(x[k] ?? 0), 0);
      return {
        n: list.length,
        views: sum("views") / n,
        reach: sum("reach") / n,
        watch: sum("avg_watch_ms") / n / 1000,
        envios: pct(sum("shares"), sum("reach")),
        guardados: pct(sum("saved"), sum("reach")),
        score: list.reduce((s, x) => s + x.score, 0) / n,
      };
    };
    const porFormula: Record<string, typeof rows> = {};
    for (const r of rows) for (const f of r.f.length ? r.f : ["sin_formula"]) (porFormula[f] ??= []).push(r);
    const formulas = Object.entries(porFormula)
      .map(([f, list]) => ({ f, ...agg(list) }))
      .sort((a, b) => b.score - a.score);
    const now = Date.now();
    const sem = (a: number, b: number) => rows.filter((r) => r.publicado_at && now - new Date(r.publicado_at).getTime() >= a * 86400_000 && now - new Date(r.publicado_at).getTime() < b * 86400_000);
    return { formulas, top: [...rows].sort((a, b) => b.score - a.score).slice(0, 5), est: agg(sem(0, 7)), ant: agg(sem(7, 14)), total: rows.length };
  }, [mine]);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, p] = await Promise.all([
      supabaseCRM.from("ig_competidores").select("username, activo, seguidores, mediana, posts_semana, error, actualizado_at").order("username"),
      supabaseCRM
        .from("ig_radar_posts")
        .select("media_id, username, caption, tipo, permalink, likes, comments, publicado_at, score, formulas, estado")
        .neq("estado", "descartado")
        .order("score", { ascending: false })
        .limit(300),
    ]);
    if (c.error || p.error) {
      setMissing(true);
    } else {
      setMissing(false);
      setComps((c.data ?? []) as Competidor[]);
      setPosts((p.data ?? []) as RadarPost[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await invoke({ action: "radar_sync" });
      if (r.ok === false) throw new Error(String(r.error ?? "Error"));
      toast.success(`Radar actualizado: ${r.cuentas ?? 0} cuentas, ${r.posts ?? 0} posts`);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const add = async () => {
    const u = nuevo.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "").toLowerCase();
    if (!u) return;
    const { error } = await supabaseCRM.from("ig_competidores").insert({ username: u });
    if (error) return toast.error(error.message);
    setNuevo("");
    toast.success(`@${u} agregado. Toca «Actualizar» para traer sus posts.`);
    load();
  };

  const remove = async (u: string) => {
    const { error } = await supabaseCRM.from("ig_competidores").delete().eq("username", u);
    if (error) return toast.error(error.message);
    load();
  };

  const setEstado = async (id: string, estado: RadarPost["estado"]) => {
    const { error } = await supabaseCRM.from("ig_radar_posts").update({ estado }).eq("media_id", id);
    if (error) return toast.error(error.message);
    setPosts((ps) => (estado === "descartado" ? ps.filter((p) => p.media_id !== id) : ps.map((p) => (p.media_id === id ? { ...p, estado } : p))));
  };

  // Qué fórmula rinde más: score promedio por fórmula (mín. 3 posts; tope ×20 para que un viral gigante no distorsione)
  const ranking = useMemo(() => {
    const acc: Record<string, { n: number; s: number }> = {};
    for (const p of posts) for (const f of p.formulas) (acc[f] ??= { n: 0, s: 0 }), (acc[f].n += 1), (acc[f].s += Math.min(20, Number(p.score)));
    return Object.entries(acc)
      .filter(([, v]) => v.n >= 3)
      .map(([f, v]) => ({ f, prom: v.s / v.n, n: v.n }))
      .sort((a, b) => b.prom - a.prom);
  }, [posts]);

  // "Comenta hoy": posts de las últimas 48 h, del más nuevo al más antiguo (comentar temprano = más visibilidad)
  const frescos = useMemo(() => {
    const desde = Date.now() - 48 * 3600_000;
    return posts
      .filter((p) => p.publicado_at && new Date(p.publicado_at).getTime() >= desde)
      .sort((a, b) => new Date(b.publicado_at!).getTime() - new Date(a.publicado_at!).getTime());
  }, [posts]);

  const lista = useMemo(
    () =>
      (vista === "comentar" ? frescos : posts)
        .filter((p) => (vista === "guardadas" ? p.estado === "guardado" : vista === "comentar" ? true : p.score >= 2))
        .filter((p) => !filtro || p.formulas.includes(filtro)),
    [posts, frescos, vista, filtro],
  );

  if (missing) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Falta aplicar la migración <code>20261117_02_instagram_radar.sql</code>.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Radar className="w-4 h-4" /> Radar de ideas
            </h3>
            <p className="text-xs text-muted-foreground">
              Cada 12 h revisa a tu competencia y destaca los posts que rindieron muy sobre lo normal de esa cuenta (×3 o más = idea probada). Te avisa las mejores por WhatsApp.
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-1" onClick={sync} disabled={syncing || !connected}>
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Revisando…" : "Actualizar ahora"}
          </Button>
        </div>

        {ranking.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium">Fórmulas que más rinden en tu nicho (veces sobre lo normal)</p>
            <div className="flex flex-wrap gap-1.5">
              {ranking.map((r) => (
                <button
                  key={r.f}
                  onClick={() => setFiltro(filtro === r.f ? null : r.f)}
                  className={`text-[11px] rounded-full border px-2 py-0.5 ${filtro === r.f ? "bg-primary text-primary-foreground border-primary" : "border-border/60 hover:bg-muted"}`}
                >
                  {FORMULA_LABEL[r.f] ?? r.f} ×{r.prom.toFixed(1)} <span className="opacity-60">({r.n})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant={vista === "ideas" ? "default" : "outline"} onClick={() => setVista("ideas")}>
              Ideas ({posts.filter((p) => p.score >= 2).length})
            </Button>
            <Button size="sm" variant={vista === "comentar" ? "default" : "outline"} onClick={() => setVista("comentar")} title="Posts de tu nicho de las últimas 48 h: comenta con aporte, temprano">
              💬 Comenta hoy ({frescos.length})
            </Button>
            <Button size="sm" variant={vista === "lab" ? "default" : "outline"} onClick={() => setVista("lab")} title="Qué fórmula funciona en TU cuenta, con las señales que Instagram premia">
              🧪 Laboratorio
            </Button>
            <Button size="sm" variant={vista === "guardadas" ? "default" : "outline"} onClick={() => setVista("guardadas")}>
              <Bookmark className="w-3.5 h-3.5 mr-1" /> Guardadas ({posts.filter((p) => p.estado === "guardado").length})
            </Button>
            {filtro && (
              <Button size="sm" variant="ghost" onClick={() => setFiltro(null)}>
                <X className="w-3.5 h-3.5 mr-1" /> {FORMULA_LABEL[filtro] ?? filtro}
              </Button>
            )}
          </div>
          {vista === "lab" ? (
            <Card className="p-4 space-y-4 text-xs">
              <div>
                <p className="font-semibold text-sm">🧪 Laboratorio viral · tus últimos 60 días ({lab.total} posts)</p>
                <p className="text-muted-foreground">
                  Puntaje viral (0–100) con las señales que Instagram confirmó que pesan: <b>envíos por alcance</b> (40 %), guardados y comentarios por alcance (25 %), me gusta por alcance (15 %) y tiempo de visualización (20 %).
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {([
                  ["Alcance prom.", lab.est.reach, lab.ant.reach, (v: number) => v.toFixed(0)],
                  ["Visualización", lab.est.watch, lab.ant.watch, (v: number) => v.toFixed(1) + " s"],
                  ["Envíos / alcance", lab.est.envios, lab.ant.envios, (v: number) => v.toFixed(1) + " %"],
                  ["Guardados / alcance", lab.est.guardados, lab.ant.guardados, (v: number) => v.toFixed(1) + " %"],
                  ["Puntaje viral", lab.est.score, lab.ant.score, (v: number) => v.toFixed(0)],
                ] as [string, number, number, (v: number) => string][]).map(([t, a, b, fm]) => (
                  <div key={t} className="rounded-md border border-border/60 p-2">
                    <div className="text-muted-foreground">{t} · 7 días</div>
                    <div className="text-base font-semibold">{fm(a)}</div>
                    <div className={a >= b ? "text-emerald-400" : "text-red-400"}>
                      {a >= b ? "▲" : "▼"} antes {fm(b)}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <p className="font-medium mb-1">Fórmulas en tu cuenta (mejor puntaje arriba)</p>
                <table className="w-full">
                  <thead className="text-muted-foreground">
                    <tr className="text-left">
                      <th>Fórmula</th>
                      <th>Posts</th>
                      <th>Vistas</th>
                      <th>Visualiz.</th>
                      <th>Envíos</th>
                      <th>Puntaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lab.formulas.map((r) => (
                      <tr key={r.f} className="border-t border-border/40">
                        <td>{FORMULA_LABEL[r.f] ?? (r.f === "sin_formula" ? "— sin fórmula" : r.f)}</td>
                        <td>{r.n}</td>
                        <td>{r.views.toFixed(0)}</td>
                        <td>{r.watch.toFixed(1)} s</td>
                        <td>{r.envios.toFixed(1)} %</td>
                        <td className="font-semibold">{r.score.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-muted-foreground mt-1">Con menos de 3 posts por fórmula el resultado es indicativo. Compáralo con el ranking del nicho de arriba: si una fórmula rinde en el nicho y en tu cuenta no, el problema es la ejecución (gancho, primer segundo), no la idea.</p>
              </div>
              <div>
                <p className="font-medium mb-1">Tus 5 posts con mejor puntaje: repite lo que tienen en común</p>
                {lab.top.map((p) => (
                  <div key={p.media_id} className="flex items-center gap-2 border-t border-border/40 py-1">
                    <Badge className="bg-orange-500/80">{p.score}</Badge>
                    <span className="flex-1 truncate">{(p.caption ?? "").split("\n")[0]}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {p.views ?? 0} vistas · {p.shares ?? 0} envíos
                    </span>
                    {p.permalink && (
                      <a href={p.permalink} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : lista.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              {posts.length === 0
                ? "Aún no hay datos. Toca «Actualizar ahora»."
                : vista === "comentar"
                  ? "No hay posts nuevos de tu nicho en las últimas 48 h."
                  : "Nada con este filtro."}
            </Card>
          ) : (
            lista.map((p) => (
              <Card key={p.media_id} className="p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge className={p.score >= 10 ? "bg-red-500/80" : p.score >= 3 ? "bg-orange-500/80" : "bg-muted text-foreground"}>
                    ×{Number(p.score).toFixed(1)}
                  </Badge>
                  <span className="font-medium">@{p.username}</span>
                  <span className="text-muted-foreground">
                    {p.tipo} · {fmt(p.likes)} ❤ · {fmt(p.comments)} 💬
                    {p.publicado_at && ` · ${new Date(p.publicado_at).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}`}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap line-clamp-4">{p.caption || "Sin texto"}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {p.formulas.map((f) => (
                    <span key={f} className="text-[10px] rounded bg-muted px-1.5 py-0.5">
                      {FORMULA_LABEL[f] ?? f}
                    </span>
                  ))}
                  <div className="ml-auto flex gap-1">
                    {p.permalink && (
                      <a
                        href={p.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex h-7 px-2 items-center gap-1 text-[11px] ${vista === "comentar" ? "rounded bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        title="Ver en Instagram"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> {vista === "comentar" && "Abrir y comentar"}
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant={p.estado === "guardado" ? "default" : "ghost"}
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setEstado(p.media_id, p.estado === "guardado" ? "nuevo" : "guardado")}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => setEstado(p.media_id, "descartado")} title="Descartar">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <Card className="p-3 space-y-2 h-fit">
          <p className="text-xs font-medium">Cuentas vigiladas ({comps.length})</p>
          <div className="flex gap-1">
            <Input value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="@usuario" className="h-8 text-xs" onKeyDown={(e) => e.key === "Enter" && add()} />
            <Button size="sm" className="h-8 px-2" onClick={add}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">Solo cuentas profesionales (empresa o creador).</p>
          <div className="space-y-1 max-h-[520px] overflow-auto">
            {comps.map((c) => (
              <div key={c.username} className="flex items-center gap-2 text-xs rounded px-1 py-1 hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                  <a href={`https://instagram.com/${c.username}`} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                    @{c.username}
                  </a>
                  <div className="text-[10px] text-muted-foreground truncate" title={c.error ?? ""}>
                    {c.error ? "⚠ no es cuenta profesional o no existe" : `${fmt(c.seguidores)} seg · ${c.posts_semana ?? "—"}/sem · normal ${fmt(c.mediana)}`}
                  </div>
                </div>
                <button onClick={() => remove(c.username)} className="text-muted-foreground hover:text-red-400" title="Quitar">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
