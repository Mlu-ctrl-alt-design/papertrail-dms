// Assembling the opening state: scripted items, then background activity, all
// posted into one ledger in date order.
//
// Deterministic by construction — no clock, no Math.random outside the seeded
// generator — so two builds produce identical ledgers and the Reset control
// genuinely restores the opening state.

import { CLOSED_THROUGH } from "../config.js";
import { emptyLedger, postMany } from "../engine/ledger.js";
import { acquisitionEntry, depreciationEntry, schedule as assetSchedule } from "../engine/assets.js";
import { amortisationEntry, schedule as deferralSchedule } from "../engine/deferrals.js";
import { invoiceEntry, makeInvoice, paymentEntry, settlement } from "../engine/fx.js";
import { generateBackground } from "./generate.js";
import {
  ASSET_A, DEFERRAL_C, INVOICE_E, MANAGEMENT_FEE, OPENINGS, RATES, SEEDED_PERIODS,
} from "./scripted.js";

function openingEntries() {
  return OPENINGS.map((o) => ({
    date: "2025-12-31",
    memo: "Opening balances at 31 December 2025",
    source: { type: "opening-balance", id: `${o.company}/${o.branch}` },
    lines: [
      ...o.debits.map(([account, amount]) => ({
        account, debit: amount, company: o.company, branch: o.branch,
        fx: o.fx?.[account] || null,
      })),
      ...o.credits.map(([account, amount]) => ({
        account, credit: amount, company: o.company, branch: o.branch,
      })),
    ],
  }));
}

function managementFeeEntries() {
  const { amount, charger, charged, months } = MANAGEMENT_FEE;
  const out = [];
  months.forEach((period) => {
    const date = `${period}-28`;
    const ref = `MGT-${period}`;
    out.push({
      date,
      memo: `Management fee ${period} — charged to Hospitality`,
      source: { type: "intercompany-charge", id: `${ref}-out`, period },
      lines: [
        { account: "1900", debit: amount, company: charger.company, branch: charger.branch, counterparty: charged.company },
        { account: "4030", credit: amount, company: charger.company, branch: charger.branch, counterparty: charged.company },
      ],
    });
    out.push({
      date,
      memo: `Management fee ${period} — charged by Holdings`,
      source: { type: "intercompany-charge", id: `${ref}-in`, period },
      lines: [
        { account: "6080", debit: amount, company: charged.company, branch: charged.branch, counterparty: charger.company },
        { account: "2900", credit: amount, company: charged.company, branch: charged.branch, counterparty: charger.company },
      ],
    });
  });
  return out;
}

// Depreciation and amortisation for the closed periods only. October is left
// open — running it is scene 4.
function seededDepreciation(assets) {
  const out = [];
  for (const asset of assets) {
    const rows = assetSchedule(asset);
    for (const period of SEEDED_PERIODS) {
      const row = rows.find((r) => r.period === period);
      if (row) out.push(depreciationEntry(asset, period, row.amount));
    }
  }
  return out;
}

function seededAmortisation(deferrals) {
  const out = [];
  for (const deferral of deferrals) {
    const rows = deferralSchedule(deferral);
    for (const period of SEEDED_PERIODS) {
      const row = rows.find((r) => r.period === period);
      if (row) out.push(amortisationEntry(deferral, period, row.amount));
    }
  }
  return out;
}

export function buildState() {
  const background = generateBackground();

  const assets = [ASSET_A, ...background.assets];
  const deferrals = [DEFERRAL_C];

  // The prepaid insurance invoice is a supplier invoice like any other — it just
  // debits a balance-sheet account instead of an expense.
  const deferralInvoice = makeInvoice({
    id: DEFERRAL_C.invoiceId,
    ref: DEFERRAL_C.ref,
    supplier: DEFERRAL_C.supplier,
    description: DEFERRAL_C.description,
    company: DEFERRAL_C.company,
    branch: DEFERRAL_C.branch,
    currency: "UGX",
    baseAmount: DEFERRAL_C.total,
    invoiceDate: DEFERRAL_C.invoiceDate,
    dueDate: "2026-01-31",
    expenseAccount: DEFERRAL_C.prepaidAccount,
    deferralId: DEFERRAL_C.id,
  });

  const invoices = [deferralInvoice, INVOICE_E, ...background.invoices];

  const deferralCalc = settlement({
    invoice: deferralInvoice,
    payForeign: deferralInvoice.fxAmount,
    payRate: deferralInvoice.rate,
    bankAccount: "1010",
  });
  const deferralPayment = {
    id: "PAY-S0001",
    ref: "PMT-S0001",
    invoiceId: deferralInvoice.id,
    date: DEFERRAL_C.paidOn,
    bankAccount: "1010",
    payForeign: deferralCalc.payForeign,
    payRate: deferralCalc.payRate,
    baseOut: deferralCalc.baseOut,
    relief: deferralCalc.relief,
    diff: deferralCalc.diff,
    company: DEFERRAL_C.company,
    branch: DEFERRAL_C.branch,
  };
  const payments = [deferralPayment, ...background.payments];

  const entries = [
    ...openingEntries(),
    acquisitionEntry(ASSET_A),
    invoiceEntry(deferralInvoice),
    paymentEntry(deferralInvoice, deferralPayment, deferralCalc),
    invoiceEntry(INVOICE_E),
    ...managementFeeEntries(),
    ...background.entries,
    ...seededDepreciation(assets),
    ...seededAmortisation(deferrals),
  ];

  // Array.prototype.sort is stable, so same-day journals keep the order above —
  // which is what makes journal references reproducible.
  entries.sort((a, b) => a.date.localeCompare(b.date));

  const ledger = postMany(emptyLedger(), entries);

  return {
    ledger,
    assets,
    deferrals,
    invoices,
    payments,
    rates: RATES,
    closedThrough: CLOSED_THROUGH,
    activity: [],
  };
}
