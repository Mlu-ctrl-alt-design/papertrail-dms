// Ba-Phalaborwa Local Municipality (LIM334) seed data.
// Grounded in publicly available IDP/SDBIP context: 19 wards, ~412 employees,
// the standard 5 KPAs for South African local government, and 7-segment mSCOA.
// All numbers/IDs are illustrative.

// ─── Municipality master ──────────────────────────────────────────────────────
export const MUNICIPALITY = {
  code: "LIM334",
  name: "Ba-Phalaborwa Local Municipality",
  district: "Mopani District",
  province: "Limpopo",
  category: "B",
  wards: 19,
  staffEstablishment: 412,
  fiscalYear: "2026/27",
  outstandingConsumerDebt: 487_000_000,
  branding: { primary: "#219CD6", accent: "#1D4FD7", motto: "United, working together for service excellence" },
};

// ─── Users / personae ─────────────────────────────────────────────────────────
// The six demo personas are flagged `demo: true` and exposed in the TopBar
// persona switcher. Each has a `nav` allowlist for row-level access (Mayor
// can't see IPMS; Clerk only sees own scorecard; Auditor is read-only, etc.)
// and a `level` so the cascade view can render them in correct hierarchy.
export const USERS = [
  // Demo personas (selectable via switcher)
  { id: "u_mayor", demo: true,  name: "Cllr Merriam Malatji", initials: "MM", role: "Executive Mayor",         color: "#a4262c", department: "office_mm",  level: 1, nav: ["dashboard", "idp", "risk", "sdbip", "audit"] },
  { id: "u_mm",    demo: true,  name: "Yvonne Buys",          initials: "YB", role: "Municipal Manager",       color: "#219CD6", department: "office_mm",  level: 2, nav: ["dashboard", "idp", "risk", "sdbip", "ipms", "poe", "audit"] },
  { id: "u_cfo",   demo: true,  name: "A Nzimande",           initials: "AN", role: "Chief Financial Officer", color: "#107c10", department: "finance",    level: 3, nav: ["dashboard", "idp", "risk", "sdbip", "ipms", "poe"] },
  { id: "u_revmgr",demo: true,  name: "Tshepiso Mathebula",   initials: "TM", role: "Revenue Manager",         color: "#8764b8", department: "finance",    level: 4, nav: ["dashboard", "ipms", "poe"] },
  { id: "u_clerk", demo: true,  name: "Lebogang Mokoena",     initials: "LM", role: "Debt Collection Clerk",   color: "#1D4FD7", department: "finance",    level: 5, nav: ["dashboard", "ipms"] },
  { id: "u_audit", demo: true,  name: "Refilwe Sithole",      initials: "RS", role: "Internal Auditor",        color: "#605e5c", department: "office_mm",  level: 0, nav: ["dashboard", "poe", "audit"], readOnly: true },

  // Other staff referenced as data only (not selectable as a persona)
  { id: "u_corp",  name: "T Mokoena",       initials: "TM", role: "Director: Corporate Services", color: "#c8a116", department: "corp" },
  { id: "u_tech",  name: "P Mathebula",     initials: "PM", role: "Director: Technical Services", color: "#005a9e", department: "tech" },
  { id: "u_comm",  name: "L Mabunda",       initials: "LM", role: "Director: Community Services", color: "#7a5700", department: "comm" },
];

export const DEMO_PERSONAS = USERS.filter((u) => u.demo);

export const userById = (id) => USERS.find((u) => u.id === id) || { name: "Unknown", initials: "??", color: "#a19f9d", role: "" };

// Default landing persona: Mayor (the demo opens here per the script).
export const CURRENT_USER = USERS.find((u) => u.id === "u_mayor");

// ─── Departments / KPAs / Wards ───────────────────────────────────────────────
export const DEPARTMENTS = [
  { id: "office_mm",  label: "Office of the Municipal Manager" },
  { id: "corp",       label: "Corporate Services" },
  { id: "finance",    label: "Budget & Treasury" },
  { id: "tech",       label: "Technical Services" },
  { id: "comm",       label: "Community Services" },
  { id: "ldp",        label: "Local Economic Development & Planning" },
];

// Standard SA local government KPAs (Key Performance Areas).
// Treasury-prescribed — locked at the tenant level. Mutating these would cause
// National Treasury portal ledger uploads to be rejected (Munsoft 7.3.2 rule).
export const KPAS = [
  { id: "kpa1", code: "KPA 1", label: "Basic Service Delivery & Infrastructure Development", color: "#219CD6", locked: true },
  { id: "kpa2", code: "KPA 2", label: "Local Economic Development",                          color: "#107c10", locked: true },
  { id: "kpa3", code: "KPA 3", label: "Municipal Financial Viability & Management",          color: "#1D4FD7", locked: true },
  { id: "kpa4", code: "KPA 4", label: "Municipal Transformation & Institutional Development",color: "#8764b8", locked: true },
  { id: "kpa5", code: "KPA 5", label: "Good Governance & Public Participation",              color: "#c8a116", locked: true },
];

// 14 National Treasury Service Delivery Outcomes (MTSF / NDP).
// Treasury-prescribed — locked.
export const SERVICE_DELIVERY_OUTCOMES = [
  { id: "sdo1",  code: "Outcome 1",  label: "Quality basic education",                                                          locked: true },
  { id: "sdo2",  code: "Outcome 2",  label: "A long and healthy life for all South Africans",                                  locked: true },
  { id: "sdo3",  code: "Outcome 3",  label: "All people in South Africa are and feel safe",                                    locked: true },
  { id: "sdo4",  code: "Outcome 4",  label: "Decent employment through inclusive economic growth",                             locked: true },
  { id: "sdo5",  code: "Outcome 5",  label: "A skilled and capable workforce to support an inclusive growth path",             locked: true },
  { id: "sdo6",  code: "Outcome 6",  label: "An efficient, competitive and responsive economic infrastructure network",        locked: true },
  { id: "sdo7",  code: "Outcome 7",  label: "Vibrant, equitable and sustainable rural communities",                            locked: true },
  { id: "sdo8",  code: "Outcome 8",  label: "Sustainable human settlements and improved quality of household life",            locked: true },
  { id: "sdo9",  code: "Outcome 9",  label: "A responsive, accountable, effective and efficient local government system",      locked: true },
  { id: "sdo10", code: "Outcome 10", label: "Environmental assets and natural resources that are well protected",              locked: true },
  { id: "sdo11", code: "Outcome 11", label: "Create a better South Africa, contribute to a better Africa and a better world",  locked: true },
  { id: "sdo12", code: "Outcome 12", label: "An efficient, effective and development-oriented public service",                 locked: true },
  { id: "sdo13", code: "Outcome 13", label: "An inclusive and responsive social protection system",                            locked: true },
  { id: "sdo14", code: "Outcome 14", label: "Transforming society and uniting the country",                                    locked: true },
];

// 4 Integrated Urban Development Framework strategic priorities (NDP).
// Treasury-prescribed — locked.
export const IUDF_OUTCOMES = [
  { id: "iudf1", code: "IUDF 1", label: "Spatial Integration",        locked: true },
  { id: "iudf2", code: "IUDF 2", label: "Inclusion and Access",       locked: true },
  { id: "iudf3", code: "IUDF 3", label: "Inclusive Economic Growth",  locked: true },
  { id: "iudf4", code: "IUDF 4", label: "Effective Governance",       locked: true },
];

// Project categories used to constrain Master-KPI composition.
// Munsoft 7.3.2 enforces these as dynamic SDO/IUDF filters when binding
// a project to a KPI (Section 2-B of the training manual).
export const PROJECT_CATEGORIES = [
  { id: "infra",     label: "Infrastructure & Bulk Services" },
  { id: "led",       label: "Local Economic Development" },
  { id: "finance",   label: "Financial Management" },
  { id: "governance",label: "Governance & Participation" },
  { id: "social",    label: "Social & Community Services" },
];

// Whitelist of valid (SDO, IUDF) options per project category. When the user
// picks a project category on the KPI composer, only these options remain
// selectable in the SDO / IUDF dropdowns.
export const PROJECT_CATEGORY_RULES = {
  infra:      { sdo: ["sdo6", "sdo7", "sdo8", "sdo10"],         iudf: ["iudf1", "iudf2"] },
  led:        { sdo: ["sdo4", "sdo5", "sdo7", "sdo11"],         iudf: ["iudf3"] },
  finance:    { sdo: ["sdo9", "sdo12"],                          iudf: ["iudf4"] },
  governance: { sdo: ["sdo9", "sdo12", "sdo14"],                 iudf: ["iudf4"] },
  social:     { sdo: ["sdo1", "sdo2", "sdo3", "sdo13", "sdo14"], iudf: ["iudf2"] },
};

