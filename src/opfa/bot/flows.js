// The conversation graph, as data.
//
// A new self-service journey should be a new entry in this file and nothing
// else: the engine is a pure function over these nodes, and no node imports
// React, touches the store or builds a wire payload. Actions describe the
// effects they want; the caller applies them.
//
// Node kinds
//   say      a message, then move on
//   list     a WhatsApp list message; each row names its next node
//   buttons  up to three reply buttons; each names its next node
//   prompt   capture free text into a slot, with validation and retries
//   action   run a pure function that returns messages, effects and a next node
//   end      close the turn and wait
//
// Every list, buttons and prompt node also accepts the global escapes the
// engine injects: 0 or MENU for the main menu, 9 for a consultant, STOP to
// opt out. They are not declared per node — declaring them 30 times is how
// one of them ends up missing.
import { ORG } from "../brand.jsx";
import {
  CASE_REF_RE, shortDate, bytes, prettyMsisdn, fillTemplate,
} from "../helpers.js";
import { fundById } from "../data.js";
import { searchFaq, FAQS } from "./faq.js";

// ─── Rendering helpers ────────────────────────────────────────────────────────

const money = (n) => `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;

// What the complainant actually wants to know, in the order they want it.
function renderCaseStatus(c) {
  const fund = fundById(c.fundId);
  const last = c.timeline[c.timeline.length - 1];
  return [
    `*${c.ref}*`,
    c.subject,
    "",
    `*Status:* ${c.stage}`,
    `*Lodged:* ${shortDate(c.lodgedAt)}`,
    `*Fund:* ${fund?.name || "—"}`,
    `*Amount in dispute:* ${money(c.amount)}`,
    `*Adjudicator:* ${c.adjudicator}`,
    "",
    `_${last?.note || ""}_`,
  ].join("\n");
}

const caseRow = (c) => ({
  id: `case:${c.ref}`,
  title: c.ref,
  description: `${c.stage} · ${c.subject.slice(0, 48)}`,
});

// ─── The graph ────────────────────────────────────────────────────────────────

export const FLOWS = {

  // ── Welcome and consent ────────────────────────────────────────────────────

  welcome: {
    kind: "say",
    body: ({ persona }) =>
      `Good day${persona.first ? ` ${persona.first}` : ""} 👋\n\n` +
      `You're chatting with the *Office of the Pension Funds Adjudicator*. ` +
      `I can help you track a complaint, send us documents, update your details ` +
      `or answer common questions.\n\n` +
      `This service is free. Our consultants are available ${ORG.hours}.`,
    next: "consent_gate",
  },

  // Consent is a gate, not a step: it sits in front of anything that would
  // disclose or store personal information (POPIA s11), and it is checked on
  // every entry rather than remembered as "we asked once".
  consent_gate: {
    kind: "action",
    run: ({ persona }) => (
      persona.consent.status === "opted_in"
        ? { next: "main_menu" }
        : persona.consent.status === "opted_out"
          ? { next: "reconsent" }
          : { next: "consent_ask" }
    ),
  },

  consent_ask: {
    kind: "buttons",
    body:
      "Before we continue, I need your permission to communicate with you on WhatsApp about your complaint.\n\n" +
      "We'll use your cellphone number, ID number and email address only to deal with your complaint, " +
      "in terms of the Protection of Personal Information Act.\n\n" +
      "You can reply *STOP* at any time to opt out.",
    footer: "Privacy notice: www.pfa.org.za/privacy",
    buttons: [
      { id: "consent_yes", title: "I agree", next: "consent_captured" },
      { id: "consent_info", title: "How is it used?", next: "consent_detail" },
      { id: "consent_no", title: "Not now", next: "consent_declined" },
    ],
  },

  consent_detail: {
    kind: "say",
    body:
      "*How we use your information*\n\n" +
      "• *What we collect:* your name, ID number, cellphone number, email address and the documents you send us.\n" +
      "• *Why:* to identify you, to investigate your complaint and to keep you updated.\n" +
      "• *Who sees it:* OPFA staff handling your complaint, and the fund or employer the complaint is against.\n" +
      "• *How long:* five years after your complaint is closed, in line with our retention schedule.\n" +
      "• *Your rights:* you may ask to see, correct or delete your information, and you may complain to the Information Regulator.\n\n" +
      "Messages are encrypted end-to-end by WhatsApp in transit, and stored encrypted by us.",
    next: "consent_ask",
  },

  consent_captured: {
    kind: "action",
    run: () => ({
      effects: [{ type: "captureConsent", method: "WhatsApp opt-in reply" }],
      say: [{ body: "Thank you. Your consent has been recorded and you can withdraw it at any time by replying *STOP*." }],
      next: "main_menu",
    }),
  },

  consent_declined: {
    kind: "buttons",
    body:
      "That's fine. Without consent I can't discuss a specific complaint here, but I can still answer general questions.\n\n" +
      `You can also reach us on ${ORG.tel} or ${ORG.email}.`,
    buttons: [
      { id: "faq", title: "General questions", next: "faq_menu" },
      { id: "consent_yes", title: "Actually, I agree", next: "consent_captured" },
    ],
  },

  reconsent: {
    kind: "buttons",
    body:
      "You previously opted out of WhatsApp messages from the OPFA, so I can't share complaint information here.\n\n" +
      "Would you like to opt back in?",
    buttons: [
      { id: "consent_yes", title: "Yes, opt me in", next: "consent_captured" },
      { id: "faq", title: "General questions", next: "faq_menu" },
    ],
  },

  // ── Main menu (6.1.5 multilevel conversation menus) ─────────────────────────

  main_menu: {
    kind: "list",
    header: "OPFA Self-Service",
    body: ({ persona }) => `How can I help you${persona.first ? `, ${persona.first}` : ""}?`,
    footer: "Office of the Pension Funds Adjudicator",
    button: "Open menu",
    sections: [
      {
        title: "My complaint",
        rows: [
          { id: "track", title: "Track my complaint", description: "Status and progress updates", next: "track_entry" },
          { id: "lodge", title: "Lodge a complaint", description: "Start a new complaint", next: "lodge_link" },
          { id: "settle", title: "Confirm settlement", description: "The fund or employer has paid", next: "settle_pick_case" },
        ],
      },
      {
        title: "Documents and details",
        rows: [
          { id: "docs", title: "Documents", description: "Send or download documents", next: "docs_menu" },
          { id: "profile", title: "My details", description: "View or update your contact details", next: "profile_menu" },
        ],
      },
      {
        title: "Help",
        rows: [
          { id: "faq", title: "Common questions", description: "How long, what it costs, what we cover", next: "faq_menu" },
          { id: "agent", title: "Talk to a consultant", description: ORG.hours, next: "handoff" },
        ],
      },
    ],
  },

  // ── Track a complaint (6.1.2) ──────────────────────────────────────────────

  track_entry: {
    kind: "action",
    // If the caller already has exactly one complaint, asking for a reference
    // number they have to go and find is friction for its own sake.
    run: ({ cases, slots }) => {
      if (slots.caseRef) return { next: "fetch_case" };
      if (cases.length === 0) return { error: "E_NO_CASES" };
      if (cases.length === 1) return { slots: { caseRef: cases[0].ref }, next: "fetch_case" };
      return { next: "pick_case" };
    },
  },

  pick_case: {
    kind: "list",
    header: "Your complaints",
    body: "You have more than one complaint with us. Which one would you like to check?",
    button: "Choose a complaint",
    sections: [{
      title: "Registered to this number",
      rows: ({ cases }) => cases.map((c) => ({ ...caseRow(c), next: "fetch_case" })),
    }],
    slot: "caseRef",
    // Row ids arrive as "case:PFA/GP/00482/2026/SM"; the engine strips the
    // prefix into the slot named above.
    slotFrom: (id) => id.replace(/^case:/, ""),
  },

  ask_case_ref: {
    kind: "prompt",
    body:
      "Please send me your *case reference number*.\n\n" +
      "It looks like this: *PFA/GP/00482/2026/SM*\n" +
      "You'll find it on the SMS or email we sent when your complaint was lodged.",
    slot: "caseRef",
    normalise: (v) => v.trim().toUpperCase().replace(/\s+/g, ""),
    validate: (v, { cases, allCases }) => {
      if (!CASE_REF_RE.test(v)) return { ok: false, code: "E_REF_FORMAT" };
      const mine = cases.some((c) => c.ref === v);
      // A reference that exists but belongs to someone else must not be
      // distinguishable from one that does not exist at all — otherwise this
      // becomes a way to confirm whether a given reference is real.
      if (!mine && !allCases.some((c) => c.ref === v)) return { ok: false, code: "E_REF_NOT_FOUND", vars: { caseRef: v } };
      if (!mine) return { ok: false, code: "E_REF_NOT_FOUND", vars: { caseRef: v } };
      return { ok: true, value: v };
    },
    maxRetries: 2,
    onValid: "fetch_case",
    onExhausted: "handoff_offer",
  },

  fetch_case: {
    kind: "action",
    run: ({ cases, slots }) => {
      const c = cases.find((x) => x.ref === slots.caseRef);
      if (!c) return { error: "E_REF_NOT_FOUND", vars: { caseRef: slots.caseRef } };
      return {
        respond: { kind: "getCase", ref: c.ref },
        say: [{ body: renderCaseStatus(c) }],
        next: "post_status_menu",
      };
    },
  },

  post_status_menu: {
    kind: "buttons",
    body: "Anything else on this complaint?",
    buttons: [
      { id: "timeline", title: "Full history", next: "case_timeline" },
      { id: "docs", title: "Documents", next: "docs_menu" },
      { id: "menu", title: "Main menu", next: "main_menu" },
    ],
  },

  case_timeline: {
    kind: "action",
    run: ({ cases, slots }) => {
      const c = cases.find((x) => x.ref === slots.caseRef);
      if (!c) return { error: "E_REF_NOT_FOUND", vars: { caseRef: slots.caseRef } };
      return {
        say: [{
          body: `*History of ${c.ref}*\n\n` +
            c.timeline.map((t) => `*${shortDate(t.at)}* — ${t.stage}\n_${t.note}_`).join("\n\n"),
        }],
        next: "post_status_menu",
      };
    },
  },

  // Identity-first alternative when the reference is lost.
  ask_id_number: {
    kind: "prompt",
    body: "No problem. Please send me your *13-digit South African ID number* and I'll look up your complaints.",
    slot: "idNumber",
    normalise: (v) => v.replace(/\D/g, ""),
    validate: (v, { persona }) => {
      if (!/^\d{13}$/.test(v)) return { ok: false, code: "E_ID_FORMAT" };
      if (v !== persona.idNumber) return { ok: false, code: "E_ID_MISMATCH" };
      return { ok: true, value: v };
    },
    maxRetries: 2,
    onValid: "list_my_cases",
    onExhausted: "handoff_offer",
  },

  list_my_cases: {
    kind: "action",
    run: ({ cases, persona }) => {
      if (!cases.length) return { error: "E_NO_CASES" };
      return {
        respond: { kind: "searchCases", idNumber: persona.idNumber },
        say: [{
          body: `I found *${cases.length}* complaint${cases.length === 1 ? "" : "s"} registered to your ID number.`,
        }],
        next: "pick_case",
      };
    },
  },

  // ── Lodge a complaint (6.1.2 — URL link to the OPFA website) ────────────────

  lodge_link: {
    kind: "buttons",
    body:
      "A new complaint is lodged on our website, where you can upload your supporting documents at the same time:\n\n" +
      `${ORG.lodgeUrl}\n\n` +
      "*Before you start, please make sure you have:*\n" +
      "• Your ID number\n" +
      "• The name of the fund or your employer\n" +
      "• Proof that you complained to the fund and gave them *30 days* to respond\n\n" +
      "As soon as your complaint is registered I'll send you the reference number right here.",
    footer: "Lodging a complaint is free",
    buttons: [
      { id: "simulate_lodged", title: "I've submitted it", next: "issue_reference" },
      { id: "faq", title: "What do I need?", next: "faq_menu" },
      { id: "menu", title: "Main menu", next: "main_menu" },
    ],
  },

  issue_reference: {
    kind: "action",
    // Issuing the reference number is the moment the bid calls out by name:
    // "receive progress updates on their complaints including issuing of the
    // case reference number when the complaint is lodged".
    run: () => ({
      effects: [{ type: "lodgeCase" }],
      template: { name: "case_reference_issued", slotFrom: "newCaseRef" },
      next: "post_lodge_menu",
    }),
  },

  post_lodge_menu: {
    kind: "buttons",
    body: "What would you like to do next?",
    buttons: [
      { id: "docs", title: "Send documents", next: "docs_menu" },
      { id: "menu", title: "Main menu", next: "main_menu" },
    ],
  },

  // ── Documents (6.1.4) ──────────────────────────────────────────────────────
  //
  // This journey is deliberately three levels deep — Documents → My documents
  // → a complaint → a document — because 6.1.5 asks for multilevel menus and a
  // two-level one does not demonstrate that the stack works.

  docs_menu: {
    kind: "list",
    header: "Documents",
    body: "What would you like to do?",
    button: "Choose",
    sections: [{
      title: "Documents",
      rows: [
        { id: "upload", title: "Send us a document", description: "ID copy, payslip, bank statement", next: "docs_upload" },
        { id: "download", title: "My documents", description: "Determinations and correspondence", next: "docs_pick_case" },
        { id: "back", title: "Back", description: "Return to the main menu", next: "main_menu" },
      ],
    }],
  },

  docs_upload: {
    kind: "action",
    run: ({ cases, slots }) => {
      if (!cases.length) return { error: "E_NO_CASES" };
      if (!slots.caseRef && cases.length > 1) return { next: "docs_upload_pick" };
      return { slots: { caseRef: slots.caseRef || cases[0].ref }, next: "docs_upload_prompt" };
    },
  },

  docs_upload_pick: {
    kind: "list",
    header: "Which complaint?",
    body: "Which complaint is this document for?",
    button: "Choose a complaint",
    sections: [{
      title: "Your complaints",
      rows: ({ cases }) => cases.map((c) => ({ ...caseRow(c), next: "docs_upload_prompt" })),
    }],
    slot: "caseRef",
    slotFrom: (id) => id.replace(/^case:/, ""),
  },

  docs_upload_prompt: {
    kind: "prompt",
    body: ({ slots }) =>
      `Please attach the document for *${slots.caseRef}* using the 📎 button below.\n\n` +
      "I can accept *PDF, JPG or PNG* files up to *16 MB*.",
    // Waits for an attachment rather than text; the engine routes a document
    // input here to `onDocument`.
    expects: "document",
    onDocument: "docs_store",
    maxRetries: 2,
    onExhausted: "handoff_offer",
  },

  docs_store: {
    kind: "action",
    run: ({ slots, document: file }) => {
      if (!file) return { error: "E_NO_MATCH" };
      if (!file.valid && file.reject === "E_UPLOAD_TYPE") {
        return { error: "E_UPLOAD_TYPE", vars: { name: file.name, kind: file.kind }, next: "docs_upload_prompt" };
      }
      if (!file.valid && file.reject === "E_UPLOAD_SIZE") {
        return { error: "E_UPLOAD_SIZE", vars: { name: file.name, size: bytes(file.size) }, next: "docs_upload_prompt" };
      }
      return {
        effects: [{ type: "addDocument", caseRef: slots.caseRef, file }],
        respond: { kind: "postDocument", ref: slots.caseRef, file },
        template: { name: "document_received", params: [file.name, slots.caseRef] },
        next: "docs_after_upload",
      };
    },
  },

  docs_after_upload: {
    kind: "buttons",
    body: "Would you like to send anything else?",
    buttons: [
      { id: "upload", title: "Send another", next: "docs_upload_prompt" },
      { id: "track", title: "Check my complaint", next: "track_entry" },
      { id: "menu", title: "Main menu", next: "main_menu" },
    ],
  },

  docs_pick_case: {
    kind: "action",
    run: ({ cases }) => {
      if (!cases.length) return { error: "E_NO_CASES" };
      if (cases.length === 1) return { slots: { caseRef: cases[0].ref }, next: "docs_pick_file" };
      return { next: "docs_pick_case_list" };
    },
  },

  docs_pick_case_list: {
    kind: "list",
    header: "My documents",
    body: "Which complaint's documents would you like?",
    button: "Choose a complaint",
    sections: [{
      title: "Your complaints",
      rows: ({ cases }) => cases.map((c) => ({ ...caseRow(c), next: "docs_pick_file" })),
    }],
    slot: "caseRef",
    slotFrom: (id) => id.replace(/^case:/, ""),
  },

  docs_pick_file: {
    kind: "list",
    header: "Available documents",
    body: ({ slots }) => `Documents on file for *${slots.caseRef}*:`,
    button: "Choose a document",
    sections: [{
      title: "Documents",
      rows: ({ documents, slots }) => {
        const rows = documents
          .filter((d) => d.caseRef === slots.caseRef && d.direction === "outbound")
          .map((d) => ({
            id: `doc:${d.id}`,
            title: d.name.length > 24 ? `${d.name.slice(0, 22)}…` : d.name,
            description: `${d.kind} · ${bytes(d.size)} · ${shortDate(d.storedAt)}`,
            next: "docs_send_file",
          }));
        return rows.length ? rows : [
          { id: "none", title: "No documents yet", description: "Nothing has been issued on this complaint", next: "docs_menu" },
        ];
      },
    }],
    slot: "documentId",
    slotFrom: (id) => id.replace(/^doc:/, ""),
  },

  docs_send_file: {
    kind: "action",
    run: ({ documents, slots }) => {
      const d = documents.find((x) => x.id === slots.documentId);
      if (!d) return { error: "E_NO_MATCH", next: "docs_menu" };
      return {
        sharepoint: { kind: "fetch", ref: d.caseRef, file: d },
        say: [{
          body: `Here is *${d.name}*.`,
          attachment: { name: d.name, size: bytes(d.size), kind: d.kind },
        }],
        next: "docs_after_download",
      };
    },
  },

  docs_after_download: {
    kind: "buttons",
    body: "Anything else?",
    buttons: [
      { id: "download", title: "Another document", next: "docs_pick_file" },
      { id: "agent", title: "Talk to a consultant", next: "handoff" },
      { id: "menu", title: "Main menu", next: "main_menu" },
    ],
  },

  // ── Profile and contact details (6.1.3) ────────────────────────────────────

  profile_menu: {
    kind: "list",
    header: "My details",
    body: "What would you like to do?",
    button: "Choose",
    sections: [{
      title: "My details",
      rows: [
        { id: "view", title: "View my details", description: "What we have on record", next: "profile_view" },
        { id: "cell", title: "Change my cellphone", description: "Requires verification", next: "profile_start_cell" },
        { id: "email", title: "Change my email", description: "Requires verification", next: "profile_start_email" },
        { id: "back", title: "Back", description: "Return to the main menu", next: "main_menu" },
      ],
    }],
  },

  profile_view: {
    kind: "action",
    // Displayed partially masked even to the account holder: WhatsApp messages
    // persist on a device that may be shared or shoulder-surfed.
    run: ({ persona }) => ({
      say: [{
        body: [
          "*Your details on record*",
          "",
          `*Name:* ${persona.name}`,
          `*ID number:* ${persona.idNumber.slice(0, 6)}•••••${persona.idNumber.slice(-2)}`,
          `*Cellphone:* ${prettyMsisdn(persona.msisdn)}`,
          `*Email:* ${persona.email}`,
          "",
          "_Partially hidden for your security._",
        ].join("\n"),
      }],
      next: "profile_menu",
    }),
  },

  profile_start_cell: {
    kind: "action",
    run: ({ persona }) => (
      persona.profileLocked
        ? { error: "E_OTP_ATTEMPTS" }
        : { slots: { field: "msisdn" }, effects: [{ type: "issueOtp", purpose: "change_cellphone" }], next: "otp_prompt" }
    ),
  },

  profile_start_email: {
    kind: "action",
    run: ({ persona }) => (
      persona.profileLocked
        ? { error: "E_OTP_ATTEMPTS" }
        : { slots: { field: "email" }, effects: [{ type: "issueOtp", purpose: "change_email" }], next: "otp_prompt" }
    ),
  },

  otp_prompt: {
    kind: "prompt",
    body:
      "For your security I've sent a *6-digit verification code* to the cellphone number on record.\n\n" +
      "Please reply with the code. It expires in 5 minutes.",
    slot: "otp",
    normalise: (v) => v.replace(/\D/g, ""),
    // Verification is stateful, so it runs as an effect rather than in
    // `validate` — the engine stays pure and the attempt counter lives in one
    // place.
    verify: "otp",
    maxRetries: 3,
    onValid: "profile_capture",
    onExhausted: "handoff_offer",
  },

  profile_capture: {
    kind: "prompt",
    body: ({ slots }) => slots.field === "msisdn"
      ? "Verified ✅\n\nPlease send me your *new cellphone number*, starting with 0."
      : "Verified ✅\n\nPlease send me your *new email address*.",
    slot: "newValue",
    normalise: (v) => v.trim(),
    validate: (v, { slots }) => {
      if (slots.field === "msisdn") {
        const digits = v.replace(/\D/g, "");
        if (!/^(0\d{9}|27\d{9})$/.test(digits)) {
          return { ok: false, code: "E_MENU_INVALID", vars: { input: v } };
        }
        return { ok: true, value: `+27 ${digits.slice(-9, -7)} ${digits.slice(-7, -4)} ${digits.slice(-4)}` };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        return { ok: false, code: "E_MENU_INVALID", vars: { input: v } };
      }
      return { ok: true, value: v };
    },
    maxRetries: 2,
    onValid: "profile_save",
    onExhausted: "handoff_offer",
  },

  profile_save: {
    kind: "action",
    run: ({ slots, persona }) => ({
      effects: [{ type: "updateProfile", field: slots.field, value: slots.newValue }],
      respond: { kind: "patchContact", field: slots.field, value: slots.newValue, persona },
      say: [{
        body: `Done — your ${slots.field === "msisdn" ? "cellphone number" : "email address"} has been updated to *${slots.newValue}*.\n\n` +
          "The change has been recorded on your complaint file.",
      }],
      next: "profile_menu",
    }),
  },

  // ── Settlement confirmation (6.1.2) ────────────────────────────────────────

  settle_pick_case: {
    kind: "action",
    run: ({ cases }) => {
      const open = cases.filter((c) => !["Settled", "Closed"].includes(c.stage));
      if (!open.length) return { error: "E_NO_CASES" };
      if (open.length === 1) return { slots: { caseRef: open[0].ref }, next: "settle_confirm" };
      return { next: "settle_pick_list" };
    },
  },

  settle_pick_list: {
    kind: "list",
    header: "Confirm settlement",
    body: "Which complaint has been settled?",
    button: "Choose a complaint",
    sections: [{
      title: "Open complaints",
      rows: ({ cases }) => cases
        .filter((c) => !["Settled", "Closed"].includes(c.stage))
        .map((c) => ({ ...caseRow(c), next: "settle_confirm" })),
    }],
    slot: "caseRef",
    slotFrom: (id) => id.replace(/^case:/, ""),
  },

  settle_confirm: {
    kind: "buttons",
    body: ({ slots, cases }) => {
      const c = cases.find((x) => x.ref === slots.caseRef);
      return `Complaint *${slots.caseRef}*${c ? `\n_${c.subject}_` : ""}\n\n` +
        "Has the fund or your employer paid you the amount in dispute?";
    },
    buttons: [
      { id: "paid", title: "Yes, I've been paid", next: "settle_paid" },
      { id: "not_paid", title: "No, not yet", next: "settle_unpaid" },
      { id: "menu", title: "Main menu", next: "main_menu" },
    ],
  },

  settle_paid: {
    kind: "action",
    run: ({ slots }) => ({
      effects: [{ type: "confirmSettlement", caseRef: slots.caseRef, outcome: "paid" }],
      respond: { kind: "acknowledge", label: "200 OK · Settlement recorded" },
      say: [{
        body: `Thank you. I've recorded that *${slots.caseRef}* has been settled.\n\n` +
          "The Adjudicator will close the file. If the payment is later reversed or short-paid, " +
          "message us here and we'll reopen it.",
      }],
      next: "csat_ask",
    }),
  },

  settle_unpaid: {
    kind: "action",
    run: ({ slots }) => ({
      effects: [{ type: "confirmSettlement", caseRef: slots.caseRef, outcome: "unpaid" }],
      say: [{
        body: `Noted — *${slots.caseRef}* has *not* been paid.\n\n` +
          "A determination may be enforced as if it were a civil court judgment. " +
          "I'm passing this to a consultant to follow up with the fund.",
      }],
      next: "handoff",
    }),
  },

  csat_ask: {
    kind: "buttons",
    body: "How would you rate this conversation?",
    footer: "Your feedback helps us improve the service",
    buttons: [
      { id: "csat:5", title: "⭐ Very helpful", next: "csat_thanks" },
      { id: "csat:3", title: "⭐ It was fine", next: "csat_thanks" },
      { id: "csat:1", title: "⭐ Not helpful", next: "csat_thanks" },
    ],
    slot: "csat",
    slotFrom: (id) => id.replace(/^csat:/, ""),
  },

  csat_thanks: {
    kind: "action",
    run: ({ slots }) => ({
      effects: [{ type: "recordCsat", score: Number(slots.csat) || null }],
      say: [{ body: "Thank you for your feedback. You can message us here any time." }],
      next: "idle",
    }),
  },

  // ── FAQ (6.1.5) ────────────────────────────────────────────────────────────

  faq_menu: {
    kind: "list",
    header: "Common questions",
    body: "Choose a question, or just type your own and I'll do my best to answer it.",
    button: "Browse questions",
    sections: [{
      title: "Frequently asked",
      rows: () => FAQS.slice(0, 9).map((f) => ({
        id: `faq:${f.id}`,
        title: f.q.length > 24 ? `${f.q.slice(0, 22)}…` : f.q,
        description: f.q.length > 24 ? f.q.slice(0, 68) : " ",
        next: "faq_answer",
      })),
    }],
    slot: "faqId",
    slotFrom: (id) => id.replace(/^faq:/, ""),
  },

  faq_answer: {
    kind: "action",
    run: ({ slots }) => {
      const f = FAQS.find((x) => x.id === slots.faqId);
      if (!f) return { error: "E_NO_MATCH", next: "faq_menu" };
      return { say: [{ body: `*${f.q}*\n\n${f.a}` }], next: "faq_after" };
    },
  },

  // Free-text questions arrive here from the low-confidence branch of the NLU
  // tier. Answering from the corpus rather than escalating is what keeps the
  // containment rate honest.
  faq_lookup: {
    kind: "action",
    run: ({ input }) => {
      const hit = searchFaq(input?.text || "");
      if (!hit) return { error: "E_NO_MATCH" };
      return {
        say: [{ body: `*${hit.question}*\n\n${hit.answer}` }],
        faq: hit,
        next: "faq_after",
      };
    },
  },

  faq_after: {
    kind: "buttons",
    body: "Did that answer your question?",
    buttons: [
      { id: "yes", title: "Yes, thank you", next: "csat_ask" },
      { id: "more", title: "Another question", next: "faq_menu" },
      { id: "agent", title: "Talk to a consultant", next: "handoff" },
    ],
  },

  // ── Escalation (6.1.5 escalation to human agents) ──────────────────────────

  handoff_offer: {
    kind: "buttons",
    body:
      "I'm having trouble with that. Rather than keep you going in circles, let me put you through to a consultant.",
    buttons: [
      { id: "agent", title: "Yes, please", next: "handoff" },
      { id: "menu", title: "Back to the menu", next: "main_menu" },
    ],
  },

  handoff: {
    kind: "action",
    run: ({ queuePosition }) => ({
      effects: [{ type: "escalate" }],
      say: [{
        body: `I'm connecting you to an OPFA consultant.\n\n` +
          `You are number *${queuePosition}* in the queue. Our consultants are available ${ORG.hours}.\n\n` +
          "Everything you've told me so far goes through with you — you won't have to repeat yourself.",
      }],
      system: "Escalated to a consultant. The conversation is now in the agent queue.",
      next: "with_agent",
    }),
  },

  with_agent: { kind: "end" },
  idle: { kind: "end" },

  // ── Opt out (6.1.10) ───────────────────────────────────────────────────────

  opt_out: {
    kind: "buttons",
    body:
      "You've asked to stop receiving WhatsApp messages from the OPFA.\n\n" +
      "To confirm: you will no longer receive case updates, reminders or notifications on WhatsApp. " +
      "Your complaint remains open and we will contact you by email and SMS instead.",
    buttons: [
      { id: "optout_yes", title: "Yes, stop messages", next: "opt_out_done" },
      { id: "menu", title: "No, carry on", next: "main_menu" },
    ],
  },

  opt_out_done: {
    kind: "action",
    run: () => ({
      effects: [{ type: "optOut", reason: "Replied STOP and confirmed" }],
      say: [{
        body: "Done. You've been opted out of WhatsApp messages from the OPFA.\n\n" +
          "You can opt back in at any time by sending *START*. " +
          `You can still reach us on ${ORG.tel} or ${ORG.email}.`,
      }],
      next: "idle",
    }),
  },

  // ── Backend failure (6.1.5 failed lookups) ─────────────────────────────────

  backend_down: {
    kind: "action",
    run: ({ ticket }) => ({
      error: "E_BACKEND",
      vars: { ticket },
      respondFault: ticket,
    }),
  },
};

// Aliases for the global escapes, so "0" and "menu" resolve without the engine
// hard-coding node names in two places.
export const ESCAPES = {
  "0": "main_menu",
  "menu": "main_menu",
  "main menu": "main_menu",
  "9": "handoff",
  "agent": "handoff",
  "stop": "opt_out",
  "unsubscribe": "opt_out",
  "start": "consent_captured",
};

export const ENTRY_NODE = "welcome";

export { renderCaseStatus, fillTemplate };
