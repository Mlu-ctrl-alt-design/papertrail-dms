// Gauteng Department of Social Development seed data.
// Provincial department aligned to national DSD priorities:
// social welfare, child & family care, community development,
// substance abuse rehabilitation, and good governance.
// All numbers/IDs are illustrative.

// ─── Organisation master ─────────────────────────────────────────────────────
export const MUNICIPALITY = {
  code: "GP-DSD",
  name: "Gauteng Department of Social Development",
  district: "Gauteng Province",
  province: "Gauteng",
  category: "Provincial Department",
  wards: 5,                   // 5 district offices
  staffEstablishment: 3120,
  fiscalYear: "2026/27",
  activeBeneficiaries: 38_400, // social beneficiaries reached YTD
  branding: { primary: "#1B3A6B", accent: "#C9960A", motto: "Together we care, together we grow" },
};

// ─── Users / personae ─────────────────────────────────────────────────────────
export const USERS = [
  // Demo personas (selectable via switcher)
  { id: "u_mec",     demo: true,  name: "Hon. Hlengiwe Mkhize",  initials: "HM", role: "MEC: Social Development",           color: "#a4262c", department: "office_hod", level: 1, nav: ["dashboard", "idp", "sdbip", "workmgmt", "audit"] },
  { id: "u_hod",     demo: true,  name: "Dr. Ntsiki Sithebe",    initials: "NS", role: "Head of Department",                color: "#219CD6", department: "office_hod", level: 2, nav: ["dashboard", "idp", "sdbip", "ipms", "poe", "workmgmt", "audit"] },
  { id: "u_cfo",     demo: true,  name: "Tshepo Mokoena",        initials: "TM", role: "Chief Director: Finance & SCM",     color: "#107c10", department: "finance",    level: 3, nav: ["dashboard", "idp", "sdbip", "ipms", "poe", "workmgmt"] },
  { id: "u_distdir", demo: true,  name: "Mapula Mashishi",       initials: "MM", role: "District Director: Johannesburg",         color: "#8764b8", department: "welfare",    level: 4, nav: ["dashboard", "ipms", "poe", "workmgmt"] },
  { id: "u_sw",      demo: true,  name: "Thandiwe Nkosi",        initials: "TN", role: "Senior Social Worker",              color: "#1D4FD7", department: "welfare",    level: 5, nav: ["dashboard", "ipms", "workmgmt"] },
  { id: "u_audit",   demo: true,  name: "Refilwe Dlamini",       initials: "RD", role: "Internal Auditor",                  color: "#605e5c", department: "office_hod", level: 0, nav: ["dashboard", "poe", "audit", "workmgmt"], readOnly: true },

  // Other staff referenced as data only (not selectable as a persona)
  { id: "u_welfare_dir",  name: "S Makhuvele", initials: "SM", role: "Chief Director: Social Welfare",         color: "#219CD6", department: "welfare" },
  { id: "u_child_dir",    name: "N Sithole",   initials: "NS", role: "Chief Director: Children & Families",    color: "#107c10", department: "children" },
  { id: "u_comm_dir",     name: "M Chauke",    initials: "MC", role: "Chief Director: Community Development",  color: "#8764b8", department: "comm_dev" },
  { id: "u_substance_dir",name: "P Nkuna",     initials: "PN", role: "Chief Director: Substance Abuse",        color: "#a4262c", department: "substance" },
];

export const DEMO_PERSONAS = USERS.filter((u) => u.demo);

export const userById = (id) => USERS.find((u) => u.id === id) || { name: "Unknown", initials: "??", color: "#a19f9d", role: "" };

// Default landing persona: MEC (demo opens here per the script).
export const CURRENT_USER = USERS.find((u) => u.id === "u_mec");

// ─── Programmes / KPAs / Districts ───────────────────────────────────────────
export const DEPARTMENTS = [
  { id: "office_hod", label: "Office of the Head of Department" },
  { id: "corp",       label: "Corporate Services" },
  { id: "finance",    label: "Finance & Supply Chain Management" },
  { id: "welfare",    label: "Social Welfare Services" },
  { id: "children",   label: "Children & Family Care" },
  { id: "comm_dev",   label: "Community Development" },
  { id: "substance",  label: "Substance Abuse & Rehabilitation" },
];

// Departmental Key Performance Areas aligned to the Strategic Plan 2024–2029
export const KPAS = [
  { id: "kpa1", code: "KPA 1", label: "Social Protection & Welfare Services",    color: "#219CD6" },
  { id: "kpa2", code: "KPA 2", label: "Children & Families Care",                color: "#107c10" },
  { id: "kpa3", code: "KPA 3", label: "Community Development & Empowerment",     color: "#1D4FD7" },
  { id: "kpa4", code: "KPA 4", label: "Substance Abuse & Rehabilitation",        color: "#8764b8" },
  { id: "kpa5", code: "KPA 5", label: "Good Governance & Administration",        color: "#c8a116" },
];

// Districts — Gauteng's 5 district offices (replacing ward structure)
export const WARDS = [
  { id: "w1", number: 1, label: "Johannesburg", name: "City of Johannesburg (CoJ)" },
  { id: "w2", number: 2, label: "Tshwane",      name: "City of Tshwane (CoT)" },
  { id: "w3", number: 3, label: "Ekurhuleni",   name: "Ekurhuleni District" },
  { id: "w4", number: 4, label: "Sedibeng",     name: "Sedibeng District" },
  { id: "w5", number: 5, label: "West Rand",    name: "West Rand District" },
];

