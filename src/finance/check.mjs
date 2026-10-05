// Integrity checks for Ezra360 Financials — `npm run check:finance`.
//
// Builds the opening state, then replays the whole demo script (buy asset B,
// capture deferral D, pay the dollar invoice, run October) and asserts after
// *every* step that the books still hold together. Plain node:assert; no test
// framework, no new dependency.
//
// The point of this file is that every number the client will see on screen is
// derived, so it can be proved rather than eyeballed.

import assert from "node:assert/strict";

import {
  ALL_BRANCHES, COMPANIES, FY, fmtBase, monthEnd,
} from "./config.js";
import { BS_CODES, CASH_CODES, PL_CODES, PREPAID_CODES, PPE_ACCUM_CODES, PPE_COST_CODES } from "./engine/coa.js";
import { balance, lines, validate } from "./engine/ledger.js";
import { accumulated, nbv, schedule as assetSchedule } from "./engine/assets.js";
import { recognised, remaining, schedule as deferralSchedule } from "./engine/deferrals.js";
import { outstandingForeign, settlement } from "./engine/fx.js";
import {
  bsSpec, cashFlowCoverage, cfSpec, consolidate, computeReport, periodFor, plSpec,
  reportAmount, netProfit,
} from "./engine/reports.js";
import { drillRows, nextLevel, rootNode } from "./engine/drill.js";
import {
  createAsset, createSupplierInvoice, monthEndPlan, payInvoice, runMonthEnd,
} from "./engine/actions.js";
import { buildState } from "./seed/build.js";
import {
  ASSET_B_INPUT, DEFERRAL_D_INPUT, INVOICE_E, PAYMENT_E_VARIANTS,
} from "./seed/scripted.js";

let checks = 0;
const ok = (name, fn) => {
  fn();
  checks += 1;
  process.stdout.write(`  ✓ ${name}\n`);
};
const section = (name) => process.stdout.write(`\n${name}\n`);

const eq = (actual, expected, what) =>
  assert.equal(actual, expected, `${what}: expected ${fmtBase(expected)}, got ${fmtBase(actual)}`);

// ─── Reusable invariants ──────────────────────────────────────────────────────

const SCOPES = [
  { label: "Group", scope: { company: null, branch: null } },
  ...COMPANIES.map((c) => ({ label: c.name, scope: { company: c.id, branch: null } })),
  ...ALL_BRANCHES.map((b) => ({ label: b.label, scope: { company: b.company, branch: b.branch } })),
];

function everyJournalBalances(state) {
  for (const j of state.ledger.journals) {
    validate(j);
    const d = j.lines.reduce((a, l) => a + l.debit, 0);
    const c = j.lines.reduce((a, l) => a + l.credit, 0);
    assert.equal(d, c, `journal ${j.ref} does not balance`);
  }
}

function trialBalanceIsZero(state) {
  for (const { label, scope } of SCOPES) {
    const total = balance(state.ledger, { scope });
    assert.equal(total, 0, `trial balance for ${label} is ${fmtBase(total)}, not nil`);
  }
}

function balanceSheetBalances(state, asAt) {
  for (const { label, scope } of SCOPES) {
    const bs = computeReport(bsSpec(), state.ledger, { scope, from: FY.start, to: asAt });
    const assets = reportAmount(bs, "t-assets");
    const leq = reportAmount(bs, "t-leq");
    assert.equal(
      assets - leq, 0,
      `${label} at ${asAt}: assets ${fmtBase(assets)} ≠ liabilities + equity ${fmtBase(leq)}`,
    );
  }
}

function cashFlowTies(state, from, to) {
  for (const { label, scope } of SCOPES) {
    const cf = computeReport(cfSpec(), state.ledger, { scope, from, to });
    const movement = reportAmount(cf, "t-move");
    const closing = reportAmount(cf, "t-close");
    const actualMovement = balance(state.ledger, { codes: CASH_CODES, scope, from, to });
    const actualClosing = balance(state.ledger, { codes: CASH_CODES, scope, to });
    eq(movement, actualMovement, `${label}: cash flow net movement vs bank movement`);
    eq(closing, actualClosing, `${label}: cash flow closing vs bank balance`);

    const bs = computeReport(bsSpec(), state.ledger, { scope, from, to });
    const bsCash = reportAmount(bs, "1010") + reportAmount(bs, "1020");
    eq(closing, bsCash, `${label}: cash flow closing vs balance sheet cash`);
  }
}

