// Ledger entry mapping — the configuration that decides what a transaction
// debits and credits.
//
// This mirrors the Ledger Entry Mapping record in the Ezra360 ERP: a module, an
// entity (transaction type), what it posts to, the condition that selects it,
// and a GL Mapping Rule grid of lines, each with an entry type, an account (a
// literal account or an account *field* resolved off the document) and the data
// field the amount is read from.
//
// The point of this file is that it is not documentation. Every posting in the
// module is built by applyMapping() from the rules below — change a rule here
// and the journals change. That is why the Ledger Mapping screen can claim to
// be configuration rather than a picture of configuration.

import { account } from "./coa.js";

// entryType: "Debit" | "Credit"
// account / accountField: a literal account code, or the name of a field in the
//   posting context's `accounts` map
// dataField: the name of a field in the posting context's `amounts` map
// signed: the amount may be negative; a negative flips the entry type and the
//   absolute value is posted (used by the realised exchange difference)
// omitWhenNil: drop the line entirely when the amount is nil
const rule = (name, entryType, account, dataField, extra = {}) =>
  ({ name, location: "Main Transaction", entryType, ...account, dataField, ...extra });

const toAccount = (code) => ({ account: code });
const toField = (field) => ({ accountField: field });

export const LEDGER_MAPPINGS = [
  // ── Accounts payable ──────────────────────────────────────────────────────
  {
    id: "AP-INV-STD",
    name: "Accounts Payable | Invoice | Transaction Ledger",
    module: "Accounts Payable",
    entity: "Invoice",
    transactionType: "Purchase",
    postTo: "Transaction Ledger",
    condition: "IsDeferred = false",
    ezraQl: [{ Column: "IsDeferred", Operator: "Eq", Value: "false" }],
    note: "An ordinary supplier invoice: the cost goes straight to the income statement.",
    rules: [
      rule("Debit Expense", "Debit", toField("expenseAccount"), "invoiceTotal", { relatedEntity: "Expense Account" }),
      rule("Credit Invoice", "Credit", toField("payablesAccount"), "invoiceTotal"),
    ],
  },
  {
    id: "AP-INV-DEF",
    name: "Accounts Payable | Deferred Invoice | Transaction Ledger",
    module: "Accounts Payable",
    entity: "Invoice",
    transactionType: "Purchase",
    postTo: "Transaction Ledger",
    condition: "IsDeferred = true",
    ezraQl: [{ Column: "IsDeferred", Operator: "Eq", Value: "true" }],
    note: "The same document with the deferral flag set. The cost is held on the balance sheet and released by the amortisation run — one condition is the whole difference.",
    rules: [
      rule("Debit Prepayment", "Debit", toField("prepaidAccount"), "invoiceTotal", { relatedEntity: "Prepaid Account" }),
      rule("Credit Invoice", "Credit", toField("payablesAccount"), "invoiceTotal"),
    ],
  },
  {
    id: "AP-PAY",
    name: "Accounts Payable | Payment | Transaction Ledger",
    module: "Accounts Payable",
    entity: "Payment",
    transactionType: "Settlement",
    postTo: "Transaction Ledger",
    condition: "StatusId = Posted",
    ezraQl: [{ Column: "StatusId", Operator: "Eq", Value: "Posted" }],
    note: "Payables come off at the invoice-date rate, cash leaves at the payment-date rate, and the difference is a realised exchange gain or loss. The third line drops out when the two rates are the same.",
    rules: [
      rule("Debit Payable", "Debit", toField("payablesAccount"), "payablesRelief"),
      rule("Realised Exchange Difference", "Debit", toField("fxAccount"), "fxDifference",
        { signed: true, omitWhenNil: true }),
      rule("Credit Bank", "Credit", toField("bankAccount"), "cashPaid", { relatedEntity: "Bank Account" }),
    ],
  },

  // ── Fixed assets ──────────────────────────────────────────────────────────
  {
    id: "FA-ACQ",
    name: "Fixed Assets | Acquisition | Transaction Ledger",
    module: "Fixed Assets",
    entity: "Asset",
    transactionType: "Capitalisation",
    postTo: "Transaction Ledger",
    condition: "StatusId = In Service",
    ezraQl: [{ Column: "StatusId", Operator: "Eq", Value: "InService" }],
    note: "Capitalising an asset never touches the income statement. The cost account comes from the asset category.",
    rules: [
      rule("Debit Asset Cost", "Debit", toField("costAccount"), "assetCost", { relatedEntity: "Asset Category" }),
      rule("Credit Funding", "Credit", toField("fundingAccount"), "assetCost"),
    ],
  },
  {
    id: "FA-DEP",
    name: "Fixed Assets | Depreciation Run | Transaction Ledger",
    module: "Fixed Assets",
    entity: "Depreciation Run",
    transactionType: "Period Close",
    postTo: "Transaction Ledger",
    condition: "PeriodId = Open Period",
    ezraQl: [{ Column: "PeriodId", Operator: "Eq", Value: "OpenPeriod" }],
    note: "One journal per asset, so each one balances inside its own company and branch. Both accounts come from the asset category.",
    rules: [
      rule("Debit Depreciation", "Debit", toField("depreciationAccount"), "periodCharge", { relatedEntity: "Asset Category" }),
      rule("Credit Accumulated Depreciation", "Credit", toField("accumulatedAccount"), "periodCharge", { relatedEntity: "Asset Category" }),
    ],
  },

  // ── Prepayments ───────────────────────────────────────────────────────────
  {
    id: "PRE-AMO",
    name: "Prepayments | Amortisation Run | Transaction Ledger",
    module: "Prepayments",
    entity: "Amortisation Run",
    transactionType: "Period Close",
    postTo: "Transaction Ledger",
    condition: "PeriodId = Open Period",
    ezraQl: [{ Column: "PeriodId", Operator: "Eq", Value: "OpenPeriod" }],
    note: "Releases one slice of a prepayment into the income statement. Both accounts are carried on the deferral.",
    rules: [
      rule("Debit Expense", "Debit", toField("expenseAccount"), "periodRelease"),
      rule("Credit Prepayment", "Credit", toField("prepaidAccount"), "periodRelease"),
    ],
  },

  // ── Intercompany ──────────────────────────────────────────────────────────
  {
    id: "IC-FEE-OUT",
    name: "Intercompany | Management Fee Raised | Transaction Ledger",
    module: "Intercompany",
    entity: "Management Fee",
    transactionType: "Charge Out",
    postTo: "Transaction Ledger",
    condition: "CounterpartyId <> CompanyId",
    ezraQl: [{ Column: "CounterpartyId", Operator: "Ne", Value: "CompanyId" }],
    note: "The charging side. Both lines carry the counterparty company, which is what the Eliminations column on the consolidated statements is derived from.",
    rules: [
      rule("Debit Intercompany Receivable", "Debit", toAccount("1900"), "feeAmount", { relatedEntity: "Counterparty" }),
      rule("Credit Management Fee Income", "Credit", toAccount("4030"), "feeAmount"),
    ],
  },
  {
    id: "IC-FEE-IN",
    name: "Intercompany | Management Fee Received | Transaction Ledger",
    module: "Intercompany",
    entity: "Management Fee",
    transactionType: "Charge In",
    postTo: "Transaction Ledger",
    condition: "CounterpartyId <> CompanyId",
    ezraQl: [{ Column: "CounterpartyId", Operator: "Ne", Value: "CompanyId" }],
    note: "The charged side, posted as its own journal so the balance sheet balances inside each company.",
    rules: [
      rule("Debit Management Fees", "Debit", toAccount("6080"), "feeAmount"),
      rule("Credit Intercompany Payable", "Credit", toAccount("2900"), "feeAmount", { relatedEntity: "Counterparty" }),
    ],
  },

  // ── Revenue and receivables ───────────────────────────────────────────────
  {
    id: "SAL-CASH",
    name: "Sales | Cash Sale | Transaction Ledger",
    module: "Sales",
    entity: "Sale",
    transactionType: "Sale",
    saleType: "Cash",
    postTo: "Transaction Ledger",
    condition: "SaleType = Cash",
    ezraQl: [{ Column: "SaleType", Operator: "Eq", Value: "Cash" }],
    rules: [
      rule("Debit Bank", "Debit", toField("bankAccount"), "saleTotal", { relatedEntity: "Bank Account" }),
      rule("Credit Revenue", "Credit", toField("revenueAccount"), "saleTotal"),
    ],
  },
  {
    id: "SAL-CRED",
    name: "Sales | Credit Sale | Transaction Ledger",
    module: "Sales",
    entity: "Sale",
    transactionType: "Sale",
    saleType: "Credit",
    postTo: "Transaction Ledger",
    condition: "SaleType = Credit",
    ezraQl: [{ Column: "SaleType", Operator: "Eq", Value: "Credit" }],
    rules: [
      rule("Debit Receivable", "Debit", toAccount("1100"), "saleTotal"),
      rule("Credit Revenue", "Credit", toField("revenueAccount"), "saleTotal"),
    ],
  },
  {
    id: "AR-RCT",
    name: "Accounts Receivable | Receipt | Transaction Ledger",
    module: "Accounts Receivable",
    entity: "Receipt",
    transactionType: "Settlement",
    postTo: "Transaction Ledger",
    condition: "StatusId = Posted",
    ezraQl: [{ Column: "StatusId", Operator: "Eq", Value: "Posted" }],
    rules: [
      rule("Debit Bank", "Debit", toField("bankAccount"), "receiptTotal", { relatedEntity: "Bank Account" }),
      rule("Credit Receivable", "Credit", toAccount("1100"), "receiptTotal"),
    ],
  },

  // ── Payroll and operating costs ───────────────────────────────────────────
  {
    id: "PAY-RUN",
    name: "Payroll | Payroll Run | Transaction Ledger",
    module: "Payroll",
    entity: "Payroll Run",
    transactionType: "Period Close",
    postTo: "Transaction Ledger",
    condition: "StatusId = Approved",
    ezraQl: [{ Column: "StatusId", Operator: "Eq", Value: "Approved" }],
    rules: [
      rule("Debit Salaries", "Debit", toAccount("6010"), "payrollCost"),
      rule("Credit Bank", "Credit", toField("bankAccount"), "payrollCost", { relatedEntity: "Bank Account" }),
    ],
  },
  {
    id: "EXP-CASH",
    name: "Expenses | Cash Expense | Transaction Ledger",
    module: "Expenses",
    entity: "Expense",
    transactionType: "Payment",
    postTo: "Transaction Ledger",
    condition: "StatusId = Paid",
    ezraQl: [{ Column: "StatusId", Operator: "Eq", Value: "Paid" }],
    rules: [
      rule("Debit Expense", "Debit", toField("expenseAccount"), "expenseTotal", { relatedEntity: "Expense Account" }),
      rule("Credit Bank", "Credit", toField("bankAccount"), "expenseTotal", { relatedEntity: "Bank Account" }),
    ],
  },

  // ── Treasury ──────────────────────────────────────────────────────────────
  {
    id: "TRE-LOAN",
    name: "Treasury | Loan Instalment | Transaction Ledger",
    module: "Treasury",
    entity: "Loan Instalment",
    transactionType: "Repayment",
    postTo: "Transaction Ledger",
    condition: "StatusId = Posted",
    ezraQl: [{ Column: "StatusId", Operator: "Eq", Value: "Posted" }],
    note: "A three-line mapping: the instalment splits between principal and interest, and the bank is credited with the total.",
    rules: [
      rule("Debit Loan Principal", "Debit", toAccount("2100"), "principal"),
      rule("Debit Interest", "Debit", toAccount("6090"), "interest"),
      rule("Credit Bank", "Credit", toField("bankAccount"), "instalmentTotal", { relatedEntity: "Bank Account" }),
    ],
  },

  // ── General ledger ────────────────────────────────────────────────────────
  {
    id: "GL-OPEN",
    name: "General Ledger | Opening Balance | Transaction Ledger",
    module: "General Ledger",
    entity: "Opening Balance",
    transactionType: "Brought Forward",
    postTo: "Transaction Ledger",
    condition: "PeriodId = Prior Year End",
    ezraQl: [{ Column: "PeriodId", Operator: "Eq", Value: "PriorYearEnd" }],
    note: "Balances brought forward from the prior financial year. One journal per branch, so the balance sheet balances at branch level and not only for the group. The lines come from the opening trial balance rather than from a fixed rule.",
    openEnded: true,
    rules: [],
  },
];