// ─── Strategic Plan — Objectives & Risks ─────────────────────────────────────
export const IDP_CYCLE = {
  id: "sp_2024_29",
  label: "Strategic Plan 2024–2029 (5-year cycle)",
  reviewYear: "2026/27 Annual Performance Plan (APP)",
  mecRating: "Compliant",
  mecComments: "Well-aligned to national DSD priorities. Strengthen social worker vacancy filling and ECD registration.",
  tabledOnCouncil: "2024-03-31",
};

export const STRATEGIC_OBJECTIVES = [
  { id: "so1", code: "SO 1.1", kpaId: "kpa1", title: "Increase access to social welfare services in underserved districts", owner: "u_welfare_dir", status: "On track", progress: 72, target2029: "95% district coverage",          baseline2024: "78%",                risks: ["risk1"] },
  { id: "so2", code: "SO 1.2", kpaId: "kpa1", title: "Reduce social work case backlog — all assessments within 30 days",   owner: "u_welfare_dir", status: "At risk",  progress: 45, target2029: "100% assessed within 30 days", baseline2024: "61% within 30 days", risks: ["risk2"] },
  { id: "so3", code: "SO 2.1", kpaId: "kpa2", title: "Register and fund all eligible ECD centres province-wide",           owner: "u_child_dir",   status: "On track", progress: 68, target2029: "800 registered ECD centres",   baseline2024: "512 centres",        risks: ["risk3"] },
  { id: "so4", code: "SO 2.2", kpaId: "kpa2", title: "Achieve 100% child protection response within 24 hours",            owner: "u_child_dir",   status: "Behind",   progress: 38, target2029: "100% within 24 hours",        baseline2024: "42% within 24h",     risks: ["risk4"] },
  { id: "so5", code: "SO 3.1", kpaId: "kpa3", title: "Establish active community development forums in all 5 districts",  owner: "u_comm_dir",    status: "On track", progress: 60, target2029: "5 / 5 districts active",      baseline2024: "2 / 5 districts",    risks: [] },
  { id: "so6", code: "SO 3.2", kpaId: "kpa3", title: "Achieve 90% NPO compliance through enhanced monitoring",            owner: "u_comm_dir",    status: "On track", progress: 55, target2029: "90% registered NPOs compliant", baseline2024: "67% compliant",     risks: ["risk5"] },
  { id: "so7", code: "SO 4.1", kpaId: "kpa4", title: "Expand substance abuse treatment capacity to 450 beds",             owner: "u_substance_dir",status: "At risk", progress: 33, target2029: "450 treatment beds",           baseline2024: "180 beds",           risks: ["risk6"] },
  { id: "so8", code: "SO 5.1", kpaId: "kpa5", title: "Implement full PMDS for all Section 38/45 officials",               owner: "u_hod",         status: "On track", progress: 70, target2029: "100% PAs signed & reviewed",   baseline2024: "Manual paper-based",  risks: [] },
  { id: "so9", code: "SO 5.2", kpaId: "kpa5", title: "Achieve unqualified AGSA audit opinion by FY 2025/26",              owner: "u_hod",         status: "Behind",   progress: 30, target2029: "Unqualified",                 baseline2024: "Qualified",          risks: ["risk7"] },
];

export const STRATEGIC_RISKS = [
  { id: "risk1", code: "R-01", title: "Social worker vacancy rate exceeds 35%",                    likelihood: 5, impact: 5, residual: "Critical", owner: "u_hod",          mitigation: "Fast-track recruitment. Bursary scheme for social work graduates in rural districts." },
  { id: "risk2", code: "R-02", title: "High caseloads delay statutory 30-day assessments",        likelihood: 5, impact: 4, residual: "High",     owner: "u_welfare_dir",  mitigation: "Case management system. Workload cap of 35 cases per social worker enforced." },
  { id: "risk3", code: "R-03", title: "ECD centres operating without registration",               likelihood: 4, impact: 4, residual: "High",     owner: "u_child_dir",    mitigation: "Provincial ECD registration campaign. Subsidies contingent on registration status." },
  { id: "risk4", code: "R-04", title: "Child protection cases not responded to within 24 hours", likelihood: 4, impact: 5, residual: "Critical", owner: "u_child_dir",    mitigation: "24/7 on-call roster. Supervisor escalation protocol within 4 hours." },
  { id: "risk5", code: "R-05", title: "NPO non-compliance risks service delivery gaps",           likelihood: 4, impact: 4, residual: "High",     owner: "u_comm_dir",     mitigation: "Quarterly NPO compliance audits. Conditional funding linked to reporting compliance." },
  { id: "risk6", code: "R-06", title: "Substance abuse treatment capacity below provincial need",  likelihood: 5, impact: 5, residual: "Critical", owner: "u_substance_dir",mitigation: "3 new treatment centres (Infrastructure Grant). PPP model for Johannesburg district." },
  { id: "risk7", code: "R-07", title: "Prior year AGSA findings unresolved at follow-up visit",   likelihood: 4, impact: 5, residual: "High",     owner: "u_audit",        mitigation: "Monthly audit action plan tracking. CFO weekly review with HOD." },
];

