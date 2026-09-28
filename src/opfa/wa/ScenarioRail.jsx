// The demo rig's control rail.
//
// This is deliberately not part of the product — it is the operator's console
// for driving a demonstration. It exists because three things a WhatsApp
// solution must get right are invisible on a happy path: consent state, the
// 24-hour service window, and what happens when the user does something
// unexpected. The rail makes each of them one click away.
import { useState } from "react";
import {
  Person20Regular, Play20Regular, Wrench20Regular, Clock20Regular,
  ArrowClockwise20Regular, Eye20Regular, EyeOff20Regular, ChevronDown20Regular,
} from "@fluentui/react-icons";
import { C, I } from "../../components/index.js";
import { OPFA } from "../brand.jsx";
import {
  useOpfa, setPersona, advanceClock, resetDemo, now, conversationFor, activePersona,
} from "../store.js";
import { consentStyle, countdown, maskMsisdn } from "../helpers.js";

// Jump straight to a journey rather than typing your way there. Each entry is
// the free text a complainant might actually send, so the NLU tier is
// exercised on the way in rather than bypassed.
export const SCENARIOS = [
  { id: "track", label: "Track a complaint", text: "where is my complaint" },
  { id: "lodge", label: "Lodge a complaint", text: "I want to lodge a new complaint" },
  { id: "profile", label: "Update my cellphone", text: "I need to change my cellphone number" },
  { id: "upload", label: "Send a document", text: "I want to send my payslip" },
  { id: "download", label: "Get my determination", text: "can I get a copy of the determination" },
  { id: "settle", label: "Confirm settlement", text: "the fund has paid me" },
  { id: "faq", label: "Ask a question", text: "how long does a complaint take" },
  { id: "agent", label: "Talk to a consultant", text: "I want to speak to a person" },
];

// The failure modes an evaluation panel will look for. Better to show them
// deliberately than to be shown them.
export const BREAKERS = [
  { id: "bad_menu", label: "Invalid menu selection", text: "42" },
  { id: "bad_ref", label: "Malformed case reference", text: "PFA/GP/482/26" },
  { id: "missing_ref", label: "Reference that does not exist", text: "PFA/GP/99999/2026/ZZ" },
  { id: "gibberish", label: "Unrecognisable message", text: "asdkjhf qwerty zzz" },
  { id: "empty_search", label: "Search with no criteria", text: "search" },
];

