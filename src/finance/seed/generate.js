// Background trading activity for January – September 2026.
//
// Seeded: the same numbers on every load, so the demo can be repeated and the
// integrity script can assert on them. The generator deliberately stays off
// every account the scripted dataset uses to prove a figure — motor vehicles,
// prepaid insurance, medical insurance, software licences, management fees and
// realised FX — so it can never contradict PRD section 4.3.

import { monthEnd } from "../config.js";
import { invoiceEntry, makeInvoice, paymentEntry, settlement } from "../engine/fx.js";
import { acquisitionEntry } from "../engine/assets.js";
import { SEEDED_PERIODS } from "./scripted.js";

// mulberry32 — small, fast, and stable across engines, which is what makes the
// "two builds produce identical ledgers" check meaningful.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BRANCH_PROFILES = [
  {
    company: "holdings", branch: "ho", kind: "admin",
    salaries: 32_000_000, rent: 12_000_000, utilities: 4_000_000,
  },
  {
    company: "hospitality", branch: "kla-central", kind: "trade",
    cashSales: 210_000_000, creditSales: 90_000_000, cos: 120_000_000,
    supplies: 35_000_000, salaries: 55_000_000, rent: 25_000_000,
    utilities: 12_000_000, receipts: 85_000_000,
  },
  {
    company: "hospitality", branch: "entebbe", kind: "trade",
    cashSales: 130_000_000, creditSales: 50_000_000, cos: 72_000_000,
    supplies: 20_000_000, salaries: 34_000_000, rent: 15_000_000,
    utilities: 8_000_000, receipts: 48_000_000,
  },
  {
    company: "properties", branch: "kla", kind: "rental",
    cashRent: 95_000_000, creditRent: 45_000_000, utilities: 18_000_000,
    salaries: 30_000_000, receipts: 42_000_000,
    loan: { principal: 8_000_000, interest: 4_000_000 },
  },
  {
    company: "properties", branch: "jinja", kind: "rental",
    cashRent: 48_000_000, creditRent: 22_000_000, utilities: 9_000_000,
    salaries: 16_000_000, receipts: 20_000_000,
  },
];

const SUPPLIERS = {
  cos: ["Nile Fresh Produce", "Mukwano Trading", "Victoria Meats", "Jinja Millers"],
  supplies: ["Kampala Catering Supplies", "Pearl Packaging", "Equator Hardware"],
  utilities: ["Umeme Ltd", "National Water & Sewerage", "MTN Business"],
};

// A few more assets so the register is not a two-row table. Furniture only: the
// motor-vehicle and plant accounts belong to the scripted assets.
const BACKGROUND_ASSETS = [
  {
    id: "FA-0002", tag: "FA-0002", name: "Restaurant furniture — main floor",
    categoryId: "furniture", company: "hospitality", branch: "kla-central",
    cost: 25_200_000, residual: 0, lifeMonths: 36, method: "straight-line",
    inService: "2026-02-01", fundedBy: "bank",
  },
  {
    id: "FA-0003", tag: "FA-0003", name: "Head office workstations",
    categoryId: "furniture", company: "holdings", branch: "ho",
    cost: 14_400_000, residual: 0, lifeMonths: 36, method: "straight-line",
    inService: "2026-02-01", fundedBy: "bank",
  },
  {
    id: "FA-0004", tag: "FA-0004", name: "Letting office fit-out",
    categoryId: "furniture", company: "properties", branch: "kla",
    cost: 18_000_000, residual: 0, lifeMonths: 36, method: "straight-line",
    inService: "2026-03-01", fundedBy: "bank",
  },
  {
    id: "FA-0005", tag: "FA-0005", name: "Terrace furniture",
    categoryId: "furniture", company: "hospitality", branch: "entebbe",
    cost: 10_800_000, residual: 0, lifeMonths: 36, method: "straight-line",
    inService: "2026-04-01", fundedBy: "bank",
  },
];