// ─── APP — Annual Performance Plan targets ────────────────────────────────────
// One row per APP indicator. Quarterly projections sum to annual target.
export const SDBIP_TARGETS = [
  { id: "sd1",  code: "APP-T-001", soId: "so1", department: "welfare",    indicator: "Social welfare beneficiaries reached",           unit: "beneficiaries", q1: 18000, q2: 20000, q3: 22000, q4: 25000, ytd: 38400, annual: 85000, mscoaProject: "WELFARE-2026-001", wards: ["w2","w3"],         owner: "u_welfare_dir",   status: "On track" },
  { id: "sd2",  code: "APP-T-002", soId: "so2", department: "welfare",    indicator: "Social work assessments completed within 30 days",  unit: "%",            q1: 55,    q2: 65,    q3: 75,    q4: 85,    ytd: 61,    annual: 85,    mscoaProject: "WELFARE-2026-002", wards: WARDS.map(w=>w.id), owner: "u_welfare_dir",   status: "At risk" },
  { id: "sd3",  code: "APP-T-003", soId: "so3", department: "children",   indicator: "ECD centres registered and funded",               unit: "centres",       q1: 560,   q2: 600,   q3: 640,   q4: 680,   ytd: 574,   annual: 680,   mscoaProject: "ECD-2026-001",     wards: WARDS.map(w=>w.id), owner: "u_child_dir",     status: "On track" },
  { id: "sd4",  code: "APP-T-004", soId: "so4", department: "children",   indicator: "Child protection cases responded to within 24h",   unit: "%",            q1: 50,    q2: 60,    q3: 70,    q4: 80,    ytd: 44,    annual: 80,    mscoaProject: "CP-2026-001",      wards: WARDS.map(w=>w.id), owner: "u_child_dir",     status: "Behind" },
  { id: "sd5",  code: "APP-T-005", soId: "so5", department: "comm_dev",   indicator: "Community development forums established",         unit: "districts",    q1: 2,     q2: 3,     q3: 4,     q4: 5,     ytd: 3,     annual: 5,     mscoaProject: "CD-2026-001",      wards: [],                 owner: "u_comm_dir",      status: "On track" },
  { id: "sd6",  code: "APP-T-006", soId: "so6", department: "comm_dev",   indicator: "NPO compliance inspections completed",             unit: "NPOs",         q1: 80,    q2: 120,   q3: 160,   q4: 200,   ytd: 118,   annual: 200,   mscoaProject: "NPO-2026-001",     wards: [],                 owner: "u_comm_dir",      status: "On track" },
  { id: "sd7",  code: "APP-T-007", soId: "so9", department: "finance",    indicator: "AGSA audit findings cleared from prior year",      unit: "findings",     q1: 5,     q2: 8,     q3: 10,    q4: 15,    ytd: 4,     annual: 28,    mscoaProject: "FIN-2026-001",     wards: [],                 owner: "u_cfo",           status: "Behind" },
  { id: "sd8",  code: "APP-T-008", soId: "so8", department: "office_hod", indicator: "Section 38/45 performance agreements signed",      unit: "%",            q1: 100,   q2: 100,   q3: 100,   q4: 100,   ytd: 85,    annual: 100,   mscoaProject: "HR-2026-001",      wards: [],                 owner: "u_hod",           status: "At risk" },
  { id: "sd9",  code: "APP-T-009", soId: "so7", department: "substance",  indicator: "Substance abuse treatment beds occupied",          unit: "%",            q1: 60,    q2: 70,    q3: 75,    q4: 80,    ytd: 58,    annual: 80,    mscoaProject: "SA-2026-001",      wards: [],                 owner: "u_substance_dir", status: "At risk" },
  { id: "sd10", code: "APP-T-010", soId: "so1", department: "welfare",    indicator: "Social grant referrals processed to SASSA",        unit: "referrals",    q1: 4000,  q2: 5000,  q3: 5000,  q4: 6000,  ytd: 8200,  annual: 20000, mscoaProject: "GRANTS-2026-001",  wards: WARDS.map(w=>w.id), owner: "u_welfare_dir",   status: "On track" },
];

