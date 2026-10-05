// Ezra360 Financials — demo-wide constants and formatting.
//
// Everything time-dependent in this module reads TODAY from here rather than
// the real clock: the demo is scripted around an open October 2026 period and
// must look the same whenever it is shown.

export const BASE_CURRENCY = "UGX";

// Minor units per currency. UGX is quoted whole in practice, so base amounts
// are plain integers of shillings; USD is held in cents.
export const MINOR = { UGX: 0, USD: 2 };

export const TODAY = "2026-10-20";

export const FY = { start: "2026-01-01", end: "2026-12-31", label: "FY2026" };

// Books are closed to the end of September; October is the open period.
export const CLOSED_THROUGH = "2026-09";
export const OPEN_PERIOD = "2026-10";

// ─── Group structure ──────────────────────────────────────────────────────────
// Placeholder names (PRD assumption A2) — the real entities are not known.

export const COMPANIES = [
  {
    id: "holdings",
    name: "Hugamara Holdings Ltd",
    short: "Holdings",
    branches: [{ id: "ho", name: "Head Office" }],
  },
  {
    id: "hospitality",
    name: "Hugamara Hospitality Ltd",
    short: "Hospitality",
    branches: [
      { id: "kla-central", name: "Kampala Central" },
      { id: "entebbe", name: "Entebbe" },
    ],
  },
  {
    id: "properties",
    name: "Hugamara Properties Ltd",
    short: "Properties",
    branches: [
      { id: "kla", name: "Kampala" },
      { id: "jinja", name: "Jinja" },
    ],
  },
];

export const GROUP_NAME = "Hugamara Group";

export const companyById = (id) => COMPANIES.find((c) => c.id === id);

export const branchById = (companyId, branchId) =>
  companyById(companyId)?.branches.find((b) => b.id === branchId);

export const companyName = (id) => companyById(id)?.name || id;
export const companyShort = (id) => companyById(id)?.short || id;
export const branchName = (companyId, branchId) =>
  branchById(companyId, branchId)?.name || branchId;

// Every (company, branch) pair, in presentation order.
export const ALL_BRANCHES = COMPANIES.flatMap((c) =>
  c.branches.map((b) => ({ company: c.id, branch: b.id, label: `${c.short} · ${b.name}` })),
);

// ─── Scope ────────────────────────────────────────────────────────────────────
// `{ company: null, branch: null }` is the group. A branch always carries its
// company, so a scope is never ambiguous.

export const GROUP_SCOPE = { company: null, branch: null };

export const scopeLabel = (scope) => {
  if (!scope || !scope.company) return GROUP_NAME;
  if (!scope.branch) return companyName(scope.company);
  return `${companyShort(scope.company)} · ${branchName(scope.company, scope.branch)}`;
};

export const scopeKey = (scope) =>
  !scope || !scope.company ? "group" : scope.branch ? `${scope.company}/${scope.branch}` : scope.company;

// ─── Dates ────────────────────────────────────────────────────────────────────
// ISO date strings throughout ("2026-10-20"). String comparison is chronological,
// which keeps period filtering free of Date-object timezone surprises.

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_ABBR = MONTH_NAMES.map((m) => m.slice(0, 3));

export const monthKey = (iso) => iso.slice(0, 7);

export const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
};

export const monthLabelShort = (key) => {
  const [y, m] = key.split("-");
  return `${MONTH_ABBR[Number(m) - 1]} ${y.slice(2)}`;
};

export const addMonths = (key, n) => {
  const [y, m] = key.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
};

export const monthsBetween = (fromKey, toKey) => {
  const [fy, fm] = fromKey.split("-").map(Number);
  const [ty, tm] = toKey.split("-").map(Number);
  return (ty * 12 + tm) - (fy * 12 + fm);
};

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const daysInMonth = (key) => {
  const [y, m] = key.split("-").map(Number);
  if (m === 2 && (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) return 29;
  return DAYS_IN_MONTH[m - 1];
};

export const monthStart = (key) => `${key}-01`;
export const monthEnd = (key) => `${key}-${String(daysInMonth(key)).padStart(2, "0")}`;

export const prettyDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${MONTH_ABBR[Number(m) - 1]} ${y}`;
};

// ─── Money formatting ─────────────────────────────────────────────────────────
// Accountants' conventions: thousands separators, negatives in brackets, and a
// dash for exact nil so a column of zeros does not shout.

const group = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export function fmtBase(n, { blankZero = false, dash = true } = {}) {
  const v = Math.round(n || 0);
  if (v === 0) return blankZero ? "" : dash ? "—" : "0";
  const s = group(String(Math.abs(v)));
  return v < 0 ? `(${s})` : s;
}

export function money(n, { blankZero = false } = {}) {
  const v = Math.round(n || 0);
  if (v === 0 && blankZero) return "";
  if (v === 0) return `${BASE_CURRENCY} 0`;
  const s = group(String(Math.abs(v)));
  return v < 0 ? `(${BASE_CURRENCY} ${s})` : `${BASE_CURRENCY} ${s}`;
}

// Foreign amounts are held in minor units.
export function fmtForeign(minorAmount, currency = "USD") {
  const dp = MINOR[currency] ?? 2;
  const unit = 10 ** dp;
  const v = minorAmount || 0;
  const abs = Math.abs(v);
  const whole = Math.floor(abs / unit);
  const frac = abs % unit;
  const s = dp === 0 ? group(String(whole)) : `${group(String(whole))}.${String(frac).padStart(dp, "0")}`;
  return v < 0 ? `(${s})` : s;
}

export const foreignWithCode = (minorAmount, currency = "USD") =>
  `${currency} ${fmtForeign(minorAmount, currency)}`;

export const fmtRate = (rate) => group(String(Math.round(rate)));

// Convert a foreign minor amount to base currency at a rate.
export const toBase = (minorAmount, currency, rate) =>
  Math.round((minorAmount / 10 ** (MINOR[currency] ?? 2)) * rate);

// The day before an ISO date — used for "cash at the beginning of the period".
export function prevDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  if (d > 1) return `${y}-${String(m).padStart(2, "0")}-${String(d - 1).padStart(2, "0")}`;
  const pm = m === 1 ? 12 : m - 1;
  const py = m === 1 ? y - 1 : y;
  const key = `${py}-${String(pm).padStart(2, "0")}`;
  return monthEnd(key);
}

// "1 journal" / "5 journals". Small, but a demo that says "1 journals" in front
// of a finance audience has already lost a little credibility.
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