export const WARDS = Array.from({ length: 19 }, (_, i) => ({
  id: `w${i + 1}`,
  number: i + 1,
  label: `Ward ${i + 1}`,
  // Real-ish ward names representative of LIM334 settlements
  name: [
    "Phalaborwa Town", "Lulekani A", "Lulekani B", "Namakgale A", "Namakgale B",
    "Namakgale C", "Namakgale D", "Mashishimale", "Makhushane", "Selwane",
    "Maseke", "Gravelotte", "Lulekani Ext", "Phalaborwa Industrial",
    "Hans Merensky", "Majeje", "Humulani", "Benfarm", "Kurhula",
  ][i],
}));

// ─── IDP cycles ──────────────────────────────────────────────────────────────
// Each local-government term (5 years) produces one IDP. A cycle starts as
// "Draft", gets populated with SOs/POs/KPIs, and moves to "Final" once
// council approves it. Historical cycles are read-only.
export const IDP_CYCLES = [
  {
    id: "idp_2017_22",
    label: "IDP 2017–2022",
    term: "2017/18 – 2021/22",
    reviewYear: "2021/22 Final Review",
    mecRating: "Moderate",
    mecComments: "Generally compliant. Infrastructure backlogs remain a concern.",
    tabledOnCouncil: "2021-05-27",
    status: "Final",
    kpaBands: { kpa1: {min:25,max:45}, kpa2: {min:5,max:20}, kpa3: {min:10,max:25}, kpa4: {min:5,max:20}, kpa5: {min:5,max:15} },
  },
  {
    id: "idp_2022_27",
    label: "IDP 2022–2027",
    term: "2022/23 – 2026/27",
    reviewYear: "2026/27 Annual Review",
    mecRating: "High",
    mecComments: "Credible, well-aligned with NDP. Strengthen monitoring of capital project delivery.",
    tabledOnCouncil: "2025-05-29",
    status: "Final",
    kpaBands: { kpa1: {min:25,max:45}, kpa2: {min:5,max:20}, kpa3: {min:10,max:25}, kpa4: {min:5,max:20}, kpa5: {min:5,max:15} },
  },
  {
    id: "idp_2027_32",
    label: "IDP 2027–2032",
    term: "2027/28 – 2031/32",
    reviewYear: "—",
    mecRating: "—",
    mecComments: "",
    tabledOnCouncil: null,
    status: "Draft",
    kpaBands: { kpa1: {min:25,max:45}, kpa2: {min:5,max:20}, kpa3: {min:10,max:25}, kpa4: {min:5,max:20}, kpa5: {min:5,max:15} },
  },
];

// Convenience alias — views that need "the current cycle" can grab this.
export const IDP_CYCLE = IDP_CYCLES.find((c) => c.id === "idp_2022_27");

// Master Strategic-Objective catalogue. National Treasury circulates this menu;
// municipalities adopt items from it, set weights and owners, and decline
// the rest. Each entry suggests a default weight band so planners have a
// sensible starting point that respects the KPA envelopes in IDP_CYCLE.
export const SO_CATALOGUE = [
  // KPA 1 — Basic Service Delivery & Infrastructure
  { id: "so_cat_1_1", code: "SO 1.1", kpaId: "kpa1", title: "Provide reliable electricity to all formal households",                 suggestedWeight: 15, defaultOwner: "u_tech" },
  { id: "so_cat_1_2", code: "SO 1.2", kpaId: "kpa1", title: "Maintain ageing electricity infrastructure (NMD reductions)",            suggestedWeight: 10, defaultOwner: "u_tech" },
  { id: "so_cat_1_3", code: "SO 1.3", kpaId: "kpa1", title: "Improve refuse collection coverage in informal areas",                   suggestedWeight: 10, defaultOwner: "u_comm" },
  { id: "so_cat_1_4", code: "SO 1.4", kpaId: "kpa1", title: "Ensure clean drinking water reaches all households",                     suggestedWeight: 12, defaultOwner: "u_tech" },
  { id: "so_cat_1_5", code: "SO 1.5", kpaId: "kpa1", title: "Upgrade and resurface the internal municipal road network",              suggestedWeight:  8, defaultOwner: "u_tech" },
  { id: "so_cat_1_6", code: "SO 1.6", kpaId: "kpa1", title: "Provide adequate sanitation services across the municipality",           suggestedWeight:  8, defaultOwner: "u_tech" },

  // KPA 2 — Local Economic Development
  { id: "so_cat_2_1", code: "SO 2.1", kpaId: "kpa2", title: "Promote tourism around Kruger gateway",                                  suggestedWeight: 10, defaultOwner: "u_corp" },
  { id: "so_cat_2_2", code: "SO 2.2", kpaId: "kpa2", title: "Support SMME development in township and rural economies",               suggestedWeight:  6, defaultOwner: "u_corp" },
  { id: "so_cat_2_3", code: "SO 2.3", kpaId: "kpa2", title: "Facilitate agro-processing and food-security initiatives",               suggestedWeight:  5, defaultOwner: "u_corp" },
  { id: "so_cat_2_4", code: "SO 2.4", kpaId: "kpa2", title: "Develop industrial parks and special economic zones",                    suggestedWeight:  6, defaultOwner: "u_corp" },
  { id: "so_cat_2_5", code: "SO 2.5", kpaId: "kpa2", title: "Promote green-economy and renewable-energy job creation",                suggestedWeight:  5, defaultOwner: "u_corp" },

  // KPA 3 — Municipal Financial Viability & Management
  { id: "so_cat_3_1", code: "SO 3.1", kpaId: "kpa3", title: "Reduce outstanding consumer debt",                                       suggestedWeight: 12, defaultOwner: "u_cfo"  },
  { id: "so_cat_3_2", code: "SO 3.2", kpaId: "kpa3", title: "Achieve an unqualified AGSA audit opinion",                              suggestedWeight:  6, defaultOwner: "u_cfo"  },
  { id: "so_cat_3_3", code: "SO 3.3", kpaId: "kpa3", title: "Optimise revenue collection mechanisms",                                 suggestedWeight:  8, defaultOwner: "u_cfo"  },
  { id: "so_cat_3_4", code: "SO 3.4", kpaId: "kpa3", title: "Strengthen mSCOA classification compliance",                             suggestedWeight:  5, defaultOwner: "u_cfo"  },
  { id: "so_cat_3_5", code: "SO 3.5", kpaId: "kpa3", title: "Implement supply-chain management reforms",                              suggestedWeight:  5, defaultOwner: "u_cfo"  },

  // KPA 4 — Municipal Transformation & Institutional Development
  { id: "so_cat_4_1", code: "SO 4.1", kpaId: "kpa4", title: "Fill 95% of funded vacant positions",                                    suggestedWeight:  8, defaultOwner: "u_corp" },
  { id: "so_cat_4_2", code: "SO 4.2", kpaId: "kpa4", title: "Build employee skills and capacity through a training plan",             suggestedWeight:  6, defaultOwner: "u_corp" },
  { id: "so_cat_4_3", code: "SO 4.3", kpaId: "kpa4", title: "Improve employee health, wellness and safety",                           suggestedWeight:  4, defaultOwner: "u_corp" },
  { id: "so_cat_4_4", code: "SO 4.4", kpaId: "kpa4", title: "Implement a strategic workforce-planning system",                        suggestedWeight:  5, defaultOwner: "u_corp" },
  { id: "so_cat_4_5", code: "SO 4.5", kpaId: "kpa4", title: "Transform institutional culture and ethics",                             suggestedWeight:  5, defaultOwner: "u_corp" },

  // KPA 5 — Good Governance & Public Participation
  { id: "so_cat_5_1", code: "SO 5.1", kpaId: "kpa5", title: "Implement SPoMA-aligned performance management",                         suggestedWeight:  6, defaultOwner: "u_mm"   },
  { id: "so_cat_5_2", code: "SO 5.2", kpaId: "kpa5", title: "Run quarterly community imbizos in all 19 wards",                        suggestedWeight:  6, defaultOwner: "u_mm"   },
  { id: "so_cat_5_3", code: "SO 5.3", kpaId: "kpa5", title: "Strengthen council oversight committees and MPAC functioning",           suggestedWeight:  5, defaultOwner: "u_mm"   },
  { id: "so_cat_5_4", code: "SO 5.4", kpaId: "kpa5", title: "Improve responsiveness to community complaints and queries",             suggestedWeight:  4, defaultOwner: "u_mm"   },
  { id: "so_cat_5_5", code: "SO 5.5", kpaId: "kpa5", title: "Implement transparency and anti-corruption measures",                    suggestedWeight:  5, defaultOwner: "u_mm"   },
];

