import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabase";
import { todayISO } from "./dates";
import { computeInitials } from "./team";
import { memberFromRow, taskFromRow, taskToRow, historyFromRow, notificationFromRow } from "./mappers";
import { notifyTaskWhatsApp } from "./whatsapp";
import { createDebounced, createVisibilityLifecycle, createVisibleInterval, isTabVisible } from "./realtimeVisibility";

function upsertRow(rows, row, key = "id") {
  const i = rows.findIndex((r) => r[key] === row[key]);
  if (i === -1) return [...rows, row];
  if (rows[i].updated_at && row.updated_at && rows[i].updated_at > row.updated_at) return rows;
  const next = rows.slice();
  next[i] = row;
  return next;
}

function friendlyError(e) {
  const msg = (e && (e.message || e.details)) || "";
  if (/duplicate key|team_members_email_key/i.test(msg))
    return "Ese correo ya está asignado a otra persona del equipo.";
  if (/row-level security|permission denied/i.test(msg))
    return "No tienes permiso para hacer este cambio.";
  if (/Failed to fetch|NetworkError|network/i.test(msg))
    return "Sin conexión. Revisa tu internet e inténtalo de nuevo.";
  return msg || "Error inesperado.";
}

// Caché en localStorage (sobrevive entre pestañas y visitas): la pantalla se muestra al instante con lo último
// conocido y se actualiza en segundo plano (SWR). Se borra al cerrar sesión (useAuth).
const CACHE_KEY = "nexabis_roadmap_cache_v1";

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const DEFAULT_CRIS = {
  id: "cristobal_abarca",
  userId: "94f1161f-81d2-444c-873a-e9424e55839f",
  email: "cr.abarca.a@gmail.com",
  phone: "56986343217",
  name: "Cristóbal Abarca",
  role: "Director & Co-Founder",
  initials: "CA",
  colorKey: "blue",
  color: "bg-blue-600 text-white",
  order: 1,
};

// Intervalos de respaldo (pausados automáticamente si la pestaña está oculta)
const LIVE_RECONCILE_MS = 300_000; // 5 min solo como red de seguridad cuando Realtime está conectado
const FALLBACK_POLL_MS = 120_000;  // 2 min si Realtime está caído
const HIDDEN_GRACE_MS = 30_000;    // desconecta Realtime tras 30 s con la pestaña oculta

