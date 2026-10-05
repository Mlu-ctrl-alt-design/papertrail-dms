// The three financial statements, consolidation and eliminations.
//
// A statement is a list of *row specs* — label, the accounts behind it, and the
// direction it reads in — that knows nothing about scope or period. Amounts are
// computed by running a spec against the ledger for a given scope and period.
// That separation is what makes consolidation cheap: a column is just the same
// spec run against a different scope, and the Eliminations column is the same
// spec run against the intercompany-tagged lines only.
//
// Subtotals are expressions over other rows rather than independent sums, so a
// subtotal cannot drift from the lines above it, and because every expression is
// linear, Group = Σ companies + Eliminations holds on subtotal rows for free.

import { FY, prevDay } from "../config.js";
import {
  ACCOUNTS, CASH_CODES, INTERCOMPANY_CODES, PL_CODES, PPE_ACCUM_CODES,
  PPE_COST_CODES, PREPAID_CODES, account, codesOfGroup,
} from "./coa.js";
import { balance } from "./ledger.js";

// kind:   section | line | subtotal | total | note
// basis:  movement (from..to) | cumulative (..to) | fytd (FY start..to)
// sign:   +1 reads debits as positive, −1 reads credits as positive
// expr:   [[rowId, weight], …] for subtotal/total rows

const line = (id, label, codes, sign, basis, extra = {}) =>
  ({ id, kind: "line", label, codes, sign, basis, ...extra });

const sum = (id, label, expr, extra = {}) =>
  ({ id, kind: "subtotal", label, expr, ...extra });

// ─── Profit & loss ────────────────────────────────────────────────────────────

const INCOME_CODES = ["4010", "4020", "4030"];
const OPEX_CODES = codesOfGroup("opex");
const FINANCE_CODES = codesOfGroup("finance-cost");

export function plSpec() {
  const rows = [{ id: "s-rev", kind: "section", label: "Revenue" }];
  INCOME_CODES.forEach((c) => rows.push(line(c, account(c).name, [c], -1, "movement")));
  rows.push(sum("t-rev", "Total revenue", INCOME_CODES.map((c) => [c, 1])));

  rows.push({ id: "s-cos", kind: "section", label: "Cost of sales" });
  rows.push(line("5010", account("5010").name, ["5010"], 1, "movement"));
  rows.push(sum("t-cos", "Total cost of sales", [["5010", 1]]));
  rows.push(sum("t-gross", "Gross profit", [["t-rev", 1], ["t-cos", -1]], { emphasis: true }));

  rows.push({ id: "s-opex", kind: "section", label: "Operating expenses" });
  OPEX_CODES.forEach((c) => rows.push(line(c, account(c).name, [c], 1, "movement")));
  rows.push(sum("t-opex", "Total operating expenses", OPEX_CODES.map((c) => [c, 1])));
  rows.push(sum("t-oper", "Operating profit", [["t-gross", 1], ["t-opex", -1]], { emphasis: true }));

  rows.push({ id: "s-fin", kind: "section", label: "Finance costs and other" });
  FINANCE_CODES.forEach((c) => rows.push(line(c, account(c).name, [c], 1, "movement")));
  rows.push(sum("t-fin", "Total finance costs and other", FINANCE_CODES.map((c) => [c, 1])));

  rows.push({ id: "t-net", kind: "total", label: "Net profit for the period", expr: [["t-oper", 1], ["t-fin", -1]] });
  return rows;
}

// ─── Balance sheet ────────────────────────────────────────────────────────────