// `weight` is the SO's share of municipal effort/capital (% of org). The sum
// per KPA must fall inside that KPA's IDP_CYCLE.kpaBands envelope. Totals
// across all KPAs: 35 + 10 + 18 + 8 + 12 = 83%, leaving headroom for new SOs.
// `catalogueId` traces back to the master Treasury-circulated entry.
export const STRATEGIC_OBJECTIVES = [
  { id: "so1", cycleId: "idp_2022_27", catalogueId: "so_cat_1_1", code: "SO 1.1", kpaId: "kpa1", weight: 15, title: "Provide reliable electricity to all formal households", owner: "u_tech",  status: "On track",     progress: 78, target2027: "100% coverage", baseline2022: "92%", risks: ["risk1","risk2"] },
  { id: "so2", cycleId: "idp_2022_27", catalogueId: "so_cat_1_2", code: "SO 1.2", kpaId: "kpa1", weight: 10, title: "Maintain ageing electricity infrastructure (NMD reductions)", owner: "u_tech", status: "At risk",  progress: 41, target2027: "Reduce unplanned outages by 60%", baseline2022: "Baseline FY22", risks: ["risk2"] },
  { id: "so3", cycleId: "idp_2022_27", catalogueId: "so_cat_1_3", code: "SO 1.3", kpaId: "kpa1", weight: 10, title: "Improve refuse collection coverage in informal areas", owner: "u_comm",   status: "On track",     progress: 64, target2027: "85% coverage", baseline2022: "62%", risks: [] },
  { id: "so4", cycleId: "idp_2022_27", catalogueId: "so_cat_2_1", code: "SO 2.1", kpaId: "kpa2", weight: 10, title: "Promote tourism around Kruger gateway",            owner: "u_corp",   status: "On track",     progress: 55, target2027: "+2,500 jobs",     baseline2022: "Baseline study", risks: ["risk3"] },
  { id: "so5", cycleId: "idp_2022_27", catalogueId: "so_cat_3_1", code: "SO 3.1", kpaId: "kpa3", weight: 12, title: "Reduce outstanding consumer debt (R487m → R350m)", owner: "u_cfo",    status: "At risk",      progress: 28, target2027: "≤ R350m",         baseline2022: "R487m",          risks: ["risk4","risk5"] },
  { id: "so6", cycleId: "idp_2022_27", catalogueId: "so_cat_3_2", code: "SO 3.2", kpaId: "kpa3", weight:  6, title: "Achieve unqualified AGSA audit opinion",           owner: "u_cfo",    status: "Behind",       progress: 22, target2027: "Unqualified",     baseline2022: "Qualified",      risks: ["risk6"] },
  { id: "so7", cycleId: "idp_2022_27", catalogueId: "so_cat_4_1", code: "SO 4.1", kpaId: "kpa4", weight:  8, title: "Fill 95% of funded vacant positions",              owner: "u_corp",   status: "On track",     progress: 71, target2027: "≥ 95%",           baseline2022: "78%",            risks: [] },
  { id: "so8", cycleId: "idp_2022_27", catalogueId: "so_cat_5_1", code: "SO 5.1", kpaId: "kpa5", weight:  6, title: "Implement SPoMA-aligned performance management",   owner: "u_mm",     status: "On track",     progress: 60, target2027: "100% Section 56 signed", baseline2022: "Manual paper", risks: [] },
  { id: "so9", cycleId: "idp_2022_27", catalogueId: "so_cat_5_2", code: "SO 5.2", kpaId: "kpa5", weight:  6, title: "Run quarterly community imbizos in all 19 wards",  owner: "u_mm",     status: "On track",     progress: 84, target2027: "76 imbizos / yr", baseline2022: "32 / yr",       risks: [] },
  // Historical — IDP 2017–2022 (archived, read-only)
  { id: "so_h1", cycleId: "idp_2017_22", catalogueId: "so_cat_1_1", code: "SO 1.1", kpaId: "kpa1", weight: 20, title: "Electrify 5,000 households in Namakgale and Lulekani", owner: "u_tech", status: "Completed", progress: 100, target2027: "5,000 connections", baseline2022: "0", risks: [] },
  { id: "so_h2", cycleId: "idp_2017_22", catalogueId: "so_cat_3_2", code: "SO 3.1", kpaId: "kpa3", weight: 15, title: "Reduce qualified audit findings by 50%",               owner: "u_cfo",  status: "Completed", progress: 85,  target2027: "≤ 6 findings",     baseline2022: "12 findings", risks: [] },
  { id: "so_h3", cycleId: "idp_2017_22", catalogueId: "so_cat_5_2", code: "SO 5.1", kpaId: "kpa5", weight: 10, title: "Establish ward-committee imbizo programme",             owner: "u_mm",   status: "Completed", progress: 100, target2027: "32 imbizos / yr",  baseline2022: "8 / yr",      risks: [] },
];

