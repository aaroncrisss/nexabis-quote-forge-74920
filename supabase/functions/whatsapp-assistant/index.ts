import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVO_URL = Deno.env.get("EVOLUTION_API_URL") || "https://evoapi.nexabistech.com";
const EVO_KEY = Deno.env.get("EVOLUTION_API_KEY") || "B9D3EBDA4DA5-488E-BF7D-F9CA4D2C1585";
const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "NexabisTech";
const TARGET_PHONE = "56986343217";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://htwuamsbzaznmwuypflt.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Audio & STT Engines Configuration (Gemini is 100% optional fallback)
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const AUDIO_TRANSCRIPTION_WEBHOOK = Deno.env.get("AUDIO_TRANSCRIPTION_WEBHOOK") || "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
// AUDIO_ENGINE: "auto" | "groq" | "openai" | "webhook" | "gemini" | "none"
const AUDIO_ENGINE = (Deno.env.get("AUDIO_ENGINE") || "auto").toLowerCase();

function getChileTodayISO(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

function addDaysISO(baseISO: string, days: number): string {
  const [y, m, d] = baseISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function getNextDayOfWeekISO(baseISO: string, dayIndex: number): string {
  // dayIndex: 0 = Domingo, 1 = Lunes, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes, 6 = Sábado
  const [y, m, d] = baseISO.split("-").map(Number);
  const current = new Date(Date.UTC(y, m - 1, d));
  const currentDay = current.getUTCDay();
  let diff = dayIndex - currentDay;
  if (diff <= 0) diff += 7;
  const target = new Date(Date.UTC(y, m - 1, d + diff));
  return target.toISOString().slice(0, 10);
}

async function sendWhatsAppMessage(phone: string, text: string) {
  const cleanPhone = phone.replace(/[^\d]/g, "");
  const res = await fetch(`${EVO_URL}/message/sendText/${encodeURIComponent(EVO_INSTANCE)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVO_KEY,
    },
    body: JSON.stringify({
      number: cleanPhone,
      text,
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function base64ToBlob(base64: string, mime: string): Blob {
  const clean = base64.replace(/^data:[^;]+;base64,/, "").trim();
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

// -----------------------------------------------------------------------------
// STT ENGINE 1: GROQ WHISPER (Ultra-rápido, sin Gemini, open-source whisper-large-v3-turbo)
// -----------------------------------------------------------------------------
async function transcribeWithGroq(base64: string, mime: string, apiKey: string): Promise<string | null> {
  try {
    const blob = base64ToBlob(base64, mime);
    const form = new FormData();
    form.append("file", blob, "audio.ogg");
    form.append("model", "whisper-large-v3-turbo");
    form.append("language", "es");
    form.append("response_format", "json");

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });
    if (!res.ok) {
      console.warn("Groq transcription HTTP error:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json();
    return data.text?.trim() || null;
  } catch (err) {
    console.error("Groq Whisper error:", err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// STT ENGINE 2: OPENAI WHISPER (Estándar nativo whisper-1)
// -----------------------------------------------------------------------------
async function transcribeWithOpenAI(base64: string, mime: string, apiKey: string): Promise<string | null> {
  try {
    const blob = base64ToBlob(base64, mime);
    const form = new FormData();
    form.append("file", blob, "audio.ogg");
    form.append("model", "whisper-1");
    form.append("language", "es");
    form.append("response_format", "json");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });
    if (!res.ok) {
      console.warn("OpenAI transcription HTTP error:", res.status);
      return null;
    }
    const data = await res.json();
    return data.text?.trim() || null;
  } catch (err) {
    console.error("OpenAI Whisper error:", err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// STT ENGINE 3: CUSTOM WEBHOOK / N8N / WHISPER LOCAL
// -----------------------------------------------------------------------------
async function transcribeWithWebhook(base64: string, mime: string, webhookUrl: string): Promise<string | null> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64,
        mimetype: mime,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data === "string") return data.trim();
    return data?.text?.trim() || data?.transcription?.trim() || null;
  } catch (err) {
    console.error("Webhook transcription error:", err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// STT ENGINE 4: GEMINI FALLBACK (Opcional, sólo si no hay Groq/OpenAI/Webhook)
// -----------------------------------------------------------------------------
async function transcribeWithGemini(base64: string, mime: string, apiKey: string): Promise<string | null> {
  try {
    const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "").trim();
    const cleanMime = (mime || "audio/ogg").split(";")[0];
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Transcribe exactamente este audio en español como el título conciso de una tarea por hacer. Devuelve SOLO el texto transcrito sin comillas ni formato markdown.",
                },
                {
                  inline_data: {
                    mime_type: cleanMime,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );
    if (!geminiRes.ok) return null;
    const gData = await geminiRes.json();
    return gData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) {
    console.error("Gemini transcription error:", err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// MULTI-ENGINE AUDIO PROCESSOR
// -----------------------------------------------------------------------------
async function tryProcessAudioMessage(
  messageKey: any,
  messageObj: any,
  supabaseClient?: any
): Promise<{
  transcription: string | null;
  audio: { base64: string; mimeType: string } | null;
}> {
  // 1. Check if Evolution API already transcribed the voice note natively
  const nativeTranscription =
    messageObj.conversation ||
    messageObj.extendedTextMessage?.text ||
    messageObj.audioMessage?.text;

  if (nativeTranscription && typeof nativeTranscription === "string" && nativeTranscription.trim().length > 3) {
    return {
      transcription: nativeTranscription.trim(),
      audio: null,
    };
  }

  // 2. Fetch raw audio from Evolution API
  let base64Audio = "";
  let mimeType = "audio/ogg; codecs=opus";

  try {
    const mediaRes = await fetch(
      `${EVO_URL}/chat/getBase64FromMediaMessage/${encodeURIComponent(EVO_INSTANCE)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVO_KEY,
        },
        body: JSON.stringify({
          message: { key: messageKey },
          convertToMp4: false,
        }),
      }
    );

    if (mediaRes.ok) {
      const mediaData = await mediaRes.json();
      base64Audio = mediaData?.base64 || "";
      mimeType = mediaData?.mimetype || mimeType;
    }
  } catch (err) {
    console.error("Error fetching audio base64 from Evolution:", err);
  }

  if (!base64Audio) {
    return { transcription: null, audio: null };
  }

  const audioPayload = { base64: base64Audio, mimeType };

  // Load dynamic STT config from crm_config if environment variables are not set
  let activeEngine = AUDIO_ENGINE;
  let activeGroqKey = GROQ_API_KEY;
  let activeOpenaiKey = OPENAI_API_KEY;
  let activeWebhook = AUDIO_TRANSCRIPTION_WEBHOOK;
  let activeGeminiKey = GEMINI_API_KEY;

  if (supabaseClient) {
    try {
      const { data: dbCfg } = await supabaseClient
        .from("crm_config")
        .select("valor")
        .eq("clave", "stt_config")
        .maybeSingle();

      if (dbCfg?.valor) {
        if (dbCfg.valor.audioEngine) activeEngine = String(dbCfg.valor.audioEngine).toLowerCase();
        if (dbCfg.valor.groqApiKey) activeGroqKey = String(dbCfg.valor.groqApiKey).trim();
        if (dbCfg.valor.openaiApiKey) activeOpenaiKey = String(dbCfg.valor.openaiApiKey).trim();
        if (dbCfg.valor.webhookUrl) activeWebhook = String(dbCfg.valor.webhookUrl).trim();
        if (dbCfg.valor.geminiApiKey) activeGeminiKey = String(dbCfg.valor.geminiApiKey).trim();
      }
    } catch (e) {
      console.warn("Could not read stt_config from crm_config:", e);
    }
  }

  // If user selected "none" / Zero-AI direct mode, skip external STT
  if (activeEngine === "none") {
    return { transcription: null, audio: audioPayload };
  }

  // 3. Dispatch to configured STT Engine (Prefer Groq Whisper > OpenAI > Webhook > Gemini)
  let text: string | null = null;

  if ((activeEngine === "auto" || activeEngine === "groq") && activeGroqKey) {
    text = await transcribeWithGroq(base64Audio, mimeType, activeGroqKey);
  }

  if (!text && (activeEngine === "auto" || activeEngine === "openai") && activeOpenaiKey) {
    text = await transcribeWithOpenAI(base64Audio, mimeType, activeOpenaiKey);
  }

  if (!text && (activeEngine === "auto" || activeEngine === "webhook") && activeWebhook) {
    text = await transcribeWithWebhook(base64Audio, mimeType, activeWebhook);
  }

  if (!text && (activeEngine === "auto" || activeEngine === "gemini") && activeGeminiKey) {
    text = await transcribeWithGemini(base64Audio, mimeType, activeGeminiKey);
  }

  return { transcription: text, audio: audioPayload };
}

