// Payroll Cycles — executive summary. State-aware run lifecycle
// (before -> ready -> processing -> completed), projection-vs-actual totals,
// department progress / exceptions, and manual adjustments.
import { useState } from "react";
import {
  ArrowClockwise20Regular, ChevronRight20Regular, Calendar20Regular,
  People20Regular, PeopleTeam20Regular, Apps20Regular, Wallet20Regular,
  Money20Regular, ReceiptMoney20Regular, DataHistogram20Regular,
  Building20Regular, Warning20Regular, CheckmarkCircle20Regular,
  DismissCircle20Regular, Clock20Regular, Edit20Regular, ArrowRight20Regular,
} from "@fluentui/react-icons";
import { I, C, Pill, Btn, FluentSelect, ViewHeader, Spinner } from "../../components/index.js";
import { usePayroll } from "../state.js";
import {
  PERIODS, CYCLE_TYPES, CYCLE, RUN, PROJECTED, ACTUAL,
  EMPLOYEE_STATISTICS, COMPANY_TOTALS, DEPARTMENTS, EXCEPTIONS,
  MANUAL_ADJUSTMENTS, TOTAL_IN_RUN,
} from "../data.js";
import { formatZAR, daysFromToday, phaseStyle, toneStyle } from "../helpers.js";

// ─── Shared card wrapper ──────────────────────────────────────────────────────
function Card({ children, style = {}, pad = 0 }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 8,
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: pad, ...style,
    }}>{children}</div>
  );
}

const label = (t) => (
  <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t}</span>
);

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const { cycleType, period, phase, progress, processed, success, failed, runPayroll, resetRun } = usePayroll();
  const ps = phaseStyle(phase);
  const daysToOpen = daysFromToday(period.windowOpenISO);
  const opensText = daysToOpen === 0 ? "Opens today" : daysToOpen === 1 ? "Opens tomorrow" : `Opens in ${daysToOpen} days`;
  const daysToPay = daysFromToday(period.payDateISO);
  const payText = daysToPay === 0 ? "Pay run due today" : daysToPay === 1 ? "Pay run tomorrow" : `Pay run in ${daysToPay} days`;

  const meta = [
    { icon: Calendar20Regular, k: "Financial Year", v: CYCLE.financialYear },
    { icon: Calendar20Regular, k: "Tax Year", v: CYCLE.taxYear },
    { icon: People20Regular, k: "Total Cycle Employees", v: String(CYCLE.totalEmployees) },
    { icon: Apps20Regular, k: "Total Employee Groups", v: String(CYCLE.totalGroups) },
  ];

  return (
    <Card pad={20}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 6, background: C.surfaceMute, color: C.muted, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <I as={ArrowClockwise20Regular} size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0 }}>
                {cycleType} — Period ending {period.endsLabel}
              </h2>
              <Pill fg={ps.fg} bg={ps.bg}>{ps.label}</Pill>
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              {phase === "processing" ? "Payroll is processing — this run is read-only."
                : phase === "completed" ? "Payroll run completed. Payslips are ready to review."
                : phase === "before" ? "The run window has not opened yet for this period."
                : "The run window is open. Review and run payroll when ready."}
            </div>
          </div>
        </div>

        {/* State action */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {phase === "before" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${C.hairline}`, background: C.surfaceAlt, borderRadius: 6, padding: "8px 14px" }}>
              <I as={Clock20Regular} size={18} color={C.muted} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{opensText}</div>
                <div style={{ fontSize: 11, color: C.muted }}>Window opens {period.windowOpensDisplay}</div>
              </div>
            </div>
          )}
          {phase === "ready" && (
            <>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{period.scheduled}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{payText}</div>
              </div>
              <div style={{ width: 1, height: 34, background: C.hairline }} />
              <Btn variant="primary" size="lg" onClick={runPayroll}>
                Run Payroll <I as={ChevronRight20Regular} size={16} />
              </Btn>
            </>
          )}
          {phase === "processing" && (
            <Btn variant="primary" size="lg" disabled>
              <Spinner size={13} color="#fff" /> Running… {processed}/{TOTAL_IN_RUN}
            </Btn>
          )}
          {phase === "completed" && (
            <>
              <Pill fg={C.success} bg={C.successBg}>Completed {period.scheduled}</Pill>
              <Btn variant="secondary" size="lg" onClick={resetRun}>
                <I as={ArrowClockwise20Regular} size={15} /> Run again
              </Btn>
            </>
          )}
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px 24px", marginTop: 18 }}>
        {meta.map((m) => (
          <div key={m.k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <I as={m.icon} size={16} color={C.faint} />
            <span style={{ color: C.muted, fontWeight: 600 }}>{m.k}:</span>
            <span style={{ color: C.text, fontWeight: 600 }}>{m.v}</span>
          </div>
        ))}
      </div>

      {/* Progress */}
      {(phase === "processing" || phase === "completed") && (
        <div style={{ marginTop: 18, border: `1px solid ${C.hairline}`, background: C.surfaceAlt, borderRadius: 6, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, color: C.text }}>
              {phase === "processing" ? <Spinner size={13} color={C.brand} /> : <I as={CheckmarkCircle20Regular} size={15} color={C.success} />}
              {phase === "processing" ? "Generating payslips…" : "All payslips generated"}
            </span>
            <span style={{ fontWeight: 700, color: C.ink }}>{success} generated · {failed} failed</span>
          </div>
          <div style={{ marginTop: 10, height: 8, borderRadius: 100, background: C.surfaceMute, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: phase === "completed" ? C.success : C.brand, transition: "width 0.1s" }} />
          </div>
        </div>
      )}

      {phase === "before" && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.hairline}`, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.muted }}>
          <I as={ArrowRight20Regular} size={15} color={C.faint} />
          The <strong style={{ color: C.ink }}>Run Payroll</strong> action will appear here once the window opens.
        </div>
      )}
    </Card>
  );
}

