import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabase";
import { todayCL } from "./crm/calendar";
import { cfgDesdeFilas } from "./fb/logic";
import { createDebounced, createVisibilityLifecycle, createVisibleInterval, isTabVisible } from "./realtimeVisibility";

/* Reemplaza o agrega una fila por llave, ignorando versiones más antiguas que la que ya tenemos. */
function upsertBy(rows, row, key = "id") {
  const i = rows.findIndex((r) => r[key] === row[key]);
  if (i === -1) return [...rows, row];
  if (rows[i].updated_at && row.updated_at && rows[i].updated_at > row.updated_at) return rows;
  const next = rows.slice();
  next[i] = { ...rows[i], ...row };
  return next;
}

/** Mensaje legible: quita el código "fb_xxx:" de los errores de las funciones de la base de datos. */
export function friendlyError(e) {
  const raw = (e && (e.message || e.details)) || "";
  const m = /^fb_[a-z_]+:\s*(.*)$/s.exec(raw);
  if (m) return m[1];
  if (/fb_personas_member_id_key/i.test(raw)) return "Esa cuenta ya está vinculada a otra ficha.";
  if (/fb_roles_nombre_key/i.test(raw)) return "Ya existe un rol con ese nombre.";
  if (/fb_persona_roles_activo_key/i.test(raw)) return "Esa persona ya tiene ese rol activo.";
  if (/duplicate key/i.test(raw)) return "Ya existe un registro igual.";
  if (/row-level security|permission denied|insufficient_privilege/i.test(raw)) return "No tienes permiso para hacer este cambio.";
  if (/Failed to fetch|NetworkError|network/i.test(raw)) return "Sin conexión. Revisa tu internet e inténtalo de nuevo.";
  if (/violates check constraint/i.test(raw)) return "Algún dato no es válido. Revisa el formulario.";
  return raw || "Error inesperado.";
}

async function fetchAll(build) {
  const size = 1000;
  const out = [];
  for (let from = 0; from < 50000; from += size) {
    const { data, error } = await build().range(from, from + size - 1);
    if (error) throw error;
    out.push(...data);
    if (data.length < size) break;
  }
  return out;
}

// Caché en memoria (5 min) + deduplicación de `fb_mi_acceso` para evitar RPC repetido al navegar entre rutas de Tareas.
const FB_ACCESS_TTL_MS = 300_000;
let fbAccessCache = { userId: null, state: null, ts: 0, promise: null };

/** Qué puede ver esta cuenta en el módulo: { es_lider, member_id, persona_id }. null mientras carga o si el módulo no está disponible. */
export function useFbAccess(userId) {
  const [state, setState] = useState(() => {
    if (userId && fbAccessCache.userId === userId && fbAccessCache.state && Date.now() - fbAccessCache.ts < FB_ACCESS_TTL_MS) {
      return fbAccessCache.state;
    }
    return { status: "loading", access: null };
  });

  useEffect(() => {
    let alive = true;
    if (!userId) return undefined;

    if (fbAccessCache.userId === userId && fbAccessCache.state && Date.now() - fbAccessCache.ts < FB_ACCESS_TTL_MS) {
      setState(fbAccessCache.state);
      return undefined;
    }

    if (fbAccessCache.userId !== userId || !fbAccessCache.promise) {
      const p = supabase.rpc("fb_mi_acceso").then(({ data, error }) => {
        const next = error || !data ? { status: "error", access: null } : { status: "ready", access: data };
        if (fbAccessCache.userId === userId) {
          fbAccessCache.state = next;
          fbAccessCache.ts = Date.now();
          fbAccessCache.promise = null;
        }
        return next;
      });
      fbAccessCache = { userId, state: null, ts: 0, promise: p };
    }

    fbAccessCache.promise.then((next) => {
      if (alive) setState(next);
    });
    return () => { alive = false; };
  }, [userId]);

  const visible = state.status === "ready" && !!(state.access?.es_lider || state.access?.persona_id);
  return { ...state, visible };
}

