// The drill-down drawer and the source-document card.
//
// One drawer holds the whole path: report figure → company → branch → account →
// ledger lines → journal → the document that caused it. The breadcrumb is the
// path, every crumb goes back to that level, and the amount at each level is the
// sum of the level below. No dead ends: every journal resolves to a document or
// says plainly that it is a manual journal.

import { useMemo, useState } from "react";
import { ArrowRight20Regular, Open20Regular } from "@fluentui/react-icons";
import { Btn, C, Drawer, I, Pill, R } from "../../components/index.js";
import {
  BASE_CURRENCY, branchName, companyName, fmtForeign, fmtRate, monthLabel, money, prettyDate, scopeLabel,
} from "../config.js";
import { accountName } from "../engine/coa.js";
import { crumbs, drillRows, nextLevel, nodeAmount } from "../engine/drill.js";
import { journalById } from "../engine/ledger.js";
import { useFinance } from "../state.js";
import { Crumbs, JournalEntry, KeyValue, Num, StatusPill} from "../ui.jsx";
import { linkBtn } from "../styles.js";

const LEVEL_TITLE = {
  company: "By company",
  branch: "By branch",
  account: "By account",
  ledger: "Ledger entries",
};

export function DrillDrawer({ root, onClose }) {
  const store = useFinance();
  const [path, setPath] = useState([root]);
  const [journalId, setJournalId] = useState(null);

  const node = path[path.length - 1];
  const { level, rows } = useMemo(
    () => (journalId ? { level: null, rows: [] } : drillRows(store.ledger, node)),
    [store.ledger, node, journalId],
  );
  const journal = journalId ? journalById(store.ledger, journalId) : null;

  const trail = crumbs(path);
  const items = journal ? [...trail, { key: "journal", label: journal.ref, index: -1 }] : trail;

  const pick = (index) => {
    setJournalId(null);
    if (index >= 0) setPath((p) => p.slice(0, index + 1));
  };

  const total = rows.reduce((a, r) => a + r.amount, 0);
  // The headline is the figure at this level, so it stays put when a journal is
  // open — and if it ever disagreed with the rows below, that would be visible.
  const headline = nodeAmount(store.ledger, node);

  return (
    <Drawer onClose={onClose} width={720}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.hairline}`, flexShrink: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: "0.6px" }}>
          Drill-down
        </div>
        <div style={{ marginTop: 6 }}>
          <Crumbs items={items} onPick={pick} />
        </div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <Num value={headline} size={22} weight={700} />
          <span style={{ fontSize: 11.5, color: C.muted }}>
            {scopeLabel(node.scope)} · {node.from ? `${prettyDate(node.from)} – ` : "up to "}{prettyDate(node.to)}
          </span>
        </div>
      </div>

      <div style={{ overflow: "auto", flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {journal ? (
          <>
            <JournalEntry journal={journal} />
            <SourceDoc journal={journal} onClose={onClose} />
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>
              {LEVEL_TITLE[level] || "Detail"}
              {level !== "ledger" && (
                <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: C.faint, marginLeft: 8 }}>
                  — click a figure to go a level deeper
                </span>
              )}
            </div>
            {level === "ledger"
              ? <LedgerLevel rows={rows} onPick={setJournalId} />
              : <GroupedLevel rows={rows} total={total} onPick={(n) => setPath((p) => [...p, n])} />}
          </>
        )}
      </div>
    </Drawer>
  );
}

function GroupedLevel({ rows, total, onPick }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        {rows.map((r) => {
          const deeper = r.node && nextLevel(r.node);
          return (
            <tr key={r.id} style={{ borderBottom: `1px solid ${C.surfaceMute}` }}>
              <td style={{ padding: "9px 8px", fontSize: 13 }}>
                {deeper && r.amount !== 0 ? (
                  <button onClick={() => onPick(r.node)} style={{ ...linkBtn, fontSize: 13 }}>
                    {r.label}
                  </button>
                ) : (
                  <span style={{ color: r.amount === 0 ? C.faint : C.ink }}>{r.label}</span>
                )}
              </td>
              <td style={{ padding: "9px 8px", textAlign: "right", width: 150 }}>
                <Num value={r.amount} weight={600} size={13} />
              </td>
              <td style={{ padding: "9px 8px", width: 30, textAlign: "right" }}>
                {deeper && r.amount !== 0 && (
                  <button onClick={() => onPick(r.node)} title="Go deeper" style={{
                    background: "none", border: "none", cursor: "pointer", color: C.brand,
                    display: "inline-flex", padding: 0,
                  }}>
                    <I as={ArrowRight20Regular} size={14} />
                  </button>
                )}
              </td>
            </tr>
          );
        })}
        <tr style={{ borderTop: `1px solid ${C.ink}` }}>
          <td style={{ padding: "9px 8px", fontSize: 13, fontWeight: 700 }}>Total</td>
          <td style={{ padding: "9px 8px", textAlign: "right" }}><Num value={total} weight={700} size={13} /></td>
          <td />
        </tr>
      </tbody>
    </table>
  );
}

function LedgerLevel({ rows, onPick }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {["Date", "Reference", "Description", "Unit", BASE_CURRENCY].map((h, i) => (
            <th key={h} style={{
              textAlign: i === 4 ? "right" : "left", padding: "6px 8px", fontSize: 10,
              fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: "0.6px",
              borderBottom: `1px solid ${C.hairline}`, whiteSpace: "nowrap",
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} style={{ borderBottom: `1px solid ${C.surfaceMute}` }}>
            <td style={cellSm}>{prettyDate(r.line.date)}</td>
            <td style={cellSm}>
              <button onClick={() => onPick(r.line.journalId)} style={{ ...linkBtn, fontSize: 12 }}>
                {r.line.ref}
              </button>
            </td>
            <td style={{ ...cellSm, color: C.text }}>
              {r.line.memo}
              {r.line.fx && r.line.fx.currency !== BASE_CURRENCY && (
                <span style={{ color: C.muted, marginLeft: 6 }}>
                  ({r.line.fx.currency} {fmtForeign(r.line.fx.amount, r.line.fx.currency)} @ {fmtRate(r.line.fx.rate)})
                </span>
              )}
            </td>
            <td style={{ ...cellSm, color: C.muted, whiteSpace: "nowrap" }}>
              {branchName(r.line.company, r.line.branch)}
            </td>
            <td style={{ ...cellSm, textAlign: "right" }}><Num value={r.amount} /></td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={5} style={{ padding: 28, textAlign: "center", color: C.faint, fontSize: 12.5 }}>
            Nothing posted to this account for this scope and period.
          </td></tr>
        )}
      </tbody>
    </table>
  );
}

const cellSm = { padding: "7px 8px", fontSize: 12, verticalAlign: "top" };

// ─── Source document ──────────────────────────────────────────────────────────

export function SourceDoc({ journal, onClose }) {
  const store = useFinance();
  const src = journal.source || { type: "manual" };

  const goTo = (path) => { store.go(path); if (onClose) onClose(); };

  const frame = (title, tag, children, action) => (
    <div style={{ border: `1px solid ${C.hairline}`, borderRadius: R.lg, background: C.surfaceAlt, overflow: "hidden" }}>
      <div style={{
        padding: "10px 14px", borderBottom: `1px solid ${C.hairline}`, background: "#fff",
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: "0.6px" }}>
          Source document
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{title}</span>
        {tag}
        {action && <span style={{ marginLeft: "auto" }}>{action}</span>}
      </div>
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 2 }}>{children}</div>
    </div>
  );

  const openBtn = (label, path) => (
    <Btn variant="ghost" size="sm" onClick={() => goTo(path)}>
      <I as={Open20Regular} size={13} /> {label}
    </Btn>
  );

  if (src.type === "asset-acquisition" || src.type === "asset-depreciation") {
    const asset = store.assets.find((a) => a.id === src.id);
    if (!asset) return frame("Asset not found", null, <KeyValue label="Asset">{src.id}</KeyValue>);
    return frame(
      `${asset.tag} · ${asset.name}`,
      <StatusPill status="in-service" />,
      <>
        <KeyValue label="Cost">{money(asset.cost)}</KeyValue>
        <KeyValue label="In service">{prettyDate(asset.inService)}</KeyValue>
        <KeyValue label="Method and life">Straight line over {asset.lifeMonths} months</KeyValue>
        {src.period && <KeyValue label="This journal">Depreciation for {monthLabel(src.period)}</KeyValue>}
        <KeyValue label="Where">{companyName(asset.company)} · {branchName(asset.company, asset.branch)}</KeyValue>
      </>,
      openBtn("Open asset", `assets/${asset.id}`),
    );
  }

  if (src.type === "supplier-invoice") {
    const invoice = store.invoices.find((i) => i.id === src.id);
    if (!invoice) return frame("Invoice not found", null, <KeyValue label="Invoice">{src.id}</KeyValue>);
    const deferral = invoice.deferralId ? store.deferrals.find((d) => d.id === invoice.deferralId) : null;
    return frame(
      `${invoice.supplier} · ${invoice.ref}`,
      deferral ? <StatusPill status="deferred" /> : null,
      <>
        <KeyValue label="Description">{invoice.description}</KeyValue>
        <KeyValue label="Invoice date">{prettyDate(invoice.invoiceDate)}</KeyValue>
        {invoice.currency !== BASE_CURRENCY ? (
          <>
            <KeyValue label="Invoiced">
              {invoice.currency} {fmtForeign(invoice.fxAmount, invoice.currency)} @ {fmtRate(invoice.rate)}
            </KeyValue>
            <KeyValue label="In base currency">{money(invoice.baseAmount)}</KeyValue>
          </>
        ) : (
          <KeyValue label="Amount">{money(invoice.baseAmount)}</KeyValue>
        )}
        {deferral && (
          <KeyValue label="Deferred over">
            {prettyDate(deferral.coverStart)} – {prettyDate(deferral.coverEnd)}
          </KeyValue>
        )}
      </>,
      deferral
        ? openBtn("Open deferral", `deferrals/${deferral.id}`)
        : openBtn("Open invoice", `payables/${invoice.id}`),
    );
  }

  if (src.type === "invoice-payment") {
    const payment = store.payments.find((p) => p.id === src.id);
    const invoice = store.invoices.find((i) => i.id === src.invoiceId);
    if (!invoice) return frame("Payment", null, <KeyValue label="Payment">{src.id}</KeyValue>);
    const foreign = invoice.currency !== BASE_CURRENCY;
    return frame(
      `Payment ${payment ? payment.ref : src.id}`,
      payment && payment.diff
        ? <Pill fg={payment.diff > 0 ? C.danger : C.success} bg={payment.diff > 0 ? C.dangerBg : C.successBg}>
            Realised FX {payment.diff > 0 ? "loss" : "gain"} {money(Math.abs(payment.diff))}
          </Pill>
        : null,
      <>
        <KeyValue label="Settles">{invoice.supplier} · {invoice.ref}</KeyValue>
        {payment && <KeyValue label="Payment date">{prettyDate(payment.date)}</KeyValue>}
        {foreign && payment && (
          <>
            <KeyValue label="Settled">
              {invoice.currency} {fmtForeign(payment.payForeign, invoice.currency)} of {invoice.currency} {fmtForeign(invoice.fxAmount, invoice.currency)}
            </KeyValue>
            <KeyValue label="Invoice rate">{fmtRate(invoice.rate)}</KeyValue>
            <KeyValue label="Payment rate">{fmtRate(payment.payRate)}</KeyValue>
          </>
        )}
        {payment && <KeyValue label="Paid from bank">{money(payment.baseOut)} · {accountName(payment.bankAccount)}</KeyValue>}
      </>,
      openBtn("Open invoice", `payables/${invoice.id}`),
    );
  }

  if (src.type === "deferral-amortisation") {
    const deferral = store.deferrals.find((d) => d.id === src.id);
    if (!deferral) return frame("Deferral not found", null, <KeyValue label="Deferral">{src.id}</KeyValue>);
    return frame(
      `${deferral.supplier} · ${deferral.description}`,
      <StatusPill status="deferred" />,
      <>
        <KeyValue label="Invoice total">{money(deferral.total)}</KeyValue>
        <KeyValue label="Cover period">{prettyDate(deferral.coverStart)} – {prettyDate(deferral.coverEnd)}</KeyValue>
        <KeyValue label="This journal">Amortisation for {monthLabel(src.period)}</KeyValue>
      </>,
      openBtn("Open deferral", `deferrals/${deferral.id}`),
    );
  }

  if (src.type === "intercompany-charge") {
    const line = journal.lines.find((l) => l.counterparty);
    return frame(
      "Intercompany charge",
      <Pill fg="#8764b8" bg="#f3eefb">Eliminated on consolidation</Pill>,
      <>
        <KeyValue label="Charge">{journal.memo}</KeyValue>
        <KeyValue label="Counterparty">{line ? companyName(line.counterparty) : "—"}</KeyValue>
        <KeyValue label="Period">{src.period ? monthLabel(src.period) : prettyDate(journal.date)}</KeyValue>
        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 6, lineHeight: 1.55 }}>
          Both sides of this charge carry the counterparty company, which is what the
          Eliminations column on the consolidated statements is derived from — nothing is
          typed in by hand.
        </div>
      </>,
    );
  }

  if (src.type === "opening-balance") {
    return frame(
      "Opening balances",
      <Pill fg={C.muted} bg={C.surfaceMute}>31 December 2025</Pill>,
      <>
        <KeyValue label="Unit">{src.id}</KeyValue>
        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 6, lineHeight: 1.55 }}>
          The opening balance sheet brought forward from the prior financial year. One journal
          per branch, so the balance sheet balances at branch level too.
        </div>
      </>,
    );
  }

  return frame(
    "Manual journal",
    <Pill fg={C.muted} bg={C.surfaceMute}>No source document</Pill>,
    <>
      <KeyValue label="Narration">{journal.memo}</KeyValue>
      <KeyValue label="Date">{prettyDate(journal.date)}</KeyValue>
      <div style={{ fontSize: 11.5, color: C.muted, marginTop: 6, lineHeight: 1.55 }}>
        Captured directly into the general ledger rather than raised from a document.
      </div>
    </>,
  );
}
