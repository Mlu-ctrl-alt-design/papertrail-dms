// Seed data for the OPFA WhatsApp Business prototype.
//
// Demo data only: every person, complaint, fund and message below is
// fabricated. The complaint subjects are drawn from the categories the OPFA
// actually determines (withdrawal benefits, non-payment of contributions,
// death benefit allocations under s37C, transfers) so the flows are exercised
// against realistic material, but no real complainant or fund is represented.
//
// Nothing here is mutated. `seedState()` returns a fresh tree each time it is
// called, which is what makes "Reset demo" a one-liner.
import {
  caseRef, wamid, respondDocId, seededRandom, windowExpiry, WINDOW_MS,
} from "./helpers.js";

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// ─── Reference data ───────────────────────────────────────────────────────────

export const FUNDS = [
  { id: "fund-1", name: "Municipal Employees Pension Fund", fsca: "12/8/12345" },
  { id: "fund-2", name: "Private Security Sector Provident Fund", fsca: "12/8/23456" },
  { id: "fund-3", name: "Sentinel Retirement Fund", fsca: "12/8/34567" },
  { id: "fund-4", name: "Motor Industry Retirement Funds", fsca: "12/8/45678" },
];

export const EMPLOYERS = [
  { id: "emp-1", name: "Rustenburg Local Municipality" },
  { id: "emp-2", name: "Protea Coin Security Services" },
  { id: "emp-3", name: "Sibanye-Stillwater" },
  { id: "emp-4", name: "Supa Quick Boksburg" },
];

// OPFA consultants staffing the WhatsApp queue.
export const AGENTS = [
  { id: "AG-01", name: "Lerato Khumalo", role: "Senior Consultant", initials: "LK", status: "online", activeChats: 2, handled: 41, avgHandleSec: 384, csat: 4.6 },
  { id: "AG-02", name: "Pieter van Wyk", role: "Consultant", initials: "PV", status: "online", activeChats: 1, handled: 33, avgHandleSec: 512, csat: 4.3 },
  { id: "AG-03", name: "Ayanda Nkosi", role: "Consultant", initials: "AN", status: "busy", activeChats: 3, handled: 38, avgHandleSec: 447, csat: 4.5 },
  { id: "AG-04", name: "Fatima Patel", role: "Supervisor", initials: "FP", status: "away", activeChats: 0, handled: 12, avgHandleSec: 690, csat: 4.8 },
];

// Role-based access control (6.1.8). The console actually enforces this — the
// role switcher hides nav and disables actions, so the matrix is testable
// rather than decorative.
export const ROLES = {
  agent: {
    label: "Agent",
    nav: ["dashboard", "inbox", "cases", "templates"],
    can: { reply: true, claim: true, transfer: true, sendTemplate: true, revealPii: false, export: false, manageConsent: false, viewAudit: false },
  },
  supervisor: {
    label: "Supervisor",
    nav: ["dashboard", "inbox", "cases", "templates", "reports", "consent"],
    can: { reply: true, claim: true, transfer: true, sendTemplate: true, revealPii: true, export: true, manageConsent: true, viewAudit: false },
  },
  admin: {
    label: "Administrator",
    nav: ["dashboard", "inbox", "cases", "templates", "reports", "consent", "audit", "integrations"],
    can: { reply: true, claim: true, transfer: true, sendTemplate: true, revealPii: true, export: true, manageConsent: true, viewAudit: true },
  },
};

