import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabaseCRM } from "@/integrations/supabase/crm-client";

/**
 * Link enmascarado: https://nexabistech.com/r/<código>
 * Resuelve un recurso (PDF, etc.) o un link rastreable de Instagram, cuenta el clic y redirige.
 */
export default function LinkCorto() {
  const { code = "" } = useParams();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabaseCRM.rpc("resolve_link", { p_code: code });
      if (cancelled) return;
      if (!error && typeof data === "string" && /^https?:\/\//i.test(data)) {
        window.location.replace(data);
      } else {
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
      {failed ? (
        <>
          <p className="text-lg font-semibold">Este link ya no está disponible</p>
          <a href="/" className="text-primary hover:underline text-sm">Ir a nexabistech.com</a>
        </>
      ) : (
        <>
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Abriendo…</p>
        </>
      )}
    </div>
  );
}
