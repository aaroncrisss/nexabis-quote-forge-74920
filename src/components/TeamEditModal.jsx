import { useState, useEffect } from "react";
import { X, MessageSquare } from "lucide-react";
import { useTheme, tokens } from "../lib/theme";
import { computeInitials } from "../lib/team";

export function TeamEditModal({ users, onClose, onSave }) {
  const { dark } = useTheme();
  const c = tokens(dark);
  const [draft, setDraft] = useState(() => users.map((u) => ({ ...u })));
  const setField = (id, field, value) =>
    setDraft((d) => d.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
  const inputCls = `w-full border rounded-md px-2 py-1.5 text-xs outline-none ${c.input}`;
  const canSave = draft.every((u) => u.name.trim().length > 0);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-lg border shadow-2xl overflow-hidden ${c.panel} ${c.panelBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-4 py-3 border-b ${c.panelBorder}`}>
          <h3 className={`text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
            Editar equipo & WhatsApp
          </h3>
          <button onClick={onClose} className={c.textFaint}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div style={{ maxHeight: "70vh" }} className="p-4 space-y-3 overflow-y-auto">
          {draft.map((u) => (
            <div key={u.id} className={`flex items-start gap-2.5 p-2.5 rounded-md border ${c.borderSubtle}`}>
              <div
                className={`w-7 h-7 rounded-full ${u.color} text-white flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5`}
              >
                {computeInitials(u.name)}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <input
                  className={inputCls}
                  value={u.name}
                  onChange={(e) => setField(u.id, "name", e.target.value)}
                  placeholder="Nombre"
                />
                <input
                  className={inputCls}
                  value={u.role}
                  onChange={(e) => setField(u.id, "role", e.target.value)}
                  placeholder="Cargo"
                />
                <input
                  type="email"
                  className={inputCls}
                  value={u.email || ""}
                  onChange={(e) => setField(u.id, "email", e.target.value)}
                  placeholder="Correo de acceso (para vincular su cuenta)"
                />
                <div className="relative">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500 absolute left-2 top-2 pointer-events-none" />
                  <input
                    type="tel"
                    className={`${inputCls} pl-7`}
                    value={u.phone || ""}
                    onChange={(e) => setField(u.id, "phone", e.target.value)}
                    placeholder="WhatsApp (ej: +56986343217) para alertas automáticas"
                  />
                </div>
                <p className={`text-xs ${c.textFaint}`}>
                  {u.userId ? "Cuenta activa" : "Aún no ha iniciado sesión con este correo"}
                </p>
              </div>
            </div>
          ))}
          <p className={`text-xs ${c.textFaint}`}>
            Los integrantes con número de WhatsApp reciben alertas automáticas vía Evolution API (NexabisTech) al asignárseles tareas, P0, rompelíneas o menciones.
          </p>
        </div>
        <div className={`p-3 border-t flex items-center justify-end gap-2 ${c.panelBorder}`}>
          <button
            onClick={onClose}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${c.textFaint} hover:bg-muted`}
          >
            Cancelar
          </button>
          <button
            disabled={!canSave}
            onClick={() => onSave(draft)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md text-white transition-colors ${
              canSave ? "gradient-button" : "bg-slate-400 opacity-50 cursor-not-allowed"
            }`}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
