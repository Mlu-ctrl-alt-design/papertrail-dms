// Multi-currency: the rate table, settlement arithmetic, and the journals a
// payment produces.
//
// The invoice never leaves its own currency. A payment in another currency
// relieves payables at the *invoice* rate, moves cash at the *payment* rate, and
// the difference is a realised exchange gain or loss. That difference is the
// whole of request 5.

import { BASE_CURRENCY, MINOR, toBase } from "../config.js";
import { account } from "./coa.js";
import { lines } from "./ledger.js";
import { mappedEntry } from "./mapping.js";

export const SOURCE_FX_INVOICE = "supplier-invoice";
export const SOURCE_PAYMENT = "invoice-payment";

export const FX_GAIN_LOSS = "6100";

// ─── Rates ────────────────────────────────────────────────────────────────────
// A plain table the presenter can open: date, pair, rate. Quoted as units of
// base currency per one unit of the foreign currency.

export function rateOn(rates, currency, date) {
  let best = null;
  for (const r of rates) {
    if (r.currency !== currency) continue;
    if (r.date > date) continue;
    if (!best || r.date > best.date) best = r;
  }
  return best ? best.rate : null;
}

export const ratesFor = (rates, currency) =>
  rates.filter((r) => r.currency === currency).sort((a, b) => b.date.localeCompare(a.date));

// ─── Settlement ───────────────────────────────────────────────────────────────

// How much of the invoice is still open, in its own currency, read from the
// ledger rather than from a status field on the invoice.
export function settledForeign(ledger, invoice) {
  let total = 0;
  for (const l of lines(ledger)) {
    if (l.source?.type !== SOURCE_PAYMENT) continue;
    if (l.source.invoiceId !== invoice.id) continue;
    if (l.account !== "2010" || !l.debit) continue;
    total += l.fx ? l.fx.amount : 0;
  }
  return total;
}

export const outstandingForeign = (ledger, invoice) => invoice.fxAmount - settledForeign(ledger, invoice);

// The payables balance still carried for this invoice, in base currency.
export function outstandingBase(ledger, invoice) {
  let total = 0;
  for (const l of lines(ledger)) {
    const src = l.source;
    if (!src) continue;
    const mine = src.id === invoice.id || src.invoiceId === invoice.id;
    if (!mine || l.account !== "2010") continue;
    total += l.credit - l.debit;
  }
  return total;
}

export function invoiceStatus(ledger, invoice) {
  const out = outstandingForeign(ledger, invoice);
  if (out <= 0) return "paid";
  if (out < invoice.fxAmount) return "part-paid";
  return "open";
}

// The arithmetic the Pay panel shows live, before anything is posted.
//
// `payForeign` is the amount of the invoice's own currency being settled, in
// minor units. `payRate` converts it to the bank's currency.
export function settlement({ invoice, payForeign, payRate, bankAccount }) {
  const bank = account(bankAccount);
  const sameCurrency = bank.currency === invoice.currency;
  const relief = toBase(payForeign, invoice.currency, invoice.rate);
  const baseOut = sameCurrency ? relief : toBase(payForeign, invoice.currency, payRate);
  const diff = baseOut - relief;
  return {
    payForeign,
    payRate: sameCurrency ? invoice.rate : payRate,
    bankAccount,
    bankCurrency: bank.currency,
    sameCurrency,
    relief,
    baseOut,
    diff,
    kind: diff > 0 ? "loss" : diff < 0 ? "gain" : "none",
    absDiff: Math.abs(diff),
  };
}

// The three-line mapping in AP-PAY does the work: payables relieved at the
// invoice rate, cash out at the payment rate, and a signed exchange difference
// that becomes a debit or a credit depending on which way the rate moved — and
// drops out entirely when there is no difference to post.
export function paymentEntry(invoice, payment, calc) {
  return mappedEntry("AP-PAY", {
    date: payment.date,
    memo: `Payment ${payment.ref} — ${invoice.supplier} ${invoice.ref}`,
    source: { type: SOURCE_PAYMENT, id: payment.id, invoiceId: invoice.id },
    unit: { company: invoice.company, branch: invoice.branch },
    accounts: {
      payablesAccount: "2010",
      fxAccount: FX_GAIN_LOSS,
      bankAccount: calc.bankAccount,
    },
    amounts: {
      payablesRelief: calc.relief,
      fxDifference: calc.diff,
      cashPaid: calc.baseOut,
    },
    fxByRule: {
      "Debit Payable": { currency: invoice.currency, amount: calc.payForeign, rate: invoice.rate },
      ...(calc.bankCurrency === BASE_CURRENCY
        ? {}
        : { "Credit Bank": { currency: calc.bankCurrency, amount: calc.payForeign, rate: calc.payRate } }),
    },
  });
}

// A supplier invoice, foreign or base currency. The expense (or prepaid) side
// and the payables side both carry the foreign tag so the drill-down can show
// what was actually invoiced.
// One document, two mappings, chosen by a condition: a deferred invoice debits
// its prepaid account and an ordinary one debits an expense. Nothing else about
// the two postings differs.
export function invoiceEntry(invoice) {
  const deferred = !!invoice.deferralId;
  const fxTag = invoice.currency === BASE_CURRENCY
    ? null
    : { currency: invoice.currency, amount: invoice.fxAmount, rate: invoice.rate };
  return mappedEntry(deferred ? "AP-INV-DEF" : "AP-INV-STD", {
    date: invoice.invoiceDate,
    memo: `${invoice.supplier} — ${invoice.description}`,
    source: { type: SOURCE_FX_INVOICE, id: invoice.id },
    unit: { company: invoice.company, branch: invoice.branch },
    accounts: {
      [deferred ? "prepaidAccount" : "expenseAccount"]: invoice.expenseAccount,
      payablesAccount: "2010",
    },
    amounts: { invoiceTotal: invoice.baseAmount },
    fx: fxTag,
  });
}

// Helper for building invoice records: base amount always derives from the
// foreign amount and the invoice-date rate.
export function makeInvoice(fields) {
  const currency = fields.currency || BASE_CURRENCY;
  const rate = currency === BASE_CURRENCY ? 1 : fields.rate;
  const fxAmount = fields.fxAmount != null
    ? fields.fxAmount
    : fields.baseAmount * 10 ** (MINOR[currency] ?? 0);
  return {
    ...fields,
    currency,
    rate,
    fxAmount,
    baseAmount: fields.baseAmount != null ? fields.baseAmount : toBase(fxAmount, currency, rate),
  };
}
