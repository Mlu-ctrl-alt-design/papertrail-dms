// Financial statements, consolidation and branch accounting.
//
// Requests 3 and 4 in one screen: the three statements, a column per company
// with an Eliminations column and a Group total, a column per branch inside a
// company, and every figure clickable down to the document behind it.

import { useMemo, useState } from "react";
import { CheckmarkCircle20Filled, Print20Regular, Warning20Regular } from "@fluentui/react-icons";
import {
  BP, Btn, C, Card, FluentSelect, I, Pill, PrintSheet, Tabs, TextField,
  ViewHeader, useMaxWidth, usePrintExport,
} from "../../components/index.js";
import {
  BASE_CURRENCY, COMPANIES, FY, GROUP_NAME, GROUP_SCOPE, companyShort, fmtBase,
  monthEnd, monthKey, monthLabel, monthLabelShort, monthStart, addMonths, money,
  prettyDate, scopeLabel, TODAY,
} from "../config.js";
import {
  bsSpec, cfSpec, computeReport, consolidate, periodFor, plSpec, reportAmount,
} from "../engine/reports.js";
import { rootNode } from "../engine/drill.js";
import { useFinance } from "../state.js";
import { ConsolidatedTable, Hint, Page, StatementTable } from "../ui.jsx";
import { DrillDrawer } from "./Drill.jsx";

const STATEMENTS = [
  { id: "pnl", label: "Profit & loss", spec: plSpec, asAt: false },
  { id: "bs", label: "Balance sheet", spec: bsSpec, asAt: true },
  { id: "cf", label: "Cash flow", spec: cfSpec, asAt: false },
];

const VIEW_OPTIONS = [
  { value: "single", label: "Single column" },
  { value: "company", label: "By company (consolidated)" },
  { value: "branch", label: "By branch" },
];

const MONTHS = (() => {
  const out = [];
  for (let m = 0; m < 12; m += 1) out.push(addMonths("2026-01", m));
  return out;
})();