// Master Performance-Objective catalogue. Each row decomposes a catalogue SO
// into measurable targets. Municipalities adopt these alongside the parent SO.
export const PO_CATALOGUE = [
  // KPA 1
  { id: "po_cat_1_1_1", code: "PO 1.1.1", soCatalogueId: "so_cat_1_1", kpaId: "kpa1", title: "Extend the formal electrical reticulation network to all unserved households",                  suggestedWeight: 8, defaultOwner: "u_tech" },
  { id: "po_cat_1_1_2", code: "PO 1.1.2", soCatalogueId: "so_cat_1_1", kpaId: "kpa1", title: "Audit and replace illegal connections in Namakgale and Lulekani",                              suggestedWeight: 7, defaultOwner: "u_tech" },
  { id: "po_cat_1_2_1", code: "PO 1.2.1", soCatalogueId: "so_cat_1_2", kpaId: "kpa1", title: "Refurbish the Phalaborwa 22kV substation and replace failing transformers",                    suggestedWeight: 10, defaultOwner: "u_tech" },
  { id: "po_cat_1_2_2", code: "PO 1.2.2", soCatalogueId: "so_cat_1_2", kpaId: "kpa1", title: "Roll out a planned-maintenance cycle on the medium-voltage reticulation network",              suggestedWeight: 5,  defaultOwner: "u_tech" },
  { id: "po_cat_1_3_1", code: "PO 1.3.1", soCatalogueId: "so_cat_1_3", kpaId: "kpa1", title: "Extend kerb-side refuse collection to informal settlements in Namakgale and Selwane",         suggestedWeight: 10, defaultOwner: "u_comm" },
  { id: "po_cat_1_3_2", code: "PO 1.3.2", soCatalogueId: "so_cat_1_3", kpaId: "kpa1", title: "Establish drop-off centres and recycling buy-back facilities",                                 suggestedWeight: 4,  defaultOwner: "u_comm" },
  { id: "po_cat_1_4_1", code: "PO 1.4.1", soCatalogueId: "so_cat_1_4", kpaId: "kpa1", title: "Construct bulk-water augmentation lines and storage reservoirs",                              suggestedWeight: 8,  defaultOwner: "u_tech" },
  { id: "po_cat_1_4_2", code: "PO 1.4.2", soCatalogueId: "so_cat_1_4", kpaId: "kpa1", title: "Replace ageing AC water reticulation in legacy townships",                                    suggestedWeight: 5,  defaultOwner: "u_tech" },
  { id: "po_cat_1_5_1", code: "PO 1.5.1", soCatalogueId: "so_cat_1_5", kpaId: "kpa1", title: "Resurface internal roads to a 5-year planned-maintenance standard",                           suggestedWeight: 6,  defaultOwner: "u_tech" },
  { id: "po_cat_1_5_2", code: "PO 1.5.2", soCatalogueId: "so_cat_1_5", kpaId: "kpa1", title: "Upgrade gravel roads to surfaced standard in priority wards",                                 suggestedWeight: 4,  defaultOwner: "u_tech" },
  { id: "po_cat_1_6_1", code: "PO 1.6.1", soCatalogueId: "so_cat_1_6", kpaId: "kpa1", title: "Eradicate the VIP toilet backlog in high-density informal areas",                             suggestedWeight: 6,  defaultOwner: "u_tech" },
  { id: "po_cat_1_6_2", code: "PO 1.6.2", soCatalogueId: "so_cat_1_6", kpaId: "kpa1", title: "Upgrade the wastewater treatment works to meet DWS effluent standards",                        suggestedWeight: 4,  defaultOwner: "u_tech" },

  // KPA 2
  { id: "po_cat_2_1_1", code: "PO 2.1.1", soCatalogueId: "so_cat_2_1", kpaId: "kpa2", title: "Develop a Kruger-gateway destination marketing programme with tourism SMMEs",                  suggestedWeight: 6, defaultOwner: "u_corp" },
  { id: "po_cat_2_1_2", code: "PO 2.1.2", soCatalogueId: "so_cat_2_1", kpaId: "kpa2", title: "Upgrade municipal tourism infrastructure (signage, ablutions, info centres)",                  suggestedWeight: 4, defaultOwner: "u_corp" },
  { id: "po_cat_2_2_1", code: "PO 2.2.1", soCatalogueId: "so_cat_2_2", kpaId: "kpa2", title: "Operationalise the township SMME incubation centre",                                          suggestedWeight: 4, defaultOwner: "u_corp" },
  { id: "po_cat_2_2_2", code: "PO 2.2.2", soCatalogueId: "so_cat_2_2", kpaId: "kpa2", title: "Run cooperatives-development workshops in rural wards",                                       suggestedWeight: 2, defaultOwner: "u_corp" },
  { id: "po_cat_2_3_1", code: "PO 2.3.1", soCatalogueId: "so_cat_2_3", kpaId: "kpa2", title: "Establish a milling and packaging hub for emerging farmers",                                  suggestedWeight: 4, defaultOwner: "u_corp" },
  { id: "po_cat_2_4_1", code: "PO 2.4.1", soCatalogueId: "so_cat_2_4", kpaId: "kpa2", title: "Service the Phalaborwa industrial park and conclude long-lease agreements",                   suggestedWeight: 5, defaultOwner: "u_corp" },
  { id: "po_cat_2_5_1", code: "PO 2.5.1", soCatalogueId: "so_cat_2_5", kpaId: "kpa2", title: "Procure rooftop-PV systems for municipal buildings and operationalise wheeling",              suggestedWeight: 4, defaultOwner: "u_corp" },

  // KPA 3
  { id: "po_cat_3_1_1", code: "PO 3.1.1", soCatalogueId: "so_cat_3_1", kpaId: "kpa3", title: "Roll out smart prepaid metering to high-loss zones (Namakgale + Lulekani)",                    suggestedWeight: 7, defaultOwner: "u_cfo"  },
  { id: "po_cat_3_1_2", code: "PO 3.1.2", soCatalogueId: "so_cat_3_1", kpaId: "kpa3", title: "Verify and update the indigent register on a quarterly cadence",                              suggestedWeight: 5, defaultOwner: "u_cfo"  },
  { id: "po_cat_3_2_1", code: "PO 3.2.1", soCatalogueId: "so_cat_3_2", kpaId: "kpa3", title: "Clear prior-year AGSA findings and tighten mSCOA classification at entry",                     suggestedWeight: 6, defaultOwner: "u_cfo"  },
  { id: "po_cat_3_3_1", code: "PO 3.3.1", soCatalogueId: "so_cat_3_3", kpaId: "kpa3", title: "Modernise the customer-care and billing query channels",                                       suggestedWeight: 4, defaultOwner: "u_cfo"  },
  { id: "po_cat_3_3_2", code: "PO 3.3.2", soCatalogueId: "so_cat_3_3", kpaId: "kpa3", title: "Run a debt-collection blitz against the top-50 commercial debtors",                            suggestedWeight: 4, defaultOwner: "u_cfo"  },
  { id: "po_cat_3_4_1", code: "PO 3.4.1", soCatalogueId: "so_cat_3_4", kpaId: "kpa3", title: "Implement seven-segment mSCOA validation at point of journal entry",                           suggestedWeight: 5, defaultOwner: "u_cfo"  },
  { id: "po_cat_3_5_1", code: "PO 3.5.1", soCatalogueId: "so_cat_3_5", kpaId: "kpa3", title: "Rationalise the SCM panel and shorten procurement cycle times",                                suggestedWeight: 3, defaultOwner: "u_cfo"  },

  // KPA 4
  { id: "po_cat_4_1_1", code: "PO 4.1.1", soCatalogueId: "so_cat_4_1", kpaId: "kpa4", title: "Reduce vacancy turnaround from 180 to 90 days for funded posts",                              suggestedWeight: 8, defaultOwner: "u_corp" },
  { id: "po_cat_4_2_1", code: "PO 4.2.1", soCatalogueId: "so_cat_4_2", kpaId: "kpa4", title: "Roll out a Workplace Skills Plan tied to PMDS development objectives",                         suggestedWeight: 4, defaultOwner: "u_corp" },
  { id: "po_cat_4_2_2", code: "PO 4.2.2", soCatalogueId: "so_cat_4_2", kpaId: "kpa4", title: "Sponsor accredited bursaries for scarce-skills disciplines",                                   suggestedWeight: 2, defaultOwner: "u_corp" },
  { id: "po_cat_4_3_1", code: "PO 4.3.1", soCatalogueId: "so_cat_4_3", kpaId: "kpa4", title: "Establish an Occupational Health & Safety committee at each work centre",                       suggestedWeight: 4, defaultOwner: "u_corp" },
  { id: "po_cat_4_4_1", code: "PO 4.4.1", soCatalogueId: "so_cat_4_4", kpaId: "kpa4", title: "Develop a 5-year staff-establishment forecast aligned to the IDP",                              suggestedWeight: 5, defaultOwner: "u_corp" },
  { id: "po_cat_4_5_1", code: "PO 4.5.1", soCatalogueId: "so_cat_4_5", kpaId: "kpa4", title: "Run institutional ethics campaigns and refresh the fraud-prevention plan",                    suggestedWeight: 5, defaultOwner: "u_corp" },

  // KPA 5
  { id: "po_cat_5_1_1", code: "PO 5.1.1", soCatalogueId: "so_cat_5_1", kpaId: "kpa5", title: "Implement an electronic performance management system and roll out S56/57 agreements",          suggestedWeight: 6, defaultOwner: "u_mm"   },
  { id: "po_cat_5_2_1", code: "PO 5.2.1", soCatalogueId: "so_cat_5_2", kpaId: "kpa5", title: "Run quarterly community imbizos in every ward, capture minutes and resolutions",              suggestedWeight: 6, defaultOwner: "u_mm"   },
  { id: "po_cat_5_3_1", code: "PO 5.3.1", soCatalogueId: "so_cat_5_3", kpaId: "kpa5", title: "Convene the MPAC and Audit committees in line with the council schedule",                       suggestedWeight: 5, defaultOwner: "u_mm"   },
  { id: "po_cat_5_4_1", code: "PO 5.4.1", soCatalogueId: "so_cat_5_4", kpaId: "kpa5", title: "Acknowledge and resolve community complaints within the service standard",                     suggestedWeight: 4, defaultOwner: "u_mm"   },
  { id: "po_cat_5_5_1", code: "PO 5.5.1", soCatalogueId: "so_cat_5_5", kpaId: "kpa5", title: "Tabulate executive lifestyle audits and publish the asset-disclosure register",                 suggestedWeight: 5, defaultOwner: "u_mm"   },
];

