// The shared OPFA store.
//
// Two apps sit on top of this: the complainant's WhatsApp simulator (#/wa) and
// the Ezra OPFA console (#/opfa). The demo puts them side by side in TWO
// BROWSER TABS, so React context cannot carry state between them — two tabs
// are two React trees. Hence a module-level singleton, persisted to
// localStorage and synchronised across tabs by the `storage` event.
//
// Within one tab it is simpler than it sounds: both apps ship in one Vite
// bundle, so this module is evaluated once and the subscriber set already
// spans them. localStorage only carries the cross-tab hop.
//
// ─────────────────────────────────────────────────────────────────────────────
// READ THIS BEFORE ADDING A SELECTOR.
//
// useSyncExternalStore requires getSnapshot to return a REFERENTIALLY STABLE
// value. A selector such as useOpfa(s => s.cases.filter(...)) allocates a new
// array on every call, React sees a changed snapshot every render, and the app
// spins forever. There is deliberately no selector API: useOpfa() returns the
// root object — stable between set() calls — and components derive with
// useMemo. If a selector layer is ever added it must memoise by `rev`.
// ─────────────────────────────────────────────────────────────────────────────
//
// One more rule, for StrictMode: actions are called from event handlers, never
// from a bare useEffect. StrictMode double-invokes effects, and an action
// fired from one would run twice.
import { useSyncExternalStore } from "react";
import { seedState, PERSONAS, ROLES } from "./data.js";
import { windowExpiry, wamid, otpCode } from "./helpers.js";

const KEY = "ezra.opfa.v1";
const SCHEMA = 1;
const WIRE_CAP = 200;   // ring buffer: the log is a demo aid, not an archive

const listeners = new Set();
let state = hydrate();
let writeTimer = null;

// ─── Persistence ──────────────────────────────────────────────────────────────

function fresh() {
  return { __v: SCHEMA, rev: 0, ...seedState() };
}

function hydrate() {
  if (typeof window === "undefined") return fresh();
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    // Version gate: a shape change mid-project must not resurrect a stale tree
    // and then fail somewhere far away from the cause.
    if (parsed && parsed.__v === SCHEMA) return parsed;
  } catch {
    // Corrupt or unreadable — seeding is the right recovery, not a crash.
  }
  return fresh();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or storage disabled (private mode). Degrade to
    // in-tab-only rather than taking the demo down: everything still works,
    // the second tab just stops following.
  }
}

function notify() {
  listeners.forEach((l) => l());
}

// `producer` returns the NEXT state. Copy-on-write — never mutate `state`.
export function set(producer) {
  const next = producer(state);
  if (!next || next === state) return state;
  state = { ...next, rev: state.rev + 1 };
  notify();
  // Trailing edge: one bot turn fires several set() calls in a tick, and
  // serialising the whole tree each time is the only expensive thing here.
  clearTimeout(writeTimer);
  writeTimer = setTimeout(persist, 100);
  return state;
}

export const getState = () => state;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// `storage` does not fire in the tab that wrote, so there is no echo loop. The
// rev guard covers the remaining race: a tab reloading while another writes.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY || !e.newValue) return;
    let incoming;
    try {
      incoming = JSON.parse(e.newValue);
    } catch {
      return;
    }
    if (!incoming || incoming.__v !== SCHEMA || incoming.rev <= state.rev) return;
    state = incoming;
    notify();   // deliberately does not re-persist
  });
}

// The only hook. Returns the whole tree; derive with useMemo at the call site.
export function useOpfa() {
  return useSyncExternalStore(subscribe, getState, getState);
}

// ─── Demo clock ───────────────────────────────────────────────────────────────

// Every timestamp comparison goes through this rather than Date.now(), so
// "advance 24h" can close the service window without anyone waiting a day.
export const now = () => Date.now() + state.clockOffsetMs;

