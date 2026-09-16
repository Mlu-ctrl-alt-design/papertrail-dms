// Employee Connect — North West Provincial Government internal communications.
// Demo data only: every number, person and message below is fabricated.

export const ORG = {
  name: "North West Provincial Government",
  short: "NWPG",
  unit: "Provincial Communications",
  headcount: 4812,
  onWhatsApp: 4664,          // employees with a verified WhatsApp number
  channel: "WhatsApp Business · +27 82 000 4812",
};

// ─── Departments ──────────────────────────────────────────────────────────────
// `reach` = employees in the department with a verified WhatsApp number.
export const DEPARTMENTS = [
  { id: "comms",     name: "Provincial Communications",   total: 128,  reach: 126 },
  { id: "premier",   name: "Office of the Premier",       total: 214,  reach: 210 },
  { id: "health",    name: "Health",                      total: 1486, reach: 1402 },
  { id: "education", name: "Education & Sport Development", total: 1204, reach: 1168 },
  { id: "works",     name: "Public Works & Roads",        total: 612,  reach: 588 },
  { id: "cogta",     name: "COGTA & Human Settlements",   total: 388,  reach: 372 },
  { id: "finance",   name: "Provincial Treasury",         total: 296,  reach: 291 },
  { id: "social",    name: "Social Development",          total: 274,  reach: 266 },
  { id: "agri",      name: "Agriculture & Rural Development", total: 210, reach: 201 },
];

// ─── Broadcast reference ──────────────────────────────────────────────────────
// CMP-01001-G1D4N: a campaign prefix, the sequence number in the provincial
// register, and a short check segment so a code can't be transposed into
// another valid one. Derived from the sequence, so the same broadcast always
// carries the same reference.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

export function broadcastCodeFor(seq) {
  let h = 2166136261;
  const seed = `nwpg-broadcast-${seq}`;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h ^ seed.charCodeAt(i)) >>> 0;
    h = (h * 16777619) >>> 0;
  }
  let suffix = "";
  for (let i = 0; i < 5; i += 1) {
    h = (h * 1103515245 + 12345) >>> 0;
    suffix += CODE_ALPHABET[h % CODE_ALPHABET.length];
  }
  return `CMP-${String(seq).padStart(5, "0")}-${suffix}`;
}

// ─── Channels ─────────────────────────────────────────────────────────────────
// Listed in priority order: a recipient is sent on the first selected channel
// they are reachable on, and falls back down the list from there.
// `coverage` = share of a population that is contactable on that channel.
// `coverage`    = share of a population that has the channel at all.
// `consentRate` = share of those who have also given consent to be messaged on
//                 it. WhatsApp is the strict one: Meta requires a recorded
//                 opt-in before a business may message a user at all.
export const CHANNELS = [
  { id: "whatsapp", name: "WhatsApp",     blurb: "WhatsApp Business API",           coverage: 0.969, consentRate: 0.947, colour: "#25D366", handle: "+27 82 000 4812", consent: "Opt-in required (Meta)" },
  { id: "sms",      name: "SMS",          blurb: "Bulk SMS · 160 characters",     coverage: 0.992, colour: "#0b7ec4", handle: "NWPG", consent: "Employment contract" },
  { id: "email",    name: "Email",        blurb: "comms@nwpg.gov.za",             coverage: 0.947, colour: "#8764b8", handle: "comms@nwpg.gov.za", consent: "Employment contract" },
  { id: "app",      name: "App Notifications", blurb: "Push notification + in-app inbox", coverage: 0.715, colour: "#c8a116", handle: "Employee app", consent: "App sign-in" },
];

export const channelById = (id) => CHANNELS.find((c) => c.id === id) || CHANNELS[0];

// Share of employees with an open 24-hour service window at any moment — i.e.
// who have messaged the province in the last day. It is always small, which is
// exactly why business-initiated messaging needs approved templates.
export const SESSION_RATE = 0.008;

// Deliverable coverage for one send: has the channel, has consented to it, and
// — for free text on WhatsApp — is inside the 24-hour window.
export const sendCoverage = (id, freeForm = false) => {
  const c = channelById(id);
  const base = c.coverage * (c.consentRate ?? 1);
  return id === "whatsapp" && freeForm ? base * SESSION_RATE : base;
};

