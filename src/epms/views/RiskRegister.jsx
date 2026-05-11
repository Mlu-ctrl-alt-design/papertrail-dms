// Strategic Risk Register — extracted from IDP so it stands as its own top-level
// nav item. Each risk has an L (likelihood) × I (impact) heat score and links to
// its mitigating Strategic Objectives where applicable.

import { useContext, useState } from "react";
import {
  ShieldLock20Regular, Add20Regular, Edit20Regular,
  Warning20Regular, ArrowDownload20Regular, Dismiss20Regular,
} from "@fluentui/react-icons";
import {
  I, C, Btn, Pill, Drawer, DataTable,
  ViewHeader, CommandBar, useToast,
} from "../../components/index.js";
import { EPMSContext } from "../state.js";
import { Avatar } from "../Avatar.jsx";
import { userById } from "../data.js";
import { riskScore, riskColor } from "../helpers.js";

function RiskDrawer({ risk, onClose }) {
  const { state } = useContext(EPMSContext);
  const owner = userById(risk.owner);
  const linkedSOs = state.objectives.filter((o) => o.risks?.includes(risk.id));
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
                  background: C.surfaceAlt }}>
      <div style={{ padding: "18px 22px", background: "#fff", borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.brand,
                          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
              {risk.code}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{risk.title}</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted,
            display: "inline-flex", padding: 2,
          }}><I as={Dismiss20Regular} size={18}/></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <Pill bg={`${riskColor(risk)}1f`} fg={riskColor(risk)}>Residual: {risk.residual}</Pill>
          <Pill bg={C.surfaceMute} fg={C.text} uppercase={false}>L {risk.likelihood} · I {risk.impact} · Score {riskScore(risk)}</Pill>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
        <Section label="Owner">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar userId={risk.owner} size={24}/>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{owner.name}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{owner.role}</div>
            </div>
          </div>
        </Section>
        <Section label="Mitigation plan">
          <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.5 }}>{risk.mitigation}</div>
        </Section>
        <Section label={`Strategic Objectives mitigating this risk (${linkedSOs.length})`}>
          {linkedSOs.length === 0
            ? <span style={{ fontSize: 12, color: C.faint, fontStyle: "italic" }}>None linked.</span>
            : linkedSOs.map((o) => (
                <div key={o.id} style={{
                  background: "#fff", border: `1px solid ${C.hairline}`,
                  borderRadius: 4, padding: "10px 12px", marginBottom: 6,
                }}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{o.code}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{o.title}</div>
                </div>
              ))}
        </Section>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

export function RiskRegisterView() {
  const { state } = useContext(EPMSContext);
  const toast = useToast();
  const [selectedId, setSelectedId] = useState(null);
  const selected = selectedId ? state.risks.find((r) => r.id === selectedId) : null;

  const cols = [
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
    { id: "score", label: "Heat", get: (r) => riskScore(r), width: 110, align: "right",
      renderCell: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
          <span style={{ width: 16, height: 16, borderRadius: 4, background: riskColor(r), display: "inline-block" }}/>
          <span style={{ fontWeight: 700 }}>{riskScore(r)}</span>
        </div>
      ) },
    { id: "residual", label: "Residual", get: (r) => r.residual, filterable: true, width: 110,
      renderCell: (r) => <Pill bg={`${riskColor(r)}1f`} fg={riskColor(r)}>{r.residual}</Pill> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <ViewHeader
        title="Strategic Risk Register"
        subtitle={`${state.risks.length} risks tracked · L × I heat scored · linked to Strategic Objectives`}
        action={<Btn onClick={() => toast("New risk", "Form opened")}><I as={Add20Regular} size={14}/> New risk</Btn>}
        commandBar={<CommandBar groups={[
          [
            { icon: Add20Regular, label: "New risk", onClick: () => toast("New risk", "Form opened") },
            { icon: Edit20Regular, label: "Edit", disabled: !selectedId, onClick: () => {} },
          ],
          [
            { icon: Warning20Regular, label: "Risk heat map",
              onClick: () => toast("Risk heat map", "Open visual matrix") },
            { icon: ShieldLock20Regular, label: "Mitigation review",
              onClick: () => toast("Mitigation review", "Quarterly cadence — next 30 Jun") },
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
        rows={state.risks}
        columns={cols}
        getKey={(r) => r.id}
        searchPlaceholder="Search risks, owners, mitigations…"
        searchKeys={["code", "title", "mitigation"]}
        defaultSort={{ col: "score", dir: "desc" }}
        onRowClick={(r) => setSelectedId(r.id)}
        selectedKey={selectedId}
      />
      {selected && (
        <Drawer onClose={() => setSelectedId(null)} width={620}>
          <RiskDrawer risk={selected} onClose={() => setSelectedId(null)}/>
        </Drawer>
      )}
    </div>
  );
}