function consolidationAddsUp(state, from, to) {
  const columns = COMPANIES.map((c) => ({ id: c.id, label: c.short, scope: { company: c.id, branch: null } }));
  for (const spec of [plSpec(), bsSpec(), cfSpec()]) {
    const con = consolidate(spec, state.ledger, { columns, from, to });
    for (const row of con.rows) {
      if (row.kind === "section") continue;
      const sumCols = columns.reduce((a, c) => a + row.amounts[c.id], 0);
      eq(row.group, sumCols + row.elim, `consolidated row "${row.label}": group vs companies + eliminations`);
    }
  }
  // Branch columns sum to the company column.
  for (const c of COMPANIES) {
    if (c.branches.length < 2) continue;
    const bCols = c.branches.map((b) => ({ id: b.id, label: b.name, scope: { company: c.id, branch: b.id } }));
    for (const spec of [plSpec(), bsSpec(), cfSpec()]) {
      const con = consolidate(spec, state.ledger, { columns: bCols, from, to, eliminate: false });
      const whole = computeReport(spec, state.ledger, { scope: { company: c.id, branch: null }, from, to });
      con.rows.forEach((row, i) => {
        if (row.kind === "section") return;
        const sumBranches = bCols.reduce((a, b) => a + row.amounts[b.id], 0);
        eq(sumBranches, whole.rows[i].amount, `${c.short} "${row.label}": branches vs company`);
      });
    }
  }
}

function registersTieToBalanceSheet(state, asAt) {
  for (const { label, scope } of SCOPES) {
    const inScope = (r) =>
      (!scope.company || r.company === scope.company) && (!scope.branch || r.branch === scope.branch);

    const registerNbv = state.assets.filter(inScope)
      .reduce((a, asset) => a + nbv(state.ledger, asset, asAt), 0);
    const bsPpe = balance(state.ledger, { codes: [...PPE_COST_CODES, ...PPE_ACCUM_CODES], scope, to: asAt });
    eq(registerNbv, bsPpe, `${label}: asset register NBV vs balance sheet PPE`);

    const deferralsRemaining = state.deferrals.filter(inScope)
      .reduce((a, d) => a + remaining(state.ledger, d, asAt), 0);
    const bsPrepaid = balance(state.ledger, { codes: PREPAID_CODES, scope, to: asAt });
    eq(deferralsRemaining, bsPrepaid, `${label}: deferrals remaining vs balance sheet prepayments`);
  }
}

// Each drill level sums to the level above it.
function drillLevelsTie(state, from, to) {
  let sampled = 0;
  const specs = [
    { spec: plSpec(), from, to },
    { spec: bsSpec(), from, to },
  ];
  for (const { spec } of specs) {
    for (const r of spec) {
      if (r.kind !== "line") continue;
      const p = periodFor(r.basis, { from, to });
      let node = rootNode({
        label: r.label, codes: r.codes, sign: r.sign,
        scope: { company: null, branch: null }, from: p.from, to: p.to,
      });
      let parentAmount = r.sign * balance(state.ledger, { codes: r.codes, from: p.from, to: p.to });

      // Walk the path all the way down, following the largest child each time.
      while (nextLevel(node)) {
        const { rows } = drillRows(state.ledger, node);
        const total = rows.reduce((a, x) => a + x.amount, 0);
        eq(total, parentAmount, `drill "${r.label}" at ${nextLevel(node)}`);
        sampled += 1;
        const next = rows.filter((x) => x.node).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];
        if (!next) break;
        node = next.node;
        parentAmount = next.amount;
      }
    }
  }
  assert.ok(sampled >= 20, `only ${sampled} drill levels sampled, wanted at least 20`);
}

