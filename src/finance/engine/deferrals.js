// Deferred (prepaid) expenses: schedule generation and the monthly
// amortisation run.
//
// Same discipline as assets.js — the schedule is arithmetic over two dates, and
// the remaining prepaid balance is read back out of the ledger so the deferrals
// list always agrees with the Prepayments line on the balance sheet.

import { addMonths, monthEnd, monthKey, monthsBetween } from "../config.js";
import { lines } from "./ledger.js";
import { mappedEntry } from "./mapping.js";

export const SOURCE_INVOICE = "supplier-invoice";
export const SOURCE_AMORTISATION = "deferral-amortisation";

// A deferral record:
// { id, ref, supplier, description, company, branch, total, invoiceDate,
//   coverStart, coverEnd, prepaidAccount, expenseAccount }

// Straight line by month over the cover period, inclusive of both end months.
// The last period absorbs the rounding.
export function schedule(deferral) {
  const first = monthKey(deferral.coverStart);
  const last = monthKey(deferral.coverEnd);
  const months = Math.max(1, monthsBetween(first, last) + 1);
  const per = Math.floor(deferral.total / months);
  const rows = [];
  let cumulative = 0;
  for (let n = 1; n <= months; n += 1) {
    const amount = n === months ? deferral.total - per * (months - 1) : per;
    cumulative += amount;
    const period = addMonths(first, n - 1);
    rows.push({
      n,
      period,
      date: monthEnd(period),
      amount,
      cumulative,
      remaining: deferral.total - cumulative,
    });
  }
  return rows;
}

export const coverMonths = (coverStart, coverEnd) =>
  Math.max(1, monthsBetween(monthKey(coverStart), monthKey(coverEnd)) + 1);

export const monthlyCharge = (deferral) =>
  Math.floor(deferral.total / coverMonths(deferral.coverStart, deferral.coverEnd));

export function postedPeriods(ledger, deferralId) {
  const set = new Set();
  for (const l of lines(ledger)) {
    if (l.source?.type === SOURCE_AMORTISATION && l.source.id === deferralId) set.add(l.source.period);
  }
  return set;
}

// A deferral's lines come from two places: the invoice that created it and the
// monthly amortisation journals. Both are matched here so the prepaid balance is
// read out of the ledger rather than tracked on the record.
const belongsTo = (line, deferral) =>
  line.source?.id === deferral.id ||
  line.source?.id === deferral.invoiceId ||
  line.source?.invoiceId === deferral.invoiceId;

export function recognised(ledger, deferral, asAt) {
  let total = 0;
  for (const l of lines(ledger)) {
    if (!belongsTo(l, deferral)) continue;
    if (l.account !== deferral.expenseAccount) continue;
    if (asAt && l.date > asAt) continue;
    total += l.debit - l.credit;
  }
  return total;
}

// The prepaid asset still sitting on the balance sheet for this item.
export function remaining(ledger, deferral, asAt) {
  let total = 0;
  for (const l of lines(ledger)) {
    if (!belongsTo(l, deferral)) continue;
    if (l.account !== deferral.prepaidAccount) continue;
    if (asAt && l.date > asAt) continue;
    total += l.debit - l.credit;
  }
  return total;
}

export function deferralLines(ledger, deferral) {
  return lines(ledger).filter((l) => belongsTo(l, deferral));
}

export const isActive = (ledger, deferral) => remaining(ledger, deferral) > 0;

// ─── Journals ─────────────────────────────────────────────────────────────────

// On capture the cost goes to the balance sheet, not the P&L. That is the whole
// point of scene 2: nothing moves in the income statement on day one. The
// invoice itself is posted by fx.js → invoiceEntry with the prepaid account in
// place of the expense account, so a deferred invoice and an ordinary one travel
// the same code path.

export function amortisationEntry(deferral, period, amount) {
  return mappedEntry("PRE-AMO", {
    date: monthEnd(period),
    memo: `Amortisation ${period} — ${deferral.description}`,
    source: { type: SOURCE_AMORTISATION, id: deferral.id, period },
    batch: `AMO-${period}`,
    unit: { company: deferral.company, branch: deferral.branch },
    accounts: {
      expenseAccount: deferral.expenseAccount,
      prepaidAccount: deferral.prepaidAccount,
    },
    amounts: { periodRelease: amount },
  });
}

export function amortisationDue(ledger, deferrals, period) {
  const out = [];
  for (const deferral of deferrals) {
    const posted = postedPeriods(ledger, deferral.id);
    if (posted.has(period)) continue;
    const row = schedule(deferral).find((r) => r.period === period);
    if (!row) continue;
    out.push({ deferral, period, amount: row.amount, n: row.n, of: schedule(deferral).length });
  }
  return out;
}
