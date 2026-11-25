import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabase";
import { addDaysISO, addMonthsISO, todayCL } from "./crm/calendar";
import { indexForecast, normalizeCortes } from "./crm/weather";
import { createVisibilityLifecycle, createVisibleInterval, isTabVisible } from "./realtimeVisibility";

/* Reemplaza o agrega una fila por llave, ignorando versiones más antiguas que la que ya tenemos. */
function upsertBy(rows, row, key = "id") {
  const i = rows.findIndex((r) => r[key] === row[key]);
  if (i === -1) return [...rows, row];
  if (rows[i].updated_at && row.updated_at && rows[i].updated_at > row.updated_at) return rows;
  const next = rows.slice();
  next[i] = { ...rows[i], ...row };
  return next;
}

function friendlyError(e) {
  const msg = (e && (e.message || e.details)) || "";
  if (/crm_responsables_member_id_key/i.test(msg)) return "Esa cuenta del equipo ya está vinculada a otro responsable.";
  if (/crm_catalogo_nombre_key|crm_responsables_iniciales_key|duplicate key/i.test(msg)) return "Ya existe un elemento con ese nombre (o esas iniciales).";
  if (/crm_feriados_unico/i.test(msg)) return "Ya existe ese feriado en esa fecha.";
  if (/crm_lista_invalida/i.test(msg)) return "El valor elegido no pertenece a ese catálogo.";
  if (/row-level security|permission denied|insufficient_privilege/i.test(msg)) return "No tienes permiso para hacer este cambio.";
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return "Sin conexión. Revisa tu internet e inténtalo de nuevo.";
  if (/violates check constraint/i.test(msg)) return "Algún dato no es válido. Revisa el formulario.";
  return msg || "Error inesperado.";
}

/** Descarga todas las filas de una consulta, de a 1.000 (límite de la API), con orden estable. */
async function fetchAll(build) {
  const size = 1000;
  const out = [];
  for (let from = 0; from < 100000; from += size) {
    const { data, error } = await build().range(from, from + size - 1);
    if (error) throw error;
    out.push(...data);
    if (data.length < size) break;
  }
  return out;
}

const MAILING_FIELDS = ["fecha", "hora", "titulo_id", "responsable_id", "einstein_id", "configuracion_id", "estado_id", "segmento", "marca_id", "objetivo", "canal_id", "observaciones", "id_externo"];

/** Deja solo columnas editables de un mailing y normaliza vacíos (hora "" → null, textos recortados). */
export function mailingPayload(draft) {
  const out = {};
  for (const k of MAILING_FIELDS) {
    if (!(k in draft)) continue;
    let v = draft[k];
    if (k === "hora") v = v ? String(v).slice(0, 5) : null;
    else if (["segmento", "objetivo", "observaciones", "id_externo"].includes(k)) v = String(v ?? "").trim();
    else if (v === "") v = null;
    out[k] = v;
  }
  return out;
}

const ms = (iso) => (iso ? Date.parse(iso) : NaN);

const LIVE_WEATHER_CHECK_MS = 600_000; // 10 min: consulta 1 fila de crm_clima_ejecuciones si Realtime está vivo
const FALLBACK_POLL_MS = 120_000;      // 2 min: respaldo si Realtime se cae
const HIDDEN_GRACE_MS = 30_000;        // desconecta Realtime tras 30 s con la pestaña oculta

/**
 * Estado compartido del módulo Programación CRM: carga, tiempo real y acciones con guardado optimista.
 * Se monta solo cuando se abre el módulo, así quien no lo usa no gasta conexiones.
 */