function allInvariants(state, label, { asAt, from = FY.start }) {
  section(`Invariants — ${label}`);
  ok("every journal balances", () => everyJournalBalances(state));
  ok("trial balance is nil for the group and each company and branch", () => trialBalanceIsZero(state));
  ok("assets = liabilities + equity, every scope", () => balanceSheetBalances(state, asAt));
  ok("cash flow ties to the bank balances, every scope", () => cashFlowTies(state, from, asAt));
  ok("group = companies + eliminations; branches sum to company", () => consolidationAddsUp(state, from, asAt));
  ok("asset register and deferrals tie to the balance sheet", () => registersTieToBalanceSheet(state, asAt));
  ok("each drill level sums to the level above", () => drillLevelsTie(state, from, asAt));
}

// ─── Run ──────────────────────────────────────────────────────────────────────

process.stdout.write("Ezra360 Financials — integrity checks\n");

section("Chart of accounts");
ok("every non-cash account is classified into exactly one cash-flow line", () => {
  const cov = cashFlowCoverage();
  assert.deepEqual(cov.missing, [], `accounts missing from the cash flow: ${cov.missing.join(", ")}`);
  assert.deepEqual(cov.duplicated, [], `accounts double-counted: ${cov.duplicated.join(", ")}`);
  assert.ok(cov.cashCodes.length > 0);
});

section("Seed");
const opening = buildState();
ok(`ledger built — ${opening.ledger.journals.length} journals, ${lines(opening.ledger).length} lines`, () => {
  assert.ok(opening.ledger.journals.length >= 400, `only ${opening.ledger.journals.length} journals`);
  assert.ok(opening.ledger.journals.length <= 800, `${opening.ledger.journals.length} journals is more than planned`);
});
ok("the seed is deterministic — two builds produce identical ledgers", () => {
  const again = buildState();
  assert.equal(JSON.stringify(again.ledger), JSON.stringify(opening.ledger));
});
ok("no income or expense is recognised before the financial year starts", () => {
  eq(balance(opening.ledger, { codes: PL_CODES, to: "2025-12-31" }), 0, "pre-year P&L movement");
});
ok("balance-sheet accounts only — no stray account types", () => {
  const known = new Set([...BS_CODES, ...PL_CODES]);
  for (const l of lines(opening.ledger)) assert.ok(known.has(l.account), `unknown account ${l.account}`);
});

allInvariants(opening, "opening state (30 Sep 2026)", { asAt: "2026-09-30" });

section("PRD 4.3 A — fixed asset already on the books");
const assetA = opening.assets.find((a) => a.id === "FA-0001");
ok("cost 180,000,000 over 60 months at 3,000,000 a month", () => {
  const s = assetSchedule(assetA);
  eq(assetA.cost, 180_000_000, "cost");
  assert.equal(s.length, 60, "schedule rows");
  for (const r of s) eq(r.amount, 3_000_000, `row ${r.n}`);
  eq(s[s.length - 1].cumulative, 180_000_000, "schedule total");
});
ok("at 30 Sep 2026: accumulated 27,000,000 · NBV 153,000,000", () => {
  eq(accumulated(opening.ledger, assetA, "2026-09-30"), 27_000_000, "accumulated depreciation");
  eq(nbv(opening.ledger, assetA, "2026-09-30"), 153_000_000, "NBV");
});

section("PRD 4.3 C — prepaid medical insurance");
const deferralC = opening.deferrals.find((d) => d.id === "DEF-0001");
ok("120,000,000 over twelve months at 10,000,000", () => {
  const s = deferralSchedule(deferralC);
  assert.equal(s.length, 12, "schedule rows");
  for (const r of s) eq(r.amount, 10_000_000, `row ${r.n}`);
});
ok("at 30 Sep 2026: expensed 90,000,000 · prepaid balance 30,000,000", () => {
  eq(recognised(opening.ledger, deferralC, "2026-09-30"), 90_000_000, "recognised");
  eq(remaining(opening.ledger, deferralC, "2026-09-30"), 30_000_000, "prepaid balance");
});

section("PRD 4.3 E — the dollar invoice as issued");
ok("USD 10,000.00 at 3,700 = UGX 37,000,000, fully outstanding", () => {
  const inv = opening.invoices.find((i) => i.id === INVOICE_E.id);
  eq(inv.baseAmount, 37_000_000, "base amount");
  eq(outstandingForeign(opening.ledger, inv), 1_000_000, "outstanding (USD cents)");
});

