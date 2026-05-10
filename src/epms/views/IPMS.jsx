// Module C — Individual Performance Management.
// Performance Agreements table + KPI breakdown drawer + moderation cap visual.

import { useContext, useState } from "react";
import {
  Edit20Regular, Add20Regular, ArrowDownload20Regular,
  CheckmarkCircle20Filled, Warning20Regular, Dismiss20Regular,
  Star20Filled, ContactCard20Regular, ShieldLock20Regular,
} from "@fluentui/react-icons";
import {
  I, C, Btn, Pill, Drawer, DataTable,
  ViewHeader, CommandBar, useToast,
} from "../../components/index.js";
import { EPMSContext } from "../state.js";
import { Avatar } from "../Avatar.jsx";
import { DEPARTMENTS } from "../data.js";
import { weightedScore, fmtDate } from "../helpers.js";

function deptLabel(id) {
  return DEPARTMENTS.find((d) => d.id === id)?.label || id;
}

function ratingLabel(r) {
  return ["", "Unacceptable", "Not effective", "Fully effective", "Above expectation", "Outstanding"][r] || "—";
}
function ratingColor(r) {
  return ["", "#a4262c", "#7a5700", "#107c10", "#1D4FD7", "#8764b8"][r] || "#605e5c";
}

function PADrawer({ pa, onClose }) {
  const { state, dispatch } = useContext(EPMSContext);
  const toast = useToast();
  const kpis = state.individualKpis[pa.id] || [];
  const score = weightedScore(kpis);
  // Departmental SDBIP performance — moderation cap derives from these.
  const deptSDBIPs = state.sdbipTargets.filter((t) => t.department === pa.department);
  const deptYTDpct = deptSDBIPs.length === 0 ? 100 :
    deptSDBIPs.reduce((acc, t) => acc + (t.annual > 0 ? Math.min(100, (t.ytd / t.annual) * 100) : 0), 0) / deptSDBIPs.length;
  const deptCap = (deptYTDpct / 100) * 5; // implied dept score on a 1–5 scale
  const moderatedScore = Math.min(score, deptCap);
  const capped = score > deptCap;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
                  background: C.surfaceAlt }}>
      <div style={{ padding: "18px 22px", background: "#fff", borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 14 }}>
            <Avatar userId={pa.employeeId} size={56}/>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.brand, letterSpacing: "0.5px",
                            textTransform: "uppercase", marginBottom: 2 }}>{pa.section}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>{pa.employee}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{pa.position}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{deptLabel(pa.department)}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted,
            display: "inline-flex", padding: 2,
          }}><I as={Dismiss20Regular} size={18}/></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {pa.signed
            ? <Pill bg={C.successBg} fg={C.success}><I as={CheckmarkCircle20Filled} size={11}/> Signed {fmtDate(pa.signedDate)}</Pill>
            : <Pill bg={C.dangerBg} fg={C.danger}><I as={Warning20Regular} size={11}/> Unsigned — overdue</Pill>}
          {pa.midYearScore != null && (
            <Pill bg={C.brandTint} fg={C.brand} uppercase={false}>
              Mid-year: {pa.midYearScore.toFixed(1)} / 5
            </Pill>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
        {/* Score moderation card */}
        <div style={{
          background: "#fff", border: `1px solid ${capped ? C.danger : C.hairline}`,
          borderRadius: 4, padding: "14px 16px", marginBottom: 18,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                            textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                Moderation against departmental SDBIP
              </div>
              <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.4 }}>
                Individual scores are capped at the departmental performance level (PMDS framework).
                {capped && <strong style={{ color: C.danger }}> Score capped — see below.</strong>}
              </div>
            </div>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12, marginTop: 12,
          }}>
            <Tile label="Raw weighted score" value={`${score.toFixed(2)} / 5`} accent={C.brand}/>
            <Tile label="Departmental cap" value={`${deptCap.toFixed(2)} / 5`} accent={"#7a5700"}/>
            <Tile label="Moderated score"
                  value={`${moderatedScore.toFixed(2)} / 5`}
                  accent={capped ? C.danger : C.success}
                  highlight/>
          </div>
        </div>

        {/* Weight allocation */}
        <div style={{ marginBottom: 18 }}>
          <SectionTitle>Performance area weights</SectionTitle>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 8,
          }}>
            {[
              { k: "kpi1", label: "Service delivery" },
              { k: "kpi2", label: "Financial mgmt" },
              { k: "kpi3", label: "Institutional" },
              { k: "kpi4", label: "Governance" },
            ].map((x) => (
              <div key={x.k} style={{
                background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 4,
                padding: "10px 12px", textAlign: "center",
              }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: "0.4px" }}>{x.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginTop: 2 }}>{pa.weight[x.k]}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Individual KPIs */}
        <div style={{ marginBottom: 18 }}>
          <SectionTitle>Individual KPIs ({kpis.length})</SectionTitle>
          {kpis.length === 0 ? (
            <div style={{ fontSize: 12, color: C.faint, fontStyle: "italic" }}>
              No KPIs captured yet for this performance agreement.
            </div>
          ) : kpis.map((k) => (
            <div key={k.id} style={{
              background: "#fff", border: `1px solid ${C.hairline}`,
              borderRadius: 4, padding: "12px 14px", marginBottom: 8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, lineHeight: 1.4 }}>{k.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                    Target: <strong style={{ color: C.text }}>{k.target}</strong>
                    <span style={{ margin: "0 8px" }}>·</span>
                    Actual: <strong style={{ color: C.text }}>{k.actual}</strong>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>WEIGHT</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{k.weight}%</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                            marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.surfaceMute}` }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} style={{
                      width: 22, height: 22, borderRadius: 100,
                      background: n <= k.rating ? ratingColor(k.rating) : C.surfaceMute,
                      color: "#fff", fontSize: 11, fontWeight: 700,
                      display: "inline-grid", placeItems: "center",
                    }}>{n <= k.rating ? <I as={Star20Filled} size={11}/> : ""}</span>
                  ))}
                  <span style={{ fontSize: 11, color: ratingColor(k.rating), fontWeight: 700, marginLeft: 8, alignSelf: "center" }}>
                    {ratingLabel(k.rating)}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: C.muted }}>{k.evidence} POE attached</span>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!pa.signed && (
            <Btn variant="success" size="sm" onClick={() => {
              dispatch({ type: "SIGN_PA", id: pa.id });
              toast("PA signed", "Digital signature recorded · ECTA-compliant",
                    { icon: <I as={CheckmarkCircle20Filled} size={16} color="#107c10"/>, color: "#107c10" });
            }}><I as={CheckmarkCircle20Filled} size={13}/> Sign agreement</Btn>
          )}
          <Btn variant="secondary" size="sm" onClick={() => toast("Mid-year review", "Scheduled with line manager")}>
            <I as={ContactCard20Regular} size={13}/> Schedule review
          </Btn>
          <Btn variant="ghost" size="sm" onClick={() => toast("Moderation panel", "Cap rationale recorded")}>
            <I as={ShieldLock20Regular} size={13}/> Moderation rationale
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, accent, highlight }) {
  return (
    <div style={{
      background: highlight ? `${accent}10` : "#fff",
      border: `1px solid ${highlight ? accent : C.hairline}`,
      borderRadius: 4, padding: "12px 14px",
    }}>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent, marginTop: 4, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{children}</div>
  );
}

export function IPMSView() {
  const { state } = useContext(EPMSContext);
  const toast = useToast();
  const [selectedId, setSelectedId] = useState(null);
  const selected = selectedId ? state.performanceAgreements.find((p) => p.id === selectedId) : null;

  const cols = [
    { id: "employee", label: "Employee", get: (p) => p.employee, minWidth: 240,
      renderCell: (p) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Avatar userId={p.employeeId} size={28}/>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{p.employee}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{p.position}</div>
          </div>
        </div>
      ) },
    { id: "section", label: "Section", get: (p) => p.section, filterable: true, width: 110,
      renderCell: (p) => <span style={{ fontWeight: 600 }}>{p.section}</span> },
    { id: "department", label: "Department", get: (p) => deptLabel(p.department), filterable: true, width: 220 },
    { id: "signed", label: "Signed", get: (p) => p.signed ? "Signed" : "Unsigned", filterable: true, width: 130,
      renderCell: (p) => p.signed
        ? <Pill bg={C.successBg} fg={C.success}><I as={CheckmarkCircle20Filled} size={11}/> Signed</Pill>
        : <Pill bg={C.dangerBg} fg={C.danger}>Unsigned</Pill> },
    { id: "midyear", label: "Mid-year", get: (p) => p.midYearScore ?? -1, width: 110, align: "right",
      renderCell: (p) => p.midYearScore == null
        ? <span style={{ color: C.faint, fontSize: 11 }}>—</span>
        : <span style={{ fontWeight: 700, color: ratingColor(Math.round(p.midYearScore)) }}>
            {p.midYearScore.toFixed(1)} / 5
          </span> },
    { id: "moderation", label: "Moderation", get: (p) => p.moderation, width: 130,
      renderCell: (p) => <span style={{ fontSize: 11, color: C.muted }}>{p.moderation}</span> },
  ];

  const signed = state.performanceAgreements.filter((p) => p.signed).length;
  const total = state.performanceAgreements.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <ViewHeader
        title="Individual Performance Management"
        subtitle={`Section 56/57 performance agreements · ${signed} of ${total} signed · OPMS moderation in effect`}
        action={<Btn onClick={() => toast("New PA", "Form opened")}>+ New agreement</Btn>}
        commandBar={<CommandBar groups={[
          [
            { icon: Add20Regular, label: "New agreement", onClick: () => toast("New PA", "Form opened") },
            { icon: Edit20Regular, label: "Edit", disabled: !selectedId, onClick: () => {} },
          ],
          [
            { icon: ShieldLock20Regular, label: "Moderation panel",
              onClick: () => toast("Moderation panel", "Departmental cap rules") },
            { icon: Star20Filled, label: "Annual appraisal cycle",
              onClick: () => toast("Cycle", "FY 2025/26 close: 30 Jun 2026") },
          ],
          [
            { right: true, icon: ArrowDownload20Regular, label: "Export PDF",
              onClick: () => toast("Exporting", "PDF queued") },
            { right: true, icon: ArrowDownload20Regular, label: "Export CSV",
              onClick: () => toast("Exporting", "CSV queued") },
          ],
        ]}/>}
      />
      <DataTable
        rows={state.performanceAgreements}
        columns={cols}
        getKey={(p) => p.id}
        searchPlaceholder="Search by name, position, department…"
        searchKeys={["employee", "position"]}
        defaultSort={{ col: "section", dir: "asc" }}
        onRowClick={(p) => setSelectedId(p.id)}
        selectedKey={selectedId}
      />
      {selected && (
        <Drawer onClose={() => setSelectedId(null)} width={680}>
          <PADrawer pa={selected} onClose={() => setSelectedId(null)}/>
        </Drawer>
      )}
    </div>
  );
}