// ─── BAS — budget transactions (Basic Accounting System) ─────────────────────
// Project · Function · Funding · Item · Costing · Region · ItemCategory
export const MSCOA_TRANSACTIONS = [
  { id: "tx0",  ref: "BAS-2026-04-1001", date: "2026-05-09", description: "ECD centre subsidies — Johannesburg district (batch 3)",           amount: -4_200_000, project: "ECD-2026-001",     function: "Child Care & Protection",   funding: "Equitable Share",      item: "Transfers & Subsidies",      costing: "Direct",   region: "w2", itemCategory: "Transfer Payments",       status: "Posted" },
  { id: "tx1",  ref: "BAS-2026-04-1002", date: "2026-05-08", description: "Social worker salaries — Q1 (Tshwane district)",              amount: -6_840_000, project: "WELFARE-2026-001", function: "Social Welfare Services",   funding: "Equitable Share",      item: "Compensation of Employees",  costing: "Direct",   region: "w3", itemCategory: "Personnel",               status: "Posted" },
  { id: "tx2",  ref: "BAS-2026-04-1003", date: "2026-05-08", description: "NPO conditional grant — community development programmes",    amount: -1_280_000, project: "NPO-2026-001",     function: "Community Development",     funding: "Conditional Grant",    item: "Transfers & Subsidies",      costing: "Direct",   region: "w1", itemCategory: "Transfer Payments",       status: "Posted" },
  { id: "tx3",  ref: "BAS-2026-04-1004", date: "2026-05-07", description: "Substance abuse treatment centre consumables",               amount:   -384_000, project: "SA-2026-001",      function: "Substance Abuse",           funding: "Equitable Share",      item: "Goods & Services",           costing: "Direct",   region: "w4", itemCategory: "Operational Expenditure", status: "Posted" },
  { id: "tx4",  ref: "BAS-2026-04-1005", date: "2026-05-06", description: "Child care facility construction — West Rand (Phase 1)",    amount: -9_600_000, project: "CP-2026-001",      function: "Child Care & Protection",   funding: "Infrastructure Grant", item: "Capital Asset",              costing: "Direct",   region: "w5", itemCategory: "Capital Expenditure",     status: "Posted" },
  { id: "tx5",  ref: "BAS-2026-04-1006", date: "2026-05-05", description: "Infrastructure grant drawdown — child care facility",        amount: 12_000_000, project: "CP-2026-001",      function: "Child Care & Protection",   funding: "Infrastructure Grant", item: "Grant Receipt",              costing: "Direct",   region: "w5", itemCategory: "Capital Revenue",         status: "Posted" },
  { id: "tx6",  ref: "BAS-2026-04-1007", date: "2026-05-04", description: "PMDS training workshop — performance management (HOD)",      amount:    -98_000, project: "HR-2026-001",      function: "Corporate Services",        funding: "Equitable Share",      item: "Goods & Services",           costing: "Indirect", region: "w1", itemCategory: "Operational Expenditure", status: "Posted" },
  { id: "tx7",  ref: "BAS-2026-04-1008", date: "2026-05-03", description: "Social work vehicle fleet maintenance",                      amount:   -620_000, project: "WELFARE-2026-002", function: "Social Welfare Services",   funding: "Equitable Share",      item: "Goods & Services",           costing: "Direct",   region: "",   itemCategory: "Operational Expenditure", status: "Posted" },
  { id: "tx8",  ref: "BAS-2026-04-1009", date: "2026-05-02", description: "Catering — stakeholder engagement session (Johannesburg)",         amount:    -22_400, project: "CD-2026-001",      function: "Community Development",     funding: "Equitable Share",      item: "Goods & Services",           costing: "Indirect", region: "w2", itemCategory: "Operational Expenditure", status: "Flagged" },
  { id: "tx9",  ref: "BAS-2026-04-1010", date: "2026-05-01", description: "EPWP stipends — community care workers (Tshwane)",            amount: -1_440_000, project: "CD-2026-001",      function: "Community Development",     funding: "EPWP Grant",           item: "Transfers & Subsidies",      costing: "Direct",   region: "w3", itemCategory: "Transfer Payments",       status: "Posted" },
  { id: "tx10", ref: "BAS-2026-04-1011", date: "2026-04-30", description: "Internal audit fees — Q4",                                   amount:   -210_000, project: "FIN-2026-001",     function: "Finance & Admin",           funding: "Equitable Share",      item: "Professional Services",      costing: "Indirect", region: "",   itemCategory: "Operational Expenditure", status: "Posted" },
];

export const MSCOA_SEGMENT_KEYS = ["project", "function", "funding", "item", "costing", "region", "itemCategory"];

// ─── Capital / Infrastructure Projects ───────────────────────────────────────
export const CAPITAL_PROJECTS = [
  { id: "CP-2026-001",     name: "West Rand Child Care Facility (Phase 1)",              funder: "Infrastructure Grant", budget: 24_000_000, spent: 9_600_000, ward: "w5", status: "On track" },
  { id: "SA-CAP-2026-001", name: "Johannesburg Substance Abuse Treatment Centre",               funder: "Infrastructure Grant", budget: 38_000_000, spent: 4_200_000, ward: "w2", status: "Behind" },
  { id: "ECD-CAP-2026-001",name: "Tshwane ECD Hub (multi-purpose centre)",                funder: "Equitable Share",      budget: 12_500_000, spent: 1_800_000, ward: "w3", status: "On track" },
  { id: "WEL-CAP-2026-001",name: "Sedibeng Social Work Regional Office Upgrade",         funder: "Own Funds",            budget:  8_200_000, spent: 6_100_000, ward: "w4", status: "On track" },
  { id: "CD-CAP-2026-001", name: "Ekurhuleni Community Development Resource Centre",       funder: "Infrastructure Grant", budget: 15_800_000, spent:   820_000, ward: "w1", status: "Behind" },
];