const BY_ID = new Map(LEDGER_MAPPINGS.map((m) => [m.id, m]));

export const mapping = (id) => BY_ID.get(id);
export const mappingName = (id) => BY_ID.get(id)?.name || "—";

export const MODULES = [...new Set(LEDGER_MAPPINGS.map((m) => m.module))];

export const mappingsForModule = (module) => LEDGER_MAPPINGS.filter((m) => m.module === module);

// Every account a mapping can reach, for the Chart of Accounts "used by" column.
// Account *fields* are resolved at posting time, so they are reported by the
// field name rather than guessed at.
export function mappingAccounts(m) {
  return m.rules.map((r) => (r.account ? { kind: "account", value: r.account } : { kind: "field", value: r.accountField }));
}

// ─── Applying a mapping ───────────────────────────────────────────────────────

// context: {
//   unit:     { company, branch }
//   accounts: { <accountField>: "1010", … }   resolved account codes
//   amounts:  { <dataField>: 37000000, … }    base-currency integers
//   fx:       optional { currency, amount, rate } tagged onto every line
//   fxByRule: optional { <rule name>: { currency, amount, rate } }, which wins
//             over `fx` — a payment settles at one rate and leaves the bank at
//             another, so its two lines carry different tags
//   counterparty: optional company id tagged onto every line
// }
export function applyMapping(mappingId, context) {
  const m = BY_ID.get(mappingId);
  if (!m) throw new Error(`unknown ledger mapping ${mappingId}`);
  const { unit, accounts = {}, amounts = {}, fx = null, fxByRule = null, counterparty = null } = context;

  const lines = [];
  for (const r of m.rules) {
    const code = r.account ?? accounts[r.accountField];
    if (!code) {
      throw new Error(`mapping ${m.id} rule "${r.name}": no account for field ${r.accountField}`);
    }
    if (!account(code)) throw new Error(`mapping ${m.id} rule "${r.name}": unknown account ${code}`);

    const raw = amounts[r.dataField];
    if (raw == null) throw new Error(`mapping ${m.id} rule "${r.name}": no value for data field ${r.dataField}`);
    if (!Number.isInteger(raw)) throw new Error(`mapping ${m.id} rule "${r.name}": ${r.dataField} is not an integer`);

    if (raw === 0 && r.omitWhenNil) continue;

    // A signed rule posts on the other side when the amount comes out negative —
    // the realised exchange difference is a loss or a gain from one rule.
    const flipped = r.signed && raw < 0;
    const isDebit = flipped ? r.entryType === "Credit" : r.entryType === "Debit";
    const value = r.signed ? Math.abs(raw) : raw;

    const tagged = (fxByRule && fxByRule[r.name]) || fx || null;
    lines.push({
      account: code,
      [isDebit ? "debit" : "credit"]: value,
      company: unit.company,
      branch: unit.branch,
      counterparty,
      fx: tagged,
      rule: r.name,
    });
  }
  return lines;
}

// The journal an entity produces, mapping and all. Every builder in the module
// goes through here, so a journal always knows which rule posted it.
export function mappedEntry(mappingId, { date, memo, source, batch, ...context }) {
  return {
    date,
    memo,
    source,
    batch,
    mappingId,
    lines: applyMapping(mappingId, context),
  };
}