section("PRD 4.3 F — intercompany management fee");
ok("income in Holdings, expense in Hospitality, nil in the group", () => {
  const columns = COMPANIES.map((c) => ({ id: c.id, label: c.short, scope: { company: c.id, branch: null } }));
  const con = consolidate(plSpec(), opening.ledger, { columns, from: FY.start, to: "2026-09-30" });
  const income = con.rows.find((r) => r.id === "4030");
  const expense = con.rows.find((r) => r.id === "6080");
  eq(income.amounts.holdings, 135_000_000, "management fee income in Holdings");
  eq(expense.amounts.hospitality, 135_000_000, "management fee expense in Hospitality");
  eq(income.elim, -135_000_000, "eliminations on the income row");
  eq(income.group, 0, "group management fee income");
  eq(expense.group, 0, "group management fee expense");
});

section("PRD 4.3 E — the three payment variants, each from a fresh seed");
for (const variant of PAYMENT_E_VARIANTS) {
  ok(variant.label, () => {
    const fresh = buildState();
    const invoice = fresh.invoices.find((i) => i.id === INVOICE_E.id);
    const calc = settlement({
      invoice, payForeign: variant.payForeign, payRate: variant.payRate, bankAccount: variant.bankAccount,
    });
    eq(calc.baseOut, variant.expect.baseOut, "cash paid");
    eq(calc.relief, variant.expect.relief, "payables relieved");
    eq(calc.diff, variant.expect.diff, "FX difference");
    assert.equal(calc.kind, variant.expect.kind, "gain or loss");

    const { state: after } = payInvoice(fresh, {
      invoiceId: invoice.id, date: variant.date, bankAccount: variant.bankAccount,
      payForeign: variant.payForeign, payRate: variant.payRate,
    });
    eq(outstandingForeign(after.ledger, invoice), variant.expect.outstandingForeign, "outstanding after payment");
    eq(
      balance(after.ledger, { codes: ["6100"], scope: { company: "hospitality", branch: "kla-central" }, from: FY.start, to: "2026-10-31" }),
      variant.expect.diff,
      "realised FX posted",
    );
    everyJournalBalances(after);
    balanceSheetBalances(after, "2026-10-31");
    cashFlowTies(after, FY.start, "2026-10-31");
    if (variant.expect.outstandingForeign === 0) {
      eq(
        balance(after.ledger, { codes: ["2010"] }) - balance(fresh.ledger, { codes: ["2010"] }),
        37_000_000,
        "payables relieved in full (credit balance reduced)",
      );
    }
  });
}

// ─── The demo script, replayed step by step ───────────────────────────────────

section("Scene 1 — buy the kitchen equipment live");
let state = buildState();
const beforeAssetB = netProfit(state.ledger, { from: FY.start, to: "2026-10-31" });
const { state: s1, asset: assetB } = createAsset(state, ASSET_B_INPUT);
state = s1;
ok("48,000,000 over 48 months at 1,000,000, 48 schedule rows", () => {
  const s = assetSchedule(assetB);
  assert.equal(s.length, 48, "schedule rows");
  for (const r of s) eq(r.amount, 1_000_000, `row ${r.n}`);
  eq(s[s.length - 1].cumulative, 48_000_000, "schedule total");
  eq(nbv(state.ledger, assetB), 48_000_000, "NBV before any depreciation");
});
ok("capitalised, not expensed — the P&L has not moved", () => {
  eq(netProfit(state.ledger, { from: FY.start, to: "2026-10-31" }), beforeAssetB, "net profit");
});
allInvariants(state, "after scene 1", { asAt: "2026-10-31" });

section("Scene 2 — capture the software licence, deferred");
const beforeDeferralD = netProfit(state.ledger, { from: FY.start, to: "2026-10-31" });
const { state: s2, deferral: deferralD } = createSupplierInvoice(state, DEFERRAL_D_INPUT);
state = s2;
ok("twelve rows of 2,000,000 from October 2026", () => {
  const s = deferralSchedule(deferralD);
  assert.equal(s.length, 12, "schedule rows");
  assert.equal(s[0].period, "2026-10", "first period");
  assert.equal(s[11].period, "2027-09", "last period");
  for (const r of s) eq(r.amount, 2_000_000, `row ${r.n}`);
});
ok("at the moment of capture the P&L does not move", () => {
  eq(netProfit(state.ledger, { from: FY.start, to: "2026-10-31" }), beforeDeferralD, "net profit");
  eq(remaining(state.ledger, deferralD, "2026-10-31"), 24_000_000, "prepaid balance");
});
allInvariants(state, "after scene 2", { asAt: "2026-10-31" });

