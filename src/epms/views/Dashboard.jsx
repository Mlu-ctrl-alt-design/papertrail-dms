// Dashboard — landing screen for the Mayor / MM personae.
// Numbers are tuned to the demo script: Top-Layer SDBIP 62% YTD, mSCOA spend
// R287m of R461m, R487m outstanding debt, 3.4/5 average performance across
// 412 employees, KPA3 Financial Viability red at 54%, Q3 trend 41 → 58 → 62
// projected 78% against 80% target. Targets Requiring Attention links into
// the 5-step cascade view.

import { useContext } from "react";
import {
  Building20Regular, Money20Regular, PersonAvailable20Regular,
  DataHistogram20Regular, ChevronRight20Regular,
  Warning20Regular, Calendar20Regular,
  Star20Filled,
} from "@fluentui/react-icons";
import {
  I, C, Pill, Btn, ViewHeader, CommandBar,
} from "../../components/index.js";
import { EPMSContext } from "../state.js";
import { Avatar } from "../Avatar.jsx";
import { MUNICIPALITY, KPAS, userById } from "../data.js";
import { formatZAR, fmtDate, daysFrom, tNote } from "../helpers.js";
import { setIntent } from "../intents.js";

// ─── Demo-script overrides (mid-year FY26/27 snapshot) ────────────────────────
const KPA_PROGRESS = {
  kpa1: { value: 66, status: "amber" },
  kpa2: { value: 70, status: "amber" },
  kpa3: { value: 54, status: "red"   },
  kpa4: { value: 85, status: "green" },
  kpa5: { value: 84, status: "green" },
};
const TOP_LAYER_SDBIP_YTD   = 62;
const TOP_LAYER_PROJECTED   = 78;
const TOP_LAYER_TARGET      = 80;
const MSCOA_SPEND           = 287_000_000;
const MSCOA_BUDGET          = 461_000_000;
const STAFF_PERF_AVERAGE    = 3.4;
const QTR_TREND             = [
  { q: "Q1", value: 41 },
  { q: "Q2", value: 58 },
  { q: "Q3", value: 62 },
  { q: "Q4*", value: TOP_LAYER_PROJECTED, projected: true },
];

// "SDBIP Targets Requiring Attention" — exactly per the demo script.
const ATTENTION = [
  { id: "att-1",   code: "T-001",  title: "Namakgale electricity coverage",        ward: "w4",  actual: 47, target: 75, status: "amber",  cascade: null },
  { id: "att-2",   code: "T-014",  title: "Lulekani internal roads paved",          ward: "w2",  actual: 52, target: 70, status: "amber",  cascade: null },
  { id: "att-3",   code: "T-021",  title: "Sewer manhole cover replacement programme", ward: "w8",  actual: 18, target: 60, status: "red",    cascade: null },
  { id: "att-4",   code: "SD-T-005", title: "Reduce outstanding consumer debt R 487m → R 412m", ward: null, actual: 56, target: 100, status: "red", cascade: "sd5" },
];