export function advanceClock(hours) {
  set((s) => ({ ...s, clockOffsetMs: s.clockOffsetMs + hours * 3600_000 }));
  pushAudit({ actor: "demo", action: "CLOCK_ADVANCED", entity: "system", entityId: "clock",
    detail: `Demo clock advanced ${hours} hour${hours === 1 ? "" : "s"}`, severity: "NOTICE" });
}

export function resetDemo() {
  state = { ...fresh(), rev: state.rev + 1 };
  persist();
  notify();
}

// ─── Append-only logs ─────────────────────────────────────────────────────────

export function pushAudit(entry) {
  set((s) => {
    const id = s.seq.audit + 1;
    return {
      ...s,
      seq: { ...s.seq, audit: id },
      audit: [
        { id: `aud-${id}`, at: now(), ip: "10.20.3.41", severity: "INFO", ...entry },
        ...s.audit,
      ],
    };
  });
}

export function pushWire(entries) {
  const list = Array.isArray(entries) ? entries : [entries];
  if (!list.length) return;
  set((s) => {
    let n = s.seq.wire;
    const stamped = list.map((e) => ({ id: `w-${++n}`, at: now(), ...e }));
    return {
      ...s,
      seq: { ...s.seq, wire: n },
      // Newest first, capped — the panel reads top-down and the tree has to
      // stay inside the localStorage quota.
      wire: [...stamped.reverse(), ...s.wire].slice(0, WIRE_CAP),
    };
  });
}

// ─── Lookups (plain functions — not hooks, safe anywhere) ─────────────────────

export const personaById = (s, id) => s.personas.find((p) => p.id === id);
export const activePersona = (s) => personaById(s, s.activePersonaId) || s.personas[0];
export const conversationFor = (s, personaId) => s.conversations.find((c) => c.personaId === personaId);
export const conversationById = (s, id) => s.conversations.find((c) => c.id === id);
export const casesFor = (s, personaId) => s.cases.filter((c) => c.personaId === personaId);
export const caseByRef = (s, ref) => s.cases.find((c) => c.ref === ref);
export const documentsFor = (s, ref) => s.documents.filter((d) => d.caseRef === ref);

// ─── Persona switching ────────────────────────────────────────────────────────

export function setPersona(id) {
  set((s) => ({ ...s, activePersonaId: id }));
}

// ─── Message plumbing ─────────────────────────────────────────────────────────

// Appends messages to a conversation and keeps the derived window fields in
// step. Every path that adds a message goes through here, so there is one
// place where `lastInboundAt` and `windowExpiresAt` can drift out of sync —
// and it is this one.
export function appendMessages(convId, messages, patch = {}) {
  if (!messages.length && !Object.keys(patch).length) return;
  set((s) => {
    let n = s.seq.msg;
    const stamped = messages.map((m) => {
      const id = `m-${++n}`;
      return {
        id,
        wamid: m.dir === "system" ? null : (m.wamid ?? wamid(`${convId}:${id}`)),
        at: m.at ?? now(),
        type: "text",
        interactive: null,
        status: m.dir === "out" ? "sent" : "read",
        nlu: null,
        templateName: null,
        ...m,
      };
    });
    const lastInbound = [...stamped].reverse().find((m) => m.dir === "in");
    return {
      ...s,
      seq: { ...s.seq, msg: n },
      conversations: s.conversations.map((c) => {
        if (c.id !== convId) return c;
        const lastInboundAt = lastInbound ? lastInbound.at : c.lastInboundAt;
        return {
          ...c,
          ...patch,
          lastInboundAt,
          windowExpiresAt: windowExpiry(lastInboundAt),
          unread: lastInbound ? c.unread + 1 : c.unread,
          messages: [...c.messages, ...stamped],
        };
      }),
    };
  });
}

// Delivery receipts arrive out of band in reality; here they are driven from
// the acting tab on a short timer. The status webhook is emitted with them so
// the wire panel shows the same lifecycle Meta would report.
export function markDelivered(convId, messageId, status) {
  set((s) => ({
    ...s,
    conversations: s.conversations.map((c) =>
      c.id !== convId ? c : {
        ...c,
        messages: c.messages.map((m) => (m.id === messageId ? { ...m, status } : m)),
      }),
  }));
}