// Performance Objectives — municipal-defined. Each PO is a unique
// (KPA, SO) combination decomposed into actionable measurable targets.
// (Munsoft 7.3.2 §A: PO has KPA + SO as composite parent.)
// `weight` is the PO's share of the parent SO's allocation. The sum of PO
// weights under a single SO must not exceed the parent SO's weight; under-
// decomposition (sum < parent SO weight) raises a soft warning.
// `catalogueId` traces back to the master PO catalogue.
export const PERFORMANCE_OBJECTIVES = [
  { id: "po1", cycleId: "idp_2022_27", catalogueId: "po_cat_1_1_1", code: "PO 1.1.1", kpaId: "kpa1", soId: "so1", weight:  8, title: "Extend the formal electrical reticulation network to all unserved households",                  owner: "u_tech" },
  { id: "po2", cycleId: "idp_2022_27", catalogueId: "po_cat_1_1_2", code: "PO 1.1.2", kpaId: "kpa1", soId: "so1", weight:  7, title: "Audit and replace illegal connections in Namakgale and Lulekani",                              owner: "u_tech" },
  { id: "po3", cycleId: "idp_2022_27", catalogueId: "po_cat_1_2_1", code: "PO 1.2.1", kpaId: "kpa1", soId: "so2", weight: 10, title: "Refurbish the Phalaborwa 22kV substation and replace failing transformers",                    owner: "u_tech" },
  { id: "po4", cycleId: "idp_2022_27", catalogueId: "po_cat_1_3_1", code: "PO 1.3.1", kpaId: "kpa1", soId: "so3", weight: 10, title: "Extend kerb-side refuse collection to informal settlements in Namakgale and Selwane",         owner: "u_comm" },
  { id: "po5", cycleId: "idp_2022_27", catalogueId: "po_cat_2_1_1", code: "PO 2.1.1", kpaId: "kpa2", soId: "so4", weight: 10, title: "Develop a Kruger-gateway destination marketing programme with tourism SMMEs",                  owner: "u_corp" },
  { id: "po6", cycleId: "idp_2022_27", catalogueId: "po_cat_3_1_1", code: "PO 3.1.1", kpaId: "kpa3", soId: "so5", weight:  7, title: "Roll out smart prepaid metering to high-loss zones (Namakgale + Lulekani)",                    owner: "u_cfo"  },
  { id: "po7", cycleId: "idp_2022_27", catalogueId: "po_cat_3_1_2", code: "PO 3.1.2", kpaId: "kpa3", soId: "so5", weight:  5, title: "Verify and update the indigent register on a quarterly cadence",                              owner: "u_cfo"  },
  { id: "po8", cycleId: "idp_2022_27", catalogueId: "po_cat_3_2_1", code: "PO 3.2.1", kpaId: "kpa3", soId: "so6", weight:  6, title: "Clear prior-year AGSA findings and tighten the seven-segment mSCOA classification at entry", owner: "u_cfo"  },
  { id: "po9", cycleId: "idp_2022_27", catalogueId: "po_cat_4_1_1", code: "PO 4.1.1", kpaId: "kpa4", soId: "so7", weight:  8, title: "Reduce vacancy turnaround from 180 to 90 days for funded posts",                              owner: "u_corp" },
  { id: "po10",catalogueId: "po_cat_5_1_1", code: "PO 5.1.1", kpaId: "kpa5", soId: "so8", weight:  6, title: "Implement an electronic performance management system and roll out Section 56/57 agreements",owner: "u_mm"   },
  { id: "po11",catalogueId: "po_cat_5_2_1", code: "PO 5.2.1", kpaId: "kpa5", soId: "so9", weight:  6, title: "Run quarterly community imbizos in every ward, capture minutes and resolutions",              owner: "u_mm"   },
];

// Master KPIs — composite of (KPA + SO + PO + SDO + IUDF). This is the
// "Master IDP key" used for Treasury portal uploads (Munsoft 7.3.2 §A).
// Each row is the leaf indicator that SDBIP targets and projects bind to.
export const MASTER_KPIS = [
  { id: "kpi1", cycleId: "idp_2022_27", code: "KPI 1.1.1",  kpaId: "kpa1", soId: "so1", poId: "po1", sdoId: "sdo8",  iudfId: "iudf2", projectCategory: "infra",     fy: "2026/27",
    title: "% of formal households with grid-connected electricity",                            unit: "%",          target: 100, baseline: 92,  owner: "u_tech" },
  { id: "kpi2", cycleId: "idp_2022_27", code: "KPI 1.2.1",  kpaId: "kpa1", soId: "so2", poId: "po3", sdoId: "sdo6",  iudfId: "iudf1", projectCategory: "infra",     fy: "2026/27",
    title: "Number of substation transformers refurbished / replaced",                          unit: "units",      target: 6,   baseline: 0,   owner: "u_tech" },
  { id: "kpi3", cycleId: "idp_2022_27", code: "KPI 1.3.1",  kpaId: "kpa1", soId: "so3", poId: "po4", sdoId: "sdo10", iudfId: "iudf2", projectCategory: "infra",     fy: "2026/27",
    title: "% of informal households receiving weekly refuse collection",                       unit: "%",          target: 85,  baseline: 62,  owner: "u_comm" },
  { id: "kpi4", cycleId: "idp_2022_27", code: "KPI 2.1.1",  kpaId: "kpa2", soId: "so4", poId: "po5", sdoId: "sdo4",  iudfId: "iudf3", projectCategory: "led",       fy: "2026/27",
    title: "Net new tourism-sector jobs facilitated",                                            unit: "jobs",       target: 2500,baseline: 0,   owner: "u_corp" },
  { id: "kpi5", cycleId: "idp_2022_27", code: "KPI 3.1.1",  kpaId: "kpa3", soId: "so5", poId: "po6", sdoId: "sdo9",  iudfId: "iudf4", projectCategory: "finance",   fy: "2026/27",
    title: "Smart prepaid meters installed (Namakgale + Lulekani)",                              unit: "meters",     target: 3500,baseline: 0,   owner: "u_cfo"  },
  { id: "kpi6", cycleId: "idp_2022_27", code: "KPI 3.1.2",  kpaId: "kpa3", soId: "so5", poId: "po7", sdoId: "sdo9",  iudfId: "iudf4", projectCategory: "finance",   fy: "2026/27",
    title: "Indigent register verification — % wards covered per quarter",                       unit: "%",          target: 100, baseline: 60,  owner: "u_cfo"  },
  { id: "kpi7", cycleId: "idp_2022_27", code: "KPI 3.2.1",  kpaId: "kpa3", soId: "so6", poId: "po8", sdoId: "sdo12", iudfId: "iudf4", projectCategory: "finance",   fy: "2026/27",
    title: "AGSA findings cleared from prior year",                                              unit: "findings",   target: 35,  baseline: 0,   owner: "u_cfo"  },
  { id: "kpi8", cycleId: "idp_2022_27", code: "KPI 4.1.1",  kpaId: "kpa4", soId: "so7", poId: "po9", sdoId: "sdo12", iudfId: "iudf4", projectCategory: "governance",fy: "2026/27",
    title: "% of funded vacant posts filled within 90 days",                                     unit: "%",          target: 95,  baseline: 78,  owner: "u_corp" },
  { id: "kpi9", cycleId: "idp_2022_27", code: "KPI 5.1.1",  kpaId: "kpa5", soId: "so8", poId: "po10",sdoId: "sdo9",  iudfId: "iudf4", projectCategory: "governance",fy: "2026/27",
    title: "% of Section 56 performance agreements signed by 30 Aug",                            unit: "%",          target: 100, baseline: 0,   owner: "u_mm"   },
  { id: "kpi10", cycleId: "idp_2022_27", code: "KPI 5.2.1",  kpaId: "kpa5", soId: "so9", poId: "po11",sdoId: "sdo14", iudfId: "iudf2", projectCategory: "social",    fy: "2026/27",
    title: "Community imbizos held per ward per year",                                           unit: "imbizos",    target: 76,  baseline: 32,  owner: "u_mm"   },
];

export const STRATEGIC_RISKS = [
  { id: "risk1", code: "R-01", title: "Eskom load-shedding constrains service delivery", likelihood: 5, impact: 4, residual: "High",     owner: "u_tech",  mitigation: "Deploy backup generators at critical pump stations; explore grid-scale solar PV." },
  { id: "risk2", code: "R-02", title: "Ageing electricity reticulation network",        likelihood: 5, impact: 5, residual: "Critical", owner: "u_tech",  mitigation: "MIG-funded substation upgrade. R72m capital allocation FY26/27." },
  { id: "risk3", code: "R-03", title: "Tourism downturn affects LED targets",            likelihood: 3, impact: 3, residual: "Medium",   owner: "u_corp",  mitigation: "Diversify into agri-processing and green economy." },
  { id: "risk4", code: "R-04", title: "Indigent register not up-to-date",                likelihood: 4, impact: 4, residual: "High",     owner: "u_cfo",   mitigation: "Quarterly indigent register audit. Door-to-door verification by ward committees." },
  { id: "risk5", code: "R-05", title: "Bulk water purchases not cost-recovered",         likelihood: 5, impact: 5, residual: "Critical", owner: "u_cfo",   mitigation: "Smart metering rollout in Namakgale & Lulekani." },
  { id: "risk6", code: "R-06", title: "mSCOA classification errors in journals",         likelihood: 4, impact: 5, residual: "High",     owner: "u_cfo",   mitigation: "Mandatory 7-segment validation at point of entry. Monthly mapping review." },
  { id: "risk7", code: "R-07", title: "POE missing for individual KPIs at AGSA visit",   likelihood: 4, impact: 5, residual: "High",     owner: "u_audit", mitigation: "Mandatory monthly POE upload. SHA-256 hashing for tamper-evidence." },
];