// Reach of one channel over a population.
export const channelReach = (size, id, freeForm = false) =>
  Math.round(size * sendCoverage(id, freeForm));

// Combined reach of several channels: anyone contactable on at least one.
export const combinedReach = (size, ids, freeForm = false) => {
  if (!ids.length) return 0;
  const miss = ids.reduce((acc, id) => acc * (1 - sendCoverage(id, freeForm)), 1);
  return Math.min(size, Math.round(size * (1 - miss)));
};

// ─── Audience segments (what the operator picks on the dashboard) ─────────────
// kind: "all" | "department" | "group"
// `size` is the headcount; per-channel reach is derived from it.
export const SEGMENTS = [
  { id: "seg-all",    kind: "all",        name: "All employees",            desc: "Every employee on the provincial register", size: ORG.headcount, icon: "people" },
  { id: "seg-comms",  kind: "department", name: "Provincial Communications", desc: "Department · internal comms pilot",        size: 128,  deptId: "comms",  icon: "dept" },
  { id: "seg-exec",   kind: "group",      name: "Executives only",          desc: "HODs, DDGs and MEC support staff",          size: 25,   icon: "exec" },
  { id: "seg-mgmt",   kind: "group",      name: "Senior management",        desc: "Director level and above",                  size: 192,  icon: "exec" },
  { id: "seg-head",   kind: "group",      name: "Head office · Mahikeng",   desc: "Everyone based at Garona Building",         size: 972,  icon: "site" },
  { id: "seg-region", kind: "group",      name: "District offices",         desc: "Bojanala, Dr KK, NM Molema, Ruth Segomotsi", size: 1924, icon: "site" },
];

// ─── Message templates ────────────────────────────────────────────────────────
// Mirrors the approved payslip-distribution template, re-purposed for comms.
// WhatsApp Business Platform rules the prototype honours:
//   · A business-initiated message sent outside the 24-hour customer service
//     window must use a template Meta has approved, in an approved category.
//   · Inside the 24-hour window — i.e. the employee messaged us last — free
//     text is allowed.
//   · The recipient must have opted in before we may message them at all.
//
// `meta` carries what the WhatsApp Business API would need: the registered
// template name, language and category, plus its review status.
export const TEMPLATES = [
  {
    id: "tpl-newsletter",
    name: "Provincial Newsletter",
    category: "Newsletter",
    approved: true,
    meta: { name: "nwpg_newsletter_monthly", language: "en_ZA", category: "MARKETING", status: "approved", approvedOn: "14 Aug 2026" },
    subject: "Kgotla ya Rona — September 2026 edition",
    // Short form used on SMS, where there is no attachment and 160 characters
    // is one billable segment.
    sms: "NWPG: The September edition of Kgotla ya Rona is out. Read it here: nwpg.gov.za/nl/sep26 Reply STOP to opt out.",
    blurb: "Monthly newsletter distribution — same structure as the payslip template.",
    body:
      "Dumelang {{name}} 👋\n\n" +
      "The September edition of *Kgotla ya Rona*, the North West Provincial Government newsletter, is now available.\n\n" +
      "Inside this edition:\n" +
      "• Premier's address on the 2026 Provincial Growth Plan\n" +
      "• Garona Building relocation: what changes for you\n" +
      "• Employee wellness week — 22 to 26 September\n\n" +
      "Tap the attachment below to read it. Reply *STOP* to opt out of newsletters.",
    attachment: { name: "NWPG-Newsletter-Sept-2026.pdf", size: "2.4 MB", kind: "pdf", pages: 12 },
  },
  {
    id: "tpl-closure",
    name: "Office Closure Notice",
    category: "Notice",
    approved: true,
    meta: { name: "nwpg_operational_notice", language: "en_ZA", category: "UTILITY", status: "approved", approvedOn: "02 Jul 2026" },
    subject: "URGENT: Garona Building closed today, 15 September",
    sms: "NWPG NOTICE: Garona Building is closed today 15 Sept due to a water interruption. Work remotely. District offices open. Normal hours resume 16 Sept.",
    blurb: "Urgent operational notice — no attachment, delivered as priority.",
    body:
      "*OFFICE CLOSURE NOTICE*\n\n" +
      "Dumela {{name}}\n\n" +
      "The Garona Building offices are *closed today, 15 September 2026*, due to a scheduled municipal water interruption.\n\n" +
      "• All staff are to work remotely for the day\n" +
      "• Essential services at district offices remain open\n" +
      "• Normal operations resume Tuesday, 16 September\n\n" +
      "Issued by the Office of the Premier · Provincial Communications.",
    attachment: null,
    priority: "urgent",
  },
  {
    id: "tpl-payslip",
    name: "Payslip Distribution",
    category: "Payroll",
    approved: true,
    meta: { name: "ezra360_payslip_ready", language: "en_ZA", category: "UTILITY", status: "approved", approvedOn: "19 Mar 2026" },
    subject: "Your September 2026 payslip",
    sms: "NWPG: Your September 2026 payslip is ready. View it at nwpg.gov.za/payslip - open with your ID number. Pay date 25 Sept.",
    blurb: "The production template already running on Ezra360 Payroll.",
    body:
      "Dumelang {{name}}\n\n" +
      "Your payslip for *September 2026* is ready.\n\n" +
      "PERSAL no: {{persal}}\n" +
      "Pay date: 25 September 2026\n\n" +
      "The document is password protected — use your ID number to open it.",
    attachment: { name: "Payslip-Sept-2026.pdf", size: "180 KB", kind: "pdf", pages: 1 },
  },
  {
    id: "tpl-blank",
    name: "Blank message",
    category: "Free text",
    approved: false,
    // Free text is not a template: on WhatsApp it can only reach employees who
    // have messaged us in the last 24 hours.
    freeForm: true,
    meta: null,
    subject: "",
    sms: "",
    blurb: "Free text — WhatsApp delivery limited to open 24-hour conversations.",
    body: "",
    attachment: null,
  },
];

