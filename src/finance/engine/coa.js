// Chart of accounts.
//
// Each account carries its statement type and its cash-flow classification.
// The cash flow statement is then derived rather than hand-built: because every
// journal balances, the movement on the cash accounts is exactly the negative
// of the movement on everything else, so classifying every non-cash account
// into operating / investing / financing makes the statement tie by
// construction. See reports.js → cashFlow.

// type:  asset | liability | equity | income | cos | expense
// cf:    cash | operating | investing | financing
// group: the balance-sheet or P&L grouping the account is presented under
export const ACCOUNTS = [
  // ── Assets ────────────────────────────────────────────────────────────────
  { code: "1010", name: "Bank – UGX", type: "asset", cf: "cash", group: "cash", currency: "UGX", bank: true },
  { code: "1020", name: "Bank – USD", type: "asset", cf: "cash", group: "cash", currency: "USD", bank: true },
  { code: "1100", name: "Accounts Receivable", type: "asset", cf: "operating", group: "receivables" },
  { code: "1200", name: "Prepaid Insurance", type: "asset", cf: "operating", group: "prepayments", prepaid: true },
  { code: "1210", name: "Prepaid Software", type: "asset", cf: "operating", group: "prepayments", prepaid: true },
  { code: "1500", name: "Motor Vehicles – Cost", type: "asset", cf: "investing", group: "ppe-cost" },
  { code: "1510", name: "Plant & Equipment – Cost", type: "asset", cf: "investing", group: "ppe-cost" },
  { code: "1520", name: "Furniture & Fittings – Cost", type: "asset", cf: "investing", group: "ppe-cost" },
  { code: "1550", name: "Accumulated Depreciation – Motor Vehicles", type: "asset", cf: "operating", group: "ppe-accum", addBack: true, contra: true },
  { code: "1560", name: "Accumulated Depreciation – Plant & Equipment", type: "asset", cf: "operating", group: "ppe-accum", addBack: true, contra: true },
  { code: "1570", name: "Accumulated Depreciation – Furniture & Fittings", type: "asset", cf: "operating", group: "ppe-accum", addBack: true, contra: true },
  { code: "1900", name: "Intercompany Receivable", type: "asset", cf: "operating", group: "intercompany", intercompany: true },

  // ── Liabilities ───────────────────────────────────────────────────────────
  { code: "2010", name: "Accounts Payable", type: "liability", cf: "operating", group: "payables" },
  { code: "2100", name: "Bank Loan", type: "liability", cf: "financing", group: "borrowings" },
  { code: "2900", name: "Intercompany Payable", type: "liability", cf: "operating", group: "intercompany", intercompany: true },

  // ── Equity ────────────────────────────────────────────────────────────────
  { code: "3010", name: "Share Capital", type: "equity", cf: "financing", group: "capital" },
  { code: "3900", name: "Retained Earnings", type: "equity", cf: "financing", group: "retained" },

  // ── Income ────────────────────────────────────────────────────────────────
  { code: "4010", name: "Sales", type: "income", cf: "operating", group: "revenue" },
  { code: "4020", name: "Rental Income", type: "income", cf: "operating", group: "revenue" },
  { code: "4030", name: "Management Fee Income", type: "income", cf: "operating", group: "revenue" },

  // ── Cost of sales ─────────────────────────────────────────────────────────
  { code: "5010", name: "Cost of Sales", type: "cos", cf: "operating", group: "cost-of-sales" },

  // ── Expenses ──────────────────────────────────────────────────────────────
  { code: "6010", name: "Salaries", type: "expense", cf: "operating", group: "opex" },
  { code: "6020", name: "Rent", type: "expense", cf: "operating", group: "opex" },
  { code: "6030", name: "Utilities", type: "expense", cf: "operating", group: "opex" },
  { code: "6040", name: "Kitchen Supplies", type: "expense", cf: "operating", group: "opex" },
  { code: "6050", name: "Medical Insurance", type: "expense", cf: "operating", group: "opex" },
  { code: "6060", name: "Software Licences", type: "expense", cf: "operating", group: "opex" },
  { code: "6070", name: "Depreciation", type: "expense", cf: "operating", group: "opex" },
  { code: "6080", name: "Management Fees", type: "expense", cf: "operating", group: "opex" },
  { code: "6090", name: "Interest", type: "expense", cf: "operating", group: "finance-cost" },
  { code: "6100", name: "Realised FX Gain/Loss", type: "expense", cf: "operating", group: "finance-cost" },
];

const BY_CODE = new Map(ACCOUNTS.map((a) => [a.code, a]));

export const account = (code) => BY_CODE.get(code);
export const accountName = (code) => BY_CODE.get(code)?.name || code;
export const accountType = (code) => BY_CODE.get(code)?.type;

export const codesOfType = (...types) =>
  ACCOUNTS.filter((a) => types.includes(a.type)).map((a) => a.code);

export const codesOfGroup = (...groups) =>
  ACCOUNTS.filter((a) => groups.includes(a.group)).map((a) => a.code);

// A positive signed balance (debit − credit) is a debit. Assets and expenses
// sit naturally on the debit side; everything else reads better flipped.
export const naturalSign = (code) => {
  const t = BY_CODE.get(code)?.type;
  return t === "asset" || t === "expense" || t === "cos" ? 1 : -1;
};

// Which side an account normally carries its balance on. Accumulated
// depreciation is an asset account that sits on the credit side — flagging it
// as contra keeps the chart of accounts honest about that instead of showing a
// negative asset and leaving the reader to work it out.
export const normalSide = (code) => {
  const a = BY_CODE.get(code);
  if (!a) return "Debit";
  if (a.contra) return naturalSign(code) === 1 ? "Credit" : "Debit";
  return naturalSign(code) === 1 ? "Debit" : "Credit";
};

export const isContra = (code) => !!BY_CODE.get(code)?.contra;

export const PL_CODES = codesOfType("income", "cos", "expense");
export const BS_CODES = codesOfType("asset", "liability", "equity");
export const CASH_CODES = ACCOUNTS.filter((a) => a.cf === "cash").map((a) => a.code);
export const INTERCOMPANY_CODES = ACCOUNTS.filter((a) => a.intercompany).map((a) => a.code);
export const PREPAID_CODES = ACCOUNTS.filter((a) => a.prepaid).map((a) => a.code);
export const PPE_COST_CODES = codesOfGroup("ppe-cost");
export const PPE_ACCUM_CODES = codesOfGroup("ppe-accum");

// ─── Asset categories ─────────────────────────────────────────────────────────
// Defaults a new asset inherits: method, life and the three accounts it posts to.

export const ASSET_CATEGORIES = [
  {
    id: "motor",
    name: "Motor Vehicles",
    method: "straight-line",
    lifeMonths: 60,
    residual: 0,
    costAccount: "1500",
    accumAccount: "1550",
    expenseAccount: "6070",
  },
  {
    id: "plant",
    name: "Plant & Equipment",
    method: "straight-line",
    lifeMonths: 48,
    residual: 0,
    costAccount: "1510",
    accumAccount: "1560",
    expenseAccount: "6070",
  },
  {
    id: "furniture",
    name: "Furniture & Fittings",
    method: "straight-line",
    lifeMonths: 36,
    residual: 0,
    costAccount: "1520",
    accumAccount: "1570",
    expenseAccount: "6070",
  },
];

export const assetCategory = (id) => ASSET_CATEGORIES.find((c) => c.id === id);
