// The scripted dataset — PRD section 4.3, written by hand.
//
// These are the figures Vince will add up on screen, so they live here on their
// own, apart from the generated background activity, and nothing in generate.js
// is allowed to touch the accounts they use.

// ─── Exchange rates (UGX per USD) ─────────────────────────────────────────────
// The presenter can open this table to show where 3,750 came from.

export const RATES = [
  { date: "2025-12-31", currency: "USD", rate: 3650, source: "Bank of Uganda mid-rate" },
  { date: "2026-01-31", currency: "USD", rate: 3660, source: "Bank of Uganda mid-rate" },
  { date: "2026-02-28", currency: "USD", rate: 3675, source: "Bank of Uganda mid-rate" },
  { date: "2026-03-31", currency: "USD", rate: 3690, source: "Bank of Uganda mid-rate" },
  { date: "2026-04-30", currency: "USD", rate: 3680, source: "Bank of Uganda mid-rate" },
  { date: "2026-05-31", currency: "USD", rate: 3695, source: "Bank of Uganda mid-rate" },
  { date: "2026-06-30", currency: "USD", rate: 3710, source: "Bank of Uganda mid-rate" },
  { date: "2026-07-31", currency: "USD", rate: 3720, source: "Bank of Uganda mid-rate" },
  { date: "2026-08-31", currency: "USD", rate: 3690, source: "Bank of Uganda mid-rate" },
  { date: "2026-09-15", currency: "USD", rate: 3700, source: "Bank of Uganda mid-rate" },
  { date: "2026-09-30", currency: "USD", rate: 3715, source: "Bank of Uganda mid-rate" },
  { date: "2026-10-20", currency: "USD", rate: 3750, source: "Bank of Uganda mid-rate" },
];

// ─── Opening balance sheet at 31 December 2025 ────────────────────────────────
// One journal per branch, so the balance sheet balances at branch level and not
// only for the group. Payables open at nil: every payable in the demo arises
// from an invoice you can click through to.

export const OPENINGS = [
  {
    company: "holdings", branch: "ho",
    debits: [["1010", 900_000_000]],
    credits: [["3010", 500_000_000], ["3900", 400_000_000]],
  },
  {
    company: "hospitality", branch: "kla-central",
    debits: [["1010", 620_000_000], ["1020", 73_000_000], ["1100", 85_000_000]],
    credits: [["3010", 300_000_000], ["3900", 478_000_000]],
    fx: { "1020": { currency: "USD", amount: 2_000_000, rate: 3650 } },
  },
  {
    company: "hospitality", branch: "entebbe",
    debits: [["1010", 310_000_000], ["1100", 30_000_000]],
    credits: [["3900", 340_000_000]],
  },
  {
    company: "properties", branch: "kla",
    debits: [["1010", 560_000_000], ["1100", 60_000_000]],
    credits: [["2100", 400_000_000], ["3010", 150_000_000], ["3900", 70_000_000]],
  },
  {
    company: "properties", branch: "jinja",
    debits: [["1010", 240_000_000], ["1100", 20_000_000]],
    credits: [["3900", 260_000_000]],
  },
];

// ─── A. Fixed asset already on the books ──────────────────────────────────────

export const ASSET_A = {
  id: "FA-0001",
  tag: "FA-0001",
  name: "Delivery vehicle — Toyota Hiace",
  categoryId: "motor",
  company: "hospitality",
  branch: "kla-central",
  cost: 180_000_000,
  residual: 0,
  lifeMonths: 60,
  method: "straight-line",
  inService: "2026-01-01",
  fundedBy: "bank",
  scripted: true,
};

// ─── B. Fixed asset bought live (scene 1) ─────────────────────────────────────
// Prefilled into the New asset panel so the presenter types as little as
// possible, and replayed verbatim by check.mjs.