export function ReportsView() {
  const store = useFinance();
  const compact = useMaxWidth(BP.lg);
  const wantsConsolidated = store.route.rest[0] === "consolidated";

  const [statementId, setStatementId] = useState("pnl");
  const [view, setView] = useState(wantsConsolidated ? "company" : "single");
  const [branchCompany, setBranchCompany] = useState(store.scope.company || "hospitality");
  const [period, setPeriod] = useState({ mode: "ytd", month: monthKey(TODAY), from: FY.start, to: TODAY });
  const [showComparative, setShowComparative] = useState(true);
  const [drill, setDrill] = useState(null);

  // Two bits of state that follow something outside this component: the deep link
  // for scene 6 (#/finance/reports/consolidated) and the scope selector in the
  // context bar. Adjusted while rendering when the thing they follow changes,
  // which is cheaper and more predictable than mirroring them through effects.
  const [lastLink, setLastLink] = useState(wantsConsolidated);
  if (lastLink !== wantsConsolidated) {
    setLastLink(wantsConsolidated);
    if (wantsConsolidated) setView("company");
  }
  const [lastScopeCompany, setLastScopeCompany] = useState(store.scope.company);
  if (lastScopeCompany !== store.scope.company) {
    setLastScopeCompany(store.scope.company);
    if (store.scope.company) setBranchCompany(store.scope.company);
  }

  const statement = STATEMENTS.find((s) => s.id === statementId);
  const spec = useMemo(() => statement.spec(), [statement]);

  const { from, to } = useMemo(() => {
    if (period.mode === "month") return { from: monthStart(period.month), to: monthEnd(period.month) };
    if (period.mode === "custom") return { from: period.from, to: period.to };
    return { from: FY.start, to: monthEnd(period.month) };
  }, [period]);

  // What a comparative column should mean depends on what the statement is. A
  // balance sheet is a position, so it compares against the previous month end;
  // a year-to-date P&L or cash flow compares against the month on its own, and a
  // single month compares against the month before it.
  const comparativePeriod = useMemo(() => {
    if (!showComparative || period.mode === "custom") return null;
    const prev = addMonths(period.month, -1);
    if (statement.asAt) {
      return { from: FY.start, to: monthEnd(prev), label: `At ${monthLabelShort(prev)}` };
    }
    if (period.mode === "ytd") {
      return { from: monthStart(period.month), to: monthEnd(period.month), label: monthLabelShort(period.month) };
    }
    return { from: monthStart(prev), to: monthEnd(prev), label: monthLabelShort(prev) };
  }, [showComparative, period, statement]);

  const columns = useMemo(() => {
    if (view === "company") {
      return COMPANIES.map((c) => ({ id: c.id, label: c.short, scope: { company: c.id, branch: null } }));
    }
    if (view === "branch") {
      const c = COMPANIES.find((x) => x.id === branchCompany);
      return c.branches.map((b) => ({ id: b.id, label: b.name, scope: { company: c.id, branch: b.id } }));
    }
    return null;
  }, [view, branchCompany]);

  const single = useMemo(
    () => computeReport(spec, store.ledger, { scope: store.scope, from, to }),
    [spec, store.ledger, store.scope, from, to],
  );
  const singleComparative = useMemo(
    () => (comparativePeriod
      ? computeReport(spec, store.ledger, { scope: store.scope, from: comparativePeriod.from, to: comparativePeriod.to })
      : null),
    [spec, store.ledger, store.scope, comparativePeriod],
  );
  const con = useMemo(
    () => (columns ? consolidate(spec, store.ledger, { columns, from, to, eliminate: view === "company" }) : null),
    [columns, spec, store.ledger, from, to, view],
  );

  // The balanced indicator is the real difference between the two totals, not an
  // assertion. If it ever read anything but nil, that would be the news.
  const balance = useMemo(() => {
    if (statementId !== "bs") return null;
    const bs = view === "single" ? single : null;
    if (bs) return reportAmount(bs, "t-assets") - reportAmount(bs, "t-leq");
    const row = (id) => con.rows.find((r) => r.id === id);
    return (row("t-assets")?.group ?? 0) - (row("t-leq")?.group ?? 0);
  }, [statementId, view, single, con]);

  const { print } = usePrintExport();

  const periodCaption = period.mode === "custom"
    ? `${prettyDate(from)} – ${prettyDate(to)}`
    : period.mode === "month"
      ? monthLabel(period.month)
      : `Year to date · 1 Jan – ${prettyDate(to)}`;

  const scopeCaption = view === "single"
    ? scopeLabel(store.scope)
    : view === "company" ? `${GROUP_NAME} · consolidated` : `${companyShort(branchCompany)} · by branch`;

  const openDrill = (row, col) => {
    const p = periodFor(row.basis, { from, to });
    const scope = col ? col.scope : (view === "single" ? store.scope : GROUP_SCOPE);
    setDrill(rootNode({
      label: row.label, codes: row.codes, sign: row.sign, scope, from: p.from, to: p.to, basis: row.basis,
    }));
  };

  return (
    <>
      <ViewHeader
        title="Financial statements"
        subtitle={`${scopeCaption} · ${periodCaption}`}
        action={
          <Btn variant="secondary" onClick={() => print()}>
            <I as={Print20Regular} size={14} /> Print / PDF
          </Btn>
        }
      />

      <div style={{
        padding: "0 20px", background: "#fff", borderBottom: `1px solid ${C.hairline}`, flexShrink: 0,
      }}>
        <Tabs
          items={STATEMENTS.map((s) => ({ id: s.id, label: s.label }))}
          active={statementId}
          onChange={setStatementId}
        />
      </div>

      <div style={{
        display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center",
        padding: "10px 20px", background: C.surfaceAlt, borderBottom: `1px solid ${C.hairline}`, flexShrink: 0,
      }}>
        <Control label="View">
          <FluentSelect size="sm" value={view} options={VIEW_OPTIONS} style={{ width: 210 }}
                        onChange={(e) => setView(String(e.target.value))} />
        </Control>
        {view === "branch" && (
          <Control label="Company">
            <FluentSelect size="sm" value={branchCompany} style={{ width: 190 }}
                          options={COMPANIES.map((c) => ({ value: c.id, label: c.name }))}
                          onChange={(e) => setBranchCompany(String(e.target.value))} />
          </Control>
        )}
        <Control label="Period">
          <FluentSelect
            size="sm" value={period.mode} style={{ width: 150 }}
            options={[
              { value: "ytd", label: statement.asAt ? "As at month end" : "Year to date" },
              { value: "month", label: "Single month" },
              { value: "custom", label: "Custom range" },
            ]}
            onChange={(e) => setPeriod((p) => ({ ...p, mode: String(e.target.value) }))}
          />
        </Control>
        {period.mode !== "custom" && (
          <Control label={statement.asAt && period.mode === "ytd" ? "As at" : "Month"}>
            <FluentSelect size="sm" value={period.month} style={{ width: 150 }}
                          options={MONTHS.map((m) => ({ value: m, label: monthLabel(m) }))}
                          onChange={(e) => setPeriod((p) => ({ ...p, month: String(e.target.value) }))} />
          </Control>
        )}
        {period.mode === "custom" && (
          <>
            <Control label="From">
              <div style={{ width: 140 }}>
                <TextField type="date" value={period.from} onChange={(v) => setPeriod((p) => ({ ...p, from: v }))} />
              </div>
            </Control>
            <Control label="To">
              <div style={{ width: 140 }}>
                <TextField type="date" value={period.to} onChange={(v) => setPeriod((p) => ({ ...p, to: v }))} />
              </div>
            </Control>
          </>
        )}
        {view === "single" && period.mode !== "custom" && (
          <Btn variant={showComparative ? "ghost" : "secondary"} size="sm"
               onClick={() => setShowComparative((s) => !s)}>
            {showComparative ? "Comparative on" : "Comparative off"}
          </Btn>
        )}
        {balance != null && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7 }}>
            <I as={balance === 0 ? CheckmarkCircle20Filled : Warning20Regular} size={16}
               color={balance === 0 ? C.success : C.danger} />
            <span style={{ fontSize: 12, fontWeight: 700, color: balance === 0 ? C.success : C.danger }}>
              {balance === 0 ? "Balanced" : `Out by ${fmtBase(balance)}`}
            </span>
          </div>
        )}
      </div>

      <Page>
        <Card
          title={`${statement.label} — ${scopeCaption}`}
          subtitle={periodCaption}
          right={<Pill fg={C.muted} bg={C.surfaceMute}>{BASE_CURRENCY}, no decimals</Pill>}
          pad={compact ? 10 : 18}
        >
          {view === "single" ? (
            <StatementTable
              report={single}
              comparative={singleComparative}
              comparativeLabel={comparativePeriod?.label}
              onDrill={(row) => openDrill(row, null)}
            />
          ) : (
            <ConsolidatedTable
              con={con}
              onDrill={openDrill}
              totalLabel={view === "company" ? "Group" : companyShort(branchCompany)}
            />
          )}
        </Card>

        {statementId === "bs" && <BalanceNote report={view === "single" ? single : null} con={con} />}
        {statementId === "cf" && <CashFlowNote report={view === "single" ? single : null} con={con} from={from} to={to} />}
        {view === "company" && <EliminationsNote />}
      </Page>

      {drill && <DrillDrawer root={drill} onClose={() => setDrill(null)} />}

      <PrintStatement
        statement={statement}
        scopeCaption={scopeCaption}
        periodCaption={periodCaption}
        single={view === "single" ? single : null}
        con={view === "single" ? null : con}
      />
    </>
  );
}

