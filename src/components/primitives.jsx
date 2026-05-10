import { useState, useRef, useEffect } from "react";
import { ChevronDown20Regular, Checkmark20Regular, Dismiss20Regular } from "@fluentui/react-icons";
import { I } from "./Icon.jsx";
import { C } from "./tokens.js";

// ─── Avatar ───────────────────────────────────────────────────────────────────
// Generic — pass initials & color directly. Apps can wrap this with their own
// user-lookup helper (e.g. Avatar({userId}) → AvatarChip(initials,color)).
export function AvatarChip({ initials = "??", color = C.brand, size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: color,
      display: "grid", placeItems: "center", color: "#fff",
      fontSize: Math.max(9, size * 0.35), fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ count, color = C.brand }) {
  if (!count) return null;
  return (
    <div style={{
      minWidth: 16, height: 16, background: color, color: "#fff",
      borderRadius: 100, fontSize: 10, fontWeight: 700,
      display: "grid", placeItems: "center", padding: "0 4px",
    }}>{count}</div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 14, color = "currentColor" }) {
  return (
    <span style={{ display: "inline-flex", flexShrink: 0 }}>
      <span style={{
        width: size, height: size, borderRadius: "50%",
        border: `2px solid ${color}33`, borderTopColor: color,
        animation: "spin 0.7s linear infinite",
        display: "inline-block", boxSizing: "border-box",
      }}/>
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ w = "100%", h = 14, r = 4, style = {} }) {
  return <div className="shimmer" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ my = 16 }) {
  return <div style={{ height: 1, background: "rgba(0,0,0,0.07)", margin: `${my}px 0` }} />;
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, variant = "primary", size = "md", onClick, disabled, loading, style = {}, type = "button" }) {
  const isDisabled = disabled || loading;
  const base = {
    border: "none", borderRadius: 4,
    cursor: isDisabled ? "not-allowed" : "pointer",
    fontWeight: 600, fontFamily: "inherit",
    transition: "all 0.15s", opacity: isDisabled ? 0.5 : 1,
    whiteSpace: "nowrap", display: "inline-flex",
    alignItems: "center", justifyContent: "center",
    gap: 6, flexShrink: 0, ...style,
  };
  const sz = {
    sm: { fontSize: 11, padding: "4px 10px" },
    md: { fontSize: 13, padding: "7px 14px" },
    lg: { fontSize: 14, padding: "9px 18px" },
  }[size];
  const v = {
    primary: { background: C.brand, color: "#fff" },
    secondary: { background: C.surfaceMute, color: C.text },
    danger: { background: C.danger, color: "#fff" },
    success: { background: C.success, color: "#fff" },
    ghost: { background: "transparent", color: C.brand, border: `1px solid ${C.brand}` },
  }[variant];
  return (
    <button type={type} onClick={isDisabled ? undefined : onClick} style={{ ...base, ...sz, ...v }}>
      {loading ? (
        <>
          <Spinner size={size === "sm" ? 11 : 13}
                   color={["primary", "danger", "success"].includes(variant) ? "#fff" : C.info} />
          {typeof children === "string" ? children : null}
        </>
      ) : children}
    </button>
  );
}