// ─── Small primitives ────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = C.brand, accent }) {
  return (
    <div className="fade-up" style={{
      background: "rgba(255,255,255,0.94)",
      border: "1px solid rgba(0,0,0,0.07)",
      borderRadius: 4, padding: "16px 18px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
      borderTop: accent ? `3px solid ${color}` : undefined,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 4, background: `${color}18`,
          color, display: "grid", placeItems: "center",
        }}><I as={icon} size={16} /></div>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.ink, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function statusToColor(s) {
  if (s === "green") return C.success;
  if (s === "amber") return "#c8a116";
  if (s === "red")   return C.danger;
  return C.muted;
}

function KPABar({ kpa, value, status }) {
  const c = statusToColor(status);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "baseline" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{kpa.code}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{value}%</span>
      </div>
      <div style={{ height: 8, background: C.surfaceMute, borderRadius: 40, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${value}%`,
          background: c, borderRadius: 40, transition: "width 0.5s ease",
        }}/>
      </div>
      <div style={{ fontSize: 10, color: C.faint, marginTop: 4 }}>{kpa.label}</div>
    </div>
  );
}

// Q3 trend mini-chart with projection bar.
function TrendChart() {
  const max = Math.max(...QTR_TREND.map((q) => q.value), TOP_LAYER_TARGET);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 130, paddingTop: 12,
                    borderBottom: `1px solid ${C.surfaceMute}`, paddingBottom: 6, position: "relative" }}>
        {/* Target line */}
        <div style={{
          position: "absolute", left: 0, right: 0,
          bottom: `${(TOP_LAYER_TARGET / max) * 100}%`,
          borderTop: `1px dashed ${C.warning}`,
          fontSize: 10, color: C.warning, fontWeight: 700,
        }}>
          <span style={{ background: "#fff", padding: "0 4px", position: "absolute",
                         right: 0, top: -8 }}>Target {TOP_LAYER_TARGET}%</span>
        </div>
        {QTR_TREND.map((q, i) => {
          const h = (q.value / max) * 100;
          const colour = q.projected ? C.brand : i === QTR_TREND.length - 2 ? C.success : C.brand;
          return (
            <div key={q.q} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: colour }}>{q.value}%</span>
              <div className="fade-up" style={{
                width: "70%", height: `${h}%`,
                background: q.projected
                  ? `repeating-linear-gradient(45deg, ${colour}80, ${colour}80 6px, ${colour}40 6px, ${colour}40 12px)`
                  : `linear-gradient(180deg, ${colour}, ${colour}cc)`,
                borderRadius: "4px 4px 0 0",
                animationDelay: `${i * 0.08}s`,
              }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 18, paddingTop: 8 }}>
        {QTR_TREND.map((q) => (
          <div key={q.q} style={{ flex: 1, textAlign: "center", fontSize: 11, color: C.muted, fontWeight: 600 }}>
            {q.q}{q.projected && " · projected"}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────
export function DashboardView({ setActive }) {
  const { state } = useContext(EPMSContext);
  const me = state.currentUser;

  const upcoming = state.complianceDeadlines
    .map((d) => ({ ...d, days: daysFrom(d.deadline) }))
    .filter((d) => d.days >= -7 && d.days <= 90)
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);

  const recentActivity = state.activity.slice(0, 6);
  const flags = state.activity.filter((a) => a.severity === "warning").slice(0, 2);

  const onAttentionClick = (it) => {
    if (it.cascade) setIntent({ openCascade: it.cascade });
    setActive("sdbip");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <ViewHeader
        title={`${MUNICIPALITY.name}`}
        subtitle={`${MUNICIPALITY.code} · ${MUNICIPALITY.district} · ${MUNICIPALITY.motto || "Service excellence"} · FY ${MUNICIPALITY.fiscalYear}`}
        action={
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 600,
                           textTransform: "uppercase", letterSpacing: "0.5px" }}>Welcome</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{me.name}</span>
          </div>
        }
        commandBar={<CommandBar groups={[
          [{ icon: Calendar20Regular, label: "Quarterly review", onClick: () => {} }],
          [{ icon: DataHistogram20Regular, label: "Open SDBIP", onClick: () => setActive("sdbip") }],
        ]}/>}
      />
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", background: C.surfaceAlt }}>

        {/* Preemptive compliance flags banner */}
        {flags.length > 0 && (
          <div style={{
            background: "#fff", border: `1px solid ${C.warning}40`,
            borderLeft: `4px solid ${C.warning}`,
            borderRadius: 4, padding: "12px 16px", marginBottom: 18,
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <I as={Warning20Regular} size={18} color={C.warning} style={{ marginTop: 1 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                Compliance attention required ({flags.length})
              </div>
              {flags.map((f) => (
                <div key={f.id} style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                  · <strong style={{ color: C.text }}>{f.action}</strong> {f.target} <em>({f.time})</em>
                </div>
              ))}
            </div>
            <Btn size="sm" variant="ghost" onClick={() => setActive("audit")}>Open audit log</Btn>
          </div>
        )}

        {/* Stats row — script-defined four headline numbers */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22,
        }}>
          <StatCard icon={DataHistogram20Regular} label="Top-Layer SDBIP YTD"
                    value={`${TOP_LAYER_SDBIP_YTD}%`}
                    sub={`Projected ${TOP_LAYER_PROJECTED}% vs ${TOP_LAYER_TARGET}% target`}
                    color={C.brand} accent/>
          <StatCard icon={Money20Regular} label="mSCOA spend"
                    value={formatZAR(MSCOA_SPEND)}
                    sub={`of ${formatZAR(MSCOA_BUDGET)} budget · ${Math.round((MSCOA_SPEND/MSCOA_BUDGET)*100)}%`}
                    color="#1D4FD7" accent/>
          <StatCard icon={Building20Regular} label="Outstanding consumer debt"
                    value={formatZAR(MUNICIPALITY.outstandingConsumerDebt)}
                    sub="Target FY27: R350m" color={C.danger} accent/>
          <StatCard icon={PersonAvailable20Regular} label="Staff performance avg"
                    value={`${STAFF_PERF_AVERAGE.toFixed(1)} / 5`}
                    sub={`across ${MUNICIPALITY.staffEstablishment} employees`}
                    color={C.success} accent/>
        </div>

        {/* KPA panel + Q3 trend */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, marginBottom: 22 }}>
          <div style={{
            background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 4, padding: "18px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Constitutional KPA progress</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                  Five Key Performance Areas · weighted per IDP · mid-year FY26/27
                </div>
              </div>
              <Pill bg={C.brandTint} fg={C.brand} uppercase={false}>2 amber · 1 red</Pill>
            </div>
            {KPAS.map((k) => {
              const p = KPA_PROGRESS[k.id];
              return <KPABar key={k.id} kpa={k} value={p.value} status={p.status}/>;
            })}
          </div>

          <div style={{
            background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 4, padding: "18px 20px",
          }}>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Quarterly performance trend</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                Year-to-date Top-Layer achievement · projection to year-end
              </div>
            </div>
            <TrendChart/>
            <div style={{ marginTop: 14, padding: "10px 12px",
                          background: C.surfaceAlt, borderRadius: 4,
                          fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
              Trajectory holds: <strong style={{ color: C.text }}>{TOP_LAYER_PROJECTED}% projected</strong>
              {" "}against an <strong style={{ color: C.warning }}>{TOP_LAYER_TARGET}% target</strong>.
              Risk concentrated in <strong style={{ color: C.danger }}>KPA3 Financial Viability</strong>.
            </div>
          </div>
        </div>

        {/* SDBIP Targets Requiring Attention */}
        <div style={{
          background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: 4, overflow: "hidden", marginBottom: 22,
        }}>
          <div style={{
            padding: "14px 20px", borderBottom: `1px solid ${C.surfaceMute}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>SDBIP targets requiring attention</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                Each item has a ward, an owner, and an evidence trail · click to drill into the cascade
              </div>
            </div>
            <Btn size="sm" variant="ghost" onClick={() => setActive("sdbip")}>
              All targets <I as={ChevronRight20Regular} size={13}/>
            </Btn>
          </div>
          <div>
            {ATTENTION.map((it, i) => {
              const c = statusToColor(it.status);
              const pct = Math.round((it.actual / it.target) * 100);
              return (
                <div key={it.id} onClick={() => onAttentionClick(it)} className="fade-up" style={{
                  display: "grid", gridTemplateColumns: "100px 1fr 200px 110px 60px",
                  gap: 14, padding: "12px 20px", alignItems: "center",
                  borderBottom: i < ATTENTION.length - 1 ? `1px solid ${C.surfaceMute}` : "none",
                  cursor: "pointer", transition: "background 0.15s",
                  animationDelay: `${i * 0.04}s`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, fontFamily: "ui-monospace, monospace" }}>
                    {it.code}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, lineHeight: 1.35,
                                  display: "flex", alignItems: "center", gap: 8 }}>
                      {it.title}
                      {it.cascade && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 40,
                          background: C.brandTint, color: C.brand,
                          textTransform: "uppercase", letterSpacing: "0.5px",
                        }}>5-step cascade</span>
                      )}
                    </div>
                    {it.ward && (
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                        Ward: {it.ward.replace("w", "")} · KPA-linked
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 5, background: C.surfaceMute, borderRadius: 40, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: c, borderRadius: 40 }}/>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c, minWidth: 56, textAlign: "right" }}>
                      {it.actual}% / {it.target}%
                    </span>
                  </div>
                  <div>
                    <Pill bg={`${c}1f`} fg={c}>
                      {it.status === "red" ? "Red" : it.status === "amber" ? "Amber" : "Green"}
                    </Pill>
                  </div>
                  <div style={{ textAlign: "right", color: C.faint }}>
                    <I as={ChevronRight20Regular} size={14}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compliance + Activity row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div style={{
            background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 4, padding: "18px 20px",
            display: "flex", flexDirection: "column", maxHeight: 320,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Statutory deadlines</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>MFMA · MSA · upcoming 90 days</div>
              </div>
              <span onClick={() => setActive("audit")} style={{
                fontSize: 11, color: C.brand, cursor: "pointer", fontWeight: 600,
              }}>See all →</span>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              {upcoming.map((d, i) => {
                const past = d.days < 0;
                const urgent = d.days <= 7;
                const colour = past ? C.danger : urgent ? "#7a5700" : "#1D4FD7";
                return (
                  <div key={d.id} className="fade-up" style={{
                    display: "flex", gap: 10, padding: "8px 0", alignItems: "flex-start",
                    borderBottom: i < upcoming.length - 1 ? `1px solid ${C.surfaceMute}` : "none",
                    animationDelay: `${i * 0.04}s`,
                  }}>
                    <div style={{ color: colour, marginTop: 2 }}>
                      <I as={Calendar20Regular} size={14}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, lineHeight: 1.35 }}>{d.title}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                        <strong>{d.legalRef}</strong> · {fmtDate(d.deadline)} ·{" "}
                        <span style={{ color: colour, fontWeight: 600 }}>{tNote(d.days)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 4, padding: "18px 20px",
            display: "flex", flexDirection: "column", maxHeight: 320,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 12 }}>Recent activity</div>
            <div style={{ flex: 1, overflow: "auto" }}>
              {recentActivity.map((a, i) => {
                const u = userById(a.userId);
                const isFlag = a.severity === "warning";
                return (
                  <div key={a.id} className="fade-up" style={{
                    display: "flex", gap: 10, padding: "8px 0", alignItems: "flex-start",
                    borderBottom: i < recentActivity.length - 1 ? `1px solid ${C.surfaceMute}` : "none",
                    animationDelay: `${i * 0.04}s`,
                  }}>
                    {a.userId === "system" ? (
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: isFlag ? C.warningBg : C.brandTint,
                        color: isFlag ? C.warning : C.brand,
                        display: "grid", placeItems: "center", flexShrink: 0,
                      }}><I as={Warning20Regular} size={12}/></div>
                    ) : <Avatar userId={a.userId} size={24}/>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.35 }}>
                        <strong>{u.name}</strong> {a.action}{" "}
                        <span style={{ color: isFlag ? C.warning : C.brand }}>{a.target}</span>
                      </div>
                      <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>{a.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
