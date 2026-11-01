export const EVOLUTION_API_CONFIG = {
  baseUrl: "https://evoapi.nexabistech.com",
  instanceName: "NexabisTech",
  instanceId: "c7989d71-5919-4478-84e9-0711db21f1f5",
  managerUrl: "https://evoapi.nexabistech.com/manager/instance/c7989d71-5919-4478-84e9-0711db21f1f5",
  apiKey: "B9D3EBDA4DA5-488E-BF7D-F9CA4D2C1585",
  n8nWebhookUrl: "https://myn8n.aaroncristech.cloud/webhook/presupuestos-nexabis",
  defaultAdminPhone: "56986343217",
};

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
    const res = await fetch(
      `${EVOLUTION_API_CONFIG.baseUrl}/instance/connectionState/${EVOLUTION_API_CONFIG.instanceName}`,
      {
        headers: {
          apikey: EVOLUTION_API_CONFIG.apiKey,
        },
      }
    );
    if (!res.ok) {
      return {
        connected: false,
        state: `HTTP ${res.status}`,
        instanceName: EVOLUTION_API_CONFIG.instanceName,
        instanceId: EVOLUTION_API_CONFIG.instanceId,
      };
    }
    const data = await res.json();
    const state = data?.instance?.state || "unknown";
    return {
      connected: state === "open",
      state,
      instanceName: data?.instance?.instanceName || EVOLUTION_API_CONFIG.instanceName,
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
  const normalized = normalizeWhatsAppPhone(phone) || EVOLUTION_API_CONFIG.defaultAdminPhone;
  try {
    const res = await fetch(
      `${EVOLUTION_API_CONFIG.baseUrl}/message/sendText/${EVOLUTION_API_CONFIG.instanceName}`,
      {
        method: "POST",
        headers: {
          apikey: EVOLUTION_API_CONFIG.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: normalized,
          text,
        }),
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: `HTTP ${res.status}: ${errText}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Error de red con Evolution API" };
  }
}

export async function sendWhatsAppEventViaN8n(
  payload: Record<string, any>
): Promise<{ ok: boolean; via: "n8n" | "evolution_direct"; error?: string }> {
  try {
    const res = await fetch(EVOLUTION_API_CONFIG.n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return { ok: true, via: "n8n" };
    }
  } catch {
    // Fallback to direct Evolution API below
  }

  // Fallback direct call to Evolution API if n8n webhook fails
  const targetPhone =
    normalizeWhatsAppPhone(payload.telefono_destino) || EVOLUTION_API_CONFIG.defaultAdminPhone;
  const fallbackText =
    payload.mensaje ||
    `🔔 *Notificación Nexabis (${payload.tipo_evento || "Operaciones"})*\n\n` +
      (payload.titulo ? `*Tarea:* ${payload.task_id ? `[${payload.task_id}] ` : ""}${payload.titulo}\n` : "") +
      (payload.prioridad ? `*Prioridad:* ${payload.prioridad}\n` : "") +
      (payload.estado ? `*Estado:* ${payload.estado}\n` : "") +
      (payload.proyecto ? `*Proyecto:* ${payload.proyecto}\n` : "") +
      (payload.detalle ? `\n${payload.detalle}\n` : "");

  const direct = await sendDirectEvolutionWhatsApp(targetPhone, fallbackText);
  return { ok: direct.ok, via: "evolution_direct", error: direct.error };
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