export function bsSpec() {
  const rows = [];
  rows.push({ id: "s-nca", kind: "section", label: "Non-current assets" });
  PPE_COST_CODES.forEach((c) => rows.push(line(c, account(c).name, [c], 1, "cumulative")));
  PPE_ACCUM_CODES.forEach((c) => rows.push(line(c, account(c).name, [c], 1, "cumulative")));
  rows.push(sum("t-ppe", "Property, plant and equipment at NBV",
    [...PPE_COST_CODES, ...PPE_ACCUM_CODES].map((c) => [c, 1])));

  rows.push({ id: "s-ca", kind: "section", label: "Current assets" });
  ["1010", "1020", "1100"].forEach((c) => rows.push(line(c, account(c).name, [c], 1, "cumulative")));
  rows.push(line("prepaid", "Prepayments", PREPAID_CODES, 1, "cumulative"));
  rows.push(line("1900", account("1900").name, ["1900"], 1, "cumulative"));
  rows.push(sum("t-ca", "Total current assets",
    [["1010", 1], ["1020", 1], ["1100", 1], ["prepaid", 1], ["1900", 1]]));

  rows.push(sum("t-assets", "Total assets", [["t-ppe", 1], ["t-ca", 1]], { emphasis: true }));

  rows.push({ id: "s-cl", kind: "section", label: "Current liabilities" });
  ["2010", "2900"].forEach((c) => rows.push(line(c, account(c).name, [c], -1, "cumulative")));
  rows.push(sum("t-cl", "Total current liabilities", [["2010", 1], ["2900", 1]]));

  rows.push({ id: "s-ncl", kind: "section", label: "Non-current liabilities" });
  rows.push(line("2100", account("2100").name, ["2100"], -1, "cumulative"));
  rows.push(sum("t-ncl", "Total non-current liabilities", [["2100", 1]]));
  rows.push(sum("t-liab", "Total liabilities", [["t-cl", 1], ["t-ncl", 1]], { emphasis: true }));

  rows.push({ id: "s-eq", kind: "section", label: "Equity" });
  rows.push(line("3010", account("3010").name, ["3010"], -1, "cumulative"));
  rows.push(line("3900", "Retained earnings brought forward", ["3900"], -1, "cumulative"));
  rows.push(line("profit", "Profit for the year to date", PL_CODES, -1, "fytd"));
  rows.push(sum("t-eq", "Total equity", [["3010", 1], ["3900", 1], ["profit", 1]], { emphasis: true }));

  rows.push({ id: "t-leq", kind: "total", label: "Total liabilities and equity", expr: [["t-liab", 1], ["t-eq", 1]] });
  return rows;
}

// ─── Cash flow statement (indirect) ───────────────────────────────────────────
//
// Every non-cash account is classified into exactly one line below. Since the
// movements on all accounts sum to zero, the movement on cash is the negative of
// the sum of these lines — so the statement ties to the bank balances by
// construction rather than by a plug. cashFlowCoverage() exists so check.mjs can
// prove no account was forgotten.

const CF_LINES = [
  { id: "cf-profit", label: "Profit for the period", codes: PL_CODES, section: "operating" },
  { id: "cf-dep", label: "Depreciation (non-cash)", codes: PPE_ACCUM_CODES, section: "operating" },
  { id: "cf-ar", label: "Movement in receivables", codes: ["1100"], section: "operating" },
  { id: "cf-prepaid", label: "Movement in prepayments", codes: PREPAID_CODES, section: "operating" },
  { id: "cf-ap", label: "Movement in payables", codes: ["2010"], section: "operating" },
  { id: "cf-ic", label: "Movement in intercompany balances", codes: INTERCOMPANY_CODES, section: "operating" },
  { id: "cf-ppe", label: "Purchase of property, plant and equipment", codes: PPE_COST_CODES, section: "investing" },
  { id: "cf-capital", label: "Share capital introduced", codes: ["3010"], section: "financing" },
  { id: "cf-reserves", label: "Opening reserves introduced", codes: ["3900"], section: "financing" },
  { id: "cf-loan", label: "Bank loan raised / (repaid)", codes: ["2100"], section: "financing" },
];

export function cashFlowCoverage() {
  const seen = new Map();
  for (const l of CF_LINES) for (const c of l.codes) seen.set(c, (seen.get(c) || 0) + 1);
  const nonCash = ACCOUNTS.filter((a) => a.cf !== "cash").map((a) => a.code);
  return {
    missing: nonCash.filter((c) => !seen.has(c)),
    duplicated: [...seen.entries()].filter(([, n]) => n > 1).map(([c]) => c),
    cashCodes: CASH_CODES,
  };
}

export function cfSpec() {
  const rows = [{ id: "s-op", kind: "section", label: "Cash flows from operating activities" }];
  const bySection = (s) => CF_LINES.filter((l) => l.section === s);
  // sign −1 throughout: a debit movement on a non-cash account consumes cash.
  bySection("operating").forEach((l) => rows.push(line(l.id, l.label, l.codes, -1, "movement")));
  rows.push(sum("t-op", "Net cash from operating activities", bySection("operating").map((l) => [l.id, 1])));

  rows.push({ id: "s-inv", kind: "section", label: "Cash flows from investing activities" });
  bySection("investing").forEach((l) => rows.push(line(l.id, l.label, l.codes, -1, "movement")));
  rows.push(sum("t-inv", "Net cash from investing activities", bySection("investing").map((l) => [l.id, 1])));

  rows.push({ id: "s-fin", kind: "section", label: "Cash flows from financing activities" });
  bySection("financing").forEach((l) => rows.push(line(l.id, l.label, l.codes, -1, "movement")));
  rows.push(sum("t-fin", "Net cash from financing activities", bySection("financing").map((l) => [l.id, 1])));

  rows.push(sum("t-move", "Net movement in cash and cash equivalents",
    [["t-op", 1], ["t-inv", 1], ["t-fin", 1]], { emphasis: true }));
  rows.push(line("cf-open", "Cash and cash equivalents at the beginning of the period", CASH_CODES, 1, "opening"));
  rows.push({ id: "t-close", kind: "total", label: "Cash and cash equivalents at the end of the period",
    expr: [["t-move", 1], ["cf-open", 1]] });
  return rows;
}