// Approved Meta message templates (6.1.7). Categories, languages and statuses
// are the real Cloud API vocabulary; a UTILITY template may be sent outside
// the service window, a MARKETING one only with marketing consent.
export const TEMPLATES = [
  {
    name: "case_reference_issued", category: "UTILITY", language: "en", status: "APPROVED", quality: "GREEN",
    body: "Your complaint has been lodged with the OPFA.\n\nYour reference number is *{{1}}*.\n\nPlease quote this reference in all correspondence. We will contact you as the matter progresses.",
    params: ["case reference"],
  },
  {
    name: "case_status_update", category: "UTILITY", language: "en", status: "APPROVED", quality: "GREEN",
    body: "Update on complaint *{{1}}*.\n\nYour complaint is now at the *{{2}}* stage.\n\nReply MENU for self-service options or 9 to speak to a consultant.",
    params: ["case reference", "stage"],
  },
  {
    name: "determination_issued", category: "UTILITY", language: "en", status: "APPROVED", quality: "GREEN",
    body: "A determination has been issued on complaint *{{1}}*.\n\nThe determination letter is attached. Either party may apply to the High Court within six weeks of this notice.",
    params: ["case reference"],
  },
  {
    name: "fund_response_reminder", category: "UTILITY", language: "en", status: "APPROVED", quality: "YELLOW",
    body: "Reminder: we are still awaiting a response from *{{1}}* on complaint *{{2}}*. We will notify you as soon as it is received.",
    params: ["fund", "case reference"],
  },
  {
    name: "otp_verification", category: "AUTHENTICATION", language: "en", status: "APPROVED", quality: "GREEN",
    body: "*{{1}}* is your OPFA verification code. It expires in 5 minutes.\n\nDo not share this code with anyone, including OPFA staff.",
    params: ["code"],
  },
  {
    name: "document_received", category: "UTILITY", language: "en", status: "APPROVED", quality: "GREEN",
    body: "We have received *{{1}}* and filed it against complaint *{{2}}*.\n\nNo further action is needed from you at this stage.",
    params: ["document name", "case reference"],
  },
  {
    name: "isaziso_sesimo", category: "UTILITY", language: "zu", status: "PENDING", quality: null,
    body: "Isibuyekezo ngesikhalazo *{{1}}*.\n\nIsikhalazo sakho manje sisesigabeni *{{2}}*.",
    params: ["inkomba", "isigaba"],
  },
  {
    name: "annual_report_invite", category: "MARKETING", language: "en", status: "APPROVED", quality: "GREEN",
    body: "The OPFA Annual Report for {{1}} is now available.\n\nTap below to read how we resolved complaints this year.\n\nReply STOP to opt out of these messages.",
    params: ["year"],
  },
];

// Agent shortcuts (6.1.7). Written to be sendable as-is — a canned reply that
// needs editing every time is not a canned reply.
export const CANNED_REPLIES = [
  { id: "cr-1", label: "Greeting", text: "Good day, you're speaking to {{agent}} at the OPFA. I've read the conversation so far — let me help you from here." },
  { id: "cr-2", label: "Awaiting fund", text: "Your complaint is with the fund for a response. In terms of section 30F of the Act, we must give them an opportunity to comment before we determine the matter. We allow 30 days and follow up if they do not respond." },
  { id: "cr-3", label: "Need documents", text: "To take this further I'll need a copy of your ID and your latest benefit statement. You can send them right here in this chat — tap the attachment icon." },
  { id: "cr-4", label: "Determination timing", text: "Once investigation is complete the Adjudicator issues a written determination. Both you and the fund receive it at the same time, and either party may take it on review to the High Court within six weeks." },
  { id: "cr-5", label: "Out of jurisdiction", text: "I'm sorry — this matter falls outside the Adjudicator's jurisdiction under the Pension Funds Act. The correct forum would be the CCMA. I can send you their details." },
  { id: "cr-6", label: "Close and thank", text: "Thank you for contacting the OPFA. I'm closing this chat now, but your complaint remains open and you can message us any time for an update." },
];

// ─── Personas ─────────────────────────────────────────────────────────────────
//
// Three handsets, each chosen to exercise a different policy state. The
// scenario rail switches between them, so the panel can see consent and the
// service window behave without waiting a day.

export const PERSONAS = [
  {
    id: "p-thandeka",
    name: "Thandeka Mokoena", first: "Thandeka", initials: "TM",
    msisdn: "+27 82 555 0148", idNumber: "8506120123086", email: "t.mokoena@gmail.com",
    note: "Opted in, verified, two open complaints. The happy path.",
    consent: "opted_in", verified: false, windowAgeMs: 10 * MIN,
  },
  {
    id: "p-sipho",
    name: "Sipho Radebe", first: "Sipho", initials: "SR",
    msisdn: "+27 83 555 0912", idNumber: "9203155544081", email: "sipho.radebe@outlook.com",
    note: "First contact — no opt-in on record. Exercises consent capture.",
    consent: "pending", verified: false, windowAgeMs: 2 * MIN,
  },
  {
    id: "p-nomsa",
    name: "Nomsa Dlamini", first: "Nomsa", initials: "ND",
    msisdn: "+27 71 555 0233", idNumber: "7811034477089", email: "nomsa.d@webmail.co.za",
    note: "Last messaged 26 hours ago — service window already closed.",
    consent: "opted_in", verified: true, windowAgeMs: 26 * HOUR,
  },
];