// ─── Employee directory (sample — the visible slice of the 4,812) ─────────────
const A = ["#219CD6", "#107c10", "#8764b8", "#005a9e", "#c8a116", "#a4262c"];

// Contact records follow the provincial contact schema: Full Name, First Name,
// Middle Name, Last Name, PERSAL Number, Email, Mobile Phone, Line Manager.
//
// These are the real contacts from the Xiquel export, kept as they come —
// mixed casing, mixed domains, Botswana and South African numbers, PERSAL
// numbers on some records and not others, one line manager captured out of
// thirty. The console has to cope with the register as it actually is.
// Everything after `manager` on each record is operational state the console
// needs (department, office, consent), not part of the contact import.
export const EMPLOYEES = [
  // ── Provincial Communications — the pilot department ──────────────────────
  { id: "e01", first: "Mlu", middle: "", last: "Manda", persal: "", email: "mlu@xiquelgroup.com", mobile: "0846948084", manager: "", role: "Director: Communications", dept: "comms", exec: true, site: "Mahikeng" },
  { id: "e02", first: "Siyanda", middle: "", last: "Sitsha", persal: "", email: "siyandas@xiquelgroup.com", mobile: "0818362271", manager: "Mlu Manda", role: "Deputy Director: Digital", dept: "comms", site: "Mahikeng" },
  // Replied to the August newsletter this morning — her 24-hour service window
  // is open, so free text may be sent to her.
  { id: "e03", first: "Boitshepo", middle: "", last: "Mokwena", persal: "12345678", email: "boitshepom@xiquelgroup.com", mobile: "0123456789", manager: "", role: "Media Liaison Officer", dept: "comms", site: "Mahikeng", sessionHours: 6 },
  // Opt-in requested but never confirmed — Meta will not let us message her.
  { id: "e04", first: "Thembeka Yvonne", middle: "", last: "Msimanga", persal: "12345670", email: "Thembekam@xiquelgroup.com", mobile: "0123456789", manager: "", role: "Senior Communications Officer", dept: "comms", site: "Rustenburg", waConsent: "pending", consentAt: "Invited 02 Sept 2026" },
  // Handset drops the WhatsApp message — the recipient the SMS fallback rescues.
  { id: "e05", first: "Phindile", middle: "", last: "Nkabini", persal: "1234567890", email: "Phindilen@xiquelgroup.com", mobile: "0123456789", manager: "Moses Sebetha", role: "Communications Intern", dept: "comms", site: "Mahikeng", failsOn: "whatsapp" },
  { id: "e06", first: "Thapedi Jackie", middle: "", last: "Matjila", persal: "45677890", email: "thapedim@xiquelgroup.com", mobile: "1234567890", manager: "", role: "Provincial Spokesperson", dept: "comms", exec: true, site: "Mahikeng", sessionHours: 19 },
  // Replied STOP to a newsletter in July — opt-out is honoured automatically.
  { id: "e07", first: "Kgothatso", middle: "", last: "Tshilambwana", persal: "8883479897", email: "kgothatsot@xiquelgroup.com", mobile: "0777869867", manager: "", role: "Graphic Designer", dept: "comms", site: "Mahikeng", waConsent: "opted_out", consentAt: "STOP received 11 Jul 2026" },

  // ── Executive and departmental ────────────────────────────────────────────
  { id: "e08", first: "Moses", middle: "", last: "Sebetha", persal: "37465462", email: "moses@xiquelgroup.com", mobile: "0474951270", manager: "", role: "Head of Department", dept: "premier", exec: true, site: "Mahikeng" },
  { id: "e09", first: "Mosala", middle: "", last: "Lebeko", persal: "20020318", email: "mosalal@xiquelgroup.com", mobile: "0823134928", manager: "Moses Sebetha", role: "Chief Financial Officer", dept: "finance", exec: true, site: "Mahikeng" },
  // No mobile number on the register — reachable on email only.
  { id: "e10", first: "Nkosinathi", middle: "", last: "Ndaba", persal: "", email: "Nkosinathin@xiquelgroup.com", mobile: "", manager: "", role: "Chief Director: Health", dept: "health", exec: true, site: "Klerksdorp" },
  { id: "e11", first: "PAUL", middle: "", last: "MASHABELA", persal: "", email: "PAUL.MASHABELA@COJ.GOV.ZA", mobile: "0875433345", manager: "", role: "Deputy Director General", dept: "cogta", exec: true, site: "Mahikeng" },
  { id: "e12", first: "ROBYN", middle: "", last: "MUNNA", persal: "", email: "ROBYNM@SERITI.CO.BW", mobile: "+267-71778220", manager: "", role: "Head: Provincial Treasury", dept: "finance", exec: true, site: "Mahikeng" },
  { id: "e13", first: "Hamphrey", middle: "", last: "Mankwe", persal: "47394858", email: "hamphreym@xiquelgroup.com", mobile: "0986556655", manager: "", role: "District Coordinator", dept: "education", site: "Vryburg" },
  { id: "e14", first: "RICHARD", middle: "", last: "JAMIESON", persal: "", email: "jamies@hjh.com", mobile: "076927527", manager: "", role: "Schools Liaison Officer", dept: "education", site: "Potchefstroom", waConsent: "pending", consentAt: "Invited 28 Aug 2026" },
  { id: "e15", first: "Marshal", middle: "", last: "Lutenburg", persal: "", email: "agobakwe@xiquelgroup.com", mobile: "", manager: "", role: "Education Circuit Manager", dept: "education", site: "Taung" },
  { id: "e16", first: "IMTIAZ", middle: "", last: "IQBAL", persal: "", email: "IMI@IMI.CO.BW", mobile: "+26772323232", manager: "", role: "Clinic Operations Manager", dept: "health", site: "Mmabatho" },
  { id: "e17", first: "Akhumzi", middle: "", last: "Maxwane", persal: "", email: "amax@gmail.com", mobile: "", manager: "", role: "Roads Project Manager", dept: "works", site: "Rustenburg" },
  { id: "e18", first: "FRANCOIS", middle: "", last: "VAN ZYL", persal: "", email: "FRANCOIS@LSCSECURITY.CO.BW", mobile: "+26771928821", manager: "", role: "Roads Maintenance Supervisor", dept: "works", site: "Rustenburg" },
  { id: "e19", first: "FRASER", middle: "", last: "TABEART", persal: "", email: "FRASERT@AFRICANENERGYRESOURCES.COM", mobile: "+26772305846", manager: "", role: "Infrastructure Analyst", dept: "works", site: "Klerksdorp" },
  { id: "e20", first: "Wesley", middle: "", last: "Smith", persal: "", email: "wes-smith@wechem.org", mobile: "", manager: "", role: "Records Administrator", dept: "works", site: "Klerksdorp" },
  { id: "e21", first: "JOHN", middle: "", last: "DOE", persal: "", email: "kgopotso.riba@xiquelgroup.com", mobile: "", manager: "", role: "Fleet Controller", dept: "works", site: "Vryburg" },
  { id: "e22", first: "MASSIMO", middle: "", last: "MARINELLI", persal: "", email: "MAX@MARINELLI.CO.BW", mobile: "+26771603365", manager: "", role: "Facilities Manager", dept: "works", site: "Mahikeng" },
  { id: "e23", first: "DELON", middle: "", last: "VAN ZYL", persal: "", email: "MULBRIDGE@BOTSNET.BW", mobile: "+26771305779", manager: "", role: "Municipal Support Specialist", dept: "cogta", site: "Rustenburg" },
  { id: "e24", first: "JAN", middle: "", last: "THOMSON", persal: "", email: "TOMMY@LSCSECURITY.CO.BW", mobile: "+26771327654", manager: "", role: "IT Service Desk Lead", dept: "premier", site: "Mahikeng" },
  { id: "e25", first: "THOMAS", middle: "", last: "SCOTT-MOREY", persal: "", email: "THOMASS@AFRICANENERGYRESOURCES.COM", mobile: "+26772306350", manager: "", role: "Energy Programme Manager", dept: "premier", site: "Mahikeng" },
  { id: "e26", first: "JURGENS", middle: "", last: "THOMSON", persal: "", email: "JOHAN@LSCSECURITY.CO.BW", mobile: "+26775956725", manager: "", role: "Human Resources Officer", dept: "social", site: "Brits" },
  { id: "e27", first: "PATIENCE", middle: "", last: "SMITH", persal: "", email: "patience@test.com", mobile: "0873645245", manager: "", role: "Social Worker Supervisor", dept: "social", site: "Brits" },
  { id: "e28", first: "TSHWANO", middle: "", last: "KOPI", persal: "", email: "TSHWANO@YAHOO.COM", mobile: "+26777099134", manager: "", role: "Community Liaison Officer", dept: "social", site: "Taung" },
  { id: "e29", first: "KAGISO", middle: "", last: "TSAYANG", persal: "", email: "KAGISO@LSCSECURITY.CO.BW", mobile: "+26771257767", manager: "", role: "Agricultural Extension Officer", dept: "agri", site: "Lichtenburg" },
  { id: "e30", first: "RALPH", middle: "", last: "BOUSFIELD", persal: "", email: "RALPH@UNCHARTEDAFRICA.COM", mobile: "+26772108069", manager: "", role: "Environmental Officer", dept: "agri", site: "Lichtenburg" },
].map((e, i) => {
  const fullName = [e.first, e.middle, e.last].filter(Boolean).join(" ");
  return {
    ...e,
    fullName,
    // `name` is the display name used across the console.
    name: fullName,
    lineManager: e.manager,
    color: A[i % A.length],
    initials: `${e.first[0]}${e.last[0]}`.toUpperCase(),
    // Roughly seven in ten staff have the employee app installed.
    app: i % 10 < 7,
    // Everyone else signed the WhatsApp opt-in during onboarding.
    waConsent: e.waConsent || "opted_in",
    consentAt: e.consentAt || "Opt-in 12 Mar 2026 · HR onboarding",
    // Hours left on the 24-hour customer service window, if the employee has
    // messaged us recently.
    sessionHours: e.sessionHours || 0,
  };
});

