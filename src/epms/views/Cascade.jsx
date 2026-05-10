// Cascade view — IDP → Top-Layer SDBIP → Departmental SDBIP → Manager KPI →
// Operational target. The demo script's "biggest moment": click a debtor
// reduction target, see the political mandate cascade all the way down to
// the clerk on the phone today. Each step shows the responsible person,
// the specific commitment, signed status, and POE count.

import {
  Dismiss20Regular, ChevronDown20Regular, Flag20Regular,
  ContactCard20Regular, DataHistogram20Regular, Document20Regular,
  CheckmarkCircle20Filled, ShieldLock20Regular, ArrowDownload20Regular,
} from "@fluentui/react-icons";
import { I, C, Btn, Pill } from "../../components/index.js";
import { Avatar } from "../Avatar.jsx";
import { userById } from "../data.js";

function Step({ n, step, isLast }) {
  const u = userById(step.userId);
  return (
    <div style={{ position: "relative" }}>
      {/* Connector line */}
      {!isLast && (
        <div style={{
          position: "absolute", left: 26, top: 56, bottom: -18,
          width: 2, background: `linear-gradient(180deg,${step.color},${C.hairlineSoft})`,
        }}/>
      )}
      <div className="fade-up" style={{
        animationDelay: `${n * 0.08}s`,
        background: "#fff", border: `1px solid ${step.color}33`,
        borderLeft: `4px solid ${step.color}`,
        borderRadius: 4, padding: "16px 18px", marginBottom: 18,
        position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: step.color, color: "#fff",
            display: "grid", placeItems: "center",
            fontSize: 16, fontWeight: 700, flexShrink: 0,
            border: "3px solid #fff", boxShadow: `0 0 0 1px ${step.color}40`,
          }}>{n}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: step.color,
                textTransform: "uppercase", letterSpacing: "0.5px",
              }}>{step.tier}</span>
              <span style={{ color: C.faint, fontSize: 10 }}>·</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>{step.ref}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, lineHeight: 1.35, marginBottom: 6 }}>
              {step.commitment}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar userId={step.userId} size={22}/>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{u.name}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{u.role}</div>
                </div>
              </div>
              <span style={{ color: C.faint, fontSize: 10 }}>·</span>
              <Pill bg={C.successBg} fg={C.success}>
                <I as={CheckmarkCircle20Filled} size={11}/> Signed {step.signedDate}
              </Pill>
              <Pill bg={C.brandTint} fg={C.brand} uppercase={false}>
                {step.evidence} POE
              </Pill>
            </div>
            {step.metric && (
              <div style={{
                marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.surfaceMute}`,
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 8, fontSize: 11,
              }}>
                <div>
                  <div style={{ color: C.muted, fontWeight: 600, fontSize: 10,
                                textTransform: "uppercase", letterSpacing: "0.4px" }}>Target</div>
                  <div style={{ color: C.text, fontWeight: 700, marginTop: 2 }}>{step.metric.target}</div>
                </div>
                <div>
                  <div style={{ color: C.muted, fontWeight: 600, fontSize: 10,
                                textTransform: "uppercase", letterSpacing: "0.4px" }}>Actual</div>
                  <div style={{ color: step.metric.fg || C.text, fontWeight: 700, marginTop: 2 }}>
                    {step.metric.actual}
                  </div>
                </div>
                <div>
                  <div style={{ color: C.muted, fontWeight: 600, fontSize: 10,
                                textTransform: "uppercase", letterSpacing: "0.4px" }}>Status</div>
                  <div style={{ color: step.metric.fg || C.text, fontWeight: 700, marginTop: 2 }}>
                    {step.metric.status}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Down chevron between steps */}
      {!isLast && (
        <div style={{
          position: "absolute", left: 22, top: 76, zIndex: 2,
          background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: "50%",
          width: 18, height: 18, display: "grid", placeItems: "center",
          color: C.muted,
        }}>
          <I as={ChevronDown20Regular} size={11}/>
        </div>
      )}
    </div>
  );
}

// Build the cascade for the debtor-reduction target. Each step is grounded in
// real seed data so the demo reads as if pulled from a live system.
export function debtorCascade() {
  return {
    headline: "Reduce outstanding consumer debt — R 487m → R 412m",
    subtitle: "Performance cascade · IDP → Top-Layer → Departmental → Manager → Operational",
    accent: "#a4262c",
    steps: [
      {
        tier: "1 · IDP Strategic Objective", ref: "SO 3.1 · KPA 3 Financial Viability",
        userId: "u_mayor", color: "#a4262c", signedDate: "2025-05-29",
        commitment: "Reduce outstanding consumer debt to ≤ R350m by FY2026/27 (5-year IDP commitment).",
        evidence: 4,
        metric: { target: "R350m by 2027", actual: "R487m baseline (2022)", status: "Behind", fg: C.danger },
      },
      {
        tier: "2 · Top-Layer SDBIP", ref: "SD-T-005 (signed by Mayor)",
        userId: "u_mm", color: "#1D4FD7", signedDate: "2026-08-25",
        commitment: "Drive municipality-wide debt reduction to R412m by 30 Jun 2027 (Q1–Q4 cascade).",
        evidence: 6,
        metric: { target: "R412m", actual: "R471m YTD", status: "At risk", fg: C.warning },
      },
      {
        tier: "3 · Departmental SDBIP / Section 56 PA", ref: "PA · A Nzimande (CFO)",
        userId: "u_cfo", color: "#107c10", signedDate: "2026-08-28",
        commitment: "Recover R75m in outstanding debt across 4 revenue clusters in FY2026/27.",
        evidence: 7,
        metric: { target: "R75m", actual: "R28m YTD", status: "Behind", fg: C.danger },
      },
      {
        tier: "4 · Section 57 Manager KPI", ref: "PA · Tshepiso Mathebula (Revenue Manager)",
        userId: "u_revmgr", color: "#8764b8", signedDate: "2026-09-12",
        commitment: "Recover R75m across 4 revenue clusters · supervise 6 Debt Collection Clerks.",
        evidence: 9,
        metric: { target: "R75m / 4 clusters", actual: "R28m / 4", status: "Behind — capped", fg: C.warning },
      },
      {
        tier: "5 · Operational KPI (Daily targets)", ref: "PA · Lebogang Mokoena (Debt Collection Clerk)",
        userId: "u_clerk", color: "#219CD6", signedDate: "2026-07-04",
        commitment: "Reduce assigned debtor book from R18.4m to R14.2m · 50 customer contacts/wk · 100% POE.",
        evidence: 14,
        metric: { target: "R14.2m / 50 calls", actual: "R15.8m / 47 calls", status: "On track", fg: C.success },
      },
    ],
  };
}

export function CascadeView({ cascade, onClose }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
                  background: C.surfaceAlt }}>
      <div style={{
        padding: "18px 22px", background: "#fff",
        borderBottom: `1px solid ${C.hairline}`,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: cascade.accent, letterSpacing: "0.5px",
                          textTransform: "uppercase", marginBottom: 4 }}>Performance Cascade</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{cascade.headline}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{cascade.subtitle}</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted,
            display: "inline-flex", padding: 2,
          }}><I as={Dismiss20Regular} size={18}/></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <Pill bg={C.brandTint} fg={C.brand} uppercase={false}>5 levels of accountability</Pill>
          <Pill bg={C.successBg} fg={C.success} uppercase={false}>All steps signed</Pill>
          <Pill bg={C.brandTint} fg={C.brand} uppercase={false}>
            {cascade.steps.reduce((a, s) => a + s.evidence, 0)} POE attached
          </Pill>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "22px 22px 32px 22px" }}>
        {cascade.steps.map((s, i) => (
          <Step key={s.ref} n={i + 1} step={s} isLast={i === cascade.steps.length - 1}/>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          <Btn variant="secondary" size="sm" onClick={() => {}}>
            <I as={ShieldLock20Regular} size={13}/> Open AGSA pack
          </Btn>
          <Btn variant="ghost" size="sm" onClick={() => {}}>
            <I as={ArrowDownload20Regular} size={13}/> Export cascade (PDF)
          </Btn>
        </div>
      </div>
    </div>
  );
}
