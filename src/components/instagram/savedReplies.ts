import { useCallback, useEffect, useState } from "react";
import { supabaseCRM } from "@/integrations/supabase/crm-client";

export type SavedReply = { id: string; titulo: string; texto: string; orden: number };

/** Respuestas guardadas (tabla ig_respuestas). `ready=false` si la migración no está aplicada. */
export function useSavedReplies() {
  const [items, setItems] = useState<SavedReply[]>([]);
  const [ready, setReady] = useState(true);

  const reload = useCallback(async () => {
    const { data, error } = await supabaseCRM
      .from("ig_respuestas")
      .select("id, titulo, texto, orden")
      .order("orden")
      .order("created_at");
    setReady(!error);
    setItems((data as SavedReply[]) ?? []);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, ready, reload };
}

/** Reemplaza {username} por el usuario de la conversación. */
export const fillReply = (texto: string, username?: string | null) =>
  texto.split("{username}").join(username ? `@${username}` : "");