export const CONSENT_LABEL = {
  opted_in: "Opted in",
  pending: "Opt-in pending",
  opted_out: "Opted out",
};

// A business may only message a WhatsApp user who has opted in.
export const hasWhatsAppConsent = (e) => e.waConsent === "opted_in";

// True while the employee's own message keeps the 24-hour service window open,
// during which free text is allowed.
export const sessionOpen = (e) => e.sessionHours > 0;

// Which channels a given employee can actually be reached on. WhatsApp needs a
// number *and* a recorded opt-in.
export const employeeChannels = (e) => ({
  whatsapp: Boolean(e.mobile) && hasWhatsAppConsent(e),
  sms: Boolean(e.mobile),
  email: Boolean(e.email),
  app: Boolean(e.app),
});

export const deptName = (id) => (DEPARTMENTS.find(d => d.id === id) || {}).name || id;

// ─── Broadcast history ────────────────────────────────────────────────────────
// Historical sends report what the provider reported: accepted, delivered,
// failed. No opens — see the note on the delivery board. `code` is the
// system-generated broadcast reference, as Ezra360 generates a campaign code.
export const HISTORY = [
  { id: "bc-1042", code: broadcastCodeFor(1000), channels: ["whatsapp", "email"], title: "August newsletter — Kgotla ya Rona", template: "Provincial Newsletter", meta: { name: "nwpg_newsletter_monthly", category: "MARKETING" }, audience: "All employees", sent: 4664, delivered: 4602, failed: 62, at: "28 Aug 2026 · 08:05", by: "M. Manda", status: "completed" },
  { id: "bc-1041", code: broadcastCodeFor(999), channels: ["whatsapp", "sms"], title: "Water interruption — Garona Building", template: "Office Closure Notice", meta: { name: "nwpg_operational_notice", category: "UTILITY" }, audience: "Head office · Mahikeng", sent: 942, delivered: 938, failed: 4, at: "19 Aug 2026 · 06:42", by: "B. Mokwena", status: "completed" },
  { id: "bc-1040", code: broadcastCodeFor(998), channels: ["whatsapp"], title: "Payslip distribution — August 2026", template: "Payslip Distribution", meta: { name: "ezra360_payslip_ready", category: "UTILITY" }, audience: "All employees", sent: 4664, delivered: 4651, failed: 13, at: "25 Aug 2026 · 17:00", by: "Ezra360 Payroll", status: "completed" },
  { id: "bc-1039", code: broadcastCodeFor(997), channels: ["whatsapp", "email"], title: "Executive briefing pack — Q2 review", template: "Executive Briefing", meta: { name: "nwpg_exec_briefing", category: "UTILITY" }, audience: "Executives only", sent: 24, delivered: 24, failed: 0, at: "12 Aug 2026 · 14:20", by: "T. Matjila", status: "completed" },
  { id: "bc-1038", code: broadcastCodeFor(996), channels: ["whatsapp", "app"], title: "Wellness week registration", template: "Staff Programme Invite", meta: { name: "nwpg_staff_programme", category: "MARKETING" }, audience: "Provincial Communications", sent: 126, delivered: 125, failed: 1, at: "05 Aug 2026 · 09:15", by: "S. Sitsha", status: "completed" },
];

