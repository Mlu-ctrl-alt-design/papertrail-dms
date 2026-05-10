// Module A — IDP & Strategic Risk Alignment.
// Two tabs: Strategic Objectives (linked to KPAs) and Risk Register.

import { useContext, useState } from "react";
import {
  Flag20Regular, ShieldLock20Regular, Warning20Regular,
  Dismiss20Regular, ArrowDownload20Regular, Edit20Regular,
  Add20Regular, ClipboardTextLtr20Regular, CheckmarkCircle20Filled,
} from "@fluentui/react-icons";
import {
  I, C, Btn, Pill, Drawer, DataTable,
  ViewHeader, CommandBar, useToast,
} from "../../components/index.js";
import { EPMSContext } from "../state.js";
import { Avatar } from "../Avatar.jsx";
import { KPAS, IDP_CYCLE, userById } from "../data.js";
import { statusColor, riskScore, riskColor } from "../helpers.js";

function ObjectiveDrawer({ objective, onClose }) {
  const { state } = useContext(EPMSContext);
  const kpa = KPAS.find((k) => k.id === objective.kpaId);
  const owner = userById(objective.owner);
  const linkedSdbip = state.sdbipTargets.filter((t) => t.soId === objective.id);
  const linkedRisks = state.risks.filter((r) => objective.risks.includes(r.id));
  const c = statusColor(objective.status);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
                  background: C.surfaceAlt }}>
      <div style={{ padding: "18px 22px", background: "#fff", borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: kpa.color, letterSpacing: "0.5px",
                          textTransform: "uppercase", marginBottom: 4 }}>
              {kpa.code} · {objective.code}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{objective.title}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{kpa.label}</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted,
            display: "inline-flex", padding: 2,
          }}><I as={Dismiss20Regular} size={18}/></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <Pill bg={c.bg} fg={c.fg}>{objective.status}</Pill>
          <Pill bg={C.brandTint} fg={C.brand} uppercase={false}>{objective.progress}% complete</Pill>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <Field label="Owner">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar userId={objective.owner} size={24}/>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{owner.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{owner.role}</div>
              </div>
            </div>
          </Field>
          <Field label="Baseline (FY 2022)"><span style={{ fontSize: 12 }}>{objective.baseline2022}</span></Field>
          <Field label="2027 target"><span style={{ fontSize: 12 }}>{objective.target2027}</span></Field>
          <Field label="Mid-year FY26/27">
            <div style={{ height: 8, background: C.surfaceMute, borderRadius: 100, overflow: "hidden", marginTop: 4 }}>
              <div style={{ height: "100%", width: `${objective.progress}%`,
                            background: kpa.color, borderRadius: 100 }}/>
            </div>
          </Field>
        </div>

        <div style={{ marginBottom: 18 }}>
          <SectionTitle>Linked SDBIP departmental targets ({linkedSdbip.length})</SectionTitle>
          {linkedSdbip.length === 0
            ? <Empty>No SDBIP targets linked yet.</Empty>
            : linkedSdbip.map((t) => (
                <div key={t.id} style={{
                  background: "#fff", border: `1px solid ${C.hairline}`,
                  borderRadius: 4, padding: "10px 12px", marginBottom: 6,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{t.code}</div>
                      <div style={{ fontSize: 12, color: C.ink, fontWeight: 600 }}>{t.indicator}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                        Annual: {t.annual.toLocaleString()} {t.unit} · YTD: {t.ytd.toLocaleString()}
                      </div>
                    </div>
                    <Pill bg={statusColor(t.status).bg} fg={statusColor(t.status).fg}>{t.status}</Pill>
                  </div>
                </div>
              ))}
        </div>

        <div>
          <SectionTitle>Strategic risks ({linkedRisks.length})</SectionTitle>
          {linkedRisks.length === 0
            ? <Empty>No risks registered against this objective.</Empty>
            : linkedRisks.map((r) => (
                <div key={r.id} style={{
                  background: "#fff", border: `1px solid ${C.hairline}`,
                  borderRadius: 4, padding: "10px 12px", marginBottom: 6,
                  borderLeft: `3px solid ${riskColor(r)}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{r.code}</div>
                      <div style={{ fontSize: 12, color: C.ink, fontWeight: 600 }}>{r.title}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>
                        Mitigation: {r.mitigation}
                      </div>
                    </div>
                    <Pill bg={`${riskColor(r)}1f`} fg={riskColor(r)}>{r.residual}</Pill>
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
function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{children}</div>
  );
}
function Empty({ children }) {
  return <div style={{ fontSize: 12, color: C.faint, fontStyle: "italic" }}>{children}</div>;
}

export function IDPView() {
  const { state } = useContext(EPMSContext);
  const toast = useToast();
  const [tab, setTab] = useState("objectives");
  const [selectedId, setSelectedId] = useState(null);
  const selected = selectedId ? state.objectives.find((o) => o.id === selectedId) : null;

  // ── Objectives table columns ─────────────────────────────────────────────
  const objCols = [
    { id: "code", label: "Ref", get: (o) => o.code, width: 84 },
    { id: "title", label: "Strategic Objective", get: (o) => o.title, minWidth: 300,
      renderCell: (o) => {
        const k = KPAS.find((x) => x.id === o.kpaId);
        return (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: k.color, letterSpacing: "0.5px",
                          textTransform: "uppercase", marginBottom: 2 }}>{k.code}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, lineHeight: 1.35 }}>{o.title}</div>
          </div>
        );
      } },
    { id: "kpa", label: "KPA", get: (o) => KPAS.find((k) => k.id === o.kpaId).code, filterable: true, width: 90 },
    { id: "owner", label: "Owner", get: (o) => userById(o.owner).name, filterable: true, width: 200,
      renderCell: (o) => {
        const u = userById(o.owner);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar userId={o.owner} size={22}/>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{u.name}</div>
              <div style={{ fontSize: 9, color: C.muted }}>{u.role}</div>
            </div>
          </div>
        );
      } },
    { id: "progress", label: "Progress", get: (o) => o.progress, width: 130, align: "right",
      renderCell: (o) => {
        const k = KPAS.find((x) => x.id === o.kpaId);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
            <div style={{ width: 56, height: 4, background: C.surfaceMute, borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${o.progress}%`, background: k.color, borderRadius: 100 }}/>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, minWidth: 32 }}>{o.progress}%</span>
          </div>
        );
      } },
    { id: "status", label: "Status", get: (o) => o.status, filterable: true, width: 110,
      renderCell: (o) => {
        const c = statusColor(o.status);
        return <Pill bg={c.bg} fg={c.fg}>{o.status}</Pill>;
      } },
  ];

  // ── Risk register columns ────────────────────────────────────────────────
  const riskCols = [
    { id: "code", label: "Ref", get: (r) => r.code, width: 80 },
    { id: "title", label: "Risk", get: (r) => r.title, minWidth: 320,
      renderCell: (r) => (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, lineHeight: 1.35 }}>{r.title}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>{r.mitigation}</div>
        </div>
      ) },
    { id: "owner", label: "Owner", get: (r) => userById(r.owner).name, filterable: true, width: 180,
      renderCell: (r) => {
        const u = userById(r.owner);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar userId={r.owner} size={22}/>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{u.name}</span>
          </div>
        );
      } },
    { id: "likelihood", label: "L", get: (r) => r.likelihood, width: 50, align: "right",
      renderCell: (r) => <span style={{ fontWeight: 700 }}>{r.likelihood}</span> },
    { id: "impact", label: "I", get: (r) => r.impact, width: 50, align: "right",
      renderCell: (r) => <span style={{ fontWeight: 700 }}>{r.impact}</span> },
    { id: "score", label: "Heat", get: (r) => riskScore(r), width: 100, align: "right",
      renderCell: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
          <span style={{ width: 16, height: 16, borderRadius: 4, background: riskColor(r), display: "inline-block" }}/>
          <span style={{ fontWeight: 700 }}>{riskScore(r)}</span>
        </div>
      ) },
    { id: "residual", label: "Residual", get: (r) => r.residual, filterable: true, width: 100,
      renderCell: (r) => <Pill bg={`${riskColor(r)}1f`} fg={riskColor(r)}>{r.residual}</Pill> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <ViewHeader
        title="IDP & Strategic Risk Alignment"
        subtitle={`${IDP_CYCLE.label} · ${IDP_CYCLE.reviewYear} · MEC rating: ${IDP_CYCLE.mecRating}`}
        action={
          <div style={{ display: "flex", gap: 6, background: C.surfaceMute, borderRadius: 4, padding: 3 }}>
            {[{ id: "objectives", label: "Objectives", icon: Flag20Regular },
              { id: "risks", label: "Risk register", icon: ShieldLock20Regular }].map((t) => (
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
            { icon: Add20Regular, label: tab === "risks" ? "New risk" : "New objective",
              onClick: () => toast(tab === "risks" ? "New risk" : "New objective", "Form opened") },
            { icon: Edit20Regular, label: "Edit", disabled: !selectedId, onClick: () => {} },
          ],
          [
            { icon: ClipboardTextLtr20Regular, label: "MEC assessment",
              onClick: () => toast("MEC assessment", IDP_CYCLE.mecComments) },
            { icon: Warning20Regular, label: "Risk heat map",
              onClick: () => toast("Risk heat map", "Open visual matrix") },
          ],
          [
            { right: true, icon: ArrowDownload20Regular, label: "Export PDF",
              onClick: () => toast("Exporting", "PDF queued") },
            { right: true, icon: ArrowDownload20Regular, label: "Export CSV",
              onClick: () => toast("Exporting", "CSV queued") },
          ],
        ]}/>}
      />
      {tab === "objectives" ? (
        <DataTable
          rows={state.objectives}
          columns={objCols}
          getKey={(o) => o.id}
          searchPlaceholder="Search objectives, owners, KPAs…"
          searchKeys={["code", "title"]}
          defaultSort={{ col: "code", dir: "asc" }}
          onRowClick={(o) => setSelectedId(o.id)}
          selectedKey={selectedId}
        />
      ) : (
        <DataTable
          rows={state.risks}
          columns={riskCols}
          getKey={(r) => r.id}
          searchPlaceholder="Search risks…"
          searchKeys={["code", "title"]}
          defaultSort={{ col: "score", dir: "desc" }}
        />
      )}
      {selected && tab === "objectives" && (
        <Drawer onClose={() => setSelectedId(null)} width={640}>
          <ObjectiveDrawer objective={selected} onClose={() => setSelectedId(null)}/>
        </Drawer>
      )}
    </div>
  );
}
