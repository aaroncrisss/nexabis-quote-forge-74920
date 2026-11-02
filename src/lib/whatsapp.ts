import { supabase } from "@/integrations/supabase/client";

// La apikey de Evolution API vive SOLO en Supabase (secret EVOLUTION_API_KEY).
// Todos los envíos pasan por la Edge Function `whatsapp-send` (requiere sesión del equipo).
export const EVOLUTION_API_CONFIG = {
  baseUrl: "https://evoapi.nexabistech.com",
  instanceName: "NexabisTech",
  instanceId: "c7989d71-5919-4478-84e9-0711db21f1f5",
  managerUrl: "https://evoapi.nexabistech.com/manager/instance/c7989d71-5919-4478-84e9-0711db21f1f5",
  defaultAdminPhone: "56986343217",
};

const WA_FUNCTION = "whatsapp-send";

async function invokeWa<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(WA_FUNCTION, { body });
  if (error) {
    let msg = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx?.json) msg = (await ctx.json())?.error ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return data as T;
}

export function normalizeWhatsAppPhone(raw?: string | null): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 9 && digits.startsWith("9")) return `56${digits}`;
  if (digits.length === 8) return `569${digits}`;
  return digits.length >= 10 ? digits : "";
}

export interface EvolutionInstanceStatus {
  connected: boolean;
  state: string;
  instanceName: string;
  instanceId: string;
  ownerJid?: string;
}

export async function checkWhatsAppConnection(): Promise<EvolutionInstanceStatus> {
  try {
    const r = await invokeWa<{ connected: boolean; state: string; instanceName?: string }>({ action: "status" });
    return {
      connected: !!r?.connected,
      state: r?.state || "unknown",
      instanceName: r?.instanceName || EVOLUTION_API_CONFIG.instanceName,
      instanceId: EVOLUTION_API_CONFIG.instanceId,
    };
  } catch (err: any) {
    return {
      connected: false,
      state: err?.message || "offline",
      instanceName: EVOLUTION_API_CONFIG.instanceName,
      instanceId: EVOLUTION_API_CONFIG.instanceId,
    };
  }
}

export async function sendDirectEvolutionWhatsApp(
  phone: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const numero = normalizeWhatsAppPhone(phone) || EVOLUTION_API_CONFIG.defaultAdminPhone;
  try {
    return await invokeWa<{ ok: boolean; error?: string }>({ action: "send", numero, texto: text });
  } catch (err: any) {
    return { ok: false, error: err?.message || "Error enviando WhatsApp" };
  }
}

export async function sendWhatsAppEventViaN8n(
  payload: Record<string, any>
): Promise<{ ok: boolean; via: "n8n" | "evolution_direct"; error?: string }> {
  try {
    return await invokeWa<{ ok: boolean; via: "n8n" | "evolution_direct"; error?: string }>({ action: "event", payload });
  } catch (err) {
    return { ok: false, via: "evolution_direct", error: err instanceof Error ? err.message : "Error enviando WhatsApp" };
  }
}

export async function notifyTaskWhatsApp(params: {
  tipoEvento:
    | "tarea_asignada"
    | "tarea_p0"
    | "rompelinea"
    | "tarea_bloqueada"
    | "mencion"
    | "mensaje_directo";
  task: any;
  targetPhone?: string;
  responsableName?: string;
  clienteName?: string;
  customMessage?: string;
}) {
  const { tipoEvento, task, targetPhone, responsableName, clienteName, customMessage } = params;
  return sendWhatsAppEventViaN8n({
    tipo_evento: tipoEvento,
    telefono_destino: normalizeWhatsAppPhone(targetPhone) || EVOLUTION_API_CONFIG.defaultAdminPhone,
    task_id: task?.id || "",
    titulo: task?.title || "",
    prioridad: task?.priority || "P2",
    estado: task?.status || "Por hacer",
    proyecto: task?.project || "",
    cliente: clienteName || "",
    responsable: responsableName || "",
    fecha_limite: task?.deadline || "Sin fecha",
    detalle: customMessage || task?.blockerReason || task?.breakerOrigin || task?.description || "",
    mensaje: customMessage,
  });
}

export async function sendDailySummaryWhatsApp(params: {
  tasks: any[];
  userName?: string;
  targetPhone?: string;
}) {
  const { tasks, userName = "Cris", targetPhone } = params;
  const today = new Date().toISOString().slice(0, 10);
  const active = tasks.filter((t) => t.status !== "Terminada" && t.status !== "Cancelada");

  const getCat = (t: any) => {
    const raw = (t.category || "").trim();
    if (raw === "Nexabis" || raw === "Trabajo" || raw === "Diaria") return raw;
    if (t.type === "Diaria" || t.recurring?.enabled) return "Diaria";
    return "Nexabis";
  };

  const formatList = (list: any[]) =>
    list.length === 0
      ? "  _Sin pendientes activos_"
      : list
          .slice(0, 8)
          .map((t) => {
            const flag = t.deadline && t.deadline < today ? "⚠️ VENCIDA" : t.deadline === today ? "🎯 HOY" : t.priority;
            return `  • *[${flag}]* ${t.title}${t.project ? ` _(${t.project})_` : ""}`;
          })
          .join("\n");

  const nexabis = active.filter((t) => getCat(t) === "Nexabis");
  const trabajo = active.filter((t) => getCat(t) === "Trabajo");
  const diarias = active.filter((t) => getCat(t) === "Diaria");

  const msg =
    `☀️ *Resumen Operativo del Día — ${userName}*\n` +
    `📅 Fecha: ${today} · Total activas: *${active.length}*\n\n` +
    `🏢 *TRABAJO NEXABIS (${nexabis.length}):*\n${formatList(nexabis)}\n\n` +
    `💼 *TRABAJO NORMAL (${trabajo.length}):*\n${formatList(trabajo)}\n\n` +
    `☀️ *DIARIAS & PERSONALES (${diarias.length}):*\n${formatList(diarias)}\n\n` +
    `_Enviado desde Nexabis OS · Evolution API (NexabisTech)_`;

  return sendDirectEvolutionWhatsApp(
    normalizeWhatsAppPhone(targetPhone) || EVOLUTION_API_CONFIG.defaultAdminPhone,
    msg
  );
}
