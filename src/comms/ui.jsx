// Small presentational pieces shared by the Connect views.
import { C, SHADOW } from "../components/index.js";

export function Card({ title, subtitle, right, children, pad = 16, style = {} }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 8,
      boxShadow: SHADOW.sm, display: "flex", flexDirection: "column", minWidth: 0, ...style,
    }}>
      {(title || right) && (
        <div style={{
          padding: "12px 16px", borderBottom: `1px solid ${C.hairline}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      <div style={{ padding: pad, minWidth: 0 }}>{children}</div>
    </div>
  );
}

export function Stat({ label, value, sub, tone = C.ink, icon, share, basis = 170 }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 8,
      padding: "14px 16px", boxShadow: SHADOW.sm, minWidth: 0, flex: `1 1 ${basis}px`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        {icon}
        <div style={{
          fontSize: 10.5, fontWeight: 700, color: C.muted,
          textTransform: "uppercase", letterSpacing: "0.6px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{label}</div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: tone, lineHeight: 1.1 }}>{value}</span>
        {share != null && (
          <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{share}</span>
        )}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.faint, marginTop: 3, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  );
}

// Fluent 2 checkbox. The tick is drawn rather than borrowed from the icon set
// so it sits square in the box at every size.
export function Checkbox({ checked, size = 18, onChange, label }) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange ? (e) => { e.stopPropagation(); onChange(!checked); } : undefined}
      style={{
        width: size, height: size, borderRadius: 3, flexShrink: 0,
        border: `1.5px solid ${checked ? C.brand : "#8a8886"}`,
        background: checked ? C.brand : "#fff",
        display: "grid", placeItems: "center",
        cursor: onChange ? "pointer" : "inherit",
        transition: "background 0.12s, border-color 0.12s",
      }}
    >
      <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 12 12" fill="none"
           style={{ display: "block" }} aria-hidden="true">
        <path d="M2.4 6.3 4.7 8.6 9.6 3.6" stroke="#fff" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ opacity: checked ? 1 : 0, transition: "opacity 0.12s" }} />
      </svg>
    </span>
  );
}

// Two-column labelled form, matching the Ezra360 campaign record layout:
// label on the left, control on the right, two pairs per row.
export function FormGrid({ children, columns = 2 }) {
  return (
    <div style={{
      display: "grid", gap: "14px 28px",
      gridTemplateColumns: `repeat(${columns}, minmax(280px, 1fr))`,
    }}>{children}</div>
  );
}

export function Field({ label, required, hint, children, labelWidth = 118 }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
      <label style={{
        width: labelWidth, flexShrink: 0, paddingTop: 7,
        fontSize: 12, color: C.text, lineHeight: 1.3,
      }}>
        {label}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
      </label>
      <div style={{ flex: 1, minWidth: 0 }}>
        {children}
        {hint && (
          <div style={{ fontSize: 10.5, color: C.faint, marginTop: 4, lineHeight: 1.45 }}>{hint}</div>
        )}
      </div>
    </div>
  );
}

// Plain text/date input sized to sit level with FluentSelect.
export function TextField({ value, onChange, placeholder, type = "text", disabled, readOnly }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      style={{
        width: "100%", minHeight: 32, padding: "7px 10px", boxSizing: "border-box",
        border: `1px solid ${C.hairline}`, borderRadius: 4, fontSize: 13,
        background: disabled || readOnly ? C.surfaceMute : "#fff",
        color: disabled ? C.faint : C.ink, fontFamily: "inherit",
        transition: "border-color 0.15s",
      }}
      onFocus={(e) => { if (!disabled && !readOnly) e.target.style.borderColor = C.brand; }}
      onBlur={(e) => (e.target.style.borderColor = C.hairline)}
    />
  );
}

export function StepDots({ step, steps }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === step, done = n < step;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: done ? C.success : active ? C.brand : C.surfaceMute,
                color: done || active ? "#fff" : C.faint,
                display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700,
              }}>{done ? "✓" : n}</div>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 600, color: active ? C.ink : C.muted, whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width: 26, height: 2, background: done ? C.success : C.hairline, borderRadius: 2 }} />}
          </div>
        );
      })}
    </div>
  );
}
