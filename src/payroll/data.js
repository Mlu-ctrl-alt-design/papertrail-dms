// Ezra360 Payroll — demo data for the payroll administration module.
// Mid-June 2026 snapshot: June is the current (ready) run, July is upcoming.

export const CYCLE_TYPES = ["Weekly", "Biweekly", "Monthly"];

// The "today" the module is anchored to (June run window open).
export const TODAY = new Date("2026-06-22T00:00:00");

export const TOTAL_IN_RUN = 110;

export const PERIODS = [
  { id: "mar", label: "March 2026", endsLabel: "31 March 2026", phase: "completed", windowOpenISO: "2026-03-20", windowOpensDisplay: "20 March 2026", payDateISO: "2026-03-25", scheduled: "25 March 2026" },
  { id: "apr", label: "April 2026", endsLabel: "30 April 2026", phase: "completed", windowOpenISO: "2026-04-20", windowOpensDisplay: "20 April 2026", payDateISO: "2026-04-24", scheduled: "24 April 2026" },
  { id: "may", label: "May 2026", endsLabel: "31 May 2026", phase: "completed", windowOpenISO: "2026-05-20", windowOpensDisplay: "20 May 2026", payDateISO: "2026-05-25", scheduled: "25 May 2026" },
  { id: "jun", label: "June 2026", endsLabel: "30 June 2026", phase: "ready", current: true, windowOpenISO: "2026-06-20", windowOpensDisplay: "20 June 2026", payDateISO: "2026-06-25", scheduled: "25 June 2026" },
  { id: "jul", label: "July 2026", endsLabel: "31 July 2026", phase: "before", windowOpenISO: "2026-07-20", windowOpensDisplay: "20 July 2026", payDateISO: "2026-07-25", scheduled: "25 July 2026" },
];

export const DEFAULT_PERIOD_ID = "jun";

export const CYCLE = {
  financialYear: "1 March 2026 - 28 February 2027",
  taxYear: "1 March 2026 - 28 February 2027",
  totalEmployees: 110,
  totalGroups: 12,
};

export const RUN = { included: 107, excluded: 3, joined: 3 };

export const PROJECTED = { cost: "R 585,000.00", employees: 110, deductions: "R 62,400.00", tax: "R 56,100.00" };
export const ACTUAL = { cost: "R 560,665.00", employees: 107, deductions: "R 60,478.00", tax: "R 54,933.00" };

export const EMPLOYEE_STATISTICS = [
  { label: "Total Earnings", value: "R 6,500.00" },
  { label: "Total Medical Aid", value: "R 4,935.00" },
  { label: "Total Gross Pay", value: "R 560,665.00" },
  { label: "Total Deductions", value: "R 895.00" },
  { label: "Total UIF", value: "R 650.00" },
  { label: "Total Net Pay", value: "R 400,000.00" },
];

export const COMPANY_TOTALS = [
  { label: "Total Company Contributions", value: "R 1,245.00" },
  { label: "Total UIF", value: "R 650.00" },
  { label: "Total PAYE", value: "R 54,933.00" },
  { label: "Total Fringe Benefits", value: "R 895.00" },
  { label: "Total SDL", value: "R 1,020.00" },
];

export const DEPARTMENTS = [
  { name: "Engineering", total: 32, done: 32 },
  { name: "Sales", total: 24, done: 20 },
  { name: "Operations", total: 28, done: 22 },
  { name: "Finance", total: 12, done: 12 },
  { name: "People & Culture", total: 14, done: 11 },
];

// tone: success | danger | warning | brand
export const EXCEPTIONS = [
  { key: "excluded", label: "Excluded employees", count: 3, tone: "danger", hint: "Not part of this run" },
  { key: "failed", label: "Failed payroll items", count: 3, tone: "danger", hint: "Require reprocessing" },
  { key: "approvals", label: "Pending approvals", count: 5, tone: "warning", hint: "Awaiting sign-off" },
  { key: "claims", label: "Late claims", count: 2, tone: "warning", hint: "Submitted after cut-off" },
  { key: "adjustments", label: "Manual overrides", count: 7, tone: "brand", hint: "Manual interventions" },
];