// ─── KPI cards ────────────────────────────────────────────────────────────────
function Kpis() {
  const { phase } = usePayroll();
  const hasRun = phase === "processing" || phase === "completed";
  const isCurrent = phase === "ready";
  const isUpcoming = phase === "before";
  const money = (a, p) => (hasRun ? a : isCurrent ? p : "—");
  const tag = hasRun ? "Actual" : isCurrent ? "Projected" : "Pending";

  const cards = [
    { icon: Money20Regular, k: "Payroll cost", v: money(ACTUAL.cost, PROJECTED.cost), tag, proj: PROJECTED.cost },
    { icon: People20Regular, k: "Employees", v: String(hasRun ? ACTUAL.employees : PROJECTED.employees), tag: hasRun ? "Actual" : "Planned", proj: PROJECTED.employees },
    { icon: ReceiptMoney20Regular, k: "Deductions", v: money(ACTUAL.deductions, PROJECTED.deductions), tag, proj: PROJECTED.deductions },
    { icon: DataHistogram20Regular, k: "PAYE / Tax", v: money(ACTUAL.tax, PROJECTED.tax), tag, proj: PROJECTED.tax },
  ];
  const head = hasRun
    ? { t: "Actual payroll totals", ...phaseStyle("completed"), note: "Actual figures" }
    : isCurrent
      ? { t: "Projected payroll totals", bg: C.brandTint, fg: C.brand, note: "Projection · final after run" }
      : { t: "Payroll totals", bg: C.surfaceMute, fg: C.muted, note: "No values until the run window opens" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{head.t}</span>
        <Pill fg={head.fg} bg={head.bg} uppercase={false} weight={600}>{head.note}</Pill>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {cards.map((c) => {
          const empty = c.v === "—";
          return (
            <Card key={c.k} pad={18}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: C.surfaceMute, color: C.muted, display: "grid", placeItems: "center" }}>
                  <I as={c.icon} size={15} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.faint }}>{c.tag}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: empty ? C.faint : C.ink, marginTop: 12 }}>{c.v}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{c.k}</div>
              {hasRun && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.surfaceMute}`, fontSize: 11, color: C.muted }}>
                  Projected: <strong style={{ color: C.text }}>{c.proj}</strong>
                </div>
              )}
              {isUpcoming && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.surfaceMute}`, fontSize: 11, color: C.faint }}>
                  Available once the run opens
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Payroll Run card ─────────────────────────────────────────────────────────
function PayrollRunCard() {
  const { phase, success, failed } = usePayroll();
  const hasRun = phase === "processing" || phase === "completed";
  const st = phase === "processing" ? { c: C.warning, t: "Processing" }
    : phase === "completed" ? { c: C.success, t: "Complete" }
    : phase === "before" ? { c: C.faint, t: "Not started" }
    : { c: C.muted, t: "Draft" };
  return (
    <Card pad={20} style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 6, background: C.brandTint, color: C.brand, display: "grid", placeItems: "center" }}>
          <I as={Wallet20Regular} size={17} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>Payroll Run</h3>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: st.c }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.c }} />{st.t}
          </span>
        </div>
      </div>
      <div style={{ height: 1, background: C.hairline, margin: "16px 0" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1 }}>
        <div style={{ background: C.successBg, border: `1px solid ${C.successBg}`, borderRadius: 6, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.success }}>Employees Included</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.success, background: "#fff", borderRadius: 100, padding: "1px 7px", border: `1px solid ${C.success}33` }}>↑ {RUN.joined}</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.success, marginTop: 8 }}>{RUN.included}</div>
        </div>
        <div style={{ background: C.dangerBg, border: `1px solid ${C.dangerBg}`, borderRadius: 6, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.danger }}>Employees Excluded</span>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.danger, marginTop: 8 }}>{RUN.excluded}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div>
          {label("Successful Payslips")}
          <div style={{ fontSize: 18, fontWeight: 700, color: hasRun ? C.success : C.faint, marginTop: 4 }}>{hasRun ? `${success}/${TOTAL_IN_RUN}` : "—"}</div>
        </div>
        <div>
          {label("Unsuccessful Payslips")}
          <div style={{ fontSize: 18, fontWeight: 700, color: hasRun ? C.danger : C.faint, marginTop: 4 }}>{hasRun ? `${failed}/${TOTAL_IN_RUN}` : "—"}</div>
        </div>
      </div>
    </Card>
  );
}

