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
  I, C, Btn, Pill, Drawer, FormDrawer, DataTable,
  ViewHeader, CommandBar, Input, Select, useToast,
} from "../../components/index.js";
import { EPMSContext } from "../state.js";
import { Avatar } from "../Avatar.jsx";
import { DEPARTMENTS, KPAS, WARDS, userById } from "../data.js";
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
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 8, marginBottom: 8,
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

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12, marginBottom: 18,
        }}>
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
                display: "grid", gridTemplateColumns: "minmax(140px, 200px) 1fr",
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

function kpaById(id) { return KPAS.find((k) => k.id === id); }

function AddToSDBIPForm({ onClose }) {
  const { state, dispatch } = useContext(EPMSContext);
  const toast = useToast();
  const [kpiId, setKpiId] = useState("");
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [q4, setQ4] = useState("");
  const [mscoaProject, setMscoaProject] = useState("");
  const [newSegmentMode, setNewSegmentMode] = useState(false);
  const [department, setDepartment] = useState("");
  const [owner, setOwner] = useState("");

  // Collect all known mSCOA project-segment codes from existing data.
  const knownSegments = [...new Set([
    ...state.mscoaTx.map((t) => t.project).filter(Boolean),
    ...state.sdbipTargets.map((t) => t.mscoaProject).filter((v) => v && v !== "—"),
    ...state.capitalProjects.map((p) => p.id),
  ])].sort();

  const alreadyInSdbip = new Set(state.sdbipTargets.map((t) => t.kpiId).filter(Boolean));
  const currentFy = "2026/27";
  const available = state.masterKpis
    .filter((k) => k.fy === currentFy)
    .map((k) => ({ ...k, adopted: alreadyInSdbip.has(k.id) }))
    .sort((a, b) => {
      if (a.adopted !== b.adopted) return a.adopted ? 1 : -1;
      return a.code.localeCompare(b.code);
    });

  const picked = kpiId ? state.masterKpis.find((k) => k.id === kpiId) : null;

  const selectKpi = (id) => {
    setKpiId(id);
    const kpi = state.masterKpis.find((k) => k.id === id);
    if (kpi) {
      if (!owner) setOwner(kpi.owner || "");
      if (!department) {
        const u = userById(kpi.owner);
        if (u.department) setDepartment(u.department);
      }
    }
  };

  const n = (v) => parseInt(v, 10) || 0;
  const annual = n(q1) + n(q2) + n(q3) + n(q4);

  const submit = () => {
    if (!kpiId || !picked) {
      toast("Select a KPI", "Pick a Master KPI from the IDP to add to this SDBIP.",
            { color: "#7a5700" });
      return;
    }
    if (!department || !owner) {
      toast("Missing details", "Department and owner are required.",
            { color: "#7a5700" });
      return;
    }
    if (annual <= 0) {
      toast("Set quarterly targets", "At least one quarter must have a target > 0.",
            { color: "#7a5700" });
      return;
    }
    const target = {
      id: `sd_${Date.now()}`,
      code: `SD-T-${String(state.sdbipTargets.length + 1).padStart(3, "0")}`,
      kpiId,
      soId: picked.soId,
      department,
      indicator: picked.title,
      unit: picked.unit || "",
      q1: n(q1), q2: n(q2), q3: n(q3), q4: n(q4),
      ytd: 0,
      annual,
      mscoaProject: mscoaProject.trim() || "—",
      wards: [],
      owner,
      status: "On track",
    };
    dispatch({ type: "ADD_SDBIP_TARGET", target });
    toast("KPI added to SDBIP", `${picked.code} → ${target.code}`,
          { icon: <I as={CheckmarkCircle20Filled} size={16} color="#107c10"/>, color: "#107c10" });
    onClose();
  };

  return (
    <FormDrawer title="Add IDP KPI to SDBIP" onClose={onClose} width={560}
                footer={<>
                  <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                  <Btn onClick={submit}><I as={Add20Regular} size={14}/> Add to SDBIP</Btn>
                </>}>
      <div style={{ padding: 20 }}>
        <div style={{
          background: C.brandTint, border: `1px solid ${C.brand}40`,
          borderRadius: 4, padding: "10px 12px", marginBottom: 14,
          fontSize: 12, color: C.ink, lineHeight: 1.5,
        }}>
          The SDBIP is a fiscal-year selection of IDP Master KPIs. Pick a KPI
          below, then set quarterly targets and the mSCOA project binding.
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                      textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
          Select IDP Master KPI ({currentFy})
        </div>
        <div style={{
          border: `1px solid ${C.hairline}`, borderRadius: 4,
          maxHeight: 260, overflow: "auto", background: "#fff", marginBottom: 14,
        }}>
          {available.length === 0 && (
            <div style={{ padding: "14px", fontSize: 12, color: C.faint }}>
              No Master KPIs in {currentFy}. Compose KPIs in the IDP module first.
            </div>
          )}
          {available.map((k) => {
            const kpa = kpaById(k.kpaId);
            const selected = k.id === kpiId;
            return (
              <button key={k.id}
                      disabled={k.adopted}
                      onClick={() => selectKpi(k.id)} style={{
                width: "100%", textAlign: "left", border: "none",
                background: selected ? `${kpa.color}12` : "transparent",
                borderBottom: `1px solid ${C.hairline}`,
                padding: "9px 12px",
                cursor: k.adopted ? "not-allowed" : "pointer",
                opacity: k.adopted ? 0.5 : 1,
                fontFamily: "inherit",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 4, background: kpa.color,
                  color: "#fff", display: "grid", placeItems: "center",
                  fontWeight: 700, fontSize: 10, flexShrink: 0, marginTop: 2,
                }}>{kpa.code.replace("KPA ", "")}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: kpa.color, fontWeight: 700,
                                letterSpacing: "0.4px" }}>{k.code}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, lineHeight: 1.3 }}>
                    {k.title}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                    Target: {k.target} {k.unit} · {k.fy}
                  </div>
                </div>
                {k.adopted && (
                  <Pill bg={C.surfaceMute} fg={C.muted}>In SDBIP</Pill>
                )}
              </button>
            );
          })}
        </div>

        {picked && (
          <div style={{
            background: C.surfaceMute, borderRadius: 4, padding: "8px 12px",
            marginBottom: 14, fontSize: 11, color: C.muted, lineHeight: 1.5,
          }}>
            <strong style={{ color: C.ink }}>{picked.code}</strong> — {picked.title}
            <span style={{ margin: "0 6px" }}>·</span>
            IDP target: <strong style={{ color: C.ink }}>{picked.target} {picked.unit}</strong>
          </div>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                      textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
          Quarterly targets
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
          <Input label="Q1" type="number" value={q1} onChange={(e) => setQ1(e.target.value)} placeholder="0"/>
          <Input label="Q2" type="number" value={q2} onChange={(e) => setQ2(e.target.value)} placeholder="0"/>
          <Input label="Q3" type="number" value={q3} onChange={(e) => setQ3(e.target.value)} placeholder="0"/>
          <Input label="Q4" type="number" value={q4} onChange={(e) => setQ4(e.target.value)} placeholder="0"/>
        </div>
        {annual > 0 && (
          <div style={{ fontSize: 12, color: C.ink, marginBottom: 14 }}>
            Annual total: <strong>{annual.toLocaleString()}</strong>
            {picked && ` ${picked.unit || ""}`}
            {picked && picked.target != null && (
              <span style={{ color: annual >= picked.target ? C.success : C.warning, marginLeft: 8 }}>
                ({annual >= picked.target ? "meets" : "below"} IDP target of {picked.target})
              </span>
            )}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            marginBottom: 4,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: C.muted,
              textTransform: "uppercase", letterSpacing: "0.5px",
            }}>mSCOA segment</div>
            <button onClick={() => { setNewSegmentMode(!newSegmentMode); setMscoaProject(""); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 11, fontWeight: 600, color: C.brand,
                      fontFamily: "inherit", padding: 0,
                    }}>
              {newSegmentMode ? "Pick existing" : "+ Create new"}
            </button>
          </div>
          {newSegmentMode ? (
            <input value={mscoaProject} onChange={(e) => setMscoaProject(e.target.value)}
                   placeholder="e.g. EL-CAP-2026-003"
                   style={{
                     width: "100%", padding: "8px 10px",
                     border: `1px solid ${C.hairlineSoft}`, borderRadius: 4,
                     fontSize: 13, background: C.surfaceAlt, color: C.text,
                     fontFamily: "ui-monospace, monospace",
                   }}/>
          ) : (
            <Select value={mscoaProject}
                    onChange={(e) => setMscoaProject(e.target.value)}
                    placeholder="Select an existing segment…"
                    options={knownSegments.map((s) => ({ value: s, label: s }))}
                    style={{ marginBottom: 0 }}/>
          )}
        </div>
        <Select label="Department" value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Select a department…"
                options={DEPARTMENTS.map((d) => ({ value: d.id, label: d.label }))}/>
        <Select label="Owner" value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Select an accountable owner…"
                options={["u_mm","u_cfo","u_corp","u_tech","u_comm"].map((id) => {
                  const u = userById(id);
                  return { value: id, label: `${u.name} — ${u.role}` };
                })}/>
      </div>
    </FormDrawer>
  );
}