export function generateBackground(seed = 20261020) {
  const rnd = rng(seed);
  // Jitter around a profile figure, rounded to the nearest thousand shillings:
  // realistic magnitudes, non-round where it does not matter.
  const j = (base) => Math.round((base * (0.92 + rnd() * 0.16)) / 1000) * 1000;
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const day = (period, d) => `${period}-${String(d).padStart(2, "0")}`;

  const entries = [];
  const invoices = [];
  const payments = [];
  let invSeq = 0;
  let paySeq = 0;

  const cash = (date, memo, debit, credit, amount, unit, extra = {}) =>
    entries.push({
      date, memo,
      source: extra.source || { type: "manual", id: null },
      lines: [
        { account: debit, debit: amount, company: unit.company, branch: unit.branch },
        { account: credit, credit: amount, company: unit.company, branch: unit.branch },
      ],
    });

  // A supplier invoice plus, a month later, its payment — so payables at any
  // date is exactly the list of invoices not yet settled.
  const supplierInvoice = (period, unit, { supplier, description, account, amount, dayOfMonth }) => {
    invSeq += 1;
    const invoice = makeInvoice({
      id: `INV-B${String(invSeq).padStart(4, "0")}`,
      ref: `${supplier.split(" ")[0].toUpperCase().slice(0, 4)}-${period.replace("-", "")}-${invSeq}`,
      supplier, description,
      company: unit.company, branch: unit.branch,
      currency: "UGX",
      baseAmount: amount,
      invoiceDate: day(period, dayOfMonth),
      dueDate: day(period, 28),
      expenseAccount: account,
    });
    invoices.push(invoice);
    entries.push(invoiceEntry(invoice));
    return invoice;
  };

  const settle = (invoice, date) => {
    paySeq += 1;
    const calc = settlement({
      invoice, payForeign: invoice.fxAmount, payRate: invoice.rate, bankAccount: "1010",
    });
    const payment = {
      id: `PAY-${String(paySeq).padStart(4, "0")}`,
      ref: `PMT-${String(paySeq).padStart(4, "0")}`,
      invoiceId: invoice.id,
      date,
      bankAccount: "1010",
      payForeign: calc.payForeign,
      payRate: calc.payRate,
      baseOut: calc.baseOut,
      relief: calc.relief,
      diff: calc.diff,
      company: invoice.company,
      branch: invoice.branch,
    };
    payments.push(payment);
    entries.push(paymentEntry(invoice, payment, calc));
  };

  // Acquisitions for the background assets.
  for (const asset of BACKGROUND_ASSETS) entries.push(acquisitionEntry(asset));

  // Invoices awaiting settlement in the following month, per branch.
  const unpaid = new Map(BRANCH_PROFILES.map((p) => [`${p.company}/${p.branch}`, []]));

  for (const period of SEEDED_PERIODS) {
    for (const p of BRANCH_PROFILES) {
      const unit = { company: p.company, branch: p.branch };
      const key = `${p.company}/${p.branch}`;

      // Settle last month's invoices first — the 5th of the month.
      const queue = unpaid.get(key);
      for (const inv of queue) settle(inv, day(period, 5));
      unpaid.set(key, []);

      const raised = [];

      if (p.kind === "trade") {
        cash(day(period, 26), `Till takings ${period}`, "1010", "4010", j(p.cashSales), unit);
        cash(day(period, 27), `Function and event invoicing ${period}`, "1100", "4010", j(p.creditSales), unit);
        raised.push(supplierInvoice(period, unit, {
          supplier: pick(SUPPLIERS.cos), description: "Food and beverage stock",
          account: "5010", amount: j(p.cos), dayOfMonth: 8,
        }));
        raised.push(supplierInvoice(period, unit, {
          supplier: pick(SUPPLIERS.supplies), description: "Kitchen consumables",
          account: "6040", amount: j(p.supplies), dayOfMonth: 12,
        }));
        raised.push(supplierInvoice(period, unit, {
          supplier: pick(SUPPLIERS.utilities), description: `Utilities ${period}`,
          account: "6030", amount: j(p.utilities), dayOfMonth: 20,
        }));
        cash(monthEnd(period), `Payroll ${period}`, "6010", "1010", j(p.salaries), unit);
        cash(day(period, 2), `Premises rent ${period}`, "6020", "1010", j(p.rent), unit);
        cash(day(period, 22), `Customer receipts ${period}`, "1010", "1100", j(p.receipts), unit);
      }

      if (p.kind === "rental") {
        cash(day(period, 3), `Rent collected ${period}`, "1010", "4020", j(p.cashRent), unit);
        cash(day(period, 3), `Rent invoiced ${period}`, "1100", "4020", j(p.creditRent), unit);
        raised.push(supplierInvoice(period, unit, {
          supplier: pick(SUPPLIERS.utilities), description: `Common area utilities ${period}`,
          account: "6030", amount: j(p.utilities), dayOfMonth: 18,
        }));
        cash(monthEnd(period), `Payroll ${period}`, "6010", "1010", j(p.salaries), unit);
        cash(day(period, 24), `Tenant receipts ${period}`, "1010", "1100", j(p.receipts), unit);
        if (p.loan) {
          const principal = p.loan.principal;
          const interest = j(p.loan.interest);
          entries.push({
            date: monthEnd(period),
            memo: `Term loan instalment ${period}`,
            source: { type: "manual", id: null },
            lines: [
              { account: "2100", debit: principal, company: p.company, branch: p.branch },
              { account: "6090", debit: interest, company: p.company, branch: p.branch },
              { account: "1010", credit: principal + interest, company: p.company, branch: p.branch },
            ],
          });
        }
      }

      if (p.kind === "admin") {
        cash(monthEnd(period), `Payroll ${period}`, "6010", "1010", j(p.salaries), unit);
        cash(day(period, 2), `Head office rent ${period}`, "6020", "1010", j(p.rent), unit);
        raised.push(supplierInvoice(period, unit, {
          supplier: pick(SUPPLIERS.utilities), description: `Head office utilities ${period}`,
          account: "6030", amount: j(p.utilities), dayOfMonth: 16,
        }));
      }

      unpaid.set(key, raised);
    }
  }

  return { entries, assets: BACKGROUND_ASSETS, invoices, payments };
}
