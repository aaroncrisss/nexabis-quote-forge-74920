import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, ExternalLink, Pencil, Rocket, Trash2, Upload, Film, Image as ImageIcon, CircleDot, Layers, Copy } from "lucide-react";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import { nextOccurrence, slotLabel, type Slot } from "./analytics";

type Tipo = "reel" | "imagen" | "historia" | "carrusel";
type Item = { url: string; es_video: boolean; path: string };
type Estado = "borrador" | "programado" | "procesando" | "publicado" | "error";

export type IgPost = {
  id: string;
  tipo: Tipo;
  media_url: string;
  storage_path: string | null;
  es_video: boolean;
  caption: string;
  compartir_feed: boolean;
  publicar_en: string;
  estado: Estado;
  campaign_id: string | null;
  media_id: string | null;
  permalink: string | null;
  error: string | null;
  publicado_at: string | null;
  media_items?: Item[] | null;
};

type Draft = {
  id?: string;
  tipo: Tipo;
  caption: string;
  compartir_feed: boolean;
  fecha: string; // datetime-local
  campaign_id: string;
  media_url: string;
  storage_path: string | null;
  es_video: boolean;
  media_items: Item[];
};

const BUCKET = "ig-media";
const MAX_BYTES = 50 * 1024 * 1024;
const NONE = "__none__";

const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const newDraft = (): Draft => ({
  tipo: "reel",
  caption: "",
  compartir_feed: true,
  fecha: toLocalInput(new Date(Date.now() + 3600_000)),
  campaign_id: NONE,
  media_url: "",
  storage_path: null,
  es_video: true,
  media_items: [],
});

const ESTADO: Record<Estado, { label: string; cls: string }> = {
  borrador: { label: "Borrador", cls: "text-muted-foreground" },
  programado: { label: "Programado", cls: "text-blue-400 border-blue-500/40" },
  procesando: { label: "Procesando en Meta", cls: "text-amber-400 border-amber-500/40" },
  publicado: { label: "Publicado", cls: "text-green-400 border-green-500/40" },
  error: { label: "Error", cls: "text-red-400 border-red-500/40" },
};

const TIPO_ICON: Record<Tipo, typeof Film> = { reel: Film, imagen: ImageIcon, historia: CircleDot, carrusel: Layers };

