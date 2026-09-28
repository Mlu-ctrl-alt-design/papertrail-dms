// The exception catalogue.
//
// 6.1.5 asks, explicitly, that the solution handle "incorrect menu selections,
// incomplete inputs, invalid search criteria and failed lookups, while still
// providing clear guidance to users". That is a design constraint, not a
// caveat, so every error the bot can produce is declared here rather than
// assembled inline at the point of failure.
//
// Three invariants the engine enforces against this catalogue:
//   1. Every entry offers at least one recovery option. The conversation never
//      ends on an error.
//   2. A prompt retries twice, then offers a human. Nobody gets stuck in a
//      validation loop.
//   3. Every error writes an audit entry, so "we handled it" is demonstrable
//      rather than asserted.

export const ERRORS = {
  E_MENU_INVALID: {
    severity: "INFO",
    body: "Sorry — I didn't recognise *{{input}}*.\n\nPlease choose one of the options below, or reply *0* for the main menu.",
    options: [
      { id: "menu", title: "Main menu" },
      { id: "agent", title: "Talk to a consultant" },
    ],
  },

  E_REF_FORMAT: {
    severity: "INFO",
    body: "That doesn't look like an OPFA reference number.\n\nThe format is *PFA/GP/00482/2026/SM* — you'll find it on the SMS or email we sent when your complaint was lodged.",
    options: [
      { id: "retry", title: "Try again" },
      { id: "find_by_id", title: "I don't have it" },
      { id: "agent", title: "Talk to a consultant" },
    ],
  },

  E_REF_NOT_FOUND: {
    severity: "NOTICE",
    body: "I couldn't find complaint *{{caseRef}}*.\n\nIt may be registered against a different cellphone number, or it may not have been lodged yet.",
    options: [
      { id: "find_by_id", title: "Search by ID number" },
      { id: "lodge", title: "Lodge a complaint" },
      { id: "agent", title: "Talk to a consultant" },
    ],
  },

  E_NO_CASES: {
    severity: "NOTICE",
    body: "There are no complaints registered against this cellphone number.\n\nIf you lodged a complaint using a different number, a consultant can link it for you.",
    options: [
      { id: "lodge", title: "Lodge a complaint" },
      { id: "agent", title: "Talk to a consultant" },
    ],
  },

  E_ID_FORMAT: {
    severity: "INFO",
    body: "A South African ID number is 13 digits. Please check and send it again, without spaces.",
    options: [
      { id: "retry", title: "Try again" },
      { id: "agent", title: "Talk to a consultant" },
    ],
  },

  E_ID_MISMATCH: {
    severity: "SECURITY",
    body: "That ID number doesn't match our records for this cellphone number.\n\nFor your protection I can't continue with this request here.",
    options: [
      { id: "agent", title: "Talk to a consultant" },
      { id: "menu", title: "Main menu" },
    ],
  },

  E_OTP_MISMATCH: {
    severity: "SECURITY",
    body: "That code is not correct. You have *{{remaining}}* attempt(s) left.\n\nPlease check the code we sent and try again.",
    options: [
      { id: "resend", title: "Send a new code" },
      { id: "agent", title: "Talk to a consultant" },
    ],
  },

  E_OTP_EXPIRED: {
    severity: "INFO",
    body: "That code has expired — codes are valid for 5 minutes.",
    options: [
      { id: "resend", title: "Send a new code" },
      { id: "menu", title: "Main menu" },
    ],
  },

  E_OTP_ATTEMPTS: {
    severity: "ALERT",
    body: "Too many incorrect codes. For your security, self-service changes are locked for *15 minutes* and this conversation has been flagged for a consultant.\n\nYour complaint information has not been accessed.",
    options: [
      { id: "agent", title: "Talk to a consultant" },
    ],
  },

  E_OTP_NONE: {
    severity: "INFO",
    body: "I don't have a verification in progress. Let's start again.",
    options: [{ id: "menu", title: "Main menu" }],
  },

  E_UPLOAD_TYPE: {
    severity: "INFO",
    body: "I can only accept *PDF, JPG or PNG* files.\n\n*{{name}}* is a {{kind}} file. If you can, save it as a PDF or take a photo of the document instead.",
    options: [
      { id: "retry", title: "Send another file" },
      { id: "menu", title: "Main menu" },
    ],
  },

  E_UPLOAD_SIZE: {
    severity: "INFO",
    body: "*{{name}}* is {{size}}. WhatsApp allows up to *16 MB* per document.\n\nA photo taken on your phone is usually small enough.",
    options: [
      { id: "retry", title: "Send another file" },
      { id: "menu", title: "Main menu" },
    ],
  },

  E_MEDIA_SCAN: {
    severity: "ALERT",
    body: "That file did not pass our security scan and was *not* stored. Nothing has been added to your complaint.",
    options: [
      { id: "retry", title: "Send another file" },
      { id: "agent", title: "Talk to a consultant" },
    ],
  },

  E_EMPTY_SEARCH: {
    severity: "INFO",
    body: "I need something to search on — a case reference number or your ID number.",
    options: [
      { id: "track", title: "Use my reference" },
      { id: "find_by_id", title: "Use my ID number" },
      { id: "agent", title: "Talk to a consultant" },
    ],
  },

  E_BACKEND: {
    severity: "ALERT",
    body: "I can't reach the case management system at the moment.\n\nI've logged your request as ticket *{{ticket}}* and a consultant will follow up. Please try again shortly.",
    options: [
      { id: "retry", title: "Try again" },
      { id: "agent", title: "Talk to a consultant" },
    ],
  },

  E_NO_MATCH: {
    severity: "INFO",
    body: "I'm not sure I understood that.\n\nI can help with complaint status, lodging a complaint, documents, your contact details and common questions.",
    options: [
      { id: "menu", title: "Show me the menu" },
      { id: "agent", title: "Talk to a consultant" },
    ],
  },

  E_NO_CONSENT: {
    severity: "NOTICE",
    body: "Before I can share information about your complaint, I need your permission to communicate with you on WhatsApp.",
    options: [
      { id: "consent_yes", title: "I agree" },
      { id: "consent_info", title: "How is my data used?" },
    ],
  },

  E_OUT_OF_HOURS: {
    severity: "INFO",
    body: "Our consultants are available *Monday to Friday, 08:00–16:30*.\n\nI've placed you in the queue — someone will reply when the office opens. You can carry on using self-service in the meantime.",
    options: [
      { id: "menu", title: "Main menu" },
    ],
  },
};

// Renders an error into the message the user sees. Variables are supplied by
// the caller rather than read from anywhere global, so an error is testable in
// isolation.
export function renderError(code, vars = {}) {
  const e = ERRORS[code] || ERRORS.E_NO_MATCH;
  const body = e.body.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? `{{${k}}}`));
  return {
    code,
    severity: e.severity,
    body,
    // Reply buttons cap at three on the platform. Taking the first three is
    // safe because every catalogue entry lists its most useful option first.
    options: e.options.slice(0, 3),
  };
}