function Control({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span style={{
        fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase",
        letterSpacing: "0.6px", whiteSpace: "nowrap",
      }}>{label}</span>
      {children}
    </div>
  );
}

function BalanceNote({ report, con }) {
  const assets = report ? reportAmount(report, "t-assets") : con.rows.find((r) => r.id === "t-assets").group;
  const leq = report ? reportAmount(report, "t-leq") : con.rows.find((r) => r.id === "t-leq").group;
  return (
    <Card title="Why this balances" pad={14}>
      <Hint>
        Total assets of <strong>{money(assets)}</strong> against liabilities and equity of{" "}
        <strong>{money(leq)}</strong>. Equity carries the retained earnings brought forward
        at 31 December 2025 plus the profit computed from the income statement for the same
        scope and period — nothing is plugged, so the indicator above is a live difference of
        the two totals rather than a label.
      </Hint>
    </Card>
  );
}

function CashFlowNote({ report, con, from, to }) {
  const closing = report ? reportAmount(report, "t-close") : con.rows.find((r) => r.id === "t-close").group;
  const movement = report ? reportAmount(report, "t-move") : con.rows.find((r) => r.id === "t-move").group;
  return (
    <Card title="Why this ties" pad={14}>
      <Hint>
        Cash moved by <strong>{money(movement)}</strong> between {prettyDate(from)} and{" "}
        {prettyDate(to)}, closing at <strong>{money(closing)}</strong> — the same figure as
        Bank on the balance sheet at that date. Every account that is not a bank account is
        classified into exactly one line above, so the movement on cash is the arithmetic
        opposite of the movement on everything else. It cannot drift.
      </Hint>
    </Card>
  );
}

