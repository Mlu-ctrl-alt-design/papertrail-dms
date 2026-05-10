// Module B — SDBIP & mSCOA Financial Integration.
// Three tabs: SDBIP cascade · mSCOA transactions · Capital projects.

import { useContext, useEffect, useState } from "react";
import {
  DataHistogram20Regular, Money20Regular, Building20Regular,
  ArrowDownload20Regular, Add20Regular, CloudSync20Regular,
  Warning20Regular, Flag20Regular, Dismiss20Regular, Location20Regular,
  CheckmarkCircle20Filled,
} from "@fluentui/react-icons";
import {
  I, C, Btn, Pill, Drawer, DataTable,
  ViewHeader, CommandBar, useToast,
} from "../../components/index.js";
import { EPMSContext } from "../state.js";
import { Avatar } from "../Avatar.jsx";
import { DEPARTMENTS, WARDS, userById } from "../data.js";
import { statusColor, formatZAR, formatZARFull, fmtDate } from "../helpers.js";
import { CascadeView, debtorCascade } from "./Cascade.jsx";
import { takeIntent } from "../intents.js";

// SDBIP rows that have a pre-built cascade chain (the demo "money shot").
// Click these and the cascade drawer opens directly instead of the regular
// detail drawer.
const CASCADE_TARGETS = { sd5: debtorCascade };

function deptLabel(id) {
  return DEPARTMENTS.find((d) => d.id === id)?.label || id;
}
function wardLabel(id) {
  return WARDS.find((w) => w.id === id)?.label || id;
}

