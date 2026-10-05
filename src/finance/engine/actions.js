// The live steps, as pure state transitions.
//
// Everything the presenter does — buy an asset, capture a deferred invoice, pay
// a dollar invoice, run month-end — happens here, so check.mjs replays exactly
// what the UI does rather than an approximation of it.

import { addMonths, monthEnd, monthKey, OPEN_PERIOD } from "../config.js";
import { assetCategory } from "./coa.js";
import { acquisitionEntry, depreciationDue, depreciationEntry } from "./assets.js";
import { amortisationDue, amortisationEntry, coverMonths } from "./deferrals.js";
import { invoiceEntry, makeInvoice, paymentEntry, rateOn, settlement } from "./fx.js";
import { post, postMany } from "./ledger.js";

export const openPeriod = (state) => addMonths(state.closedThrough, 1);
export const isOpen = (state, period) => period === openPeriod(state);

const nextSeq = (items, prefix, width = 4) => {
  let max = 0;
  for (const it of items) {
    const m = String(it.id).match(new RegExp(`^${prefix}(\\d+)$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${String(max + 1).padStart(width, "0")}`;
};

export const nextAssetId = (state) => nextSeq(state.assets, "FA-");
export const nextDeferralId = (state) => nextSeq(state.deferrals, "DEF-");
export const nextInvoiceId = (state) => `INV-L${String(state.invoices.length + 1).padStart(4, "0")}`;
export const nextPaymentId = (state) => `PAY-L${String(state.payments.length + 1).padStart(4, "0")}`;

const logged = (state, entry) => ({ ...state, activity: [...state.activity, entry] });

// ─── Scene 1: buy a fixed asset ───────────────────────────────────────────────
// Category defaults supply the method, the life and the three accounts, so the
// presenter enters cost, date and category and nothing else.

export function createAsset(state, input) {
  const cat = assetCategory(input.categoryId);
  const asset = {
    id: nextAssetId(state),
    tag: nextAssetId(state),
    name: input.name,
    categoryId: input.categoryId,
    company: input.company,
    branch: input.branch,
    cost: Math.round(input.cost),
    residual: input.residual ?? cat.residual,
    lifeMonths: input.lifeMonths ?? cat.lifeMonths,
    method: cat.method,
    inService: input.inService,
    fundedBy: input.fundedBy || "bank",
    createdLive: true,
  };
  const entry = acquisitionEntry(asset);
  const ledger = post(state.ledger, entry);
  const journal = ledger.journals[ledger.journals.length - 1];
  const next = logged(
    { ...state, ledger, assets: [...state.assets, asset] },
    { kind: "asset", label: `${asset.name} capitalised`, id: asset.id, date: asset.inService, journalId: journal.id },
  );
  return { state: next, asset, journal };
}

// ─── Scene 2: capture a supplier invoice, optionally deferred ─────────────────

export function createSupplierInvoice(state, input) {
  const invoiceId = nextInvoiceId(state);
  const deferring = !!input.defer;
  const deferralId = deferring ? nextDeferralId(state) : null;

  const invoice = makeInvoice({
    id: invoiceId,
    ref: input.ref,
    supplier: input.supplier,
    description: input.description,
    company: input.company,
    branch: input.branch,
    currency: input.currency || "UGX",
    rate: input.rate,
    fxAmount: input.fxAmount,
    baseAmount: input.total,
    invoiceDate: input.invoiceDate,
    dueDate: input.dueDate || input.invoiceDate,
    expenseAccount: deferring ? input.prepaidAccount : input.expenseAccount,
    deferralId,
    createdLive: true,
  });

  const deferral = deferring
    ? {
        id: deferralId,
        invoiceId,
        ref: input.ref,
        supplier: input.supplier,
        description: input.description,
        company: input.company,
        branch: input.branch,
        total: invoice.baseAmount,
        invoiceDate: input.invoiceDate,
        coverStart: input.coverStart,
        coverEnd: input.coverEnd,
        prepaidAccount: input.prepaidAccount,
        expenseAccount: input.expenseAccount,
        createdLive: true,
      }
    : null;

  const ledger = post(state.ledger, invoiceEntry(invoice));
  const journal = ledger.journals[ledger.journals.length - 1];
  const next = logged(
    {
      ...state,
      ledger,
      invoices: [...state.invoices, invoice],
      deferrals: deferral ? [...state.deferrals, deferral] : state.deferrals,
    },
    {
      kind: deferring ? "deferral" : "invoice",
      label: deferring
        ? `${input.description} deferred over ${coverMonths(input.coverStart, input.coverEnd)} months`
        : `${input.supplier} invoice captured`,
      id: deferral ? deferral.id : invoice.id,
      date: input.invoiceDate,
      journalId: journal.id,
    },
  );
  return { state: next, invoice, deferral, journal };
}

// ─── Scene 3: pay an invoice ──────────────────────────────────────────────────

// What the panel shows before posting. Separated from the posting so the preview
// and the journal can never disagree.
export function previewPayment(state, { invoiceId, date, bankAccount, payForeign, payRate }) {
  const invoice = state.invoices.find((i) => i.id === invoiceId);
  const rate = payRate ?? rateOn(state.rates, invoice.currency, date) ?? invoice.rate;
  const calc = settlement({ invoice, payForeign, payRate: rate, bankAccount });
  const payment = {
    id: nextPaymentId(state),
    ref: `PMT-${nextPaymentId(state).slice(6)}`,
    invoiceId,
    date,
    bankAccount,
    payForeign: calc.payForeign,
    payRate: calc.payRate,
    baseOut: calc.baseOut,
    relief: calc.relief,
    diff: calc.diff,
    company: invoice.company,
    branch: invoice.branch,
    createdLive: true,
  };
  return { invoice, calc, payment, entry: paymentEntry(invoice, payment, calc) };
}

export function payInvoice(state, input) {
  const { invoice, calc, payment, entry } = previewPayment(state, input);
  const ledger = post(state.ledger, entry);
  const journal = ledger.journals[ledger.journals.length - 1];
  const next = logged(
    { ...state, ledger, payments: [...state.payments, payment] },
    {
      kind: "payment",
      label: `${invoice.ref} settled — ${calc.kind === "none" ? "no FX difference" : `realised FX ${calc.kind}`}`,
      id: payment.id,
      date: payment.date,
      journalId: journal.id,
    },
  );
  return { state: next, payment, calc, journal, invoice };
}

// ─── Scene 4: month-end ───────────────────────────────────────────────────────

// The review step: everything the run would post, before it posts anything.
export function monthEndPlan(state, period = openPeriod(state)) {
  const depreciation = depreciationDue(state.ledger, state.assets, period);
  const amortisation = amortisationDue(state.ledger, state.deferrals, period);
  return {
    period,
    depreciation,
    amortisation,
    depreciationTotal: depreciation.reduce((a, r) => a + r.amount, 0),
    amortisationTotal: amortisation.reduce((a, r) => a + r.amount, 0),
    journalCount: depreciation.length + amortisation.length,
    runnable: isOpen(state, period),
  };
}

export function runMonthEnd(state, period = openPeriod(state)) {
  if (!isOpen(state, period)) {
    throw new Error(`${period} is not the open period — the open period is ${openPeriod(state)}`);
  }
  const plan = monthEndPlan(state, period);
  const entries = [
    ...plan.depreciation.map((r) => depreciationEntry(r.asset, period, r.amount)),
    ...plan.amortisation.map((r) => amortisationEntry(r.deferral, period, r.amount)),
  ];
  const ledger = postMany(state.ledger, entries);
  const next = logged(
    { ...state, ledger, closedThrough: period },
    {
      kind: "close",
      label: `${period} closed — ${plan.depreciation.length} depreciation and ${plan.amortisation.length} amortisation journals posted`,
      id: period,
      date: monthEnd(period),
      journalId: null,
    },
  );
  return { state: next, plan, journals: ledger.journals.slice(state.ledger.journals.length) };
}

// ─── Demo helpers ─────────────────────────────────────────────────────────────

export const currentPeriodLabel = (state) => openPeriod(state);

export const isPeriodClosed = (state, period) => period <= state.closedThrough;

export const periodOf = (iso) => monthKey(iso);

export const DEFAULT_OPEN_PERIOD = OPEN_PERIOD;