// ─── SDBIP — quarterly targets cascade ────────────────────────────────────────
// The SDBIP is a FY-scoped selection of IDP Master KPIs. Each row links to
// a Master KPI (`kpiId`) and adds quarterly projections, ward assignments,
// and an mSCOA project binding. sd5 has no kpiId (gap: no Master KPI for
// aggregate-debt reduction yet — demonstrates the "needs a KPI" state).
export const SDBIP_TARGETS = [
  { id: "sd1", code: "SD-T-001", kpiId: "kpi1",  soId: "so1", department: "tech",    indicator: "Households connected to electricity",        unit: "households", q1: 250, q2: 250, q3: 250, q4: 250, ytd: 612, annual: 1000, mscoaProject: "EL-CAP-2026-001", wards: ["w2","w4","w5"], owner: "u_tech",  status: "On track" },
  { id: "sd2", code: "SD-T-002", kpiId: "kpi2",  soId: "so2", department: "tech",    indicator: "Substation transformers refurbished",         unit: "units",      q1: 1,   q2: 1,   q3: 2,   q4: 2,   ytd: 1,   annual: 6,    mscoaProject: "EL-CAP-2026-002", wards: ["w1","w14"],         owner: "u_tech",  status: "Behind" },
  { id: "sd3", code: "SD-T-003", kpiId: "kpi3",  soId: "so3", department: "comm",    indicator: "Households receiving weekly refuse collection",unit: "%",         q1: 65,  q2: 70,  q3: 78,  q4: 85,  ytd: 71,  annual: 85,   mscoaProject: "WS-OPEX-2026-001",wards: WARDS.map(w => w.id), owner: "u_comm",  status: "On track" },
  { id: "sd4", code: "SD-T-004", kpiId: "kpi4",  soId: "so4", department: "ldp",     indicator: "Tourism-sector jobs facilitated",             unit: "jobs",       q1: 200, q2: 250, q3: 300, q4: 400, ytd: 380, annual: 1150, mscoaProject: "LED-OPEX-2026-001",wards: ["w1","w15"],        owner: "u_corp",  status: "On track" },
  { id: "sd5", code: "SD-T-005", kpiId: null,    soId: "so5", department: "finance", indicator: "Outstanding consumer debt reduction",         unit: "R million",  q1: 487, q2: 460, q3: 430, q4: 410, ytd: 471, annual: 410,  mscoaProject: "REV-COL-2026-001",wards: WARDS.map(w => w.id), owner: "u_cfo",   status: "At risk" },
  { id: "sd6", code: "SD-T-006", kpiId: "kpi5",  soId: "so5", department: "finance", indicator: "Smart meters installed (Namakgale + Lulekani)",unit: "meters",    q1: 500, q2: 800, q3: 1000,q4: 1200,ytd: 420, annual: 3500, mscoaProject: "REV-COL-2026-002",wards: ["w2","w3","w4","w5","w6","w7"], owner: "u_cfo", status: "Behind" },
  { id: "sd7", code: "SD-T-007", kpiId: "kpi7",  soId: "so6", department: "finance", indicator: "Audit findings cleared from prior year",      unit: "findings",   q1: 5,   q2: 8,   q3: 10,  q4: 12,  ytd: 4,   annual: 35,   mscoaProject: "FIN-OPEX-2026-001",wards: [],                  owner: "u_cfo",   status: "Behind" },
  { id: "sd8", code: "SD-T-008", kpiId: "kpi8",  soId: "so7", department: "corp",    indicator: "Funded vacant posts filled within 90 days",   unit: "%",          q1: 65,  q2: 75,  q3: 85,  q4: 95,  ytd: 71,  annual: 95,   mscoaProject: "HR-OPEX-2026-001", wards: [],                  owner: "u_corp",  status: "On track" },
  { id: "sd9", code: "SD-T-009", kpiId: "kpi9",  soId: "so8", department: "office_mm", indicator: "Section 56 performance agreements signed",  unit: "%",          q1: 100, q2: 100, q3: 100, q4: 100, ytd: 90,  annual: 100,  mscoaProject: "MM-OPEX-2026-001", wards: [],                  owner: "u_mm",    status: "At risk" },
  { id: "sd10",code: "SD-T-010", kpiId: "kpi10", soId: "so9", department: "office_mm", indicator: "Community imbizos held (per ward)",         unit: "imbizos",    q1: 19,  q2: 19,  q3: 19,  q4: 19,  ytd: 16,  annual: 76,   mscoaProject: "MM-OPEX-2026-002", wards: WARDS.map(w => w.id), owner: "u_mm",   status: "On track" },
];

// ─── mSCOA — recent transactions across all 7 segments ────────────────────────
// Project · Function · Funding · Item · Costing · Region · ItemCategory
export const MSCOA_TRANSACTIONS = [
  // Demo-script highlight: LV cable for Namakgale Extension 4 — used in the
  // CFO / MM walkthroughs to illustrate seven-segment classification.
  { id: "tx0",  ref: "JV-2026-04-9824", date: "2026-05-09", description: "LV cable procurement — Namakgale Extension 4", amount: -1_800_000, project: "EL-CAP-2026-001", function: "Electricity Distribution", funding: "INEP", item: "Capital Asset",         costing: "Direct", region: "w7",  itemCategory: "Capital Expenditure",   status: "Posted" },
  { id: "tx1",  ref: "JV-2026-04-9821", date: "2026-05-08", description: "Substation transformer (Phalaborwa)",       amount: -3_240_000, project: "EL-CAP-2026-002", function: "Energy Sources",        funding: "MIG", item: "Plant & Equipment",         costing: "Direct", region: "w1",  itemCategory: "Capital Expenditure",   status: "Posted" },
  { id: "tx2",  ref: "JV-2026-04-9820", date: "2026-05-08", description: "Refuse truck fuel — Namakgale collection",  amount:    -84_120, project: "WS-OPEX-2026-001",function: "Waste Management",      funding: "Own Funds", item: "Fuel & Oil",              costing: "Direct", region: "w4",  itemCategory: "Operating Expenditure", status: "Posted" },
  { id: "tx3",  ref: "RC-2026-04-7711", date: "2026-05-07", description: "Property rates collection — Phalaborwa Town",amount:   2_405_000, project: "REV-COL-2026-001",function: "Finance & Admin",       funding: "Own Funds", item: "Rates & Taxes",           costing: "Direct", region: "w1",  itemCategory: "Operating Revenue",     status: "Posted" },
  { id: "tx4",  ref: "JV-2026-04-9818", date: "2026-05-06", description: "Smart meter procurement (1,200 units)",     amount:   -780_000, project: "REV-COL-2026-002",function: "Energy Sources",        funding: "Conditional Grant", item: "Plant & Equipment", costing: "Direct", region: "w2", itemCategory: "Capital Expenditure",   status: "Posted" },
  { id: "tx5",  ref: "JV-2026-04-9815", date: "2026-05-05", description: "MIG drawdown — substation upgrade",          amount:  10_000_000, project: "EL-CAP-2026-002", function: "Energy Sources",        funding: "MIG", item: "Conditional Grant Drawdown",costing: "Direct", region: "w1",  itemCategory: "Capital Revenue",       status: "Posted" },
  { id: "tx6",  ref: "JV-2026-04-9810", date: "2026-05-04", description: "Tourism brochure printing",                   amount:    -28_300, project: "LED-OPEX-2026-001",function: "Local Economic Devt",  funding: "Own Funds", item: "Marketing",               costing: "Indirect",region: "w1",  itemCategory: "Operating Expenditure", status: "Posted" },
  { id: "tx7",  ref: "JV-2026-04-9805", date: "2026-05-03", description: "Salaries — Technical Directorate",          amount: -2_120_000, project: "TECH-OPEX-2026-001",function: "Energy Sources",       funding: "Own Funds", item: "Employee Related Costs",  costing: "Direct", region: "",    itemCategory: "Operating Expenditure", status: "Posted" },
  { id: "tx8",  ref: "JV-2026-04-9800", date: "2026-05-02", description: "Imbizo catering — Lulekani A",               amount:    -12_400, project: "MM-OPEX-2026-002", function: "Executive & Council",   funding: "Own Funds", item: "Hospitality",             costing: "Indirect",region: "w2",  itemCategory: "Operating Expenditure", status: "Flagged" },
  { id: "tx9",  ref: "JV-2026-04-9795", date: "2026-05-01", description: "INEP grant — electrification (Mashishimale)", amount:   4_800_000, project: "EL-CAP-2026-001", function: "Energy Sources",        funding: "INEP", item: "Conditional Grant Drawdown",costing: "Direct", region: "w8",  itemCategory: "Capital Revenue",       status: "Posted" },
  { id: "tx10", ref: "JV-2026-04-9790", date: "2026-04-30", description: "Internal audit fees — Q4",                    amount:   -180_000, project: "FIN-OPEX-2026-001", function: "Finance & Admin",      funding: "Own Funds", item: "Professional Services",   costing: "Indirect",region: "",    itemCategory: "Operating Expenditure", status: "Posted" },
];