// ─── Cases ────────────────────────────────────────────────────────────────────

function seedCases(now) {
  const rows = [
    {
      seq: 482, province: "GP", initials: "SM", personaId: "p-thandeka",
      subject: "Withdrawal benefit not paid after resignation",
      category: "Withdrawal benefit", fundId: "fund-1", employerId: "emp-1",
      stage: "Awaiting fund response", amount: 148320.5, lodgedDaysAgo: 46,
      adjudicator: "S. Mthembu",
    },
    {
      seq: 501, province: "GP", initials: "SM", personaId: "p-thandeka",
      subject: "Employer failed to remit monthly contributions",
      category: "Non-payment of contributions", fundId: "fund-1", employerId: "emp-1",
      stage: "Investigation", amount: 22940.0, lodgedDaysAgo: 31,
      adjudicator: "S. Mthembu",
    },
    {
      seq: 356, province: "NW", initials: "LK", personaId: "p-nomsa",
      subject: "Death benefit allocation disputed (section 37C)",
      category: "Death benefit", fundId: "fund-3", employerId: "emp-3",
      stage: "Determination issued", amount: 612000.0, lodgedDaysAgo: 168,
      adjudicator: "L. Khoza",
    },
    {
      seq: 377, province: "GP", initials: "LK", personaId: "p-nomsa",
      subject: "Transfer to preservation fund not processed",
      category: "Transfer", fundId: "fund-4", employerId: "emp-4",
      stage: "Settled", amount: 89450.0, lodgedDaysAgo: 212,
      adjudicator: "L. Khoza",
    },
    {
      seq: 519, province: "GP", initials: "AN", personaId: null,
      subject: "Incorrect calculation of pension interest on divorce",
      category: "Divorce order", fundId: "fund-2", employerId: "emp-2",
      stage: "Allocated", amount: 74100.0, lodgedDaysAgo: 18,
      adjudicator: "A. Ndlovu",
    },
    {
      seq: 527, province: "WC", initials: "AN", personaId: null,
      subject: "Funeral benefit claim declined by administrator",
      category: "Risk benefit", fundId: "fund-2", employerId: "emp-2",
      stage: "Screening", amount: 15000.0, lodgedDaysAgo: 6,
      adjudicator: "A. Ndlovu",
    },
  ];

  return rows.map((r) => {
    const ref = caseRef({ province: r.province, seq: r.seq, initials: r.initials });
    const lodgedAt = now - r.lodgedDaysAgo * DAY;
    return {
      ref,
      personaId: r.personaId,
      subject: r.subject,
      category: r.category,
      fundId: r.fundId,
      employerId: r.employerId,
      stage: r.stage,
      amount: r.amount,
      adjudicator: r.adjudicator,
      lodgedAt,
      lastSyncedAt: now - 3 * HOUR,
      settlement: r.stage === "Settled"
        ? { confirmed: true, at: now - 4 * DAY, by: "complainant", outcome: "paid" }
        : { confirmed: false, at: null, by: null, outcome: null },
      timeline: buildTimeline(r.stage, lodgedAt),
    };
  });
}

// A case's timeline is derived from its stage rather than hand-written per
// case: the OPFA process is the same for everyone, and deriving it means a
// stage change in the demo produces a consistent history.
const STAGE_NOTES = {
  "Lodged": "Complaint received and acknowledged. Reference number issued.",
  "Screening": "Screened for jurisdiction in terms of section 30A of the Act.",
  "Allocated": "Allocated to an Adjudicator for investigation.",
  "Awaiting fund response": "Section 30F notice served on the fund. 30 days allowed for response.",
  "Investigation": "Fund response received. Merits under investigation.",
  "Determination issued": "Written determination issued to both parties.",
  "Settled": "Fund confirmed payment. Complainant confirmed receipt.",
  "Closed": "File closed.",
};

const STAGE_ORDER = Object.keys(STAGE_NOTES);

function buildTimeline(stage, lodgedAt) {
  const upto = STAGE_ORDER.indexOf(stage);
  const span = Math.max(1, Date.now() - lodgedAt);
  return STAGE_ORDER.slice(0, upto + 1).map((s, i) => ({
    stage: s,
    at: lodgedAt + Math.round((span * i) / (upto + 1)),
    note: STAGE_NOTES[s],
  }));
}