export function useRoadmap(session, options = {}) {
  const active = options.active !== false;
  const initialCache = useMemo(() => readCache(), []);

  const [memberRows, setMemberRows] = useState(() => initialCache?.memberRows || []);
  const [taskRows, setTaskRows] = useState(() => initialCache?.taskRows || []);
  const [commentRows, setCommentRows] = useState(() => initialCache?.commentRows || []);
  const [notifRows, setNotifRows] = useState(() => initialCache?.notifRows || []);
  const [readIds, setReadIds] = useState(() => new Set(initialCache?.readIds || []));
  const [clientes, setClientes] = useState(() => initialCache?.clientes || []);
  const [proyectos, setProyectos] = useState(() => initialCache?.proyectos || []);
  const [phase, setPhase] = useState(() => (initialCache?.memberRows?.length ? "ready" : "loading")); // loading | ready | noaccess | error
  const [loadError, setLoadError] = useState("");
  const [live, setLive] = useState(false);
  const [saving, setSaving] = useState(0);
  const [syncedAt, setSyncedAt] = useState(null);
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const alive = useRef(true);
  const liveRef = useRef(false);
  const inFlightRef = useRef(false);
  const fullLoadedRef = useRef(false);
  const lastSyncRef = useRef(0);

  const userId = typeof session === "string" ? session : session?.user?.id;

  // Mantiene snapshot en ref para persistir cache con debounce tras eventos Realtime
  const snapshotRef = useRef({ memberRows, taskRows, commentRows, notifRows, readIds, clientes, proyectos });
  snapshotRef.current = { memberRows, taskRows, commentRows, notifRows, readIds, clientes, proyectos };

  const persistCacheDebounced = useMemo(
    () =>
      createDebounced(() => {
        const s = snapshotRef.current;
        if (!s.memberRows.length) return;
        writeCache({
          memberRows: s.memberRows,
          taskRows: s.taskRows,
          commentRows: s.commentRows,
          notifRows: s.notifRows,
          readIds: Array.from(s.readIds),
          clientes: s.clientes,
          proyectos: s.proyectos,
        });
      }, 1200),
    []
  );

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(toastTimer.current);
      persistCacheDebounced.cancel();
    };
  }, [persistCacheDebounced]);

  const showToast = useCallback((message, tone = "error") => {
    clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  /** Carga mínima de equipo cuando la pantalla abierta no usa tareas (ej. vista Feedback). */
  const loadMembersOnly = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const m = await supabase.from("team_members").select("*").order("sort_order");
      if (m.error) throw m.error;
      if (!alive.current) return;
      setMemberRows(m.data);
      if (m.data.length === 0) {
        setPhase("noaccess");
        return;
      }
      setPhase("ready");
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  /** Carga completa (montaje inicial activo, botón Sincronizar o recuperación de error). */
  const loadAll = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const [m, t, c, n, r, cl, pr] = await Promise.all([
        supabase.from("team_members").select("*").order("sort_order"),
        supabase.from("tasks").select("*").order("created_at"),
        supabase.from("task_comments").select("id, task_id, author, body, text, created_at").order("created_at"),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(60),
        supabase.from("notification_reads").select("notification_id"),
        supabase.from("clientes").select("id, nombre, empresa, telefono, email").order("nombre"),
        supabase.from("proyectos").select("id, nombre, estado, cliente_id").order("nombre"),
      ]);
      // Equipo y tareas son obligatorios; comentarios/notificaciones no deben dejar el tablero vacío
      const failed = [m, t].find((x) => x.error);
      if (failed) throw failed.error;
      for (const [name, x] of [["task_comments", c], ["notifications", n], ["notification_reads", r]]) {
        if (x.error) console.error(`Error cargando ${name}`, x.error);
      }
      if (!alive.current) return;
      setMemberRows(m.data);
      if (m.data.length === 0) {
        setPhase("noaccess");
        return;
      }
      setTaskRows(t.data);
      setCommentRows(c.data || []);
      setNotifRows(n.data || []);
      const readSet = new Set((r.data || []).map((x) => x.notification_id));
      setReadIds(readSet);
      if (cl.data) setClientes(cl.data);
      if (pr.data) setProyectos(pr.data);
      fullLoadedRef.current = true;
      lastSyncRef.current = Date.now();
      setSyncedAt(new Date());
      setPhase("ready");

      writeCache({
        memberRows: m.data,
        taskRows: t.data,
        commentRows: c.data || [],
        notifRows: n.data || [],
        readIds: Array.from(readSet),
        clientes: cl.data || [],
        proyectos: pr.data || [],
      });
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  /** Sincronización liviana de tablas dinámicas (4 consultas; omite team_members, clientes y proyectos). */
  const syncDynamic = useCallback(async () => {
    if (!fullLoadedRef.current) return loadAll();
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const [t, c, n, r] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at"),
        supabase.from("task_comments").select("id, task_id, author, body, text, created_at").order("created_at"),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(60),
        supabase.from("notification_reads").select("notification_id"),
      ]);
      if (t.error) throw t.error;
      if (!alive.current) return;
      setTaskRows(t.data);
      if (!c.error) setCommentRows(c.data || []);
      if (!n.error) setNotifRows(n.data || []);
      if (!r.error) setReadIds(new Set((r.data || []).map((x) => x.notification_id)));
      lastSyncRef.current = Date.now();
      setSyncedAt(new Date());
      persistCacheDebounced();
    } finally {
      inFlightRef.current = false;
    }
  }, [loadAll, persistCacheDebounced]);

  const refresh = useCallback(() => {
    loadAll().catch((e) => {
      console.error("Error al sincronizar", e);
      if (!alive.current) return;
      setLoadError(friendlyError(e));
      setPhase((p) => (p === "ready" ? p : "error"));
    });
  }, [loadAll]);

  const refreshDynamic = useCallback(() => {
    syncDynamic().catch((e) => {
      console.error("Error al sincronizar cambios", e);
    });
  }, [syncDynamic]);

  useEffect(() => {
    if (!userId) return undefined;

    // Si estamos en una vista que no usa tareas (ej. Feedback), cargamos solo team_members si hace falta
    // y NO abrimos canal Realtime ni polling de tareas.
    if (!active) {
      liveRef.current = false;
      setLive(false);
      if (!snapshotRef.current.memberRows.length) {
        loadMembersOnly().catch((e) => {
          console.error("Error al cargar equipo", e);
          if (!alive.current) return;
          setLoadError(friendlyError(e));
          setPhase((p) => (p === "ready" ? p : "error"));
        });
      }
      return undefined;
    }

    if (!snapshotRef.current.memberRows.length) {
      setPhase("loading");
    }
    if (!fullLoadedRef.current) {
      refresh();
    } else if (Date.now() - lastSyncRef.current > 30_000) {
      refreshDynamic();
    }

    let channel = null;
    let hasSubscribedOnce = false;
    let needsResyncOnSubscribe = false;

    const touch = () => {
      setSyncedAt(new Date());
      persistCacheDebounced();
    };

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
      // Solo las 3 tablas colaborativas en vivo: team_members y notification_reads se actualizan
      // de forma optimista/local y no justifican slots ni evaluaciones RLS en Realtime.
      const ch = supabase
        .channel(`roadmap-live-${Math.random().toString(36).slice(2, 8)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (p) => {
          setTaskRows((rows) =>
            p.eventType === "DELETE" ? rows.filter((x) => x.id !== p.old.id) : upsertRow(rows, p.new)
          );
          touch();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "task_comments" }, (p) => {
          setCommentRows((rows) =>
            p.eventType === "DELETE" ? rows.filter((x) => x.id !== p.old.id) : upsertRow(rows, p.new)
          );
          touch();
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (p) => {
          setNotifRows((rows) => upsertRow(rows, p.new));
          touch();
        })
        .subscribe((status) => {
          const ok = status === "SUBSCRIBED";
          liveRef.current = ok;
          if (alive.current) setLive(ok);
          if (ok) {
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

    // Pausa Realtime tras 30 s con la pestaña oculta; al volver reconecta y sincroniza solo si se desconectó o pasó tiempo sin conexión.
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

    // Polling de respaldo pausado automáticamente cuando la pestaña está oculta.
    // Revisa cada 60 s pero solo consulta cada 5 min si Realtime está vivo (o cada 2 min si está caído).
    const stopPoll = createVisibleInterval(() => {
      const minGap = liveRef.current ? LIVE_RECONCILE_MS : FALLBACK_POLL_MS;
      if (Date.now() - lastSyncRef.current >= minGap) {
        refreshDynamic();
      }
    }, 60_000);

    return () => {
      stopVisibility();
      stopPoll();
      detachChannel();
    };
  }, [userId, active, refresh, refreshDynamic, loadMembersOnly, persistCacheDebounced]);

  const users = useMemo(() => {
    const list = memberRows.map(memberFromRow);
    if (!list.some((u) => u.id === "cristobal_abarca")) {
      list.unshift(DEFAULT_CRIS);
    }
    return list;
  }, [memberRows]);

  const me = useMemo(
    () =>
      users.find((u) => u.userId === userId) ||
      users.find((u) => u.id === "cristobal_abarca") ||
      users[0] ||
      DEFAULT_CRIS,
    [users, userId]
  );
  const nameOf = useCallback((id) => users.find((u) => u.id === id)?.name || "", [users]);

  const tasks = useMemo(() => {
    const byTask = {};
    commentRows.forEach((c) => (byTask[c.task_id] ||= []).push(c));
    return taskRows.map((r) => taskFromRow(r, byTask[r.id] || [], (id) => nameOf(id) || "Alguien"));
  }, [taskRows, commentRows, nameOf]);

  const notifications = useMemo(
    () => (me ? notifRows.map((n) => notificationFromRow(n, me.id, readIds, nameOf)) : []),
    [notifRows, readIds, me, nameOf]
  );

  const run = useCallback(
    async (fn, failMsg) => {
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
    },
    [refresh, showToast]
  );

  const dispatchWhatsAppIfNeeded = useCallback(
    async (taskRow, prevRow, forceSend = false) => {
      const mapped = taskFromRow(taskRow, [], nameOf);
      const assigneeUser = users.find((u) => u.id === mapped.assignee);
      const cli = clientes.find((c) => c.id === mapped.clienteId);
      const becameBreaker =
        mapped.type === "Rompelínea" && (!prevRow || prevRow.type !== "Rompelínea");
      const becameP0 = mapped.priority === "P0" && (!prevRow || prevRow.priority !== "P0");
      const becameBlocked =
        mapped.status === "Bloqueada" && (!prevRow || prevRow.status !== "Bloqueada");
      const changedAssignee =
        mapped.assignee && (!prevRow || prevRow.assignee !== mapped.assignee);

      let tipoEvento = null;
      if (becameBreaker) tipoEvento = "rompelinea";
      else if (becameP0) tipoEvento = "tarea_p0";
      else if (becameBlocked) tipoEvento = "tarea_bloqueada";
      else if (changedAssignee || forceSend) tipoEvento = "tarea_asignada";

      if (!tipoEvento) return;
      if (!forceSend && !becameBreaker && !becameP0 && !becameBlocked && !changedAssignee) return;

      const res = await notifyTaskWhatsApp({
        tipoEvento,
        task: mapped,
        targetPhone: assigneeUser?.phone || "",
        responsableName: assigneeUser?.name || mapped.assignee,
        clienteName: cli?.nombre || "",
      });
      if (res.ok && forceSend) {
        showToast("Notificación enviada por WhatsApp.", "ok");
      }
    },
    [users, clientes, nameOf, showToast]
  );

  const createTask = useCallback(
    (draft) =>
      run(async () => {
        const cleanDraft = {
          ...draft,
          assignee: draft.assignee || "cristobal_abarca",
          requester: draft.requester || "cristobal_abarca",
        };
        const { data, error } = await supabase
          .from("tasks")
          .insert(taskToRow(cleanDraft))
          .select()
          .single();
        if (error) throw error;
        setTaskRows((rows) => upsertRow(rows, data));
        setSyncedAt(new Date());
        persistCacheDebounced();
        dispatchWhatsAppIfNeeded(data, null, !!draft.notifyWhatsApp);
        return data.id;
      }, "No se pudo crear la tarea"),
    [run, dispatchWhatsAppIfNeeded, persistCacheDebounced]
  );

  const updateTask = useCallback(
    (id, patch) =>
      run(async () => {
        const prevRow = taskRows.find((r) => r.id === id);
        const row = taskToRow(patch);
        if (Object.keys(row).length === 0) {
          if (patch.notifyWhatsApp && prevRow) {
            await dispatchWhatsAppIfNeeded(prevRow, prevRow, true);
          }
          return;
        }
        const optimistic = { ...row };
        if (row.status === "Terminada") {
          optimistic.progress = 100;
          optimistic.completed_at = todayISO();
        } else if (row.status) optimistic.completed_at = null;
        setTaskRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...optimistic } : r)));
        const { data, error } = await supabase
          .from("tasks")
          .update(row)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        setTaskRows((rows) => rows.map((r) => (r.id === id ? data : r)));
        setSyncedAt(new Date());
        persistCacheDebounced();
        dispatchWhatsAppIfNeeded(data, prevRow, !!patch.notifyWhatsApp);
      }, "No se pudo guardar el cambio"),
    [run, taskRows, dispatchWhatsAppIfNeeded, persistCacheDebounced]
  );

  const deleteTask = useCallback(
    (id) =>
      run(async () => {
        setTaskRows((rows) => rows.filter((r) => r.id !== id));
        const { error } = await supabase.from("tasks").delete().eq("id", id);
        if (error) throw error;
        setSyncedAt(new Date());
        persistCacheDebounced();
      }, "No se pudo eliminar la tarea"),
    [run, persistCacheDebounced]
  );

  const addComment = useCallback(
    (taskId, text) =>
      run(async () => {
        const { data, error } = await supabase
          .from("task_comments")
          .insert({ task_id: taskId, body: text.trim(), text: text.trim() })
          .select()
          .single();
        if (error) throw error;
        setCommentRows((rows) => upsertRow(rows, data));
        persistCacheDebounced();
      }, "No se pudo enviar el comentario"),
    [run, persistCacheDebounced]
  );

  const saveTeam = useCallback(
    (nextUsers) =>
      run(async () => {
        const changed = nextUsers.filter((u) => {
          const old = users.find((x) => x.id === u.id);
          return (
            !old ||
            old.name !== u.name ||
            old.role !== u.role ||
            (old.email || "") !== (u.email || "") ||
            (old.phone || "") !== (u.phone || "")
          );
        });
        for (const u of changed) {
          const name = u.name.trim();
          const { data, error } = await supabase
            .from("team_members")
            .update({
              name,
              role: (u.role || "").trim(),
              initials: computeInitials(name),
              email: (u.email || "").trim() || null,
              phone: (u.phone || "").trim(),
            })
            .eq("id", u.id)
            .select()
            .single();
          if (error) throw error;
          setMemberRows((rows) => rows.map((x) => (x.id === u.id ? data : x)));
        }
        persistCacheDebounced();
        showToast("Equipo y teléfonos de WhatsApp actualizados.", "ok");
        return true;
      }, "No se pudo guardar el equipo"),
    [run, users, showToast, persistCacheDebounced]
  );

  const markRead = useCallback(
    (id) => {
      if (readIds.has(id)) return;
      setReadIds((s) => new Set(s).add(id));
      persistCacheDebounced();
      supabase
        .from("notification_reads")
        .upsert({ notification_id: id }, { onConflict: "notification_id,member_id", ignoreDuplicates: true })
        .then(({ error }) => {
          if (error) console.error("No se pudo marcar como leída", error);
        });
    },
    [readIds, persistCacheDebounced]
  );

  const markAllRead = useCallback(() => {
    const unread = notifications.filter((n) => n.readBy.length === 0).map((n) => n.id);
    if (!unread.length) return;
    setReadIds((s) => new Set([...s, ...unread]));
    persistCacheDebounced();
    supabase
      .from("notification_reads")
      .upsert(
        unread.map((id) => ({ notification_id: id })),
        { onConflict: "notification_id,member_id", ignoreDuplicates: true }
      )
      .then(({ error }) => {
        if (error) console.error("No se pudo marcar como leídas", error);
      });
  }, [notifications, persistCacheDebounced]);

  return {
    phase,
    loadError,
    me,
    users,
    nameOf,
    tasks,
    notifications,
    clientes,
    proyectos,
    live,
    saving: saving > 0,
    syncedAt,
    toast,
    dismissToast: () => setToast(null),
    showToast,
    refresh,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    saveTeam,
    markRead,
    markAllRead,
  };
}

export function useTaskHistory(taskId, stamp, nameOf) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!taskId) {
      setRows([]);
      return undefined;
    }
    let alive = true;
    supabase
      .from("task_history")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at")
      .then(({ data }) => {
        if (alive && data) setRows(data);
      });
    return () => {
      alive = false;
    };
  }, [taskId, stamp]);
  return useMemo(() => rows.map((h) => historyFromRow(h, nameOf)), [rows, nameOf]);
}