export const MSCOA_SEGMENT_KEYS = ["project", "function", "funding", "item", "costing", "region", "itemCategory"];

// ─── Capital Projects (subset of SDBIP capital works) ─────────────────────────
export const CAPITAL_PROJECTS = [
  { id: "EL-CAP-2026-001", name: "Mashishimale Electrification Phase 2", funder: "INEP",  budget: 24_000_000, spent: 9_120_000, ward: "w8",  status: "On track" },
  { id: "EL-CAP-2026-002", name: "Phalaborwa 22kV Substation Upgrade",   funder: "MIG",   budget: 72_000_000, spent: 18_440_000, ward: "w1", status: "Behind"   },
  { id: "WS-CAP-2026-001", name: "Lulekani Refuse Compactor Replacement",funder: "Own",   budget:  8_500_000, spent: 1_200_000, ward: "w2",  status: "On track" },
  { id: "RD-CAP-2026-001", name: "Selwane Internal Roads (4.2km)",       funder: "MIG",   budget: 32_500_000, spent: 21_400_000, ward: "w10",status: "On track" },
  { id: "CB-CAP-2026-001", name: "Lulekani Multi-Purpose Centre Phase 1",funder: "MIG",   budget: 14_800_000, spent:   620_000, ward: "w3",  status: "Behind"   },
];

// ─── IPMS — Section 56 performance agreements + sample staff ────────────────
// Includes Tshepiso (Revenue Manager) and Lebogang (Debt Collection Clerk)
// who are referenced in the demo cascade and clerk scorecard.
export const PERFORMANCE_AGREEMENTS = [
  { id: "pa1", employee: "Yvonne Buys",        employeeId: "u_mm",     position: "Municipal Manager",                department: "office_mm", section: "Section 56", signed: true,  signedDate: "2026-08-25", weight: { kpi1: 25, kpi2: 25, kpi3: 25, kpi4: 25 }, midYearScore: 3.4, annualScore: null,  moderation: "Pending Q4" },
  { id: "pa2", employee: "A Nzimande",         employeeId: "u_cfo",    position: "Chief Financial Officer",          department: "finance",   section: "Section 56", signed: true,  signedDate: "2026-08-28", weight: { kpi1: 30, kpi2: 30, kpi3: 20, kpi4: 20 }, midYearScore: 2.9, annualScore: null,  moderation: "Pending Q4" },
  { id: "pa3", employee: "T Mokoena",          employeeId: "u_corp",   position: "Director: Corporate Services",     department: "corp",      section: "Section 56", signed: true,  signedDate: "2026-08-29", weight: { kpi1: 25, kpi2: 25, kpi3: 25, kpi4: 25 }, midYearScore: 3.6, annualScore: null,  moderation: "Pending Q4" },
  { id: "pa4", employee: "P Mathebula",        employeeId: "u_tech",   position: "Director: Technical Services",     department: "tech",      section: "Section 56", signed: false, signedDate: null,         weight: { kpi1: 35, kpi2: 25, kpi3: 20, kpi4: 20 }, midYearScore: null, annualScore: null, moderation: "—" },
  { id: "pa5", employee: "L Mabunda",          employeeId: "u_comm",   position: "Director: Community Services",     department: "comm",      section: "Section 56", signed: true,  signedDate: "2026-08-30", weight: { kpi1: 30, kpi2: 25, kpi3: 25, kpi4: 20 }, midYearScore: 3.3, annualScore: null,  moderation: "Pending Q4" },
  { id: "pa6", employee: "M Khoza",            employeeId: "e_006",    position: "Manager: Budget Office",           department: "finance",   section: "Section 57", signed: true,  signedDate: "2026-09-15", weight: { kpi1: 30, kpi2: 30, kpi3: 20, kpi4: 20 }, midYearScore: 3.0, annualScore: null,  moderation: "Pending Q4" },
  { id: "pa7", employee: "Tshepiso Mathebula", employeeId: "u_revmgr", position: "Revenue Manager",                  department: "finance",   section: "Section 57", signed: true,  signedDate: "2026-09-12", weight: { kpi1: 40, kpi2: 25, kpi3: 20, kpi4: 15 }, midYearScore: 2.6, annualScore: null,  moderation: "Capped — KPA2 < 60%" },
  { id: "pa8", employee: "S Mathebula",        employeeId: "e_008",    position: "Manager: Electrical Engineering",  department: "tech",      section: "Section 57", signed: true,  signedDate: "2026-09-10", weight: { kpi1: 35, kpi2: 30, kpi3: 20, kpi4: 15 }, midYearScore: 2.6, annualScore: null,  moderation: "Pending Q4" },
  { id: "pa9", employee: "K Maluleke",         employeeId: "e_009",    position: "Manager: Roads & Stormwater",      department: "tech",      section: "Section 57", signed: true,  signedDate: "2026-09-11", weight: { kpi1: 35, kpi2: 30, kpi3: 20, kpi4: 15 }, midYearScore: 3.2, annualScore: null,  moderation: "Pending Q4" },
  { id: "pa10",employee: "R Manyike",          employeeId: "e_010",    position: "Manager: Waste Management",        department: "comm",      section: "Section 57", signed: false, signedDate: null,         weight: { kpi1: 35, kpi2: 25, kpi3: 25, kpi4: 15 }, midYearScore: null, annualScore: null, moderation: "—" },
  { id: "pa_clerk", employee: "Lebogang Mokoena", employeeId: "u_clerk", position: "Debt Collection Clerk",          department: "finance",   section: "Operational", signed: true, signedDate: "2026-07-04",weight: { kpi1: 35, kpi2: 25, kpi3: 20, kpi4: 20 }, midYearScore: 3.6, annualScore: null,  moderation: "Capped — KPA2 < 60%" },
];

// Individual KPIs per agreement (drawer + clerk scorecard).
export const INDIVIDUAL_KPIS = {
  // CFO
  pa2: [
    { id: "k1", label: "Reduce outstanding consumer debt to ≤ R412m by Q4",       weight: 30, target: "R412m",       actual: "R471m",                  rating: 3, evidence: 4 },
    { id: "k2", label: "Recover R75m across 4 revenue clusters (debt drive)",      weight: 30, target: "R75m",        actual: "R28m",                   rating: 2, evidence: 7 },
    { id: "k3", label: "Smart meter rollout — 3,500 meters installed",             weight: 20, target: "3,500",       actual: "420 (12%)",              rating: 2, evidence: 3 },
    { id: "k4", label: "Achieve unqualified AGSA opinion (audit FY25/26)",         weight: 20, target: "Unqualified", actual: "Qualified — 12 findings",rating: 2, evidence: 11 },
  ],
  // MM
  pa1: [
    { id: "k1", label: "Quarterly imbizos held in all 19 wards",                   weight: 25, target: "76",          actual: "61",                     rating: 3, evidence: 19 },
    { id: "k2", label: "AGSA findings cleared from prior year",                     weight: 25, target: "35",          actual: "4",                      rating: 2, evidence: 4 },
    { id: "k3", label: "Section 56 PAs signed by 30 Aug",                          weight: 25, target: "100%",        actual: "90%",                    rating: 3, evidence: 9 },
    { id: "k4", label: "Service delivery: water/refuse complaint resolution",      weight: 25, target: "≤5 days",     actual: "8.4 days",               rating: 2, evidence: 6 },
  ],
  // Revenue Manager (Tshepiso) — bridges CFO and Clerk in the cascade
  pa7: [
    { id: "k1", label: "Recover R75m across 4 revenue clusters",                   weight: 40, target: "R75m",        actual: "R28m",                   rating: 2, evidence: 6 },
    { id: "k2", label: "Customer-contact volume across team (≥5,000 calls / mo)",   weight: 25, target: "5,000",       actual: "4,720",                  rating: 4, evidence: 9 },
    { id: "k3", label: "Disconnection orders completed ≤ 48 hours (team avg)",     weight: 20, target: "100%",        actual: "82%",                    rating: 2, evidence: 4 },
    { id: "k4", label: "POE verification turnaround ≤ 5 working days",              weight: 15, target: "≤5 days",     actual: "3.1 days",               rating: 5, evidence: 12 },
  ],
  // Debt Collection Clerk (Lebogang) — the bottom of the cascade. Numbers
  // verbatim from the demo script.
  pa_clerk: [
    { id: "k1", label: "Outstanding debtor reduction on assigned book",            weight: 35, target: "R14.2m",      actual: "R15.8m",                 rating: 4, evidence: 6 },
    { id: "k2", label: "Customer contact volume",                                  weight: 25, target: "50 calls / wk",actual: "47 / wk",                rating: 4, evidence: 8 },
    { id: "k3", label: "Payment arrangements concluded",                           weight: 20, target: "12 / month",   actual: "9 / month",              rating: 3, evidence: 5 },
    { id: "k4", label: "Disconnection orders within 48 hours",                     weight: 10, target: "100%",        actual: "82%",                    rating: 2, evidence: 3 },
    { id: "k5", label: "POE compliance",                                           weight: 10, target: "100%",        actual: "100%",                   rating: 5, evidence: 14 },
  ],
};

