import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Kanban,
  ListChecks,
  User,
  Zap,
  Calendar,
  CalendarDays,
  Flag,
  BarChart3,
  Award,
  Search,
  Plus,
  Users,
  RefreshCw,
  Send,
  Sparkles,
  DollarSign,
  Target,
  FileText,
  Receipt,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  History,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { ThemeCtx, tokens } from "@/lib/theme";
import { TeamCtx } from "@/lib/team";
import { getRisk, daysUntil, weekRange, inRange, todayISO, addDays } from "@/lib/dates";
import { CATEGORIES, CATEGORY_META, PRIORITIES, getTaskCategory } from "@/lib/constants";
import { useRoadmap, useTaskHistory } from "@/lib/useRoadmap";
import { useFbAccess } from "@/lib/useFb";
import { checkWhatsAppConnection, sendDailySummaryWhatsApp } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { supabaseCRM } from "@/integrations/supabase/crm-client";
import { NotificationBell } from "@/components/TopBar";
import { TaskModal } from "@/components/TaskModal";
import { CommandPalette } from "@/components/CommandPalette";
import { TeamEditModal } from "@/components/TeamEditModal";
import { Toast } from "@/components/Toast";
import { KanbanView } from "@/views/KanbanView";
import { AllTasksView } from "@/views/AllTasksView";
import { MyTasksView } from "@/views/MyTasksView";
import { BreakersView } from "@/views/BreakersView";
import { WeeklyReview } from "@/views/WeeklyReview";
import { RoadmapView } from "@/views/RoadmapView";
import { Dashboard as OpsDashboard } from "@/views/Dashboard";
import { FbView } from "@/views/fb/FbView";
import {
  MonthlyCalendarView,
  formatMonthLabel,
  shiftMonth,
  getTaskMonth,
} from "@/views/MonthlyCalendarView";

const defaultFilters = {
  assignees: [],
  category: "all",
  priority: "all",
  status: "all",
  type: "all",
  project: "all",
  onlyOverdue: false,
  onlyBlocked: false,
  onlyUnassigned: false,
};

const SUB_VIEWS = [
  { id: "kanban", label: "Board", icon: Kanban },
  { id: "mine", label: "Mi Día", icon: User },
  { id: "month", label: "Tareas Mensuales", icon: CalendarDays },
  { id: "all", label: "Lista", icon: ListChecks },
  { id: "roadmap", label: "Roadmap", icon: Flag },
  { id: "breakers", label: "Rompelíneas", icon: Zap },
  { id: "weekly", label: "Weekly Review", icon: Calendar },
  { id: "dashboard", label: "Métricas", icon: BarChart3 },
  { id: "fb", label: "Feedback", icon: Award },
];