export const MANUAL_ADJUSTMENTS = [
  { employee: "Hamphrey Mankwe", type: "Salary change", original: "R 42,000.00", updated: "R 45,000.00", user: "T. Matjila", reason: "Annual increase", date: "12 Jun 2026" },
  { employee: "Azania Maredi", type: "Leave payout", original: "—", updated: "R 8,200.00", user: "N. Dlamini", reason: "Accrued leave", date: "14 Jun 2026" },
  { employee: "Andile Hussain", type: "One-off payment", original: "—", updated: "R 3,500.00", user: "T. Matjila", reason: "Performance bonus", date: "15 Jun 2026" },
  { employee: "Akani Hlungwani", type: "One-off deduction", original: "—", updated: "-R 1,200.00", user: "T. Matjila", reason: "Salary advance recovery", date: "16 Jun 2026" },
  { employee: "Lindiwe Nkosi", type: "Claim", original: "—", updated: "R 1,850.00", user: "N. Dlamini", reason: "Travel reimbursement", date: "17 Jun 2026" },
];

export const EMPLOYEES = [
  { id: "emp-00037", name: "Agobakwe Phanyane", number: "EMP-00037", email: "agobakwe@group.co.za", department: "Engineering", included: true, projectedSalary: 38000, actualSalary: 38000, claim: 0, color: "#219CD6" },
  { id: "emp-00011", name: "Akani Hlungwani", number: "EMP-00011", email: "akanih@group.co.za", department: "Sales", included: true, adjusted: true, projectedSalary: 32000, actualSalary: 30800, claim: 0, color: "#107c10" },
  { id: "emp-00047", name: "Andile Hussain", number: "EMP-00047", email: "andileh@group.co.za", department: "Operations", included: true, failed: true, adjusted: true, projectedSalary: 41000, actualSalary: 44500, claim: 3500, color: "#8764b8" },
  { id: "emp-00068", name: "Azania Maredi", number: "EMP-00068", email: "azaniam@group.co.za", department: "Finance", included: true, adjusted: true, projectedSalary: 40000, actualSalary: 48200, claim: 0, color: "#005a9e" },
  { id: "emp-00049", name: "Derel Maswanganyi", number: "EMP-00049", email: "derelm@group.co.za", department: "Operations", included: false, projectedSalary: 35000, actualSalary: null, claim: 0, color: "#c8a116" },
  { id: "emp-00025", name: "Hamphrey Mankwe", number: "EMP-00025", email: "hamphreym@group.co.za", department: "Engineering", included: true, adjusted: true, projectedSalary: 42000, actualSalary: 45000, claim: 0, color: "#a4262c" },
  { id: "emp-00021", name: "Kaone Emmanuel Senoamali", number: "EMP-00021", email: "kaones@group.co.za", department: "Sales", included: true, failed: true, projectedSalary: 33000, actualSalary: 33000, claim: 1200, color: "#219CD6" },
  { id: "emp-00072", name: "Kgopotso Riba", number: "EMP-00072", email: "kgopotsor@group.co.za", department: "People & Culture", included: false, projectedSalary: 37000, actualSalary: null, claim: 0, color: "#107c10" },
  { id: "emp-00058", name: "Lindiwe Nkosi", number: "EMP-00058", email: "lindiwen@group.co.za", department: "Finance", included: true, adjusted: true, projectedSalary: 36000, actualSalary: 36000, claim: 1850, color: "#8764b8" },
  { id: "emp-00063", name: "Sibusiso Dlamini", number: "EMP-00063", email: "sibusisod@group.co.za", department: "Operations", included: false, failed: true, projectedSalary: 39000, actualSalary: null, claim: 0, color: "#005a9e" },
];

export const TOTAL_EMPLOYEE_COUNT = 124;
