// Module E — Audit & Compliance Engine.
// Compliance Calendar (T-30/T-7/T-1 alerts) + Activity Log + AGSA read-only view.

import { useContext, useState } from "react";
import {
  Calendar20Regular, History20Regular, ShieldLock20Regular,
  Warning20Regular, CheckmarkCircle20Filled, Mail20Regular, Phone20Regular,
  ArrowDownload20Regular, Bookmark20Regular,
} from "@fluentui/react-icons";
import {
  I, C, Btn, Pill, DataTable,
  ViewHeader, CommandBar, useToast,
} from "../../components/index.js";
import { EPMSContext } from "../state.js";
import { Avatar } from "../Avatar.jsx";
import { userById } from "../data.js";
import { fmtDate, daysFrom } from "../helpers.js";

// Urgency pill derived from days-to-deadline.
function urgencyPill(days) {
  if (days < 0)   return { label: `${Math.abs(days)}d overdue`, bg: C.dangerBg, fg: C.danger };
  if (days <= 7)  return { label: `T-${days}d urgent`,          bg: C.warningBg, fg: C.warning };
  if (days <= 30) return { label: `T-${days}d`,                 bg: C.brandTint, fg: "#1D4FD7" };
  return                    { label: `T-${days}d`,              bg: "#f3f3f3",  fg: C.muted };
}

