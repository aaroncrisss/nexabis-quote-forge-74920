import { useState, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { useTheme } from "../lib/theme";
import { fmtDate, getRisk } from "../lib/dates";
import { useTeam } from "../lib/team";
import { statusCls, PRIORITY_LABEL, PRIORITY_DOT, prioCls, TYPE_META, riskCls, RISK_ICON, projectCls, CATEGORY_META, categoryCls, getTaskCategory } from "../lib/constants";

export function Avatar({ userId, size = "sm" }) {
  const { userById: findUser } = useTeam();
  const u = findUser(userId);
  const dims = size === "lg" ? "w-9 h-9 text-xs" : size === "md" ? "w-7 h-7 text-xs" : "w-6 h-6 text-xs";
  if (!u) return <div className={`${dims} rounded-full bg-slate-500 text-white flex items-center justify-center font-semibold shrink-0 opacity-50`}>?</div>;
  return <div title={u.name} className={`${dims} rounded-full ${u.color} text-white flex items-center justify-center font-semibold shrink-0`}>{u.initials}</div>;
}

export function PriorityDot({ id }) {
  return <span title={PRIORITY_LABEL[id]} className={`inline-block w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[id] || PRIORITY_DOT.P2}`} />;
}
export function PriorityBadge({ id }) {
  const { dark } = useTheme();
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${prioCls(id, dark)}`}>
      <PriorityDot id={id} />{id}
    </span>
  );
}
export function StatusBadge({ status }) {
  const { dark } = useTheme();
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${statusCls(status, dark)}`}>{status}</span>;
}
export function CategoryBadge({ category, task }) {
  const { dark } = useTheme();
  const cat = category || getTaskCategory(task);
  const meta = CATEGORY_META[cat] || CATEGORY_META.Nexabis;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-medium shrink-0 ${categoryCls(cat, dark)}`}>
      <span>{meta.emoji}</span>
      <span>{meta.shortLabel}</span>
    </span>
  );
}
export function RiskBadge({ task }) {
  const { dark } = useTheme();
  const r = getRisk(task);
  if (!r) return null;
  const Icon = RISK_ICON[r];
  return <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${riskCls(r, dark)}`}><Icon className="w-3 h-3" />{r}</span>;
}
export function TypeSquare({ type, size = "sm" }) {
  const meta = TYPE_META[type] || TYPE_META["Operacional"];
  const Icon = meta.icon;
  const dims = size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <span title={type} className={`inline-flex items-center justify-center rounded ${dims} ${meta.color} text-white shrink-0`}>
      <Icon className="w-2.5 h-2.5" />
    </span>
  );
}
export function ProjectPill({ name }) {
  const { dark } = useTheme();
  if (!name) return null;
  return <span style={{ maxWidth: 140 }} className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium uppercase tracking-wide truncate ${projectCls(name, dark)}`}>{name}</span>;
}
export function ProgressBar({ value }) {
  const pct = value || 0;
  return (
    <div className="w-full h-1 rounded-full overflow-hidden bg-muted">
      <div
        className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-primary via-secondary to-accent"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
export function EmptyState({ label }) {
  return <div className="text-center py-6 text-xs rounded-lg border border-dashed text-muted-foreground border-border">{label}</div>;
}
export function SectionTitle({ icon: Icon, children, count }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
      <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">{children}</h3>
      {count !== undefined && <span className="text-xs font-mono text-muted-foreground/70">{count}</span>}
    </div>
  );
}
export function KpiStrip({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs px-3 py-2 rounded-lg border bg-card border-border">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-border">·</span>}
          <span className="text-muted-foreground">{it.label}</span>
          <span className={`font-mono font-semibold ${it.tone || "text-foreground"}`}>{it.value}</span>
        </span>
      ))}
    </div>
  );
}
export function useHoverCard() {
  const [pos, setPos] = useState(null);
  const timer = useRef(null);
  const onEnter = (e) => {
    const x = e.clientX, y = e.clientY;
    timer.current = setTimeout(() => setPos({ x, y }), 350);
  };
  const onMove = (e) => setPos((p) => (p ? { x: e.clientX, y: e.clientY } : p));
  const onLeave = () => { clearTimeout(timer.current); setPos(null); };
  return { pos, onEnter, onMove, onLeave };
}
export function HoverDescription({ pos, task }) {
  if (!pos) return null;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const left = Math.min(pos.x + 14, vw - 260);
  return (
    <div style={{ position: "fixed", left, top: pos.y + 16 }} className="z-50 w-60 rounded-md border p-2.5 shadow-lg pointer-events-none bg-popover border-border text-popover-foreground">
      <p className="text-xs font-semibold mb-1 line-clamp-2 text-foreground">{task.title}</p>
      <p className="text-xs leading-relaxed line-clamp-5 text-muted-foreground">{task.description || "Sin descripción."}</p>
    </div>
  );
}
export function TaskRow({ task, onClick }) {
  const hover = useHoverCard();
  const hasAudio = (task.description || "").includes("[audio:data:audio");
  return (
    <>
      <button onClick={onClick} onMouseEnter={hover.onEnter} onMouseMove={hover.onMove} onMouseLeave={hover.onLeave}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left transition-colors border bg-card border-border hover:bg-muted/50 hover:border-primary/40">
        <TypeSquare type={task.type} />
        <PriorityBadge id={task.priority} />
        <CategoryBadge task={task} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate text-foreground flex items-center gap-1.5">
            <span>{task.title}</span>
            {hasAudio && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-primary/15 text-primary border border-primary/30 inline-flex items-center">
                🎙️ Audio
              </span>
            )}
          </p>
          <p className="text-xs font-mono truncate text-muted-foreground/70">{task.id}{task.project ? " · " + task.project : ""}</p>
        </div>
        <Avatar userId={task.assignee} />
        <span className="hidden sm:inline-flex"><StatusBadge status={task.status} /></span>
        <span className="hidden sm:inline-block text-xs w-14 text-right shrink-0 text-muted-foreground">{fmtDate(task.deadline)}</span>
        <span className="hidden md:inline-flex"><RiskBadge task={task} /></span>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50" />
      </button>
      <HoverDescription pos={hover.pos} task={task} />
    </>
  );
}