// ─── POE — Portfolio of Evidence documents ────────────────────────────────────
export const POE_DOCUMENTS = [
  { id: "poe1", kpiCode: "SD-T-001 / Q3", title: "Electrification connection certificates — Mashishimale",  uploaded: "2026-04-12", uploader: "u_tech",  size: "4.2 MB", sha: "0x7a9c…3f1e",   verified: true,  verifiedBy: "u_audit", source: "Mobile upload (field officer)" },
  { id: "poe2", kpiCode: "SD-T-005 / Q3", title: "Debt collection letter dispatch register — Mar 2026",     uploaded: "2026-04-08", uploader: "u_cfo",   size: "1.1 MB", sha: "0xc12d…8b04",   verified: true,  verifiedBy: "u_audit", source: "Web upload" },
  { id: "poe3", kpiCode: "SD-T-002 / Q3", title: "Substation transformer install — site photographs",        uploaded: "2026-04-04", uploader: "u_tech",  size: "12.8 MB", sha: "0x3e7f…91a2",  verified: true,  verifiedBy: "u_audit", source: "Mobile upload" },
  { id: "poe4", kpiCode: "SD-T-006 / Q3", title: "Smart meter delivery note — Eskom batch 1",                uploaded: "2026-03-29", uploader: "u_cfo",   size: "640 KB",  sha: "0xa1b2…ee07",  verified: false, verifiedBy: null,      source: "Web upload" },
  { id: "poe5", kpiCode: "SD-T-009 / Q3", title: "Signed Section 56 performance agreements (5 directors)",   uploaded: "2026-08-30", uploader: "u_mm",    size: "8.6 MB",  sha: "0x9f4d…220b",  verified: true,  verifiedBy: "u_audit", source: "Web upload" },
  { id: "poe6", kpiCode: "SD-T-010 / Q3", title: "Imbizo attendance registers — Wards 2, 3, 4 (Mar 2026)",   uploaded: "2026-04-02", uploader: "u_mm",    size: "2.4 MB",  sha: "0x6c81…44d3",  verified: true,  verifiedBy: "u_audit", source: "Mobile upload" },
  { id: "poe7", kpiCode: "SD-T-007 / Q3", title: "Audit Action Plan progress report — March",                uploaded: "2026-04-15", uploader: "u_cfo",   size: "3.1 MB",  sha: "0xb74e…1a90",  verified: false, verifiedBy: null,      source: "Web upload" },
  { id: "poe8", kpiCode: "SD-T-003 / Q3", title: "Refuse collection route survey — informal areas",          uploaded: "2026-03-25", uploader: "u_comm",  size: "5.7 MB",  sha: "0xd29a…77fc",  verified: true,  verifiedBy: "u_audit", source: "Mobile upload" },
  { id: "poe9", kpiCode: "SD-T-008 / Q3", title: "Recruitment register — vacancy filling Q3",                uploaded: "2026-04-10", uploader: "u_corp",  size: "920 KB",  sha: "0x4a87…3219",  verified: true,  verifiedBy: "u_audit", source: "Web upload" },
  { id: "poe10",kpiCode: "SD-T-004 / Q3", title: "LED tourism job placements — quarterly return",            uploaded: "2026-04-11", uploader: "u_corp",  size: "1.8 MB",  sha: "0xff2c…8b41",  verified: true,  verifiedBy: "u_audit", source: "Web upload" },
];

// ─── Audit & Compliance Calendar ──────────────────────────────────────────────
// Today is 2026-05-10. T-N is computed at render time from this base date.
export const COMPLIANCE_DEADLINES = [
  { id: "c1",  legalRef: "MFMA s.21A",   deadline: "2026-05-31", title: "Mid-year budget & adjustment performance assessment finalised", owner: "u_cfo", status: "Pending" },
  { id: "c2",  legalRef: "MFMA s.53(1)(c)(ii)", deadline: "2026-07-28", title: "Top-Layer SDBIP for FY 2026/27 tabled to Mayor",        owner: "u_mm",  status: "Pending" },
  { id: "c3",  legalRef: "MSA s.57",     deadline: "2026-08-30", title: "Section 56 performance agreements signed (all directors)",     owner: "u_mm",  status: "At risk" },
  { id: "c4",  legalRef: "MFMA s.126(1)(a)", deadline: "2026-08-31", title: "Annual Financial Statements submitted to AGSA",            owner: "u_cfo", status: "Pending" },
  { id: "c5",  legalRef: "MFMA s.121",   deadline: "2027-01-31", title: "2025/26 Annual Report tabled to Council",                       owner: "u_mm",  status: "Pending" },
  { id: "c6",  legalRef: "MFMA s.72",    deadline: "2027-01-25", title: "Mid-year budget & performance assessment FY 2026/27",          owner: "u_cfo", status: "Pending" },
  { id: "c7",  legalRef: "MSA s.34",     deadline: "2027-03-31", title: "IDP 2026/27 Annual Review tabled to Council",                   owner: "u_mm",  status: "Pending" },
  { id: "c8",  legalRef: "MFMA s.16",    deadline: "2027-03-31", title: "Draft FY 2027/28 budget tabled to Council",                     owner: "u_cfo", status: "Pending" },
  { id: "c9",  legalRef: "MFMA s.166",   deadline: "2026-05-15", title: "Audit Committee quarterly meeting (Q3 review)",                 owner: "u_audit",status: "Pending" },
  { id: "c10", legalRef: "Reg. 22 SPLUMA", deadline: "2026-06-30", title: "SDF integration with mid-year IDP review",                    owner: "u_corp", status: "Pending" },
];

// ─── Activity log (recent platform events) ────────────────────────────────────
// Includes the two preemptive compliance flags from the demo script.
export const ACTIVITY = [
  // System auto-flag — KPA2 Revenue rating below 60% triggers moderation cap.
  // The Mayor / MM / CFO / Auditor see this before AGSA does.
  { id: 1, userId: "system",   action: "Compliance alert", target: "KPA2 Revenue rating < 60% — moderation review required", time: "Today 11:55", severity: "warning" },
  // Internal Auditor flag — surfaced to MM and CFO dashboards
  { id: 2, userId: "u_audit",  action: "Audit flag",       target: "3 individual KPIs missing supporting POE in IPMS",      time: "Yesterday 16:20", severity: "warning" },
  { id: 3, userId: "u_clerk",  action: "Uploaded POE",      target: "Debt collection call log — April 2026 (Lebogang)",     time: "Today 09:48" },
  { id: 4, userId: "u_tech",   action: "Uploaded POE",      target: "Substation transformer install — site photographs",    time: "Today 09:14" },
  { id: 5, userId: "u_cfo",    action: "Posted journal",    target: "JV-2026-04-9821 (R3.24m capital, MIG)",                time: "Today 09:02" },
  { id: 6, userId: "u_audit",  action: "Verified POE",      target: "Imbizo attendance registers — Wards 2, 3, 4",          time: "Yesterday 15:48" },
  { id: 7, userId: "u_revmgr", action: "Verified POE",      target: "Lebogang Mokoena · debtor call log — March",           time: "Yesterday 14:10" },
  { id: 8, userId: "u_mm",     action: "Updated SDBIP",     target: "SD-T-009 ytd from 80% → 90%",                          time: "Yesterday 11:20" },
  { id: 9, userId: "system",   action: "Compliance alert",  target: "T-30: Section 56 PAs signing deadline 2026-08-30",     time: "May 8 06:00", severity: "info" },
  { id: 10, userId: "u_cfo",   action: "Flagged transaction",target: "JV-2026-04-9800 — costing segment ambiguous",          time: "May 7 14:00" },
  { id: 11, userId: "u_corp",  action: "Signed PA",         target: "T Mokoena · Section 56 Performance Agreement",         time: "May 6 09:30" },
  { id: 12, userId: "u_audit", action: "Updated risk",      target: "R-05 Bulk water cost-recovery — mitigation revised",   time: "May 5 16:00" },
];
