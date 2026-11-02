import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCw, Send, Search, MessageCircle, ExternalLink, ArrowLeft, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useSavedReplies, fillReply } from "./savedReplies";
import { SavedRepliesDialog } from "./SavedRepliesDialog";

type Conversation = {
  id: string;
  updated_time: string;
  user_id: string | null;
  username: string | null;
  last_text: string;
  last_from_me: boolean;
  contact: { cliente_id: string | null; no_contactar: boolean; oferta_enviada_at: string | null } | null;
};

type Msg = {
  id: string;
  text: string;
  from_me: boolean;
  created_time: string;
  image: string | null;
  video: string | null;
  file: string | null;
  story: boolean;
};

type Invoke = (body: Record<string, unknown>) => Promise<Record<string, unknown>>;

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
};

export function InboxPanel({
  invoke,
  connected,
  quickReplies = [],
  onUnread,
}: {
  invoke: Invoke;
  connected: boolean;
  quickReplies?: string[];
  onUnread?: (n: number) => void;
}) {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [active, setActive] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [windowOpen, setWindowOpen] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const saved = useSavedReplies();
  const [manageOpen, setManageOpen] = useState(false);
  const lastCount = useRef(0);

  const [next, setNext] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadInbox = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const r = await invoke({ action: "inbox", limit: 15 });
      if (r.ok === false) throw new Error(String(r.error));
      const fresh = (r.conversations as Conversation[]) ?? [];
      // Conserva las páginas ya cargadas con "Cargar más"
      setConvs((prev) => [...fresh, ...prev.filter((p) => !fresh.some((f) => f.id === p.id))]);
      setNext((cur) => cur ?? ((r.next as string | null) ?? null));
    } catch (e) {
      toast.error(`Bandeja: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [invoke, connected]);

  const loadMore = async () => {
    if (!next) return;
    setLoadingMore(true);
    try {
      const r = await invoke({ action: "inbox", limit: 15, after: next });
      if (r.ok === false) throw new Error(String(r.error));
      const more = (r.conversations as Conversation[]) ?? [];
      setConvs((prev) => [...prev, ...more.filter((m) => !prev.some((p) => p.id === m.id))]);
      setNext((r.next as string | null) ?? null);
    } catch (e) {
      toast.error(`Bandeja: ${(e as Error).message}`);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadThread = useCallback(
    async (c: Conversation, silent = false) => {
      if (!silent) setLoadingThread(true);
      try {
        const r = await invoke({ action: "thread", conversation_id: c.id });
        if (r.ok === false) throw new Error(String(r.error));
        setMsgs((r.messages as Msg[]) ?? []);
        setWindowOpen(Boolean(r.window_open));
      } catch (e) {
        if (!silent) toast.error((e as Error).message);
      } finally {
        setLoadingThread(false);
      }
    },
    [invoke],
  );

  useEffect(() => {
    onUnread?.(convs.filter((c) => !c.last_from_me).length);
  }, [convs, onUnread]);

  useEffect(() => {
    loadInbox();
    // Solo refresca con la pestaña del navegador visible (ahorra llamadas a Meta y a la base)
    const t = setInterval(() => {
      if (document.visibilityState === "visible") loadInbox();
    }, 60_000);
    return () => clearInterval(t);
  }, [loadInbox]);

  useEffect(() => {
    if (!active) return;
    loadThread(active);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") loadThread(active, true);
    }, 20_000);
    return () => clearInterval(t);
  }, [active, loadThread]);

  useEffect(() => {
    // Solo baja dentro del chat (nunca mueve la página) y solo si llegaron mensajes nuevos
    const el = scroller.current;
    if (el && msgs.length !== lastCount.current) el.scrollTop = el.scrollHeight;
    lastCount.current = msgs.length;
  }, [msgs]);

  const send = async () => {
    if (!active?.user_id || !text.trim()) return;
    setSending(true);
    try {
      const r = await invoke({ action: "send_dm", recipient_id: active.user_id, text: text.trim() });
      if (r.ok === false) throw new Error(String(r.error));
      setMsgs((prev) => [
        ...prev,
        { id: String(r.message_id ?? Date.now()), text: text.trim(), from_me: true, created_time: new Date().toISOString(), image: null, video: null, file: null, story: false },
      ]);
      setText("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (!connected) return <Card className="p-4 text-xs text-muted-foreground">Conecta tu cuenta de Instagram para ver la bandeja.</Card>;

  const shown = convs.filter((c) => !filter || (c.username ?? "").toLowerCase().includes(filter.toLowerCase()) || c.last_text.toLowerCase().includes(filter.toLowerCase()));

  return (
    <Card className="p-0 overflow-hidden">
      <SavedRepliesDialog open={manageOpen} onOpenChange={setManageOpen} items={saved.items} onChanged={saved.reload} />
      <div className="grid md:grid-cols-[300px_1fr] h-[calc(100dvh-200px)] min-h-[420px] max-h-[820px]">
        {/* Lista (en celular se oculta al abrir un chat) */}
        <div className={`border-r border-border/60 flex-col min-h-0 ${active ? "hidden md:flex" : "flex"}`}>
          <div className="p-2 flex gap-1 border-b border-border/60">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-muted-foreground" />
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar" className="h-8 pl-7 text-xs" />
            </div>
            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={loadInbox} disabled={loading} title="Actualizar">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="overflow-y-auto flex-1">
            {shown.length === 0 && <p className="p-4 text-xs text-muted-foreground">{loading ? "Cargando…" : "Sin conversaciones."}</p>}
            {shown.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  if (active?.id !== c.id) {
                    setMsgs([]);
                    lastCount.current = 0;
                  }
                  setActive(c);
                }}
                className={`w-full text-left px-3 py-2 border-b border-border/40 text-xs hover:bg-muted/40 ${active?.id === c.id ? "bg-muted/60" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate flex items-center gap-1.5">
                    {!c.last_from_me && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" title="Esperando tu respuesta" />}
                    @{c.username ?? c.user_id}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{ago(c.updated_time)}</span>
                </div>
                <p className={`truncate ${c.last_from_me ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                  {c.last_from_me ? "Tú: " : ""}{c.last_text || "📎 Adjunto"}
                </p>
                <div className="flex gap-1 mt-0.5">
                  {c.contact?.cliente_id && <Badge variant="outline" className="text-[9px] h-4 px-1">CRM</Badge>}
                  {c.contact?.oferta_enviada_at && <Badge variant="outline" className="text-[9px] h-4 px-1">Oferta</Badge>}
                  {c.contact?.no_contactar && <Badge variant="outline" className="text-[9px] h-4 px-1 text-red-400">STOP</Badge>}
                </div>
              </button>
            ))}
            {next && !filter && (
              <button type="button" onClick={loadMore} disabled={loadingMore} className="w-full py-2 text-xs text-primary hover:bg-muted/40">
                {loadingMore ? "Cargando…" : "Cargar más"}
              </button>
            )}
          </div>
        </div>

        {/* Conversación */}
        <div className={`flex-col min-h-0 ${active ? "flex" : "hidden md:flex"}`}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
              <MessageCircle className="w-6 h-6" /> Elige una conversación
            </div>
          ) : (
            <>
              <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between gap-2">
                <Button size="sm" variant="ghost" className="h-7 px-1.5 md:hidden" onClick={() => setActive(null)} title="Volver">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <a href={`https://instagram.com/${active.username ?? ""}`} target="_blank" rel="noreferrer" className="text-sm font-semibold hover:underline">
                    @{active.username ?? active.user_id}
                  </a>
                  <p className={`text-[10px] ${windowOpen ? "text-green-400" : "text-orange-400"}`}>
                    {windowOpen ? "Puedes responder (ventana de 24 h abierta)" : "Ventana de 24 h cerrada: espera a que te escriba"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {active.contact?.cliente_id && (
                    <Link to={`/clientes/${active.contact.cliente_id}`} className="text-xs text-primary hover:underline">Ver en CRM</Link>
                  )}
                  <a href="https://www.instagram.com/direct/inbox/" target="_blank" rel="noreferrer" className="inline-flex h-7 px-2 items-center text-muted-foreground hover:text-foreground" title="Abrir en Instagram">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2 text-xs">
                {loadingThread && msgs.length === 0 && <p className="text-muted-foreground">Cargando…</p>}
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.from_me ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 whitespace-pre-wrap break-words ${m.from_me ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {m.story && <p className="text-[10px] opacity-70 mb-1">↪ Respondió a tu historia</p>}
                      {m.image && <img src={m.image} alt="" className="rounded-lg mb-1 max-h-48" />}
                      {m.video && <video src={m.video} controls className="rounded-lg mb-1 max-h-48" />}
                      {m.file && <a href={m.file} target="_blank" rel="noreferrer" className="underline">Archivo adjunto</a>}
                      {m.text}
                      <p className="text-[9px] opacity-60 mt-1 text-right">
                        {new Date(m.created_time).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/60 p-2 space-y-1.5">
                {windowOpen && (
                  <div className="flex gap-1 overflow-x-auto pb-0.5">
                    {saved.items.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        title={r.texto}
                        onClick={() => setText(fillReply(r.texto, active.username))}
                        className="shrink-0 rounded-full border border-primary/40 px-2 py-0.5 text-[10px] text-primary hover:bg-primary/10"
                      >
                        {r.titulo}
                      </button>
                    ))}
                    {quickReplies.map((q) => (
                      <button key={q} type="button" title={q} onClick={() => setText(q)} className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] hover:bg-muted">
                        📎 {q.length > 30 ? `${q.slice(0, 30)}…` : q}
                      </button>
                    ))}
                    {saved.ready && (
                      <button type="button" onClick={() => setManageOpen(true)} className="shrink-0 rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted flex items-center gap-1">
                        <Settings2 className="w-3 h-3" /> Respuestas
                      </button>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && !sending && send()}
                    placeholder={windowOpen ? "Escribe una respuesta…" : "Ventana cerrada"}
                    disabled={!windowOpen || sending}
                    className="h-9 text-xs"
                  />
                  <Button size="sm" className="h-9 gap-1" onClick={send} disabled={!windowOpen || sending || !text.trim()}>
                    <Send className="w-3.5 h-3.5" /> {sending ? "…" : "Enviar"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