// ─── IPMS — Section 38/45 performance agreements ─────────────────────────────
export const PERFORMANCE_AGREEMENTS = [
  { id: "pa1",    employee: "Dr. Ntsiki Sithebe", employeeId: "u_hod",          position: "Head of Department",                      department: "office_hod", section: "Section 38",    signed: true,  signedDate: "2026-08-20", weight: { kpi1: 25, kpi2: 25, kpi3: 25, kpi4: 25 }, midYearScore: 3.3,  annualScore: null, moderation: "Pending Q4" },
  { id: "pa2",    employee: "Tshepo Mokoena",     employeeId: "u_cfo",          position: "Chief Director: Finance & SCM",            department: "finance",    section: "Section 38",    signed: true,  signedDate: "2026-08-22", weight: { kpi1: 30, kpi2: 30, kpi3: 20, kpi4: 20 }, midYearScore: 2.8,  annualScore: null, moderation: "Pending Q4" },
  { id: "pa3",    employee: "S Makhuvele",        employeeId: "u_welfare_dir",  position: "Chief Director: Social Welfare",           department: "welfare",    section: "Section 38",    signed: true,  signedDate: "2026-08-23", weight: { kpi1: 35, kpi2: 25, kpi3: 20, kpi4: 20 }, midYearScore: 3.5,  annualScore: null, moderation: "Pending Q4" },
  { id: "pa4",    employee: "N Sithole",          employeeId: "u_child_dir",    position: "Chief Director: Children & Families",      department: "children",   section: "Section 38",    signed: false, signedDate: null,         weight: { kpi1: 35, kpi2: 30, kpi3: 20, kpi4: 15 }, midYearScore: null, annualScore: null, moderation: "—" },
  { id: "pa5",    employee: "M Chauke",           employeeId: "u_comm_dir",     position: "Chief Director: Community Development",    department: "comm_dev",   section: "Section 38",    signed: true,  signedDate: "2026-08-24", weight: { kpi1: 30, kpi2: 25, kpi3: 25, kpi4: 20 }, midYearScore: 3.2,  annualScore: null, moderation: "Pending Q4" },
  { id: "pa6",    employee: "P Nkuna",            employeeId: "u_substance_dir",position: "Chief Director: Substance Abuse",          department: "substance",  section: "Section 38",    signed: true,  signedDate: "2026-08-25", weight: { kpi1: 30, kpi2: 30, kpi3: 20, kpi4: 20 }, midYearScore: 2.5,  annualScore: null, moderation: "Capped — KPA1 < 60%" },
  { id: "pa7",    employee: "Mapula Mashishi",    employeeId: "u_distdir",      position: "District Director: Johannesburg",                department: "welfare",    section: "Section 45",    signed: true,  signedDate: "2026-09-10", weight: { kpi1: 40, kpi2: 25, kpi3: 20, kpi4: 15 }, midYearScore: 3.0,  annualScore: null, moderation: "Pending Q4" },
  { id: "pa8",    employee: "K Mokoena",          employeeId: "e_008",          position: "Director: ECD Registration & Compliance", department: "children",   section: "Section 45",    signed: true,  signedDate: "2026-09-08", weight: { kpi1: 35, kpi2: 30, kpi3: 20, kpi4: 15 }, midYearScore: 3.4,  annualScore: null, moderation: "Pending Q4" },
  { id: "pa9",    employee: "L Mathebula",        employeeId: "e_009",          position: "Director: NPO Compliance",                 department: "comm_dev",   section: "Section 45",    signed: true,  signedDate: "2026-09-09", weight: { kpi1: 35, kpi2: 25, kpi3: 25, kpi4: 15 }, midYearScore: 3.1,  annualScore: null, moderation: "Pending Q4" },
  { id: "pa10",   employee: "R Mabunda",          employeeId: "e_010",          position: "Director: Child Protection Services",      department: "children",   section: "Section 45",    signed: false, signedDate: null,         weight: { kpi1: 35, kpi2: 25, kpi3: 25, kpi4: 15 }, midYearScore: null, annualScore: null, moderation: "—" },
  { id: "pa_sw",  employee: "Thandiwe Nkosi",     employeeId: "u_sw",           position: "Senior Social Worker",                     department: "welfare",    section: "Operational",   signed: true,  signedDate: "2026-07-01", weight: { kpi1: 40, kpi2: 25, kpi3: 20, kpi4: 15 }, midYearScore: 3.4,  annualScore: null, moderation: "Pending Q4" },
];

// Individual KPIs per agreement (drawer + social worker scorecard).
export const INDIVIDUAL_KPIS = {
  // HOD
  pa1: [
    { id: "k1", label: "APP targets on track (% of indicators met YTD)",         weight: 25, target: "80%",           actual: "62%",             rating: 3, evidence: 8 },
    { id: "k2", label: "AGSA audit findings cleared from prior year",             weight: 25, target: "28 findings",   actual: "4 cleared",       rating: 2, evidence: 4 },
    { id: "k3", label: "Section 38/45 PAs signed by 31 Aug",                     weight: 25, target: "100%",          actual: "85%",             rating: 3, evidence: 9 },
    { id: "k4", label: "Social worker vacancy rate (target ≤ 20%)",               weight: 25, target: "≤ 20%",         actual: "38%",             rating: 2, evidence: 5 },
  ],
  // CFO
  pa2: [
    { id: "k1", label: "Budget spent within approved estimates",                  weight: 30, target: "98%",           actual: "87%",             rating: 3, evidence: 6 },
    { id: "k2", label: "SCM procurement plan adherence",                          weight: 30, target: "90%",           actual: "72%",             rating: 2, evidence: 5 },
    { id: "k3", label: "AGSA audit findings cleared",                             weight: 20, target: "28 findings",   actual: "4 cleared",       rating: 2, evidence: 3 },
    { id: "k4", label: "Financial statements submitted on time (PFMA s.40)",      weight: 20, target: "31 Aug 2026",   actual: "Pending",         rating: 3, evidence: 2 },
  ],
  // District Director (Mapula)
  pa7: [
    { id: "k1", label: "Welfare beneficiaries reached in Johannesburg district",        weight: 40, target: "18,000",        actual: "14,200",          rating: 3, evidence: 7 },
    { id: "k2", label: "Social work assessments completed within 30 days",        weight: 25, target: "75%",           actual: "61%",             rating: 3, evidence: 5 },
    { id: "k3", label: "ECD centre inspections completed",                        weight: 20, target: "48",            actual: "31",              rating: 3, evidence: 4 },
    { id: "k4", label: "Child protection response rate within 24 hours",          weight: 15, target: "80%",           actual: "44%",             rating: 2, evidence: 3 },
  ],
  // Senior Social Worker (Thandiwe) — bottom of the cascade
  pa_sw: [
    { id: "k1", label: "Active caseload managed within cap (≤ 35 cases)",         weight: 35, target: "≤ 35 cases",    actual: "38 cases",        rating: 3, evidence: 8 },
    { id: "k2", label: "Assessment reports submitted on time",                    weight: 25, target: "100%",          actual: "91%",             rating: 4, evidence: 9 },
    { id: "k3", label: "Child protection visits completed",                       weight: 20, target: "12 / month",    actual: "10 / month",      rating: 3, evidence: 6 },
    { id: "k4", label: "Family reunification cases closed",                       weight: 10, target: "4 / quarter",   actual: "3 / quarter",     rating: 3, evidence: 2 },
    { id: "k5", label: "POE compliance (case file documentation)",                weight: 10, target: "100%",          actual: "100%",            rating: 5, evidence: 16 },
  ],
};

