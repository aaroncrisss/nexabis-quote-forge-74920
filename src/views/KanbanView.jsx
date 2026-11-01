import { useState, useMemo, memo } from "react";
import { MessageSquare, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { useTheme, tokens } from "../lib/theme";
import { getRisk, sortTasks } from "../lib/dates";
import { KANBAN_STATUSES } from "../lib/constants";
import { Avatar, PriorityDot, RiskBadge, TypeSquare, ProjectPill, CategoryBadge, ProgressBar, useHoverCard, HoverDescription } from "../components/ui";
import { FilterBar } from "../components/FilterBar";

export const KanbanCard = memo(function KanbanCard({ task, onClick, onDragStart, onQuickComplete }) {
  const { dark } = useTheme();
  const c = tokens(dark);
  const risk = getRisk(task);
  const hover = useHoverCard();
  const isDone = task.status === "Terminada";
  const audioMatch = (task.description || "").match(/\[audio:(data:audio\/[^;]+;base64,[^\]]+)\]/);
  const audioSrc = audioMatch ? audioMatch[1] : null;
  return (
    <>
      <div
        draggable
        onDragStart={onDragStart}
        onClick={onClick}
        onMouseEnter={hover.onEnter}
        onMouseMove={hover.onMove}
        onMouseLeave={hover.onLeave}
        className={`group rounded-md border p-2.5 mb-2 cursor-pointer transition-colors ${c.card} ${c.cardBorder} ${c.cardHover}`}
      >
        <div className="flex items-start justify-between gap-1.5 mb-1.5">
          <p className={`text-xs font-medium leading-snug line-clamp-2 ${isDone ? "line-through opacity-60" : ""} text-foreground`}>
            {task.title}
          </p>
          {onQuickComplete && !isDone && (
            <button
              type="button"
              title="Marcar como Terminada"
              onClick={(e) => {
                e.stopPropagation();
                onQuickComplete(task.id);
              }}
              className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-primary ${c.textFaint}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1 mb-1.5">
          <CategoryBadge task={task} />
          {task.project && <ProjectPill name={task.project} />}
        </div>
        {audioSrc && (
          <div
            className="my-1.5 p-1 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <audio controls src={audioSrc} className="w-full h-7 accent-primary" preload="none" />
          </div>
        )}
        {task.progress > 0 && task.status !== "Terminada" && (
          <div className="mb-1.5">
            <ProgressBar value={task.progress} />
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <TypeSquare type={task.type} />
          <span className={`text-xs font-mono ${c.textFaint}`}>{task.id}</span>
          <div className="flex-1" />
          {(task.comments || []).length > 0 && (
            <span className={`flex items-center gap-0.5 text-xs ${c.textFaint}`}>
              <MessageSquare className="w-3 h-3" />
              {task.comments.length}
            </span>
          )}
          <PriorityDot id={task.priority} />
          <Avatar userId={task.assignee} />
        </div>
        {risk && risk !== "En plazo" && (
          <div className="mt-1.5">
            <RiskBadge task={task} />
          </div>
        )}
      </div>
      <HoverDescription pos={hover.pos} task={task} />
    </>
  );
});

export function KanbanView({ tasks, filters, setFilters, projects, openTask, onDrop }) {
  const { dark } = useTheme();
  const c = tokens(dark);
  const [dragId, setDragId] = useState(null);
  const [collapsedCols, setCollapsedCols] = useState({});
  const toggleCol = (s) => setCollapsedCols((m) => ({ ...m, [s]: !m[s] }));

  // Single-pass memoized partition for instant rendering
  const columnsData = useMemo(() => {
    const map = {};
    for (const status of KANBAN_STATUSES) {
      map[status] = [];
    }
    for (const t of tasks) {
      if (map[t.status]) {
        map[t.status].push(t);
      }
    }
    for (const status of KANBAN_STATUSES) {
      map[status] = sortTasks(map[status]);
    }
    return map;
  }, [tasks]);

  return (
    <div>
      <FilterBar filters={filters} setFilters={setFilters} projects={projects} />
      <div className="flex gap-2 overflow-x-auto pb-2">
        {KANBAN_STATUSES.map((status) => {
          const col = columnsData[status] || [];
          const collapsed = collapsedCols[status];
          return (
            <div
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) onDrop(dragId, status);
                setDragId(null);
              }}
              style={{ minHeight: 160 }}
              className={`rounded-lg p-1.5 shrink-0 ${c.column} ${collapsed ? "w-10" : "w-64"} transition-all`}
            >
              <button
                onClick={() => toggleCol(status)}
                className={`w-full flex items-center gap-1 px-1 py-1 mb-1 rounded ${c.textDim} hover:text-primary transition-colors`}
              >
                {collapsed ? (
                  <span className="flex flex-col items-center gap-1 mx-auto py-1">
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold" style={{ writingMode: "vertical-rl" }}>
                      {status}
                    </span>
                    <span className="text-xs font-mono text-primary">{col.length}</span>
                  </span>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold uppercase tracking-wide truncate">{status}</span>
                    <span className="text-xs font-mono ml-auto px-1.5 rounded-full bg-primary/10 text-primary">{col.length}</span>
                  </>
                )}
              </button>
              {!collapsed && (
                <>
                  {col.length === 0 && (
                    <div className="text-xs text-center py-6 border border-dashed rounded-md border-border text-muted-foreground/60">
                      Sin tareas
                    </div>
                  )}
                  {col.map((t) => (
                    <KanbanCard
                      key={t.id}
                      task={t}
                      onClick={() => openTask(t.id)}
                      onDragStart={() => setDragId(t.id)}
                      onQuickComplete={(id) => onDrop(id, "Terminada")}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
