// Intent recognition (6.1.5: "intent recognition and natural language
// processing", "chatbot and AI-powered question answering").
//
// Deterministic and local — no model, no network call. What makes it
// convincing to a technical panel is not the algorithm but the *behaviour*: a
// real NLU tier returns a distribution, and a well-built assistant routes on
// the confidence band rather than always taking the argmax. That is what this
// implements.
//
//   high   (>= 0.70)  act on it, with a short acknowledgement
//   medium (0.40..70)  confirm before acting — one tap, no retyping
//   low    (< 0.40)    fall through to FAQ retrieval, then to a clear fallback
//
// The score is a softmax-ish share of the total, length-normalised so a long
// rambling message cannot out-score a crisp one.
import { tokenise } from "./faq.js";
import { CASE_REF_RE } from "../helpers.js";

export const ENGINE = "Ezra NLU v2.1 (en-ZA)";

export const HIGH = 0.70;
export const LOW = 0.40;

// Weights are hand-tuned rather than learned; the number next to a token is
// how diagnostic it is, not how common. "payslip" is worth more than "send"
// because almost nobody says "payslip" about anything else.
export const INTENTS = [
  {
    id: "track_case", node: "ask_case_ref", ack: "Let me check your complaint status.",
    kw: { track: 3, status: 3, progress: 3, complaint: 1, case: 2, update: 2, where: 2, happening: 2, check: 2, far: 2, reference: 2 },
    patterns: [{ re: CASE_REF_RE, boost: 8, slot: "caseRef" }],
  },
  {
    id: "lodge_complaint", node: "lodge_link", ack: "I'll help you lodge a complaint.",
    kw: { lodge: 4, submit: 2, new: 2, complain: 3, report: 2, file: 2, open: 1, start: 1, register: 2 },
  },
  {
    id: "upload_docs", node: "docs_upload", ack: "Let's get that document onto your file.",
    kw: { upload: 4, attach: 3, payslip: 4, copy: 1, document: 3, proof: 2, statement: 2, certificate: 2, send: 1 },
  },
  {
    id: "download_doc", node: "docs_download", ack: "I'll fetch your documents.",
    kw: { download: 4, determination: 4, letter: 3, ruling: 3, outcome: 2, copy: 2, receive: 1, get: 1 },
  },
  {
    id: "update_contact", node: "profile_menu", ack: "I can update your contact details.",
    kw: { change: 3, update: 2, cellphone: 4, number: 2, email: 4, details: 2, contact: 3, address: 2, profile: 3, new: 1 },
  },
  {
    id: "settlement", node: "settle_pick_case", ack: "Let's record that.",
    kw: { paid: 4, settled: 4, settlement: 4, received: 3, money: 2, payment: 3, fund: 1, deposited: 3, reflected: 2 },
  },
  {
    id: "agent", node: "handoff", ack: null,
    kw: { agent: 4, human: 4, person: 3, speak: 3, consultant: 4, someone: 3, talk: 2, help: 1, operator: 3, real: 2 },
  },
  {
    id: "opt_out", node: "opt_out", ack: null,
    kw: { stop: 5, unsubscribe: 5, remove: 2, optout: 5, "opt-out": 5, cancel: 2 },
  },
  {
    id: "greeting", node: "main_menu", ack: null,
    kw: { hi: 4, hello: 4, hey: 3, molo: 4, sawubona: 4, dumela: 4, goeie: 3, morning: 2, afternoon: 2, greetings: 3 },
  },
  {
    id: "faq", node: "faq_menu", ack: null,
    kw: { question: 3, how: 1, what: 1, why: 1, explain: 3, mean: 2, faq: 4, information: 2, long: 1, cost: 2 },
  },
];

export const INTENT_LABELS = Object.fromEntries(
  INTENTS.map((i) => [i.id, i.id.replaceAll("_", " ")]),
);

export function intentById(id) {
  return INTENTS.find((i) => i.id === id) || null;
}

// Returns { intent, confidence, band, alternatives, slots, engine }.
export function classify(text) {
  const raw = String(text || "");
  const toks = tokenise(raw);
  const lower = raw.toLowerCase();

  const scored = INTENTS.map((intent) => {
    let score = toks.reduce((sum, t) => sum + (intent.kw[t] || 0), 0);
    const slots = {};
    (intent.patterns || []).forEach((p) => {
      const m = raw.match(p.re);
      if (m) {
        score += p.boost;
        if (p.slot) slots[p.slot] = m[0];
      }
    });
    // A one-word message that is exactly an intent keyword is unambiguous;
    // without this the normalisation below would flatten it into the medium
    // band and ask the user to confirm what they plainly just said.
    if (toks.length === 1 && intent.kw[toks[0]] >= 4) score += 4;
    return {
      id: intent.id,
      node: intent.node,
      ack: intent.ack,
      // Length normalisation: sqrt rather than linear, so a longer message is
      // penalised but not erased.
      score: score / Math.sqrt(Math.max(toks.length, 3)),
      slots,
    };
  }).sort((a, b) => b.score - a.score);

  const total = scored.reduce((sum, s) => sum + s.score, 0);
  const top = scored[0];

  if (!top || top.score <= 0) {
    return {
      intent: "unknown", node: null, ack: null, confidence: 0, band: "low",
      alternatives: [], slots: {}, engine: ENGINE, tokens: toks,
    };
  }

  const confidence = Math.min(0.98, +(top.score / total).toFixed(2));

  return {
    intent: top.id,
    node: top.node,
    ack: top.ack,
    confidence,
    band: confidence >= HIGH ? "high" : confidence >= LOW ? "medium" : "low",
    alternatives: scored.slice(1, 3)
      .filter((s) => s.score > 0)
      .map((s) => ({ id: s.id, confidence: +(s.score / total).toFixed(2) })),
    slots: top.slots,
    engine: ENGINE,
    tokens: toks,
    // Kept for the wire panel: showing the raw scores alongside the normalised
    // confidence is what turns "trust me" into "here is why".
    distribution: scored.slice(0, 4).map((s) => ({ id: s.id, raw: +s.score.toFixed(2) })),
    matchedAt: lower.length,
  };
}
