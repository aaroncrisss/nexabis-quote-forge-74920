import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCw, Heart, MessageCircle, ExternalLink, Eye, EyeOff, Trash2, Reply, Send, Zap, Plus } from "lucide-react";
import { toast } from "sonner";
import { useSavedReplies, fillReply } from "./savedReplies";

type Insights = { metrics: Record<string, number>; missing_permission?: boolean; error?: string | null };
type AccountInsights = {
  followers_count: number | null;
  media_count: number | null;
  metrics: Record<string, number>;
  missing_permission?: boolean;
};

const METRIC_LABEL: Record<string, string> = {
  reach: "Alcance",
  views: "Reproducciones",
  likes: "Me gusta",
  comments: "Comentarios",
  shares: "Compartidos",
  saved: "Guardados",
  total_interactions: "Interacciones",
  profile_visits: "Visitas al perfil",
  follows: "Seguidores nuevos",
  ig_reels_avg_watch_time: "Visualización promedio",
  replies: "Respuestas",
};

const fmtMetric = (k: string, v: number) =>
  k === "ig_reels_avg_watch_time" ? `${(v / 1000).toFixed(1)} s` : v.toLocaleString("es-CL");

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
  like_count?: number;
};

type Comment = {
  id: string;
  text: string;
  username?: string;
  timestamp: string;
  like_count?: number;
  hidden?: boolean;
  from?: { id: string; username?: string };
  replies?: { data: { id: string; text: string; username?: string; timestamp: string }[] };
  mine: boolean;
  answered?: boolean;
  bot: { estado: string; motivo: string | null; campaign_id: string | null } | null;
  can_private_reply: boolean;
};

type Invoke = (body: Record<string, unknown>) => Promise<Record<string, unknown>>;

/** Comentario de otra persona que nadie respondió (ni tú en público ni el bot por DM). */
const isPending = (c: Comment) => !c.mine && !c.answered && c.bot?.estado !== "enviado";

const BOT_LABEL: Record<string, string> = { enviado: "DM enviado", omitido: "Omitido", error: "Error", recibido: "Recibido" };