export function markConversationRead(convId) {
  set((s) => ({
    ...s,
    conversations: s.conversations.map((c) => (c.id === convId ? { ...c, unread: 0 } : c)),
  }));
}

// ─── Consent (6.1.10) ─────────────────────────────────────────────────────────

export function captureConsent(personaId, method = "WhatsApp opt-in reply") {
  const at = now();
  set((s) => ({
    ...s,
    personas: s.personas.map((p) => p.id !== personaId ? p : {
      ...p,
      consent: {
        ...p.consent,
        status: "opted_in",
        capturedAt: at,
        method,
        prefs: { ...p.consent.prefs, service: true, reminders: true },
        history: [
          { at, action: "opted_in", actor: p.name, channel: "whatsapp", policyVersion: p.consent.policyVersion, ip: "102.132.14.7" },
          ...p.consent.history,
        ],
      },
    }),
  }));
  pushAudit({ actor: "system", action: "CONSENT_CAPTURED", entity: "persona", entityId: personaId,
    detail: `Opt-in captured via ${method}`, severity: "NOTICE" });
}

export function optOut(personaId, reason = "Replied STOP") {
  const at = now();
  set((s) => ({
    ...s,
    personas: s.personas.map((p) => p.id !== personaId ? p : {
      ...p,
      consent: {
        ...p.consent,
        status: "opted_out",
        // Opting out switches every preference off. Leaving one on and
        // calling it "opted out" is how organisations end up in front of the
        // Information Regulator.
        prefs: { service: false, reminders: false, marketing: false },
        history: [
          { at, action: "opted_out", actor: p.name, channel: "whatsapp", reason, policyVersion: p.consent.policyVersion, ip: "102.132.14.7" },
          ...p.consent.history,
        ],
      },
    }),
  }));
  pushAudit({ actor: "system", action: "CONSENT_WITHDRAWN", entity: "persona", entityId: personaId,
    detail: reason, severity: "NOTICE" });
}

export function setPreference(personaId, key, value) {
  const at = now();
  set((s) => ({
    ...s,
    personas: s.personas.map((p) => p.id !== personaId ? p : {
      ...p,
      consent: {
        ...p.consent,
        prefs: { ...p.consent.prefs, [key]: value },
        history: [
          { at, action: value ? `pref_on:${key}` : `pref_off:${key}`, actor: p.name, channel: "console", policyVersion: p.consent.policyVersion, ip: "10.20.3.41" },
          ...p.consent.history,
        ],
      },
    }),
  }));
  pushAudit({ actor: state.console.userId, action: "PREFERENCE_CHANGED", entity: "persona", entityId: personaId,
    detail: `${key} → ${value ? "on" : "off"}`, severity: "INFO" });
}

// ─── Identity verification (6.1.3) ────────────────────────────────────────────

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_LOCK_MS = 15 * 60 * 1000;

export function issueOtp(personaId, purpose) {
  const at = now();
  const code = otpCode(`${personaId}:${purpose}:${Math.floor(at / OTP_TTL_MS)}`);
  set((s) => ({
    ...s,
    personas: s.personas.map((p) => p.id !== personaId ? p : {
      ...p,
      otp: {
        code, issuedAt: at, expiresAt: at + OTP_TTL_MS,
        attempts: 0, resends: p.otp.purpose === purpose ? p.otp.resends + 1 : 0,
        purpose, lockedUntil: p.otp.lockedUntil,
      },
    }),
  }));
  pushAudit({ actor: "system", action: "OTP_ISSUED", entity: "persona", entityId: personaId,
    detail: `Purpose: ${purpose}`, severity: "SECURITY" });
  return code;
}

