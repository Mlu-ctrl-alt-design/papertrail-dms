// Formatters and status styling for the Connect (broadcast) module.
import { C } from "../components/index.js";

export const fmt = (n) => Number(n || 0).toLocaleString("en-US");

export const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

// Message lifecycle, in provider terms. There is no "read" state: WhatsApp
// only reports read receipts when the recipient has them switched on, and SMS
// and email never do — so the console reports what it can actually know.
//   accepted  → the provider took the message
//   sent      → handed to the carrier / Meta
//   delivered → delivery receipt returned
//   failed    → rejected or undeliverable, with a provider error code
export const deliveryStyle = (s) =>
  ({
    accepted:  { label: "Accepted",  bg: C.surfaceMute, fg: C.muted, ticks: 0 },
    sent:      { label: "Sent",      bg: C.surfaceMute, fg: C.text,  ticks: 1 },
    delivered: { label: "Delivered", bg: C.successBg,   fg: C.success, ticks: 2 },
    rerouted:  { label: "Rerouted",  bg: C.warningBg,   fg: C.warning, ticks: 0 },
    failed:    { label: "Failed",    bg: C.dangerBg,    fg: C.danger,  ticks: 0 },
  }[s] || { label: s, bg: C.surfaceMute, fg: C.muted, ticks: 0 });

// Provider error codes surfaced on failed rows, as they appear in the logs.
export const ERROR_CODES = {
  whatsapp: { code: "63016", text: "Message undeliverable — handset unreachable" },
  sms:      { code: "30003", text: "Unreachable destination handset" },
  email:    { code: "5.1.1", text: "Mailbox does not exist" },
  app:      { code: "40401", text: "No active device registration" },
};

// SMS billing: 160 characters per segment (153 once a message is concatenated).
export const smsSegments = (text) => {
  const n = (text || "").length;
  if (n === 0) return 0;
  return n <= 160 ? 1 : Math.ceil(n / 153);
};

export const toneStyle = (tone) =>
  ({
    positive: { bg: C.successBg, fg: C.success },
    negative: { bg: C.dangerBg,  fg: C.danger },
    neutral:  { bg: C.surfaceMute, fg: C.muted },
  }[tone] || { bg: C.surfaceMute, fg: C.muted });

// Tokens map onto the contact schema: {{name}} is the first name, and the rest
// address the record's own fields.
export const renderBody = (body, person) =>
  (body || "")
    .replaceAll("{{name}}", person?.first || "Colleague")
    .replaceAll("{{fullName}}", person?.fullName || "Colleague")
    .replaceAll("{{lastName}}", person?.last || "")
    .replaceAll("{{persal}}", person?.persal || "00000000")
    .replaceAll("{{lineManager}}", person?.lineManager || "your line manager");

// Minimal WhatsApp markup tokeniser: *bold* and _italic_.
// Returns [{ text, bold, italic }] so callers can render without JSX here.
export function waTokens(text) {
  const out = [];
  const re = /(\*[^*\n]+\*|_[^_\n]+_)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    const inner = m[0].slice(1, -1);
    out.push(m[0][0] === "*" ? { text: inner, bold: true } : { text: inner, italic: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

export const nowTime = () =>
  new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
