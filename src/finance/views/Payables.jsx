// Payables and the multi-currency payment — request 5.
//
// The invoice never leaves its own currency. The pay panel relieves payables at
// the invoice rate, moves cash at the payment rate, and shows the realised gain
// or loss live as the user types — before anything is posted. The journal preview
// is built by the same function that does the posting, so the two cannot differ.

import { useMemo, useState } from "react";
import {
  ArrowLeft20Regular, ArrowSwap20Regular, Money20Regular, Open20Regular,
} from "@fluentui/react-icons";
import {
  BP, Btn, C, Card, DataTable, Field, FluentSelect, FormDrawer, I, Modal, Pill,
  Stat, TextField, ViewHeader, useMaxWidth, useToast,
} from "../../components/index.js";
import {
  BASE_CURRENCY, MINOR, TODAY, branchName, companyShort, fmtRate,
  foreignWithCode, money, prettyDate, scopeLabel,
} from "../config.js";
import { ACCOUNTS, accountName } from "../engine/coa.js";
import { invoiceStatus, outstandingForeign, rateOn, ratesFor } from "../engine/fx.js";
import { previewPayment } from "../engine/actions.js";
import { journalById, lines as ledgerLines } from "../engine/ledger.js";
import { useFinance } from "../state.js";
import {
  Collapse, Foreign, Hint, JournalEntry, KeyValue, Num, Page, Rate, Row,
  StatusPill, SubHead,
} from "../ui.jsx";

const BANKS = ACCOUNTS.filter((a) => a.bank).map((a) => ({ value: a.code, label: `${a.name}`, currency: a.currency }));

// "10,000.50" → 1000050 cents. Minor units keep money off floats.
const parseForeign = (text, currency) => {
  const dp = MINOR[currency] ?? 2;
  const clean = String(text).replace(/[^\d.]/g, "");
  if (!clean) return 0;
  const n = Number(clean);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10 ** dp);
};

const formatForeignInput = (minor, currency) => {
  const dp = MINOR[currency] ?? 2;
  return (minor / 10 ** dp).toFixed(dp);
};

export function PayablesView() {
  const store = useFinance();
  const id = store.route.rest[0];
  const invoice = id ? store.invoices.find((i) => i.id === id) : null;
  if (invoice) return <InvoiceDetail invoice={invoice} />;
  return <InvoiceList />;
}

// ─── List ─────────────────────────────────────────────────────────────────────