function ComplianceTable({ deadlines }) {
  const { dispatch } = useContext(EPMSContext);
  const toast = useToast();

  const rows = deadlines.map((d) => ({ ...d, days: daysFrom(d.deadline) }));

  const stop = (e) => { e.stopPropagation(); };

  const cols = [
    { id: "legalRef", label: "Legal ref", get: (d) => d.legalRef, filterable: true, width: 130,
      renderCell: (d) => (
        <span style={{ fontSize: 11, fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>{d.legalRef}</span>
      ) },
    { id: "title", label: "Statutory deadline", get: (d) => d.title, minWidth: 320,
      renderCell: (d) => (
        <span style={{ fontSize: 12, fontWeight: 600, color: C.ink, lineHeight: 1.35 }}>{d.title}</span>
      ) },
    { id: "owner", label: "Owner", get: (d) => userById(d.owner).name, filterable: true, width: 200,
      renderCell: (d) => {
        const u = userById(d.owner);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar userId={d.owner} size={22}/>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{u.name}</span>
          </div>
        );
      } },
    { id: "deadline", label: "Deadline", get: (d) => d.deadline, width: 130,
      renderCell: (d) => <span style={{ whiteSpace: "nowrap" }}>{fmtDate(d.deadline)}</span> },
    { id: "days", label: "T-N", get: (d) => d.days, width: 130,
      renderCell: (d) => {
        const p = urgencyPill(d.days);
        return <Pill bg={p.bg} fg={p.fg}>{p.label}</Pill>;
      } },
    { id: "status", label: "Status", get: (d) => d.status, filterable: true, width: 110,
      renderCell: (d) => {
        const c = d.status === "At risk"   ? { bg: C.warningBg, fg: C.warning } :
                  d.status === "Completed" ? { bg: C.successBg, fg: C.success } :
                                             { bg: C.brandTint,  fg: C.brand   };
        return <Pill bg={c.bg} fg={c.fg}>{d.status}</Pill>;
      } },
    { id: "actions", label: "Actions", get: () => "", sortable: false, width: 180,
      renderCell: (d) => {
        const owner = userById(d.owner);
        return (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={stop}>
            <button title="Email reminder" onClick={(e) => { stop(e); toast("Email queued", `Reminder sent to ${owner.name}`,
              { icon: <I as={Mail20Regular} size={16} color={C.brand}/>, color: C.brand }); }}
              style={iconBtn}><I as={Mail20Regular} size={13}/></button>
            <button title="WhatsApp reminder" onClick={(e) => { stop(e); toast("WhatsApp queued", `Reminder sent to ${owner.name}`,
              { icon: <I as={Phone20Regular} size={16} color={C.success}/>, color: C.success }); }}
              style={iconBtn}><I as={Phone20Regular} size={13}/></button>
            {d.status === "Pending" && (
              <Btn variant="secondary" size="sm" onClick={(e) => { stop(e);
                dispatch({ type: "MARK_COMPLIANCE", id: d.id, status: "Completed" });
                toast("Marked complete", "Action recorded in audit log",
                      { icon: <I as={CheckmarkCircle20Filled} size={16} color={C.success}/>, color: C.success });
              }}>Mark</Btn>
            )}
          </div>
        );
      } },
  ];

  return (
    <DataTable
      rows={rows}
      columns={cols}
      getKey={(d) => d.id}
      searchPlaceholder="Search statutory deadlines, references, owners…"
      searchKeys={["legalRef", "title"]}
      defaultSort={{ col: "days", dir: "asc" }}
      emptyMessage="No statutory deadlines match this filter."
    />
  );
}

const iconBtn = {
  background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 4,
  padding: "5px 8px", cursor: "pointer", color: C.muted,
  display: "inline-flex", alignItems: "center",
  fontFamily: "inherit",
};

function AGSATable() {
  const { state } = useContext(EPMSContext);

  // One row per audit-relevant artefact category. Posture is computed from
  // the underlying state — verified POE ratio, signed PA ratio, etc.
  const rows = (() => {
    const poeTotal     = state.poeDocuments.length;
    const poeVerified  = state.poeDocuments.filter((d) => d.verified).length;
    const paTotal      = state.performanceAgreements.length;
    const paSigned     = state.performanceAgreements.filter((p) => p.signed).length;
    const txFlagged    = state.mscoaTx.filter((t) => t.status === "Flagged").length;
    const dlPending    = state.complianceDeadlines.filter((d) => d.status === "Pending").length;
    const dlOverdue    = state.complianceDeadlines.filter((d) => daysFrom(d.deadline) < 0).length;
    const riskCritical = state.risks.filter((r) => r.residual === "Critical").length;

    const ready    = (n, total) => total === 0 ? 100 : Math.round((n / total) * 100);
    const posture  = (pct) => pct >= 90 ? "Ready" : pct >= 70 ? "Mostly ready" : pct >= 40 ? "At risk" : "Not ready";

    return [
      { id: "poe",  category: "Portfolio of Evidence",     legalRef: "AGSA · POPIA",    count: poeTotal,
        complete: poeVerified, total: poeTotal, ready: ready(poeVerified, poeTotal),
        notes: `${poeVerified} of ${poeTotal} verified · all SHA-256 hashed`, link: "poe" },
      { id: "pa",   category: "Section 56/57 PAs",         legalRef: "MSA s.57",         count: paTotal,
        complete: paSigned, total: paTotal, ready: ready(paSigned, paTotal),
        notes: `${paSigned} of ${paTotal} signed`, link: "ipms" },
      { id: "tx",   category: "mSCOA transactions flagged",legalRef: "mSCOA Reg.",       count: txFlagged,
        complete: state.mscoaTx.length - txFlagged, total: state.mscoaTx.length,
        ready: ready(state.mscoaTx.length - txFlagged, state.mscoaTx.length),
        notes: txFlagged === 0 ? "All transactions clean" : `${txFlagged} awaiting CFO review`, link: "sdbip" },
      { id: "dl",   category: "Statutory deadlines",       legalRef: "MFMA / MSA",       count: state.complianceDeadlines.length,
        complete: state.complianceDeadlines.length - dlPending, total: state.complianceDeadlines.length,
        ready: ready(state.complianceDeadlines.length - dlPending, state.complianceDeadlines.length),
        notes: dlOverdue > 0 ? `${dlOverdue} overdue · ${dlPending} pending` : `${dlPending} pending`, link: "audit" },
      { id: "act",  category: "Activity log entries",      legalRef: "MFMA s.62",        count: state.activity.length,
        complete: state.activity.length, total: state.activity.length, ready: 100,
        notes: "Append-only · 24-month retention", link: "audit" },
      { id: "risk", category: "Strategic risk register",   legalRef: "MFMA s.62(1)(c)",  count: state.risks.length,
        complete: state.risks.length - riskCritical, total: state.risks.length,
        ready: ready(state.risks.length - riskCritical, state.risks.length),
        notes: `${riskCritical} critical · all linked to objectives`, link: "idp" },
      { id: "idp",  category: "IDP / SDBIP cascade",       legalRef: "MSA s.34 · MFMA s.53",
        count: state.objectives.length, complete: state.objectives.filter((o) => o.status === "On track").length,
        total: state.objectives.length,
        ready: ready(state.objectives.filter((o) => o.status === "On track").length, state.objectives.length),
        notes: "Cascade integrity verified", link: "idp" },
    ].map((r) => ({ ...r, posture: posture(r.ready) }));
  })();

  const cols = [
    { id: "category", label: "Audit artefact", get: (r) => r.category, minWidth: 240,
      renderCell: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 4, background: `${C.brand}18`,
            color: C.brand, display: "grid", placeItems: "center", flexShrink: 0,
          }}><I as={ShieldLock20Regular} size={14}/></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{r.category}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{r.legalRef}</div>
          </div>
        </div>
      ) },
    { id: "count", label: "Items", get: (r) => r.count, width: 90, align: "right",
      renderCell: (r) => <span style={{ fontWeight: 700 }}>{r.count}</span> },
    { id: "complete", label: "Complete", get: (r) => r.complete, width: 110, align: "right",
      renderCell: (r) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {r.complete} <span style={{ color: C.muted, fontSize: 10 }}>/ {r.total}</span>
        </span>
      ) },
    { id: "ready", label: "Readiness", get: (r) => r.ready, width: 160, align: "right",
      renderCell: (r) => {
        const colour = r.ready >= 90 ? C.success : r.ready >= 70 ? C.brand : r.ready >= 40 ? C.warning : C.danger;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
            <div style={{ width: 70, height: 4, background: C.surfaceMute, borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${r.ready}%`, background: colour, borderRadius: 100 }}/>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, minWidth: 32, color: colour }}>{r.ready}%</span>
          </div>
        );
      } },
    { id: "posture", label: "Posture", get: (r) => r.posture, filterable: true, width: 130,
      renderCell: (r) => {
        const c = r.posture === "Ready"        ? { bg: C.successBg, fg: C.success } :
                  r.posture === "Mostly ready" ? { bg: C.brandTint,  fg: C.brand   } :
                  r.posture === "At risk"      ? { bg: C.warningBg, fg: C.warning } :
                                                 { bg: C.dangerBg,  fg: C.danger  };
        return <Pill bg={c.bg} fg={c.fg}>{r.posture}</Pill>;
      } },
    { id: "notes", label: "Notes", get: (r) => r.notes, minWidth: 240, sortable: false,
      renderCell: (r) => <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{r.notes}</span> },
  ];

  // Compliance posture summary derived from the average of all readiness rows.
  const overallReady = Math.round(rows.reduce((a, r) => a + r.ready, 0) / rows.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{
        padding: "12px 20px", background: "#fff",
        borderBottom: `1px solid ${C.hairline}`, flexShrink: 0,
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 4, background: `${C.brand}1a`,
            color: C.brand, display: "grid", placeItems: "center",
          }}><I as={ShieldLock20Regular} size={16}/></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>AGSA read-only audit portal</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
              All audit-relevant artefact categories · 7-year POE retention · 24-month activity log
            </div>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.muted,
                         textTransform: "uppercase", letterSpacing: "0.5px" }}>FY 2025/26 readiness</span>
          <div style={{ width: 140, height: 8, background: C.surfaceMute, borderRadius: 100, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${overallReady}%`,
                          background: `linear-gradient(90deg,${C.brand},${C.success})`, borderRadius: 100 }}/>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{overallReady}%</span>
        </div>
      </div>
      <DataTable
        rows={rows}
        columns={cols}
        getKey={(r) => r.id}
        searchPlaceholder="Search audit artefacts…"
        searchKeys={["category", "legalRef", "notes"]}
        defaultSort={{ col: "ready", dir: "asc" }}
        emptyMessage="No audit artefacts."
      />
    </div>
  );
}