// ─── Nice-to-have tiles ───────────────────────────────────────────────────────
export const WEATHER = {
  place: "Mahikeng, North West",
  temp: 29, condition: "Sunny", high: 32, low: 14, wind: "18 km/h NE", humidity: "21%",
  advisory: "Heat advisory — district offices to observe outdoor work limits between 12:00 and 15:00.",
  days: [
    { day: "Mon", icon: "sun",   hi: 32, lo: 14 },
    { day: "Tue", icon: "sun",   hi: 33, lo: 15 },
    { day: "Wed", icon: "cloud", hi: 28, lo: 16 },
    { day: "Thu", icon: "rain",  hi: 24, lo: 15 },
    { day: "Fri", icon: "cloud", hi: 27, lo: 13 },
  ],
};

export const SENTIMENT = {
  window: "Last 7 days · X, Facebook, news comments",
  mentions: 1284,
  positive: 46, neutral: 38, negative: 16,
  trend: "+8 pts vs last week",
  topics: [
    { topic: "Road maintenance — N4 corridor", volume: 318, tone: "negative", delta: "+42" },
    { topic: "Provincial bursary applications", volume: 274, tone: "positive", delta: "+61" },
    { topic: "Clinic operating hours", volume: 196, tone: "neutral", delta: "-12" },
    { topic: "Garona Building relocation", volume: 151, tone: "neutral", delta: "+9" },
    { topic: "Employee wellness week", volume: 88, tone: "positive", delta: "+31" },
  ],
};