export function PostsPanel({
  invoke,
  connected,
  campaigns,
  onNewCampaign,
}: {
  invoke: Invoke;
  connected: boolean;
  campaigns: { id?: string; nombre: string; activa: boolean; media_ids: string[] }[];
  onNewCampaign: (mediaId: string) => void;
}) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<Media | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingC, setLoadingC] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; mode: "public" | "dm"; from_id?: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [onlyPending, setOnlyPending] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loadingIns, setLoadingIns] = useState(false);
  const [account, setAccount] = useState<AccountInsights | null>(null);
  const saved = useSavedReplies();

  const loadMedia = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const r = await invoke({ action: "list_media" });
      if (r.ok === false) throw new Error(String(r.error));
      setMedia((r.media as Media[]) ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [invoke, connected]);

  const loadComments = useCallback(
    async (m: Media) => {
      setLoadingC(true);
      try {
        const r = await invoke({ action: "list_comments", media_id: m.id });
        if (r.ok === false) throw new Error(String(r.error));
        setComments((r.comments as Comment[]) ?? []);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoadingC(false);
      }
    },
    [invoke],
  );

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  useEffect(() => {
    if (!active) return;
    loadComments(active);
    setInsights(null);
    setLoadingIns(true);
    invoke({ action: "media_insights", media_id: active.id, media_product_type: active.media_product_type })
      .then((r) => setInsights(r as unknown as Insights))
      .catch(() => setInsights(null))
      .finally(() => setLoadingIns(false));
  }, [active, loadComments, invoke]);

  useEffect(() => {
    if (!connected) return;
    invoke({ action: "account_insights", days: 28 })
      .then((r) => setAccount(r.ok === false ? null : (r as unknown as AccountInsights)))
      .catch(() => setAccount(null));
  }, [connected, invoke]);

  const engagement = useMemo(() => {
    // Promedio de interacciones visibles por post (likes + comentarios) de lo cargado
    if (!media.length) return null;
    const total = media.reduce((a, m) => a + (m.like_count ?? 0) + (m.comments_count ?? 0), 0);
    return Math.round(total / media.length);
  }, [media]);

  const campaignsFor = useMemo(() => {
    const allPosts = campaigns.filter((c) => c.activa && c.media_ids.length === 0);
    return (id: string) => [...campaigns.filter((c) => c.activa && c.media_ids.includes(id)), ...allPosts];
  }, [campaigns]);

  const act = async (body: Record<string, unknown>, ok: string) => {
    setBusy(true);
    try {
      const r = await invoke(body);
      if (r.ok === false) throw new Error(String(r.error));
      toast.success(ok);
      if (active) loadComments(active);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!replyTo || !replyText.trim()) return;
    const done =
      replyTo.mode === "public"
        ? await act({ action: "reply_comment", comment_id: replyTo.id, text: replyText }, "Respuesta publicada")
        : await act({ action: "private_reply", comment_id: replyTo.id, from_id: replyTo.from_id, text: replyText }, "DM enviado");
    if (done) {
      setReplyTo(null);
      setReplyText("");
    }
  };

  if (!connected) return <Card className="p-4 text-xs text-muted-foreground">Conecta tu cuenta de Instagram para ver tus publicaciones.</Card>;

  return (
    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-3">
      <Card className="p-3 space-y-2">
        {account && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Seguidores" value={account.followers_count} />
            <Stat label="Alcance 28 d" value={account.metrics.reach} />
            <Stat label={account.metrics.profile_views !== undefined ? "Visitas perfil 28 d" : "Interacc. prom/post"} value={account.metrics.profile_views ?? engagement} />
            {account.missing_permission && (
              <p className="col-span-3 text-[10px] text-orange-400">
                Para alcance y estadísticas agrega el permiso <code>instagram_manage_insights</code> al token.
              </p>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Mis publicaciones</h2>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={loadMedia} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 max-h-[calc(100dvh-260px)] min-h-[300px] overflow-y-auto overscroll-contain">
          {media.map((m) => {
            const auto = campaignsFor(m.id).length > 0;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActive(m)}
                className={`relative aspect-[4/5] rounded-md overflow-hidden border-2 text-left ${active?.id === m.id ? "border-primary" : "border-transparent"}`}
              >
                <img src={m.thumbnail_url || m.media_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[10px] text-white flex gap-2">
                  <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {m.like_count ?? "–"}</span>
                  <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" /> {m.comments_count ?? 0}</span>
                </div>
                {auto && (
                  <span className="absolute top-1 left-1 rounded bg-primary/90 px-1 text-[9px] text-primary-foreground flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> Auto-DM
                  </span>
                )}
              </button>
            );
          })}
          {!loading && media.length === 0 && <p className="col-span-3 text-xs text-muted-foreground">Sin publicaciones.</p>}
        </div>
      </Card>

      <Card className="p-3 space-y-3">
        {!active ? (
          <p className="text-xs text-muted-foreground">Elige una publicación para ver y gestionar sus comentarios.</p>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <img src={active.thumbnail_url || active.media_url} alt="" className="w-14 h-14 rounded object-cover" />
              <div className="min-w-0 flex-1 text-xs space-y-1">
                <p className="line-clamp-2 text-muted-foreground">{active.caption || "Sin texto"}</p>
                <div className="flex flex-wrap gap-1">
                  {campaignsFor(active.id).map((c) => (
                    <Badge key={c.id} variant="outline" className="text-[10px]"><Zap className="w-2.5 h-2.5 mr-0.5" />{c.nombre}</Badge>
                  ))}
                  {campaignsFor(active.id).length === 0 && <span className="text-orange-400">Sin campaña automática</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {active.permalink && (
                  <a href={active.permalink} target="_blank" rel="noreferrer" className="inline-flex h-7 px-2 items-center text-muted-foreground hover:text-foreground" title="Ver en Instagram">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] gap-1" onClick={() => onNewCampaign(active.id)}>
                  <Plus className="w-3 h-3" /> Campaña
                </Button>
              </div>
            </div>

            <div className="rounded-md bg-muted/40 p-2">
              {loadingIns ? (
                <p className="text-[11px] text-muted-foreground">Cargando estadísticas…</p>
              ) : insights && Object.keys(insights.metrics ?? {}).length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center">
                  {Object.entries(insights.metrics).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-sm font-semibold">{fmtMetric(k, v)}</p>
                      <p className="text-[10px] text-muted-foreground">{METRIC_LABEL[k] ?? k}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  {insights?.missing_permission
                    ? "Estadísticas no disponibles: falta el permiso instagram_manage_insights en el token."
                    : "Sin estadísticas para esta publicación."}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold">Comentarios ({comments.length})</p>
                <button
                  type="button"
                  onClick={() => setOnlyPending((v) => !v)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${onlyPending ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
                >
                  Sin responder ({comments.filter(isPending).length})
                </button>
              </div>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => loadComments(active)} disabled={loadingC}>
                <RefreshCw className={`w-3.5 h-3.5 ${loadingC ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <div className="space-y-2 max-h-[calc(100dvh-360px)] min-h-[240px] overflow-y-auto overscroll-contain text-xs">
              {loadingC && comments.length === 0 && <p className="text-muted-foreground">Cargando…</p>}
              {!loadingC && comments.length === 0 && <p className="text-muted-foreground">Sin comentarios.</p>}
              {comments.filter((c) => !onlyPending || isPending(c)).map((c) => (
                <div key={c.id} className={`rounded-md border border-border/50 p-2 space-y-1 ${c.hidden ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <a href={`https://instagram.com/${c.username ?? ""}`} target="_blank" rel="noreferrer" className="font-medium hover:underline truncate">
                        @{c.username ?? c.from?.username ?? "usuario"}
                      </a>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(c.timestamp).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                      {c.hidden && <Badge variant="outline" className="text-[9px] h-4 px-1">Oculto</Badge>}
                      {c.bot && (
                        <Badge
                          variant="outline"
                          title={c.bot.motivo ?? ""}
                          className={`text-[9px] h-4 px-1 ${c.bot.estado === "enviado" ? "text-green-400" : c.bot.estado === "error" ? "text-red-400" : ""}`}
                        >
                          🤖 {BOT_LABEL[c.bot.estado] ?? c.bot.estado}
                        </Badge>
                      )}
                    </div>
                    {!c.mine && (
                      <div className="flex shrink-0">
                        <Button size="sm" variant="ghost" className="h-6 px-1.5" title="Responder en público" onClick={() => setReplyTo({ id: c.id, mode: "public" })}>
                          <Reply className="w-3 h-3" />
                        </Button>
                        {c.can_private_reply && (
                          <Button size="sm" variant="ghost" className="h-6 px-1.5" title="Responder por DM privado" onClick={() => setReplyTo({ id: c.id, mode: "dm", from_id: c.from?.id })}>
                            <Send className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1.5"
                          disabled={busy}
                          title={c.hidden ? "Mostrar" : "Ocultar"}
                          onClick={() => act({ action: "hide_comment", comment_id: c.id, hide: !c.hidden }, c.hidden ? "Comentario visible" : "Comentario oculto")}
                        >
                          {c.hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1.5 text-destructive"
                          disabled={busy}
                          title="Eliminar"
                          onClick={() => window.confirm("¿Eliminar este comentario de Instagram?") && act({ action: "delete_comment", comment_id: c.id }, "Comentario eliminado")}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap">{c.text}</p>
                  {(c.replies?.data ?? []).length > 0 && (
                    <div className="pl-3 border-l border-border/60 space-y-1">
                      {c.replies!.data.map((r) => (
                        <p key={r.id} className="text-muted-foreground"><b>@{r.username}</b> {r.text}</p>
                      ))}
                    </div>
                  )}
                  {replyTo?.id === c.id && saved.items.length > 0 && (
                    <div className="flex gap-1 overflow-x-auto pt-1">
                      {saved.items.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          title={r.texto}
                          onClick={() => setReplyText(fillReply(r.texto, c.username))}
                          className="shrink-0 rounded-full border border-primary/40 px-2 py-0.5 text-[10px] text-primary hover:bg-primary/10"
                        >
                          {r.titulo}
                        </button>
                      ))}
                    </div>
                  )}
                  {replyTo?.id === c.id && (
                    <div className="flex gap-1 pt-1">
                      <Input
                        autoFocus
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !busy && sendReply()}
                        placeholder={replyTo.mode === "public" ? "Respuesta pública…" : "Mensaje privado (solo 1 por comentario)…"}
                        className="h-8 text-xs"
                      />
                      <Button size="sm" className="h-8" onClick={sendReply} disabled={busy || !replyText.trim()}>Enviar</Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setReplyTo(null)}>×</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="rounded-md bg-muted/40 py-1.5">
      <p className="text-sm font-semibold">{typeof value === "number" ? value.toLocaleString("es-CL") : "—"}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