export function ContentScheduler({
  campaigns,
  connected,
  invoke,
  onPublished,
  bestSlots = [],
  presetDate,
}: {
  campaigns: { id?: string; nombre: string; alcance?: "general" | "posts" }[];
  connected: boolean;
  invoke: (body: Record<string, unknown>) => Promise<{ ok?: boolean; result?: string; error?: string; scopes?: string[] }>;
  onPublished?: () => void;
  bestSlots?: Slot[];
  /** Fecha sugerida desde Analítica ("programar en este horario") */
  presetDate?: Date | null;
}) {
  const [posts, setPosts] = useState<IgPost[]>([]);
  const [ready, setReady] = useState(true);
  const [draft, setDraft] = useState<Draft>(newDraft);

  useEffect(() => {
    if (presetDate) setDraft((d) => ({ ...d, fecha: toLocalInput(presetDate) }));
  }, [presetDate]);
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [scopes, setScopes] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabaseCRM.from("ig_posts").select("*").order("publicar_en", { ascending: true });
    setReady(!error);
    setPosts((data as IgPost[]) ?? []);
  }, []);

  useEffect(() => {
    load();
    // Refleja el avance del cron; nunca con la pestaña del navegador oculta
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 30_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!connected) return;
    invoke({ action: "permissions" })
      .then((r) => setScopes(r.scopes ?? null))
      .catch(() => setScopes(null));
  }, [connected, invoke]);

  useEffect(() => {
    if (!file) return setPreview(null);
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const campaignName = useMemo(() => new Map(campaigns.map((c) => [c.id, c.nombre])), [campaigns]);
  const missingPublish = scopes && !scopes.includes("instagram_content_publish") && !scopes.includes("instagram_business_content_publish");

  const pending = posts.filter((p) => p.estado !== "publicado");
  const done = posts.filter((p) => p.estado === "publicado").reverse();

  const groups = useMemo(() => {
    const m = new Map<string, IgPost[]>();
    for (const p of pending) {
      const k = new Date(p.publicar_en).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
      m.set(k, [...(m.get(k) ?? []), p]);
    }
    return [...m.entries()];
  }, [pending]);

  const uploadOne = async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() || (f.type.startsWith("video/") ? "mp4" : "jpg");
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const up = await supabaseCRM.storage.from(BUCKET).upload(path, f, { contentType: f.type, upsert: false });
    if (up.error) throw new Error(up.error.message);
    return { path, url: supabaseCRM.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, es_video: f.type.startsWith("video/") };
  };

  const save = async (estado: "programado" | "borrador") => {
    const isCarousel = draft.tipo === "carrusel";
    if (isCarousel) {
      const n = files.length || draft.media_items.length;
      if (n < 2 || n > 10) return toast.error("Un carrusel lleva entre 2 y 10 archivos");
      if (files.some((f) => f.size > MAX_BYTES)) return toast.error("Máximo 50 MB por archivo");
      if (files.some((f) => !f.type.startsWith("video/") && !/jpe?g$/i.test(f.type))) return toast.error("Imágenes del carrusel: solo JPG");
    } else if (!file && !draft.media_url) return toast.error(draft.tipo === "reel" ? "Sube el video del reel" : "Sube la imagen o video");
    if (file && file.size > MAX_BYTES) return toast.error("Máximo 50 MB por archivo (límite de Supabase)");
    const when = new Date(draft.fecha);
    if (Number.isNaN(when.getTime())) return toast.error("Fecha inválida");
    if (estado === "programado" && when.getTime() < Date.now() - 60_000) return toast.error("La fecha ya pasó: usa “Publicar ahora”");
    if (draft.caption.length > 2200) return toast.error("El texto supera 2.200 caracteres");

    setBusy(true);
    try {
      let { media_url, storage_path, es_video } = draft;
      let media_items = draft.media_items;
      if (isCarousel && files.length) {
        const uploaded: Item[] = [];
        for (const f of files) uploaded.push(await uploadOne(f));
        const old = draft.media_items.map((i) => i.path).filter(Boolean);
        if (old.length) await supabaseCRM.storage.from(BUCKET).remove(old);
        media_items = uploaded;
      }
      if (isCarousel) {
        media_url = media_items[0].url;
        es_video = media_items[0].es_video;
        storage_path = null;
      } else if (file) {
        es_video = file.type.startsWith("video/");
        if (draft.tipo === "reel" && !es_video) throw new Error("Un reel necesita un video (MP4/MOV)");
        if (draft.tipo === "imagen" && es_video) throw new Error("Para video elige Reel o Historia");
        if (draft.tipo === "imagen" && !/jpe?g$/i.test(file.type)) throw new Error("Instagram solo acepta imágenes JPG");
        const ext = file.name.split(".").pop()?.toLowerCase() || (es_video ? "mp4" : "jpg");
        const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
        const up = await supabaseCRM.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        if (up.error) throw new Error(up.error.message);
        if (storage_path) await supabaseCRM.storage.from(BUCKET).remove([storage_path]);
        storage_path = path;
        media_url = supabaseCRM.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }
      const row = {
        tipo: draft.tipo,
        caption: draft.caption,
        compartir_feed: draft.compartir_feed,
        publicar_en: when.toISOString(),
        campaign_id: draft.campaign_id === NONE ? null : draft.campaign_id,
        media_url,
        storage_path,
        es_video,
        media_items: isCarousel ? media_items : [],
        children_ids: null,
        estado,
        error: null,
        container_id: null,
        intentos: 0,
      };
      const { error } = draft.id
        ? await supabaseCRM.from("ig_posts").update(row).eq("id", draft.id)
        : await supabaseCRM.from("ig_posts").insert(row);
      if (error) throw new Error(error.message);
      toast.success(estado === "programado" ? `Programado para ${when.toLocaleString("es-CL")}` : "Borrador guardado");
      setDraft(newDraft());
      setFile(null);
      setFiles([]);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const edit = (p: IgPost) => {
    setDraft({
      id: p.id,
      tipo: p.tipo,
      caption: p.caption,
      compartir_feed: p.compartir_feed,
      fecha: toLocalInput(new Date(p.publicar_en)),
      campaign_id: p.campaign_id ?? NONE,
      media_url: p.media_url,
      storage_path: p.storage_path,
      es_video: p.es_video,
      media_items: p.media_items ?? [],
    });
    setFile(null);
    setFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Reutilizar: copia el contenido (mismo archivo y texto) como nueva publicación en 1 día. */
  const duplicate = (p: IgPost) => {
    setDraft({
      tipo: p.tipo,
      caption: p.caption,
      compartir_feed: p.compartir_feed,
      fecha: toLocalInput(new Date(Date.now() + 86400_000)),
      campaign_id: p.campaign_id ?? NONE,
      media_url: p.media_url,
      storage_path: null, // no compartir la ruta: borrar uno no debe borrar el archivo del otro
      es_video: p.es_video,
      media_items: (p.media_items ?? []).map((i) => ({ ...i, path: "" })),
    });
    setFile(null);
    setFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info("Copiado al formulario: ajusta la fecha y programa");
  };

  const remove = async (p: IgPost) => {
    if (!window.confirm("¿Eliminar esta publicación programada? (Si ya se publicó en Instagram, allá no se borra)")) return;
    const { error } = await supabaseCRM.from("ig_posts").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    if (p.estado !== "publicado") {
      const paths = [p.storage_path, ...(p.media_items ?? []).map((i) => i.path)].filter(Boolean) as string[];
      if (paths.length) await supabaseCRM.storage.from(BUCKET).remove(paths);
    }
    load();
  };

  const publishNow = async (p: IgPost) => {
    setPublishing(p.id);
    try {
      const r = await invoke({ action: "publish_now", id: p.id });
      if (r.ok === false) throw new Error(r.error);
      const res = r.result ?? "";
      if (res === "publicado") {
        toast.success("¡Publicado en Instagram!");
        onPublished?.();
      } else if (res === "procesando") toast.info("Meta está procesando el video. Se publicará solo en unos minutos.");
      else if (res.startsWith("error")) toast.error(res);
      else toast.info(res);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPublishing(null);
      load();
    }
  };

  if (!ready) {
    return <Card className="p-4 text-xs text-muted-foreground">Aplica la migración 20261101_04 para programar contenido.</Card>;
  }

  const showPreview = preview ?? (draft.media_url || null);
  const previewIsVideo = file ? file.type.startsWith("video/") : draft.es_video;

  return (
    <div className="space-y-3">
      {missingPublish && (
        <Card className="p-3 text-xs border-orange-500/40 text-orange-300">
          Tu token no tiene el permiso <code>instagram_content_publish</code>. Genera un token nuevo en Meta incluyendo ese permiso y
          vuelve a conectarlo arriba; si no, las publicaciones fallarán.
        </Card>
      )}

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" /> {draft.id ? "Editar publicación" : "Programar publicación"}
          </h2>
          {draft.id && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setDraft(newDraft()); setFile(null); }}>
              Cancelar edición
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-[1fr_200px] gap-4">
          <div className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={draft.tipo} onValueChange={(v) => setDraft({ ...draft, tipo: v as Tipo })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reel">Reel (video)</SelectItem>
                    <SelectItem value="imagen">Post (imagen JPG)</SelectItem>
                    <SelectItem value="carrusel">Carrusel (2 a 10)</SelectItem>
                    <SelectItem value="historia">Historia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Fecha y hora de publicación</Label>
                <Input type="datetime-local" value={draft.fecha} onChange={(e) => setDraft({ ...draft, fecha: e.target.value })} />
                {bestSlots.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10px] text-muted-foreground">Mejores horarios:</span>
                    {bestSlots.map((s, i) => (
                      <button
                        key={`${s.dow}-${s.hour}`}
                        type="button"
                        onClick={() => setDraft({ ...draft, fecha: toLocalInput(nextOccurrence(s)) })}
                        className={`rounded-full border px-2 py-0.5 text-[10px] hover:bg-primary/10 ${i === 0 ? "border-primary text-primary" : "border-border"}`}
                      >
                        {i === 0 ? "🏆 " : ""}{slotLabel(s)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {draft.tipo === "carrusel" ? (
              <div className="space-y-1">
                <Label className="text-xs">
                  Archivos del carrusel (2 a 10, JPG o MP4, en orden) · {files.length || draft.media_items.length} elegidos
                </Label>
                <Input
                  type="file"
                  multiple
                  accept="image/jpeg,video/mp4,video/quicktime"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 10))}
                />
              </div>
            ) : (
            <div className="space-y-1">
              <Label className="text-xs">
                Archivo {draft.tipo === "reel" ? "(MP4 vertical 9:16, 3 s a 15 min)" : draft.tipo === "imagen" ? "(JPG)" : "(JPG o MP4 vertical)"} · máx 50 MB
              </Label>
              <Input
                type="file"
                accept={draft.tipo === "reel" ? "video/mp4,video/quicktime" : draft.tipo === "imagen" ? "image/jpeg" : "image/jpeg,video/mp4,video/quicktime"}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            )}

            {draft.tipo !== "historia" && (
              <div className="space-y-1">
                <Label className="text-xs">Texto / caption ({draft.caption.length}/2200)</Label>
                <Textarea
                  rows={5}
                  value={draft.caption}
                  onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
                  placeholder={"Comenta GUIA y te envío el PDF gratis por DM 📩\n\n#automatizacion #negocios"}
                />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Campaña de este video</Label>
                <Select value={draft.campaign_id} onValueChange={(v) => setDraft({ ...draft, campaign_id: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Ninguna</SelectItem>
                    {campaigns.filter((c) => c.id).map((c) => (
                      <SelectItem key={c.id} value={c.id!}>
                        {c.alcance === "general" ? "🌐" : "🎬"} {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  {campaigns.find((c) => c.id === draft.campaign_id)?.alcance === "general"
                    ? "🌐 Campaña general: ya responde en todos los posts; al publicar solo se activa."
                    : "🎬 Al publicar, el video se suma a la campaña y se activa. Solo responde en sus videos."}
                </p>
              </div>
              {draft.tipo === "reel" && (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 h-fit mt-5">
                  <Label className="text-xs">Mostrar también en el feed</Label>
                  <Switch checked={draft.compartir_feed} onCheckedChange={(v) => setDraft({ ...draft, compartir_feed: v })} />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-muted/40 aspect-[9/16] overflow-hidden flex items-center justify-center text-xs text-muted-foreground">
            {draft.tipo === "carrusel" ? (
              <CarouselPreview files={files} items={draft.media_items} />
            ) : showPreview ? (
              previewIsVideo ? (
                <video src={showPreview} className="w-full h-full object-cover" controls muted />
              ) : (
                <img src={showPreview} alt="" className="w-full h-full object-cover" />
              )
            ) : (
              <span className="flex flex-col items-center gap-1"><Upload className="w-5 h-5" /> Vista previa</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => save("borrador")} disabled={busy}>Guardar borrador</Button>
          <Button size="sm" className="gradient-button gap-1" onClick={() => save("programado")} disabled={busy}>
            <CalendarClock className="w-4 h-4" /> {busy ? "Subiendo…" : "Programar"}
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-sm font-semibold">Calendario ({pending.length} pendientes)</h2>
        {groups.length === 0 && <p className="text-xs text-muted-foreground">No hay publicaciones pendientes.</p>}
        {groups.map(([day, items]) => (
          <div key={day} className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{day}</p>
            {items.map((p) => (
              <PostRow
                key={p.id}
                p={p}
                campaign={p.campaign_id ? campaignName.get(p.campaign_id) : undefined}
                onEdit={() => edit(p)}
                onDelete={() => remove(p)}
                onPublish={() => publishNow(p)}
                onDuplicate={() => duplicate(p)}
                publishing={publishing === p.id}
                connected={connected}
              />
            ))}
          </div>
        ))}
      </Card>

      {done.length > 0 && (
        <Card className="p-4 space-y-1.5">
          <h2 className="text-sm font-semibold">Publicados ({done.length})</h2>
          {done.slice(0, 30).map((p) => (
            <PostRow
              key={p.id}
              p={p}
              campaign={p.campaign_id ? campaignName.get(p.campaign_id) : undefined}
              onDelete={() => remove(p)}
              onDuplicate={() => duplicate(p)}
              connected={connected}
            />
          ))}
        </Card>
      )}
    </div>
  );
}

function PostRow({
  p,
  campaign,
  onEdit,
  onDelete,
  onPublish,
  onDuplicate,
  publishing,
  connected,
}: {
  p: IgPost;
  campaign?: string;
  onEdit?: () => void;
  onDelete: () => void;
  onPublish?: () => void;
  onDuplicate?: () => void;
  publishing?: boolean;
  connected: boolean;
}) {
  const Icon = TIPO_ICON[p.tipo];
  const st = ESTADO[p.estado];
  const when = new Date(p.publicado_at ?? p.publicar_en);
  return (
    <div className="flex items-start gap-3 rounded-md border border-border/50 p-2 text-xs">
      <div className="w-12 h-16 rounded bg-muted overflow-hidden shrink-0">
        {p.es_video ? (
          <video src={p.media_url} className="w-full h-full object-cover" muted preload="metadata" />
        ) : (
          <img src={p.media_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium">{when.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
          {p.estado === "publicado" && <span className="text-muted-foreground">{when.toLocaleDateString("es-CL")}</span>}
          <Badge variant="outline" className={`text-[10px] ${st.cls}`}>{st.label}</Badge>
          {p.tipo === "carrusel" && <Badge variant="outline" className="text-[10px]">{p.media_items?.length ?? 0} archivos</Badge>}
          {campaign && <Badge variant="outline" className="text-[10px]">Campaña: {campaign}</Badge>}
        </div>
        <p className="text-muted-foreground line-clamp-2 whitespace-pre-wrap">{p.caption || (p.tipo === "historia" ? "Historia" : "Sin texto")}</p>
        {p.error && <p className="text-red-400">{p.error}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {p.permalink && (
          <a href={p.permalink} target="_blank" rel="noreferrer" className="inline-flex h-7 px-2 items-center text-muted-foreground hover:text-foreground" title="Ver en Instagram">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {onPublish && p.estado !== "procesando" && (
          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-[11px]" onClick={onPublish} disabled={publishing || !connected} title="Publicar ahora">
            <Rocket className="w-3.5 h-3.5" /> {publishing ? "…" : p.estado === "error" ? "Reintentar" : "Ahora"}
          </Button>
        )}
        {onDuplicate && (
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onDuplicate} title="Reutilizar (copiar)">
            <Copy className="w-3.5 h-3.5" />
          </Button>
        )}
        {onEdit && p.estado !== "procesando" && (
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onEdit} title="Editar">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={onDelete} title="Eliminar">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function CarouselPreview({ files, items }: { files: File[]; items: Item[] }) {
  const [urls, setUrls] = useState<{ url: string; video: boolean }[]>([]);
  useEffect(() => {
    if (!files.length) {
      setUrls(items.map((i) => ({ url: i.url, video: i.es_video })));
      return;
    }
    const u = files.map((f) => ({ url: URL.createObjectURL(f), video: f.type.startsWith("video/") }));
    setUrls(u);
    return () => u.forEach((x) => URL.revokeObjectURL(x.url));
  }, [files, items]);
  if (!urls.length) {
    return <span className="flex flex-col items-center gap-1"><Layers className="w-5 h-5" /> 2 a 10 archivos</span>;
  }
  return (
    <div className="grid grid-cols-2 gap-1 p-1 w-full h-full content-start overflow-y-auto">
      {urls.map((x, i) => (
        <div key={x.url} className="relative aspect-square rounded overflow-hidden bg-muted">
          {x.video ? <video src={x.url} className="w-full h-full object-cover" muted /> : <img src={x.url} alt="" className="w-full h-full object-cover" />}
          <span className="absolute top-0.5 left-0.5 rounded bg-black/70 px-1 text-[9px] text-white">{i + 1}</span>
        </div>
      ))}
    </div>
  );
}