// Returns a result rather than a boolean so the caller has an error code to
// look up in the exception catalogue instead of inventing a message.
export function verifyOtp(personaId, entered) {
  const s = state;
  const p = personaById(s, personaId);
  const at = now();
  if (!p?.otp.code) return { ok: false, code: "E_OTP_NONE" };
  if (p.otp.lockedUntil && p.otp.lockedUntil > at) return { ok: false, code: "E_OTP_ATTEMPTS" };
  if (p.otp.expiresAt < at) return { ok: false, code: "E_OTP_EXPIRED" };

  if (String(entered).trim() === p.otp.code) {
    set((st) => ({
      ...st,
      personas: st.personas.map((x) => x.id !== personaId ? x : {
        ...x, verified: true, otp: { ...x.otp, code: null, attempts: 0, purpose: null },
      }),
    }));
    pushAudit({ actor: "system", action: "IDENTITY_VERIFIED", entity: "persona", entityId: personaId,
      detail: `OTP accepted for ${p.otp.purpose}`, severity: "SECURITY" });
    return { ok: true };
  }

  const attempts = p.otp.attempts + 1;
  const locked = attempts >= OTP_MAX_ATTEMPTS;
  set((st) => ({
    ...st,
    personas: st.personas.map((x) => x.id !== personaId ? x : {
      ...x,
      profileLocked: locked || x.profileLocked,
      otp: { ...x.otp, attempts, lockedUntil: locked ? at + OTP_LOCK_MS : x.otp.lockedUntil },
    }),
  }));
  pushAudit({
    actor: "system", action: locked ? "IDENTITY_LOCKED" : "OTP_FAILED",
    entity: "persona", entityId: personaId,
    detail: locked
      ? `${OTP_MAX_ATTEMPTS} failed attempts — self-service locked for 15 minutes, handed to an agent`
      : `Incorrect code (attempt ${attempts} of ${OTP_MAX_ATTEMPTS})`,
    severity: locked ? "ALERT" : "SECURITY",
  });
  return { ok: false, code: locked ? "E_OTP_ATTEMPTS" : "E_OTP_MISMATCH", attempts, remaining: OTP_MAX_ATTEMPTS - attempts };
}

// ─── Profile (6.1.3) ──────────────────────────────────────────────────────────

export function updateProfile(personaId, patch) {
  const before = personaById(state, personaId);
  set((s) => ({
    ...s,
    personas: s.personas.map((p) => (p.id === personaId ? { ...p, ...patch } : p)),
  }));
  const fields = Object.keys(patch).map((k) => `${k}: ${before?.[k]} → ${patch[k]}`).join("; ");
  pushAudit({ actor: "system", action: "PROFILE_UPDATED", entity: "persona", entityId: personaId,
    detail: fields, severity: "NOTICE" });
}

// ─── Cases and documents (6.1.2, 6.1.4) ───────────────────────────────────────

export function addDocument(caseRefValue, file, personaId) {
  let created = null;
  set((s) => {
    const seq = s.seq.doc + 1;
    created = {
      id: `doc-${seq}`,
      caseRef: caseRefValue,
      name: file.name,
      kind: file.kind,
      size: file.size,
      mime: file.mime,
      direction: "inbound",
      uploadedBy: personaId,
      storedAt: now(),
      respondDocId: `RSP-DOC-${String(seq).padStart(5, "0")}`,
      // No bytes are stored — the catalogue entry is the file. Keeping blobs
      // in localStorage would blow the quota inside a single demo.
      scanResult: "clean",
    };
    return { ...s, seq: { ...s.seq, doc: seq }, documents: [created, ...s.documents] };
  });
  pushAudit({ actor: "system", action: "DOCUMENT_RECEIVED", entity: "case", entityId: caseRefValue,
    detail: `${file.name} stored as ${created.respondDocId} and filed to SharePoint`, severity: "NOTICE" });
  return created;
}