const PERSONA_COLS = ["member_id", "nombre", "cargo", "area", "fecha_incorporacion", "lider_member_id", "estado", "color"];
const SESION_COLS = ["persona_id", "fecha_hora", "tipo", "modalidad", "participantes", "agenda", "temas", "fortalezas", "logros", "oportunidades", "comentarios_lider",
  "comentarios_colaborador", "acuerdos", "proximos_pasos", "temas_pendientes", "proxima_revision", "minuta", "compromisos_borrador"];
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));
const blankToNull = (v) => (v === "" || v === undefined ? null : v);

const LIVE_RECONCILE_MS = 600_000; // 10 min red de seguridad cuando Realtime está vivo
const FALLBACK_POLL_MS = 180_000;  // 3 min cuando no hay canal Realtime activo
const HIDDEN_GRACE_MS = 30_000;    // desconecta Realtime tras 30 s con pestaña oculta

/** Determina qué tablas colaborativas necesita escuchar en vivo la sub-pantalla actual de Feedback. */
function realtimeTablesForPage(pageName) {
  switch (pageName) {
    case "config":
    case "equipo":
      return [];
    case "compromisos":
      return ["fb_compromisos"];
    case "agenda":
      return ["fb_compromisos", "fb_seguimientos"];
    default:
      // panel, ficha, feedback, minuta, preparar
      return ["fb_compromisos", "fb_seguimientos", "fb_sesiones"];
  }
}

