// OPFA-specific presentational pieces. Anything general enough for a second
// product belongs in components/, not here.
import { C, R, I, Card } from "../components/index.js";
import { Info20Regular } from "@fluentui/react-icons";
import { OPFA } from "./brand.jsx";
import {
  maskId, maskMsisdn, maskEmail, caseStyle, convoStyle, consentStyle,
  templateStyle, severityStyle, confidenceStyle,
} from "./helpers.js";

// A pill carrying a status and its palette. One component rather than six,
// because the styling functions already differ only in their lookup table.
const PALETTES = {
  case: caseStyle, convo: convoStyle, consent: consentStyle,
  template: templateStyle, severity: severityStyle, confidence: confidenceStyle,
};

export function StatusPill({ kind = "case", value, label, size = "md", style = {} }) {
  const st = (PALETTES[kind] || caseStyle)(value) || {};
  const sz = size === "sm"
    ? { fontSize: 10, padding: "1px 7px" }
    : { fontSize: 11, padding: "3px 9px" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      borderRadius: R.pill, fontWeight: 700, whiteSpace: "nowrap",
      background: st.bg, color: st.fg, ...sz, ...style,
    }}>
      {label ?? st.label ?? value}
    </span>
  );
}

// Masked personal data with a deliberate reveal. Masking that cannot be
// lifted just gets worked around; masking that logs the reveal is a control.
export function Pii({ value, kind = "text", revealed, onReveal, canReveal = true }) {
  const masked = kind === "id" ? maskId(value)
    : kind === "msisdn" ? maskMsisdn(value)
    : kind === "email" ? maskEmail(value)
    : value;
  if (revealed) {
    return <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>;
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{masked}</span>
      {canReveal && onReveal && (
        <button
          onClick={onReveal}
          title="Reveal — this action is recorded in the audit trail"
          style={{
            background: "transparent", border: `1px solid ${C.hairline}`, borderRadius: 3,
            padding: "0 5px", fontSize: 9.5, fontWeight: 700, color: C.muted,
            cursor: "pointer", fontFamily: "inherit", lineHeight: "16px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = OPFA.navy)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.hairline)}
        >reveal</button>
      )}
    </span>
  );
}

// Label/value row for context panels and record drawers.
export function Row({ label, children, width = 116 }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "5px 0", minWidth: 0, alignItems: "baseline" }}>
      <span style={{ width, flexShrink: 0, fontSize: 11, color: C.faint, fontWeight: 600 }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: C.ink, wordBreak: "break-word" }}>{children}</span>
    </div>
  );
}

// Section heading inside a scrolling panel.
export function SectionLabel({ children, right }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      fontSize: 10, fontWeight: 700, color: C.faint,
      textTransform: "uppercase", letterSpacing: "0.7px",
      margin: "16px 0 6px",
    }}>
      <span>{children}</span>
      {right}
    </div>
  );
}

// An explanatory strip. Used where a screen would otherwise assert a policy
// without saying where it comes from.
export function Note({ children, tone = "info", icon = Info20Regular }) {
  const t = {
    info: { bg: C.brandTintSoft, fg: C.info, border: "#bfe0f5" },
    warn: { bg: C.warningBg, fg: C.warning, border: "#f2e2a8" },
    danger: { bg: C.dangerBg, fg: C.danger, border: "#f3ccd0" },
    ok: { bg: C.successBg, fg: C.success, border: "#bfe5bd" },
  }[tone];
  return (
    <div style={{
      display: "flex", gap: 9, alignItems: "flex-start",
      background: t.bg, border: `1px solid ${t.border}`, borderRadius: 6,
      padding: "9px 12px", fontSize: 11.5, lineHeight: 1.5, color: C.text,
    }}>
      <I as={icon} size={14} color={t.fg} style={{ marginTop: 1 }} />
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

// Honest placeholder for a view that is scheduled but not yet built. Better
// than an empty page: it says what will be here and which requirement it
// answers, so a walkthrough never hits a dead screen with no explanation.
export function ComingNext({ title, clause, bullets = [] }) {
  return (
    <div style={{ padding: 20, overflow: "auto" }}>
      <Card title={title} subtitle={clause ? `Bid requirement ${clause}` : undefined}>
        <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, marginBottom: bullets.length ? 12 : 0 }}>
          This view is part of the next build increment.
        </div>
        {bullets.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: C.text, lineHeight: 1.75 }}>
            {bullets.map((b) => <li key={b}>{b}</li>)}
          </ul>
        )}
      </Card>
    </div>
  );
}