// ─── Running a spec ───────────────────────────────────────────────────────────

export function periodFor(basis, { from, to }) {
  if (basis === "cumulative") return { from: undefined, to };
  if (basis === "fytd") return { from: FY.start, to };
  if (basis === "opening") return { from: undefined, to: prevDay(from) };
  return { from, to };
}

// `lineAmount` is injected so the Eliminations column can reuse the whole
// machinery with one different rule for what a line is worth.
function runSpec(spec, lineAmount) {
  const byId = new Map();
  const rows = spec.map((r) => {
    if (r.kind === "section") return { ...r, amount: null };
    // `+ 0` normalises negative zero, which would otherwise show up as a
    // spurious difference when a column is compared to a sum of columns.
    let amount;
    if (r.kind === "line") {
      amount = lineAmount(r) + 0;
    } else {
      amount = r.expr.reduce((acc, [ref, w]) => acc + w * (byId.get(ref) ?? 0), 0) + 0;
    }
    byId.set(r.id, amount);
    return { ...r, amount };
  });
  return { rows, byId };
}

export function computeReport(spec, ledger, { scope, from, to, intercompanyOnly = false } = {}) {
  return runSpec(spec, (r) => {
    const p = periodFor(r.basis, { from, to });
    return r.sign * balance(ledger, { codes: r.codes, scope, from: p.from, to: p.to, intercompanyOnly });
  });
}

export const reportRow = (report, id) => report.rows.find((r) => r.id === id);
export const reportAmount = (report, id) => report.byId.get(id) ?? 0;

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export const profitAndLoss = (ledger, opts) => computeReport(plSpec(), ledger, opts);
export const balanceSheet = (ledger, opts) => computeReport(bsSpec(), ledger, opts);
export const cashFlow = (ledger, opts) => computeReport(cfSpec(), ledger, opts);

export const netProfit = (ledger, opts) =>
  -balance(ledger, { codes: PL_CODES, ...opts }) + 0;

export const cashBalance = (ledger, opts) =>
  balance(ledger, { codes: CASH_CODES, ...opts });

// Does the balance sheet balance? Driven by the real numbers, never asserted.
export function balanceCheck(ledger, opts) {
  const bs = balanceSheet(ledger, opts);
  const assets = reportAmount(bs, "t-assets");
  const leq = reportAmount(bs, "t-leq");
  return { assets, leq, diff: assets - leq, balanced: assets - leq === 0, report: bs };
}

// ─── Consolidation ────────────────────────────────────────────────────────────
//
// `columns` are { id, label, scope }. When `eliminate` is set the result carries
// an Eliminations column derived from the intercompany-tagged lines, and a Group
// column that is the sum of the two.

export function consolidate(spec, ledger, { columns, from, to, eliminate = true }) {
  const perColumn = columns.map((col) => ({
    col,
    result: computeReport(spec, ledger, { scope: col.scope, from, to }),
  }));
  const elim = eliminate
    ? runSpec(spec, (r) => {
        const p = periodFor(r.basis, { from, to });
        return -r.sign * balance(ledger, {
          codes: r.codes, scope: null, from: p.from, to: p.to, intercompanyOnly: true,
        }) + 0;
      })
    : null;

  const rows = spec.map((r, i) => {
    if (r.kind === "section") return { ...r, amounts: {}, elim: null, group: null };
    const amounts = {};
    let total = 0;
    for (const { col, result } of perColumn) {
      const v = result.rows[i].amount;
      amounts[col.id] = v;
      total += v;
    }
    const e = elim ? elim.rows[i].amount : 0;
    return { ...r, amounts, elim: elim ? e : null, group: total + e };
  });

  return { columns, rows, eliminate };
}