function RailSection({ icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${C.hairline}` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "inherit", padding: "11px 14px", display: "flex",
          alignItems: "center", gap: 8, textAlign: "left",
        }}
      >
        <I as={icon} size={14} color={C.muted} />
        <span style={{
          flex: 1, fontSize: 10, fontWeight: 700, color: C.faint,
          textTransform: "uppercase", letterSpacing: "0.7px",
        }}>{title}</span>
        <I as={ChevronDown20Regular} size={12} color={C.faint}
           style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform 0.15s" }} />
      </button>
      {open && <div style={{ padding: "0 10px 12px" }}>{children}</div>}
    </div>
  );
}

function RailButton({ children, onClick, tone = "default", disabled }) {
  const fg = tone === "danger" ? C.danger : tone === "warn" ? C.warning : C.text;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", textAlign: "left", background: "#fff",
        border: `1px solid ${C.hairline}`, borderRadius: 4,
        padding: "7px 10px", marginBottom: 4, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", fontSize: 11.5, color: fg, fontWeight: 600,
        opacity: disabled ? 0.45 : 1, transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = OPFA.blue; e.currentTarget.style.background = "#fafcff"; } }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.hairline; e.currentTarget.style.background = "#fff"; }}
    >{children}</button>
  );
}

export function ScenarioRail({ onSend, nluOverlay, setNluOverlay, busy }) {
  const s = useOpfa();
  const persona = activePersona(s);
  const conv = conversationFor(s, persona.id);
  const t = now();
  const windowLeft = conv ? conv.windowExpiresAt - t : 0;
  const cs = consentStyle(persona.consent.status);

  return (
    <aside style={{
      width: 248, flexShrink: 0, background: C.surfaceAlt,
      borderRight: `1px solid ${C.hairline}`,
      display: "flex", flexDirection: "column", overflowY: "auto", minHeight: 0,
    }}>
      <RailSection icon={Person20Regular} title="Handset">
        {s.personas.map((p) => {
          const on = p.id === persona.id;
          return (
            <button
              key={p.id}
              onClick={() => setPersona(p.id)}
              style={{
                width: "100%", textAlign: "left", marginBottom: 5,
                background: on ? "#fff" : "transparent",
                border: `1px solid ${on ? OPFA.navy : C.hairline}`,
                borderRadius: 5, padding: "8px 10px", cursor: "pointer", fontFamily: "inherit",
                boxShadow: on ? "0 1px 4px rgba(0,0,0,0.07)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: on ? OPFA.navy : C.ink }}>{p.name}</span>
                <span style={{
                  marginLeft: "auto", fontSize: 8.5, fontWeight: 700, borderRadius: 100,
                  padding: "1px 6px", background: consentStyle(p.consent.status).bg,
                  color: consentStyle(p.consent.status).fg, whiteSpace: "nowrap",
                }}>{consentStyle(p.consent.status).label}</span>
              </div>
              <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>{maskMsisdn(p.msisdn)}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>{p.note}</div>
            </button>
          );
        })}
      </RailSection>

      {/* Channel state, so the person driving the demo always knows which
          policy rules are currently in force. */}
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.hairline}`, background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 10.5, color: C.faint, fontWeight: 600 }}>Service window</span>
          <span style={{
            fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums",
            color: windowLeft > 0 ? C.success : C.danger,
          }}>{countdown(windowLeft)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 10.5, color: C.faint, fontWeight: 600 }}>Consent</span>
          <span style={{
            fontSize: 10, fontWeight: 700, borderRadius: 100, padding: "1px 7px",
            background: cs.bg, color: cs.fg,
          }}>{cs.label}</span>
        </div>
      </div>

      <RailSection icon={Play20Regular} title="Jump to scenario">
        {SCENARIOS.map((sc) => (
          <RailButton key={sc.id} onClick={() => onSend(sc.text)} disabled={busy}>
            {sc.label}
          </RailButton>
        ))}
      </RailSection>

      <RailSection icon={Wrench20Regular} title="Break it" defaultOpen={false}>
        <div style={{ fontSize: 10, color: C.faint, lineHeight: 1.5, marginBottom: 7 }}>
          Exception handling required by 6.1.5 — each of these produces a clear
          message and a way forward, never a dead end.
        </div>
        {BREAKERS.map((b) => (
          <RailButton key={b.id} tone="warn" onClick={() => onSend(b.text)} disabled={busy}>
            {b.label}
          </RailButton>
        ))}
      </RailSection>

      <RailSection icon={Clock20Regular} title="Demo controls">
        <RailButton onClick={() => setNluOverlay(!nluOverlay)}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <I as={nluOverlay ? Eye20Regular : EyeOff20Regular} size={13} color={nluOverlay ? OPFA.blue : C.faint} />
            NLU overlay {nluOverlay ? "on" : "off"}
          </span>
        </RailButton>
        <RailButton onClick={() => advanceClock(24)}>
          Advance clock +24 hours
        </RailButton>
        <RailButton tone="danger" onClick={resetDemo}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <I as={ArrowClockwise20Regular} size={13} color={C.danger} />
            Reset demo
          </span>
        </RailButton>
        <div style={{ fontSize: 10, color: C.faint, lineHeight: 1.5, marginTop: 6 }}>
          Advancing the clock closes the 24-hour service window, so the console
          must fall back to an approved template. Reset returns both tabs to the
          seeded state.
        </div>
      </RailSection>
    </aside>
  );
}