function SDBIPDrawer({ target, onClose }) {
  const { state } = useContext(EPMSContext);
  const so = state.objectives.find((o) => o.id === target.soId);
  const owner = userById(target.owner);
  const c = statusColor(target.status);
  const linkedTx = state.mscoaTx.filter((t) => t.project === target.mscoaProject);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
                  background: C.surfaceAlt }}>
      <div style={{ padding: "18px 22px", background: "#fff", borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.brand, letterSpacing: "0.5px",
                          textTransform: "uppercase", marginBottom: 4 }}>{target.code}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{target.indicator}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{deptLabel(target.department)}</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted,
            display: "inline-flex", padding: 2,
          }}><I as={Dismiss20Regular} size={18}/></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <Pill bg={c.bg} fg={c.fg}>{target.status}</Pill>
          <Pill bg={C.brandTint} fg={C.brand} uppercase={false}>{target.mscoaProject}</Pill>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
            Quarterly cascade
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 8,
          }}>
            {[["Q1", target.q1], ["Q2", target.q2], ["Q3", target.q3], ["Q4", target.q4]].map(([q, v]) => (
              <div key={q} style={{
                background: "#fff", border: `1px solid ${C.hairline}`,
                borderRadius: 4, padding: "10px 12px", textAlign: "center",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.5px" }}>{q}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginTop: 2 }}>{v.toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 4, padding: "10px 12px",
                        display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <div><strong>Annual target:</strong> {target.annual.toLocaleString()} {target.unit}</div>
            <div><strong>YTD actual:</strong> <span style={{ color: c.fg, fontWeight: 700 }}>{target.ytd.toLocaleString()}</span></div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <Field label="Owner">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar userId={target.owner} size={22}/>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{owner.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{owner.role}</div>
              </div>
            </div>
          </Field>
          <Field label="Linked IDP objective">
            <div style={{ fontSize: 12, fontWeight: 600 }}>{so?.code} · {so?.title}</div>
          </Field>
          <Field label="mSCOA project">
            <div style={{ fontSize: 12, fontFamily: "ui-monospace, monospace" }}>{target.mscoaProject}</div>
          </Field>
          <Field label={`Wards (${target.wards.length})`}>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
              {target.wards.length === 0 ? "Cross-municipality" :
               target.wards.length === 19 ? "All 19 wards" :
               target.wards.map(wardLabel).join(", ")}
            </div>
          </Field>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
            Linked mSCOA transactions ({linkedTx.length})
          </div>
          {linkedTx.length === 0
            ? <div style={{ fontSize: 12, color: C.faint, fontStyle: "italic" }}>No transactions posted to this project yet.</div>
            : linkedTx.map((t) => (
                <div key={t.id} style={{
                  background: "#fff", border: `1px solid ${C.hairline}`,
                  borderRadius: 4, padding: "10px 12px", marginBottom: 6,
                  display: "flex", justifyContent: "space-between", gap: 10,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{t.description}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{t.ref} · {fmtDate(t.date)} · {t.funding}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700,
                                  color: t.amount > 0 ? C.success : C.danger }}>
                      {formatZARFull(t.amount)}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted }}>{t.itemCategory}</div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function MSCOATxDrawer({ tx, onClose }) {
  const { dispatch } = useContext(EPMSContext);
  const toast = useToast();
  const segs = [
    { key: "project", label: "1 · Project" },
    { key: "function", label: "2 · Function" },
    { key: "funding", label: "3 · Funding" },
    { key: "item", label: "4 · Item" },
    { key: "costing", label: "5 · Costing" },
    { key: "region", label: "6 · Region", render: (v) => v ? wardLabel(v) : "Cross-municipality" },
    { key: "itemCategory", label: "7 · Item Category" },
  ];
  const c = statusColor(tx.status);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
                  background: C.surfaceAlt }}>
      <div style={{ padding: "18px 22px", background: "#fff", borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.brand, letterSpacing: "0.5px",
                          textTransform: "uppercase", marginBottom: 4 }}>Journal entry · {tx.ref}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>{tx.description}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6,
                          color: tx.amount > 0 ? C.success : C.danger }}>
              {formatZARFull(tx.amount)}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted,
            display: "inline-flex", padding: 2,
          }}><I as={Dismiss20Regular} size={18}/></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <Pill bg={c.bg} fg={c.fg}>{tx.status}</Pill>
          <Pill bg={C.brandTint} fg={C.brand} uppercase={false}>{fmtDate(tx.date)}</Pill>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                      textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
          Seven-segment mSCOA classification
        </div>
        <div style={{ background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 4, overflow: "hidden" }}>
          {segs.map((s, i) => {
            const v = tx[s.key];
            const empty = !v;
            return (
              <div key={s.key} style={{
                display: "grid", gridTemplateColumns: "200px 1fr",
                padding: "10px 14px", fontSize: 12,
                borderBottom: i < segs.length - 1 ? `1px solid ${C.surfaceMute}` : "none",
                background: empty ? `${C.danger}08` : "#fff",
              }}>
                <div style={{ color: C.muted, fontWeight: 600 }}>{s.label}</div>
                <div style={{ color: empty ? C.danger : C.ink, fontFamily: empty ? "inherit" : "ui-monospace, monospace" }}>
                  {empty ? "⚠ MISSING" : (s.render ? s.render(v) : v)}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <Btn variant="secondary" size="sm" onClick={() => {
            dispatch({ type: "FLAG_TX", id: tx.id });
            toast("Transaction flagged", "Sent to CFO for review",
                  { icon: <I as={Warning20Regular} size={16} color="#7a5700"/>, color: "#7a5700" });
            onClose();
          }}><I as={Flag20Regular} size={13}/> Flag for review</Btn>
          <Btn variant="ghost" size="sm" onClick={() => toast("mSCOA mapping", "Opening segment mapping reference")}>
            View mapping reference
          </Btn>
        </div>
      </div>
    </div>
  );
}

export function SDBIPView() {
  const { state } = useContext(EPMSContext);
  const toast = useToast();
  const [tab, setTab] = useState("sdbip");
  const [selSdbipId, setSelSdbipId] = useState(null);
  const [cascadeId, setCascadeId] = useState(null);
  const [selTxId, setSelTxId] = useState(null);

  // If the dashboard's Targets Requiring Attention list set a pending cascade
  // intent, consume it on mount and open the cascade drawer automatically.
  useEffect(() => {
    const intent = takeIntent();
    if (intent && intent.openCascade && CASCADE_TARGETS[intent.openCascade]) {
      setTab("sdbip");
      setCascadeId(intent.openCascade);
    }
  }, []);

  const selSdbip = selSdbipId ? state.sdbipTargets.find((t) => t.id === selSdbipId) : null;
  const selTx = selTxId ? state.mscoaTx.find((t) => t.id === selTxId) : null;
  const activeCascade = cascadeId && CASCADE_TARGETS[cascadeId] ? CASCADE_TARGETS[cascadeId]() : null;

  const onSdbipRowClick = (t) => {
    if (CASCADE_TARGETS[t.id]) setCascadeId(t.id);
    else setSelSdbipId(t.id);
  };

  // ── SDBIP cascade ─────────────────────────────────────────────────────────
  const sdbipCols = [
    { id: "code", label: "Ref", get: (t) => t.code, width: 100 },
    { id: "indicator", label: "Indicator", get: (t) => t.indicator, minWidth: 280,
      renderCell: (t) => {
        const so = state.objectives.find((o) => o.id === t.soId);
        const cascadable = !!CASCADE_TARGETS[t.id];
        return (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>↑ {so?.code} {so?.title.slice(0, 36)}…</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginTop: 2,
                          display: "flex", alignItems: "center", gap: 6 }}>
              {t.indicator}
              {cascadable && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 100,
                  background: C.brandTint, color: C.brand,
                  textTransform: "uppercase", letterSpacing: "0.5px",
                }}>5-step cascade</span>
              )}
            </div>
          </div>
        );
      } },
    { id: "department", label: "Dept", get: (t) => deptLabel(t.department), filterable: true, width: 200 },
    { id: "annual", label: "Annual target", get: (t) => t.annual, width: 130, align: "right",
      renderCell: (t) => <span style={{ whiteSpace: "nowrap" }}>{t.annual.toLocaleString()} <span style={{ color: C.muted, fontSize: 10 }}>{t.unit}</span></span> },
    { id: "ytd", label: "YTD actual", get: (t) => t.ytd, width: 130, align: "right",
      renderCell: (t) => {
        const pct = t.annual > 0 ? Math.round((t.ytd / t.annual) * 100) : 0;
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 12 }}>{t.ytd.toLocaleString()}</span>
            <span style={{ fontSize: 10, color: C.muted }}>{pct}% of annual</span>
          </div>
        );
      } },
    { id: "mscoa", label: "mSCOA project", get: (t) => t.mscoaProject, width: 160,
      renderCell: (t) => <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11 }}>{t.mscoaProject}</span> },
    { id: "wards", label: "Wards", get: (t) => t.wards.length, width: 80, align: "right",
      renderCell: (t) => <span>{t.wards.length === 19 ? "All 19" : t.wards.length}</span> },
    { id: "status", label: "Status", get: (t) => t.status, filterable: true, width: 100,
      renderCell: (t) => <Pill bg={statusColor(t.status).bg} fg={statusColor(t.status).fg}>{t.status}</Pill> },
  ];

  // ── mSCOA transactions ────────────────────────────────────────────────────
  const txCols = [
    { id: "ref", label: "Ref", get: (t) => t.ref, width: 150,
      renderCell: (t) => <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11 }}>{t.ref}</span> },
    { id: "date", label: "Date", get: (t) => t.date, width: 110,
      renderCell: (t) => <span style={{ whiteSpace: "nowrap" }}>{fmtDate(t.date)}</span> },
    { id: "description", label: "Description", get: (t) => t.description, minWidth: 250,
      renderCell: (t) => <span style={{ fontWeight: 600, color: C.ink }}>{t.description}</span> },
    { id: "function", label: "Function", get: (t) => t.function, filterable: true, width: 160 },
    { id: "funding", label: "Funding", get: (t) => t.funding, filterable: true, width: 130 },
    { id: "amount", label: "Amount", get: (t) => t.amount, width: 130, align: "right",
      renderCell: (t) => (
        <span style={{ fontWeight: 700, color: t.amount > 0 ? C.success : C.danger, whiteSpace: "nowrap" }}>
          {formatZARFull(t.amount)}
        </span>
      ) },
    { id: "status", label: "Status", get: (t) => t.status, filterable: true, width: 100,
      renderCell: (t) => <Pill bg={statusColor(t.status).bg} fg={statusColor(t.status).fg}>{t.status}</Pill> },
  ];

  // ── Capital projects ──────────────────────────────────────────────────────
  const capCols = [
    { id: "id", label: "Project ID", get: (p) => p.id, width: 180,
      renderCell: (p) => <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11 }}>{p.id}</span> },
    { id: "name", label: "Project", get: (p) => p.name, minWidth: 280,
      renderCell: (p) => <span style={{ fontWeight: 600, color: C.ink }}>{p.name}</span> },
    { id: "ward", label: "Ward", get: (p) => wardLabel(p.ward), filterable: true, width: 160 },
    { id: "funder", label: "Funder", get: (p) => p.funder, filterable: true, width: 100 },
    { id: "budget", label: "Budget", get: (p) => p.budget, width: 130, align: "right",
      renderCell: (p) => <span style={{ fontWeight: 600 }}>{formatZAR(p.budget)}</span> },
    { id: "spent", label: "Spent", get: (p) => p.spent, width: 130, align: "right",
      renderCell: (p) => {
        const pct = (p.spent / p.budget) * 100;
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
            <span style={{ fontWeight: 600 }}>{formatZAR(p.spent)}</span>
            <div style={{ width: 60, height: 4, background: C.surfaceMute, borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, pct)}%`,
                            background: pct > 100 ? C.danger : pct > 80 ? "#7a5700" : C.success, borderRadius: 100 }}/>
            </div>
          </div>
        );
      } },
    { id: "status", label: "Status", get: (p) => p.status, filterable: true, width: 100,
      renderCell: (p) => <Pill bg={statusColor(p.status).bg} fg={statusColor(p.status).fg}>{p.status}</Pill> },
  ];

  const tabs = [
    { id: "sdbip", label: "SDBIP cascade", icon: DataHistogram20Regular },
    { id: "mscoa", label: "mSCOA transactions", icon: Money20Regular },
    { id: "capital", label: "Capital projects", icon: Building20Regular },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <ViewHeader
        title="SDBIP & mSCOA Financial Integration"
        subtitle="Top-Layer signed by Mayor · Departmental signed by directors · 7-segment mSCOA classification at point of entry"
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
            { icon: Add20Regular, label: tab === "mscoa" ? "Capture journal" : "New target",
              onClick: () => toast("New entry", "Form opened") },
            { icon: CloudSync20Regular, label: "Sync from financial system",
              onClick: () => toast("Sync started", "Pulling from Sage / Munsoft via SFTP") },
          ],
          [
            { icon: Warning20Regular, label: "Flagged transactions",
              onClick: () => toast("Filter", "Showing flagged only") },
          ],
          [
            { right: true, icon: ArrowDownload20Regular, label: "Export PDF",
              onClick: () => toast("Exporting", "PDF queued") },
            { right: true, icon: ArrowDownload20Regular, label: "Export CSV",
              onClick: () => toast("Exporting", "CSV queued") },
          ],
        ]}/>}
      />
      {tab === "sdbip" && (
        <DataTable
          rows={state.sdbipTargets}
          columns={sdbipCols}
          getKey={(t) => t.id}
          searchPlaceholder="Search SDBIP targets, mSCOA codes…"
          searchKeys={["code", "indicator", "mscoaProject"]}
          defaultSort={{ col: "code", dir: "asc" }}
          onRowClick={onSdbipRowClick}
          selectedKey={selSdbipId || cascadeId}
        />
      )}
      {tab === "mscoa" && (
        <DataTable
          rows={state.mscoaTx}
          columns={txCols}
          getKey={(t) => t.id}
          searchPlaceholder="Search journal entries, descriptions, projects…"
          searchKeys={["ref", "description", "project"]}
          defaultSort={{ col: "date", dir: "desc" }}
          onRowClick={(t) => setSelTxId(t.id)}
          selectedKey={selTxId}
        />
      )}
      {tab === "capital" && (
        <DataTable
          rows={state.capitalProjects}
          columns={capCols}
          getKey={(p) => p.id}
          searchPlaceholder="Search capital projects…"
          searchKeys={["id", "name"]}
          defaultSort={{ col: "name", dir: "asc" }}
        />
      )}
      {selSdbip && (
        <Drawer onClose={() => setSelSdbipId(null)} width={680}>
          <SDBIPDrawer target={selSdbip} onClose={() => setSelSdbipId(null)}/>
        </Drawer>
      )}
      {activeCascade && (
        <Drawer onClose={() => setCascadeId(null)} width={760}>
          <CascadeView cascade={activeCascade} onClose={() => setCascadeId(null)}/>
        </Drawer>
      )}
      {selTx && (
        <Drawer onClose={() => setSelTxId(null)} width={620}>
          <MSCOATxDrawer tx={selTx} onClose={() => setSelTxId(null)}/>
        </Drawer>
      )}
    </div>
  );
}