// ─── POE — Portfolio of Evidence documents ────────────────────────────────────
export const POE_DOCUMENTS = [
  { id: "poe1",  kpiCode: "APP-T-003 / Q3", title: "ECD centre registration certificates — Johannesburg batch 2 (47 centres)",       uploaded: "2026-04-10", uploader: "u_child_dir",     size: "5.8 MB",  sha: "0x7a9c…3f1e", verified: true,  verifiedBy: "u_audit", source: "Web upload" },
  { id: "poe2",  kpiCode: "APP-T-001 / Q3", title: "Social welfare service registers — Tshwane district Q3",                     uploaded: "2026-04-08", uploader: "u_welfare_dir",   size: "3.2 MB",  sha: "0xc12d…8b04", verified: true,  verifiedBy: "u_audit", source: "Web upload" },
  { id: "poe3",  kpiCode: "APP-T-004 / Q3", title: "Child protection case response logs — March 2026",                          uploaded: "2026-04-05", uploader: "u_child_dir",     size: "2.1 MB",  sha: "0x3e7f…91a2", verified: true,  verifiedBy: "u_audit", source: "Mobile upload" },
  { id: "poe4",  kpiCode: "APP-T-006 / Q3", title: "NPO compliance inspection reports — Q3 (38 NPOs)",                          uploaded: "2026-03-28", uploader: "u_comm_dir",      size: "8.4 MB",  sha: "0xa1b2…ee07", verified: false, verifiedBy: null,      source: "Web upload" },
  { id: "poe5",  kpiCode: "APP-T-008 / Q3", title: "Section 38/45 signed performance agreements (8 officials)",                 uploaded: "2026-08-25", uploader: "u_hod",           size: "4.1 MB",  sha: "0x9f4d…220b", verified: true,  verifiedBy: "u_audit", source: "Web upload" },
  { id: "poe6",  kpiCode: "APP-T-005 / Q3", title: "Community development forum meeting minutes — 3 districts",                 uploaded: "2026-04-02", uploader: "u_comm_dir",      size: "1.8 MB",  sha: "0x6c81…44d3", verified: true,  verifiedBy: "u_audit", source: "Mobile upload" },
  { id: "poe7",  kpiCode: "APP-T-007 / Q3", title: "Audit action plan progress report — March 2026",                            uploaded: "2026-04-14", uploader: "u_cfo",           size: "2.9 MB",  sha: "0xb74e…1a90", verified: false, verifiedBy: null,      source: "Web upload" },
  { id: "poe8",  kpiCode: "APP-T-002 / Q3", title: "Social work assessment turnaround report — Q3",                             uploaded: "2026-03-26", uploader: "u_welfare_dir",   size: "4.5 MB",  sha: "0xd29a…77fc", verified: true,  verifiedBy: "u_audit", source: "Mobile upload" },
  { id: "poe9",  kpiCode: "APP-T-010 / Q3", title: "SASSA referral register — March 2026 (1,840 referrals)",                    uploaded: "2026-04-09", uploader: "u_distdir",       size: "1.2 MB",  sha: "0x4a87…3219", verified: true,  verifiedBy: "u_audit", source: "Web upload" },
  { id: "poe10", kpiCode: "APP-T-009 / Q3", title: "Treatment centre occupancy report — Sedibeng Q3",                          uploaded: "2026-04-11", uploader: "u_substance_dir", size: "2.3 MB",  sha: "0xff2c…8b41", verified: true,  verifiedBy: "u_audit", source: "Web upload" },
];

// ─── Compliance Calendar (PFMA / Children's Act / DPSA) ──────────────────────
export const COMPLIANCE_DEADLINES = [
  { id: "c1",  legalRef: "PFMA s.40(1)(c)",    deadline: "2026-05-31", title: "Interim financial statements submitted to Provincial Treasury",         owner: "u_cfo",         status: "Pending" },
  { id: "c2",  legalRef: "PFMA s.27(2)",        deadline: "2026-07-31", title: "Annual Performance Plan FY 2027/28 submitted to Legislature",           owner: "u_hod",         status: "Pending" },
  { id: "c3",  legalRef: "DPSA Circular 4/23",  deadline: "2026-08-31", title: "Section 38/45 performance agreements signed (all senior managers)",     owner: "u_hod",         status: "At risk" },
  { id: "c4",  legalRef: "PFMA s.40(1)(b)",     deadline: "2026-08-31", title: "Annual Financial Statements submitted to AGSA",                         owner: "u_cfo",         status: "Pending" },
  { id: "c5",  legalRef: "PFMA s.65(1)(b)",     deadline: "2027-01-31", title: "Annual Report 2025/26 tabled to Legislature",                           owner: "u_hod",         status: "Pending" },
  { id: "c6",  legalRef: "Treasury Reg 18.3",   deadline: "2027-01-31", title: "Mid-year budget and expenditure review (Q3 APP assessment)",            owner: "u_cfo",         status: "Pending" },
  { id: "c7",  legalRef: "PFMA s.5",            deadline: "2027-03-31", title: "Strategic Plan 2025–2030 tabled to Legislature (annual review)",        owner: "u_hod",         status: "Pending" },
  { id: "c8",  legalRef: "PFMA s.27(4)",        deadline: "2027-03-31", title: "Adjusted Estimates of National Expenditure (AENE) submission",          owner: "u_cfo",         status: "Pending" },
  { id: "c9",  legalRef: "PFMA s.76(4)(e)",     deadline: "2026-05-15", title: "Audit Committee quarterly meeting (Q3 review)",                         owner: "u_audit",       status: "Pending" },
  { id: "c10", legalRef: "Children's Act s.98", deadline: "2026-06-30", title: "ECD registration audit report submitted to Head of Department",         owner: "u_child_dir",   status: "Pending" },
];