function InvoiceList() {
  const store = useFinance();
  const [showRates, setShowRates] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(true);

  const rows = useMemo(() => {
    const { company, branch } = store.scope;
    return store.invoices
      .filter((i) => (!company || i.company === company) && (!branch || i.branch === branch))
      .map((i) => ({
        invoice: i,
        status: invoiceStatus(store.ledger, i),
        outstanding: outstandingForeign(store.ledger, i),
      }))
      .filter((r) => !onlyOpen || r.status !== "paid")
      .sort((a, b) => b.invoice.invoiceDate.localeCompare(a.invoice.invoiceDate));
  }, [store.invoices, store.ledger, store.scope, onlyOpen]);

  const openBase = rows.reduce(
    (a, r) => a + (r.status === "paid" ? 0 : Math.round((r.outstanding / 10 ** (MINOR[r.invoice.currency] ?? 0)) * r.invoice.rate)),
    0,
  );
  const foreignOpen = rows.filter((r) => r.invoice.currency !== BASE_CURRENCY && r.status !== "paid");

  const columns = [
    {
      id: "supplier", label: "Supplier", minWidth: 200,
      get: (r) => r.invoice.supplier,
      renderCell: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: C.ink }}>{r.invoice.supplier}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{r.invoice.ref} · {r.invoice.description}</div>
        </div>
      ),
    },
    {
      id: "where", label: "Branch", filterable: true,
      get: (r) => `${companyShort(r.invoice.company)} · ${branchName(r.invoice.company, r.invoice.branch)}`,
      renderCell: (r) => (
        <span style={{ fontSize: 11.5, color: C.muted, whiteSpace: "nowrap" }}>
          {companyShort(r.invoice.company)} · {branchName(r.invoice.company, r.invoice.branch)}
        </span>
      ),
    },
    { id: "date", label: "Invoice date", get: (r) => r.invoice.invoiceDate, renderCell: (r) => prettyDate(r.invoice.invoiceDate) },
    { id: "currency", label: "Ccy", filterable: true, get: (r) => r.invoice.currency },
    {
      id: "foreign", label: "Invoiced", align: "right", get: (r) => r.invoice.fxAmount,
      renderCell: (r) => (r.invoice.currency === BASE_CURRENCY
        ? <span style={{ color: C.faint }}>—</span>
        : <Foreign value={r.invoice.fxAmount} currency={r.invoice.currency} />),
    },
    {
      id: "rate", label: "Rate", align: "right", get: (r) => r.invoice.rate,
      renderCell: (r) => (r.invoice.currency === BASE_CURRENCY
        ? <span style={{ color: C.faint }}>—</span>
        : <Rate value={r.invoice.rate} />),
    },
    { id: "base", label: `${BASE_CURRENCY} value`, align: "right", get: (r) => r.invoice.baseAmount, renderCell: (r) => <Num value={r.invoice.baseAmount} /> },
    {
      id: "outstanding", label: "Outstanding", align: "right", get: (r) => r.outstanding,
      renderCell: (r) => (r.outstanding === 0
        ? <span style={{ color: C.faint }}>—</span>
        : <Foreign value={r.outstanding} currency={r.invoice.currency} weight={600} />),
    },
    { id: "status", label: "Status", filterable: true, get: (r) => r.status, renderCell: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <>
      <ViewHeader
        title="Payables"
        subtitle={`${scopeLabel(store.scope)} · ${money(openBase)} outstanding`}
        action={
          <Btn variant="secondary" onClick={() => setShowRates(true)}>
            <I as={ArrowSwap20Regular} size={14} /> Exchange rates
          </Btn>
        }
      />
      <div style={{ padding: "14px 20px 0", flexShrink: 0 }}>
        <Row>
          <Stat label="Outstanding" value={money(openBase)}
                icon={<I as={Money20Regular} size={14} color={C.muted} />} basis={200} />
          <Stat
            label="Foreign-currency exposure"
            value={foreignOpen.length
              ? foreignOpen.map((r) => foreignWithCode(r.outstanding, r.invoice.currency)).join(" · ")
              : "None"}
            sub={foreignOpen.length ? "Still to be settled — carried at the invoice-date rate" : "Nothing open in a foreign currency"}
            basis={240}
          />
          <Stat label="Invoices" value={String(rows.length)}
                sub={onlyOpen ? "Open and part paid" : "All invoices"} basis={160} />
        </Row>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: "14px 20px 20px" }}>
        <div style={{
          border: `1px solid ${C.hairline}`, borderRadius: 8, overflow: "hidden",
          display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: "#fff",
        }}>
          <DataTable
            rows={rows}
            columns={columns}
            getKey={(r) => r.invoice.id}
            searchPlaceholder="Search supplier, invoice number, description…"
            searchKeys={["supplier", "where"]}
            defaultSort={{ col: "date", dir: "desc" }}
            defaultPageSize={10}
            onRowClick={(r) => store.go(`payables/${r.invoice.id}`)}
            emptyMessage="No invoices for this scope."
            toolbarRight={
              <Btn variant={onlyOpen ? "ghost" : "secondary"} size="sm" onClick={() => setOnlyOpen((o) => !o)}>
                {onlyOpen ? "Open only" : "All invoices"}
              </Btn>
            }
          />
        </div>
      </div>
      {showRates && <RatesModal onClose={() => setShowRates(false)} />}
    </>
  );
}

