// =============================================================================
// whatsapp-send
// Proxy server-side hacia Evolution API para que la apikey NO viaje al navegador.
// Solo usuarios autenticados que sean admin (user_roles) o integrantes (team_members).
//
// Acciones (POST JSON):
//   { action: "status" }                          -> estado de conexión de la instancia
//   { action: "send", numero, texto }             -> mensaje de texto directo
//   { action: "event", payload }                  -> webhook n8n; si falla, envío directo
//
// Secrets: EVOLUTION_API_KEY (obligatorio), EVOLUTION_API_URL, EVOLUTION_INSTANCE,
//          N8N_WHATSAPP_WEBHOOK, WHATSAPP_ADMIN_PHONE (opcionales)
// Deploy: npx supabase functions deploy whatsapp-send --project-ref htwuamsbzaznmwuypflt --no-verify-jwt
// =============================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EVO_URL = (Deno.env.get("EVOLUTION_API_URL") ?? "https://evoapi.nexabistech.com").replace(/\/+$/, "");
const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY") ?? "";
const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") ?? "NexabisTech";
const N8N_URL = Deno.env.get("N8N_WHATSAPP_WEBHOOK") ?? "https://myn8n.aaroncristech.cloud/webhook/presupuestos-nexabis";
const ADMIN_PHONE = Deno.env.get("WHATSAPP_ADMIN_PHONE") ?? "56986343217";
const MAX_TEXT = 4000;

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function normalizePhone(raw?: unknown): string {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 9 && d.startsWith("9")) return `56${d}`;
  if (d.length === 8) return `569${d}`;
  return d.length >= 10 && d.length <= 15 ? d : "";
}

async function isTeam(req: Request): Promise<boolean> {
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return false;
  const { data, error } = await db.auth.getUser(jwt);
  if (error || !data?.user) return false;
  const uid = data.user.id;
  const [{ count: adm }, { count: tm }] = await Promise.all([
    db.from("user_roles").select("user_id", { count: "exact", head: true }).eq("user_id", uid).eq("role", "admin"),
    db.from("team_members").select("id", { count: "exact", head: true }).eq("user_id", uid),
  ]);
  return (adm ?? 0) > 0 || (tm ?? 0) > 0;
}

async function sendText(numero: string, texto: string): Promise<{ ok: boolean; error?: string }> {
  if (!EVO_KEY) return { ok: false, error: "EVOLUTION_API_KEY no configurada en Supabase" };
  try {
    const res = await fetch(`${EVO_URL}/message/sendText/${encodeURIComponent(EVO_INSTANCE)}`, {
      method: "POST",
      headers: { apikey: EVO_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ number: numero, text: texto.slice(0, MAX_TEXT) }),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Error de red con Evolution API: ${String(e)}` };
  }
}

function eventText(p: Record<string, unknown>): string {
  if (p.mensaje) return String(p.mensaje);
  return (
    `🔔 *Notificación Nexabis (${p.tipo_evento || "Operaciones"})*\n\n` +
    (p.titulo ? `*Tarea:* ${p.task_id ? `[${p.task_id}] ` : ""}${p.titulo}\n` : "") +
    (p.prioridad ? `*Prioridad:* ${p.prioridad}\n` : "") +
    (p.estado ? `*Estado:* ${p.estado}\n` : "") +
    (p.proyecto ? `*Proyecto:* ${p.proyecto}\n` : "") +
    (p.detalle ? `\n${p.detalle}\n` : "")
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);
  if (!(await isTeam(req))) return json({ ok: false, error: "No autorizado" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "JSON inválido" }, 400);
  }

  switch (body.action) {
    case "status": {
      if (!EVO_KEY) return json({ connected: false, state: "EVOLUTION_API_KEY no configurada", instanceName: EVO_INSTANCE });
      try {
        const res = await fetch(`${EVO_URL}/instance/connectionState/${encodeURIComponent(EVO_INSTANCE)}`, {
          headers: { apikey: EVO_KEY },
        });
        if (!res.ok) return json({ connected: false, state: `HTTP ${res.status}`, instanceName: EVO_INSTANCE });
        const data = await res.json();
        const state = data?.instance?.state || "unknown";
        return json({ connected: state === "open", state, instanceName: data?.instance?.instanceName || EVO_INSTANCE });
      } catch (e) {
        return json({ connected: false, state: String(e), instanceName: EVO_INSTANCE });
      }
    }

    case "send": {
      const numero = normalizePhone(body.numero) || ADMIN_PHONE;
      const texto = String(body.texto ?? "").trim();
      if (!texto) return json({ ok: false, error: "Texto vacío" }, 400);
      return json(await sendText(numero, texto));
    }

    case "event": {
      const payload = (body.payload ?? {}) as Record<string, unknown>;
      payload.telefono_destino = normalizePhone(payload.telefono_destino) || ADMIN_PHONE;
      try {
        const res = await fetch(N8N_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) return json({ ok: true, via: "n8n" });
      } catch {
        /* fallback directo */
      }
      const r = await sendText(String(payload.telefono_destino), eventText(payload));
      return json({ ...r, via: "evolution_direct" });
    }

    default:
      return json({ ok: false, error: "Acción desconocida" }, 400);
  }
});