function EliminationsNote() {
  return (
    <Card title="How Eliminations is derived" pad={14}>
      <Hint>
        Every intercompany line carries the counterparty company it was raised against. The
        Eliminations column is the arithmetic opposite of those lines — it is not typed in.
        The management fee Holdings charges Hospitality therefore shows as income in one
        column, expense in another, and nil in Group. Click either figure to see the two
        journals behind it.
      </Hint>
    </Card>
  );
}

// ─── Print ────────────────────────────────────────────────────────────────────
// Rendered hidden and revealed only inside @media print, as print.jsx sets up.

function PrintStatement({ statement, scopeCaption, periodCaption, single, con }) {
  const rows = single ? single.rows : con.rows;
  const cols = con ? [...con.columns.map((c) => c.label), ...(con.eliminate ? ["Eliminations"] : []), "Total"] : [BASE_CURRENCY];
  const valueFor = (r) => {
    if (single) return [r.amount];
    return [...con.columns.map((c) => r.amounts[c.id]), ...(con.eliminate ? [r.elim] : []), r.group];
  };
  return (
    <PrintSheet
      title={statement.label}
      subtitle={`${scopeCaption} · ${periodCaption}`}
      org={GROUP_NAME}
      meta={[`${BASE_CURRENCY}, no decimals`]}
      footer="Prepared by Ezra360 Financials from the general ledger. Every figure on this statement is derived from posted journals."
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
        <thead style={{ display: "table-header-group" }}>
          <tr>
            <th style={{ textAlign: "left", padding: "5px 6px", borderBottom: `1px solid ${C.ink}`, fontSize: 9 }} />
            {cols.map((c) => (
              <th key={c} style={{
                textAlign: "right", padding: "5px 6px", borderBottom: `1px solid ${C.ink}`,
                fontSize: 9, textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap",
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            if (r.kind === "section") {
              return (
                <tr key={r.id}>
                  <td colSpan={cols.length + 1} style={{
                    padding: "10px 6px 3px", fontSize: 9, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.5px",
                  }}>{r.label}</td>
                </tr>
              );
            }
            const bold = r.kind !== "line";
            return (
              <tr key={r.id} style={{ breakInside: "avoid" }}>
                <td style={{
                  padding: "3px 6px", paddingLeft: r.kind === "line" ? 16 : 6,
                  fontWeight: bold ? 700 : 400,
                  borderTop: bold ? `1px solid ${C.hairline}` : "none",
                }}>{r.label}</td>
                {valueFor(r).map((v, i) => (
                  <td key={i} style={{
                    padding: "3px 6px", textAlign: "right", fontWeight: bold ? 700 : 400,
                    borderTop: bold ? `1px solid ${C.hairline}` : "none",
                    fontVariantNumeric: "tabular-nums",
                  }}>{fmtBase(v)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </PrintSheet>
  );
}
