// Home — where the demo opens and closes.
//
// Scene 0: one system, three companies, five branches, one ledger, October open.
// Scene 7: the recap card, which is the client's email answered point by point
// with a link beside each line.

import { useMemo } from "react";
import { ArrowRight20Regular, CheckmarkCircle20Filled, Wallet20Regular } from "@fluentui/react-icons";
import { BP, Btn, C, Card, I, Pill, Stat, ViewHeader, useMaxWidth } from "../../components/index.js";
import {
  BASE_CURRENCY, COMPANIES, FY, GROUP_NAME, TODAY,
  monthEnd, monthLabel, money, prettyDate, scopeLabel,
} from "../config.js";
import { CASH_CODES, PREPAID_CODES, PPE_ACCUM_CODES, PPE_COST_CODES } from "../engine/coa.js";
import { balance } from "../engine/ledger.js";
import { netProfit } from "../engine/reports.js";
import { invoiceStatus, outstandingForeign } from "../engine/fx.js";
import { useFinance } from "../state.js";
import { Hint, Num, Page, RegisterTable, Row, SubHead} from "../ui.jsx";
import { linkBtn } from "../styles.js";

// The five things Vince asked for, in his order.
const REQUESTS = [
  {
    id: 1,
    ask: "Purchase of fixed assets depreciated over their useful life with auto depreciation applied to get the NBV",
    where: "Fixed Assets",
    link: "assets",
    shown: "The Hiace: cost 180,000,000, nine charges posted, NBV 153,000,000, and a 60-month schedule nobody typed.",
  },
  {
    id: 2,
    ask: "An invoice of expense deferral with auto amortization over a period of time",
    where: "Deferred Expenses",
    link: "deferrals",
    shown: "Medical insurance of 120,000,000 prepaid in January, released at 10,000,000 a month, nothing in the P&L on day one.",
  },
  {
    id: 3,
    ask: "Business unit consolidation of all companies and branch accounting — drill down",
    where: "Reports › Consolidated",
    link: "reports/consolidated",
    shown: "A column per company, Eliminations derived from the intercompany tags, a Group total, and any figure clickable to the journal behind it.",
  },
  {
    id: 4,
    ask: "Financial statements — balance sheet, P&L, cash flow statement",
    where: "Reports",
    link: "reports",
    shown: "All three, for the group or any company or branch, with the balance sheet balancing on a live check and the cash flow closing on the bank balance.",
  },
  {
    id: 5,
    ask: "Multi currency application of a local currency payment to a dollar invoice",
    where: "Payables",
    link: "payables",
    shown: "A USD 10,000 invoice at 3,700 settled from the shilling account at 3,750 — the 500,000 difference posts itself to realised FX.",
  },
];

