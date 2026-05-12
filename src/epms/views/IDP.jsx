// Module A — IDP (Integrated Development Plan) configuration.
//
// Six-tab hierarchy mirroring the Munsoft 7.3.2 IDP module:
//   Treasury (locked):     KPAs · Service Delivery Outcomes · IUDF
//   Municipal (editable):  Strategic Objectives · Performance Objectives · Master KPIs
//
// Strict sequential setup enforced: KPA → SO → PO → KPI Master. The first-run
// wizard walks an admin through this path. Treasury entities are read-only.

import { useContext, useState } from "react";
import {
  Flag20Regular, LockClosed20Regular, Add20Regular,
  Edit20Regular, ArrowDownload20Regular, CopyArrowRight20Regular,
  Dismiss20Regular, ClipboardTextLtr20Regular, CheckmarkCircle20Filled,
  ArrowRight20Regular, Sparkle20Regular, GlobeShield20Regular,
  BuildingMultiple20Regular, Target20Regular, Star20Filled,
  ArrowSync20Regular, Warning20Regular,
} from "@fluentui/react-icons";
import {
  I, C, Btn, Pill, Drawer, FormDrawer, DataTable,
  ViewHeader, CommandBar, Input, Select, useToast,
} from "../../components/index.js";
import { EPMSContext } from "../state.js";
import { Avatar } from "../Avatar.jsx";
import {
  KPAS, SERVICE_DELIVERY_OUTCOMES, IUDF_OUTCOMES,
  PROJECT_CATEGORIES, PROJECT_CATEGORY_RULES,
  SO_CATALOGUE, PO_CATALOGUE,
  IDP_CYCLE, userById,
} from "../data.js";
import {
  kpaWeight, soWeight, kpaBandStatus,
  idpReadinessChecks, idpReadinessSummary,
} from "../helpers.js";

const TABS = [
  { id: "kpa",    label: "KPAs",                    icon: Flag20Regular,             locked: true,  scope: "Treasury"  },
  { id: "sdo",    label: "Service Delivery",        icon: GlobeShield20Regular,      locked: true,  scope: "Treasury"  },
  { id: "iudf",   label: "IUDF",                    icon: BuildingMultiple20Regular, locked: true,  scope: "Treasury"  },
  { id: "so",     label: "Strategic Objectives",    icon: Target20Regular,           locked: false, scope: "Municipal" },
  { id: "po",     label: "Performance Objectives",  icon: Star20Filled,              locked: false, scope: "Municipal" },
  { id: "kpi",    label: "Master KPIs",             icon: Sparkle20Regular,          locked: false, scope: "Municipal" },
  { id: "health", label: "IDP Health",              icon: CheckmarkCircle20Filled,   locked: false, scope: "Readiness" },
];

const kpaById  = (id) => KPAS.find((k) => k.id === id);
const sdoById  = (id) => SERVICE_DELIVERY_OUTCOMES.find((s) => s.id === id);
const iudfById = (id) => IUDF_OUTCOMES.find((u) => u.id === id);

