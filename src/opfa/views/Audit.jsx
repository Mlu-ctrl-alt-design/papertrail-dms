// Audit trail and security posture (6.1.8).
//
// The audit table is the evidence surface for most of the security claims the
// rest of the console makes: every consent change, every PII reveal, every
// failed OTP writes a row here. Showing the log is how the claim becomes
// checkable rather than asserted.
import { useMemo, useState } from "react";
import { ViewHeader, Card, DataTable, Tabs, TabPanel, C, I } from "../../components/index.js";
import { ShieldCheckmark20Regular, Person20Regular, History20Regular } from "@fluentui/react-icons";
import { OPFA } from "../brand.jsx";
import { ROLES, AGENTS } from "../data.js";
import { useOpfa, now } from "../store.js";
import { dateTime, relTime, countdown } from "../helpers.js";
import { StatusPill, Row, Note } from "../ui.jsx";

const TABS = [
  { id: "trail", label: "Audit trail", icon: History20Regular },
  { id: "rbac", label: "Access control", icon: Person20Regular },
  { id: "sessions", label: "Sessions", icon: ShieldCheckmark20Regular },
];

const PERMISSION_LABELS = {
  reply: "Reply in chat",
  claim: "Claim a conversation",
  transfer: "Transfer to another agent",
  sendTemplate: "Send a message template",
  revealPii: "Reveal masked personal data",
  export: "Export reports",
  manageConsent: "Manage consent records",
  viewAudit: "View the audit trail",
};