// ─── Documents ────────────────────────────────────────────────────────────────

// The attachment catalogue the simulator offers. Two are deliberately
// invalid — an unsupported type and an oversize scan — so the error paths in
// 6.1.5 are one tap away rather than something you have to contrive.
export const FILE_CATALOGUE = [
  { id: "f-id", name: "ID_copy.pdf", mime: "application/pdf", size: 1_258_291, kind: "PDF", valid: true },
  { id: "f-payslip", name: "payslip_Aug2026.pdf", mime: "application/pdf", size: 348_160, kind: "PDF", valid: true },
  { id: "f-statement", name: "benefit_statement.jpg", mime: "image/jpeg", size: 872_448, kind: "JPG", valid: true },
  { id: "f-docx", name: "bank_statement.docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 2_202_009, kind: "DOCX", valid: false, reject: "E_UPLOAD_TYPE" },
  { id: "f-huge", name: "scan_hi_res.png", mime: "image/png", size: 23_068_672, kind: "PNG", valid: false, reject: "E_UPLOAD_SIZE" },
];

// Documents the office has generated and made available for download.
function seedDocuments(cases, now) {
  const out = [];
  let seq = 310;
  cases.forEach((c) => {
    out.push({
      id: `doc-${seq}`, caseRef: c.ref, name: "Acknowledgement_of_complaint.pdf",
      kind: "PDF", size: 214_016, mime: "application/pdf",
      direction: "outbound", storedAt: c.lodgedAt + 2 * HOUR,
      respondDocId: respondDocId(seq), scanResult: "clean",
    });
    seq += 1;
    if (c.stage === "Determination issued" || c.stage === "Settled") {
      out.push({
        id: `doc-${seq}`, caseRef: c.ref, name: `Determination_${c.ref.replaceAll("/", "-")}.pdf`,
        kind: "PDF", size: 486_400, mime: "application/pdf",
        direction: "outbound", storedAt: now - 12 * DAY,
        respondDocId: respondDocId(seq), scanResult: "clean",
      });
      seq += 1;
    }
  });
  return out;
}

// ─── Conversations ────────────────────────────────────────────────────────────

// One live conversation per persona, pre-seeded so neither app ever opens on
// an empty state. The persona the simulator is "holding" writes into its own
// conversation; the others sit in the console queue as ambient traffic.
function seedConversations(now) {
  return PERSONAS.map((p, i) => {
    const lastInboundAt = now - p.windowAgeMs;
    const opening = p.consent === "pending"
      ? [
          sysMsg(`c-${p.id}-0`, now - p.windowAgeMs - 1 * MIN, "Conversation started from the OPFA website WhatsApp link."),
        ]
      : [
          sysMsg(`c-${p.id}-0`, lastInboundAt - 4 * MIN, "Conversation started."),
          inMsg(`c-${p.id}-1`, lastInboundAt, "Hi", { intent: "greeting", confidence: 0.91, band: "high", alternatives: [] }),
        ];
    return {
      id: `conv-${i + 1}`,
      personaId: p.id,
      msisdn: p.msisdn,
      contactName: p.name,
      mode: "bot",
      assignedTo: null,
      lastInboundAt,
      windowExpiresAt: windowExpiry(lastInboundAt),
      unread: 0,
      csat: null,
      tags: [],
      messages: opening,
    };
  });
}

const sysMsg = (id, at, body) => ({
  id, wamid: null, dir: "system", at, type: "system", body,
  interactive: null, status: null, author: "system", nlu: null, templateName: null,
});

const inMsg = (id, at, body, nlu = null) => ({
  id, wamid: wamid(id), dir: "in", at, type: "text", body,
  interactive: null, status: "read", author: "citizen", nlu, templateName: null,
});

// ─── Historical traffic ───────────────────────────────────────────────────────

// Thirty resolved conversations spread over the last seven days, so the
// reporting views have something to aggregate on first load. Generated from a
// fixed seed — the dashboard reads the same on every machine in the room.
const HISTORY_INTENTS = [
  "track_case", "track_case", "track_case", "upload_docs", "download_doc",
  "update_contact", "settlement", "lodge_complaint", "faq", "faq", "agent", "unknown",
];

function seedHistory(now) {
  const rnd = seededRandom("opfa-history-v1");
  const out = [];
  for (let i = 0; i < 30; i++) {
    const intent = HISTORY_INTENTS[Math.floor(rnd() * HISTORY_INTENTS.length)];
    // Escalation is the exception, not the rule: a bot that hands off half its
    // traffic has not deflected anything, and the containment figure should be
    // one the office would actually recognise.
    const escalated = intent === "agent" || intent === "unknown" ? rnd() < 0.8 : rnd() < 0.12;
    const at = now - Math.floor(rnd() * 7 * DAY);
    out.push({
      id: `h-${i + 1}`,
      at,
      intent,
      confidence: intent === "unknown" ? +(0.1 + rnd() * 0.28).toFixed(2) : +(0.55 + rnd() * 0.42).toFixed(2),
      turns: 2 + Math.floor(rnd() * 9),
      escalated,
      agentId: escalated ? AGENTS[Math.floor(rnd() * 3)].id : null,
      firstResponseSec: escalated ? 20 + Math.floor(rnd() * 240) : 1,
      handleSec: escalated ? 180 + Math.floor(rnd() * 700) : 30 + Math.floor(rnd() * 120),
      csat: rnd() < 0.72 ? 3 + Math.floor(rnd() * 3) : null,
      fallbacks: intent === "unknown" ? 1 + Math.floor(rnd() * 2) : rnd() < 0.18 ? 1 : 0,
    });
  }
  return out.sort((a, b) => b.at - a.at);
}

// ─── Integrations ─────────────────────────────────────────────────────────────

export function seedIntegrations(now) {
  return [
    {
      id: "respond", name: "Respond Case Management", vendor: "Respond · .NET / SQL Server 2019",
      protocol: "REST (XML)", status: "healthy", endpoint: "https://respond.pfa.org.za/api/v2",
      lastCallAt: now - 3 * MIN, latencyMs: 214, successRate: 99.4, queued: 0,
      note: "Case retrieve, create, update and search. Bearer token over mutual TLS.",
    },
    {
      id: "sharepoint", name: "SharePoint Online", vendor: "Microsoft 365",
      protocol: "Graph API", status: "healthy", endpoint: "https://pfa.sharepoint.com/sites/Complaints",
      lastCallAt: now - 26 * MIN, latencyMs: 388, successRate: 99.9, queued: 0,
      note: "Document library for complainant uploads. Files land in the case folder.",
    },
    {
      id: "entra", name: "Microsoft Entra ID", vendor: "Microsoft",
      protocol: "OIDC / SAML 2.0", status: "healthy", endpoint: "https://login.microsoftonline.com/pfa.org.za",
      lastCallAt: now - 51 * MIN, latencyMs: 142, successRate: 100, queued: 0,
      note: "Console SSO with on-prem AD sync. MFA enforced by conditional access.",
    },
    {
      id: "meta", name: "WhatsApp Business Platform", vendor: "Meta · Cloud API v21.0",
      protocol: "HTTPS / Webhooks", status: "healthy", endpoint: "https://graph.facebook.com/v21.0",
      lastCallAt: now - 1 * MIN, latencyMs: 176, successRate: 99.8, queued: 0,
      note: "Verified business account. Webhook subscribed to messages and statuses.",
    },
    {
      id: "veeam", name: "Veeam Backup", vendor: "Veeam",
      protocol: "Agent", status: "degraded", endpoint: "veeam-01.pfa.local",
      lastCallAt: now - 4 * HOUR, latencyMs: null, successRate: 97.2, queued: 1,
      note: "DR replication to the secondary site on a 15-minute RPO. One job retrying.",
    },
  ];
}

// POPIA / ECT Act / Meta policy controls, each mapped to the clause it answers
// (6.1.9). A compliance claim with no clause behind it is a slogan.
export const COMPLIANCE = [
  { id: "c1", framework: "POPIA", clause: "s11 — Consent", control: "Opt-in captured before any non-service message; consent record retains method, timestamp and policy version.", status: "met" },
  { id: "c2", framework: "POPIA", clause: "s14 — Retention", control: "Conversation transcripts retained 5 years in line with the OPFA retention schedule, then purged.", status: "met" },
  { id: "c3", framework: "POPIA", clause: "s19 — Security safeguards", control: "TLS 1.3 in transit, AES-256 at rest, PII masked in the console by default.", status: "met" },
  { id: "c4", framework: "POPIA", clause: "s22 — Breach notification", control: "Security events raise an ALERT audit entry and page the on-call ICT officer.", status: "met" },
  { id: "c5", framework: "POPIA", clause: "s18 — Notification to data subject", control: "Purpose of processing stated at first contact and linked to the OPFA privacy notice.", status: "met" },
  { id: "c6", framework: "ECT Act", clause: "s43 — Information to consumers", control: "Business identity, contact details and complaints process disclosed in the welcome message.", status: "met" },
  { id: "c7", framework: "ECT Act", clause: "s45 — Unsolicited communications", control: "Every marketing-category message carries an opt-out instruction; STOP is honoured immediately.", status: "met" },
  { id: "c8", framework: "Meta", clause: "Business Messaging Policy", control: "Free-form replies only inside the 24-hour service window; outside it, approved templates only.", status: "met" },
  { id: "c9", framework: "Meta", clause: "Commerce & Messaging Policy", control: "Marketing templates gated on a separate marketing consent flag, not the service opt-in.", status: "met" },
  { id: "c10", framework: "Meta", clause: "Template quality rating", control: "Templates below GREEN quality are flagged in the console before use.", status: "partial" },
];

// ─── The seed ─────────────────────────────────────────────────────────────────

export function seedState() {
  const now = Date.now();
  const cases = seedCases(now);
  const conversations = seedConversations(now);

  return {
    seededAt: now,
    clockOffsetMs: 0,

    activePersonaId: PERSONAS[0].id,

    personas: PERSONAS.map((p) => ({
      id: p.id,
      name: p.name,
      first: p.first,
      initials: p.initials,
      note: p.note,
      msisdn: p.msisdn,
      idNumber: p.idNumber,
      email: p.email,
      verified: p.verified,
      profileLocked: false,
      consent: {
        status: p.consent,
        capturedAt: p.consent === "opted_in" ? now - 40 * DAY : null,
        method: p.consent === "opted_in" ? "WhatsApp opt-in reply" : null,
        policyVersion: "OPFA-WA-1.0",
        prefs: { service: true, reminders: p.consent === "opted_in", marketing: false },
        history: p.consent === "opted_in"
          ? [{ at: now - 40 * DAY, action: "opted_in", actor: p.name, channel: "whatsapp", policyVersion: "OPFA-WA-1.0", ip: "102.132.14.7" }]
          : [],
      },
      otp: { code: null, issuedAt: null, expiresAt: null, attempts: 0, resends: 0, purpose: null, lockedUntil: null },
    })),

    cases,
    documents: seedDocuments(cases, now),
    conversations,
    sessions: {},          // conversation id -> bot session { nodeId, stack, slots, retries }

    agents: AGENTS.map((a) => ({ ...a })),
    templates: TEMPLATES.map((t) => ({ ...t, lastUsedAt: null, sent: 0 })),
    history: seedHistory(now),
    integrations: seedIntegrations(now),
    feedback: [],

    console: {
      userId: "AG-01",
      role: "admin",
      mfaVerified: false,
      sessionStartedAt: null,
      sessionExpiresAt: null,
      revealedPii: [],
    },

    audit: [
      { id: "aud-3", at: now - 12 * MIN, actor: "system", action: "WEBHOOK_RECEIVED", entity: "conversation", entityId: "conv-1", detail: "Inbound message webhook processed", ip: "31.13.66.4", severity: "INFO" },
      { id: "aud-2", at: now - 48 * MIN, actor: "AG-03", action: "CASE_VIEWED", entity: "case", entityId: cases[0].ref, detail: "Case record opened from Inbox context panel", ip: "10.20.3.44", severity: "INFO" },
      { id: "aud-1", at: now - 3 * HOUR, actor: "AG-01", action: "CONSOLE_SIGN_IN", entity: "session", entityId: "AG-01", detail: "Entra ID SSO, MFA satisfied (authenticator app)", ip: "10.20.3.41", severity: "NOTICE" },
    ],

    wire: [],
    seq: { msg: 0, audit: 3, wire: 0, doc: 400, case: 540, ticket: 0 },
  };
}

export const WINDOW_HOURS = WINDOW_MS / HOUR;
export const fundById = (id) => FUNDS.find((f) => f.id === id);
export const employerById = (id) => EMPLOYERS.find((e) => e.id === id);
export const agentById = (id) => AGENTS.find((a) => a.id === id);
export const templateByName = (list, name) => list.find((t) => t.name === name);