section("Scene 3 — pay the dollar invoice in shillings");
const invoiceE = state.invoices.find((i) => i.id === INVOICE_E.id);
const full = PAYMENT_E_VARIANTS[0];
const { state: s3, calc } = payInvoice(state, {
  invoiceId: invoiceE.id, date: full.date, bankAccount: full.bankAccount,
  payForeign: full.payForeign, payRate: full.payRate,
});
state = s3;
ok("UGX 37,500,000 paid, realised FX loss UGX 500,000, USD 0.00 outstanding", () => {
  eq(calc.baseOut, 37_500_000, "cash paid");
  eq(calc.diff, 500_000, "FX loss");
  eq(outstandingForeign(state.ledger, invoiceE), 0, "outstanding");
});
allInvariants(state, "after scene 3", { asAt: "2026-10-31" });

section("Scene 4 — run October month-end");
const plan = monthEndPlan(state);
ok(`plan covers every asset and deferral — ${plan.depreciation.length} + ${plan.amortisation.length} journals`, () => {
  assert.equal(plan.period, "2026-10", "open period");
  assert.ok(plan.runnable, "October should be runnable");
  assert.ok(plan.depreciation.some((r) => r.asset.id === assetB.id), "asset B is in the depreciation run");
  assert.ok(plan.amortisation.some((r) => r.deferral.id === deferralD.id), "deferral D is in the amortisation run");
  assert.equal(plan.depreciation.length, state.assets.length, "one depreciation row per asset in service");
  assert.equal(plan.amortisation.length, state.deferrals.length, "one amortisation row per active deferral");
});
const { state: s4 } = runMonthEnd(state);
state = s4;
ok("October is closed and November is the open period", () => {
  assert.equal(state.closedThrough, "2026-10");
  assert.equal(monthEndPlan(state).period, "2026-11");
});
ok("the run is idempotent — October cannot be run twice", () => {
  assert.throws(() => runMonthEnd(state, "2026-10"), /not the open period/);
  assert.equal(monthEndPlan(state, "2026-10").journalCount, 0, "nothing left to post for October");
});
ok("asset A: accumulated 30,000,000 · NBV 150,000,000", () => {
  eq(accumulated(state.ledger, assetA, "2026-10-31"), 30_000_000, "accumulated depreciation");
  eq(nbv(state.ledger, assetA, "2026-10-31"), 150_000_000, "NBV");
});
ok("asset B: accumulated 1,000,000 · NBV 47,000,000", () => {
  eq(accumulated(state.ledger, assetB, "2026-10-31"), 1_000_000, "accumulated depreciation");
  eq(nbv(state.ledger, assetB, "2026-10-31"), 47_000_000, "NBV");
});
ok("insurance: expensed 100,000,000 · prepaid balance 20,000,000", () => {
  eq(recognised(state.ledger, deferralC, "2026-10-31"), 100_000_000, "recognised");
  eq(remaining(state.ledger, deferralC, "2026-10-31"), 20_000_000, "prepaid balance");
});
ok("software licence: 2,000,000 released, 22,000,000 still prepaid", () => {
  eq(recognised(state.ledger, deferralD, "2026-10-31"), 2_000_000, "recognised");
  eq(remaining(state.ledger, deferralD, "2026-10-31"), 22_000_000, "prepaid balance");
});
allInvariants(state, "after scene 4 (31 Oct 2026)", { asAt: "2026-10-31" });