export function confirmSettlement(caseRefValue, outcome) {
  const at = now();
  set((s) => ({
    ...s,
    cases: s.cases.map((c) => c.ref !== caseRefValue ? c : {
      ...c,
      stage: outcome === "paid" ? "Settled" : c.stage,
      settlement: { confirmed: true, at, by: "complainant", outcome },
      timeline: [...c.timeline, {
        stage: outcome === "paid" ? "Settled" : c.stage,
        at,
        note: outcome === "paid"
          ? "Complainant confirmed receipt of payment from the fund via WhatsApp."
          : "Complainant reported the fund has not paid. Matter referred back for enforcement.",
      }],
    }),
  }));
  pushAudit({ actor: "system", action: "SETTLEMENT_CONFIRMED", entity: "case", entityId: caseRefValue,
    detail: `Complainant reported outcome: ${outcome}`, severity: "NOTICE" });
}

export function recordFeedback(personaId, kind, text) {
  set((s) => ({
    ...s,
    feedback: [{ id: `fb-${s.feedback.length + 1}`, at: now(), personaId, kind, text, read: false }, ...s.feedback],
  }));
  pushAudit({ actor: "system", action: "FEEDBACK_CAPTURED", entity: "persona", entityId: personaId,
    detail: `${kind}: ${String(text).slice(0, 80)}`, severity: "INFO" });
}

// ─── Console session (6.1.8) ──────────────────────────────────────────────────

export const CONSOLE_SESSION_MS = 30 * 60 * 1000;

export function signIn(userId, role) {
  const at = now();
  set((s) => ({
    ...s,
    console: { ...s.console, userId, role, mfaVerified: true, sessionStartedAt: at, sessionExpiresAt: at + CONSOLE_SESSION_MS },
  }));
  pushAudit({ actor: userId, action: "CONSOLE_SIGN_IN", entity: "session", entityId: userId,
    detail: `Entra ID SSO, MFA satisfied (authenticator app). Role: ${role}`, severity: "NOTICE" });
}

export function signOut() {
  const who = state.console.userId;
  set((s) => ({ ...s, console: { ...s.console, mfaVerified: false, sessionStartedAt: null, sessionExpiresAt: null, revealedPii: [] } }));
  pushAudit({ actor: who, action: "CONSOLE_SIGN_OUT", entity: "session", entityId: who, detail: "Session ended", severity: "INFO" });
}

export function setRole(role) {
  set((s) => ({ ...s, console: { ...s.console, role } }));
  pushAudit({ actor: state.console.userId, action: "ROLE_CHANGED", entity: "session", entityId: state.console.userId,
    detail: `Effective role set to ${role}`, severity: "SECURITY" });
}

// Revealing masked PII is itself an event worth recording — that is the whole
// point of masking by default rather than hiding the field.
export function revealPii(entityId, field) {
  const key = `${entityId}:${field}`;
  set((s) => s.console.revealedPii.includes(key) ? s : {
    ...s, console: { ...s.console, revealedPii: [...s.console.revealedPii, key] },
  });
  pushAudit({ actor: state.console.userId, action: "PII_REVEALED", entity: "persona", entityId,
    detail: `Unmasked field: ${field}`, severity: "SECURITY" });
}

export const isRevealed = (s, entityId, field) => s.console.revealedPii.includes(`${entityId}:${field}`);

// Permission check against the RBAC matrix in data.js. Defaults closed: an
// unknown role grants nothing rather than everything.
export const can = (s, permission) => ROLES[s.console.role]?.can?.[permission] === true;

// Nav visibility follows the same matrix, so hiding a view and disabling its
// actions can never disagree.
export const navAllowed = (s, id) => ROLES[s.console.role]?.nav?.includes(id) ?? false;

// ─── Bot session ──────────────────────────────────────────────────────────────

export function setSession(convId, session) {
  set((s) => ({ ...s, sessions: { ...s.sessions, [convId]: session } }));
}

export const sessionFor = (s, convId) =>
  s.sessions[convId] || { nodeId: null, stack: [], slots: {}, retries: 0, lastNodeAt: null };

// Re-exported so views can seed a persona picker without a second import.
export { PERSONAS };
