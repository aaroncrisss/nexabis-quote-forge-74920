import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink, FileText, Trash2, Upload, Link2 } from "lucide-react";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";

export type Recurso = {
  slug: string;
  titulo: string;
  destino: string;
  storage_path: string | null;
  mime: string | null;
  bytes: number | null;
  clics: number;
  ultimo_clic_at: string | null;
  created_at: string;
};

export const LINK_BASE = "https://ecosistema.nexabistech.com/r/";
const BUCKET = "recursos";
const MAX_BYTES = 50 * 1024 * 1024;

export const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const fmtBytes = (n: number | null) =>
  !n ? "" : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

export function ResourcesManager({ onChange }: { onChange?: () => void }) {
  const [items, setItems] = useState<Recurso[]>([]);
  const [ready, setReady] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabaseCRM.from("ig_recursos").select("*").order("created_at", { ascending: false });
    setReady(!error);
    setItems((data as Recurso[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setTitulo("");
    setSlug("");
    setUrl("");
    setFile(null);
  };

  const create = async () => {
    const s = toSlug(slug || titulo);
    if (!titulo.trim()) return toast.error("Ponle un título");
    if (s.length < 2) return toast.error("El link necesita al menos 2 caracteres");
    if (!file && !/^https?:\/\//i.test(url)) return toast.error("Sube un archivo o pega un link https://");
    if (file && file.size > MAX_BYTES) return toast.error("Máximo 50 MB por archivo");
    setBusy(true);
    try {
      let destino = url.trim();
      let storage_path: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        storage_path = `${s}-${Date.now().toString(36)}.${ext}`;
        const up = await supabaseCRM.storage.from(BUCKET).upload(storage_path, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
        if (up.error) throw new Error(up.error.message);
        destino = supabaseCRM.storage.from(BUCKET).getPublicUrl(storage_path).data.publicUrl;
      }
      const { error } = await supabaseCRM.from("ig_recursos").insert({
        slug: s,
        titulo: titulo.trim(),
        destino,
        storage_path,
        mime: file?.type ?? null,
        bytes: file?.size ?? null,
      });
      if (error) {
        if (storage_path) await supabaseCRM.storage.from(BUCKET).remove([storage_path]);
        throw new Error(error.code === "23505" ? `Ya existe un link /r/${s}` : error.message);
      }
      toast.success(`Listo: ${LINK_BASE}${s}`);
      reset();
      load();
      onChange?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: Recurso) => {
    if (!window.confirm(`¿Eliminar "${r.titulo}"? El link ${LINK_BASE}${r.slug} dejará de funcionar.`)) return;
    const { error } = await supabaseCRM.from("ig_recursos").delete().eq("slug", r.slug);
    if (error) return toast.error(error.message);
    if (r.storage_path) await supabaseCRM.storage.from(BUCKET).remove([r.storage_path]);
    toast.success("Eliminado");
    load();
    onChange?.();
  };

  const copy = (s: string) => {
    navigator.clipboard.writeText(`${LINK_BASE}${s}`);
    toast.success("Link copiado");
  };

  if (!ready) {
    return <Card className="p-4 text-xs text-muted-foreground">Aplica la migración 20261101_04 para usar Archivos.</Card>;
  }

  return (
    <div className="space-y-3">
      <Card className="p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> Subir archivo o crear link</h2>
          <p className="text-xs text-muted-foreground">
            Sube un PDF (o cualquier archivo, máx 50 MB) y obtén un link con tu dominio: <code>{LINK_BASE}tu-link</code>. Úsalo como link de una campaña.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Guía gratis: automatiza tu negocio" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Link (ecosistema.nexabistech.com/r/…)</Label>
            <Input value={slug} onChange={(e) => setSlug(toSlug(e.target.value))} placeholder={toSlug(titulo) || "guia-gratis"} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Archivo</Label>
            <Input type="file" accept=".pdf,image/*,video/*,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">…o enmascarar un link externo</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." disabled={!!file} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" className="gradient-button gap-1" onClick={create} disabled={busy}>
            <Link2 className="w-4 h-4" /> {busy ? "Subiendo…" : "Crear link"}
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold mb-2">Mis archivos y links ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aún no hay archivos.</p>
        ) : (
          <div className="divide-y divide-border/50">
            {items.map((r) => (
              <div key={r.slug} className="flex items-center gap-3 py-2 text-xs">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{r.titulo}</p>
                  <p className="text-muted-foreground truncate">
                    {LINK_BASE}{r.slug} {r.bytes ? `· ${fmtBytes(r.bytes)}` : ""} · {r.clics} clic{r.clics === 1 ? "" : "s"}
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 px-2" title="Copiar link" onClick={() => copy(r.slug)}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <a href={r.destino} target="_blank" rel="noreferrer" title="Abrir" className="inline-flex h-7 px-2 items-center text-muted-foreground hover:text-foreground">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" title="Eliminar" onClick={() => remove(r)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