export function HomeView() {
  const store = useFinance();
  const compact = useMaxWidth(BP.lg);
  const asAt = monthEnd(store.closedThrough) > TODAY ? monthEnd(store.closedThrough) : TODAY;

  const figures = useMemo(() => {
    const scope = store.scope;
    return {
      cash: balance(store.ledger, { codes: CASH_CODES, scope, to: asAt }),
      ppe: balance(store.ledger, { codes: [...PPE_COST_CODES, ...PPE_ACCUM_CODES], scope, to: asAt }),
      prepaid: balance(store.ledger, { codes: PREPAID_CODES, scope, to: asAt }),
      profit: netProfit(store.ledger, { scope, from: FY.start, to: asAt }),
    };
  }, [store.ledger, store.scope, asAt]);

  const foreignOpen = store.invoices
    .filter((i) => i.currency !== BASE_CURRENCY && invoiceStatus(store.ledger, i) !== "paid")
    .map((i) => ({ invoice: i, outstanding: outstandingForeign(store.ledger, i) }));

  const byCompany = useMemo(() => COMPANIES.map((c) => ({
    company: c,
    cash: balance(store.ledger, { codes: CASH_CODES, scope: { company: c.id, branch: null }, to: asAt }),
    profit: netProfit(store.ledger, { scope: { company: c.id, branch: null }, from: FY.start, to: asAt }),
    branches: c.branches.length,
  })), [store.ledger, asAt]);

  return (
    <>
      <ViewHeader
        title="Ezra360 Financials"
        subtitle={`${GROUP_NAME} · ${COMPANIES.length} companies · ${COMPANIES.reduce((a, c) => a + c.branches.length, 0)} branches · one ledger`}
      />
      <Page>
        <Row>
          <Stat label={`Cash — ${scopeLabel(store.scope)}`} value={money(figures.cash)}
                icon={<I as={Wallet20Regular} size={14} color={C.muted} />}
                sub={`at ${prettyDate(asAt)}`} basis={230} />
          <Stat label="Fixed assets at NBV" value={money(figures.ppe)} basis={190} />
          <Stat label="Prepayments" value={money(figures.prepaid)} basis={180} />
          <Stat label="Profit year to date" value={money(figures.profit)}
                tone={figures.profit >= 0 ? C.success : C.danger} basis={190} />
          <Stat label="Open foreign payables"
                value={foreignOpen.length
                  ? foreignOpen.map((f) => `${f.invoice.currency} ${(f.outstanding / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`).join(" · ")
                  : "None"}
                sub={foreignOpen.length ? "Still in the supplier's currency" : "All settled"} basis={220} />
        </Row>

        <Card
          title="What this demo answers"
          subtitle="The five things in the brief, each with a live step rather than a prepared screen"
          pad={compact ? 10 : 16}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {REQUESTS.map((r) => (
              <div key={r.id} style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                border: `1px solid ${C.hairline}`, borderRadius: 8, padding: "12px 14px", background: "#fff",
              }}>
                <span style={{ display: "inline-flex", marginTop: 1, flexShrink: 0 }}>
                  <I as={CheckmarkCircle20Filled} size={18} color={C.success} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, lineHeight: 1.4 }}>{r.ask}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.55 }}>{r.shown}</div>
                </div>
                <Btn variant="ghost" size="sm" onClick={() => store.go(r.link)} style={{ flexShrink: 0 }}>
                  {r.where} <I as={ArrowRight20Regular} size={13} />
                </Btn>
              </div>
            ))}
          </div>
        </Card>

        <Row>
          <Card title="Group structure" subtitle="Branch is a dimension on every journal line, not a separate ledger"
                style={{ flex: "1 1 420px" }} pad={14}>
            <RegisterTable
              totals={false}
              getKey={(r) => r.company.id}
              rows={byCompany}
              columns={[
                {
                  id: "company", label: "Company",
                  render: (r) => (
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.company.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>
                        {r.company.branches.map((b) => b.name).join(" · ")}
                      </div>
                    </div>
                  ),
                },
                { id: "cash", label: "Cash", align: "right", render: (r) => <Num value={r.cash} /> },
                { id: "profit", label: "Profit YTD", align: "right", render: (r) => <Num value={r.profit} weight={600} /> },
                {
                  id: "go", label: "", align: "right",
                  render: (r) => (
                    <button onClick={(e) => { e.stopPropagation(); store.setScope({ company: r.company.id, branch: null }); }}
                            style={{ ...linkBtn, fontSize: 12 }}>
                      Scope to this
                    </button>
                  ),
                },
              ]}
            />
            <Hint>
              Consolidation is not a separate set of books. Every line carries its company and its
              branch, and the statements are the same specification run against a different scope.
            </Hint>
          </Card>

          <Card title="Where the books stand" style={{ flex: "1 1 320px" }} pad={14}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Pill fg={C.success} bg={C.successBg}>Closed to {prettyDate(monthEnd(store.closedThrough))}</Pill>
                <Pill fg={C.brand} bg={C.brandTint}>{monthLabel(store.openPeriod)} open</Pill>
              </div>
              <Hint>
                Everything up to {prettyDate(monthEnd(store.closedThrough))} is posted, including nine
                months of depreciation and amortisation. {monthLabel(store.openPeriod)} is open: what
                the presenter captures lands there, and running month-end posts the schedules for it.
              </Hint>
              <div style={{ borderTop: `1px solid ${C.hairline}`, paddingTop: 10 }}>
                <SubHead>Captured in this session</SubHead>
                {store.activity.length === 0 ? (
                  <Hint>Nothing yet — the ledger is at its opening state.</Hint>
                ) : (
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                    {store.activity.slice().reverse().map((a, i) => (
                      <div key={`${a.kind}-${a.id}-${i}`} style={{ display: "flex", gap: 8, fontSize: 12, lineHeight: 1.5 }}>
                        <span style={{ color: C.faint, flexShrink: 0, width: 72 }}>{prettyDate(a.date)}</span>
                        <span style={{ color: C.ink }}>{a.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ borderTop: `1px solid ${C.hairline}`, paddingTop: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <button onClick={() => store.go("period-close")} style={linkBtn}>Run month-end →</button>
                <button onClick={() => store.go("journals")} style={linkBtn}>
                  {store.ledger.journals.length} journals →
                </button>
              </div>
            </div>
          </Card>
        </Row>

        <Card title="One ledger, nothing else holds a number" pad={14}
              right={<Pill fg={C.muted} bg={C.surfaceMute}>{store.ledger.journals.length} journals</Pill>}>
          <Hint>
            Asset net book values, prepaid balances, every line of every statement and every
            drill-down level are computed from the same posted journal lines. No report total is
            stored anywhere, which is what makes the drill-down honest: the figure the client clicks
            and the journals underneath it are the same arithmetic read twice. And nothing decides on
            its own what to debit and what to credit — every journal is posted by a ledger entry
            mapping you can open and read.
          </Hint>
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn variant="ghost" size="sm" onClick={() => store.go("accounts")}>
              Chart of accounts <I as={ArrowRight20Regular} size={13} />
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => store.go("mapping")}>
              Ledger mapping <I as={ArrowRight20Regular} size={13} />
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => store.go("ledger")}>
              General ledger <I as={ArrowRight20Regular} size={13} />
            </Btn>
          </div>
        </Card>
      </Page>
    </>
  );
}
