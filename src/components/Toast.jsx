// Self-contained toast system. Apps wrap their root in <ToastProvider> and
// call useToast() to fire toasts. No global reducer required.
import { createContext, useCallback, useContext, useState } from "react";
import { Dismiss20Regular, Info20Regular } from "@fluentui/react-icons";
import { I } from "./Icon.jsx";
import { C, SHADOW } from "./tokens.js";

const ToastCtx = createContext(null);
let toastCounter = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback(
    (id) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );
  const toast = useCallback((title, msg, opts = {}) => {
    const id = toastCounter++;
    setToasts((t) => [...t, { id, title, msg, ...opts }]);
    setTimeout(() => dismiss(id), opts.durationMs || 4000);
  }, [dismiss]);
  return (
    <ToastCtx.Provider value={{ toast, dismiss, toasts }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx.toast;
}

function Toaster({ toasts, onDismiss }) {
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20,
      display: "flex", flexDirection: "column", gap: 8,
      zIndex: 9999, pointerEvents: "none",
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#fff", border: "1px solid rgba(0,0,0,0.1)",
          borderLeft: `3px solid ${t.color || C.brand}`, borderRadius: 4,
          padding: "11px 14px", boxShadow: SHADOW.md,
          minWidth: 260, maxWidth: 340,
          animation: "toastIn 0.2s ease", pointerEvents: "all",
        }}>
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            {t.icon || <I as={Info20Regular} size={16} color={t.color || C.brand}/>}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.title}</div>
            {t.msg && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{t.msg}</div>}
          </div>
          <button onClick={() => onDismiss(t.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.faint, display: "inline-flex", alignItems: "center",
          }}>
            <I as={Dismiss20Regular} size={14}/>
          </button>
        </div>
      ))}
    </div>
  );
}