// -----------------------------------------------------------------------------
// PURE DETERMINISTIC TASK PARSER (100% REGEX & HEURISTICS, ZERO AI / ZERO LLM)
// -----------------------------------------------------------------------------
function parseSpokenOrWrittenTask(rawText: string, today: string) {
  let text = rawText
    .replace(/^(#?tarea\s*:?|#?pendiente\s*:?|agrega(r)?\s+tarea\s*:?|anota(r)?\s*:?)\s*/i, "")
    .trim();

  const lower = text.toLowerCase();

  // Category resolution
  let category: "Nexabis" | "Trabajo" | "Diaria" = "Nexabis";
  if (/\b(trabajo normal|del trabajo|oficina|corporativo|^trabajo\s*:)\b/i.test(lower)) {
    category = "Trabajo";
    text = text.replace(/^trabajo\s*:\s*/i, "").trim();
  } else if (/\b(diaria|personal|rutina|casa|comprar|supermercado|hábito|^diaria\s*:)\b/i.test(lower)) {
    category = "Diaria";
    text = text.replace(/^diaria\s*:\s*/i, "").trim();
  } else if (/\b(nexabis|cliente|cotizaci[oó]n|presupuesto|factura|^nexabis\s*:)\b/i.test(lower)) {
    category = "Nexabis";
    text = text.replace(/^nexabis\s*:\s*/i, "").trim();
  }

  // Priority resolution
  let priority: "P0" | "P1" | "P2" | "P3" = "P2";
  if (/\b(urgente|cr[ií]tico|p0|para hoy s[ií] o s[ií]|lo antes posible)\b/i.test(lower)) {
    priority = "P0";
  } else if (/\b(alta prioridad|importante|p1)\b/i.test(lower)) {
    priority = "P1";
  } else if (/\b(baja prioridad|cuando pueda|p3)\b/i.test(lower)) {
    priority = "P3";
  }

  // Deadline resolution (supports relative dates & weekdays in Spanish)
  let deadline = today;
  if (/\b(pasado\s+ma[ñn]ana)\b/i.test(lower)) {
    deadline = addDaysISO(today, 2);
  } else if (/\b(para\s+ma[ñn]ana|ma[ñn]ana)\b/i.test(lower)) {
    deadline = addDaysISO(today, 1);
  } else if (/\b(hoy(\s+mismo)?)\b/i.test(lower)) {
    deadline = today;
  } else if (/\b(el\s+|este\s+|para\s+el\s+)?lunes\b/i.test(lower)) {
    deadline = getNextDayOfWeekISO(today, 1);
  } else if (/\b(el\s+|este\s+|para\s+el\s+)?martes\b/i.test(lower)) {
    deadline = getNextDayOfWeekISO(today, 2);
  } else if (/\b(el\s+|este\s+|para\s+el\s+)?mi[eé]rcoles\b/i.test(lower)) {
    deadline = getNextDayOfWeekISO(today, 3);
  } else if (/\b(el\s+|este\s+|para\s+el\s+)?jueves\b/i.test(lower)) {
    deadline = getNextDayOfWeekISO(today, 4);
  } else if (/\b(el\s+|este\s+|para\s+el\s+)?viernes\b/i.test(lower)) {
    deadline = getNextDayOfWeekISO(today, 5);
  } else if (/\b(el\s+|este\s+|para\s+el\s+)?s[aá]bado\b/i.test(lower)) {
    deadline = getNextDayOfWeekISO(today, 6);
  } else if (/\b(el\s+|este\s+|para\s+el\s+)?domingo\b/i.test(lower)) {
    deadline = getNextDayOfWeekISO(today, 0);
  } else {
    const inDaysMatch = lower.match(/\ben\s+(\d+)\s+d[ií]as\b/i);
    if (inDaysMatch) {
      deadline = addDaysISO(today, parseInt(inDaysMatch[1], 10));
    }
  }

  // Clean voice filler words and metadata words from the title
  let clean = text
    .replace(/\b(para\s+el\s+|el\s+|este\s+)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/gi, "")
    .replace(/\b(pasado\s+ma[ñn]ana|para\s+ma[ñn]ana|ma[ñn]ana|hoy\s+mismo|hoy)\b/gi, "")
    .replace(/\ben\s+\d+\s+d[ií]as\b/gi, "")
    .replace(/\b(urgente|cr[ií]tico|alta\s+prioridad|baja\s+prioridad|p0|p1|p2|p3)\b/gi, "")
    .replace(/\b(por\s+fa(vor)?|oye|hola|porfa|recu[eé]rdame|anota(r)?|agendar|crear)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // If text became empty after stripping, restore the original
  if (!clean) clean = text;

  const cleanTitle = clean.charAt(0).toUpperCase() + clean.slice(1);
  return {
    title: cleanTitle || "Nueva tarea desde WhatsApp",
    category,
    priority,
    deadline,
  };
}

// -----------------------------------------------------------------------------
// MAIN DENO HTTP SERVER
// -----------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const today = getChileTodayISO();

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action || (req.method === "GET" ? "daily_summary" : "");

    // =========================================================================
    // 1. DAILY SUMMARY TO +56986343217
    // =========================================================================
    if (action === "daily_summary") {
      const targetPhone = body.phone || TARGET_PHONE;
      const { data: allTasks, error } = await supabase
        .from("tasks")
        .select("*")
        .not("status", "in", '("Terminada","Cancelada")')
        .order("deadline", { ascending: true });

      if (error) throw error;

      const active = allTasks || [];
      const overdue = active.filter((t: any) => t.deadline && t.deadline < today);
      const dueToday = active.filter((t: any) => t.deadline === today);
      const nexabis = active.filter((t: any) => (t.category || "Nexabis") === "Nexabis");
      const trabajo = active.filter((t: any) => t.category === "Trabajo");
      const diarias = active.filter((t: any) => t.category === "Diaria");

      const formatList = (list: any[], max = 6) =>
        list
          .slice(0, max)
          .map(
            (t: any) =>
              `  • [${t.priority || "P2"}] *${t.title}*${
                t.deadline && t.deadline < today ? ` _(Vencida: ${t.deadline})_` : ""
              }`
          )
          .join("\n") + (list.length > max ? `\n  _...y ${list.length - max} más_` : "");

      const lines = [
        `☀️ *Resumen Diario Nexabis OS* (${today})`,
        `Hola Cris, tienes *${active.length}* tareas pendientes activas:`,
        ``,
      ];

      if (overdue.length > 0) {
        lines.push(`🚨 *Atrasadas (${overdue.length}):*`);
        lines.push(formatList(overdue, 5));
        lines.push(``);
      }

      if (dueToday.length > 0) {
        lines.push(`🎯 *Vencen Hoy (${dueToday.length}):*`);
        lines.push(formatList(dueToday, 6));
        lines.push(``);
      }

      lines.push(`🏢 *Trabajo Nexabis (${nexabis.length}):*`);
      lines.push(nexabis.length ? formatList(nexabis, 5) : "  _Sin pendientes_ ✅");
      lines.push(``);

      lines.push(`💼 *Trabajo Normal (${trabajo.length}):*`);
      lines.push(trabajo.length ? formatList(trabajo, 5) : "  _Sin pendientes_ ✅");
      lines.push(``);

      lines.push(`☀️ *Diarias & Personales (${diarias.length}):*`);
      lines.push(diarias.length ? formatList(diarias, 5) : "  _Sin pendientes_ ✅");
      lines.push(``);
      lines.push(`💡 _Tip: Escribe "tarea: [texto]" o envía una nota de voz a este chat para agendar una nueva tarea al instante._`);

      const waRes = await sendWhatsAppMessage(targetPhone, lines.join("\n"));

      return new Response(
        JSON.stringify({
          ok: waRes.ok,
          today,
          totalActive: active.length,
          overdue: overdue.length,
          dueToday: dueToday.length,
          targetPhone,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 2. EVOLUTION API WEBHOOK (MESSAGES_UPSERT — TEXT OR VOICE NOTE TO TASK)
    // =========================================================================
    const eventType = String(body.event || "").toLowerCase();
    if (eventType === "messages.upsert" || body.data?.message) {
      const msgData = body.data || {};
      const key = msgData.key || {};
      const remoteJid = String(key.remoteJid || "");
      const messageObj = msgData.message || {};

      // Avoid infinite loops on bot replies
      const textContent =
        messageObj.conversation ||
        messageObj.extendedTextMessage?.text ||
        messageObj.imageMessage?.caption ||
        "";

      if (
        textContent.startsWith("☀️ *Resumen Diario") ||
        textContent.startsWith("✅ *Tarea agendada") ||
        textContent.startsWith("📋 *Nueva Tarea") ||
        textContent.startsWith("🔄 *Actualización")
      ) {
        return new Response(JSON.stringify({ ignored: "bot_message" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isGroup = remoteJid.endsWith("@g.us");
      const isFromCris =
        remoteJid.includes(TARGET_PHONE) ||
        String(msgData.sender || "").includes(TARGET_PHONE) ||
        String(key.participant || "").includes(TARGET_PHONE);

      const hasTaskPrefix = /^(#?tarea\s*:|#?pendiente\s*:|nexabis\s*:|trabajo\s*:|diaria\s*:)/i.test(
        textContent.trim()
      );
      const isAudioMessage = Boolean(messageObj.audioMessage);

      // In groups, strictly require explicit task prefix
      if (isGroup && !hasTaskPrefix) {
        return new Response(JSON.stringify({ ignored: "group_message_without_prefix" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // In 1-on-1 private chat, accept if from Cris, or prefixed with tarea:, or any voice note
      if (!isFromCris && !hasTaskPrefix && !isAudioMessage) {
        return new Response(JSON.stringify({ ignored: "not_task_channel" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let rawTaskString = textContent.trim();
      let audioPayload: { base64: string; mimeType: string } | null = null;
      let usedAudio = false;

      if (isAudioMessage) {
        usedAudio = true;
        const result = await tryProcessAudioMessage(key, messageObj, supabase);
        audioPayload = result.audio;

        if (result.transcription) {
          rawTaskString = result.transcription;
        } else if (!rawTaskString) {
          const seconds = messageObj.audioMessage?.seconds || 0;
          const timeStr = new Date().toLocaleTimeString("es-CL", {
            timeZone: "America/Santiago",
            hour: "2-digit",
            minute: "2-digit",
          });
          rawTaskString = `🎙️ Nota de voz WhatsApp (${seconds}s) - ${timeStr}`;
        }
      }

      if (!rawTaskString) {
        return new Response(JSON.stringify({ ignored: "empty_message" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const parsed = parseSpokenOrWrittenTask(rawTaskString, today);

      // Compute next NEX-XXX ID
      const { data: existingIds } = await supabase.from("tasks").select("id");
      const maxNum = (existingIds || []).reduce((max: number, row: any) => {
        const m = /^NEX-(\d+)$/.exec(row.id || "");
        return m ? Math.max(max, Number(m[1])) : max;
      }, 100);
      const newTaskId = `NEX-${maxNum + 1}`;

      // Build task description with embedded audio player if voice note was attached
      let description = usedAudio
        ? "Creada automáticamente desde Nota de Voz de WhatsApp (+56986343217)."
        : "Creada automáticamente desde WhatsApp (+56986343217).";

      if (audioPayload?.base64) {
        description += `\n\n[audio:data:${audioPayload.mimeType};base64,${audioPayload.base64}]`;
      }

      const newTaskRow = {
        id: newTaskId,
        title: parsed.title,
        description,
        assignee: "cristobal_abarca",
        additional_assignees: [],
        requester: "cristobal_abarca",
        start_date: today,
        deadline: parsed.deadline,
        status: "Por hacer",
        priority: parsed.priority,
        type: parsed.category === "Diaria" ? "Diaria" : "Operacional",
        category: parsed.category,
        impact: "Medio",
        effort: "Medio",
        progress: 0,
        project:
          parsed.category === "Trabajo"
            ? "Trabajo"
            : parsed.category === "Diaria"
            ? "Personal / Día"
            : "Nexabis",
        recurring_enabled: false,
        recurring_frequency: "Diaria",
      };

      const { error: insertErr } = await supabase.from("tasks").insert(newTaskRow);
      if (insertErr) throw insertErr;

      const audioNotice = usedAudio ? `\n🎙️ _Nota de voz procesada con éxito_` : "";
      await sendWhatsAppMessage(
        TARGET_PHONE,
        `✅ *Tarea agendada en Nexabis OS*\n\n• *ID:* ${newTaskId}\n• *Tarea:* ${parsed.title}\n• *Ámbito:* ${parsed.category}\n• *Prioridad:* ${parsed.priority}\n• *Fecha límite:* ${parsed.deadline}${audioNotice}`
      );

      return new Response(
        JSON.stringify({ ok: true, createdTask: newTaskRow }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, status: "whatsapp-assistant ready", audioEngine: AUDIO_ENGINE }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("whatsapp-assistant error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