section("Scene 5 — the statements show what the client just watched");
ok("depreciation, medical insurance and the FX loss are on the group P&L", () => {
  const pl = computeReport(plSpec(), state.ledger, { from: FY.start, to: "2026-10-31" });
  eq(reportAmount(pl, "6070"), 10 * 3_000_000 + 1_000_000 + 700_000 * 9 + 400_000 * 9 + 500_000 * 8 + 300_000 * 7,
    "group depreciation charge");
  eq(reportAmount(pl, "6050"), 100_000_000, "medical insurance expense");
  eq(reportAmount(pl, "6100"), 500_000, "realised FX loss");
  eq(reportAmount(pl, "6060"), 2_000_000, "software licences");
});
ok("the 48,000,000 equipment purchase is under investing on the cash flow", () => {
  const cf = computeReport(cfSpec(), state.ledger, { from: "2026-10-01", to: "2026-10-31" });
  eq(reportAmount(cf, "cf-ppe"), -48_000_000, "October investing outflow");
});
ok("the balance sheet shows PPE at NBV and prepayments", () => {
  const bs = computeReport(bsSpec(), state.ledger, { from: FY.start, to: "2026-10-31" });
  const registerNbv = state.assets.reduce((a, asset) => a + nbv(state.ledger, asset, "2026-10-31"), 0);
  eq(reportAmount(bs, "t-ppe"), registerNbv, "PPE at NBV");
  eq(reportAmount(bs, "prepaid"), 20_000_000 + 22_000_000, "prepayments");
});
ok("net profit equals the movement in accumulated earnings", () => {
  const bs = computeReport(bsSpec(), state.ledger, { from: FY.start, to: "2026-10-31" });
  eq(reportAmount(bs, "profit"), netProfit(state.ledger, { from: FY.start, to: "2026-10-31" }), "profit for the year to date");
});
ok("the group is modestly profitable", () => {
  const profit = netProfit(state.ledger, { from: FY.start, to: "2026-10-31" });
  assert.ok(profit > 0, `group made a loss of ${fmtBase(profit)}`);
});

section("Scene 6 — drill from the consolidated P&L to the dollar invoice");
ok("Realised FX Loss reaches the invoice payment in four clicks", () => {
  const p = periodFor("movement", { from: FY.start, to: "2026-10-31" });
  let node = rootNode({ label: "Realised FX Gain/Loss", codes: ["6100"], sign: 1, from: p.from, to: p.to });
  const path = [];
  while (nextLevel(node)) {
    const { level, rows } = drillRows(state.ledger, node);
    path.push(level);
    const pickRow = rows.filter((r) => r.amount !== 0)[0] || rows[0];
    if (level === "ledger") {
      const journal = state.ledger.journals.find((j) => j.id === pickRow.line.journalId);
      assert.ok(journal, "ledger line has a journal");
      assert.equal(journal.source.type, "invoice-payment", "journal is the invoice payment");
      assert.equal(journal.source.invoiceId, INVOICE_E.id, "payment belongs to the dollar invoice");
      break;
    }
    node = pickRow.node;
  }
  assert.deepEqual(path, ["company", "branch", "ledger"], `drill path was ${path.join(" → ")}`);
  // company → branch → ledger line → journal with the source document on it.
  assert.ok(path.length + 1 <= 4, "more than four clicks to the source document");
});
ok("every journal line reaches a source document or is plainly a manual journal", () => {
  const KNOWN = new Set([
    "opening-balance", "asset-acquisition", "asset-depreciation", "supplier-invoice",
    "invoice-payment", "deferral-amortisation", "intercompany-charge", "manual",
  ]);
  for (const j of state.ledger.journals) {
    assert.ok(KNOWN.has(j.source.type), `journal ${j.ref} has unknown source ${j.source.type}`);
  }
});

section("Reset");
ok("a rebuilt state is identical to the opening state", () => {
  const again = buildState();
  assert.equal(JSON.stringify(again.ledger), JSON.stringify(opening.ledger));
  assert.equal(again.closedThrough, "2026-09");
  eq(nbv(again.ledger, assetA, "2026-09-30"), 153_000_000, "asset A NBV after reset");
  eq(remaining(again.ledger, deferralC, "2026-09-30"), 30_000_000, "insurance prepaid after reset");
  eq(outstandingForeign(again.ledger, INVOICE_E), 1_000_000, "dollar invoice outstanding after reset");
});

process.stdout.write(`\n${checks} checks passed · ${state.ledger.journals.length} journals · ${monthEnd(state.closedThrough)} closed\n`);