// ─── Department / Exceptions switch card ──────────────────────────────────────
const exIcon = { excluded: DismissCircle20Regular, failed: Warning20Regular, approvals: Clock20Regular, claims: Warning20Regular, adjustments: Edit20Regular };

function ProgressExceptions({ setActive }) {
  const { phase, progress } = usePayroll();
  const [panel, setPanel] = useState("departments");
  const factor = phase === "completed" ? 1 : phase === "processing" ? progress / 100 : 0;
  const isUpcoming = phase === "before";

  return (
    <Card style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 16, borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 6, background: panel === "departments" ? C.brandTint : C.warningBg, color: panel === "departments" ? C.brand : C.warning, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <I as={panel === "departments" ? Building20Regular : Warning20Regular} size={17} />
          </div>
          <FluentSelect
            value={panel}
            onChange={(e) => setPanel(e.target.value)}
            options={[{ value: "departments", label: "Department progress" }, { value: "exceptions", label: "Exceptions & actions" }]}
            style={{ minWidth: 190 }}
          />
        </div>
        {panel === "departments" ? (
          <span style={{ fontSize: 13, fontWeight: 700, color: isUpcoming ? C.faint : C.ink }}>
            {isUpcoming ? "Not started" : `${Math.round(factor * TOTAL_IN_RUN)}/${TOTAL_IN_RUN} processed`}
          </span>
        ) : (
          <button onClick={() => setActive("employees")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.brand, fontFamily: "inherit" }}>View all</button>
        )}
      </div>

      {panel === "departments" ? (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center" }}>
          {DEPARTMENTS.map((d) => {
            const done = Math.round(d.done * factor);
            const pct = Math.round((done / d.total) * 100);
            return (
              <div key={d.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: C.text }}>{d.name}</span>
                  <span style={{ color: C.muted }}>{done}/{d.total}</span>
                </div>
                <div style={{ marginTop: 6, height: 8, borderRadius: 100, background: C.surfaceMute, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? C.success : C.brand, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: 6, flex: 1 }}>
          {EXCEPTIONS.map((ex) => {
            const ts = toneStyle(ex.tone);
            return (
              <button key={ex.key} onClick={() => setActive("employees")} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 12px",
                background: "none", border: "none", borderRadius: 6, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceMute)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: ts.bg, color: ts.fg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <I as={exIcon[ex.key]} size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{ex.label}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{ex.hint}</div>
                </div>
                <Pill fg={ts.fg} bg={ts.bg}>{ex.count}</Pill>
                <I as={ChevronRight20Regular} size={16} color={C.faint} />
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Totals list card ─────────────────────────────────────────────────────────
function TotalsCard({ icon, title, rows, tag }) {
  return (
    <Card style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 6, background: C.brandTint, color: C.brand, display: "grid", placeItems: "center" }}>
            <I as={icon} size={17} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>{title}</h3>
            <Pill fg={C.muted} bg={C.surfaceMute} uppercase={false} weight={600}>{tag}</Pill>
          </div>
        </div>
      </div>
      <div style={{ padding: "0 16px" }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.surfaceMute}` : "none", fontSize: 13 }}>
            <span style={{ color: C.muted }}>{r.label}</span>
            <span style={{ fontWeight: 700, color: C.ink }}>{r.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Manual adjustments table ─────────────────────────────────────────────────
function ManualAdjustments({ setActive }) {
  return (
    <Card style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 6, background: C.brandTint, color: C.brand, display: "grid", placeItems: "center" }}>
            <I as={Edit20Regular} size={17} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>Manual Adjustments</h3>
              <Pill fg={C.brand} bg={C.brandTint}>{MANUAL_ADJUSTMENTS.length}</Pill>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Manual interventions applied to this run.</div>
          </div>
        </div>
        <Btn variant="secondary" onClick={() => setActive("employees")}>View in detail <I as={ArrowRight20Regular} size={15} /></Btn>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 780, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.surfaceAlt, textAlign: "left" }}>
              {["Employee", "Type", "Original", "Updated", "Changed by", "Reason", "Date"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${C.hairline}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MANUAL_ADJUSTMENTS.map((a, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.surfaceMute}` }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{a.employee}</td>
                <td style={{ padding: "12px 16px" }}><Pill fg={C.text} bg={C.surfaceMute} uppercase={false} weight={600}>{a.type}</Pill></td>
                <td style={{ padding: "12px 16px", color: C.muted, whiteSpace: "nowrap" }}>{a.original}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: C.brand, whiteSpace: "nowrap" }}>{a.updated}</td>
                <td style={{ padding: "12px 16px", color: C.text, whiteSpace: "nowrap" }}>{a.user}</td>
                <td style={{ padding: "12px 16px", color: C.text }}>{a.reason}</td>
                <td style={{ padding: "12px 16px", color: C.muted, whiteSpace: "nowrap" }}>{a.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── View ─────────────────────────────────────────────────────────────────────
export function SummaryView({ setActive }) {
  const { cycleType, setCycleType, periodId, setPeriodId, phase } = usePayroll();
  const hasRun = phase === "processing" || phase === "completed";
  const tag = hasRun ? "Actual" : phase === "ready" ? "Projected" : "Pending";

  const controls = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <FluentSelect value={periodId} onChange={(e) => setPeriodId(e.target.value)}
        options={PERIODS.map((p) => ({ value: p.id, label: p.label }))} style={{ minWidth: 140 }} />
      <FluentSelect value={cycleType} onChange={(e) => setCycleType(e.target.value)}
        options={CYCLE_TYPES.map((c) => ({ value: c, label: c }))} style={{ minWidth: 130 }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <ViewHeader title="Payroll Cycles" subtitle="Run and monitor payroll for the selected cycle and period." action={controls} />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
        <Hero />
        <Kpis />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "stretch" }}>
          <PayrollRunCard />
          <ProgressExceptions setActive={setActive} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
          <TotalsCard icon={DataHistogram20Regular} title="Employee Statistics" rows={EMPLOYEE_STATISTICS} tag={tag} />
          <TotalsCard icon={ReceiptMoney20Regular} title="Company Totals" rows={COMPANY_TOTALS} tag={tag} />
        </div>
        <ManualAdjustments setActive={setActive} />
      </div>
    </div>
  );
}