// ─── Activity log (recent platform events) ────────────────────────────────────
export const ACTIVITY = [
  { id: 1,  userId: "system",        action: "Compliance alert",  target: "KPA2 Child Protection response rate < 60% — performance review required",       time: "Today 11:55",     severity: "warning" },
  { id: 2,  userId: "u_audit",       action: "Audit flag",        target: "3 APP targets missing supporting POE in performance portfolio",                    time: "Yesterday 16:20", severity: "warning" },
  { id: 3,  userId: "u_sw",          action: "Uploaded POE",      target: "Social work assessment report — April 2026 (Thandiwe Nkosi)",                     time: "Today 09:48" },
  { id: 4,  userId: "u_child_dir",   action: "Uploaded POE",      target: "ECD registration certificates — Johannesburg batch 2",                                  time: "Today 09:14" },
  { id: 5,  userId: "u_cfo",         action: "Posted BAS entry",  target: "BAS-2026-04-1002 (R6.84m employee compensation, Equitable Share)",                time: "Today 09:02" },
  { id: 6,  userId: "u_audit",       action: "Verified POE",      target: "Community development forum minutes — 3 districts",                               time: "Yesterday 15:48" },
  { id: 7,  userId: "u_distdir",     action: "Verified POE",      target: "Thandiwe Nkosi · SASSA referral register — March 2026",                          time: "Yesterday 14:10" },
  { id: 8,  userId: "u_hod",         action: "Updated APP target", target: "APP-T-008 PA signing progress 80% → 85%",                                       time: "Yesterday 11:20" },
  { id: 9,  userId: "system",        action: "Compliance alert",  target: "T-30: Section 38/45 PA signing deadline 2026-08-31",                              time: "May 8 06:00",     severity: "info" },
  { id: 10, userId: "u_cfo",         action: "Flagged transaction",target: "BAS-2026-04-1009 — catering expenditure requires further motivation",             time: "May 7 14:00" },
  { id: 11, userId: "u_welfare_dir", action: "Signed PA",         target: "S Makhuvele · Section 38 Performance Agreement",                                  time: "May 6 09:30" },
  { id: 12, userId: "u_audit",       action: "Updated risk",      target: "R-04 Child protection response — escalation protocol revised",                    time: "May 5 16:00" },
];

// ─── Productivity Management (§3.3) — service catalogue & work items ─────────
export const WORK_CATALOGUE = [
  { id: "wt_case",      label: "Social Work Case",             slaTarget: 5,  kpaId: "kpa1" },
  { id: "wt_compliance",label: "Compliance Review",            slaTarget: 3,  kpaId: "kpa5" },
  { id: "wt_capital",   label: "Capital Project Update",       slaTarget: 7,  kpaId: "kpa1" },
  { id: "wt_childprot", label: "Child Protection",             slaTarget: 1,  kpaId: "kpa2" },
  { id: "wt_poe",       label: "POE Submission",               slaTarget: 2,  kpaId: "kpa5" },
  { id: "wt_npo",       label: "NPO Compliance Inspection",    slaTarget: 5,  kpaId: "kpa3" },
  { id: "wt_hr",        label: "HR Recruitment Action",        slaTarget: 14, kpaId: "kpa5" },
  { id: "wt_audit",     label: "Audit Finding Response",       slaTarget: 10, kpaId: "kpa5" },
  { id: "wt_ecd",       label: "ECD Registration",             slaTarget: 7,  kpaId: "kpa2" },
  { id: "wt_report",    label: "Quarterly Report Submission",  slaTarget: 5,  kpaId: "kpa5" },
];

