// Multi-currency: the rate table, settlement arithmetic, and the journals a
// payment produces.
//
// The invoice never leaves its own currency. A payment in another currency
// relieves payables at the *invoice* rate, moves cash at the *payment* rate, and
// the difference is a realised exchange gain or loss. That difference is the
// whole of request 5.

import { MINOR, toBase } from "../config.js";
import { account } from "./coa.js";
import { lines } from "./ledger.js";

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

export function paymentEntry(invoice, payment, calc) {
  const fxTag = { currency: invoice.currency, amount: calc.payForeign, rate: invoice.rate };
  const out = [
    {
      account: "2010",
      debit: calc.relief,
      company: invoice.company,
      branch: invoice.branch,
      fx: fxTag,
    },
  ];
  if (calc.diff > 0) {
    out.push({ account: FX_GAIN_LOSS, debit: calc.diff, company: invoice.company, branch: invoice.branch });
  } else if (calc.diff < 0) {
    out.push({ account: FX_GAIN_LOSS, credit: -calc.diff, company: invoice.company, branch: invoice.branch });
  }
  out.push({
    account: calc.bankAccount,
    credit: calc.baseOut,
    company: invoice.company,
    branch: invoice.branch,
    fx: calc.bankCurrency === "UGX" ? null : { currency: calc.bankCurrency, amount: calc.payForeign, rate: calc.payRate },
  });
  return {
    date: payment.date,
    memo: `Payment ${payment.ref} — ${invoice.supplier} ${invoice.ref}`,
    source: { type: SOURCE_PAYMENT, id: payment.id, invoiceId: invoice.id },
    lines: out,
  };
}

// A supplier invoice, foreign or base currency. The expense (or prepaid) side
// and the payables side both carry the foreign tag so the drill-down can show
// what was actually invoiced.
export function invoiceEntry(invoice) {
  const fxTag = invoice.currency === "UGX"
    ? null
    : { currency: invoice.currency, amount: invoice.fxAmount, rate: invoice.rate };
  return {
    date: invoice.invoiceDate,
    memo: `${invoice.supplier} — ${invoice.description}`,
    source: { type: SOURCE_FX_INVOICE, id: invoice.id },
    lines: [
      {
        account: invoice.expenseAccount,
        debit: invoice.baseAmount,
        company: invoice.company,
        branch: invoice.branch,
        fx: fxTag,
      },
      {
        account: "2010",
        credit: invoice.baseAmount,
        company: invoice.company,
        branch: invoice.branch,
        fx: fxTag,
      },
    ],
  };
}

// Helper for building invoice records: base amount always derives from the
// foreign amount and the invoice-date rate.
export function makeInvoice(fields) {
  const currency = fields.currency || "UGX";
  const rate = currency === "UGX" ? 1 : fields.rate;
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
