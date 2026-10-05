// The general ledger.
//
// What an accountant means when they ask to see the ledger: every account with
// its opening balance, the period's debits and credits and its closing balance;
// any account opened out into its own listing with a running balance; and the
// trial balance that proves the whole thing nets to nil.
//
// Opening is everything up to the day before the period starts, so
// opening + movement = closing is arithmetic rather than a reconciliation.

import { useMemo, useState } from "react";
import { ArrowLeft20Regular, Print20Regular, Scales20Regular } from "@fluentui/react-icons";
import {
  BP, Btn, C, Card, FluentSelect, I, Pill, PrintSheet, Stat, Tabs, ViewHeader,
  useMaxWidth, usePrintExport,
} from "../../components/index.js";
import {
  BASE_CURRENCY, FY, GROUP_NAME, TODAY, addMonths, branchName, fmtBase, fmtForeign,
  fmtRate, monthEnd, monthKey, monthLabel, monthStart, money, prettyDate, scopeLabel,
} from "../config.js";
import { account as coaAccount, naturalSign } from "../engine/coa.js";
import { accountLedger, generalLedger, journalById, trialBalance } from "../engine/ledger.js";
import { mappingName } from "../engine/mapping.js";
import { useFinance } from "../state.js";
import { Hint, JournalEntry, KeyValue, Num, Page, RegisterTable, Row, SubHead } from "../ui.jsx";
import { linkBtn } from "../styles.js";
import { SourceDoc } from "./Drill.jsx";

const MONTHS = Array.from({ length: 12 }, (_, i) => addMonths("2026-01", i));

// Period is shared by both tabs and by the account listing, so it lives here.
function usePeriod() {
  const [mode, setMode] = useState("ytd");
  const [month, setMonth] = useState(monthKey(TODAY));
  const range = useMemo(() => (mode === "month"
    ? { from: monthStart(month), to: monthEnd(month) }
    : { from: FY.start, to: monthEnd(month) }), [mode, month]);
  const caption = mode === "month" ? monthLabel(month) : `Year to date · 1 Jan – ${prettyDate(range.to)}`;
  return { mode, setMode, month, setMonth, ...range, caption };
}