export default function Tareas({
  initialView = "kanban",
  showExecutiveHeader = false,
}: {
  initialView?: string;
  showExecutiveHeader?: boolean;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dark = true;
  const c = tokens(dark);

  const activeSession = useMemo(() => (user ? { user } : null), [user]);

  const rm = useRoadmap(activeSession);
  const { phase, me, users, tasks, notifications, clientes, proyectos } = rm;
  const fbAccess = useFbAccess(user?.id);
  const hiddenViews = useMemo(() => (fbAccess.visible ? [] : ["fb"]), [fbAccess.visible]);

  const urlView = searchParams.get("vista");
  const urlAmbito = searchParams.get("ambito");
  const urlMes = searchParams.get("mes");
  const [view, setViewState] = useState(urlView || initialView);
  const [filters, setFilters] = useState(() => ({
    ...defaultFilters,
    category: urlAmbito && CATEGORIES.includes(urlAmbito) ? urlAmbito : "all",
  }));

  // Monthly organization state (defaults to current month YYYY-MM)
  const currentYearMonth = useMemo(() => todayISO().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(urlMes || currentYearMonth);
  const [monthFilterEnabled, setMonthFilterEnabled] = useState<boolean>(true);

  const [modalTaskId, setModalTaskId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [teamEditOpen, setTeamEditOpen] = useState(false);
  const [, setWaConnected] = useState<boolean | null>(null);
  const [sendingDailyWa, setSendingDailyWa] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Progressive disclosure & minimal UI toggles
  const [showExecutivePanel, setShowExecutivePanel] = useState(false);
  const [showQuickOptions, setShowQuickOptions] = useState(false);
  const [moreViewsOpen, setMoreViewsOpen] = useState(false);
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);

  // Quick-capture & Voice-to-Task state
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCategory, setQuickCategory] = useState<string>(
    urlAmbito && CATEGORIES.includes(urlAmbito) ? urlAmbito : "Nexabis"
  );
  const [quickPriority, setQuickPriority] = useState("P2");
  const [quickDeadlineMode, setQuickDeadlineMode] = useState<"today" | "tomorrow" | "none">("today");
  const [quickRecurring, setQuickRecurring] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Commercial summary state (when showExecutiveHeader is true)
  const [showCommercialBar, setShowCommercialBar] = useState(true);
  const [commStats, setCommStats] = useState({
    ingresosMesNeto: 0,
    pipelineValor: 0,
    pipelineCount: 0,
    presupuestosPendientes: 0,
    presupuestosValor: 0,
    facturasSinCobrar: 0,
    facturasValor: 0,
    totalClientes: 0,
  });

  useEffect(() => {
    if (urlView) setViewState(urlView);
    else setViewState(initialView);
  }, [initialView, urlView]);

  useEffect(() => {
    const validScope = urlAmbito && CATEGORIES.includes(urlAmbito) ? urlAmbito : "all";
    setFilters((f) => ({ ...f, category: validScope }));
    if (validScope !== "all") {
      setQuickCategory(validScope);
      if (validScope === "Diaria") setQuickDeadlineMode("today");
    }
  }, [urlAmbito]);

  useEffect(() => {
    if (!showExecutiveHeader || !user) return;
    (async () => {
      try {
        const [pagosRes, presRes, facRes, oppRes, cliRes] = await Promise.all([
          supabaseCRM.from("pagos").select("monto, estado, fecha_pago, metodo_pago").eq("usuario_id", user.id),
          supabase.from("presupuestos").select("total, estado").eq("usuario_id", user.id),
          supabaseCRM.from("facturas").select("total, estado").eq("usuario_id", user.id),
          supabaseCRM.from("oportunidades").select("valor, estado").eq("usuario_id", user.id),
          supabaseCRM.from("clientes").select("id").eq("usuario_id", user.id),
        ]);
        const now = new Date();
        const mesStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const pagosMes = (pagosRes.data || []).filter(
          (p: any) => p.estado === "completado" && new Date(p.fecha_pago) >= mesStart
        );
        const ingresosBruto = pagosMes.reduce((s: number, p: any) => s + Number(p.monto || 0), 0);
        const comisiones = pagosMes.reduce(
          (s: number, p: any) => s + (p.metodo_pago === "mercadopago" ? Number(p.monto || 0) * 0.0266 : 0),
          0
        );
        const oppOpen = (oppRes.data || []).filter((o: any) => o.estado === "abierta");
        const presPend = (presRes.data || []).filter((p: any) => p.estado === "pendiente");
        const facPend = (facRes.data || []).filter((f: any) => ["enviada", "borrador"].includes(f.estado));

        setCommStats({
          ingresosMesNeto: Math.round(ingresosBruto - comisiones),
          pipelineValor: oppOpen.reduce((s: number, o: any) => s + Number(o.valor || 0), 0),
          pipelineCount: oppOpen.length,
          presupuestosPendientes: presPend.length,
          presupuestosValor: presPend.reduce((s: number, p: any) => s + Number(p.total || 0), 0),
          facturasSinCobrar: facPend.length,
          facturasValor: facPend.reduce((s: number, f: any) => s + Number(f.total || 0), 0),
          totalClientes: (cliRes.data || []).length,
        });
      } catch {
        // non-fatal
      }
    })();
  }, [showExecutiveHeader, user]);

  const setView = useCallback(
    (nextView: string) => {
      setViewState(nextView);
      const nextParams: Record<string, string> = {};
      if (nextView !== initialView) nextParams.vista = nextView;
      if (filters.category && filters.category !== "all") nextParams.ambito = filters.category;
      setSearchParams(nextParams, { replace: true });
    },
    [initialView, filters.category, setSearchParams]
  );

  const setScopeTab = useCallback(
    (cat: string) => {
      setFilters((f) => ({ ...f, category: cat }));
      if (cat !== "all") {
        setQuickCategory(cat);
      }
      const nextParams: Record<string, string> = {};
      if (view !== initialView) nextParams.vista = view;
      if (cat !== "all") nextParams.ambito = cat;
      setSearchParams(nextParams, { replace: true });
    },
    [view, initialView, setSearchParams]
  );

  useEffect(() => {
    checkWhatsAppConnection().then((st) => setWaConnected(st.connected));
  }, []);

  const liveModalTask = modalTaskId ? tasks.find((t: any) => t.id === modalTaskId) : null;
  const history = useTaskHistory(liveModalTask?.id, liveModalTask?.updatedAt, rm.nameOf);

  useEffect(() => {
    if (phase === "ready" && modalTaskId && !liveModalTask) setModalTaskId(null);
  }, [phase, modalTaskId, liveModalTask]);

  const openTask = useCallback((id: string) => {
    setModalTaskId(id);
    setCreatingNew(false);
  }, []);
  const openNew = useCallback(() => {
    setCreatingNew(true);
    setModalTaskId(null);
  }, []);
  const closeModal = useCallback(() => {
    setModalTaskId(null);
    setCreatingNew(false);
  }, []);

  const goFiltered = (partial: any) => {
    setFilters({ ...defaultFilters, ...partial });
    setView("all");
  };

  // Create task helper used by both Quick-Capture and Voice Dictation
  const createQuickTaskFromText = useCallback(
    async (rawText: string, overrideCat?: string, overridePrio?: string, overrideDeadline?: string) => {
      const title = rawText.trim();
      if (!title) return;
      const effectiveMeId = me?.id || "cristobal_abarca";
      const cat = overrideCat || quickCategory;
      const prio = overridePrio || quickPriority;
      const deadline =
        overrideDeadline !== undefined
          ? overrideDeadline
          : quickDeadlineMode === "today"
          ? todayISO()
          : quickDeadlineMode === "tomorrow"
          ? addDays(1)
          : "";

      const payload = {
        title,
        description: "",
        assignee: effectiveMeId,
        additionalAssignees: [],
        requester: effectiveMeId,
        startDate: todayISO(),
        deadline,
        status: "Por hacer",
        priority: prio,
        type: cat === "Diaria" ? "Diaria" : "Operacional",
        category: cat,
        impact: "Medio",
        effort: "Medio",
        progress: 0,
        project:
          cat === "Trabajo"
            ? "Trabajo"
            : cat === "Diaria"
            ? "Personal / Día"
            : "Nexabis",
        recurring: {
          enabled: cat === "Diaria" ? quickRecurring : false,
          frequency: "Diaria",
        },
        dependencies: [],
        notifyWhatsApp: false,
      };
      setQuickTitle("");
      await rm.createTask(payload);
    },
    [me, quickCategory, quickPriority, quickDeadlineMode, quickRecurring, rm]
  );

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await createQuickTaskFromText(quickTitle);
  };

  // Voice-to-Task Dictation ("mandarle un audio y que cargue mi tarea")
  const toggleVoiceDictation = () => {
    if (isRecordingVoice) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecordingVoice(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      rm.showToast(
        "💡 En este navegador puedes dictar con el micrófono del teclado o enviar un audio por WhatsApp al +56986343217."
      );
      document.getElementById("quick-capture-input")?.focus();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "es-CL";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      let finalTranscript = "";

      recognition.onstart = () => {
        setIsRecordingVoice(true);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += t;
          } else {
            interim += t;
          }
        }
        const combined = (finalTranscript || interim).trim();
        if (combined) {
          setQuickTitle(combined);
          const lower = combined.toLowerCase();
          if (/\b(trabajo normal|del trabajo|oficina)\b/.test(lower)) setQuickCategory("Trabajo");
          else if (/\b(diaria|personal|casa|rutina)\b/.test(lower)) setQuickCategory("Diaria");
          else if (/\b(nexabis|cliente|presupuesto|cotizaci[oó]n)\b/.test(lower)) setQuickCategory("Nexabis");

          if (/\b(urgente|cr[ií]tico|p0)\b/.test(lower)) setQuickPriority("P0");
          else if (/\b(importante|alta prioridad|p1)\b/.test(lower)) setQuickPriority("P1");
        }
      };

      recognition.onend = async () => {
        setIsRecordingVoice(false);
        const textToSave = finalTranscript.trim();
        if (textToSave) {
          const lower = textToSave.toLowerCase();
          let detectedCat = quickCategory;
          if (/\b(trabajo normal|del trabajo|oficina)\b/.test(lower)) detectedCat = "Trabajo";
          else if (/\b(diaria|personal|casa|rutina)\b/.test(lower)) detectedCat = "Diaria";
          else if (/\b(nexabis|cliente|presupuesto|cotizaci[oó]n)\b/.test(lower)) detectedCat = "Nexabis";

          let detectedPrio = quickPriority;
          if (/\b(urgente|cr[ií]tico|p0)\b/.test(lower)) detectedPrio = "P0";
          else if (/\b(importante|alta prioridad|p1)\b/.test(lower)) detectedPrio = "P1";

          const detectedDeadline = /\b(ma[ñn]ana)\b/.test(lower) ? addDays(1) : todayISO();
          const formattedTitle = textToSave.charAt(0).toUpperCase() + textToSave.slice(1);
          await createQuickTaskFromText(formattedTitle, detectedCat, detectedPrio, detectedDeadline);
          rm.showToast(`🎙️ Tarea creada por voz: "${formattedTitle}" (${detectedCat})`, "ok");
        }
      };

      recognition.onerror = () => {
        setIsRecordingVoice(false);
      };

      recognition.start();
    } catch {
      setIsRecordingVoice(false);
    }
  };

  const handleSendDailySummary = async () => {
    setSendingDailyWa(true);
    const res = await sendDailySummaryWhatsApp({
      tasks,
      userName: me?.name?.split(" ")[0] || "Cris",
      targetPhone: "56986343217",
    });
    setSendingDailyWa(false);
    if (res.ok) {
      rm.showToast("📲 Resumen del día enviado a tu WhatsApp (+56986343217)", "ok");
    } else {
      rm.showToast(`⚠️ No se pudo enviar por WhatsApp: ${res.error || "Error"}`);
    }
  };

  const saveTask = (payload: any) => {
    if (creatingNew) rm.createTask(payload);
    else if (liveModalTask && Object.keys(payload).length > 0)
      rm.updateTask(liveModalTask.id, payload);
    closeModal();
  };
  const deleteTask = (id: string) => {
    rm.deleteTask(id);
    closeModal();
  };
  const changeStatus = (taskId: string, status: string) => {
    const t = tasks.find((x: any) => x.id === taskId);
    if (t && t.status !== status) rm.updateTask(taskId, { status });
  };
  const saveTeam = async (nextUsers: any) => {
    const ok = await rm.saveTeam(nextUsers);
    if (ok) setTeamEditOpen(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || "").toLowerCase();
      const typing =
        tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((p) => !p);
        return;
      }
      if (typing) return;
      if (
        e.key === "c" &&
        view !== "fb" &&
        !modalTaskId &&
        !creatingNew &&
        !teamEditOpen
      )
        openNew();
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("quick-capture-input")?.focus();
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, modalTaskId, creatingNew, teamEditOpen, openNew]);

  /**
   * Monthly + Overdue Rollover Filter:
   * - Tasks belonging to `selectedMonth` (by deadline, startDate, or createdAt) are shown.
   * - Tasks from PREVIOUS months (`taskMonth < selectedMonth`) are ONLY shown if they are
   *   NOT finished (`status !== "Terminada" && status !== "Cancelada"`).
   * - Finished tasks from previous months stay archived in their respective past month.
   */
  const matchesMonthWithRollover = useCallback(
    (t: any) => {
      if (!monthFilterEnabled) return true;
      const tm = getTaskMonth(t);
      if (tm === selectedMonth) return true;
      if (tm < selectedMonth) {
        return t.status !== "Terminada" && t.status !== "Cancelada";
      }
      return false;
    },
    [monthFilterEnabled, selectedMonth]
  );

  const monthFilteredTasks = useMemo(
    () => tasks.filter(matchesMonthWithRollover),
    [tasks, matchesMonthWithRollover]
  );

  const carriedOverCount = useMemo(
    () =>
      tasks.filter((t: any) => {
        const tm = getTaskMonth(t);
        return tm < selectedMonth && t.status !== "Terminada" && t.status !== "Cancelada";
      }).length,
    [tasks, selectedMonth]
  );

  const matchesFilters = useCallback(
    (t: any) => {
      if (!matchesMonthWithRollover(t)) return false;
      if (filters.category && filters.category !== "all" && getTaskCategory(t) !== filters.category)
        return false;
      if (
        filters.assignees.length &&
        !filters.assignees.includes(t.assignee as never) &&
        !filters.assignees.some((a) => (t.additionalAssignees || []).includes(a))
      )
        return false;
      if (filters.priority !== "all" && t.priority !== filters.priority) return false;
      if (filters.status !== "all" && t.status !== filters.status) return false;
      if (filters.type !== "all" && t.type !== filters.type) return false;
      if (filters.project !== "all" && (t.project || "") !== filters.project) return false;
      if (filters.onlyOverdue && getRisk(t) !== "Vencida") return false;
      if (filters.onlyBlocked && t.status !== "Bloqueada") return false;
      if (filters.onlyUnassigned && t.assignee) return false;
      return true;
    },
    [filters, matchesMonthWithRollover]
  );

  const visibleTasks = useMemo(() => tasks.filter(matchesFilters), [tasks, matchesFilters]);
  const scopeFilteredTasks = useMemo(
    () =>
      filters.category && filters.category !== "all"
        ? monthFilteredTasks.filter((t: any) => getTaskCategory(t) === filters.category)
        : monthFilteredTasks,
    [monthFilteredTasks, filters.category]
  );

  const projects = useMemo(
    () =>
      [
        ...new Set([
          ...tasks.map((t: any) => t.project).filter(Boolean),
          ...(proyectos || []).map((p: any) => p.nombre).filter(Boolean),
        ]),
      ].sort(),
    [tasks, proyectos]
  );

  const scopeCounts = useMemo(() => {
    const active = monthFilteredTasks.filter(
      (t: any) => t.status !== "Terminada" && t.status !== "Cancelada"
    );
    const today = todayISO();
    const byScope = (cat: string) => {
      const list = active.filter((t: any) => getTaskCategory(t) === cat);
      return {
        total: list.length,
        today: list.filter((t: any) => t.deadline === today).length,
        overdue: list.filter((t: any) => getRisk(t) === "Vencida").length,
      };
    };
    return {
      all: active.length,
      Nexabis: byScope("Nexabis"),
      Trabajo: byScope("Trabajo"),
      Diaria: byScope("Diaria"),
    };
  }, [monthFilteredTasks]);

  const kpis = useMemo(() => {
    const active = scopeFilteredTasks.filter(
      (t: any) => t.status !== "Terminada" && t.status !== "Cancelada"
    );
    const done = scopeFilteredTasks.filter((t: any) => t.status === "Terminada");
    const overdue = active.filter((t: any) => getRisk(t) === "Vencida");
    const blocked = active.filter((t: any) => t.status === "Bloqueada");
    const p0 = active.filter((t: any) => t.priority === "P0");
    const p1 = active.filter((t: any) => t.priority === "P1");
    const breakersActive = active.filter((t: any) => t.type === "Rompelínea");
    const upcoming = active.filter((t: any) => {
      const d = daysUntil(t.deadline);
      return d !== null && d >= 0 && d <= 3;
    });
    const unassigned = active.filter((t: any) => !t.assignee);
    const [wStart, wEnd] = weekRange(0);
    const createdThisWeek = scopeFilteredTasks.filter((t: any) =>
      inRange((t.createdAt || "").slice(0, 10), [wStart, wEnd])
    );
    const avgProgress = active.length
      ? Math.round(
          active.reduce((s: number, t: any) => s + (t.progress || 0), 0) / active.length
        )
      : 0;
    const myOpen = active.filter((t: any) => me && t.assignee === me.id).length;
    return {
      active,
      done,
      overdue,
      blocked,
      p0,
      p1,
      breakersActive,
      upcoming,
      unassigned,
      createdThisWeek,
      avgProgress,
      myOpen,
    };
  }, [scopeFilteredTasks, me]);

  const teamCtx = useMemo(
    () => ({ users, userById: (id: string) => users.find((u: any) => u.id === id) }),
    [users]
  );

  if (phase === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">Cargando Centro de Operaciones & Mi Día…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ThemeCtx.Provider value={{ dark }}>
        <TeamCtx.Provider value={teamCtx}>
          <div className="space-y-3">
            {/* Optional Executive + Commercial Header (shown on /dashboard) */}
            {showExecutiveHeader && (
              <div className="rounded-2xl border border-border/80 bg-card/75 backdrop-blur-xl p-3 shadow-sm transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                    </span>
                    <span className="text-xs sm:text-sm font-heading font-bold gradient-text">
                      Centro de Mando Nexabis
                    </span>
                    <span className="text-[11px] text-muted-foreground hidden md:inline">
                      · {scopeCounts.all} tareas activas · ${commStats.ingresosMesNeto.toLocaleString()} CLP neto mes
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowExecutivePanel((v) => !v)}
                      className={`text-xs px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 font-medium ${
                        showExecutivePanel
                          ? "border-primary/50 bg-primary/20 text-primary shadow-sm"
                          : "border-border bg-muted/60 text-muted-foreground hover:text-foreground hover:border-primary/30"
                      }`}
                    >
                      <span>{showExecutivePanel ? "Plegar métricas" : "📊 Métricas & Finanzas"}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          showExecutivePanel ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => navigate("/cotizador")}
                      className="text-xs px-2.5 py-1 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-colors hidden sm:inline-flex font-heading"
                    >
                      Cotizador
                    </button>
                  </div>
                </div>

                {/* Collapsible Executive Details */}
                {showExecutivePanel && (
                  <div className="pt-3 mt-2.5 border-t border-border/60 space-y-3">
                    {/* 3 Scope Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {CATEGORIES.map((cat) => {
                        const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
                        const st = scopeCounts[cat as "Nexabis" | "Trabajo" | "Diaria"];
                        const selected = filters.category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setScopeTab(selected ? "all" : cat)}
                            className={`text-left rounded-xl border p-3 transition-all hover-lift ${
                              selected
                                ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-[0_0_20px_rgba(255,92,92,0.15)]"
                                : "border-border bg-card/80 hover:border-primary/40 hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-heading font-semibold text-foreground flex items-center gap-1.5">
                                <span>{meta.emoji}</span>
                                <span>{meta.label}</span>
                              </span>
                              <span className="text-sm font-mono font-bold text-primary">
                                {st.total} activas
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mb-2">{meta.description}</p>
                            <div className="flex items-center gap-3 text-[11px] font-mono">
                              <span className="text-secondary">🎯 Hoy: {st.today}</span>
                              <span className={st.overdue > 0 ? "text-red-400 font-semibold" : "text-muted-foreground"}>
                                ⚠️ Vencidas: {st.overdue}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Commercial KPIs Strip */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-border/60">
                      <button
                        onClick={() => navigate("/pagos")}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Ingreso Neto Mes</p>
                          <p className="text-sm font-bold font-mono text-emerald-400">
                            ${commStats.ingresosMesNeto.toLocaleString()}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => navigate("/pipeline")}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border border-primary/25 bg-primary/5 hover:bg-primary/10 text-left transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-primary/15 text-primary">
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Pipeline ({commStats.pipelineCount})
                          </p>
                          <p className="text-sm font-bold font-mono text-primary">
                            ${commStats.pipelineValor.toLocaleString()}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => navigate("/presupuestos")}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border border-secondary/25 bg-secondary/5 hover:bg-secondary/10 text-left transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-secondary/15 text-secondary">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Presupuestos ({commStats.presupuestosPendientes})
                          </p>
                          <p className="text-sm font-bold font-mono text-secondary">
                            ${commStats.presupuestosValor.toLocaleString()}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => navigate("/facturas")}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border border-accent/25 bg-accent/5 hover:bg-accent/10 text-left transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-accent/15 text-accent">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Por Cobrar ({commStats.facturasSinCobrar})
                          </p>
                          <p className="text-sm font-bold font-mono text-accent">
                            ${commStats.facturasValor.toLocaleString()}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ultra-Clean Quick-Capture & Voice Bar (Progressive Disclosure) */}
            {view !== "fb" && (
              <form
                onSubmit={handleQuickAdd}
                className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl p-2 sm:p-2.5 shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
              >
                <div className="flex items-center gap-2">
                  {/* Voice-to-Task Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceDictation}
                    title="Dictar tarea por audio / voz"
                    className={`p-2 rounded-xl transition-all shrink-0 flex items-center justify-center ${
                      isRecordingVoice
                        ? "bg-red-500 text-white animate-pulse shadow-md"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {isRecordingVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Main Input */}
                  <input
                    id="quick-capture-input"
                    type="text"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    onFocus={() => setShowQuickOptions(true)}
                    placeholder={
                      isRecordingVoice
                        ? "🎙️ Escuchando tu voz... Habla ahora para crear tu tarea"
                        : `+ ¿Qué tarea tienes pendiente? (Escribe o pulsa 🎙️ para dictar)`
                    }
                    className="flex-1 bg-transparent px-2.5 py-1.5 text-xs sm:text-sm outline-none text-foreground placeholder:text-muted-foreground/60"
                  />

                  {/* Quick Scope Chip */}
                  <button
                    type="button"
                    onClick={() => setShowQuickOptions((v) => !v)}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-all shrink-0"
                  >
                    <span>{CATEGORY_META[quickCategory as keyof typeof CATEGORY_META]?.emoji}</span>
                    <span className="font-medium">{CATEGORY_META[quickCategory as keyof typeof CATEGORY_META]?.shortLabel}</span>
                  </button>

                  {/* Toggle Advanced Options */}
                  <button
                    type="button"
                    onClick={() => setShowQuickOptions((v) => !v)}
                    title={showQuickOptions ? "Ocultar opciones" : "Opciones de ámbito, prioridad y fecha"}
                    className={`p-1.5 rounded-lg border text-xs transition-colors shrink-0 ${
                      showQuickOptions
                        ? "border-primary/40 text-primary bg-primary/10"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showQuickOptions ? "rotate-180" : ""}`} />
                  </button>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!quickTitle.trim()}
                    className="gradient-button disabled:opacity-30 text-white text-xs font-heading font-semibold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Agregar</span>
                  </button>
                </div>

                {/* Collapsible Options Drawer */}
                {showQuickOptions && (
                  <div className="mt-2.5 pt-2.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-2.5 text-xs animate-fade-in">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Ámbito:</span>
                      {CATEGORIES.map((cat) => {
                        const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
                        const active = quickCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setQuickCategory(cat)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border ${
                              active
                                ? meta.activeCls
                                : "border-transparent bg-muted/40 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span>{meta.emoji}</span>
                            <span>{meta.shortLabel}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Prioridad:</span>
                      {PRIORITIES.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setQuickPriority(p)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-mono font-medium transition-all ${
                            quickPriority === p
                              ? p === "P0"
                                ? "bg-red-500 text-white font-bold"
                                : p === "P1"
                                ? "bg-orange-500 text-white font-bold"
                                : "bg-primary text-white font-bold"
                              : "bg-muted/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Fecha:</span>
                      {[
                        { id: "today", label: "Hoy" },
                        { id: "tomorrow", label: "Mañana" },
                        { id: "none", label: "Sin fecha" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setQuickDeadlineMode(opt.id as any)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                            quickDeadlineMode === opt.id
                              ? "bg-primary/20 text-primary border border-primary/40 font-semibold"
                              : "bg-muted/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}

                      {quickCategory === "Diaria" && (
                        <button
                          type="button"
                          onClick={() => setQuickRecurring((r) => !r)}
                          className={`px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                            quickRecurring
                              ? "bg-accent/25 text-accent border border-accent/40 font-semibold"
                              : "bg-muted/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Cada día</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* Main Board Shell with Unified Single Master Toolbar */}
            <div
              className={`rounded-2xl border overflow-hidden flex flex-col min-h-[calc(100vh-11rem)] ${c.app} ${c.panelBorder} shadow-sm`}
            >
              {/* Unified Single Toolbar (Progressive View Switcher + Scopes + Quick Actions) */}
              {view !== "fb" && (
                <div className="bg-card/90 border-b border-border/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
                  {/* Left: 3 Core Segmented Views + More Views Dropdown */}
                  <div className="flex items-center gap-1">
                    {/* Tablero Kanban */}
                    <button
                      onClick={() => setView("kanban")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        view === "kanban"
                          ? "gradient-button text-white shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      <span>Tablero</span>
                    </button>

                    {/* Mi Día */}
                    <button
                      onClick={() => setView("mine")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        view === "mine"
                          ? "gradient-button text-white shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Mi Día</span>
                      {kpis.myOpen > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/20 text-primary">
                          {kpis.myOpen}
                        </span>
                      )}
                    </button>

                    {/* Mes Calendario */}
                    <button
                      onClick={() => setView("month")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        view === "month"
                          ? "gradient-button text-white shadow-sm font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Mes</span>
                      {carriedOverCount > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400">
                          {carriedOverCount}
                        </span>
                      )}
                    </button>

                    {/* Más Vistas Dropdown Popover */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMoreViewsOpen((v) => !v)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          ["roadmap", "breakers", "fb", "all", "weekly", "dashboard"].includes(view)
                            ? "border border-primary/40 bg-primary/15 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <span>
                          {["roadmap", "breakers", "fb", "all", "weekly", "dashboard"].includes(view)
                            ? SUB_VIEWS.find((v) => v.id === view)?.label
                            : "Más vistas"}
                        </span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {moreViewsOpen && (
                        <div
                          className="absolute left-0 top-full mt-1.5 w-48 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-xl z-50 p-1.5 space-y-0.5 animate-scale-in"
                          onMouseLeave={() => setMoreViewsOpen(false)}
                        >
                          {[
                            { id: "all", label: "Lista Completa", icon: ListChecks },
                            { id: "roadmap", label: "Roadmap & Gantt", icon: Flag },
                            { id: "breakers", label: "Rompelíneas", icon: Zap },
                            { id: "weekly", label: "Weekly Review", icon: Calendar },
                            { id: "dashboard", label: "Métricas de Ops", icon: BarChart3 },
                            { id: "fb", label: "Feedback & Desarrollo", icon: Award },
                          ].map((sub) => {
                            const SubIcon = sub.icon;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setView(sub.id);
                                  setMoreViewsOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                                  view === sub.id
                                    ? "bg-primary/20 text-primary font-semibold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                }`}
                              >
                                <SubIcon className="w-3.5 h-3.5" />
                                <span>{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center: Scope Pill Selector & Month Switcher */}
                  <div className="flex items-center gap-2">
                    {/* Scope Pill Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setScopeDropdownOpen((v) => !v)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-border bg-background hover:bg-muted/60 text-xs font-medium transition-all"
                      >
                        <span>
                          {filters.category === "all"
                            ? "🌐 Todo"
                            : CATEGORY_META[filters.category as keyof typeof CATEGORY_META]?.emoji +
                              " " +
                              CATEGORY_META[filters.category as keyof typeof CATEGORY_META]?.label}
                        </span>
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </button>

                      {scopeDropdownOpen && (
                        <div
                          className="absolute left-0 top-full mt-1.5 w-48 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-xl z-50 p-1.5 space-y-0.5 animate-scale-in"
                          onMouseLeave={() => setScopeDropdownOpen(false)}
                        >
                          <button
                            onClick={() => {
                              setScopeTab("all");
                              setScopeDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${
                              filters.category === "all"
                                ? "bg-primary/20 text-primary font-semibold"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            }`}
                          >
                            <span>🌐 Todos los ámbitos</span>
                            <span className="font-mono text-[10px]">{scopeCounts.all}</span>
                          </button>
                          {CATEGORIES.map((cat) => {
                            const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
                            const cnt = scopeCounts[cat as "Nexabis" | "Trabajo" | "Diaria"].total;
                            return (
                              <button
                                key={cat}
                                onClick={() => {
                                  setScopeTab(cat);
                                  setScopeDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${
                                  filters.category === cat
                                    ? "bg-primary/20 text-primary font-semibold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                }`}
                              >
                                <span>{meta.emoji} {meta.label}</span>
                                <span className="font-mono text-[10px]">{cnt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Month Navigator */}
                    <div className="flex items-center bg-background border border-border rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMonthFilterEnabled(true);
                          setSelectedMonth((m) => shiftMonth(m, -1));
                        }}
                        className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Mes anterior"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setView("month")}
                        className="px-2 py-0.5 text-xs font-heading font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                        title="Ver calendario mensual con arrastre de atrasadas"
                      >
                        <CalendarDays className="w-3 h-3 text-primary" />
                        <span>{formatMonthLabel(selectedMonth)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMonthFilterEnabled(true);
                          setSelectedMonth((m) => shiftMonth(m, 1));
                        }}
                        className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Mes siguiente"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {carriedOverCount > 0 && (
                      <span
                        onClick={() => setView("month")}
                        className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-colors"
                        title="Tareas de meses anteriores que aún no has terminado"
                      >
                        <History className="w-3 h-3" />
                        <span className="hidden sm:inline">⏪ {carriedOverCount} atrasada{carriedOverCount === 1 ? "" : "s"}</span>
                      </span>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* 1-Click Sync with Server & WhatsApp */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRefreshing(true);
                        rm.refresh();
                        setTimeout(() => setIsRefreshing(false), 800);
                      }}
                      title="Sincronizar tareas con el servidor y WhatsApp"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                      <span className="hidden xl:inline">Sincronizar</span>
                    </button>

                    {/* 1-Click Send to WhatsApp */}
                    <button
                      type="button"
                      onClick={handleSendDailySummary}
                      disabled={sendingDailyWa}
                      title="Enviar mis tareas a WhatsApp (+56986343217)"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span className="hidden xl:inline">{sendingDailyWa ? "Enviando…" : "WhatsApp"}</span>
                    </button>

                    {/* Command Palette */}
                    <button
                      onClick={() => setPaletteOpen(true)}
                      title="Buscar tareas o comandos (⌘K)"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs text-muted-foreground transition-all"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono border border-border rounded px-1 hidden sm:inline">⌘K</span>
                    </button>

                    {/* Notifications */}
                    {me && (
                      <NotificationBell
                        notifications={notifications}
                        currentUser={me}
                        onMarkRead={rm.markRead}
                        onMarkAllRead={rm.markAllRead}
                        openTask={openTask}
                        onOpenLink={() => false}
                      />
                    )}

                    {/* Team modal */}
                    <button
                      onClick={() => setTeamEditOpen(true)}
                      title="Editar equipo y números de WhatsApp"
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Equipo</span>
                    </button>

                    {/* New Task Button */}
                    <button
                      onClick={openNew}
                      className="gradient-button text-white text-xs font-heading font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Nueva Tarea</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Main View Container */}
              <div className="flex-1 p-3 lg:p-4 overflow-x-auto">
                {view === "kanban" && (
                  <KanbanView
                    tasks={visibleTasks}
                    filters={filters}
                    setFilters={setFilters}
                    projects={projects}
                    openTask={openTask}
                    onDrop={changeStatus}
                  />
                )}
                {view === "month" && (
                  <MonthlyCalendarView
                    tasks={
                      filters.category && filters.category !== "all"
                        ? tasks.filter((t: any) => getTaskCategory(t) === filters.category)
                        : tasks
                    }
                    selectedMonth={selectedMonth}
                    onChangeMonth={(nextM: string) => {
                      setSelectedMonth(nextM);
                      setMonthFilterEnabled(true);
                    }}
                    openTask={openTask}
                    openNewOnDate={() => openNew()}
                  />
                )}
                {view === "all" && (
                  <AllTasksView
                    tasks={visibleTasks}
                    filters={filters}
                    setFilters={setFilters}
                    projects={projects}
                    openTask={openTask}
                  />
                )}
                {view === "mine" && me && (
                  <MyTasksView tasks={scopeFilteredTasks} currentUser={me} openTask={openTask} />
                )}
                {view === "breakers" && (
                  <BreakersView tasks={scopeFilteredTasks} openTask={openTask} />
                )}
                {view === "weekly" && (
                  <WeeklyReview tasks={scopeFilteredTasks} openTask={openTask} />
                )}
                {view === "roadmap" && (
                  <RoadmapView tasks={scopeFilteredTasks} openTask={openTask} />
                )}
                {view === "dashboard" && (
                  <OpsDashboard
                    tasks={scopeFilteredTasks}
                    kpis={kpis}
                    openTask={openTask}
                    goFiltered={goFiltered}
                  />
                )}
                {view === "fb" && fbAccess.visible && (
                  <FbView
                    session={activeSession}
                    access={fbAccess.access}
                    users={users}
                    nameOf={rm.nameOf}
                    showToast={rm.showToast}
                    dark={dark}
                  />
                )}
              </div>

              {/* Task Drawer Modal */}
              {(liveModalTask || creatingNew) && (
                <TaskModal
                  key={creatingNew ? `new-${quickCategory}` : liveModalTask.id}
                  liveTask={creatingNew ? null : liveModalTask}
                  history={history}
                  isNew={creatingNew}
                  currentUser={me || { id: "cristobal_abarca", name: "Cristóbal Abarca", role: "Director & Co-Founder" }}
                  allTasks={tasks}
                  clientes={clientes}
                  proyectos={proyectos}
                  defaultCategory={
                    filters.category && filters.category !== "all"
                      ? filters.category
                      : quickCategory
                  }
                  onClose={closeModal}
                  onSave={saveTask}
                  onDelete={deleteTask}
                  onAddComment={rm.addComment}
                />
              )}

              {/* Global Command Palette */}
              <CommandPalette
                open={paletteOpen}
                onClose={() => setPaletteOpen(false)}
                tasks={tasks}
                setView={setView}
                openTask={openTask}
                openNew={openNew}
                dark={dark}
                setDark={() => {}}
                hidden={hiddenViews}
              />

              {/* Team & WhatsApp Modal */}
              {teamEditOpen && (
                <TeamEditModal
                  users={users}
                  onClose={() => setTeamEditOpen(false)}
                  onSave={saveTeam}
                />
              )}

              <Toast toast={rm.toast} onClose={rm.dismissToast} />
            </div>
          </div>
        </TeamCtx.Provider>
      </ThemeCtx.Provider>
    </DashboardLayout>
  );
}