export function useCrm({ userId, showToast }) {
  const [phase, setPhase] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [live, setLive] = useState(false);
  const [saving, setSaving] = useState(0);
  const [syncedAt, setSyncedAt] = useState(null);

  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [mailings, setMailings] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [feriados, setFeriados] = useState([]);
  const [reglas, setReglas] = useState([]);
  const [manuales, setManuales] = useState([]);
  const [config, setConfig] = useState([]);
  const [clima, setClima] = useState([]);
  const [ultimaEjecucion, setUltimaEjecucion] = useState(null);

  const alive = useRef(true);
  const liveRef = useRef(false);
  const inFlightRef = useRef(false);
  const staticLoadedRef = useRef(false);
  const lastSyncRef = useRef(0);
  const lastWeatherRunRef = useRef(null);

  /* ---------------- carga de clima (solo si hubo una nueva ejecución) ---------------- */
  const checkWeather = useCallback(async ({ force = false } = {}) => {
    const run = await supabase.from("crm_clima_ejecuciones").select("*").order("inicio", { ascending: false }).limit(1);
    if (run.error) throw run.error;
    if (!alive.current) return;
    const latest = run.data[0] || null;
    const stamp = latest ? `${latest.inicio}|${latest.fin || ""}|${latest.estado || ""}` : "";
    if (!force && stamp === lastWeatherRunRef.current) return;
    const desde = addDaysISO(todayCL(), -7);
    const cli = await fetchAll(() =>
      supabase
        .from("crm_clima_vigente")
        .select("comuna_id,fecha,obtenido_el,prob_precip,mm,tmin,tmax,fuente,obtenido_en")
        .gte("fecha", desde)
        .order("fecha")
        .order("comuna_id")
    );
    if (!alive.current) return;
    lastWeatherRunRef.current = stamp;
    setUltimaEjecucion(latest);
    setClima(cli);
  }, []);

  /* ---------------- carga completa (montaje inicial / botón reintentar) ---------------- */
  const loadAll = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const desde = addDaysISO(todayCL(), -7);
      const [reg, com, cat, res, mai, cmt, fer, reg2, man, cfg, cli, run] = await Promise.all([
        staticLoadedRef.current ? Promise.resolve({ data: null }) : supabase.from("crm_regiones").select("*").order("orden"),
        staticLoadedRef.current ? Promise.resolve(null) : fetchAll(() => supabase.from("crm_comunas").select("*").order("id")),
        fetchAll(() => supabase.from("crm_catalogo").select("*").order("orden").order("nombre").order("id")),
        supabase.from("crm_responsables").select("*").order("orden").order("nombre"),
        fetchAll(() => supabase.from("crm_mailings").select("*").order("fecha").order("id")),
        fetchAll(() => supabase.from("crm_comentarios_semana").select("*").order("created_at").order("id")),
        fetchAll(() => supabase.from("crm_feriados").select("*").order("fecha").order("id")),
        supabase.from("crm_reglas_oportunidad").select("*").order("orden"),
        fetchAll(() => supabase.from("crm_oportunidad_manual").select("*").order("fecha")),
        supabase.from("crm_config").select("*"),
        fetchAll(() => supabase.from("crm_clima_vigente").select("comuna_id,fecha,obtenido_el,prob_precip,mm,tmin,tmax,fuente,obtenido_en").gte("fecha", desde).order("fecha").order("comuna_id")),
        supabase.from("crm_clima_ejecuciones").select("*").order("inicio", { ascending: false }).limit(1),
      ]);
      const failed = [reg, res, reg2, cfg, run].find((x) => x.error);
      if (failed) throw failed.error;
      if (!alive.current) return;
      if (reg.data) setRegiones(reg.data);
      if (com) setComunas(com);
      staticLoadedRef.current = true;
      setCatalogo(cat); setResponsables(res.data); setMailings(mai); setComentarios(cmt);
      setFeriados(fer); setReglas(reg2.data); setManuales(man); setConfig(cfg.data); setClima(cli);
      const latest = run.data[0] || null;
      lastWeatherRunRef.current = latest ? `${latest.inicio}|${latest.fin || ""}|${latest.estado || ""}` : "";
      setUltimaEjecucion(latest);
      lastSyncRef.current = Date.now();
      setSyncedAt(new Date());
      setPhase("ready");
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  /* ---------------- sincronización liviana (omite regiones/comunas estáticas y solo baja clima si cambió) ---------------- */
  const syncDynamic = useCallback(async () => {
    if (!staticLoadedRef.current) return loadAll();
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const [cat, res, mai, cmt, fer, reg2, man, cfg] = await Promise.all([
        fetchAll(() => supabase.from("crm_catalogo").select("*").order("orden").order("nombre").order("id")),
        supabase.from("crm_responsables").select("*").order("orden").order("nombre"),
        fetchAll(() => supabase.from("crm_mailings").select("*").order("fecha").order("id")),
        fetchAll(() => supabase.from("crm_comentarios_semana").select("*").order("created_at").order("id")),
        fetchAll(() => supabase.from("crm_feriados").select("*").order("fecha").order("id")),
        supabase.from("crm_reglas_oportunidad").select("*").order("orden"),
        fetchAll(() => supabase.from("crm_oportunidad_manual").select("*").order("fecha")),
        supabase.from("crm_config").select("*"),
      ]);
      const failed = [res, reg2, cfg].find((x) => x.error);
      if (failed) throw failed.error;
      if (!alive.current) return;
      setCatalogo(cat); setResponsables(res.data); setMailings(mai); setComentarios(cmt);
      setFeriados(fer); setReglas(reg2.data); setManuales(man); setConfig(cfg.data);
      await checkWeather();
      if (!alive.current) return;
      lastSyncRef.current = Date.now();
      setSyncedAt(new Date());
    } finally {
      inFlightRef.current = false;
    }
  }, [loadAll, checkWeather]);

  const refresh = useCallback(() => {
    loadAll().catch((e) => {
      console.error("Error al cargar Programación CRM", e);
      if (!alive.current) return;
      setLoadError(friendlyError(e));
      setPhase((p) => (p === "ready" ? p : "error"));
    });
  }, [loadAll]);

  const refreshDynamic = useCallback(() => {
    syncDynamic().catch((e) => {
      console.error("Error al sincronizar Programación CRM", e);
    });
  }, [syncDynamic]);

  /* ---------------- tiempo real ---------------- */
  useEffect(() => {
    alive.current = true;
    if (!userId) return undefined;
    setPhase("loading");
    refresh();

    let channel = null;
    let hasSubscribedOnce = false;
    let needsResyncOnSubscribe = false;

    const touch = () => setSyncedAt(new Date());
    const watch = (ch, table, setter, key = "id") =>
      ch.on("postgres_changes", { event: "*", schema: "public", table }, (p) => {
        setter((rows) => (p.eventType === "DELETE" ? rows.filter((x) => x[key] !== p.old[key]) : upsertBy(rows, p.new, key)));
        touch();
      });

    const detachChannel = () => {
      if (!channel) return;
      const ch = channel;
      channel = null;
      liveRef.current = false;
      if (alive.current) setLive(false);
      supabase.removeChannel(ch);
    };

    const attachChannel = () => {
      if (channel || !alive.current || !isTabVisible()) return;
      // Solo tablas colaborativas activas (catálogos/config/feriados/reglas son de baja frecuencia
      // y se actualizan localmente al guardar + al sincronizar).
      let ch = supabase.channel(`crm-live-${Math.random().toString(36).slice(2, 8)}`);
      ch = watch(ch, "crm_mailings", setMailings);
      ch = watch(ch, "crm_comentarios_semana", setComentarios);
      ch.subscribe((status) => {
        const ok = status === "SUBSCRIBED";
        liveRef.current = ok;
        if (alive.current) setLive(ok);
        if (ok) {
          // Evita doble carga al montar: solo resincroniza tras desconexión o pausa por pestaña oculta.
          if (hasSubscribedOnce && needsResyncOnSubscribe) {
            needsResyncOnSubscribe = false;
            refreshDynamic();
          }
          hasSubscribedOnce = true;
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          needsResyncOnSubscribe = true;
        }
      });
      channel = ch;
    };

    attachChannel();

    const stopVisibility = createVisibilityLifecycle({
      hiddenGraceMs: HIDDEN_GRACE_MS,
      onPause: () => {
        needsResyncOnSubscribe = true;
        detachChannel();
      },
      onResume: ({ wasPaused, hiddenMs }) => {
        if (wasPaused || !channel) {
          if (hiddenMs >= HIDDEN_GRACE_MS) {
            needsResyncOnSubscribe = false;
            refreshDynamic();
          } else {
            needsResyncOnSubscribe = true;
          }
          attachChannel();
        } else if (!liveRef.current && Date.now() - lastSyncRef.current >= 60_000) {
          refreshDynamic();
        }
      },
    });

    // Con Realtime vivo: solo revisa si cambió el clima cada 10 min (1 fila).
    // Sin Realtime: respaldo completo de tablas dinámicas cada 2 min mientras esté visible.
    const stopPoll = createVisibleInterval(() => {
      const elapsed = Date.now() - lastSyncRef.current;
      if (liveRef.current) {
        if (elapsed >= LIVE_WEATHER_CHECK_MS) {
          lastSyncRef.current = Date.now();
          checkWeather().catch(() => {});
        }
      } else if (elapsed >= FALLBACK_POLL_MS) {
        refreshDynamic();
      }
    }, 60_000);

    return () => {
      alive.current = false;
      stopVisibility();
      stopPoll();
      detachChannel();
    };
  }, [userId, refresh, refreshDynamic, checkWeather]);

  /* ---------------- datos derivados ---------------- */
  const cfgValue = useCallback((clave, def) => config.find((c) => c.clave === clave)?.valor ?? def, [config]);
  const settings = useMemo(() => ({
    cortes: normalizeCortes(config.find((c) => c.clave === "clima_escala")?.valor?.cortes),
    diasPronostico: Number(config.find((c) => c.clave === "clima_pronostico_dias")?.valor?.dias) || 7,
    sugerencia: { umbral: 60, proporcion: 50, ...(config.find((c) => c.clave === "clima_sugerencia")?.valor || {}) },
  }), [config]);

  const byId = useMemo(() => {
    const cat = new Map(catalogo.map((c) => [c.id, c]));
    const res = new Map(responsables.map((r) => [r.id, r]));
    return { cat, res };
  }, [catalogo, responsables]);

  const lista = useCallback((nombre, { soloActivos = false } = {}) => catalogo.filter((c) => c.lista === nombre && (!soloActivos || c.activo)), [catalogo]);
  const climaIndex = useMemo(() => indexForecast(clima), [clima]);

  /* ---------------- acciones ---------------- */
  const run = useCallback(async (fn, failMsg) => {
    setSaving((n) => n + 1);
    try {
      return await fn();
    } catch (e) {
      console.error(failMsg, e);
      showToast(`${failMsg}: ${friendlyError(e)}`);
      refresh();
      return undefined;
    } finally {
      setSaving((n) => n - 1);
    }
  }, [refresh, showToast]);

  const stamp = () => setSyncedAt(new Date());

  /* --- Mailings --- */
  const createMailing = useCallback((draft) => run(async () => {
    const { data, error } = await supabase.from("crm_mailings").insert(mailingPayload(draft)).select().single();
    if (error) throw error;
    setMailings((rows) => upsertBy(rows, data));
    stamp();
    return data;
  }, "No se pudo crear el mailing"), [run]);

  /**
   * Edita un mailing. Con `baseUpdatedAt` revisa antes si otra persona lo cambió mientras se editaba:
   * devuelve { conflict: filaActual } sin guardar, para que la pantalla decida. `force: true` guarda igualmente.
   */
  const updateMailing = useCallback((id, patch, { baseUpdatedAt, force = false } = {}) => run(async () => {
    const row = mailingPayload(patch);
    if (Object.keys(row).length === 0) return { ok: true };
    if (baseUpdatedAt && !force) {
      const { data: cur, error: e1 } = await supabase.from("crm_mailings").select("*").eq("id", id).maybeSingle();
      if (e1) throw e1;
      if (!cur) return { gone: true };
      if (ms(cur.updated_at) !== ms(baseUpdatedAt)) return { conflict: cur };
    }
    setMailings((rows) => rows.map((r) => (r.id === id ? { ...r, ...row } : r)));
    const { data, error } = await supabase.from("crm_mailings").update(row).eq("id", id).select().single();
    if (error) throw error;
    setMailings((rows) => rows.map((r) => (r.id === id ? data : r)));
    stamp();
    return { ok: true, row: data };
  }, "No se pudo guardar el mailing"), [run]);

  const moveMailing = useCallback((id, fecha) => updateMailing(id, { fecha }), [updateMailing]);

  const setEstado = useCallback((id, estadoId) => updateMailing(id, { estado_id: estadoId }), [updateMailing]);

  const estadoCancelado = useMemo(() => catalogo.find((c) => c.lista === "estado" && c.semantica === "cancelado" && c.activo), [catalogo]);
  const estadoPendiente = useMemo(() => catalogo.find((c) => c.lista === "estado" && c.semantica === "pendiente" && c.activo), [catalogo]);

  /** Crea copias de un mailing (siempre como Pendiente y sin "enviado en"). Devuelve las filas creadas. */
  const duplicateMailing = useCallback((m, { modo = "una", fecha, veces = 1 }) => run(async () => {
    if (!estadoPendiente) throw new Error("No hay un estado Pendiente activo en el catálogo.");
    const n = modo === "una" ? 1 : Math.max(1, Math.min(52, Number(veces) || 1));
    const base = fecha || m.fecha;
    const rows = [];
    for (let i = 0; i < n; i++) {
      const f = modo === "semanal" ? addDaysISO(base, 7 * i) : modo === "mensual" ? addMonthsISO(base, i) : base;
      rows.push({
        ...mailingPayload({ ...m, fecha: f, estado_id: estadoPendiente.id, id_externo: "" }),
        duplicado_de: m.id,
      });
    }
    const { data, error } = await supabase.from("crm_mailings").insert(rows).select();
    if (error) throw error;
    setMailings((cur) => data.reduce((acc, r) => upsertBy(acc, r), cur));
    stamp();
    return data;
  }, "No se pudo duplicar el mailing"), [run, estadoPendiente]);

  /** Importa filas ya validadas. Crea los títulos nuevos primero. Devuelve { creados, titulosNuevos }. */
  const importMailings = useCallback((filas) => run(async () => {
    const nuevos = [...new Set(filas.filter((f) => f.tituloNuevo).map((f) => f.tituloNuevo))];
    const idPorTitulo = new Map();
    for (const nombre of nuevos) {
      const existente = catalogo.find((c) => c.lista === "titulo" && c.nombre.toLowerCase() === nombre.toLowerCase());
      if (existente) { idPorTitulo.set(nombre, existente.id); continue; }
      const { data, error } = await supabase.from("crm_catalogo").insert({ lista: "titulo", nombre }).select().single();
      if (error) throw error;
      setCatalogo((rows) => upsertBy(rows, data));
      idPorTitulo.set(nombre, data.id);
    }
    const payloads = filas.map((f) => mailingPayload({ ...f.data, titulo_id: f.data.titulo_id || idPorTitulo.get(f.tituloNuevo) }));
    let creados = 0;
    for (let i = 0; i < payloads.length; i += 200) {
      const { data, error } = await supabase.from("crm_mailings").insert(payloads.slice(i, i + 200)).select();
      if (error) throw new Error(`${error.message} (se alcanzaron a crear ${creados} de ${payloads.length}; revisa el calendario antes de reintentar)`);
      creados += data.length;
      setMailings((cur) => data.reduce((acc, r) => upsertBy(acc, r), cur));
    }
    stamp();
    return { creados, titulosNuevos: nuevos.length };
  }, "No se pudo importar el archivo"), [run, catalogo]);

  /* --- Catálogos y responsables --- */
  const createCatalogItem = useCallback((listaNombre, nombre, extra = {}) => run(async () => {
    // Los títulos se ordenan alfabéticamente (orden 0 para todos); las demás listas conservan el orden que se les dé.
    const orden = listaNombre === "titulo" ? 0 : catalogo.filter((c) => c.lista === listaNombre).reduce((m, c) => Math.max(m, c.orden || 0), 0) + 1;
    const { data, error } = await supabase.from("crm_catalogo").insert({ lista: listaNombre, nombre: nombre.trim(), orden, ...extra }).select().single();
    if (error) throw error;
    setCatalogo((rows) => upsertBy(rows, data));
    stamp();
    return data;
  }, "No se pudo agregar al catálogo"), [run, catalogo]);

  const updateCatalogItem = useCallback((id, patch) => run(async () => {
    setCatalogo((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const { data, error } = await supabase.from("crm_catalogo").update(patch).eq("id", id).select().single();
    if (error) throw error;
    setCatalogo((rows) => rows.map((r) => (r.id === id ? data : r)));
    stamp();
    return data;
  }, "No se pudo guardar el catálogo"), [run]);

  const saveResponsable = useCallback((id, patch) => run(async () => {
    const clean = { ...patch };
    if ("nombre" in clean) clean.nombre = clean.nombre.trim();
    if ("iniciales" in clean) clean.iniciales = clean.iniciales.trim();
    const q = id
      ? supabase.from("crm_responsables").update(clean).eq("id", id)
      : supabase.from("crm_responsables").insert({ orden: responsables.reduce((m, r) => Math.max(m, r.orden || 0), 0) + 1, ...clean });
    const { data, error } = await q.select().single();
    if (error) throw error;
    setResponsables((rows) => upsertBy(rows, data));
    stamp();
    return data;
  }, "No se pudo guardar el responsable"), [run, responsables]);

  /* --- Comentarios semanales --- */
  const addComentario = useCallback((draft) => run(async () => {
    const { data, error } = await supabase.from("crm_comentarios_semana").insert({
      semana: draft.semana, cuerpo: draft.cuerpo.trim(), responsable_id: draft.responsable_id || null, avisar: draft.avisar !== false,
    }).select().single();
    if (error) throw error;
    setComentarios((rows) => upsertBy(rows, data));
    stamp();
    return data;
  }, "No se pudo guardar el comentario"), [run]);

  const updateComentario = useCallback((id, patch) => run(async () => {
    setComentarios((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const { data, error } = await supabase.from("crm_comentarios_semana").update(patch).eq("id", id).select().single();
    if (error) throw error;
    setComentarios((rows) => rows.map((r) => (r.id === id ? data : r)));
    stamp();
    return data;
  }, "No se pudo actualizar el comentario"), [run]);

  /* --- Feriados, reglas de pago, ajustes manuales y configuración --- */
  const saveFeriado = useCallback((id, draft) => run(async () => {
    const row = { fecha: draft.fecha, nombre: draft.nombre.trim(), ambito: draft.ambito, region_id: draft.ambito === "regional" ? draft.region_id || null : null, alcance: (draft.alcance || "").trim(), irrenunciable: !!draft.irrenunciable, fuente: (draft.fuente || "").trim(), verificado: !!draft.verificado, activo: draft.activo !== false };
    const q = id ? supabase.from("crm_feriados").update(row).eq("id", id) : supabase.from("crm_feriados").insert(row);
    const { data, error } = await q.select().single();
    if (error) throw error;
    setFeriados((rows) => upsertBy(rows, data));
    stamp();
    return data;
  }, "No se pudo guardar el feriado"), [run]);

  const deleteFeriado = useCallback((id) => run(async () => {
    setFeriados((rows) => rows.filter((r) => r.id !== id));
    const { error } = await supabase.from("crm_feriados").delete().eq("id", id);
    if (error) throw error;
    stamp();
    return true;
  }, "No se pudo eliminar el feriado"), [run]);

  const saveRegla = useCallback((id, draft) => run(async () => {
    const row = { nombre: draft.nombre.trim(), nivel: draft.nivel, tipo: draft.tipo, params: draft.params || {}, justificacion: (draft.justificacion || "").trim(), activo: draft.activo !== false };
    const q = id
      ? supabase.from("crm_reglas_oportunidad").update(row).eq("id", id)
      : supabase.from("crm_reglas_oportunidad").insert({ ...row, orden: reglas.reduce((m, r) => Math.max(m, r.orden || 0), 0) + 1 });
    const { data, error } = await q.select().single();
    if (error) throw error;
    setReglas((rows) => upsertBy(rows, data));
    stamp();
    return data;
  }, "No se pudo guardar la regla"), [run, reglas]);

  const deleteRegla = useCallback((id) => run(async () => {
    setReglas((rows) => rows.filter((r) => r.id !== id));
    const { error } = await supabase.from("crm_reglas_oportunidad").delete().eq("id", id);
    if (error) throw error;
    stamp();
    return true;
  }, "No se pudo eliminar la regla"), [run]);

  const setManual = useCallback((fecha, nivel, motivo) => run(async () => {
    if (!nivel) {
      setManuales((rows) => rows.filter((r) => r.fecha !== fecha));
      const { error } = await supabase.from("crm_oportunidad_manual").delete().eq("fecha", fecha);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("crm_oportunidad_manual").upsert({ fecha, nivel, motivo: (motivo || "").trim() }, { onConflict: "fecha" }).select().single();
      if (error) throw error;
      setManuales((rows) => upsertBy(rows, data, "fecha"));
    }
    stamp();
    return true;
  }, "No se pudo guardar el ajuste del día"), [run]);

  const saveConfig = useCallback((clave, valor) => run(async () => {
    const { data, error } = await supabase.from("crm_config").upsert({ clave, valor }, { onConflict: "clave" }).select().single();
    if (error) throw error;
    setConfig((rows) => upsertBy(rows, data, "clave"));
    stamp();
    return true;
  }, "No se pudo guardar la configuración"), [run]);

  return {
    phase, loadError, live, saving: saving > 0, syncedAt, refresh,
    regiones, comunas, catalogo, responsables, mailings, comentarios, feriados, reglas, manuales, config, clima, climaIndex, ultimaEjecucion,
    settings, cfgValue, byId, lista, estadoCancelado, estadoPendiente,
    createMailing, updateMailing, moveMailing, setEstado, duplicateMailing, importMailings,
    createCatalogItem, updateCatalogItem, saveResponsable,
    addComentario, updateComentario,
    saveFeriado, deleteFeriado, saveRegla, deleteRegla, setManual, saveConfig,
  };
}

/** Historial de un registro del módulo (mailing, comentario, etc.); se vuelve a consultar cuando cambia `stampValue`. */
export function useCrmHistory(entidad, entidadId, stampValue) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!entidadId) { setRows([]); return undefined; }
    let alive = true;
    supabase.from("crm_historial").select("*").eq("entidad", entidad).eq("entidad_id", String(entidadId)).order("created_at").order("id")
      .then(({ data }) => { if (alive && data) setRows(data); });
    return () => { alive = false; };
  }, [entidad, entidadId, stampValue]);
  return rows;
}