// ─── Tab strip ───────────────────────────────────────────────────────────────
function TabStrip({ active, onSelect }) {
  return (
    <div style={{
      display: "flex", gap: 4, padding: "0 22px",
      borderBottom: `1px solid ${C.hairline}`,
      background: "#fff", flexShrink: 0, overflowX: "auto",
    }}>
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onSelect(t.id)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: "12px 14px", fontSize: 13, fontFamily: "inherit", whiteSpace: "nowrap",
            color: isActive ? C.brand : C.muted, fontWeight: isActive ? 700 : 500,
            borderBottom: `2px solid ${isActive ? C.brand : "transparent"}`,
            marginBottom: -1, display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <I as={t.icon} size={15}/>
            <span>{t.label}</span>
            {t.locked && (
              <span title="Treasury-prescribed — read-only" style={{
                display: "inline-flex", alignItems: "center",
                color: isActive ? C.brand : C.faint,
              }}>
                <I as={LockClosed20Regular} size={12}/>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── KPA balance bar — at-a-glance allocation across the 5 KPAs ──────────────
// Each KPA shows its allocated % of municipal effort against its IDP band.
// Over-max is rendered red (hard-block territory); under-min is amber.
function KPABalanceBar({ objectives, bands }) {
  return (
    <div style={{
      margin: "12px 22px 0 22px", padding: "12px 14px",
      background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 4,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                       textTransform: "uppercase", letterSpacing: "0.5px" }}>
          KPA balance · resource allocation envelopes
        </span>
        <span style={{ fontSize: 11, color: C.muted }}>
          Allocated: <strong style={{ color: C.ink }}>
            {KPAS.reduce((s, k) => s + kpaWeight(k.id, objectives), 0)}%
          </strong> of 100%
        </span>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${KPAS.length}, 1fr)`,
        gap: 10,
      }}>
        {KPAS.map((k) => {
          const status = kpaBandStatus(k.id, objectives, bands);
          const band = status.band || { min: 0, max: 100 };
          const range = Math.max(band.max, status.current, 1);
          const widthPct = Math.min(100, (status.current / range) * 100);
          const minPct   = (band.min / range) * 100;
          const maxPct   = (band.max / range) * 100;
          const fill = status.state === "over"  ? C.danger
                     : status.state === "under" ? C.warning
                     :                            C.success;
          return (
            <div key={k.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: k.color,
                               letterSpacing: "0.4px", textTransform: "uppercase" }}>{k.code}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: fill }}>{status.current}%</span>
              </div>
              <div title={`${k.label} · target ${band.min}–${band.max}%`} style={{
                position: "relative", height: 8, background: C.surfaceMute,
                borderRadius: 100, overflow: "hidden",
              }}>
                {/* Target band shading */}
                <div style={{
                  position: "absolute", left: `${minPct}%`, width: `${maxPct - minPct}%`,
                  top: 0, bottom: 0, background: `${k.color}22`,
                }}/>
                {/* Actual allocation */}
                <div style={{
                  position: "absolute", left: 0, width: `${widthPct}%`,
                  top: 0, bottom: 0, background: fill, borderRadius: 100,
                  transition: "width 0.2s",
                }}/>
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                <span>Band {band.min}–{band.max}%</span>
                <span style={{ color: fill, fontWeight: 600 }}>
                  {status.state === "over"  ? "Over max" :
                   status.state === "under" ? "Under min" : "In band"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Inline projection chip used inside the SO / PO forms.
function WeightHint({ kind = "kpa", label, current, projected, max, blocked }) {
  const tone = blocked ? C.danger : projected > max ? C.danger : projected < (max * 0.5) ? C.warning : C.success;
  return (
    <div style={{
      background: blocked ? `${C.danger}10` : `${tone}10`,
      border: `1px solid ${tone}40`, borderRadius: 4,
      padding: "8px 12px", marginBottom: 12, fontSize: 12,
      color: C.ink, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
    }}>
      <strong style={{ color: tone }}>
        {kind === "kpa" ? "KPA" : "SO"} {label}:
      </strong>
      <span style={{ color: C.muted }}>{current}% → <strong style={{ color: tone }}>{projected}%</strong> (max {max}%)</span>
      {blocked && (
        <span style={{ color: C.danger, fontWeight: 700, marginLeft: "auto" }}>
          Cannot save — exceeds {kind === "kpa" ? "KPA envelope" : "parent SO allocation"}
        </span>
      )}
    </div>
  );
}

// ─── Sequential-prerequisite banner ──────────────────────────────────────────
function PrereqBanner({ message, onAction, actionLabel }) {
  return (
    <div style={{
      margin: "12px 22px 0 22px",
      background: C.warningBg, border: `1px solid ${C.warning}30`,
      borderRadius: 4, padding: "10px 14px",
      display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
    }}>
      <I as={ArrowRight20Regular} size={16} color={C.warning}/>
      <span style={{ fontSize: 12, color: C.ink, flex: 1, lineHeight: 1.4 }}>{message}</span>
      {onAction && actionLabel && (
        <Btn variant="ghost" size="sm" onClick={onAction}>{actionLabel}</Btn>
      )}
    </div>
  );
}

// ─── Treasury-locked drawer (KPAs / SDOs / IUDF) ─────────────────────────────
function LockedEntityDrawer({ row, kind, onClose }) {
  const { state } = useContext(EPMSContext);
  const linkedSOs  = kind === "kpa" ? state.objectives.filter((o) => o.kpaId === row.id) : [];
  const linkedKPIs = kind === "kpa" ? state.masterKpis.filter((k) => k.kpaId === row.id)
                  : kind === "sdo"  ? state.masterKpis.filter((k) => k.sdoId === row.id)
                  : /* iudf */         state.masterKpis.filter((k) => k.iudfId === row.id);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
                  background: C.surfaceAlt }}>
      <div style={{ padding: "18px 22px", background: "#fff", borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
                          marginBottom: 6, fontSize: 11, fontWeight: 700,
                          letterSpacing: "0.5px", textTransform: "uppercase", color: C.brand }}>
              <I as={LockClosed20Regular} size={12}/> {row.code} · Treasury-prescribed
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{row.label}</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted,
            display: "inline-flex", padding: 2,
          }}><I as={Dismiss20Regular} size={18}/></button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
        <div style={{
          background: C.brandTint, border: `1px solid ${C.brand}40`,
          borderRadius: 4, padding: "10px 12px", marginBottom: 16,
          fontSize: 12, color: C.ink, lineHeight: 1.5,
        }}>
          This parameter is locked at the tenant level. Mutating it would cause
          National Treasury portal ledger uploads to be rejected.
        </div>
        {kind === "kpa" && linkedSOs.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <SectionTitle>Strategic Objectives mapped to this KPA ({linkedSOs.length})</SectionTitle>
            {linkedSOs.map((o) => (
              <Card key={o.id}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{o.code}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{o.title}</div>
              </Card>
            ))}
          </div>
        )}
        <div>
          <SectionTitle>Master KPIs referencing this parameter ({linkedKPIs.length})</SectionTitle>
          {linkedKPIs.length === 0
            ? <Empty>No Master KPIs reference this parameter yet.</Empty>
            : linkedKPIs.map((k) => (
                <Card key={k.id}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{k.code} · {k.fy}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{k.title}</div>
                </Card>
              ))}
        </div>
      </div>
    </div>
  );
}

// ─── Strategic Objective drawer ──────────────────────────────────────────────
function SODrawer({ so, onClose }) {
  const { state } = useContext(EPMSContext);
  const kpa = kpaById(so.kpaId);
  const linkedPOs  = state.performanceObjectives.filter((p) => p.soId === so.id);
  const linkedKPIs = state.masterKpis.filter((k) => k.soId === so.id);
  const owner = userById(so.owner);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
                  background: C.surfaceAlt }}>
      <div style={{ padding: "18px 22px", background: "#fff", borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: kpa.color,
                          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
              {kpa.code} · {so.code}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{so.title}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{kpa.label}</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted,
            display: "inline-flex", padding: 2,
          }}><I as={Dismiss20Regular} size={18}/></button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12, marginBottom: 18,
        }}>
          <Field label="Owner">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar userId={so.owner} size={24}/>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{owner.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{owner.role}</div>
              </div>
            </div>
          </Field>
          <Field label="Weight">
            <span style={{ fontSize: 14, fontWeight: 700, color: kpa.color }}>{so.weight || 0}%</span>
            <span style={{ fontSize: 10, color: C.muted, marginLeft: 6 }}>of municipal effort</span>
          </Field>
          {so.baseline2022 && <Field label="Baseline (FY 2022)"><span style={{ fontSize: 12 }}>{so.baseline2022}</span></Field>}
          {so.target2027 && <Field label="2027 target"><span style={{ fontSize: 12 }}>{so.target2027}</span></Field>}
          {so.progress != null && (
            <Field label="Mid-year FY26/27">
              <div style={{ height: 8, background: C.surfaceMute, borderRadius: 100, overflow: "hidden", marginTop: 4 }}>
                <div style={{ height: "100%", width: `${so.progress}%`,
                              background: kpa.color, borderRadius: 100 }}/>
              </div>
            </Field>
          )}
        </div>
        <div style={{ marginBottom: 16 }}>
          <SectionTitle>Performance Objectives under this SO ({linkedPOs.length})</SectionTitle>
          {linkedPOs.length === 0
            ? <Empty>No Performance Objectives yet — create one to unlock KPI composition.</Empty>
            : linkedPOs.map((p) => (
                <Card key={p.id}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{p.code}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{p.title}</div>
                </Card>
              ))}
        </div>
        <div>
          <SectionTitle>Master KPIs derived from this SO ({linkedKPIs.length})</SectionTitle>
          {linkedKPIs.length === 0
            ? <Empty>No Master KPIs yet.</Empty>
            : linkedKPIs.map((k) => (
                <Card key={k.id}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{k.code} · {k.fy}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{k.title}</div>
                </Card>
              ))}
        </div>
      </div>
    </div>
  );
}

// ─── Performance Objective drawer ────────────────────────────────────────────
function PODrawer({ po, onClose }) {
  const { state } = useContext(EPMSContext);
  const kpa = kpaById(po.kpaId);
  const so  = state.objectives.find((o) => o.id === po.soId);
  const linkedKPIs = state.masterKpis.filter((k) => k.poId === po.id);
  const owner = userById(po.owner);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
                  background: C.surfaceAlt }}>
      <div style={{ padding: "18px 22px", background: "#fff", borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: kpa.color,
                          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
              {kpa.code} · {so?.code} · {po.code}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{po.title}</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted,
            display: "inline-flex", padding: 2,
          }}><I as={Dismiss20Regular} size={18}/></button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
        <div style={{ display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <Field label="Owner">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar userId={po.owner} size={24}/>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{owner.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{owner.role}</div>
              </div>
            </div>
          </Field>
          <Field label="Weight">
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{po.weight || 0}%</span>
            <span style={{ fontSize: 10, color: C.muted, marginLeft: 6 }}>
              of parent SO ({so?.weight || 0}%)
            </span>
          </Field>
        </div>
        <div style={{ marginTop: 18 }}>
          <SectionTitle>Master KPIs under this PO ({linkedKPIs.length})</SectionTitle>
          {linkedKPIs.length === 0
            ? <Empty>No Master KPIs yet — compose one to begin reporting.</Empty>
            : linkedKPIs.map((k) => (
                <Card key={k.id}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{k.code} · {k.fy}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{k.title}</div>
                </Card>
              ))}
        </div>
      </div>
    </div>
  );
}

// ─── Master KPI drawer ───────────────────────────────────────────────────────
function KPIDrawer({ kpi, onClose }) {
  const { state } = useContext(EPMSContext);
  const kpa  = kpaById(kpi.kpaId);
  const so   = state.objectives.find((o) => o.id === kpi.soId);
  const po   = state.performanceObjectives.find((p) => p.id === kpi.poId);
  const sdo  = sdoById(kpi.sdoId);
  const iudf = iudfById(kpi.iudfId);
  const owner = userById(kpi.owner);
  const idpKey = `${kpa?.code} | ${so?.code} | ${po?.code} | ${sdo?.code} | ${iudf?.code}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
                  background: C.surfaceAlt }}>
      <div style={{ padding: "18px 22px", background: "#fff", borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: kpa?.color,
                          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
              {kpi.code} · {kpi.fy}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{kpi.title}</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted,
            display: "inline-flex", padding: 2,
          }}><I as={Dismiss20Regular} size={18}/></button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
        <div style={{
          background: "#fff", border: `1px solid ${C.hairline}`,
          borderRadius: 4, padding: "12px 14px", marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted,
                        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
            IDP Master Key (composite)
          </div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: C.ink, wordBreak: "break-all" }}>
            {idpKey}
          </div>
        </div>
        <SectionTitle>Composition</SectionTitle>
        <Card><b>KPA:</b> {kpa?.code} — {kpa?.label}</Card>
        <Card><b>Strategic Objective:</b> {so?.code} — {so?.title}</Card>
        <Card><b>Performance Objective:</b> {po?.code} — {po?.title}</Card>
        <Card><b>Service Delivery Outcome:</b> {sdo?.code} — {sdo?.label}</Card>
        <Card><b>IUDF:</b> {iudf?.code} — {iudf?.label}</Card>

        <div style={{ marginTop: 18, display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <Field label="Target">
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
              {kpi.target} {kpi.unit}
            </span>
          </Field>
          <Field label="Baseline">
            <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>
              {kpi.baseline} {kpi.unit}
            </span>
          </Field>
          <Field label="Project category">
            <Pill bg={C.brandTint} fg={C.brand}>
              {PROJECT_CATEGORIES.find((c) => c.id === kpi.projectCategory)?.label || "—"}
            </Pill>
          </Field>
          <Field label="Owner">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar userId={kpi.owner} size={22}/>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{owner.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{owner.role}</div>
              </div>
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

// ─── Forms ───────────────────────────────────────────────────────────────────
// Mode pill used in adoption forms (Adopt from catalogue / Request custom).
function ModeToggle({ mode, setMode }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: 3, background: C.surfaceMute,
                  borderRadius: 4, marginBottom: 14 }}>
      {[
        { id: "adopt",  label: "Adopt from catalogue" },
        { id: "custom", label: "Request custom" },
      ].map((m) => (
        <button key={m.id} onClick={() => setMode(m.id)} style={{
          flex: 1, background: mode === m.id ? "#fff" : "transparent",
          border: "none", borderRadius: 3, padding: "6px 10px",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          color: mode === m.id ? C.brand : C.muted, fontFamily: "inherit",
          boxShadow: mode === m.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
        }}>{m.label}</button>
      ))}
    </div>
  );
}

function NewSOForm({ defaultKpaId, defaultCatalogueId, onClose, onCreated }) {
  const { state, dispatch } = useContext(EPMSContext);
  const toast = useToast();
  const [mode, setMode] = useState(defaultCatalogueId ? "adopt" : "adopt");
  const adoptedIds = new Set(state.objectives.map((o) => o.catalogueId).filter(Boolean));
  const [catalogueId, setCatalogueId] = useState(defaultCatalogueId || "");

  // Custom-mode fields (only used when mode === "custom")
  const [customKpaId, setCustomKpaId] = useState(defaultKpaId || "");
  const [customCode, setCustomCode] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  const [owner, setOwner] = useState("");
  const [weight, setWeight] = useState(5);

  const picked = catalogueId ? SO_CATALOGUE.find((c) => c.id === catalogueId) : null;
  const kpaId = mode === "adopt" ? (picked?.kpaId || "") : customKpaId;

  // Pre-fill suggested weight + default owner when picking a catalogue item.
  const pickCatalogue = (id) => {
    setCatalogueId(id);
    const item = SO_CATALOGUE.find((c) => c.id === id);
    if (item) {
      setWeight(item.suggestedWeight || 5);
      if (!owner) setOwner(item.defaultOwner || "");
    }
  };

  // Live KPA envelope check.
  const w = parseInt(weight, 10) || 0;
  const status = kpaId
    ? kpaBandStatus(kpaId, state.objectives, IDP_CYCLE.kpaBands, w)
    : null;
  const blocked = status?.state === "over";

  // Sort catalogue: uncovered KPAs first, then by code.
  const catalogueRows = SO_CATALOGUE.map((c) => {
    const adopted = adoptedIds.has(c.id);
    const kpaHasNoSO = state.objectives.filter((o) => o.kpaId === c.kpaId).length === 0;
    return { ...c, adopted, kpaHasNoSO };
  }).sort((a, b) => {
    if (a.adopted !== b.adopted) return a.adopted ? 1 : -1;
    if (a.kpaHasNoSO !== b.kpaHasNoSO) return a.kpaHasNoSO ? -1 : 1;
    return a.code.localeCompare(b.code);
  });

  const submit = () => {
    const useTitle = mode === "adopt" ? (picked?.title || "") : customTitle.trim();
    const useCode  = mode === "adopt" ? (picked?.code  || "") : customCode.trim();
    const useKpaId = kpaId;
    if (!useKpaId || !useCode || !useTitle || !owner) {
      toast("Missing details", "KPA, code, title and owner are required",
            { color: "#7a5700" });
      return;
    }
    if (mode === "adopt" && !picked) {
      toast("Pick a catalogue item", "", { color: "#7a5700" });
      return;
    }
    if (!w || w < 1) {
      toast("Weight required", "Assign at least 1% of municipal effort",
            { color: "#7a5700" });
      return;
    }
    if (blocked) {
      toast("Over-allocation blocked",
            `KPA total would be ${status.projected}% (max ${status.band.max}%). Reduce weight or another SO under this KPA.`,
            { color: C.danger, icon: <I as={Warning20Regular} size={16} color={C.danger}/> });
      return;
    }
    const so = {
      id: `so_${Date.now()}`,
      catalogueId: mode === "adopt" ? catalogueId : null,
      code: useCode, title: useTitle,
      kpaId: useKpaId, owner, weight: w,
      baseline2022: "", target2027: "",
      status: "On track", progress: 0, risks: [],
    };
    dispatch({ type: "ADD_SO", so });
    const toastTitle = status?.state === "under"
      ? `Adopted — KPA below floor (${status.projected}%)`
      : mode === "adopt" ? "Strategic Objective adopted" : "Custom Strategic Objective requested";
    toast(toastTitle, so.code,
          { icon: <I as={CheckmarkCircle20Filled} size={16} color="#107c10"/>, color: "#107c10" });
    if (onCreated) onCreated(so);
    onClose();
  };

  const kpaLabel = kpaId ? KPAS.find((k) => k.id === kpaId)?.code : "—";
  return (
    <FormDrawer title="Add Strategic Objective" onClose={onClose} width={560}
                footer={<>
                  <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                  <Btn disabled={blocked} onClick={submit}>
                    <I as={Add20Regular} size={14}/>
                    {mode === "adopt" ? "Adopt" : "Request custom"}
                  </Btn>
                </>}>
      <div style={{ padding: 20 }}>
        <FormIntro>
          The Strategic-Objective catalogue is provided centrally — municipalities
          adopt items, set weights and owners, and decline the rest. Request a
          custom SO only when no catalogue entry fits.
        </FormIntro>
        <ModeToggle mode={mode} setMode={setMode}/>

        {mode === "adopt" && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
              Pick from catalogue
            </div>
            <div style={{
              border: `1px solid ${C.hairline}`, borderRadius: 4,
              maxHeight: 240, overflow: "auto", background: "#fff", marginBottom: 14,
            }}>
              {catalogueRows.map((c) => {
                const k = kpaById(c.kpaId);
                const selected = c.id === catalogueId;
                return (
                  <button key={c.id}
                          disabled={c.adopted}
                          onClick={() => pickCatalogue(c.id)} style={{
                    width: "100%", textAlign: "left", border: "none",
                    background: selected ? `${k.color}12` : "transparent",
                    borderBottom: `1px solid ${C.hairline}`,
                    padding: "9px 12px",
                    cursor: c.adopted ? "not-allowed" : "pointer",
                    opacity: c.adopted ? 0.5 : 1,
                    fontFamily: "inherit",
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 4, background: k.color,
                      color: "#fff", display: "grid", placeItems: "center",
                      fontWeight: 700, fontSize: 10, flexShrink: 0,
                    }}>{k.code.replace("KPA ", "")}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: k.color, fontWeight: 700,
                                    letterSpacing: "0.4px" }}>{c.code}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.ink,
                                    lineHeight: 1.3 }}>{c.title}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                        Suggested weight {c.suggestedWeight}%
                        {c.kpaHasNoSO && !c.adopted && (
                          <span style={{ color: C.warning, fontWeight: 700, marginLeft: 8 }}>
                            · KPA not yet covered
                          </span>
                        )}
                      </div>
                    </div>
                    {c.adopted && (
                      <Pill bg={C.surfaceMute} fg={C.muted}>Already adopted</Pill>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === "custom" && (
          <>
            <Select label="Parent KPA" value={customKpaId}
                    onChange={(e) => setCustomKpaId(e.target.value)}
                    placeholder="Select a KPA…"
                    options={KPAS.map((k) => ({ value: k.id, label: `${k.code} · ${k.label}` }))}/>
            <Input label="SO code" value={customCode} onChange={(e) => setCustomCode(e.target.value)}
                   placeholder="e.g. SO 1.7"/>
            <Input label="Title" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                   placeholder="What outcome does this objective pursue?"/>
          </>
        )}

        <Input label="Weight (% of municipal effort / capital)" type="number"
               value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="5"/>
        {status && (
          <WeightHint
            kind="kpa"
            label={kpaLabel}
            current={status.current}
            projected={status.projected}
            max={status.band?.max ?? 100}
            blocked={blocked}/>
        )}
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

function NewPOForm({ defaultSoId, onClose, onCreated }) {
  const { state, dispatch } = useContext(EPMSContext);
  const toast = useToast();
  const sos = state.objectives;
  const [mode, setMode] = useState("adopt");
  const [soId, setSoId] = useState(defaultSoId || "");
  const [catalogueId, setCatalogueId] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [weight, setWeight] = useState(3);

  const parentSO = sos.find((o) => o.id === soId);
  const w = parseInt(weight, 10) || 0;
  const soAllocated = parentSO ? soWeight(parentSO.id, state.performanceObjectives) : 0;
  const soMax = parentSO ? (parentSO.weight || 0) : 0;
  const projected = soAllocated + w;
  const blocked = parentSO && projected > soMax;
  const under   = parentSO && projected < soMax;

  // PO catalogue filtered to the parent SO's catalogue entry, with already-
  // adopted items flagged.
  const adoptedPOIds = new Set(state.performanceObjectives.map((p) => p.catalogueId).filter(Boolean));
  const catalogueRows = parentSO?.catalogueId
    ? PO_CATALOGUE.filter((p) => p.soCatalogueId === parentSO.catalogueId)
        .map((p) => ({ ...p, adopted: adoptedPOIds.has(p.id) }))
    : [];

  const pickCatalogue = (id) => {
    setCatalogueId(id);
    const item = PO_CATALOGUE.find((p) => p.id === id);
    if (item) {
      setWeight(item.suggestedWeight || 3);
      if (!owner) setOwner(item.defaultOwner || "");
    }
  };

  const picked = catalogueId ? PO_CATALOGUE.find((p) => p.id === catalogueId) : null;

  const submit = () => {
    const useTitle = mode === "adopt" ? (picked?.title || "") : customTitle.trim();
    const useCode  = mode === "adopt" ? (picked?.code  || "") : customCode.trim();
    if (!soId || !useCode || !useTitle || !owner) {
      toast("Missing details", "Parent SO, code, title and owner are required",
            { color: "#7a5700" });
      return;
    }
    if (mode === "adopt" && !picked) {
      toast("Pick a catalogue item", "", { color: "#7a5700" });
      return;
    }
    if (!w || w < 1) {
      toast("Weight required", "Assign at least 1% within the parent SO",
            { color: "#7a5700" });
      return;
    }
    if (blocked) {
      toast("Over-allocation blocked",
            `Parent SO total would be ${projected}% (parent allocation ${soMax}%). Lower the PO weight or reduce a sibling PO.`,
            { color: C.danger, icon: <I as={Warning20Regular} size={16} color={C.danger}/> });
      return;
    }
    const po = {
      id: `po_${Date.now()}`,
      catalogueId: mode === "adopt" ? catalogueId : null,
      code: useCode, title: useTitle,
      soId, kpaId: parentSO.kpaId, owner, weight: w,
    };
    dispatch({ type: "ADD_PO", po });
    const toastTitle = under
      ? `Adopted — SO under-decomposed (${projected}% / ${soMax}%)`
      : mode === "adopt" ? "Performance Objective adopted" : "Custom Performance Objective requested";
    toast(toastTitle, po.code,
          { icon: <I as={CheckmarkCircle20Filled} size={16} color="#107c10"/>, color: "#107c10" });
    if (onCreated) onCreated(po);
    onClose();
  };

  // Sort parent-SO options: uncovered SOs first (no POs yet), then alphabetical.
  const sortedSOs = [...sos].sort((a, b) => {
    const aHas = state.performanceObjectives.some((p) => p.soId === a.id);
    const bHas = state.performanceObjectives.some((p) => p.soId === b.id);
    if (aHas !== bHas) return aHas ? 1 : -1;
    return a.code.localeCompare(b.code);
  });

  return (
    <FormDrawer title="Add Performance Objective" onClose={onClose} width={560}
                footer={<>
                  <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                  <Btn disabled={blocked} onClick={submit}>
                    <I as={Add20Regular} size={14}/>
                    {mode === "adopt" ? "Adopt" : "Request custom"}
                  </Btn>
                </>}>
      <div style={{ padding: 20 }}>
        <FormIntro>
          Each Performance Objective sits under one Strategic Objective. Pick a
          PO from the catalogue tied to the parent SO, or request a custom PO
          when no catalogue entry fits.
        </FormIntro>
        <ModeToggle mode={mode} setMode={setMode}/>

        <Select label="Parent Strategic Objective" value={soId}
                onChange={(e) => { setSoId(e.target.value); setCatalogueId(""); }}
                placeholder="Select a Strategic Objective…"
                options={sortedSOs.map((o) => {
                  const k = kpaById(o.kpaId);
                  const hasPO = state.performanceObjectives.some((p) => p.soId === o.id);
                  const flag = hasPO ? "" : " · uncovered";
                  return { value: o.id, label: `${k.code} · ${o.code} · ${o.title}${flag}` };
                })}/>

        {mode === "adopt" && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
              Catalogue PO under {parentSO?.code || "selected SO"}
            </div>
            <div style={{
              border: `1px solid ${C.hairline}`, borderRadius: 4,
              maxHeight: 220, overflow: "auto", background: "#fff", marginBottom: 14,
            }}>
              {!parentSO && (
                <div style={{ padding: "12px 14px", fontSize: 12, color: C.faint }}>
                  Pick a parent Strategic Objective first.
                </div>
              )}
              {parentSO && !parentSO.catalogueId && (
                <div style={{ padding: "12px 14px", fontSize: 12, color: C.muted }}>
                  Parent SO is a custom (non-catalogue) item — switch to "Request custom" below.
                </div>
              )}
              {parentSO && parentSO.catalogueId && catalogueRows.length === 0 && (
                <div style={{ padding: "12px 14px", fontSize: 12, color: C.muted }}>
                  No catalogue POs left under {parentSO.code}.
                </div>
              )}
              {catalogueRows.map((p) => {
                const selected = p.id === catalogueId;
                return (
                  <button key={p.id}
                          disabled={p.adopted}
                          onClick={() => pickCatalogue(p.id)} style={{
                    width: "100%", textAlign: "left", border: "none",
                    background: selected ? C.brandTint : "transparent",
                    borderBottom: `1px solid ${C.hairline}`,
                    padding: "9px 12px",
                    cursor: p.adopted ? "not-allowed" : "pointer",
                    opacity: p.adopted ? 0.5 : 1,
                    fontFamily: "inherit", fontSize: 12,
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>{p.code}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, lineHeight: 1.3 }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                        Suggested weight {p.suggestedWeight}%
                      </div>
                    </div>
                    {p.adopted && (
                      <Pill bg={C.surfaceMute} fg={C.muted}>Adopted</Pill>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === "custom" && (
          <>
            <Input label="PO code" value={customCode} onChange={(e) => setCustomCode(e.target.value)}
                   placeholder="e.g. PO 1.4.2"/>
            <Input label="Title" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                   placeholder="Decompose the SO into a measurable target…"/>
          </>
        )}

        <Input label="Weight (% within parent SO)" type="number"
               value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="3"/>
        {parentSO && (
          <WeightHint
            kind="so"
            label={parentSO.code}
            current={soAllocated}
            projected={projected}
            max={soMax}
            blocked={blocked}/>
        )}
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

function NewKPIForm({ defaultPoId, defaultSdoId, defaultIudfId, onClose, onCreated }) {
  const { state, dispatch } = useContext(EPMSContext);
  const toast = useToast();
  const pos = state.performanceObjectives;
  const [poId, setPoId] = useState(defaultPoId || "");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState("");
  const [target, setTarget] = useState("");
  const [baseline, setBaseline] = useState("");
  const [projectCategory, setProjectCategory] = useState("");
  const [sdoId, setSdoId] = useState(defaultSdoId || "");
  const [iudfId, setIudfId] = useState(defaultIudfId || "");
  const [fy, setFy] = useState("2026/27");
  const [owner, setOwner] = useState("");

  const parentPO = pos.find((p) => p.id === poId);
  const parentSO = parentPO ? state.objectives.find((o) => o.id === parentPO.soId) : null;
  const parentKpa = parentPO ? kpaById(parentPO.kpaId) : null;

  // Project-category-driven filtering of SDO / IUDF options.
  // When no category is picked the full Treasury lists are visible; once a
  // category is chosen the dropdowns are constrained to NT-valid combinations.
  const rule = projectCategory ? PROJECT_CATEGORY_RULES[projectCategory] : null;
  const sdoOptions  = (rule ? SERVICE_DELIVERY_OUTCOMES.filter((s) => rule.sdo.includes(s.id)) : SERVICE_DELIVERY_OUTCOMES)
                       .map((s) => ({ value: s.id, label: `${s.code} · ${s.label}` }));
  const iudfOptions = (rule ? IUDF_OUTCOMES.filter((u) => rule.iudf.includes(u.id)) : IUDF_OUTCOMES)
                       .map((u) => ({ value: u.id, label: `${u.code} · ${u.label}` }));

  // Clear SDO / IUDF the moment the project category narrows them out of range.
  // If a target SDO/IUDF was passed in (from a Health-tab Resolve action) and
  // the new category supports it, snap it back in.
  const pickCategory = (next) => {
    setProjectCategory(next);
    const r = next ? PROJECT_CATEGORY_RULES[next] : null;
    if (r) {
      let nextSdo = sdoId;
      let nextIudf = iudfId;
      if (nextSdo && !r.sdo.includes(nextSdo)) nextSdo = "";
      if (nextIudf && !r.iudf.includes(nextIudf)) nextIudf = "";
      if (!nextSdo && defaultSdoId && r.sdo.includes(defaultSdoId)) nextSdo = defaultSdoId;
      if (!nextIudf && defaultIudfId && r.iudf.includes(defaultIudfId)) nextIudf = defaultIudfId;
      setSdoId(nextSdo);
      setIudfId(nextIudf);
    }
  };

  // Coverage hint shown when this composer was opened from an IDP Health
  // Resolve action.
  const targetSdo  = defaultSdoId  ? sdoById(defaultSdoId)  : null;
  const targetIudf = defaultIudfId ? iudfById(defaultIudfId) : null;

  const submit = () => {
    if (!poId || !code.trim() || !title.trim() || !sdoId || !iudfId || !owner || !projectCategory) {
      toast("Missing details", "All composite parents, code, title, project category, and owner are required",
            { color: "#7a5700" });
      return;
    }
    const kpi = {
      id: `kpi_${Date.now()}`,
      code: code.trim(), title: title.trim(),
      kpaId: parentPO.kpaId, soId: parentPO.soId, poId,
      sdoId, iudfId, projectCategory,
      fy, unit: unit.trim(),
      target: target === "" ? null : Number(target),
      baseline: baseline === "" ? null : Number(baseline),
      owner,
    };
    dispatch({ type: "ADD_KPI", kpi });
    toast("Master KPI composed", `${kpi.code} · ${kpi.fy}`,
          { icon: <I as={CheckmarkCircle20Filled} size={16} color="#107c10"/>, color: "#107c10" });
    if (onCreated) onCreated(kpi);
    onClose();
  };

  return (
    <FormDrawer title="Compose Master KPI" onClose={onClose} width={560}
                footer={<>
                  <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                  <Btn onClick={submit}><I as={Add20Regular} size={14}/> Compose</Btn>
                </>}>
      <div style={{ padding: 20 }}>
        <FormIntro>
          The Master KPI is the composite Treasury key
          (KPA + Strategic Objective + Performance Objective + Service Delivery Outcome + IUDF).
          Pick a project category first — Treasury rulesets will constrain the SDO and IUDF options.
        </FormIntro>
        {(targetSdo || targetIudf) && (
          <div style={{
            background: C.warningBg, border: `1px solid ${C.warning}30`,
            borderRadius: 4, padding: "10px 12px", marginBottom: 14,
            fontSize: 12, color: C.ink, lineHeight: 1.5,
          }}>
            <strong style={{ color: C.warning }}>Coverage hint:</strong>{" "}
            this KPI is intended to close a gap on{" "}
            {targetSdo && <strong>{targetSdo.code} ({targetSdo.label})</strong>}
            {targetSdo && targetIudf && " and "}
            {targetIudf && <strong>{targetIudf.code} ({targetIudf.label})</strong>}.
            Pick a project category whose Treasury ruleset includes it and the field will pre-fill.
          </div>
        )}

        <Select label="Parent Performance Objective" value={poId}
                onChange={(e) => setPoId(e.target.value)}
                placeholder="Select a Performance Objective…"
                options={pos.map((p) => {
                  const k = kpaById(p.kpaId);
                  return { value: p.id, label: `${k.code} · ${p.code} · ${p.title}` };
                })}/>

        {parentPO && (
          <div style={{
            background: C.surfaceMute, borderRadius: 4, padding: "8px 12px",
            marginBottom: 12, fontSize: 11, color: C.muted, lineHeight: 1.5,
          }}>
            <strong style={{ color: C.ink }}>Inherited:</strong>{" "}
            {parentKpa.code} · {parentSO.code} · {parentPO.code}
          </div>
        )}

        <Select label="Project category" value={projectCategory}
                onChange={(e) => pickCategory(e.target.value)}
                placeholder="Select a project category…"
                options={PROJECT_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}/>
        {projectCategory && (
          <div style={{
            fontSize: 11, color: C.brand, marginTop: -8, marginBottom: 12,
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <I as={LockClosed20Regular} size={11}/>
            SDO / IUDF lists below are filtered to the {rule.sdo.length}/{rule.iudf.length} Treasury-valid combinations
            for this category.
          </div>
        )}

        <Select label="Service Delivery Outcome" value={sdoId}
                onChange={(e) => setSdoId(e.target.value)}
                placeholder={projectCategory ? "Select an SDO…" : "Pick a project category first to filter"}
                options={sdoOptions}/>
        <Select label="IUDF" value={iudfId}
                onChange={(e) => setIudfId(e.target.value)}
                placeholder={projectCategory ? "Select an IUDF…" : "Pick a project category first to filter"}
                options={iudfOptions}/>

        <Input label="KPI code" value={code} onChange={(e) => setCode(e.target.value)}
               placeholder="e.g. KPI 1.4.1"/>
        <Input label="Indicator title" value={title} onChange={(e) => setTitle(e.target.value)}
               placeholder="The metric this KPI measures…"/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Input label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%, units, R'000…"/>
          <Input label="Target" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0"/>
          <Input label="Baseline" value={baseline} onChange={(e) => setBaseline(e.target.value)} placeholder="0"/>
        </div>
        <Select label="Fiscal year" value={fy}
                onChange={(e) => setFy(e.target.value)}
                options={["2026/27","2027/28","2028/29"].map((y) => ({ value: y, label: y }))}/>
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

// Wizard step indicator pill.
function StepBadge({ n, label, active, done }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%",
        background: done ? C.success : active ? C.brand : C.surfaceMute,
        color: done || active ? "#fff" : C.muted,
        display: "grid", placeItems: "center",
        fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>{done ? <I as={CheckmarkCircle20Filled} size={13}/> : n}</div>
      <span style={{ fontSize: 11, fontWeight: 600,
                     color: active ? C.brand : C.muted, whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

// ─── Setup wizard (first-run + on-demand) ────────────────────────────────────
function SetupWizard({ onClose, onFinish }) {
  const { state } = useContext(EPMSContext);
  const [step, setStep] = useState(0);
  const [pickedKpa, setPickedKpa] = useState("");
  const [newSo, setNewSo] = useState(null);
  const [newPo, setNewPo] = useState(null);
  const [showSo, setShowSo] = useState(false);
  const [showPo, setShowPo] = useState(false);
  const [showKpi, setShowKpi] = useState(false);

  return (
    <>
      <FormDrawer title="IDP setup wizard" onClose={onClose} width={560}
                  footer={
                    <>
                      <Btn variant="secondary" onClick={onClose}>Close</Btn>
                      {step < 3
                        ? <Btn disabled={
                            (step === 0 && !pickedKpa) ||
                            (step === 1 && !newSo) ||
                            (step === 2 && !newPo)
                          } onClick={() => setStep(step + 1)}>
                            Next <I as={ArrowRight20Regular} size={14}/>
                          </Btn>
                        : <Btn onClick={() => { onFinish(); onClose(); }}>
                            <I as={CheckmarkCircle20Filled} size={14}/> Finish setup
                          </Btn>}
                    </>
                  }>
        <div style={{ padding: 20 }}>
          <div style={{
            display: "flex", gap: 12, marginBottom: 20,
            paddingBottom: 16, borderBottom: `1px solid ${C.hairline}`,
          }}>
            <StepBadge n={1} label="Pick KPA"  active={step === 0} done={step > 0}/>
            <StepBadge n={2} label="Add SO"    active={step === 1} done={step > 1}/>
            <StepBadge n={3} label="Add PO"    active={step === 2} done={step > 2}/>
            <StepBadge n={4} label="Compose KPI" active={step === 3} done={false}/>
          </div>

          {step === 0 && (
            <>
              <div style={{ fontSize: 13, color: C.ink, marginBottom: 14, lineHeight: 1.5 }}>
                Treasury prescribes the five Key Performance Areas below. Pick the one your first
                Strategic Objective belongs under. You can wire other KPAs later.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {KPAS.map((k) => (
                  <button key={k.id} onClick={() => setPickedKpa(k.id)} style={{
                    background: pickedKpa === k.id ? `${k.color}12` : "#fff",
                    border: `1px solid ${pickedKpa === k.id ? k.color : C.hairline}`,
                    borderRadius: 4, padding: "10px 12px", cursor: "pointer", textAlign: "left",
                    fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 4, background: k.color,
                      color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11,
                    }}>{k.code.replace("KPA ", "")}</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: k.color }}>{k.code}</div>
                      <div style={{ fontSize: 12, color: C.ink }}>{k.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div style={{ fontSize: 13, color: C.ink, marginBottom: 14, lineHeight: 1.5 }}>
                Create the first <strong>Strategic Objective</strong> under {kpaById(pickedKpa)?.code}.
                This is your municipality's custom target.
              </div>
              {newSo ? (
                <Card>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{newSo.code}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{newSo.title}</div>
                </Card>
              ) : (
                <Btn onClick={() => setShowSo(true)}><I as={Add20Regular} size={14}/> Add Strategic Objective</Btn>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 13, color: C.ink, marginBottom: 14, lineHeight: 1.5 }}>
                Decompose the SO into a measurable <strong>Performance Objective</strong>.
                Treasury enforces (KPA + SO) as the composite parent.
              </div>
              {newPo ? (
                <Card>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{newPo.code}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{newPo.title}</div>
                </Card>
              ) : (
                <Btn onClick={() => setShowPo(true)}><I as={Add20Regular} size={14}/> Add Performance Objective</Btn>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ fontSize: 13, color: C.ink, marginBottom: 14, lineHeight: 1.5 }}>
                Compose the first <strong>Master KPI</strong> by binding a Service Delivery Outcome
                and an IUDF priority to your PO. Treasury rulesets filter the available options
                based on the project category you pick.
              </div>
              <Btn onClick={() => setShowKpi(true)}><I as={Add20Regular} size={14}/> Compose Master KPI</Btn>
              {state.masterKpis.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: C.success,
                              display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <I as={CheckmarkCircle20Filled} size={14}/>
                  KPI composed — click "Finish setup".
                </div>
              )}
            </>
          )}
        </div>
      </FormDrawer>

      {showSo && (
        <NewSOForm
          defaultKpaId={pickedKpa}
          onClose={() => setShowSo(false)}
          onCreated={(so) => setNewSo(so)}/>
      )}
      {showPo && newSo && (
        <NewPOForm
          defaultSoId={newSo.id}
          onClose={() => setShowPo(false)}
          onCreated={(po) => setNewPo(po)}/>
      )}
      {showKpi && newPo && (
        <NewKPIForm
          defaultPoId={newPo.id}
          onClose={() => setShowKpi(false)}/>
      )}
    </>
  );
}

// ─── Copy-KPIs roll-forward dialog ───────────────────────────────────────────
function CopyKpisForm({ onClose }) {
  const { state, dispatch } = useContext(EPMSContext);
  const toast = useToast();
  const [sourceFy, setSourceFy] = useState("2026/27");
  const [targetFy, setTargetFy] = useState("2027/28");
  const [selected, setSelected] = useState(new Set());

  const sourceKpis = state.masterKpis.filter((k) => k.fy === sourceFy);
  const toggle = (id) => setSelected((s) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setSelected((s) =>
    s.size === sourceKpis.length ? new Set() : new Set(sourceKpis.map((k) => k.id)));

  const submit = () => {
    if (selected.size === 0) {
      toast("Pick at least one KPI to roll forward", "", { color: "#7a5700" });
      return;
    }
    if (sourceFy === targetFy) {
      toast("Choose different source and target fiscal years", "", { color: "#7a5700" });
      return;
    }
    dispatch({ type: "COPY_KPIS_FY", ids: [...selected], targetFy });
    toast(`Rolled forward ${selected.size} KPIs`, `${sourceFy} → ${targetFy}`,
          { icon: <I as={CheckmarkCircle20Filled} size={16} color="#107c10"/>, color: "#107c10" });
    onClose();
  };

  return (
    <FormDrawer title="Roll KPIs forward to next FY" onClose={onClose} width={560}
                footer={<>
                  <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                  <Btn onClick={submit}><I as={CopyArrowRight20Regular} size={14}/> Roll {selected.size} forward</Btn>
                </>}>
      <div style={{ padding: 20 }}>
        <FormIntro>
          Clone selected Master-KPI mappings from a source fiscal year to a target year.
          Composite parents and project bindings are preserved.
        </FormIntro>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Select label="Source FY" value={sourceFy}
                  onChange={(e) => { setSourceFy(e.target.value); setSelected(new Set()); }}
                  options={["2025/26","2026/27","2027/28"].map((y) => ({ value: y, label: y }))}/>
          <Select label="Target FY" value={targetFy}
                  onChange={(e) => setTargetFy(e.target.value)}
                  options={["2026/27","2027/28","2028/29"].map((y) => ({ value: y, label: y }))}/>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      marginTop: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: C.muted }}>
            {sourceKpis.length} KPI{sourceKpis.length === 1 ? "" : "s"} in {sourceFy}
          </div>
          <button onClick={toggleAll} style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.brand, fontSize: 11, fontFamily: "inherit", fontWeight: 600,
          }}>{selected.size === sourceKpis.length ? "Clear all" : "Select all"}</button>
        </div>
        <div style={{
          border: `1px solid ${C.hairline}`, borderRadius: 4,
          maxHeight: 280, overflow: "auto", background: "#fff",
        }}>
          {sourceKpis.length === 0
            ? <Empty>No KPIs in {sourceFy}.</Empty>
            : sourceKpis.map((k) => (
                <label key={k.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", cursor: "pointer",
                  borderBottom: `1px solid ${C.hairline}`,
                }}>
                  <input type="checkbox" checked={selected.has(k.id)} onChange={() => toggle(k.id)}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{k.code}</div>
                    <div style={{ fontSize: 12, color: C.ink, fontWeight: 600,
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {k.title}
                    </div>
                  </div>
                </label>
              ))}
        </div>
      </div>
    </FormDrawer>
  );
}

// ─── National Treasury export engine (PRTA / PROR / PRAD) ────────────────────
// Generates a stylized flat-text string per Master KPI in the convention of
// the Treasury IDP project string. The header line carries the budget phase.
function ntExportString(kpis, phaseCode, fy) {
  const lines = [`# ${phaseCode} export · FY ${fy} · ${kpis.length} record${kpis.length === 1 ? "" : "s"}`];
  for (const k of kpis) {
    const fields = [
      phaseCode,
      fy.replace("/", ""),
      k.kpaId.replace("kpa", "KPA"),
      k.soId,
      k.poId,
      k.sdoId.replace("sdo", "OUT"),
      k.iudfId.replace("iudf", "IUDF"),
      k.projectCategory,
      String(k.target ?? "").replace(/[^\d.]/g, ""),
      k.unit || "",
      k.code,
    ];
    lines.push(fields.join("|"));
  }
  return lines.join("\n");
}

function downloadText(name, body) {
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
}

// ─── IDP Health panel (readiness checklist) ─────────────────────────────────
const HEALTH_GROUPS = [
  { id: "kpa-cov",     label: "KPA coverage",                 hint: "Each KPA must have at least one Strategic Objective and Master KPI." },
  { id: "sdo-cov",     label: "Service Delivery coverage",    hint: "Every Treasury Service Delivery Outcome must be referenced by ≥1 KPI." },
  { id: "iudf-cov",    label: "IUDF coverage",                hint: "Every IUDF priority must be referenced by ≥1 KPI." },
  { id: "kpa-balance", label: "KPA balance",                  hint: "Each KPA's allocated effort must sit inside its IDP envelope." },
];

function ReadinessMeter({ summary, size = "md" }) {
  const fg = summary.pct === 100 ? C.success : summary.pct >= 75 ? C.brand : summary.pct >= 50 ? C.warning : C.danger;
  const pad = size === "sm" ? "3px 8px" : "5px 12px";
  const fs  = size === "sm" ? 11 : 12;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: `${fg}15`, color: fg, fontWeight: 700,
      borderRadius: 100, padding: pad, fontSize: fs,
    }}>
      IDP {summary.passed} / {summary.total} · {summary.pct}%
    </span>
  );
}

function IDPHealthPanel({ checks, onResolve }) {
  const summary = idpReadinessSummary(checks);
  const fg = summary.pct === 100 ? C.success : summary.pct >= 75 ? C.brand : summary.pct >= 50 ? C.warning : C.danger;
  return (
    <div style={{ flex: 1, overflow: "auto", padding: "16px 22px" }}>
      <div style={{
        background: "#fff", border: `1px solid ${fg}40`, borderRadius: 4,
        padding: "16px 18px", marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
              IDP readiness
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: fg }}>
              {summary.passed} of {summary.total} checks passing · {summary.pct}%
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              {summary.pct === 100
                ? "All Treasury coverage and balance gates are clear — the IDP can be exported."
                : `${summary.gaps} gap${summary.gaps === 1 ? "" : "s"} block the National Treasury (PRTA / PROR / PRAD) export.`}
            </div>
          </div>
          <div style={{ flex: "0 0 320px", maxWidth: "100%" }}>
            <div style={{ height: 10, background: C.surfaceMute, borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${summary.pct}%`,
                            background: fg, borderRadius: 100, transition: "width 0.3s" }}/>
            </div>
          </div>
        </div>
      </div>

      {HEALTH_GROUPS.map((g) => {
        const groupChecks = checks.filter((c) => c.group === g.id);
        const groupOk = groupChecks.filter((c) => c.status === "ok").length;
        return (
          <div key={g.id} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
                          marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{g.label}</div>
              <div style={{ fontSize: 11, color: C.muted }}>
                {groupOk} / {groupChecks.length} passing
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{g.hint}</div>
            <div style={{ background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 4,
                          overflow: "hidden" }}>
              {groupChecks.map((c, i) => {
                const ok = c.status === "ok";
                return (
                  <div key={c.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px",
                    borderTop: i === 0 ? "none" : `1px solid ${C.hairline}`,
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: ok ? C.successBg : C.warningBg,
                      color: ok ? C.success : C.warning,
                      display: "grid", placeItems: "center", flexShrink: 0,
                    }}>
                      <I as={ok ? CheckmarkCircle20Filled : Warning20Regular} size={13}/>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{c.label}</div>
                      <div style={{ fontSize: 11, color: ok ? C.muted : C.warning }}>{c.details}</div>
                    </div>
                    {!ok && (
                      <Btn variant="secondary" size="sm" onClick={() => onResolve(c)}>
                        Resolve <I as={ArrowRight20Regular} size={12}/>
                      </Btn>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Layout helpers ──────────────────────────────────────────────────────────
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
function FormIntro({ children }) {
  return (
    <div style={{
      background: C.brandTint, border: `1px solid ${C.brand}40`,
      borderRadius: 4, padding: "10px 12px", marginBottom: 14,
      fontSize: 12, color: C.ink, lineHeight: 1.5,
    }}>{children}</div>
  );
}
function Card({ children }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.hairline}`,
      borderRadius: 4, padding: "10px 12px", marginBottom: 6,
      fontSize: 12, color: C.ink, lineHeight: 1.5,
    }}>{children}</div>
  );
}

// ─── IDP View — main component ───────────────────────────────────────────────
export function IDPView() {
  const { state } = useContext(EPMSContext);
  const toast = useToast();
  const [tab, setTab] = useState("kpa");
  const [selectedId, setSelectedId] = useState(null);

  // Composer defaults — set by Resolve actions on the IDP Health tab so the
  // composers open already pointing at the gap that needs filling.
  const [newSoDefaultKpa, setNewSoDefaultKpa] = useState("");
  const [newKpiDefaultSdo, setNewKpiDefaultSdo] = useState("");
  const [newKpiDefaultIudf, setNewKpiDefaultIudf] = useState("");

  const [showNewSo, setShowNewSo] = useState(false);
  const [showNewPo, setShowNewPo] = useState(false);
  const [showNewKpi, setShowNewKpi] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  // Auto-open the setup wizard the first time someone lands on the IDP view
  // with no Master KPIs configured (Munsoft sequential setup mandate). Seeded
  // at first render so it doesn't reopen if the user later deletes all KPIs.
  const [showWizard, setShowWizard] = useState(() => state.masterKpis.length === 0);

  const tabMeta = TABS.find((t) => t.id === tab);
  const hasSOs = state.objectives.length > 0;
  const hasPOs = state.performanceObjectives.length > 0;

  // IDP readiness — drives the meter, the Health tab, and the export gate.
  const checks = idpReadinessChecks({
    objectives: state.objectives,
    performanceObjectives: state.performanceObjectives,
    masterKpis: state.masterKpis,
    kpas: KPAS,
    sdos: SERVICE_DELIVERY_OUTCOMES,
    iudfs: IUDF_OUTCOMES,
    bands: IDP_CYCLE.kpaBands,
  });
  const summary = idpReadinessSummary(checks);

  const openSoComposer = (kpaId = "") => {
    setNewSoDefaultKpa(kpaId);
    setShowNewSo(true);
  };
  const openKpiComposer = ({ sdoId = "", iudfId = "" } = {}) => {
    if (!hasPOs) {
      setTab("po");
      toast("Create a Performance Objective first", "Master KPIs must sit under a PO.",
            { color: "#7a5700" });
      return;
    }
    setNewKpiDefaultSdo(sdoId);
    setNewKpiDefaultIudf(iudfId);
    setShowNewKpi(true);
  };

  const resolveCheck = (check) => {
    const { kind, filters } = check.resolve || {};
    if (kind === "so-picker") {
      openSoComposer(filters?.kpaId || "");
    } else if (kind === "kpi-composer") {
      openKpiComposer({ sdoId: filters?.sdoId, iudfId: filters?.iudfId });
    }
  };

  // Export gate — refuse to download when readiness < 100%.
  const guardedExport = (phase) => () => {
    if (summary.pct < 100) {
      const firstGap = checks.find((c) => c.status === "gap");
      toast("Export blocked",
            `${summary.gaps} IDP readiness gap${summary.gaps === 1 ? "" : "s"} remaining. First: ${firstGap?.label}.`,
            { color: C.danger, icon: <I as={Warning20Regular} size={16} color={C.danger}/> });
      setTab("health");
      return;
    }
    const body = ntExportString(state.masterKpis, phase, "2026/27");
    downloadText(`${phase}_2026-27.txt`, body);
    toast(`${phase} exported`, `${state.masterKpis.length} records`,
          { color: "#107c10", icon: <I as={CheckmarkCircle20Filled} size={16} color="#107c10"/> });
  };

  const rows = (() => {
    switch (tab) {
      case "kpa":  return KPAS;
      case "sdo":  return SERVICE_DELIVERY_OUTCOMES;
      case "iudf": return IUDF_OUTCOMES;
      case "so":   return state.objectives;
      case "po":   return state.performanceObjectives;
      case "kpi":  return state.masterKpis;
      default:     return [];
    }
  })();

  const selected = selectedId ? rows.find((r) => r.id === selectedId) : null;

  // ── Column definitions per tab ─────────────────────────────────────────────
  const lockedCol = {
    id: "lock", label: "", get: () => "", width: 38, sortable: false,
    renderCell: () => (
      <span title="Treasury-prescribed — read-only" style={{
        color: C.faint, display: "inline-flex", alignItems: "center",
      }}><I as={LockClosed20Regular} size={13}/></span>
    ),
  };

  const kpaCols = [
    lockedCol,
    { id: "code", label: "Code", get: (r) => r.code, width: 100,
      renderCell: (r) => <span style={{ fontWeight: 700, color: r.color }}>{r.code}</span> },
    { id: "label", label: "Key Performance Area", get: (r) => r.label, minWidth: 380 },
    { id: "linked", label: "Strategic Objectives", get: (r) => state.objectives.filter((o) => o.kpaId === r.id).length,
      width: 180, align: "right",
      renderCell: (r) => {
        const n = state.objectives.filter((o) => o.kpaId === r.id).length;
        return <span style={{ fontWeight: 700, color: n ? C.ink : C.faint }}>{n}</span>;
      } },
  ];

  const sdoCols = [
    lockedCol,
    { id: "code", label: "Code", get: (r) => r.code, width: 110,
      renderCell: (r) => <span style={{ fontWeight: 700, color: C.brand }}>{r.code}</span> },
    { id: "label", label: "Service Delivery Outcome", get: (r) => r.label, minWidth: 460 },
    { id: "kpi",  label: "KPIs", get: (r) => state.masterKpis.filter((k) => k.sdoId === r.id).length,
      width: 100, align: "right",
      renderCell: (r) => {
        const n = state.masterKpis.filter((k) => k.sdoId === r.id).length;
        return <span style={{ fontWeight: 700, color: n ? C.ink : C.faint }}>{n}</span>;
      } },
  ];

  const iudfCols = [
    lockedCol,
    { id: "code", label: "Code", get: (r) => r.code, width: 110,
      renderCell: (r) => <span style={{ fontWeight: 700, color: C.brandDark || C.brand }}>{r.code}</span> },
    { id: "label", label: "IUDF priority", get: (r) => r.label, minWidth: 380 },
    { id: "kpi",  label: "KPIs", get: (r) => state.masterKpis.filter((k) => k.iudfId === r.id).length,
      width: 100, align: "right",
      renderCell: (r) => {
        const n = state.masterKpis.filter((k) => k.iudfId === r.id).length;
        return <span style={{ fontWeight: 700, color: n ? C.ink : C.faint }}>{n}</span>;
      } },
  ];

  const soCols = [
    { id: "code", label: "Code", get: (o) => o.code, width: 90 },
    { id: "title", label: "Strategic Objective", get: (o) => o.title, minWidth: 320,
      renderCell: (o) => {
        const k = kpaById(o.kpaId);
        return (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: k.color, letterSpacing: "0.5px",
                          textTransform: "uppercase", marginBottom: 2 }}>{k.code}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, lineHeight: 1.35 }}>{o.title}</div>
          </div>
        );
      } },
    { id: "kpa", label: "KPA", get: (o) => kpaById(o.kpaId).code, filterable: true, width: 90 },
    { id: "weight", label: "Weight", get: (o) => o.weight || 0, width: 90, align: "right",
      renderCell: (o) => {
        const k = kpaById(o.kpaId);
        return <span style={{ fontWeight: 700, color: k.color }}>{o.weight || 0}%</span>;
      } },
    { id: "po", label: "POs", get: (o) => state.performanceObjectives.filter((p) => p.soId === o.id).length,
      width: 70, align: "right" },
    { id: "kpi", label: "KPIs", get: (o) => state.masterKpis.filter((k) => k.soId === o.id).length,
      width: 80, align: "right" },
    { id: "owner", label: "Owner", get: (o) => userById(o.owner).name, filterable: true, width: 180,
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
  ];

  const poCols = [
    { id: "code", label: "Code", get: (p) => p.code, width: 110 },
    { id: "title", label: "Performance Objective", get: (p) => p.title, minWidth: 360 },
    { id: "so", label: "Parent SO", get: (p) => {
        const so = state.objectives.find((o) => o.id === p.soId);
        return so ? so.code : "—";
      }, filterable: true, width: 100 },
    { id: "kpa", label: "KPA", get: (p) => kpaById(p.kpaId).code, filterable: true, width: 90 },
    { id: "weight", label: "Weight", get: (p) => p.weight || 0, width: 90, align: "right",
      renderCell: (p) => <span style={{ fontWeight: 700 }}>{p.weight || 0}%</span> },
    { id: "kpi", label: "KPIs", get: (p) => state.masterKpis.filter((k) => k.poId === p.id).length,
      width: 80, align: "right" },
    { id: "owner", label: "Owner", get: (p) => userById(p.owner).name, filterable: true, width: 180,
      renderCell: (p) => {
        const u = userById(p.owner);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar userId={p.owner} size={22}/>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{u.name}</span>
          </div>
        );
      } },
  ];

  const kpiCols = [
    { id: "code", label: "KPI", get: (k) => k.code, width: 110,
      renderCell: (k) => <span style={{ fontWeight: 700, color: C.brand }}>{k.code}</span> },
    { id: "title", label: "Indicator", get: (k) => k.title, minWidth: 320 },
    { id: "kpa",  label: "KPA",  get: (k) => kpaById(k.kpaId).code, filterable: true, width: 80 },
    { id: "so",   label: "SO",   get: (k) => state.objectives.find((o) => o.id === k.soId)?.code || "—",
      filterable: true, width: 90 },
    { id: "po",   label: "PO",   get: (k) => state.performanceObjectives.find((p) => p.id === k.poId)?.code || "—",
      filterable: true, width: 100 },
    { id: "sdo",  label: "SDO",  get: (k) => sdoById(k.sdoId)?.code || "—", filterable: true, width: 110 },
    { id: "iudf", label: "IUDF", get: (k) => iudfById(k.iudfId)?.code || "—", filterable: true, width: 90 },
    { id: "fy",   label: "FY",   get: (k) => k.fy, filterable: true, width: 90 },
    { id: "target", label: "Target", get: (k) => k.target ?? -Infinity, width: 110, align: "right",
      renderCell: (k) => <span style={{ fontWeight: 600 }}>{k.target} {k.unit}</span> },
  ];

  const cols = ({ kpa: kpaCols, sdo: sdoCols, iudf: iudfCols, so: soCols, po: poCols, kpi: kpiCols })[tab];

  // ── Command-bar actions per tab ────────────────────────────────────────────
  const commandGroups = (() => {
    if (tab === "kpa" || tab === "sdo" || tab === "iudf") {
      return [
        [
          { icon: LockClosed20Regular, label: "Treasury-locked",
            onClick: () => toast("Read-only", "Treasury-prescribed parameters cannot be edited.") },
        ],
        [
          { icon: Sparkle20Regular, label: "Run setup wizard",
            onClick: () => setShowWizard(true) },
        ],
        [
          { right: true, icon: ArrowDownload20Regular, label: "Export CSV",
            onClick: () => toast("Exporting", "CSV queued") },
        ],
      ];
    }
    if (tab === "so") {
      return [
        [
          { icon: Add20Regular, label: "New Strategic Objective",
            onClick: () => setShowNewSo(true) },
          { icon: Edit20Regular, label: "Edit", disabled: !selectedId, onClick: () => {} },
        ],
        [
          { icon: Sparkle20Regular, label: "Run setup wizard",
            onClick: () => setShowWizard(true) },
        ],
        [
          { right: true, icon: ArrowDownload20Regular, label: "Export CSV",
            onClick: () => toast("Exporting", "CSV queued") },
        ],
      ];
    }
    if (tab === "po") {
      return [
        [
          { icon: Add20Regular, label: "New Performance Objective",
            disabled: !hasSOs,
            onClick: () => hasSOs && setShowNewPo(true) },
          { icon: Edit20Regular, label: "Edit", disabled: !selectedId, onClick: () => {} },
        ],
        [
          { icon: Sparkle20Regular, label: "Run setup wizard",
            onClick: () => setShowWizard(true) },
        ],
        [
          { right: true, icon: ArrowDownload20Regular, label: "Export CSV",
            onClick: () => toast("Exporting", "CSV queued") },
        ],
      ];
    }
    // kpi
    return [
      [
        { icon: Add20Regular, label: "Compose Master KPI",
          disabled: !hasPOs,
          onClick: () => hasPOs && setShowNewKpi(true) },
        { icon: Edit20Regular, label: "Edit", disabled: !selectedId, onClick: () => {} },
      ],
      [
        { icon: CopyArrowRight20Regular, label: "Roll forward to next FY",
          disabled: state.masterKpis.length === 0,
          onClick: () => setShowCopy(true) },
        { icon: Sparkle20Regular, label: "Run setup wizard",
          onClick: () => setShowWizard(true) },
      ],
      [
        { right: true, icon: ArrowDownload20Regular, label: "Tabled IDP (PRTA)",
          disabled: summary.pct < 100, onClick: guardedExport("PRTA") },
        { right: true, icon: ArrowDownload20Regular, label: "Original IDP (PROR)",
          disabled: summary.pct < 100, onClick: guardedExport("PROR") },
        { right: true, icon: ArrowDownload20Regular, label: "Adjusted IDP (PRAD)",
          disabled: summary.pct < 100, onClick: guardedExport("PRAD") },
      ],
    ];
  })();

  // ── Drawer routing by tab ──────────────────────────────────────────────────
  const drawerFor = (row) => {
    if (!row) return null;
    if (tab === "kpa")  return <LockedEntityDrawer row={row} kind="kpa"  onClose={() => setSelectedId(null)}/>;
    if (tab === "sdo")  return <LockedEntityDrawer row={row} kind="sdo"  onClose={() => setSelectedId(null)}/>;
    if (tab === "iudf") return <LockedEntityDrawer row={row} kind="iudf" onClose={() => setSelectedId(null)}/>;
    if (tab === "so")   return <SODrawer  so={row}  onClose={() => setSelectedId(null)}/>;
    if (tab === "po")   return <PODrawer  po={row}  onClose={() => setSelectedId(null)}/>;
    if (tab === "kpi")  return <KPIDrawer kpi={row} onClose={() => setSelectedId(null)}/>;
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <ViewHeader
        title="IDP & Performance Framework"
        subtitle={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>{IDP_CYCLE.label} · {IDP_CYCLE.reviewYear}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <ReadinessMeter summary={summary} size="sm"/>
            {summary.pct < 100 && tab !== "health" && (
              <button onClick={() => setTab("health")} style={{
                background: "none", border: "none", cursor: "pointer",
                color: C.brand, fontFamily: "inherit", fontSize: 11, fontWeight: 600, padding: 0,
              }}>
                See {summary.gaps} gap{summary.gaps === 1 ? "" : "s"} →
              </button>
            )}
          </span>
        }
        action={tab === "kpi" && state.masterKpis.length === 0
          ? <Btn onClick={() => setShowWizard(true)}><I as={Sparkle20Regular} size={14}/> Run setup wizard</Btn>
          : null}
        commandBar={<CommandBar groups={commandGroups}/>}
      />
      <TabStrip active={tab} onSelect={(id) => { setTab(id); setSelectedId(null); }}/>

      {(tab === "kpa" || tab === "so") && (
        <KPABalanceBar objectives={state.objectives} bands={IDP_CYCLE.kpaBands}/>
      )}

      {tab === "po" && !hasSOs && (
        <PrereqBanner
          message="A Performance Objective must sit under a Strategic Objective. Create at least one SO first."
          actionLabel="Go to Strategic Objectives"
          onAction={() => setTab("so")}/>
      )}
      {tab === "kpi" && !hasPOs && (
        <PrereqBanner
          message="A Master KPI must sit under a Performance Objective. Create at least one PO first."
          actionLabel="Go to Performance Objectives"
          onAction={() => setTab("po")}/>
      )}

      {tab === "health" ? (
        <IDPHealthPanel checks={checks} onResolve={resolveCheck}/>
      ) : (
        <DataTable
          rows={rows}
          columns={cols}
          getKey={(r) => r.id}
          searchPlaceholder={`Search ${tabMeta?.label?.toLowerCase()}…`}
          searchKeys={["code", "title", "label"]}
          defaultSort={{ col: "code", dir: "asc" }}
          onRowClick={(r) => setSelectedId(r.id)}
          selectedKey={selectedId}
          emptyMessage={
            tab === "po"  ? "No Performance Objectives yet."
          : tab === "kpi" ? "No Master KPIs yet — run the setup wizard to compose your first."
          : tab === "so"  ? "No Strategic Objectives yet."
          : "No records."
          }
        />
      )}

      {selected && (
        <Drawer onClose={() => setSelectedId(null)} width={640}>
          {drawerFor(selected)}
        </Drawer>
      )}

      {showNewSo  && (
        <NewSOForm
          defaultKpaId={newSoDefaultKpa}
          onClose={() => { setShowNewSo(false); setNewSoDefaultKpa(""); }}/>
      )}
      {showNewPo  && <NewPOForm  onClose={() => setShowNewPo(false)}/>}
      {showNewKpi && (
        <NewKPIForm
          defaultSdoId={newKpiDefaultSdo}
          defaultIudfId={newKpiDefaultIudf}
          onClose={() => {
            setShowNewKpi(false);
            setNewKpiDefaultSdo("");
            setNewKpiDefaultIudf("");
          }}/>
      )}
      {showCopy   && <CopyKpisForm onClose={() => setShowCopy(false)}/>}
      {showWizard && (
        <SetupWizard
          onClose={() => setShowWizard(false)}
          onFinish={() => { setTab("kpi"); toast("Setup complete", "Master KPI catalogue initialised",
                                              { color: "#107c10",
                                                icon: <I as={CheckmarkCircle20Filled} size={16} color="#107c10"/> }); }}/>
      )}
    </div>
  );
}
