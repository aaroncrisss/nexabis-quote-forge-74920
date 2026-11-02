import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { toast } from "sonner";
import type { SavedReply } from "./savedReplies";

type Draft = { id?: string; titulo: string; texto: string };

export function SavedRepliesDialog({
  open,
  onOpenChange,
  items,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: SavedReply[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Draft>({ titulo: "", texto: "" });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!draft.titulo.trim() || !draft.texto.trim()) return toast.error("Completa título y texto");
    setBusy(true);
    const row = { titulo: draft.titulo.trim(), texto: draft.texto.trim() };
    const { error } = draft.id
      ? await supabaseCRM.from("ig_respuestas").update(row).eq("id", draft.id)
      : await supabaseCRM.from("ig_respuestas").insert({ ...row, orden: (items.at(-1)?.orden ?? 0) + 1 });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDraft({ titulo: "", texto: "" });
    onChanged();
  };

  const remove = async (r: SavedReply) => {
    if (!window.confirm(`¿Eliminar "${r.titulo}"?`)) return;
    const { error } = await supabaseCRM.from("ig_respuestas").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Respuestas guardadas</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="flex items-start gap-2 rounded-md border border-border/60 p-2 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.titulo}</p>
                <p className="text-muted-foreground whitespace-pre-wrap line-clamp-3">{r.texto}</p>
              </div>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setDraft({ id: r.id, titulo: r.titulo, texto: r.texto })}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => remove(r)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          {items.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay respuestas guardadas.</p>}
        </div>
        <div className="space-y-2 rounded-md border border-border/60 p-3">
          <p className="text-xs font-semibold">{draft.id ? "Editar respuesta" : "Nueva respuesta"}</p>
          <Input value={draft.titulo} onChange={(e) => setDraft({ ...draft, titulo: e.target.value })} placeholder="Título (ej: Precios)" className="h-8 text-xs" />
          <Textarea
            rows={3}
            value={draft.texto}
            onChange={(e) => setDraft({ ...draft, texto: e.target.value })}
            placeholder="Texto. Usa {username} para nombrar a la persona."
            className="text-xs"
          />
          <div className="flex justify-end gap-2">
            {draft.id && (
              <Button size="sm" variant="ghost" onClick={() => setDraft({ titulo: "", texto: "" })}>Cancelar</Button>
            )}
            <Button size="sm" className="gap-1" onClick={save} disabled={busy}>
              <Plus className="w-3.5 h-3.5" /> {draft.id ? "Guardar cambios" : "Agregar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