export const WORK_ITEMS = [
  { id: "wi1",  type: "wt_case",       title: "Active caseload review — above 35-case cap (Johannesburg)",             assignee: "u_sw",          department: "welfare",    priority: "High",   status: "In Progress", dueDate: "2026-05-20", createdDate: "2026-05-10", createdBy: "u_distdir",      slaTarget: 5,  actualDays: null, kpiRef: "APP-T-002", notes: "Senior social worker at 38 active cases — exceeds the 35-case workload cap." },
  { id: "wi2",  type: "wt_childprot",  title: "Child protection alert — unvisited case, Johannesburg (24h SLA)",       assignee: "u_sw",          department: "welfare",    priority: "High",   status: "Open",        dueDate: "2026-05-12", createdDate: "2026-05-10", createdBy: "u_distdir",      slaTarget: 1,  actualDays: null, kpiRef: "APP-T-004", notes: "24-hour SLA — escalates to district director if not actioned." },
  { id: "wi3",  type: "wt_poe",        title: "Upload Q3 assessment report POE for AGSA readiness",              assignee: "u_sw",          department: "welfare",    priority: "Medium", status: "Closed",      dueDate: "2026-04-15", createdDate: "2026-04-10", createdBy: "u_distdir",      slaTarget: 2,  actualDays: 3,    kpiRef: "APP-T-007", notes: "Completed ahead of audit visit." },
  { id: "wi4",  type: "wt_compliance", title: "Section 38 PA unsigned — N Sithole (Children & Families)",        assignee: "u_hod",         department: "office_hod", priority: "High",   status: "Open",        dueDate: "2026-08-31", createdDate: "2026-05-09", createdBy: "u_hod",          slaTarget: 3,  actualDays: null, kpiRef: "APP-T-008", notes: "Chief Director: Children & Families PA not yet signed — escalated to HOD." },
  { id: "wi5",  type: "wt_compliance", title: "Section 45 PA unsigned — R Mabunda (Child Protection Services)",  assignee: "u_child_dir",   department: "children",   priority: "High",   status: "Open",        dueDate: "2026-08-31", createdDate: "2026-05-09", createdBy: "u_hod",          slaTarget: 3,  actualDays: null, kpiRef: "APP-T-008", notes: "Director: Child Protection Services PA not yet signed." },
  { id: "wi6",  type: "wt_capital",    title: "Progress update — West Rand Child Care Facility (Phase 1)",      assignee: "u_child_dir",   department: "children",   priority: "High",   status: "In Progress", dueDate: "2026-05-31", createdDate: "2026-05-01", createdBy: "u_hod",          slaTarget: 7,  actualDays: null, kpiRef: "APP-T-004", notes: "Capital project behind schedule — contractor delays on structural works." },
  { id: "wi7",  type: "wt_audit",      title: "Clear AGSA audit findings — prior year (28 outstanding)",         assignee: "u_cfo",         department: "finance",    priority: "High",   status: "In Progress", dueDate: "2026-06-30", createdDate: "2026-05-02", createdBy: "u_audit",        slaTarget: 10, actualDays: null, kpiRef: "APP-T-007", notes: "4 of 28 findings cleared YTD. AGSA follow-up visit scheduled for August." },
  { id: "wi8",  type: "wt_ecd",        title: "ECD batch 3 registration — Johannesburg (45 centres outstanding)",      assignee: "u_child_dir",   department: "children",   priority: "Medium", status: "Open",        dueDate: "2026-06-15", createdDate: "2026-05-05", createdBy: "u_child_dir",    slaTarget: 7,  actualDays: null, kpiRef: "APP-T-003", notes: "Applications received — site inspections to be scheduled." },
  { id: "wi9",  type: "wt_npo",        title: "NPO compliance inspection — Ekurhuleni cluster (12 NPOs)",         assignee: "u_comm_dir",    department: "comm_dev",   priority: "Medium", status: "Pending",     dueDate: "2026-05-15", createdDate: "2026-05-09", createdBy: "system",         slaTarget: 5,  actualDays: null, kpiRef: "APP-T-006", notes: "Awaiting transport allocation before field visits can proceed." },
  { id: "wi10", type: "wt_case",       title: "Social welfare outreach — West Rand rural households",           assignee: "u_welfare_dir", department: "welfare",    priority: "High",   status: "Closed",      dueDate: "2026-05-02", createdDate: "2026-05-01", createdBy: "system",         slaTarget: 5,  actualDays: 1,    kpiRef: "APP-T-001", notes: "Completed within SLA. 142 households reached." },
  { id: "wi11", type: "wt_report",     title: "Q3 APP performance report — CFO finance section",                 assignee: "u_cfo",         department: "finance",    priority: "Medium", status: "Closed",      dueDate: "2026-04-30", createdDate: "2026-04-20", createdBy: "u_hod",          slaTarget: 5,  actualDays: 4,    kpiRef: "APP-T-007", notes: "Submitted on time — incorporated into HOD report." },
  { id: "wi12", type: "wt_hr",         title: "Shortlist candidates — 5 social worker vacancies (Tshwane)",       assignee: "u_welfare_dir", department: "welfare",    priority: "Medium", status: "In Progress", dueDate: "2026-05-28", createdDate: "2026-05-05", createdBy: "u_hod",          slaTarget: 14, actualDays: null, kpiRef: null,       notes: "Vacancy rate at 38%. Advert closed 2 May — shortlisting in progress." },
  { id: "wi13", type: "wt_compliance", title: "BAS journal BAS-1009 — catering motivation required",             assignee: "u_cfo",         department: "finance",    priority: "Low",    status: "Pending",     dueDate: "2026-05-17", createdDate: "2026-05-07", createdBy: "u_cfo",          slaTarget: 3,  actualDays: null, kpiRef: null,       notes: "Flagged expenditure — awaiting programme director motivation letter." },
  { id: "wi14", type: "wt_poe",        title: "Upload community dev forum minutes — Sedibeng & Tshwane",         assignee: "u_comm_dir",    department: "comm_dev",   priority: "Medium", status: "Open",        dueDate: "2026-05-19", createdDate: "2026-05-10", createdBy: "u_hod",          slaTarget: 2,  actualDays: null, kpiRef: "APP-T-005", notes: "Q3 APP cycle — outstanding forum minutes for 2 districts." },
  { id: "wi15", type: "wt_audit",      title: "Audit committee prep pack — Q3 review (PFMA s.76)",               assignee: "u_audit",       department: "office_hod", priority: "High",   status: "Closed",      dueDate: "2026-05-14", createdDate: "2026-05-08", createdBy: "u_audit",        slaTarget: 10, actualDays: 6,    kpiRef: null,       notes: "Completed before deadline. Presented to committee on 14 May." },
];
