import { useEffect, useRef } from "react";
import { Dismiss20Regular, ChevronLeft20Regular, ChevronRight20Regular } from "@fluentui/react-icons";
import { I } from "./Icon.jsx";
import { C, SHADOW } from "./tokens.js";

// ─── Modal (centered, scrim backdrop) ─────────────────────────────────────────
export function Modal({ title, onClose, children, width = 480, footer }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)",
      display: "grid", placeItems: "center", zIndex: 4000,
    }} onClick={onClose}>
      <div className="scale-in" onClick={e => e.stopPropagation()} style={{
        width, maxWidth: "95vw", maxHeight: "90vh",
        background: "#fff", borderRadius: 4, boxShadow: SHADOW.xl,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{title}</span>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.muted, padding: "2px 4px", display: "inline-flex", alignItems: "center",
          }}>
            <I as={Dismiss20Regular} size={18}/>
          </button>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>{children}</div>
        {footer && (
          <div style={{
            padding: "12px 20px", borderTop: "1px solid rgba(0,0,0,0.08)",
            display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0,
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

// ─── Drawer (Fluent 2 slide-over from the right) ──────────────────────────────
export function Drawer({ onClose, width = 620, children, onPrev, onNext }) {
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose, onPrev, onNext]);
  const hasNav = onPrev || onNext;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 4500 }}>
      <div onClick={onClose} style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.32)", backdropFilter: "blur(2px)",
      }}/>
      <div className="slide-left" style={{
        position: "absolute", right: 0, top: 0, bottom: 0,
        width, maxWidth: "45vw", background: "#fff",
        boxShadow: SHADOW.drawer,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {hasNav && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 12px", borderBottom: `1px solid ${C.hairline}`,
            background: C.surfaceAlt, flexShrink: 0,
          }}>
            <button disabled={!onPrev} onClick={onPrev} style={{
              background: "none", border: "none", cursor: onPrev ? "pointer" : "not-allowed",
              color: onPrev ? C.text : C.faint, display: "inline-flex", alignItems: "center",
              gap: 4, fontSize: 11, fontWeight: 600, fontFamily: "inherit", padding: "4px 8px",
              borderRadius: 4, opacity: onPrev ? 1 : 0.4,
            }}><I as={ChevronLeft20Regular} size={14}/> Prev</button>
            <span style={{ fontSize: 10, color: C.faint }}>← →</span>
            <button disabled={!onNext} onClick={onNext} style={{
              background: "none", border: "none", cursor: onNext ? "pointer" : "not-allowed",
              color: onNext ? C.text : C.faint, display: "inline-flex", alignItems: "center",
              gap: 4, fontSize: 11, fontWeight: 600, fontFamily: "inherit", padding: "4px 8px",
              borderRadius: 4, opacity: onNext ? 1 : 0.4,
            }}>Next <I as={ChevronRight20Regular} size={14}/></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── FormDrawer (Drawer with Modal-style header/body/footer chrome) ───────────
// Use for quick-create forms — gives a side-panel popover with a sticky action
// footer and a consistent close button.
export function FormDrawer({ title, onClose, children, width = 520, footer }) {
  return (
    <Drawer onClose={onClose} width={width}>
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{title}</span>
        <button onClick={onClose} style={{
          background: "none", border: "none", cursor: "pointer",
          color: C.muted, padding: "2px 4px", display: "inline-flex", alignItems: "center",
        }}>
          <I as={Dismiss20Regular} size={18}/>
        </button>
      </div>
      <div style={{ overflow: "auto", flex: 1 }}>{children}</div>
      {footer && (
        <div style={{
          padding: "12px 20px", borderTop: "1px solid rgba(0,0,0,0.08)",
          display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0,
        }}>{footer}</div>
      )}
    </Drawer>
  );
}

// ─── ContextMenu (right-click style menu) ─────────────────────────────────────
export function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="scale-in" style={{
      position: "fixed", left: x, top: y,
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(0,0,0,0.1)", borderRadius: 4,
      boxShadow: SHADOW.md, zIndex: 5000, minWidth: 200, padding: 4, overflow: "hidden",
    }}>
      {items.map((item, i) => item.divider ? (
        <div key={i} style={{ height: 1, background: "rgba(0,0,0,0.07)", margin: "4px 0" }}/>
      ) : (
        <div key={i} onClick={() => { item.action(); onClose(); }} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 12px", cursor: "pointer", borderRadius: 4,
          fontSize: 13, color: item.danger ? C.danger : C.text,
          transition: "background 0.1s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = item.danger ? C.dangerBg : C.surfaceMute}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <span style={{ width: 16, textAlign: "center" }}>{item.icon}</span>{item.label}
        </div>
      ))}
    </div>
  );
}

// ─── ColumnFilterPopover (used by DataTable) ──────────────────────────────────
export function ColumnFilterPopover({ options, selected, onToggle, onClose, onClear }) {
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="scale-in" style={{
      position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 180,
      background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 4,
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 50,
      padding: 6, maxHeight: 280, overflow: "auto",
    }}>
      {options.length === 0 && (
        <div style={{ padding: "8px 10px", fontSize: 11, color: C.faint }}>No values</div>
      )}
      {options.map(v => (
        <label key={String(v)} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "5px 8px", cursor: "pointer", fontSize: 12, color: C.ink, borderRadius: 2,
        }}
        onMouseEnter={e => e.currentTarget.style.background = C.surfaceMute}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <input type="checkbox" checked={selected.has(v)} onChange={() => onToggle(v)}
                 style={{ margin: 0, cursor: "pointer" }}/>
          <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {String(v)}
          </span>
        </label>
      ))}
      {selected.size > 0 && (
        <div style={{ padding: "4px 6px", borderTop: `1px solid ${C.hairline}`, marginTop: 4 }}>
          <button onClick={onClear} style={{
            background: "none", border: "none", color: C.brand,
            fontSize: 11, cursor: "pointer", fontFamily: "inherit", padding: "2px 4px",
          }}>Clear</button>
        </div>
      )}
    </div>
  );
}