/** Estado compartido del módulo Feedback & Desarrollo: carga, tiempo real y acciones. Se monta solo al abrir el módulo. */
export function useFb({ userId, access, showToast, pageName = "panel" }) {
  const esLider = !!access?.es_lider;
  const [phase, setPhase] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [live, setLive] = useState(false);
  const [saving, setSaving] = useState(0);
  const [syncedAt, setSyncedAt] = useState(null);

  const [personas, setPersonas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [personaRoles, setPersonaRoles] = useState([]);
  const [objetivos, setObjetivos] = useState([]);
  const [objetivoRoles, setObjetivoRoles] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [compromisos, setCompromisos] = useState([]);
  const [revisiones, setRevisiones] = useState([]);
  const [seguimientos, setSeguimientos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [configFilas, setConfigFilas] = useState([]);

  const alive = useRef(true);
  const liveRef = useRef(false);
  const inFlightRef = useRef(false);
  const loadedRef = useRef(false);
  const lastSyncRef = useRef(0);
  const compromisosRef = useRef(compromisos);
  compromisosRef.current = compromisos;

  const loadAll = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const q = (t, order = "created_at") => fetchAll(() => supabase.from(t).select("*").order(order).order("id"));
      const [per, rol, pr, obj, orl, ses, com, rev, seg, nts, cfg] = await Promise.all([
        q("fb_personas", "nombre"), q("fb_roles", "nombre"), q("fb_persona_roles"), q("fb_objetivos"), fetchAll(() => supabase.from("fb_objetivo_roles").select("*").order("objetivo_id").order("rol_id")),
        q("fb_sesiones", "fecha_hora"), q("fb_compromisos"), q("fb_compromiso_revisiones"), q("fb_seguimientos", "fecha"),
        esLider ? q("fb_notas_privadas") : Promise.resolve([]),
        esLider ? supabase.from("fb_config").select("*") : Promise.resolve({ data: [] }),
      ]);
      if (cfg.error) throw cfg.error;
      if (!alive.current) return;
      setPersonas(per); setRoles(rol); setPersonaRoles(pr); setObjetivos(obj); setObjetivoRoles(orl); setSesiones(ses);
      setCompromisos(com); setRevisiones(rev); setSeguimientos(seg); setNotas(nts); setConfigFilas(cfg.data || []);
      loadedRef.current = true;
      lastSyncRef.current = Date.now();
      setSyncedAt(new Date());
      setPhase("ready");
    } finally {
      inFlightRef.current = false;
    }
  }, [esLider]);

  const refresh = useCallback(() => {
    loadAll().catch((e) => {
      console.error("Error al cargar Feedback & Desarrollo", e);
      if (!alive.current) return;
      setLoadError(friendlyError(e));
      setPhase((p) => (p === "ready" ? p : "error"));
    });
  }, [loadAll]);

  // Carga inicial una sola vez por sesión/rol
  useEffect(() => {
    alive.current = true;
    if (!userId) return undefined;
    setPhase("loading");
    refresh();
    return () => {
      alive.current = false;
    };
  }, [userId, refresh]);

  // Refresco puntual de revisiones de un compromiso cuando otro usuario lo actualiza vía Realtime
  const pendingRevIds = useRef(new Set());
  const flushRevisionFetch = useMemo(
    () =>
      createDebounced(() => {
        const ids = Array.from(pendingRevIds.current);
        pendingRevIds.current.clear();
        if (!ids.length || !alive.current) return;
        supabase
          .from("fb_compromiso_revisiones")
          .select("*")
          .in("compromiso_id", ids)
          .order("created_at")
          .order("id")
          .then(({ data: revs, error }) => {
            if (error || !revs || !alive.current) return;
            const idSet = new Set(ids);
            setRevisiones((rows) => [...rows.filter((r) => !idSet.has(r.compromiso_id)), ...revs]);
          });
      }, 400),
    []
  );

  useEffect(() => () => flushRevisionFetch.cancel(), [flushRevisionFetch]);

  // Clave estable de tablas Realtime según sub-pantalla abierta (evita reconectar si las tablas no cambian)
  const tablesKey = realtimeTablesForPage(pageName).join(",");

  useEffect(() => {
    if (!userId) return undefined;
    const tables = tablesKey ? tablesKey.split(",") : [];

    let channel = null;
    let hasSubscribedOnce = false;
    let needsResyncOnSubscribe = false;

    const touch = () => setSyncedAt(new Date());

    const detachChannel = () => {
      if (!channel) return;
      const ch = channel;
      channel = null;
      liveRef.current = false;
      if (alive.current) setLive(false);
      supabase.removeChannel(ch);
    };

    const attachChannel = () => {
      if (!tables.length || channel || !alive.current || !isTabVisible()) return;
      let ch = supabase.channel(`fb-live-${Math.random().toString(36).slice(2, 8)}`);
      for (const table of tables) {
        if (table === "fb_sesiones") {
          ch = ch.on("postgres_changes", { event: "*", schema: "public", table }, (p) => {
            setSesiones((rows) => (p.eventType === "DELETE" ? rows.filter((x) => x.id !== p.old.id) : upsertBy(rows, p.new)));
            touch();
          });
        } else if (table === "fb_compromisos") {
          ch = ch.on("postgres_changes", { event: "*", schema: "public", table }, (p) => {
            if (p.eventType === "DELETE") {
              setCompromisos((rows) => rows.filter((x) => x.id !== p.old.id));
            } else {
              const prev = compromisosRef.current.find((x) => x.id === p.new.id);
              const isExternalUpdate = p.eventType === "UPDATE" && (!prev || prev.updated_at !== p.new.updated_at);
              setCompromisos((rows) => upsertBy(rows, p.new));
              if (isExternalUpdate) {
                pendingRevIds.current.add(p.new.id);
                flushRevisionFetch();
              }
            }
            touch();
          });
        } else if (table === "fb_seguimientos") {
          ch = ch.on("postgres_changes", { event: "*", schema: "public", table }, (p) => {
            setSeguimientos((rows) => (p.eventType === "DELETE" ? rows.filter((x) => x.id !== p.old.id) : upsertBy(rows, p.new)));
            touch();
          });
        }
      }
      ch.subscribe((status) => {
        const ok = status === "SUBSCRIBED";
        liveRef.current = ok;
        if (alive.current) setLive(ok);
        if (ok) {
          // Evita doble carga al montar: solo resincroniza al reconectar tras desconexión o pausa.
          if (hasSubscribedOnce && needsResyncOnSubscribe) {
            needsResyncOnSubscribe = false;
            refresh();
          }
          hasSubscribedOnce = true;
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          needsResyncOnSubscribe = true;
        }
      });
      channel = ch;
    };

    if (tables.length) {
      attachChannel();
    } else {
      liveRef.current = false;
      setLive(false);
    }

    const stopVisibility = createVisibilityLifecycle({
      hiddenGraceMs: HIDDEN_GRACE_MS,
      onPause: () => {
        if (tables.length) {
          needsResyncOnSubscribe = true;
          detachChannel();
        }
      },
      onResume: ({ wasPaused, hiddenMs }) => {
        if (tables.length && (wasPaused || !channel)) {
          if (hiddenMs >= HIDDEN_GRACE_MS) {
            needsResyncOnSubscribe = false;
            refresh();
          } else {
            needsResyncOnSubscribe = true;
          }
          attachChannel();
        } else if (loadedRef.current && Date.now() - lastSyncRef.current >= 120_000) {
          refresh();
        }
      },
    });

    const stopPoll = createVisibleInterval(() => {
      const minGap = liveRef.current ? LIVE_RECONCILE_MS : FALLBACK_POLL_MS;
      if (loadedRef.current && Date.now() - lastSyncRef.current >= minGap) {
        refresh();
      }
    }, 60_000);

    return () => {
      stopVisibility();
      stopPoll();
      detachChannel();
    };
  }, [userId, tablesKey, refresh, flushRevisionFetch]);

  const cfg = useMemo(() => cfgDesdeFilas(configFilas), [configFilas]);
  const data = useMemo(() => ({ personas, roles, personaRoles, objetivos, objetivoRoles, sesiones, compromisos, revisiones, seguimientos }), [personas, roles, personaRoles, objetivos, objetivoRoles, sesiones, compromisos, revisiones, seguimientos]);
  const rolesPorId = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const personasPorId = useMemo(() => new Map(personas.map((p) => [p.id, p])), [personas]);
  const hoy = todayCL();

  /* ------------------------------- acciones ------------------------------- */
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

  /** Inserta o actualiza una fila y deja la copia local al día. */
  const save = useCallback(async (table, setter, id, row) => {
    const q = id ? supabase.from(table).update(row).eq("id", id) : supabase.from(table).insert(row);
    const { data: out, error } = await q.select().single();
    if (error) throw error;
    setter((rows) => upsertBy(rows, out));
    stamp();
    return out;
  }, []);

  const savePersona = useCallback((id, draft) => run(() => {
    const row = pick(draft, PERSONA_COLS);
    if ("nombre" in row) row.nombre = String(row.nombre).trim();
    for (const k of ["cargo", "area"]) if (k in row) row[k] = String(row[k] ?? "").trim();
    for (const k of ["member_id", "fecha_incorporacion", "lider_member_id"]) if (k in row) row[k] = blankToNull(row[k]);
    return save("fb_personas", setPersonas, id, row);
  }, "No se pudo guardar la ficha"), [run, save]);

  const saveRol = useCallback((id, draft) => run(() => {
    const row = pick(draft, ["nombre", "descripcion", "responsabilidades", "expectativas", "activo"]);
    if ("nombre" in row) row.nombre = String(row.nombre).trim();
    return save("fb_roles", setRoles, id, row);
  }, "No se pudo guardar el rol"), [run, save]);

  const assignRol = useCallback((draft) => run(() => {
    const row = pick(draft, ["persona_id", "rol_id", "fecha_asignacion", "responsabilidades", "expectativas"]);
    for (const k of ["fecha_asignacion", "responsabilidades", "expectativas"]) if (k in row) row[k] = blankToNull(String(row[k] ?? "").trim());
    if (!row.fecha_asignacion) delete row.fecha_asignacion;
    return save("fb_persona_roles", setPersonaRoles, null, row);
  }, "No se pudo asignar el rol"), [run, save]);

  const updatePersonaRol = useCallback((id, patch) => run(() => {
    const row = pick(patch, ["fecha_asignacion", "fecha_termino", "estado", "responsabilidades", "expectativas"]);
    for (const k of ["responsabilidades", "expectativas", "fecha_termino"]) if (k in row) row[k] = blankToNull(String(row[k] ?? "").trim());
    return save("fb_persona_roles", setPersonaRoles, id, row);
  }, "No se pudo actualizar el rol de la persona"), [run, save]);

  const saveObjetivo = useCallback((id, draft, rolIds = []) => run(async () => {
    const row = pick(draft, ["persona_id", "titulo", "descripcion", "resultado_esperado", "prioridad", "fecha_objetivo", "estado", "avance", "criterios_exito", "observaciones", "categoria"]);
    if ("titulo" in row) row.titulo = String(row.titulo).trim();
    if ("fecha_objetivo" in row) row.fecha_objetivo = blankToNull(row.fecha_objetivo);
    if ("avance" in row) row.avance = Math.max(0, Math.min(100, Math.round(Number(row.avance) || 0)));
    if (id) delete row.persona_id;
    const out = await save("fb_objetivos", setObjetivos, id, row);
    const actuales = objetivoRoles.filter((x) => x.objetivo_id === out.id).map((x) => x.rol_id);
    const quitar = actuales.filter((r) => !rolIds.includes(r));
    const agregar = rolIds.filter((r) => !actuales.includes(r));
    if (quitar.length) {
      const { error } = await supabase.from("fb_objetivo_roles").delete().eq("objetivo_id", out.id).in("rol_id", quitar);
      if (error) throw error;
    }
    if (agregar.length) {
      const { error } = await supabase.from("fb_objetivo_roles").insert(agregar.map((rol_id) => ({ objetivo_id: out.id, rol_id })));
      if (error) throw error;
    }
    setObjetivoRoles((rows) => [...rows.filter((x) => x.objetivo_id !== out.id), ...rolIds.map((rol_id) => ({ objetivo_id: out.id, rol_id }))]);
    return out;
  }, "No se pudo guardar el objetivo"), [run, save, objetivoRoles]);

  /** Guarda una reunión como borrador (crea o actualiza). Devuelve la fila. */
  const saveSesion = useCallback((id, draft) => run(() => {
    const row = pick(draft, SESION_COLS);
    if (id) delete row.persona_id;
    if ("proxima_revision" in row) row.proxima_revision = blankToNull(row.proxima_revision);
    return save("fb_sesiones", setSesiones, id, row);
  }, "No se pudo guardar el borrador"), [run, save]);

  const deleteBorrador = useCallback((id) => run(async () => {
    const { error } = await supabase.from("fb_sesiones").delete().eq("id", id);
    if (error) throw error;
    setSesiones((rows) => rows.filter((r) => r.id !== id));
    stamp();
    return true;
  }, "No se pudo eliminar el borrador"), [run]);

  /** Publica la minuta: crea los compromisos vinculados, guarda la versión 1 y agenda la próxima revisión. */
  const publicarSesion = useCallback((id) => run(async () => {
    const { data: out, error } = await supabase.rpc("fb_publicar_sesion", { p_sesion: id });
    if (error) throw error;
    setSesiones((rows) => upsertBy(rows, out));
    // Trae solo los compromisos y seguimientos que pudo haber creado la base (2 consultas en vez de 11)
    const [com, seg] = await Promise.all([
      fetchAll(() => supabase.from("fb_compromisos").select("*").order("created_at").order("id")),
      fetchAll(() => supabase.from("fb_seguimientos").select("*").order("fecha").order("id")),
    ]);
    if (alive.current) {
      setCompromisos(com);
      setSeguimientos(seg);
      stamp();
    }
    return out;
  }, "No se pudo publicar la minuta"), [run]);

  const editarPublicada = useCallback((id, cambios, motivo) => run(async () => {
    const { data: out, error } = await supabase.rpc("fb_editar_sesion_publicada", { p_sesion: id, p_cambios: cambios, p_motivo: motivo });
    if (error) throw error;
    setSesiones((rows) => upsertBy(rows, out));
    stamp();
    return out;
  }, "No se pudo guardar la edición de la minuta"), [run]);

  const crearCompromiso = useCallback((draft) => run(() => {
    const row = pick(draft, ["persona_id", "objetivo_id", "descripcion", "categoria", "prioridad", "fecha_vencimiento", "fecha_proxima_revision", "evidencias"]);
    row.descripcion = String(row.descripcion).trim();
    for (const k of ["objetivo_id", "fecha_proxima_revision"]) row[k] = blankToNull(row[k]);
    return save("fb_compromisos", setCompromisos, null, row);
  }, "No se pudo registrar el compromiso"), [run, save]);

  const updateCompromiso = useCallback((id, patch) => run(() => {
    const row = pick(patch, ["objetivo_id", "descripcion", "categoria", "prioridad", "fecha_proxima_revision", "evidencias"]);
    for (const k of ["objetivo_id", "fecha_proxima_revision"]) if (k in row) row[k] = blankToNull(row[k]);
    return save("fb_compromisos", setCompromisos, id, row);
  }, "No se pudo guardar el compromiso"), [run, save]);

  /** Registra una revisión (evento nuevo que no sobrescribe las anteriores) y actualiza el compromiso. */
  const revisarCompromiso = useCallback((id, payload) => run(async () => {
    const { data: out, error } = await supabase.rpc("fb_revisar_compromiso", { p_id: id, p: payload });
    if (error) throw error;
    setCompromisos((rows) => upsertBy(rows, out));
    const { data: revs, error: e2 } = await supabase.from("fb_compromiso_revisiones").select("*").eq("compromiso_id", id).order("created_at").order("id");
    if (e2) throw e2;
    setRevisiones((rows) => [...rows.filter((r) => r.compromiso_id !== id), ...revs]);
    stamp();
    return out;
  }, "No se pudo registrar la revisión"), [run]);

  const saveSeguimiento = useCallback((id, draft) => run(() => {
    const row = pick(draft, ["persona_id", "fecha", "hora", "motivo", "estado"]);
    if (id) delete row.persona_id;
    else delete row.estado; // al crear, la base lo deja "programado" (el permiso de inserción no incluye esta columna)
    if ("hora" in row) row.hora = row.hora ? String(row.hora).slice(0, 5) : null;
    if ("motivo" in row) row.motivo = String(row.motivo ?? "").trim();
    return save("fb_seguimientos", setSeguimientos, id, row);
  }, "No se pudo guardar el seguimiento"), [run, save]);

  const addNota = useCallback((draft) => run(() => save("fb_notas_privadas", setNotas, null, { persona_id: draft.persona_id, sesion_id: draft.sesion_id || null, cuerpo: String(draft.cuerpo).trim() }), "No se pudo guardar la nota"), [run, save]);
  const updateNota = useCallback((id, cuerpo) => run(() => save("fb_notas_privadas", setNotas, id, { cuerpo: String(cuerpo).trim() }), "No se pudo guardar la nota"), [run, save]);
  const deleteNota = useCallback((id) => run(async () => {
    const { error } = await supabase.from("fb_notas_privadas").delete().eq("id", id);
    if (error) throw error;
    setNotas((rows) => rows.filter((r) => r.id !== id));
    stamp();
    return true;
  }, "No se pudo eliminar la nota"), [run]);

  const saveConfigDias = useCallback((clave, dias) => run(async () => {
    const { data: out, error } = await supabase.from("fb_config").upsert({ clave, valor: { dias } }, { onConflict: "clave" }).select().single();
    if (error) throw error;
    setConfigFilas((rows) => (rows.some((r) => r.clave === clave) ? rows.map((r) => (r.clave === clave ? out : r)) : [...rows, out]));
    stamp();
    return true;
  }, "No se pudo guardar la configuración"), [run]);

  /* -------- consultas bajo demanda (no se cargan hasta que se abren) -------- */
  const loadVersiones = useCallback(async (sesionId) => {
    const { data: rows, error } = await supabase.from("fb_minuta_versiones").select("*").eq("sesion_id", sesionId).order("version");
    if (error) throw error;
    return rows;
  }, []);
  const loadAuditoria = useCallback(async (personaId, limit = 100) => {
    const { data: rows, error } = await supabase.from("fb_auditoria").select("*").eq("persona_id", personaId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit);
    if (error) throw error;
    return rows;
  }, []);

  return {
    phase, loadError, live, saving: saving > 0, syncedAt, refresh, hoy, esLider, access,
    ...data, notas, cfg, configFilas, rolesPorId, personasPorId, data,
    savePersona, saveRol, assignRol, updatePersonaRol, saveObjetivo, saveSesion, deleteBorrador, publicarSesion, editarPublicada,
    crearCompromiso, updateCompromiso, revisarCompromiso, saveSeguimiento, addNota, updateNota, deleteNota, saveConfigDias,
    loadVersiones, loadAuditoria,
  };
}
