import { useState, useEffect, useRef } from "react";
import { Zap, X, MessageSquare, History, ChevronDown, ChevronRight, Trash2, Send, RefreshCw, Mic } from "lucide-react";
import { useTheme, tokens } from "../lib/theme";
import { todayISO, fmtDateTime } from "../lib/dates";
import { useTeam } from "../lib/team";
import { STATUSES, PRIORITIES, PRIORITY_LABEL, TYPES, FREQS, IMPACTS, EFFORTS, CATEGORIES, CATEGORY_META, getTaskCategory } from "../lib/constants";
import { diffTask } from "../lib/mappers";
import { notifyTaskWhatsApp } from "../lib/whatsapp";
import { TypeSquare, SectionTitle } from "./ui";

export function emptyDraft(currentUserId, defaultCategory = "Nexabis") {
  const effectiveUserId = currentUserId || "cristobal_abarca";
  return {
    title: "",
    description: "",
    assignee: effectiveUserId,
    additionalAssignees: [],
    requester: effectiveUserId,
    startDate: todayISO(),
    deadline: defaultCategory === "Diaria" ? todayISO() : "",
    status: defaultCategory === "Diaria" ? "Por hacer" : "Backlog",
    priority: "P2",
    type: defaultCategory === "Diaria" ? "Diaria" : "Operacional",
    category: defaultCategory || "Nexabis",
    impact: "Medio",
    effort: "Medio",
    progress: 0,
    project: defaultCategory === "Trabajo" ? "Trabajo" : defaultCategory === "Diaria" ? "Personal / Día" : "",
    clienteId: "",
    proyectoId: "",
    blockers: "",
    expectedResult: "",
    links: "",
    recurring: { enabled: false, frequency: "Diaria" },
    objective: "",
    expectedImpact: "",
    successIndicator: "",
    nextMilestone: "",
    dependencies: [],
    notifyWhatsApp: false,
  };
}

