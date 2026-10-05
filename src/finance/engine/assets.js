// Fixed assets: schedule generation and the monthly depreciation run.
//
// The schedule is arithmetic over the asset record; whether a row has *posted*
// is a question for the ledger. Nothing about an asset's accumulated
// depreciation or NBV is stored on the asset — it is read back out of the
// journals the asset has produced, which is why the register always agrees with
// the balance sheet.

import { addMonths, monthEnd, monthKey, monthsBetween } from "../config.js";
import { assetCategory } from "./coa.js";
import { lines } from "./ledger.js";

export const SOURCE_ACQUISITION = "asset-acquisition";
export const SOURCE_DEPRECIATION = "asset-depreciation";

// An asset record:
// { id, tag, name, categoryId, company, branch, cost, residual, lifeMonths,
//   method, inService, fundedBy: "bank" | "payables" }

// Straight line, monthly, starting in the month the asset enters service. The
// final period absorbs the rounding so the schedule sums exactly to cost less
// residual — an accountant will add the column up.
export function schedule(asset) {
  const months = asset.lifeMonths;
  const depreciable = asset.cost - (asset.residual || 0);
  const per = Math.floor(depreciable / months);
  const start = monthKey(asset.inService);
  const rows = [];
  let cumulative = 0;
  for (let n = 1; n <= months; n += 1) {
    const amount = n === months ? depreciable - per * (months - 1) : per;
    cumulative += amount;
    const period = addMonths(start, n - 1);
    rows.push({
      n,
      period,
      date: monthEnd(period),
      amount,
      cumulative,
      nbv: asset.cost - cumulative,
    });
  }
  return rows;
}

export const monthlyCharge = (asset) =>
  Math.floor((asset.cost - (asset.residual || 0)) / asset.lifeMonths);

// Every line this asset has ever produced, newest last.
export function assetLines(ledger, assetId) {
  return lines(ledger).filter((l) => l.source?.id === assetId);
}

// The periods for which a depreciation journal already exists.
export function postedPeriods(ledger, assetId) {
  const set = new Set();
  for (const l of lines(ledger)) {
    if (l.source?.type === SOURCE_DEPRECIATION && l.source.id === assetId) set.add(l.source.period);
  }
  return set;
}

// Read back from the ledger rather than recomputed from the schedule: if the
// two ever disagree, the ledger is right and the screen should say so.
export function accumulated(ledger, asset, asAt) {
  const cat = assetCategory(asset.categoryId);
  let total = 0;
  for (const l of lines(ledger)) {
    if (l.source?.id !== asset.id) continue;
    if (l.account !== cat.accumAccount) continue;
    if (asAt && l.date > asAt) continue;
    total += l.credit - l.debit;
  }
  return total;
}

export function costPosted(ledger, asset, asAt) {
  const cat = assetCategory(asset.categoryId);
  let total = 0;
  for (const l of lines(ledger)) {
    if (l.source?.id !== asset.id) continue;
    if (l.account !== cat.costAccount) continue;
    if (asAt && l.date > asAt) continue;
    total += l.debit - l.credit;
  }
  return total;
}

export function nbv(ledger, asset, asAt) {
  return costPosted(ledger, asset, asAt) - accumulated(ledger, asset, asAt);
}

export function monthsRemaining(ledger, asset) {
  return schedule(asset).filter((r) => !postedPeriods(ledger, asset.id).has(r.period)).length;
}

export const inServiceBy = (asset, period) => monthKey(asset.inService) <= period;

export const lifeEndsAfter = (asset) => addMonths(monthKey(asset.inService), asset.lifeMonths - 1);

export const isFullyDepreciated = (ledger, asset) =>
  accumulated(ledger, asset) >= asset.cost - (asset.residual || 0);

// ─── Journals ─────────────────────────────────────────────────────────────────

export function acquisitionEntry(asset) {
  const cat = assetCategory(asset.categoryId);
  const creditAccount = asset.fundedBy === "payables" ? "2010" : "1010";
  return {
    date: asset.inService,
    memo: `Acquisition — ${asset.name} (${asset.tag})`,
    source: { type: SOURCE_ACQUISITION, id: asset.id },
    lines: [
      { account: cat.costAccount, debit: asset.cost, company: asset.company, branch: asset.branch },
      { account: creditAccount, credit: asset.cost, company: asset.company, branch: asset.branch },
    ],
  };
}

export function depreciationEntry(asset, period, amount) {
  const cat = assetCategory(asset.categoryId);
  return {
    date: monthEnd(period),
    memo: `Depreciation ${period} — ${asset.name} (${asset.tag})`,
    source: { type: SOURCE_DEPRECIATION, id: asset.id, period },
    batch: `DEP-${period}`,
    lines: [
      { account: cat.expenseAccount, debit: amount, company: asset.company, branch: asset.branch },
      { account: cat.accumAccount, credit: amount, company: asset.company, branch: asset.branch },
    ],
  };
}

// What a month-end run would post for depreciation: one row per asset with an
// unposted schedule row in that period.
export function depreciationDue(ledger, assets, period) {
  const out = [];
  for (const asset of assets) {
    const posted = postedPeriods(ledger, asset.id);
    if (posted.has(period)) continue;
    const row = schedule(asset).find((r) => r.period === period);
    if (!row) continue;
    out.push({ asset, period, amount: row.amount, n: row.n, of: asset.lifeMonths });
  }
  return out;
}

export const scheduleProgress = (asset, period) => {
  const start = monthKey(asset.inService);
  return Math.min(asset.lifeMonths, Math.max(0, monthsBetween(start, period) + 1));
};