function RatesModal({ onClose }) {
  const store = useFinance();
  const rows = ratesFor(store.rates, "USD");
  return (
    <Modal title="Exchange rates — USD / UGX" onClose={onClose} width={520}>
      <div style={{ padding: 20 }}>
        <Hint>
          Units of {BASE_CURRENCY} per one US dollar. A payment picks up the latest rate on or
          before its date, and the presenter can override it on the payment screen.
        </Hint>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
          <thead>
            <tr>
              {["Date", "Pair", "Rate", "Source"].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 2 ? "right" : "left", padding: "7px 8px", fontSize: 10,
                  fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: "0.6px",
                  borderBottom: `1px solid ${C.hairline}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date} style={{ borderBottom: `1px solid ${C.surfaceMute}` }}>
                <td style={{ padding: "6px 8px", fontSize: 12.5 }}>{prettyDate(r.date)}</td>
                <td style={{ padding: "6px 8px", fontSize: 12.5 }}>USD / {BASE_CURRENCY}</td>
                <td style={{ padding: "6px 8px", fontSize: 12.5, textAlign: "right" }}><Rate value={r.rate} /></td>
                <td style={{ padding: "6px 8px", fontSize: 11.5, color: C.muted }}>{r.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

// ─── Detail ───────────────────────────────────────────────────────────────────

function InvoiceDetail({ invoice }) {
  const store = useFinance();
  const toast = useToast();
  const compact = useMaxWidth(BP.lg);
  const [payOpen, setPayOpen] = useState(false);

  const status = invoiceStatus(store.ledger, invoice);
  const outstanding = outstandingForeign(store.ledger, invoice);
  const foreign = invoice.currency !== BASE_CURRENCY;
  const payments = store.payments.filter((p) => p.invoiceId === invoice.id);
  const deferral = invoice.deferralId ? store.deferrals.find((d) => d.id === invoice.deferralId) : null;

  const journals = useMemo(() => {
    const seen = new Map();
    for (const l of ledgerLines(store.ledger)) {
      const mine = l.source?.id === invoice.id || l.source?.invoiceId === invoice.id;
      if (mine && !seen.has(l.journalId)) seen.set(l.journalId, journalById(store.ledger, l.journalId));
    }
    return [...seen.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [store.ledger, invoice.id]);

  const realisedFx = payments.reduce((a, p) => a + p.diff, 0);

  return (
    <>
      <ViewHeader
        title={`${invoice.supplier} · ${invoice.ref}`}
        subtitle={`${invoice.description} · ${companyShort(invoice.company)} · ${branchName(invoice.company, invoice.branch)}`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" onClick={() => store.go("payables")}>
              <I as={ArrowLeft20Regular} size={14} /> Back
            </Btn>
            {status !== "paid" && <Btn onClick={() => setPayOpen(true)}>Pay invoice</Btn>}
          </div>
        }
      />
      <Page>
        <Row>
          <Stat label={`Invoiced (${invoice.currency})`}
                value={foreign ? foreignWithCode(invoice.fxAmount, invoice.currency) : money(invoice.baseAmount)}
                sub={foreign ? `at ${fmtRate(invoice.rate)} on the invoice date` : null} basis={210} />
          <Stat label={`${BASE_CURRENCY} value on the books`} value={money(invoice.baseAmount)} basis={200} />
          <Stat label="Still outstanding"
                value={outstanding === 0 ? "Settled" : foreignWithCode(outstanding, invoice.currency)}
                tone={outstanding === 0 ? C.success : C.ink} basis={190} />
          {realisedFx !== 0 && (
            <Stat label={`Realised FX ${realisedFx > 0 ? "loss" : "gain"}`} value={money(Math.abs(realisedFx))}
                  tone={realisedFx > 0 ? C.danger : C.success} basis={190} />
          )}
        </Row>

        <Card title="Invoice" right={<StatusPill status={status} />} pad={14}>
          <div style={{ display: "grid", gap: "2px 28px", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))" }}>
            <KeyValue label="Supplier">{invoice.supplier}</KeyValue>
            <KeyValue label="Invoice number">{invoice.ref}</KeyValue>
            <KeyValue label="Invoice date">{prettyDate(invoice.invoiceDate)}</KeyValue>
            <KeyValue label="Due date">{prettyDate(invoice.dueDate)}</KeyValue>
            <KeyValue label="Currency">{invoice.currency}</KeyValue>
            {foreign && <KeyValue label="Invoice-date rate">{fmtRate(invoice.rate)}</KeyValue>}
            <KeyValue label="Amount">
              {foreign ? foreignWithCode(invoice.fxAmount, invoice.currency) : money(invoice.baseAmount)}
            </KeyValue>
            <KeyValue label={`${BASE_CURRENCY} value`}>{money(invoice.baseAmount)}</KeyValue>
            <KeyValue label="Charged to">{invoice.expenseAccount} · {accountName(invoice.expenseAccount)}</KeyValue>
            {deferral && (
              <KeyValue label="Deferred over">
                <button onClick={() => store.go(`deferrals/${deferral.id}`)} style={linkStyle}>
                  {prettyDate(deferral.coverStart)} – {prettyDate(deferral.coverEnd)} <I as={Open20Regular} size={12} />
                </button>
              </KeyValue>
            )}
          </div>
        </Card>

        {payments.length > 0 && (
          <Card title={`Payments (${payments.length})`} pad={compact ? 8 : 14}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Payment", "Date", "Bank", "Settled", "Rate", `Paid (${BASE_CURRENCY})`, "Realised FX"].map((h, i) => (
                    <th key={h} style={{
                      textAlign: i >= 3 ? "right" : "left", padding: "7px 8px", fontSize: 10, fontWeight: 700,
                      color: C.faint, textTransform: "uppercase", letterSpacing: "0.6px",
                      borderBottom: `1px solid ${C.hairline}`, whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.surfaceMute}` }}>
                    <td style={cell}>{p.ref}</td>
                    <td style={cell}>{prettyDate(p.date)}</td>
                    <td style={cell}>{accountName(p.bankAccount)}</td>
                    <td style={{ ...cell, textAlign: "right" }}>
                      <Foreign value={p.payForeign} currency={invoice.currency} />
                    </td>
                    <td style={{ ...cell, textAlign: "right" }}><Rate value={p.payRate} /></td>
                    <td style={{ ...cell, textAlign: "right" }}><Num value={p.baseOut} weight={600} /></td>
                    <td style={{ ...cell, textAlign: "right" }}>
                      {p.diff === 0 ? <span style={{ color: C.faint }}>—</span> : (
                        <span style={{ color: p.diff > 0 ? C.danger : C.success, fontWeight: 600, fontSize: 12.5 }}>
                          {money(Math.abs(p.diff))} {p.diff > 0 ? "loss" : "gain"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Card title={`Journals (${journals.length})`} pad={14}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {journals.map((j) => (
              <Collapse key={j.id} title={`${j.ref} · ${prettyDate(j.date)} · ${j.memo}`}
                        open={journals.length <= 2}
                        right={<Pill fg={C.success} bg={C.successBg}>Posted</Pill>}>
                <JournalEntry journal={j} dense />
              </Collapse>
            ))}
          </div>
        </Card>
      </Page>

      {payOpen && (
        <PayPanel
          invoice={invoice}
          onClose={() => setPayOpen(false)}
          onPaid={({ calc }) => {
            setPayOpen(false);
            toast(
              "Payment posted",
              calc.kind === "none"
                ? `${money(calc.baseOut)} paid — no exchange difference`
                : `${money(calc.baseOut)} paid · realised FX ${calc.kind} ${money(calc.absDiff)}`,
              { color: calc.kind === "loss" ? C.danger : C.success },
            );
          }}
        />
      )}
    </>
  );
}

const cell = { padding: "7px 8px", fontSize: 12.5, verticalAlign: "middle" };
const linkStyle = {
  background: "none", border: "none", padding: 0, color: C.brand,
  fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: 4,
};

// ─── Pay panel ────────────────────────────────────────────────────────────────

function PayPanel({ invoice, onClose, onPaid }) {
  const store = useFinance();
  const outstanding = outstandingForeign(store.ledger, invoice);
  const [date, setDate] = useState(TODAY);
  const [bankAccount, setBankAccount] = useState("1010");
  const [amountText, setAmountText] = useState(formatForeignInput(outstanding, invoice.currency));
  const [rateText, setRateText] = useState("");
  const [rateTouched, setRateTouched] = useState(false);

  const bank = BANKS.find((b) => b.value === bankAccount);
  const sameCurrency = bank.currency === invoice.currency;
  const tableRate = rateOn(store.rates, invoice.currency, date) ?? invoice.rate;
  const effectiveRate = rateTouched && rateText !== "" ? Number(rateText) || 0 : tableRate;

  // Keep the rate field showing the table rate until the presenter edits it, and
  // re-pick it up when the date changes — the point of scene 3 is that 3,750 came
  // from somewhere.
  const shownRate = rateTouched && rateText !== "" ? rateText : String(tableRate);

  const payForeign = parseForeign(amountText, invoice.currency);
  const overpaying = payForeign > outstanding;
  const valid = payForeign > 0 && !overpaying && effectiveRate > 0 && date;

  const preview = useMemo(() => {
    if (!valid) return null;
    return previewPayment(store, {
      invoiceId: invoice.id, date, bankAccount, payForeign, payRate: effectiveRate,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, invoice.id, date, bankAccount, payForeign, effectiveRate, store.ledger]);

  const post = () => {
    const result = store.payInvoice({
      invoiceId: invoice.id, date, bankAccount, payForeign, payRate: effectiveRate,
    });
    onPaid(result);
  };

  const calc = preview?.calc;
  const remainingAfter = outstanding - payForeign;

  return (
    <FormDrawer
      title={`Pay ${invoice.supplier} · ${invoice.ref}`}
      onClose={onClose}
      width={620}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={post} disabled={!valid}>Post payment</Btn>
        </>
      }
    >
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ border: `1px solid ${C.hairline}`, borderRadius: 8, padding: 14, background: C.surfaceAlt }}>
          <SubHead>The invoice</SubHead>
          <div style={{ marginTop: 8 }}>
            <KeyValue label="Invoiced">
              {invoice.currency === BASE_CURRENCY
                ? money(invoice.baseAmount)
                : `${foreignWithCode(invoice.fxAmount, invoice.currency)} at ${fmtRate(invoice.rate)} on ${prettyDate(invoice.invoiceDate)}`}
            </KeyValue>
            <KeyValue label={`Carried at (${BASE_CURRENCY})`}>{money(invoice.baseAmount)}</KeyValue>
            <KeyValue label="Outstanding">{foreignWithCode(outstanding, invoice.currency)}</KeyValue>
          </div>
        </div>

        <Field label="Pay from" required hint={`This account is held in ${bank.currency}`}>
          <FluentSelect
            value={bankAccount}
            options={BANKS.map((b) => ({ value: b.value, label: `${b.label} (${b.currency})` }))}
            onChange={(e) => setBankAccount(String(e.target.value))}
          />
        </Field>
        <Field label="Payment date" required>
          <TextField type="date" value={date} onChange={(v) => { setDate(v); setRateTouched(false); }} />
        </Field>
        <Field label={`Amount to settle (${invoice.currency})`} required
               hint={`Up to ${foreignWithCode(outstanding, invoice.currency)}. Leave the full amount to settle the invoice.`}>
          <TextField value={amountText} onChange={setAmountText} />
        </Field>
        {overpaying && (
          <div style={{ fontSize: 12, color: C.danger, fontWeight: 600 }}>
            That is more than the {foreignWithCode(outstanding, invoice.currency)} still outstanding.
          </div>
        )}

        {!sameCurrency && (
          <Field
            label={`Rate (${BASE_CURRENCY} per ${invoice.currency})`}
            required
            hint={rateTouched
              ? `Overridden — the table rate for ${prettyDate(date)} is ${fmtRate(tableRate)}`
              : `From the rate table for ${prettyDate(date)}. Editable.`}
          >
            <TextField value={shownRate} onChange={(v) => { setRateTouched(true); setRateText(v); }} />
          </Field>
        )}

        {calc && (
          <div style={{
            border: `1px solid ${calc.kind === "loss" ? C.danger : calc.kind === "gain" ? C.success : C.hairline}`,
            borderRadius: 8, overflow: "hidden",
          }}>
            <div style={{
              padding: "10px 14px",
              background: calc.kind === "loss" ? C.dangerBg : calc.kind === "gain" ? C.successBg : C.surfaceMute,
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>
                {sameCurrency ? "Same currency — no exchange difference" : `Realised FX ${calc.kind === "none" ? "difference" : calc.kind}`}
              </span>
              {calc.kind !== "none" && (
                <span style={{
                  fontSize: 16, fontWeight: 700,
                  color: calc.kind === "loss" ? C.danger : C.success,
                }}>{money(calc.absDiff)}</span>
              )}
            </div>
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 2 }}>
              <KeyValue label="Settling" width={210}>
                {foreignWithCode(calc.payForeign, invoice.currency)}
                {remainingAfter > 0 && (
                  <span style={{ color: C.muted, fontWeight: 400 }}>
                    {" "}· {foreignWithCode(remainingAfter, invoice.currency)} will remain outstanding
                  </span>
                )}
              </KeyValue>
              <KeyValue label={`Payables relieved at ${fmtRate(invoice.rate)}`} width={210}>
                {money(calc.relief)}
              </KeyValue>
              <KeyValue label={`Cash leaving the bank at ${fmtRate(calc.payRate)}`} width={210}>
                {money(calc.baseOut)}
              </KeyValue>
              <KeyValue label="Difference" width={210}>
                {calc.diff === 0 ? "Nil" : (
                  <span style={{ color: calc.diff > 0 ? C.danger : C.success }}>
                    {money(Math.abs(calc.diff))} {calc.diff > 0 ? "loss" : "gain"} · posts to {accountName("6100")}
                  </span>
                )}
              </KeyValue>
            </div>
          </div>
        )}

        {preview && (
          <div style={{ border: `1px solid ${C.hairline}`, borderRadius: 8, padding: 14 }}>
            <SubHead right={<Pill fg={C.warning} bg={C.warningBg}>Not yet posted</Pill>}>
              Journal preview
            </SubHead>
            <div style={{ marginTop: 10 }}>
              <JournalEntry journal={{ ...preview.entry, ref: "preview", lines: preview.entry.lines }} dense />
            </div>
            <Hint>
              Built by the same function that does the posting, so what you see here is what lands
              in the ledger.
            </Hint>
          </div>
        )}
      </div>
    </FormDrawer>
  );
}