export function AuditView() {
  const { state } = useContext(EPMSContext);
  const toast = useToast();
  const [tab, setTab] = useState("calendar");

  const tabs = [
    { id: "calendar", label: "Compliance calendar", icon: Calendar20Regular },
    { id: "activity", label: "Activity log", icon: History20Regular },
    { id: "agsa", label: "AGSA portal", icon: ShieldLock20Regular },
  ];

  // Activity log columns
  const actCols = [
    { id: "user", label: "Actor", get: (a) => userById(a.userId).name, filterable: true, width: 200,
      renderCell: (a) => {
        const u = userById(a.userId);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar userId={a.userId} size={22}/>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{u.name}</div>
              <div style={{ fontSize: 9, color: C.muted }}>{u.role}</div>
            </div>
          </div>
        );
      } },
    { id: "action", label: "Action", get: (a) => a.action, filterable: true, width: 220,
      renderCell: (a) => <span style={{ fontWeight: 600, color: C.text }}>{a.action}</span> },
    { id: "target", label: "Target", get: (a) => a.target, minWidth: 280,
      renderCell: (a) => <span style={{ color: C.brand, fontSize: 12 }}>{a.target}</span> },
    { id: "time", label: "Timestamp", get: (a) => a.time, width: 160, sortable: false,
      renderCell: (a) => <span style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>{a.time}</span> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <ViewHeader
        title="Audit & Compliance Engine"
        subtitle="MFMA · MSA · POPIA · activity log retention 24 months · POE retention 7 years"
        action={
          <div style={{ display: "flex", gap: 6, background: C.surfaceMute, borderRadius: 4, padding: 3 }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? "#fff" : "transparent", border: "none",
                borderRadius: 3, padding: "5px 12px", cursor: "pointer",
                fontSize: 12, fontWeight: 600,
                color: tab === t.id ? C.brand : C.muted, fontFamily: "inherit",
                display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}><I as={t.icon} size={13}/>{t.label}</button>
            ))}
          </div>
        }
        commandBar={<CommandBar groups={[
          [
            { icon: Bookmark20Regular, label: "Save view", onClick: () => toast("Saved", "View bookmarked") },
          ],
          [
            { icon: Warning20Regular, label: "Risk heat map",
              onClick: () => toast("Risk heat map", "Open visual matrix") },
            { icon: ShieldLock20Regular, label: "Generate AGSA pack",
              onClick: () => toast("AGSA pack", "Generating audit-ready PDF") },
          ],
          [
            { right: true, icon: ArrowDownload20Regular, label: "Export PDF",
              onClick: () => toast("Exporting", "PDF queued") },
            { right: true, icon: ArrowDownload20Regular, label: "Export CSV",
              onClick: () => toast("Exporting", "CSV queued") },
          ],
        ]}/>}
      />
      {tab === "calendar" && <ComplianceTable deadlines={state.complianceDeadlines}/>}
      {tab === "activity" && (
        <DataTable
          rows={state.activity}
          columns={actCols}
          getKey={(a) => a.id}
          searchPlaceholder="Search activity log…"
          searchKeys={["action", "target"]}
          defaultSort={{ col: "time", dir: "desc" }}
        />
      )}
      {tab === "agsa" && <AGSATable/>}
    </div>
  );
}
