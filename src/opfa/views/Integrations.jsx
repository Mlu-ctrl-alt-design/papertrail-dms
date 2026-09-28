// Integration health and the live wire log (6.1.1).
//
// The bid's integration requirements are the ones a technical panel will push
// hardest on, because they are where a WhatsApp front end either meets the
// Respond case management system properly or fakes it. This view names each
// endpoint, its protocol and its current state, and puts the actual
// request/response traffic next to it.
import { useMemo } from "react";
import { ViewHeader, Card, C, I } from "../../components/index.js";
import { CheckmarkCircle20Filled, Warning20Filled, ErrorCircle20Filled } from "@fluentui/react-icons";
import { OPFA, ORG } from "../brand.jsx";
import { useOpfa, now } from "../store.js";
import { relTime, pct } from "../helpers.js";
import { Row, Note } from "../ui.jsx";
import { WirePanel } from "../wa/WirePanel.jsx";

const HEALTH = {
  healthy: { icon: CheckmarkCircle20Filled, color: C.success, label: "Healthy" },
  degraded: { icon: Warning20Filled, color: C.warning, label: "Degraded" },
  down: { icon: ErrorCircle20Filled, color: C.danger, label: "Unavailable" },
};

export function IntegrationsView() {
  const s = useOpfa();
  const t = now();

  const respond = useMemo(() => s.integrations.find((i) => i.id === "respond"), [s.integrations]);

  return (
    <>
      <ViewHeader
        title="Integrations"
        subtitle="Respond case management, Microsoft 365 identity and the WhatsApp Business Platform"
      />
      <div style={{ flex: 1, overflow: "hidden", display: "flex", minHeight: 0 }}>
        <div style={{ flex: 1, overflow: "auto", padding: 20, minWidth: 0 }}>
          <Note tone="info">
            Every call below is simulated — no credentials are configured and nothing leaves
            the browser. The request and response payloads are built to the real
            <strong> WhatsApp Cloud API v21.0</strong> and <strong>Respond REST/XML</strong> contracts,
            so what the wire log shows is the shape the production integration would carry.
          </Note>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", marginTop: 14 }}>
            {s.integrations.map((it) => {
              const h = HEALTH[it.status] || HEALTH.healthy;
              return (
                <Card
                  key={it.id}
                  title={it.name}
                  subtitle={it.vendor}
                  right={
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: h.color }}>
                      <I as={h.icon} size={14} color={h.color} /> {h.label}
                    </span>
                  }
                >
                  <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.55, marginBottom: 10 }}>{it.note}</div>
                  <Row label="Protocol">{it.protocol}</Row>
                  <Row label="Endpoint">
                    <code style={{ fontSize: 10.5, color: OPFA.navy, wordBreak: "break-all" }}>{it.endpoint}</code>
                  </Row>
                  <Row label="Last call">{relTime(it.lastCallAt, t)}</Row>
                  <Row label="Latency">{it.latencyMs != null ? `${it.latencyMs} ms` : "—"}</Row>
                  <Row label="Success rate">
                    <span style={{ fontWeight: 700, color: it.successRate >= 99 ? C.success : C.warning }}>
                      {it.successRate}%
                    </span>
                  </Row>
                  {it.queued > 0 && (
                    <Row label="Retry queue">
                      <span style={{ color: C.warning, fontWeight: 700 }}>{it.queued} job retrying</span>
                    </Row>
                  )}
                </Card>
              );
            })}
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", marginTop: 12 }}>
            <Card title="Respond case management" subtitle="Web services consumed by the WhatsApp channel">
              <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.6, marginBottom: 10 }}>
                Respond exposes REST endpoints that return and consume XML. The channel uses
                four of them; everything the complainant sees about a case comes from here
                rather than from a copy.
              </div>
              {[
                { m: "GET", p: "/api/v2/cases/{reference}", d: "Retrieve a case and its status history" },
                { m: "GET", p: "/api/v2/cases?idNumber={id}", d: "Search cases by complainant identity" },
                { m: "POST", p: "/api/v2/cases", d: "Create a case from a channel submission" },
                { m: "POST", p: "/api/v2/cases/{reference}/documents", d: "Attach a complainant upload" },
              ].map((e) => (
                <div key={e.p} style={{ display: "flex", gap: 9, alignItems: "baseline", padding: "6px 0", borderBottom: `1px solid ${C.hairline}` }}>
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, borderRadius: 3, padding: "1px 6px", flexShrink: 0,
                    background: e.m === "GET" ? C.brandTintSoft : C.successBg,
                    color: e.m === "GET" ? C.info : C.success,
                  }}>{e.m}</span>
                  <div style={{ minWidth: 0 }}>
                    <code style={{ fontSize: 11, color: OPFA.navy, wordBreak: "break-all" }}>{e.p}</code>
                    <div style={{ fontSize: 10.5, color: C.faint, marginTop: 1 }}>{e.d}</div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 10.5, color: C.faint, marginTop: 10, lineHeight: 1.5 }}>
                Authentication: OAuth 2.0 client credentials over mutual TLS.
                Availability over the last 30 days: {respond ? `${respond.successRate}%` : "—"}.
              </div>
            </Card>

            <Card title="WhatsApp Business Account" subtitle="Meta Cloud API configuration">
              <Row label="Business account">{ORG.waba.id}</Row>
              <Row label="Phone number ID">{ORG.waba.phoneNumberId}</Row>
              <Row label="Display number">{ORG.waba.display}</Row>
              <Row label="Verification">Green tick — verified business, display name approved</Row>
              <Row label="Webhook">
                <code style={{ fontSize: 10.5, color: OPFA.navy, wordBreak: "break-all" }}>
                  https://wa.pfa.org.za/webhook/meta
                </code>
              </Row>
              <Row label="Subscribed fields">messages, message_template_status_update</Row>
              <Row label="Messaging limit">Tier 3 — 100 000 business-initiated conversations / 24h</Row>
              <Row label="Quality rating">
                <span style={{ color: C.success, fontWeight: 700 }}>High</span>
              </Row>
              <Row label="Templates">
                {s.templates.filter((x) => x.status === "APPROVED").length} approved of {s.templates.length}
                {" "}({pct(s.templates.filter((x) => x.status === "APPROVED").length, s.templates.length)}%)
              </Row>
            </Card>
          </div>
        </div>

        <WirePanel variant="console" />
      </div>
    </>
  );
}