export function AuditView() {
  const s = useOpfa();
  const [tab, setTab] = useState("trail");

  const columns = useMemo(() => [
    {
      id: "at", label: "When", width: 150, sortable: true,
      get: (r) => r.at,
      renderCell: (r) => (
        <div>
          <div style={{ fontSize: 11.5, color: C.ink }}>{dateTime(r.at)}</div>
          <div style={{ fontSize: 10, color: C.faint }}>{relTime(r.at, now())}</div>
        </div>
      ),
    },
    {
      id: "severity", label: "Severity", width: 96, sortable: true, filterable: true,
      get: (r) => r.severity,
      renderCell: (r) => <StatusPill kind="severity" value={r.severity} label={r.severity} size="sm" />,
    },
    { id: "actor", label: "Actor", width: 96, sortable: true, filterable: true, get: (r) => r.actor },
    {
      id: "action", label: "Action", width: 180, sortable: true, filterable: true,
      get: (r) => r.action,
      renderCell: (r) => (
        <span style={{ fontSize: 11, fontWeight: 700, color: OPFA.navy, fontFamily: "ui-monospace,Menlo,monospace" }}>
          {r.action}
        </span>
      ),
    },
    {
      id: "entity", label: "Entity", width: 170, sortable: true, filterable: true,
      get: (r) => `${r.entity}:${r.entityId}`,
      renderCell: (r) => (
        <div>
          <div style={{ fontSize: 11, color: C.text }}>{r.entityId}</div>
          <div style={{ fontSize: 10, color: C.faint }}>{r.entity}</div>
        </div>
      ),
    },
    { id: "detail", label: "Detail", get: (r) => r.detail },
    { id: "ip", label: "Source IP", width: 110, sortable: true, get: (r) => r.ip },
  ], []);

  const sessions = useMemo(() => {
    const t = now();
    return AGENTS.map((a) => ({
      ...a,
      current: a.id === s.console.userId,
      expiresAt: a.id === s.console.userId ? s.console.sessionExpiresAt : t + (a.status === "online" ? 18 : 4) * 60_000,
    }));
  }, [s.console.userId, s.console.sessionExpiresAt]);

  return (
    <>
      <ViewHeader
        title="Audit & Security"
        subtitle="Audit trail logging, role-based access control and session management"
      />
      <div style={{ flex: 1, overflow: "auto", padding: "0 20px 20px", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 2, paddingTop: 4 }}>
          <Tabs items={TABS.map((t) => ({ ...t, count: t.id === "trail" ? s.audit.length : undefined }))}
                active={tab} onChange={setTab} />
        </div>

        <TabPanel when="trail" active={tab} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", paddingTop: 12 }}>
          <Note tone="info">
            Every action taken by a complainant, an agent or the platform itself writes an
            immutable entry. Entries marked <strong>SECURITY</strong> or <strong>ALERT</strong> —
            failed identity checks, PII reveals, role changes — are also forwarded to the
            OPFA SIEM for monitoring.
          </Note>
          <div style={{ flex: 1, minHeight: 320, marginTop: 12 }}>
            <DataTable
              rows={s.audit}
              columns={columns}
              getKey={(r) => r.id}
              searchPlaceholder="Search the audit trail…"
              defaultSort={{ col: "at", dir: "desc" }}
              defaultPageSize={25}
            />
          </div>
        </TabPanel>

        <TabPanel when="rbac" active={tab} style={{ paddingTop: 12 }}>
          <Card
            title="Role-based access control"
            subtitle={`Effective role for this session: ${ROLES[s.console.role].label}`}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
                <thead>
                  <tr>
                    <th style={th}>Permission</th>
                    {Object.entries(ROLES).map(([id, r]) => (
                      <th key={id} style={{
                        ...th, textAlign: "center", width: 120,
                        color: id === s.console.role ? OPFA.navy : C.faint,
                      }}>{r.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                    <tr key={key}>
                      <td style={td}>{label}</td>
                      {Object.entries(ROLES).map(([id, r]) => (
                        <td key={id} style={{ ...td, textAlign: "center" }}>
                          {r.can[key] ? (
                            <I as={ShieldCheckmark20Regular} size={14} color={C.success} />
                          ) : (
                            <span style={{ color: C.hairline, fontWeight: 700 }}>—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 14 }}>
              <Note tone="ok">
                This matrix is enforced, not illustrative. Switching role in the sign-in
                dialog changes which navigation items appear and which actions are
                available — a downgrade mid-session moves you off any view you can no
                longer see.
              </Note>
            </div>
          </Card>
        </TabPanel>

        <TabPanel when="sessions" active={tab} style={{ paddingTop: 12 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
            <Card title="Active console sessions" subtitle="Idle timeout is 30 minutes">
              {sessions.map((a) => (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  padding: "9px 0", borderBottom: `1px solid ${C.hairline}`,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>
                      {a.name}{a.current && <span style={{ color: OPFA.blue, fontWeight: 600 }}> · this session</span>}
                    </div>
                    <div style={{ fontSize: 10.5, color: C.faint }}>{a.role} · {a.id}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
                    {countdown(Math.max(0, a.expiresAt - now()))}
                  </span>
                </div>
              ))}
            </Card>

            <Card title="Security posture" subtitle="Controls in force on this channel">
              <Row label="Authentication">Entra ID SSO with on-premises AD sync</Row>
              <Row label="Second factor">Authenticator app, enforced by conditional access</Row>
              <Row label="API access">OAuth 2.0 client credentials over mutual TLS</Row>
              <Row label="In transit">TLS 1.3 to Meta, to Respond and to SharePoint</Row>
              <Row label="At rest">AES-256, keys in Azure Key Vault with 90-day rotation</Row>
              <Row label="PII handling">ID numbers, cellphone numbers and email masked by default; every reveal logged</Row>
              <Row label="Session">30-minute idle timeout, absolute 8-hour cap</Row>
              <Row label="Monitoring">SECURITY and ALERT entries forwarded to the OPFA SIEM</Row>
              <Row label="Continuity">Veeam backup, 15-minute RPO to the DR site</Row>
            </Card>
          </div>
        </TabPanel>
      </div>
    </>
  );
}

const th = {
  textAlign: "left", padding: "8px 10px", borderBottom: `1px solid ${C.hairline}`,
  fontSize: 10, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: "0.6px",
};
const td = { padding: "8px 10px", borderBottom: `1px solid ${C.hairline}`, fontSize: 12, color: C.text };