// ─── FluentSelect ─────────────────────────────────────────────────────────────
export function FluentSelect({ value, onChange, options, placeholder, size = "md", direction = "down", disabled, style = {} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open]);
  const norm = options.map(o => (typeof o === "string" || typeof o === "number") ? { value: o, label: String(o) } : o);
  const current = norm.find(o => String(o.value) === String(value));
  const sz = size === "sm"
    ? { fontSize: 12, padding: "4px 8px", minHeight: 26 }
    : { fontSize: 13, padding: "7px 10px", minHeight: 32 };
  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <button type="button" onClick={() => !disabled && setOpen(o => !o)} disabled={disabled} style={{
        ...sz, width: "100%",
        border: `1px solid ${open ? C.brand : C.hairline}`, borderRadius: 4,
        background: disabled ? C.surfaceMute : "#fff", color: C.ink,
        fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 6, whiteSpace: "nowrap", textAlign: "left",
        opacity: disabled ? 0.6 : 1, transition: "border-color 0.15s", boxSizing: "border-box",
      }}>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis",
                       color: current ? C.ink : C.faint }}>
          {current ? current.label : (placeholder || "Select…")}
        </span>
        <span style={{ display: "inline-flex", color: C.muted,
                       transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <I as={ChevronDown20Regular} size={14}/>
        </span>
      </button>
      {open && (
        <div className="scale-in" style={{
          position: "absolute",
          [direction === "up" ? "bottom" : "top"]: "calc(100% + 4px)",
          left: 0, right: 0, minWidth: "100%",
          background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 4,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 5000,
          padding: 4, maxHeight: 260, overflow: "auto",
        }}>
          {norm.length === 0 && <div style={{ padding: "8px 10px", fontSize: 12, color: C.faint }}>No options</div>}
          {norm.map(o => {
            const sel = String(o.value) === String(value);
            return (
              <div key={String(o.value)}
                   onClick={() => { onChange && onChange({ target: { value: o.value } }); setOpen(false); }}
                   style={{
                     display: "flex", alignItems: "center", gap: 6,
                     padding: "6px 10px", cursor: "pointer", fontSize: 12,
                     color: sel ? C.brand : C.ink, fontWeight: sel ? 600 : 400,
                     background: sel ? C.brandTint : "transparent", borderRadius: 2,
                   }}
                   onMouseEnter={e => { if (!sel) e.currentTarget.style.background = C.surfaceMute; }}
                   onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ width: 14, display: "inline-flex" }}>
                  {sel && <I as={Checkmark20Regular} size={12}/>}
                </span>
                <span style={{ flex: 1 }}>{o.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Input + Select (labelled wrappers) ───────────────────────────────────────
export function Input({ label, value, onChange, placeholder, type = "text", style = {} }) {
  return (
    <div style={{ marginBottom: 12, ...style }}>
      {label && (
        <div style={{
          fontSize: 11, fontWeight: 600, color: C.muted,
          marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px",
        }}>{label}</div>
      )}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
             style={{
               width: "100%", padding: "8px 10px",
               border: `1px solid ${C.hairlineSoft}`, borderRadius: 4,
               fontSize: 13, background: C.surfaceAlt, color: C.text,
               transition: "border-color 0.15s",
             }}
             onFocus={e => e.target.style.borderColor = C.brand}
             onBlur={e => e.target.style.borderColor = C.hairlineSoft}/>
    </div>
  );
}

export function Select({ label, value, onChange, options, placeholder, style = {} }) {
  return (
    <div style={{ marginBottom: 12, ...style }}>
      {label && (
        <div style={{
          fontSize: 11, fontWeight: 600, color: C.muted,
          marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px",
        }}>{label}</div>
      )}
      <FluentSelect value={value} onChange={onChange} options={options} placeholder={placeholder}/>
    </div>
  );
}

// ─── Tag (removable chip) ─────────────────────────────────────────────────────
export function Tag({ label, onRemove, color = C.brand }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: `${color}18`, color, borderRadius: 100,
      fontSize: 11, fontWeight: 600, padding: "2px 8px",
      marginRight: 4, marginBottom: 4,
    }}>
      #{label}
      {onRemove && (
        <span onClick={onRemove} style={{ cursor: "pointer", opacity: 0.7,
                                          display: "inline-flex", alignItems: "center" }}>
          <I as={Dismiss20Regular} size={11}/>
        </span>
      )}
    </span>
  );
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
// Status pill used widely. fg = text color, bg = background.
export function Pill({ children, fg = C.text, bg = "#f3f3f3", uppercase = true, weight = 700, style = {} }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: weight, padding: "3px 10px",
      borderRadius: 100, background: bg, color: fg,
      textTransform: uppercase ? "uppercase" : "none",
      letterSpacing: uppercase ? "0.5px" : "normal",
      whiteSpace: "nowrap", ...style,
    }}>{children}</span>
  );
}
