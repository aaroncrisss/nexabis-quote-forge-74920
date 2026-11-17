import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bookmark, ExternalLink, Plus, Radar, RefreshCw, Trash2, X } from "lucide-react";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";

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
  const [vista, setVista] = useState<"ideas" | "guardadas">("ideas");
  const [missing, setMissing] = useState(false);

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

  const lista = useMemo(
    () =>
      posts
        .filter((p) => (vista === "guardadas" ? p.estado === "guardado" : p.score >= 2))
        .filter((p) => !filtro || p.formulas.includes(filtro)),
    [posts, vista, filtro],
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
              Cada día revisa a tu competencia y destaca los posts que rindieron muy sobre lo normal de esa cuenta (×3 o más = idea probada). Te avisa las mejores por WhatsApp.
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
            <Button size="sm" variant={vista === "guardadas" ? "default" : "outline"} onClick={() => setVista("guardadas")}>
              <Bookmark className="w-3.5 h-3.5 mr-1" /> Guardadas ({posts.filter((p) => p.estado === "guardado").length})
            </Button>
            {filtro && (
              <Button size="sm" variant="ghost" onClick={() => setFiltro(null)}>
                <X className="w-3.5 h-3.5 mr-1" /> {FORMULA_LABEL[filtro] ?? filtro}
              </Button>
            )}
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : lista.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              {posts.length === 0 ? "Aún no hay datos. Toca «Actualizar ahora»." : "Nada con este filtro."}
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
                      <a href={p.permalink} target="_blank" rel="noreferrer" className="inline-flex h-7 px-2 items-center text-muted-foreground hover:text-foreground" title="Ver en Instagram">
                        <ExternalLink className="w-3.5 h-3.5" />
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
