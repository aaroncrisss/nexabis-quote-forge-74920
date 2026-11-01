import { useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  History,
} from "lucide-react";
import { useTheme, tokens } from "../lib/theme";
import { CATEGORY_META, getTaskCategory, prioCls, statusCls } from "../lib/constants";
import { todayISO } from "../lib/dates";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DAY_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function formatMonthLabel(ym) {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym;
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function shiftMonth(ym, delta) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getTaskMonth(task) {
  const refDate = task.deadline || task.startDate || (task.createdAt || "").slice(0, 10) || todayISO();
  return refDate.slice(0, 7);
}

export function MonthlyCalendarView({
  tasks,
  selectedMonth,
  onChangeMonth,
  openTask,
  openNewOnDate,
}) {
  const { dark } = useTheme();
  const c = tokens(dark);
  const today = todayISO();

  const [year, month] = useMemo(() => {
    const parts = (selectedMonth || today.slice(0, 7)).split("-").map(Number);
    return [parts[0] || 2026, parts[1] || 10];
  }, [selectedMonth, today]);

  // Separate tasks belonging to this month vs carried-over overdue tasks from previous months
  const { monthTasks, carriedOverTasks, stats } = useMemo(() => {
    const inMonth = [];
    const carried = [];
    let completed = 0;
    let pending = 0;

    for (const t of tasks) {
      const tm = getTaskMonth(t);
      const isDone = t.status === "Terminada" || t.status === "Cancelada";
      if (tm < selectedMonth && !isDone) {
        carried.push(t);
        pending++;
      } else if (tm === selectedMonth) {
        inMonth.push(t);
        if (isDone) completed++;
        else pending++;
      }
    }

    return {
      monthTasks: inMonth,
      carriedOverTasks: carried,
      stats: {
        total: inMonth.length + carried.length,
        completed,
        pending,
        carriedCount: carried.length,
      },
    };
  }, [tasks, selectedMonth]);

  // Build calendar grid (Monday-first)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    // JS getDay(): 0=Sun..6=Sat -> Monday=0..Sunday=6
    const startOffset = (firstDay.getDay() + 6) % 7;

    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ empty: true, key: `empty-start-${i}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayTasks = monthTasks.filter(
        (t) => (t.deadline || t.startDate || (t.createdAt || "").slice(0, 10)) === iso
      );
      cells.push({
        empty: false,
        day: d,
        iso,
        isToday: iso === today,
        tasks: dayTasks,
        key: iso,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ empty: true, key: `empty-end-${cells.length}` });
    }
    return cells;
  }, [year, month, monthTasks, today]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Monthly Summary Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className={`p-3.5 rounded-xl border ${c.card} ${c.cardBorder} flex items-center justify-between`}>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Total en {formatMonthLabel(selectedMonth)}
            </p>
            <p className="text-lg md:text-xl font-bold font-mono text-foreground mt-0.5">
              {stats.total}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <CalendarIcon className="w-4 h-4" />
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${c.card} ${c.cardBorder} flex items-center justify-between`}>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Pendientes del Mes
            </p>
            <p className="text-lg md:text-xl font-bold font-mono text-secondary mt-0.5">
              {stats.pending}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${c.card} ${c.cardBorder} flex items-center justify-between`}>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Terminadas en el Mes
            </p>
            <p className="text-lg md:text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {stats.completed}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div
          className={`p-3.5 rounded-xl border ${
            stats.carriedCount > 0
              ? "border-red-500/40 bg-red-500/5"
              : `${c.card} ${c.cardBorder}`
          } flex items-center justify-between`}
        >
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Arrastradas (Meses Ant.)
            </p>
            <p
              className={`text-lg md:text-xl font-bold font-mono mt-0.5 ${
                stats.carriedCount > 0 ? "text-red-400" : "text-muted-foreground"
              }`}
            >
              {stats.carriedCount}
            </p>
          </div>
          <div
            className={`p-2 rounded-lg ${
              stats.carriedCount > 0
                ? "bg-red-500/15 text-red-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <History className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Carried-Over Unfinished Tasks from Previous Months */}
      {carriedOverTasks.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-xs md:text-sm font-heading font-semibold text-red-300">
                ⏪ Tareas Atrasadas No Terminadas de Meses Anteriores ({carriedOverTasks.length})
              </h3>
            </div>
            <span className="text-[11px] text-red-300/80">
              Se mantienen visibles hasta que las marques como Terminadas
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {carriedOverTasks.map((t) => {
              const cat = getTaskCategory(t);
              const meta = CATEGORY_META[cat] || CATEGORY_META.Nexabis;
              const originMonth = formatMonthLabel(getTaskMonth(t));
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openTask(t.id)}
                  className="text-left p-2.5 rounded-lg border border-red-500/25 bg-card/90 hover:border-primary/50 transition-all flex items-start justify-between gap-2 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold">
                        ⏪ {originMonth}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${prioCls(t.priority, dark)}`}>
                        {t.priority}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {meta.emoji} {meta.shortLabel}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {t.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Vencía: {t.deadline || "Sin fecha"} · {t.status}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Calendar Grid */}
      <div className={`rounded-xl border ${c.card} ${c.cardBorder} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <h2 className="text-sm md:text-base font-heading font-bold gradient-text">
              Calendario Mensual — {formatMonthLabel(selectedMonth)}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChangeMonth(shiftMonth(selectedMonth, -1))}
              className="p-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onChangeMonth(today.slice(0, 7))}
              className="px-2.5 py-1 rounded-lg border border-border hover:border-primary/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Mes Actual
            </button>
            <button
              type="button"
              onClick={() => onChangeMonth(shiftMonth(selectedMonth, 1))}
              className="p-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/20">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-heading font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {calendarDays.map((cell) => {
            if (cell.empty) {
              return <div key={cell.key} className="min-h-[96px] md:min-h-[115px] bg-background/40" />;
            }
            return (
              <div
                key={cell.key}
                className={`min-h-[96px] md:min-h-[115px] p-1.5 md:p-2 transition-colors flex flex-col ${
                  cell.isToday
                    ? "bg-primary/5 ring-1 ring-inset ring-primary/40"
                    : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-mono font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                      cell.isToday
                        ? "gradient-button text-white shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    {cell.day}
                  </span>
                  {openNewOnDate && (
                    <button
                      type="button"
                      onClick={() => openNewOnDate(cell.iso)}
                      title={`Agregar tarea para el ${cell.iso}`}
                      className="opacity-0 hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                  {cell.tasks.map((t) => {
                    const cat = getTaskCategory(t);
                    const meta = CATEGORY_META[cat] || CATEGORY_META.Nexabis;
                    const done = t.status === "Terminada";
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => openTask(t.id)}
                        className={`w-full text-left px-1.5 py-1 rounded text-[10px] leading-tight truncate border transition-all flex items-center gap-1 ${
                          done
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 line-through opacity-70"
                            : "bg-card/90 border-border hover:border-primary/50 text-foreground"
                        }`}
                        title={`${meta.emoji} [${t.priority}] ${t.title} (${t.status})`}
                      >
                        <span>{meta.emoji}</span>
                        <span className="truncate font-medium">{t.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
