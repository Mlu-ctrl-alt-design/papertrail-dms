// Formatters, identifier generation, PII masking and the WhatsApp service
// window rules.
//
// Everything that produces an identifier is deterministic: the same inputs
// yield the same `wamid` or case reference on every run. A demo that shows
// different IDs each time it is replayed invites the question "is any of this
// real?", and a seeded generator costs nothing.
import { C } from "../components/index.js";

// ─── Numbers and dates ────────────────────────────────────────────────────────

export const fmt = (n) => Number(n || 0).toLocaleString("en-ZA");

export const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

export const clockTime = (ts) =>
  new Date(ts).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });

export const shortDate = (ts) =>
  new Date(ts).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });

export const dateTime = (ts) => `${shortDate(ts)} ${clockTime(ts)}`;

// "2 hours ago" / "just now". Coarse on purpose: to the minute is false
// precision for a queue that a human works through.
export function relTime(ts, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

// Countdown rendered as hh:mm — what the agent needs to know is whether there
// is time, not how many seconds are left.
export function countdown(ms) {
  if (ms <= 0) return "closed";
  const mins = Math.floor(ms / 60000);
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

// ─── Deterministic identifiers ────────────────────────────────────────────────

// FNV-1a, then an LCG to spread the bits. Borrowed from the Connect module's
// broadcast codes — same technique, different alphabet.
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function seededRandom(seed) {
  let s = typeof seed === "string" ? hash32(seed) : seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// WhatsApp message IDs look like:
//   wamid.HBgLMjc4MjU1NTAxNDgVAgARGBI5QTNDQUQ4RjEyMzQ1Njc4OQA=
// The prefix is fixed by Meta; the body is opaque. Deterministic per message
// so replays and the wire log agree.
export function wamid(seed) {
  const rnd = seededRandom(`wamid:${seed}`);
  let body = "";
  for (let i = 0; i < 38; i++) body += B64[Math.floor(rnd() * B64.length)];
  return `wamid.HBgL${body}A=`;
}

// OPFA house style: PFA / province / sequence / year / adjudicator initials.
export const PROVINCES = ["GP", "WC", "KZN", "EC", "NW", "FS", "LP", "MP", "NC"];

export function caseRef({ province = "GP", seq, year = 2026, initials = "SM" }) {
  return `PFA/${province}/${String(seq).padStart(5, "0")}/${year}/${initials}`;
}

export const CASE_REF_RE = /^PFA\/(GP|WC|KZN|EC|NW|FS|LP|MP|NC)\/\d{5}\/\d{4}\/[A-Z]{2}$/;

// Respond CMS document identifier, as returned by its REST layer.
export const respondDocId = (seq) => `RSP-DOC-${String(seq).padStart(5, "0")}`;

// A six-digit OTP. Deterministic from the seed so the demo can read it aloud
// from the console while the phone shows the prompt.
export function otpCode(seed) {
  const rnd = seededRandom(`otp:${seed}`);
  return String(Math.floor(rnd() * 900000) + 100000);
}

// ─── PII masking (6.1.8 data masking) ─────────────────────────────────────────

// SA ID numbers are 13 digits and encode a date of birth and gender, so an
// unmasked one on a console screen is a meaningful disclosure. Show the first
// six (already visible on any correspondence) and the last two.
export const maskId = (id) =>
  !id ? "" : `${String(id).slice(0, 6)}${"•".repeat(Math.max(0, String(id).length - 8))}${String(id).slice(-2)}`;

// Keep the country code and the last three digits: enough to confirm you have
// the right person on the line, not enough to dial them.
export function maskMsisdn(msisdn) {
  const digits = String(msisdn || "").replace(/\D/g, "");
  if (digits.length < 6) return msisdn;
  return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ••• ${digits.slice(-3)}`;
}

export function maskEmail(email) {
  const [user, domain] = String(email || "").split("@");
  if (!domain) return email;
  const head = user.slice(0, Math.min(2, user.length));
  return `${head}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

// E.164, the form the Cloud API wants: no plus, no spaces.
export const e164 = (msisdn) => String(msisdn || "").replace(/\D/g, "");

export const prettyMsisdn = (msisdn) => {
  const d = e164(msisdn);
  return d.length === 11 ? `+${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : msisdn;
};

// ─── WhatsApp service window (6.1.7) ──────────────────────────────────────────

export const WINDOW_MS = 24 * 60 * 60 * 1000;

// Meta's rule: free-form messages are only permitted within 24 hours of the
// customer's last inbound message. Outside it, only an approved template may
// be sent. This is the single constraint that most shapes how an agent console
// must behave, so it is modelled rather than mentioned.
export const windowExpiry = (lastInboundAt) => (lastInboundAt ? lastInboundAt + WINDOW_MS : 0);

export const windowOpen = (lastInboundAt, now) => windowExpiry(lastInboundAt) > now;

export const windowLeft = (lastInboundAt, now) => Math.max(0, windowExpiry(lastInboundAt) - now);

// Why an outbound message cannot be sent as free-form. Never returns a bare
// false — the console always has a sentence to show the agent.
export function sendBlockReason({ consent, lastInboundAt, now }) {
  if (consent?.status === "opted_out") {
    return { code: "OPTED_OUT", text: "This contact has opted out of WhatsApp messaging. Only they can re-subscribe." };
  }
  if (consent?.status !== "opted_in") {
    return { code: "NO_CONSENT", text: "No opt-in on record. Capture consent before messaging this contact." };
  }
  if (!windowOpen(lastInboundAt, now)) {
    return { code: "WINDOW_CLOSED", text: "The 24-hour service window has closed. Send an approved message template instead." };
  }
  return null;
}

// ─── Status styling ───────────────────────────────────────────────────────────

// The OPFA complaint lifecycle, in the order a case moves through it.
export const CASE_STAGES = [
  "Lodged", "Screening", "Allocated", "Awaiting fund response",
  "Investigation", "Determination issued", "Settled", "Closed",
];

export const caseStyle = (stage) =>
  ({
    "Lodged":                { bg: C.brandTint,    fg: C.brandDark },
    "Screening":             { bg: C.surfaceMute,  fg: C.muted },
    "Allocated":             { bg: C.brandTintSoft, fg: C.info },
    "Awaiting fund response": { bg: C.warningBg,   fg: C.warning },
    "Investigation":         { bg: C.brandTintSoft, fg: C.info },
    "Determination issued":  { bg: "#f0eaf8",      fg: "#6B3FA0" },
    "Settled":               { bg: C.successBg,    fg: C.success },
    "Closed":                { bg: "#f0f0f0",      fg: C.faint },
  }[stage] || { bg: C.surfaceMute, fg: C.text });

export const convoStyle = (mode) =>
  ({
    bot:      { label: "Bot",           bg: C.surfaceMute, fg: C.muted },
    queued:   { label: "Waiting",       bg: C.warningBg,   fg: C.warning },
    agent:    { label: "With agent",    bg: C.brandTint,   fg: C.brandDark },
    resolved: { label: "Resolved",      bg: C.successBg,   fg: C.success },
  }[mode] || { label: mode, bg: C.surfaceMute, fg: C.muted });

export const consentStyle = (status) =>
  ({
    opted_in:  { label: "Opted in",  bg: C.successBg,   fg: C.success },
    pending:   { label: "Pending",   bg: C.warningBg,   fg: C.warning },
    opted_out: { label: "Opted out", bg: C.dangerBg,    fg: C.danger },
  }[status] || { label: status, bg: C.surfaceMute, fg: C.muted });

export const templateStyle = (status) =>
  ({
    APPROVED: { bg: C.successBg,  fg: C.success },
    PENDING:  { bg: C.warningBg,  fg: C.warning },
    REJECTED: { bg: C.dangerBg,   fg: C.danger },
    PAUSED:   { bg: C.surfaceMute, fg: C.muted },
  }[status] || { bg: C.surfaceMute, fg: C.text });

export const severityStyle = (s) =>
  ({
    INFO:     { bg: C.surfaceMute, fg: C.muted },
    NOTICE:   { bg: C.brandTintSoft, fg: C.info },
    SECURITY: { bg: C.warningBg,   fg: C.warning },
    ALERT:    { bg: C.dangerBg,    fg: C.danger },
  }[s] || { bg: C.surfaceMute, fg: C.text });

// Confidence bands, shared by the NLU tier and everything that displays it.
export const confidenceStyle = (band) =>
  ({
    high:   { bg: C.successBg,  fg: C.success },
    medium: { bg: C.warningBg,  fg: C.warning },
    low:    { bg: C.dangerBg,   fg: C.danger },
  }[band] || { bg: C.surfaceMute, fg: C.muted });

// ─── Misc ─────────────────────────────────────────────────────────────────────

export const bytes = (n) =>
  n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

// {{1}}, {{2}} positional parameters, as Meta templates use them.
export const fillTemplate = (text, params = []) =>
  String(text || "").replace(/\{\{(\d+)\}\}/g, (_, i) => params[Number(i) - 1] ?? `{{${i}}}`);