export const ASSET_B_INPUT = {
  name: "Commercial kitchen equipment",
  categoryId: "plant",
  company: "hospitality",
  branch: "entebbe",
  cost: 48_000_000,
  inService: "2026-10-01",
  fundedBy: "bank",
};

// ─── C. Prepaid medical insurance ─────────────────────────────────────────────

export const DEFERRAL_C = {
  id: "DEF-0001",
  invoiceId: "INV-S0001",
  ref: "CHA-2026-0041",
  supplier: "Crested Health Assurance",
  description: "Group medical insurance — 2026 cover",
  company: "holdings",
  branch: "ho",
  total: 120_000_000,
  invoiceDate: "2026-01-02",
  coverStart: "2026-01-01",
  coverEnd: "2026-12-31",
  prepaidAccount: "1200",
  expenseAccount: "6050",
  paidOn: "2026-01-02",
  scripted: true,
};

// ─── D. A second deferral, captured live (scene 2) ────────────────────────────

export const DEFERRAL_D_INPUT = {
  supplier: "Lakeside Systems",
  description: "Annual software licence",
  ref: "LS-1182",
  company: "properties",
  branch: "kla",
  total: 24_000_000,
  invoiceDate: "2026-10-01",
  coverStart: "2026-10-01",
  coverEnd: "2027-09-30",
  prepaidAccount: "1210",
  expenseAccount: "6060",
  defer: true,
};

// ─── E. Dollar invoice, paid in local currency (scene 3) ──────────────────────

export const INVOICE_E = {
  id: "INV-S0002",
  ref: "ESP-7741",
  supplier: "East Africa Supply Partners",
  description: "Kitchen supplies — September consignment",
  company: "hospitality",
  branch: "kla-central",
  currency: "USD",
  fxAmount: 1_000_000, // USD 10,000.00 in cents
  rate: 3700,
  baseAmount: 37_000_000,
  invoiceDate: "2026-09-15",
  dueDate: "2026-10-30",
  expenseAccount: "6040",
  scripted: true,
};

// The three variants the pay panel must handle, and the figures each must give.
export const PAYMENT_E_VARIANTS = [
  {
    id: "full", label: "Full payment at 3,750",
    payForeign: 1_000_000, payRate: 3750, bankAccount: "1010", date: "2026-10-20",
    expect: { baseOut: 37_500_000, relief: 37_000_000, diff: 500_000, kind: "loss", outstandingForeign: 0 },
  },
  {
    id: "partial", label: "Partial payment — USD 5,000 at 3,750",
    payForeign: 500_000, payRate: 3750, bankAccount: "1010", date: "2026-10-20",
    expect: { baseOut: 18_750_000, relief: 18_500_000, diff: 250_000, kind: "loss", outstandingForeign: 500_000 },
  },
  {
    id: "gain", label: "Full payment at 3,650 — a gain",
    payForeign: 1_000_000, payRate: 3650, bankAccount: "1010", date: "2026-10-20",
    expect: { baseOut: 36_500_000, relief: 37_000_000, diff: -500_000, kind: "gain", outstandingForeign: 0 },
  },
];

export const PAYMENT_E_DEFAULT = PAYMENT_E_VARIANTS[0];

// ─── F. Intercompany management fee ───────────────────────────────────────────
// Income in Holdings, expense in Hospitality, removed in Eliminations. Posted as
// two journals joined through the intercompany accounts so each one balances
// inside its own company and branch.

export const MANAGEMENT_FEE = {
  amount: 15_000_000,
  charger: { company: "holdings", branch: "ho" },
  charged: { company: "hospitality", branch: "kla-central" },
  months: ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"],
};

// The periods the seed posts depreciation and amortisation for. October is left
// open: it is what the presenter runs in scene 4.
export const SEEDED_PERIODS = MANAGEMENT_FEE.months;

// October trades like any other month — it is simply not finished, and not
// closed. Background activity runs into it up to the anchor date; depreciation
// and amortisation do not, because that is what month-end is for.
export const OPEN_PERIOD = "2026-10";