function PeriodControls({ period }) {
  return (
    <>
      <Control label="Period">
        <FluentSelect
          size="sm" value={period.mode} style={{ width: 140 }}
          options={[{ value: "ytd", label: "Year to date" }, { value: "month", label: "Single month" }]}
          onChange={(e) => period.setMode(String(e.target.value))}
        />
      </Control>
      <Control label={period.mode === "month" ? "Month" : "To"}>
        <FluentSelect
          size="sm" value={period.month} style={{ width: 150 }}
          options={MONTHS.map((m) => ({ value: m, label: monthLabel(m) }))}
          onChange={(e) => period.setMonth(String(e.target.value))}
        />
      </Control>
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

export function GeneralLedgerView() {
  const store = useFinance();
  const code = store.route.rest[0];
  if (code && coaAccount(code)) return <AccountLedger code={code} />;
  return <LedgerSummary />;
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function LedgerSummary() {
  const store = useFinance();
  const compact = useMaxWidth(BP.lg);
  const period = usePeriod();
  const [tab, setTab] = useState("ledger");
  const [onlyMoved, setOnlyMoved] = useState(true);
  const { print } = usePrintExport();

  const rows = useMemo(
    () => generalLedger(store.ledger, { scope: store.scope, from: period.from, to: period.to })
      .filter((r) => !onlyMoved || r.entries > 0 || r.opening !== 0),
    [store.ledger, store.scope, period.from, period.to, onlyMoved],
  );

  const tb = useMemo(
    () => trialBalance(store.ledger, { scope: store.scope, to: period.to }),
    [store.ledger, store.scope, period.to],
  );

  const totals = rows.reduce(
    (a, r) => ({ debit: a.debit + r.debit, credit: a.credit + r.credit }),
    { debit: 0, credit: 0 },
  );
  const tbTotals = tb.reduce(
    (a, r) => ({ debit: a.debit + r.debit, credit: a.credit + r.credit }),
    { debit: 0, credit: 0 },
  );
  const tbDiff = tbTotals.debit - tbTotals.credit;

  return (
    <>
      <ViewHeader
        title="General ledger"
        subtitle={`${scopeLabel(store.scope)} · ${period.caption}`}
        action={
          <Btn variant="secondary" onClick={() => print()}>
            <I as={Print20Regular} size={14} /> Print / PDF
          </Btn>
        }
      />
      <div style={{ padding: "0 20px", background: "#fff", borderBottom: `1px solid ${C.hairline}`, flexShrink: 0 }}>
        <Tabs
          items={[
            { id: "ledger", label: "General ledger", count: rows.length },
            { id: "tb", label: "Trial balance", count: tb.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>
      <div style={{
        display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center",
        padding: "10px 20px", background: C.surfaceAlt, borderBottom: `1px solid ${C.hairline}`, flexShrink: 0,
      }}>
        <PeriodControls period={period} />
        {tab === "ledger" && (
          <Btn variant={onlyMoved ? "ghost" : "secondary"} size="sm" onClick={() => setOnlyMoved((o) => !o)}>
            {onlyMoved ? "Accounts with activity" : "All accounts"}
          </Btn>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7 }}>
          <I as={Scales20Regular} size={15} color={tbDiff === 0 ? C.success : C.danger} />
          <span style={{ fontSize: 12, fontWeight: 700, color: tbDiff === 0 ? C.success : C.danger }}>
            {tbDiff === 0 ? "Trial balance nets to nil" : `Out by ${fmtBase(tbDiff)}`}
          </span>
        </div>
      </div>

      <Page>
        {tab === "ledger" ? (
          <>
            <Row>
              <Stat label="Accounts with activity" value={String(rows.filter((r) => r.entries > 0).length)}
                    sub={`of ${rows.length} shown`} basis={190} />
              <Stat label="Debits in the period" value={money(totals.debit)} basis={200} />
              <Stat label="Credits in the period" value={money(totals.credit)}
                    sub={totals.debit === totals.credit ? "Equal, as they must be" : "Out of balance"} basis={200} />
              <Stat label="Journals" value={String(store.ledger.journals.length)}
                    sub="Every one posted by a ledger entry mapping" basis={180} />
            </Row>

            <Card
              title="General ledger"
              subtitle="Opening balance, the period's movement, and the closing balance. Click an account for its listing."
              right={<Pill fg={C.muted} bg={C.surfaceMute}>{BASE_CURRENCY}, no decimals</Pill>}
              pad={compact ? 8 : 14}
            >
              <RegisterTable
                getKey={(r) => r.code}
                rows={rows}
                onRowClick={(r) => store.go(`ledger/${r.code}`)}
                columns={[
                  { id: "code", label: "Code", width: 66, render: (r) => <strong>{r.code}</strong>,
                    total: (rs) => `${rs.length} accounts` },
                  { id: "name", label: "Account", render: (r) => r.name },
                  { id: "opening", label: "Opening", align: "right", render: (r) => <Num value={r.opening} /> },
                  {
                    id: "debit", label: "Debit", align: "right",
                    render: (r) => <Num value={r.debit} blankZero />,
                    total: () => <Num value={totals.debit} weight={700} />,
                  },
                  {
                    id: "credit", label: "Credit", align: "right",
                    render: (r) => <Num value={r.credit} blankZero />,
                    total: () => <Num value={totals.credit} weight={700} />,
                  },
                  {
                    id: "closing", label: "Closing", align: "right",
                    render: (r) => <Num value={r.closing} weight={600} />,
                  },
                  {
                    id: "entries", label: "Entries", align: "right",
                    render: (r) => (r.entries || <span style={{ color: C.faint }}>—</span>),
                  },
                ]}
              />
            </Card>

            <Card title="Why opening plus movement is always closing" pad={14}>
              <Hint>
                The opening balance is not stored anywhere and is not rolled forward by a process.
                It is every line posted to the account before{" "}
                <strong>{prettyDate(period.from)}</strong>, added up on demand. The closing balance
                is the same sum taken to <strong>{prettyDate(period.to)}</strong>. There is no step
                in between for the two to drift apart in.
              </Hint>
            </Card>
          </>
        ) : (
          <>
            <Row>
              <Stat label="Total debits" value={money(tbTotals.debit)} basis={200} />
              <Stat label="Total credits" value={money(tbTotals.credit)} basis={200} />
              <Stat label="Difference" value={tbDiff === 0 ? "Nil" : money(tbDiff)}
                    tone={tbDiff === 0 ? C.success : C.danger}
                    sub={`At ${prettyDate(period.to)} · ${scopeLabel(store.scope)}`} basis={220} />
            </Row>
            <Card
              title={`Trial balance at ${prettyDate(period.to)}`}
              subtitle={scopeLabel(store.scope)}
              pad={compact ? 8 : 14}
            >
              <RegisterTable
                getKey={(r) => r.code}
                rows={tb}
                onRowClick={(r) => store.go(`ledger/${r.code}`)}
                columns={[
                  { id: "code", label: "Code", width: 66, render: (r) => <strong>{r.code}</strong>,
                    total: (rs) => `${rs.length} accounts` },
                  { id: "name", label: "Account", render: (r) => r.name },
                  { id: "type", label: "Type", render: (r) => (
                    <span style={{ fontSize: 11.5, color: C.muted, textTransform: "capitalize" }}>{r.type}</span>
                  ) },
                  {
                    id: "debit", label: "Debit", align: "right",
                    render: (r) => <Num value={r.debit} blankZero />,
                    total: () => <Num value={tbTotals.debit} weight={700} />,
                  },
                  {
                    id: "credit", label: "Credit", align: "right",
                    render: (r) => <Num value={r.credit} blankZero />,
                    total: () => <Num value={tbTotals.credit} weight={700} />,
                  },
                ]}
              />
            </Card>
          </>
        )}
      </Page>

      <PrintSheet
        title={tab === "ledger" ? "General ledger" : "Trial balance"}
        subtitle={`${scopeLabel(store.scope)} · ${tab === "ledger" ? period.caption : `at ${prettyDate(period.to)}`}`}
        org={GROUP_NAME}
        meta={[`${BASE_CURRENCY}, no decimals`]}
        footer="Prepared by Ezra360 Financials from the general ledger. Every figure is derived from posted journals."
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
          <thead style={{ display: "table-header-group" }}>
            <tr>
              {(tab === "ledger"
                ? ["Code", "Account", "Opening", "Debit", "Credit", "Closing"]
                : ["Code", "Account", "Debit", "Credit"]).map((h, i) => (
                  <th key={h} style={{
                    textAlign: i <= 1 ? "left" : "right", padding: "5px 6px",
                    borderBottom: `1px solid ${C.ink}`, fontSize: 9,
                    textTransform: "uppercase", letterSpacing: "0.4px",
                  }}>{h}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {(tab === "ledger" ? rows : tb).map((r) => (
              <tr key={r.code} style={{ breakInside: "avoid" }}>
                <td style={printCell}>{r.code}</td>
                <td style={printCell}>{r.name}</td>
                {tab === "ledger" && <td style={printNum}>{fmtBase(r.opening)}</td>}
                <td style={printNum}>{fmtBase(r.debit)}</td>
                <td style={printNum}>{fmtBase(r.credit)}</td>
                {tab === "ledger" && <td style={printNum}>{fmtBase(r.closing)}</td>}
              </tr>
            ))}
            <tr style={{ breakInside: "avoid" }}>
              <td style={{ ...printCell, fontWeight: 700, borderTop: `1px solid ${C.ink}` }} colSpan={2}>Total</td>
              {tab === "ledger" && <td style={{ ...printNum, borderTop: `1px solid ${C.ink}` }} />}
              <td style={{ ...printNum, fontWeight: 700, borderTop: `1px solid ${C.ink}` }}>
                {fmtBase(tab === "ledger" ? totals.debit : tbTotals.debit)}
              </td>
              <td style={{ ...printNum, fontWeight: 700, borderTop: `1px solid ${C.ink}` }}>
                {fmtBase(tab === "ledger" ? totals.credit : tbTotals.credit)}
              </td>
              {tab === "ledger" && <td style={{ ...printNum, borderTop: `1px solid ${C.ink}` }} />}
            </tr>
          </tbody>
        </table>
      </PrintSheet>
    </>
  );
}

const printCell = { padding: "3px 6px", textAlign: "left" };
const printNum = { padding: "3px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums" };

// ─── One account ──────────────────────────────────────────────────────────────

function AccountLedger({ code }) {
  const store = useFinance();
  const compact = useMaxWidth(BP.lg);
  const period = usePeriod();
  const [openJournal, setOpenJournal] = useState(null);
  const acc = coaAccount(code);

  const ledger = useMemo(
    () => accountLedger(store.ledger, { code, scope: store.scope, from: period.from, to: period.to }),
    [store.ledger, code, store.scope, period.from, period.to],
  );

  const dr = ledger.rows.reduce((a, l) => a + l.debit, 0);
  const cr = ledger.rows.reduce((a, l) => a + l.credit, 0);
  const sign = naturalSign(code);
  const journal = openJournal ? journalById(store.ledger, openJournal) : null;

  return (
    <>
      <ViewHeader
        title={`${code} · ${acc.name}`}
        subtitle={`${scopeLabel(store.scope)} · ${period.caption} · ${acc.type} account, normal balance ${sign === 1 ? "debit" : "credit"}`}
        action={
          <Btn variant="secondary" onClick={() => store.go("ledger")}>
            <I as={ArrowLeft20Regular} size={14} /> Back to the ledger
          </Btn>
        }
      />
      <div style={{
        display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center",
        padding: "10px 20px", background: C.surfaceAlt, borderBottom: `1px solid ${C.hairline}`, flexShrink: 0,
      }}>
        <PeriodControls period={period} />
      </div>

      <Page>
        <Row>
          <Stat label="Opening balance" value={money(ledger.opening)} basis={185} />
          <Stat label="Debits" value={money(dr)} basis={170} />
          <Stat label="Credits" value={money(cr)} basis={170} />
          <Stat label="Closing balance" value={money(ledger.closing)} tone={C.brand}
                sub={`${ledger.rows.length} entries in the period`} basis={195} />
        </Row>

        <Card
          title="Account listing"
          subtitle="Oldest first, with a running balance. Click an entry to open the journal and the document behind it."
          pad={compact ? 8 : 14}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Reference", "Narration", "Branch", "Posted by", "Debit", "Credit", "Balance"].map((h, i) => (
                  <th key={h} style={{
                    textAlign: i >= 5 ? "right" : "left", padding: "8px", fontSize: 10, fontWeight: 700,
                    color: C.faint, textTransform: "uppercase", letterSpacing: "0.6px",
                    borderBottom: `1px solid ${C.hairline}`, whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: C.surfaceAlt }}>
                <td style={{ ...cell, fontWeight: 600 }} colSpan={5}>
                  Opening balance at {prettyDate(period.from)}
                </td>
                <td style={cell} />
                <td style={cell} />
                <td style={{ ...cell, textAlign: "right" }}><Num value={ledger.opening} weight={600} /></td>
              </tr>
              {ledger.rows.map((l) => (
                <tr key={l.key} style={{ borderBottom: `1px solid ${C.surfaceMute}` }}>
                  <td style={{ ...cell, whiteSpace: "nowrap" }}>{prettyDate(l.date)}</td>
                  <td style={cell}>
                    <button onClick={() => setOpenJournal(l.journalId)} style={{ ...linkBtn, fontSize: 12 }}>
                      {l.ref}
                    </button>
                  </td>
                  <td style={cell}>
                    {l.memo}
                    {l.fx && l.fx.currency !== BASE_CURRENCY && (
                      <span style={{ color: C.muted, marginLeft: 6, fontSize: 11.5 }}>
                        ({l.fx.currency} {fmtForeign(l.fx.amount, l.fx.currency)} @ {fmtRate(l.fx.rate)})
                      </span>
                    )}
                  </td>
                  <td style={{ ...cell, color: C.muted, fontSize: 11.5, whiteSpace: "nowrap" }}>
                    {branchName(l.company, l.branch)}
                  </td>
                  <td style={{ ...cell, fontSize: 11, color: C.muted }}>
                    {l.rule ? <span style={{ color: C.brand, fontWeight: 600 }}>{l.rule}</span> : "—"}
                    {l.mappingId && (
                      <div style={{ fontSize: 10, color: C.faint }}>{mappingName(l.mappingId)}</div>
                    )}
                  </td>
                  <td style={{ ...cell, textAlign: "right" }}><Num value={l.debit} blankZero /></td>
                  <td style={{ ...cell, textAlign: "right" }}><Num value={l.credit} blankZero /></td>
                  <td style={{ ...cell, textAlign: "right" }}><Num value={l.running} weight={600} /></td>
                </tr>
              ))}
              {ledger.rows.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 34, textAlign: "center", color: C.faint, fontSize: 12.5 }}>
                  Nothing posted to this account for this scope and period.
                </td></tr>
              )}
              <tr style={{ borderTop: `1px solid ${C.ink}`, background: C.surfaceAlt }}>
                <td style={{ ...cell, fontWeight: 700, borderBottom: `3px double ${C.ink}` }} colSpan={5}>
                  Closing balance at {prettyDate(period.to)}
                </td>
                <td style={{ ...cell, textAlign: "right", fontWeight: 700, borderBottom: `3px double ${C.ink}` }}>
                  <Num value={dr} weight={700} />
                </td>
                <td style={{ ...cell, textAlign: "right", fontWeight: 700, borderBottom: `3px double ${C.ink}` }}>
                  <Num value={cr} weight={700} />
                </td>
                <td style={{ ...cell, textAlign: "right", borderBottom: `3px double ${C.ink}` }}>
                  <Num value={ledger.closing} weight={700} />
                </td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card title="Account configuration" pad={14}>
          <div style={{ display: "grid", gap: "2px 28px", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))" }}>
            <KeyValue label="Code">{code}</KeyValue>
            <KeyValue label="Name">{acc.name}</KeyValue>
            <KeyValue label="Type"><span style={{ textTransform: "capitalize" }}>{acc.type}</span></KeyValue>
            <KeyValue label="Normal balance">{sign === 1 ? "Debit" : "Credit"}</KeyValue>
            <KeyValue label="Cash-flow classification"><span style={{ textTransform: "capitalize" }}>{acc.cf}</span></KeyValue>
            <KeyValue label="Statement">
              {["asset", "liability", "equity"].includes(acc.type) ? "Balance sheet" : "Profit & loss"}
            </KeyValue>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => store.go("accounts")} style={linkBtn}>Open in the chart of accounts →</button>
            <button onClick={() => store.go("mapping")} style={linkBtn}>See the ledger mappings →</button>
          </div>
        </Card>
      </Page>

      {journal && (
        <JournalDrawer journal={journal} onClose={() => setOpenJournal(null)} />
      )}
    </>
  );
}

const cell = { padding: "7px 8px", fontSize: 12.5, verticalAlign: "top" };

function JournalDrawer({ journal, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 4500 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.32)", backdropFilter: "blur(2px)" }} />
      <div className="slide-left" style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 700, maxWidth: "48vw",
        background: "#fff", boxShadow: "-12px 0 32px rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          padding: "14px 20px", borderBottom: `1px solid ${C.hairline}`, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{journal.ref}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{prettyDate(journal.date)} · {journal.memo}</div>
          </div>
          <Btn variant="secondary" size="sm" onClick={onClose}>Close</Btn>
        </div>
        <div style={{ overflow: "auto", flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {journal.mappingId && (
            <div style={{
              border: `1px solid ${C.hairline}`, borderRadius: 8, background: C.brandTintSoft, padding: "10px 14px",
            }}>
              <SubHead>Posted by</SubHead>
              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 700, color: C.ink }}>
                {mappingName(journal.mappingId)}
              </div>
              <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {journal.lines.map((l, i) => (
                  <Pill key={i} fg={l.debit ? C.brand : "#8764b8"} bg="#fff" outline>
                    {l.rule || "—"}
                  </Pill>
                ))}
              </div>
            </div>
          )}
          <div>
            <SubHead>Journal entry</SubHead>
            <div style={{ marginTop: 8 }}><JournalEntry journal={journal} dense hideMapping /></div>
          </div>
          <SourceDoc journal={journal} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