export function SDBIPView() {
  const { state } = useContext(EPMSContext);
  const toast = useToast();
  const [tab, setTab] = useState("sdbip");
  const [selSdbipId, setSelSdbipId] = useState(null);
  const [cascadeId, setCascadeId] = useState(null);
  const [selTxId, setSelTxId] = useState(null);
  const [showAddKpi, setShowAddKpi] = useState(false);

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
    { id: "kpi", label: "IDP KPI", get: (t) => t.kpiId || "—", width: 120,
      renderCell: (t) => {
        if (!t.kpiId) return <Pill bg={C.warningBg} fg={C.warning}>Unlinked</Pill>;
        const kpi = state.masterKpis.find((k) => k.id === t.kpiId);
        return <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.brand }}>{kpi?.code || t.kpiId}</span>;
      } },
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
    { id: "segment", label: "Segment", get: (t) => t.project, filterable: true, width: 170,
      renderCell: (t) => <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11 }}>{t.project}</span> },
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
            { icon: Add20Regular, label: tab === "mscoa" ? "Capture journal" : "Add IDP KPI",
              onClick: () => tab === "sdbip" ? setShowAddKpi(true) : toast("New entry", "Form opened") },
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
      {showAddKpi && <AddToSDBIPForm onClose={() => setShowAddKpi(false)}/>}
    </div>
  );
}