export function Field({ label, children, full }) {
  const { dark } = useTheme();
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className={`block text-xs font-medium mb-1 ${dark ? "text-slate-500" : "text-slate-500"}`}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function TaskModal({
  liveTask,
  history = [],
  isNew,
  currentUser,
  allTasks,
  clientes = [],
  proyectos = [],
  defaultCategory = "Nexabis",
  onClose,
  onSave,
  onDelete,
  onAddComment,
}) {
  const { dark } = useTheme();
  const c = tokens(dark);
  const { users } = useTeam();
  const [draft, setDraft] = useState(() =>
    liveTask
      ? { ...liveTask, category: getTaskCategory(liveTask), notifyWhatsApp: false }
      : emptyDraft(currentUser?.id || "", defaultCategory)
  );
  const baseline = useRef(liveTask ? { ...liveTask, category: getTaskCategory(liveTask) } : null);
  const [commentText, setCommentText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMore, setShowMore] = useState(!isNew);
  const [waSending, setWaSending] = useState(false);
  const [waStatus, setWaStatus] = useState("");
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const canSave = draft.title.trim().length > 0;
  const inputCls = `w-full border rounded-md px-2.5 py-1.5 text-xs outline-none ${c.input}`;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleCategoryChange = (cat) => {
    setDraft((d) => {
      const next = { ...d, category: cat };
      if (isNew) {
        if (cat === "Diaria") {
          next.type = "Diaria";
          if (!next.deadline) next.deadline = todayISO();
          if (next.status === "Backlog") next.status = "Por hacer";
          if (!next.project || next.project === "Trabajo") next.project = "Personal / Día";
        } else if (cat === "Trabajo") {
          if (next.type === "Diaria") next.type = "Operacional";
          if (!next.project || next.project === "Personal / Día") next.project = "Trabajo";
        } else if (cat === "Nexabis") {
          if (next.type === "Diaria") next.type = "Operacional";
          if (next.project === "Trabajo" || next.project === "Personal / Día") next.project = "";
        }
      }
      return next;
    });
  };

  const handleProyectoChange = (proyectoId) => {
    const pr = proyectos.find((p) => p.id === proyectoId);
    if (pr) {
      setDraft((d) => ({
        ...d,
        category: "Nexabis",
        proyectoId: pr.id,
        project: pr.nombre,
        clienteId: pr.cliente_id || d.clienteId,
      }));
    } else {
      set("proyectoId", "");
    }
  };

  const handleSendDirectWhatsApp = async () => {
    setWaSending(true);
    setWaStatus("");
    const assigneeUser = users.find((u) => u.id === draft.assignee);
    const cli = clientes.find((cl) => cl.id === draft.clienteId);
    const res = await notifyTaskWhatsApp({
      tipoEvento:
        draft.type === "Rompelínea"
          ? "rompelinea"
          : draft.priority === "P0"
          ? "tarea_p0"
          : draft.status === "Bloqueada"
          ? "tarea_bloqueada"
          : "tarea_asignada",
      task: draft,
      targetPhone: assigneeUser?.phone || "",
      responsableName: assigneeUser?.name || draft.assignee,
      clienteName: cli?.nombre || "",
    });
    setWaSending(false);
    setWaStatus(res.ok ? "✅ Enviado por WhatsApp" : `⚠️ ${res.error || "Error al enviar"}`);
    setTimeout(() => setWaStatus(""), 4000);
  };

  const activeCategory = getTaskCategory(draft);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black bg-opacity-50">
      <div className={`w-full max-w-lg h-full shadow-2xl overflow-y-auto flex flex-col ${c.panel}`}>
        <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${c.panelBorder}`}>
          <div className="flex items-center gap-2">
            <TypeSquare type={draft.type} size="md" />
            <div>
              <p className={`text-xs font-mono ${c.textFaint}`}>{isNew ? "Nueva tarea" : draft.id}</p>
              <h3 className={`text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
                {isNew ? "Crear tarea" : "Editar tarea"}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <button
                type="button"
                onClick={handleSendDirectWhatsApp}
                disabled={waSending}
                title="Enviar alerta por WhatsApp al responsable / admin"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                {waSending ? "Enviando…" : "WhatsApp"}
              </button>
            )}
            <button onClick={onClose} className={c.textFaint}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {waStatus && (
          <div className="px-4 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs font-medium">
            {waStatus}
          </div>
        )}

        <div className="p-4 space-y-3 flex-1">
          {/* Selector de Ámbito (Nexabis | Trabajo | Diaria) */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
              Ámbito de la tarea
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const isSelected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? meta.activeCls + " shadow-sm"
                        : dark
                        ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                    }`}
                  >
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Título *" full>
            <input
              className={inputCls}
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={
                activeCategory === "Diaria"
                  ? "Ej: Revisar correos, entrenar, pagar servicio, rutina mañana..."
                  : activeCategory === "Trabajo"
                  ? "Ej: Preparar comité semanal, revisar indicadores CRM, 1:1 con equipo..."
                  : "Ej: Entregar módulo de cotización para cliente, deploy a producción..."
              }
              autoFocus
            />
          </Field>

          {activeCategory === "Diaria" && (
            <div
              className={`rounded-lg p-2.5 border flex flex-wrap items-center justify-between gap-2 ${
                dark ? "bg-amber-950/20 border-amber-800/40" : "bg-amber-50 border-amber-200"
              }`}
            >
              <label className={`flex items-center gap-2 text-xs font-medium ${dark ? "text-amber-300" : "text-amber-800"}`}>
                <input
                  type="checkbox"
                  checked={draft.recurring?.enabled || false}
                  onChange={(e) =>
                    set("recurring", {
                      enabled: e.target.checked,
                      frequency: draft.recurring?.frequency || "Diaria",
                    })
                  }
                />
                <RefreshCw className="w-3.5 h-3.5" />
                Repetir automáticamente al completar
              </label>
              {draft.recurring?.enabled && (
                <select
                  className={`border rounded px-2 py-1 text-xs ${c.input}`}
                  value={draft.recurring.frequency || "Diaria"}
                  onChange={(e) => set("recurring", { ...draft.recurring, frequency: e.target.value })}
                >
                  {FREQS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Responsable">
              <select
                className={inputCls}
                value={draft.assignee}
                onChange={(e) => set("assignee", e.target.value)}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prioridad">
              <select
                className={inputCls}
                value={draft.priority}
                onChange={(e) => set("priority", e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select
                className={inputCls}
                value={draft.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo">
              <select
                className={inputCls}
                value={draft.type}
                onChange={(e) => set("type", e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha límite (Deadline)">
              <div className="space-y-1">
                <input
                  type="date"
                  className={inputCls}
                  value={draft.deadline || ""}
                  onChange={(e) => set("deadline", e.target.value)}
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => set("deadline", todayISO())}
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${c.panelBorder} ${c.textDim}`}
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      set("deadline", d.toISOString().slice(0, 10));
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${c.panelBorder} ${c.textDim}`}
                  >
                    Mañana
                  </button>
                  {draft.deadline && (
                    <button
                      type="button"
                      onClick={() => set("deadline", "")}
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${c.panelBorder} ${c.textFaint}`}
                    >
                      Sin fecha
                    </button>
                  )}
                </div>
              </div>
            </Field>
            <Field label="Etiqueta / Área / Proyecto">
              <input
                className={inputCls}
                value={draft.project}
                onChange={(e) => set("project", e.target.value)}
                placeholder={
                  activeCategory === "Nexabis"
                    ? "Ej: Deley Clinic / SaaS"
                    : activeCategory === "Trabajo"
                    ? "Ej: Comité Comercial / CRM"
                    : "Ej: Rutina Mañana / Finanzas"
                }
              />
            </Field>
            {activeCategory === "Nexabis" && (
              <>
                <Field label="Proyecto Nexabis">
                  <select
                    className={inputCls}
                    value={draft.proyectoId || ""}
                    onChange={(e) => handleProyectoChange(e.target.value)}
                  >
                    <option value="">— Seleccionar proyecto —</option>
                    {proyectos.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Cliente Nexabis">
                  <select
                    className={inputCls}
                    value={draft.clienteId || ""}
                    onChange={(e) => set("clienteId", e.target.value)}
                  >
                    <option value="">— Sin cliente vinculado —</option>
                    {clientes.map((cl) => (
                      <option key={cl.id} value={cl.id}>
                        {cl.nombre} {cl.empresa ? `(${cl.empresa})` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
          </div>

          <label
            className={`flex items-center gap-2 text-xs font-medium px-2.5 py-2 rounded-md border ${
              dark
                ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <input
              type="checkbox"
              checked={!!draft.notifyWhatsApp}
              onChange={(e) => set("notifyWhatsApp", e.target.checked)}
            />
            Enviar notificación por WhatsApp (Evolution API · NexabisTech) al guardar
          </label>

          {isNew && (
            <button
              onClick={() => setShowMore((v) => !v)}
              className="text-xs font-medium flex items-center gap-1 text-primary hover:underline"
            >
              {showMore ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {showMore ? "Ocultar campos avanzados" : "Mostrar más campos (descripción, recurrencia, subtareas…)"}
            </button>
          )}

          {showMore && (
            <>
              {/* Voice Note Audio Player if present */}
              {(draft.audio_url || draft.description?.includes("[audio:")) && (
                <div className="rounded-xl p-3 bg-primary/10 border border-primary/20 space-y-1.5 mb-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-primary">
                    <span className="flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5" /> Nota de Voz Adjunta
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">WhatsApp</span>
                  </div>
                  <audio
                    controls
                    className="w-full h-8"
                    src={
                      draft.audio_url ||
                      draft.description?.match(/\[audio:(.*?)\]/)?.[1]
                    }
                  />
                </div>
              )}

              <Field label="Descripción" full>
                <textarea
                  rows={3}
                  className={inputCls}
                  value={(draft.description || "").replace(/\[audio:.*?\]/g, "").trim()}
                  onChange={(e) => {
                    const audioTag = draft.description?.match(/\[audio:.*?\]/)?.[0] || "";
                    set("description", audioTag ? `${e.target.value}\n\n${audioTag}` : e.target.value);
                  }}
                  placeholder="Detalle, contexto, criterios de éxito…"
                />
              </Field>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Solicitante">
                  <select
                    className={inputCls}
                    value={draft.requester || ""}
                    onChange={(e) => set("requester", e.target.value)}
                  >
                    <option value="">—</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Fecha de inicio">
                  <input
                    type="date"
                    className={inputCls}
                    value={draft.startDate || ""}
                    onChange={(e) => set("startDate", e.target.value)}
                  />
                </Field>
                <Field label="Impacto">
                  <select
                    className={inputCls}
                    value={draft.impact}
                    onChange={(e) => set("impact", e.target.value)}
                  >
                    {IMPACTS.map((i) => (
                      <option key={i}>{i}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Esfuerzo">
                  <select
                    className={inputCls}
                    value={draft.effort}
                    onChange={(e) => set("effort", e.target.value)}
                  >
                    {EFFORTS.map((i) => (
                      <option key={i}>{i}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label={`Avance — ${draft.progress || 0}%`} full>
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                      style={{ width: `${draft.progress || 0}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={draft.progress || 0}
                    onChange={(e) => set("progress", Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </Field>

              <Field label="Responsables adicionales" full>
                <div className="flex flex-wrap gap-1.5">
                  {users
                    .filter((u) => u.id !== draft.assignee)
                    .map((u) => {
                      const on = (draft.additionalAssignees || []).includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() =>
                            set(
                              "additionalAssignees",
                              on
                                ? draft.additionalAssignees.filter((x) => x !== u.id)
                                : [...(draft.additionalAssignees || []), u.id]
                            )
                          }
                          className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                            on
                              ? "bg-primary/15 border-primary text-primary"
                              : `${c.panelBorder} ${c.textFaint}`
                          }`}
                        >
                          {u.name.split(" ")[0]}
                        </button>
                      );
                    })}
                </div>
              </Field>

              <Field label="Bloqueadores" full>
                <input
                  className={inputCls}
                  value={draft.blockers}
                  onChange={(e) => set("blockers", e.target.value)}
                  placeholder="¿Qué está impidiendo el avance?"
                />
              </Field>
              <Field label="Resultado esperado" full>
                <input
                  className={inputCls}
                  value={draft.expectedResult}
                  onChange={(e) => set("expectedResult", e.target.value)}
                />
              </Field>
              <Field label="Links o referencias" full>
                <input
                  className={inputCls}
                  value={draft.links}
                  onChange={(e) => set("links", e.target.value)}
                  placeholder="https://…"
                />
              </Field>

              <Field label="Dependencias — no puede iniciar hasta que terminen" full>
                <div className={`max-h-24 overflow-y-auto border rounded-md p-2 space-y-1 ${c.panelBorder}`}>
                  {allTasks
                    .filter((t) => t.id !== draft.id)
                    .map((t) => {
                      const on = (draft.dependencies || []).includes(t.id);
                      return (
                        <label key={t.id} className={`flex items-center gap-2 text-xs ${c.textDim}`}>
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() =>
                              set(
                                "dependencies",
                                on
                                  ? draft.dependencies.filter((x) => x !== t.id)
                                  : [...(draft.dependencies || []), t.id]
                              )
                            }
                          />
                          <span className="truncate">{t.title}</span>
                        </label>
                      );
                    })}
                </div>
              </Field>

              <div
                className={`rounded-md p-2.5 border ${
                  dark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
                }`}
              >
                <label
                  className={`flex items-center gap-2 text-xs font-medium mb-2 ${
                    dark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={draft.recurring?.enabled || false}
                    onChange={(e) =>
                      set("recurring", { ...draft.recurring, enabled: e.target.checked })
                    }
                  />
                  Tarea recurrente
                </label>
                {draft.recurring?.enabled && (
                  <select
                    className={inputCls}
                    value={draft.recurring.frequency}
                    onChange={(e) =>
                      set("recurring", { ...draft.recurring, frequency: e.target.value })
                    }
                  >
                    {FREQS.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                )}
              </div>

              {draft.type === "Rompelínea" && (
                <div
                  className={`rounded-md p-2.5 border space-y-2.5 ${
                    dark
                      ? "bg-violet-500 bg-opacity-10 border-violet-800"
                      : "bg-violet-50 border-violet-200"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold flex items-center gap-1.5 ${
                      dark ? "text-violet-400" : "text-violet-700"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Detalle Rompelínea
                  </p>
                  <Field label="Objetivo" full>
                    <input
                      className={inputCls}
                      value={draft.objective}
                      onChange={(e) => set("objective", e.target.value)}
                    />
                  </Field>
                  <Field label="Impacto esperado" full>
                    <input
                      className={inputCls}
                      value={draft.expectedImpact}
                      onChange={(e) => set("expectedImpact", e.target.value)}
                    />
                  </Field>
                  <Field label="Indicador de éxito" full>
                    <input
                      className={inputCls}
                      value={draft.successIndicator}
                      onChange={(e) => set("successIndicator", e.target.value)}
                    />
                  </Field>
                  <Field label="Próximo hito" full>
                    <input
                      className={inputCls}
                      value={draft.nextMilestone}
                      onChange={(e) => set("nextMilestone", e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </>
          )}

          {!isNew && (
            <>
              <div>
                <SectionTitle icon={MessageSquare} count={(liveTask.comments || []).length}>
                  Comentarios
                </SectionTitle>
                <div className="space-y-1.5 mb-2 max-h-44 overflow-y-auto">
                  {(liveTask.comments || []).length === 0 && (
                    <p className={`text-xs ${c.textFaint}`}>Sin comentarios aún.</p>
                  )}
                  {(liveTask.comments || []).map((cm) => (
                    <div
                      key={cm.id}
                      className={`rounded-md p-2 ${dark ? "bg-slate-800" : "bg-slate-50"}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`text-xs font-semibold ${
                            dark ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          {cm.user}
                        </span>
                        <span className={`text-xs ${c.textFaint}`}>{fmtDateTime(cm.date)}</span>
                      </div>
                      <p className={`text-xs ${c.textDim}`}>{cm.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    className={inputCls}
                    placeholder={`Comentar como ${(currentUser?.name || "Equipo").split(" ")[0]}… @mencionar`}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && commentText.trim()) {
                        onAddComment(liveTask.id, commentText);
                        setCommentText("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (commentText.trim()) {
                        onAddComment(liveTask.id, commentText);
                        setCommentText("");
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-md text-xs font-medium shrink-0 gradient-button text-white"
                  >
                    Enviar
                  </button>
                </div>
              </div>

              <div>
                <SectionTitle icon={History} count={history.length}>
                  Historial
                </SectionTitle>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {[...history].reverse().map((h) => (
                    <p key={h.id} className={`text-xs ${c.textDim}`}>
                      <span className={`font-medium ${dark ? "text-slate-300" : "text-slate-700"}`}>
                        {h.user}
                      </span>{" "}
                      {h.field === "creación" ? (
                        h.to
                      ) : (
                        <>
                          cambió {h.field} de <span className="font-mono">{h.from}</span> a{" "}
                          <span className="font-mono">{h.to}</span>
                        </>
                      )}
                      <span className={c.textFaint}> · {fmtDateTime(h.date)}</span>
                    </p>
                  ))}
                </div>
              </div>
              <p className={`text-xs ${c.textFaint}`}>
                Actualizado {fmtDateTime(liveTask.updatedAt)} por {liveTask.updatedBy}
              </p>
            </>
          )}
        </div>

        <div className={`p-3 border-t flex items-center justify-between shrink-0 ${c.panelBorder} ${c.panel}`}>
          {!isNew ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500">¿Eliminar definitivamente?</span>
                <button
                  onClick={() => onDelete(draft.id)}
                  className="text-xs font-medium bg-red-600 text-white px-2 py-1 rounded"
                >
                  Sí, eliminar
                </button>
                <button onClick={() => setConfirmDelete(false)} className={`text-xs ${c.textFaint}`}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 text-xs text-red-500 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            )
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${c.textFaint} hover:bg-muted`}
            >
              Cancelar
            </button>
            <button
              disabled={!canSave}
              onClick={() => {
                const finalDraft = {
                  ...draft,
                  assignee: draft.assignee || currentUser?.id || "cristobal_abarca",
                };
                onSave(isNew ? finalDraft : diffTask(baseline.current, finalDraft));
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md text-white transition-colors ${
                canSave
                  ? "gradient-button"
                  : "bg-slate-400 opacity-50 cursor-not-allowed"
              }`}
            >
              {isNew ? "Crear tarea" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
