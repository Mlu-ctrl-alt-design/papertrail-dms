// Runs a conversation turn: takes what the complainant did, asks the engine
// what should happen, applies the effects to the store and emits the wire
// records.
//
// This is the only place that knows about both the pure engine and the
// stateful store. Keeping it separate is what lets flows.js and engine.js stay
// free of React, localStorage and payload builders.
//
// Ordering matters and is deliberate: the turn is computed in whichever tab
// the input came from, and lands in shared state as data. The other tab
// renders the same result rather than re-deriving it, so the two views cannot
// disagree about what the bot said.
import { step, open } from "./bot/engine.js";
import { FLOWS } from "./bot/flows.js";
import { classify } from "./bot/nlu.js";
import * as api from "./wire/cloudApi.js";
import * as respondApi from "./wire/respond.js";
import {
  getState, now, set, appendMessages, pushWire, pushAudit, markDelivered,
  personaById, conversationFor, casesFor, documentsFor, issueOtp, verifyOtp,
  captureConsent, optOut, updateProfile, addDocument, confirmSettlement,
  sessionFor, setSession,
} from "./store.js";
import {
  wamid, caseRef, seededRandom, bytes, fillTemplate, e164,
} from "./helpers.js";
import { templateByName } from "./data.js";

// Meta's media ids and the sha256 of an upload are opaque to us but must be
// stable, or a replayed demo shows different values for the same file.
function fakeHash(seed, len = 64) {
  const rnd = seededRandom(seed);
  const hex = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) out += hex[Math.floor(rnd() * 16)];
  return out;
}

const mediaId = (seed) => String(Math.floor(seededRandom(`media:${seed}`)() * 9e14) + 1e14);

// Delivery receipts arrive out of band. Driven from the acting tab on a short
// timer so the ticks progress the way they do on a real handset.
function scheduleReceipts(convId, messageIds, to) {
  messageIds.forEach((id, i) => {
    const base = 260 + i * 90;
    setTimeout(() => {
      markDelivered(convId, id, "delivered");
      const m = getState().conversations.find((c) => c.id === convId)?.messages.find((x) => x.id === id);
      if (m) pushWire(api.statusUpdate({ to, wamid: m.wamid, status: "delivered", conversationId: convId }));
    }, base);
    setTimeout(() => {
      markDelivered(convId, id, "read");
      const m = getState().conversations.find((c) => c.id === convId)?.messages.find((x) => x.id === id);
      if (m) pushWire(api.statusUpdate({ to, wamid: m.wamid, status: "read", conversationId: convId }));
    }, base + 700);
  });
}

// ─── Context for the engine ───────────────────────────────────────────────────

function buildCtx(s, persona, conv) {
  const cases = casesFor(s, persona.id);
  return {
    persona,
    conversation: conv,
    cases,
    allCases: s.cases,
    documents: s.documents,
    queuePosition: s.conversations.filter((c) => c.mode === "queued").length + 1,
    ticket: `INC-${String(s.seq.ticket + 1).padStart(5, "0")}`,
    // Injected rather than reached for — see the engine's header.
    verify: { otp: (code) => verifyOtp(persona.id, code) },
  };
}

// ─── Effects ──────────────────────────────────────────────────────────────────

// Applies what the engine asked for and reports back anything a later step
// needs (the new case reference, the stored document).
function applyEffects(effects, { persona, conv }) {
  const result = {};
  effects.forEach((fx) => {
    switch (fx.type) {
      case "captureConsent":
        captureConsent(persona.id, fx.method);
        break;

      case "optOut":
        optOut(persona.id, fx.reason);
        break;

      case "issueOtp":
      case "reissueOtp": {
        const purpose = fx.purpose || getState().personas.find((p) => p.id === persona.id)?.otp.purpose || "verification";
        result.otp = issueOtp(persona.id, purpose);
        break;
      }

      case "updateProfile":
        updateProfile(persona.id, { [fx.field]: fx.value });
        break;

      case "addDocument":
        result.document = addDocument(fx.caseRef, fx.file, persona.id);
        break;

      case "confirmSettlement":
        confirmSettlement(fx.caseRef, fx.outcome);
        break;

      case "lodgeCase": {
        // The website lodgement is simulated here so the reference-number
        // notification (6.1.2) can be demonstrated end to end.
        const s = getState();
        const seq = s.seq.case + 1;
        const ref = caseRef({ province: "GP", seq, initials: "SM" });
        set((st) => ({
          ...st,
          seq: { ...st.seq, case: seq },
          cases: [{
            ref,
            personaId: persona.id,
            subject: "New complaint lodged via the OPFA website",
            category: "Withdrawal benefit",
            fundId: "fund-2",
            employerId: "emp-2",
            stage: "Lodged",
            amount: 0,
            adjudicator: "S. Mthembu",
            lodgedAt: now(),
            lastSyncedAt: now(),
            settlement: { confirmed: false, at: null, by: null, outcome: null },
            timeline: [{ stage: "Lodged", at: now(), note: "Complaint received via the OPFA website. Reference number issued." }],
          }, ...st.cases],
        }));
        pushAudit({
          actor: "system", action: "CASE_CREATED", entity: "case", entityId: ref,
          detail: "Lodged through the OPFA website and linked to the WhatsApp conversation", severity: "NOTICE",
        });
        result.newCaseRef = ref;
        break;
      }

      case "escalate":
        set((st) => ({
          ...st,
          conversations: st.conversations.map((c) =>
            c.id === conv.id ? { ...c, mode: "queued", unread: c.unread + 1 } : c),
        }));
        pushAudit({
          actor: "system", action: "ESCALATED_TO_AGENT", entity: "conversation", entityId: conv.id,
          detail: "Bot handed the conversation to the agent queue", severity: "NOTICE",
        });
        break;

      case "recordCsat":
        if (fx.score != null) {
          set((st) => ({
            ...st,
            conversations: st.conversations.map((c) => (c.id === conv.id ? { ...c, csat: fx.score } : c)),
          }));
        }
        break;

      default:
        break;
    }
  });
  return result;
}

// ─── Wire records for the backend calls a turn made ───────────────────────────

function respondWire(calls, { persona, cases, effectResult }) {
  const out = [];
  calls.forEach((call) => {
    switch (call.kind) {
      case "getCase": {
        const c = cases.find((x) => x.ref === call.ref);
        out.push(respondApi.getCase(call.ref));
        if (c) out.push(respondApi.caseResponse(c));
        break;
      }
      case "searchCases":
        out.push(respondApi.searchCases({ idNumber: call.idNumber }));
        out.push(respondApi.caseListResponse(cases));
        break;
      case "postDocument": {
        const sha = fakeHash(`${call.ref}:${call.file.name}`);
        out.push(respondApi.postDocument({ ref: call.ref, file: call.file, sha256: sha }));
        if (effectResult.document) out.push(respondApi.documentResponse(effectResult.document));
        break;
      }
      case "patchContact":
        out.push(respondApi.patchContact({ persona, field: call.field, value: call.value }));
        out.push(respondApi.acknowledgement("200 OK · Contact updated"));
        break;
      case "acknowledge":
        out.push(respondApi.acknowledgement(call.label));
        break;
      case "fault":
        out.push(respondApi.faultResponse(call.ticket));
        break;
      default:
        break;
    }
  });
  return out;
}

// ─── The turn ─────────────────────────────────────────────────────────────────

// Concatenates two turns so a greeting and the reply to the message that
// triggered it arrive as one exchange.
function mergeTurns(first, second) {
  const cat = (k) => [...(first[k] || []), ...(second[k] || [])];
  return {
    session: second.session,
    messages: cat("messages"),
    effects: cat("effects"),
    audit: cat("audit"),
    system: cat("system"),
    templates: cat("templates"),
    respond: cat("respond"),
    sharepoint: cat("sharepoint"),
    nlu: second.nlu ?? first.nlu,
    faq: second.faq ?? first.faq,
  };
}

// A conversation with no session opens with the welcome. The first message
// must not be swallowed by it: someone whose opening line is "where is my
// complaint" should be greeted *and* answered, not greeted and then left
// looking at a menu they did not ask for.
//
// The exception is consent. If the welcome lands on the opt-in prompt rather
// than the menu, that prompt stands and the message waits — answering a
// question about someone's complaint before they have opted in is the one
// shortcut POPIA does not allow.
function runTurn({ session, input, ctx }) {
  if (session.nodeId || session.options) return step({ session, input, ctx });

  const greeting = open({ ctx });
  if (greeting.session.nodeId !== "main_menu") return greeting;

  return mergeTurns(greeting, step({ session: greeting.session, input, ctx }));
}

// `input` is one of:
//   { type: "text", text }
//   { type: "interactive", reply: { id, title } }
//   { type: "document", file }
//
// Returns the outbound messages so the caller can stage a typing indicator.
export function sendInbound(personaId, input) {
  const s = getState();
  const persona = personaById(s, personaId);
  const conv = conversationFor(s, personaId);
  if (!persona || !conv) return { messages: [] };

  const t = now();
  const inboundId = `in:${conv.id}:${conv.messages.length}`;
  const inboundWamid = wamid(inboundId);

  // 1. Classify first, so the inbound message carries its intent from the
  //    moment it lands — the console should never show an unannotated message
  //    that the bot has already acted on.
  //
  //    Not while a prompt is pending, though. A case reference, an OTP or a
  //    new email address is an answer to a question, not an utterance to be
  //    interpreted, and running it through intent recognition only produces a
  //    misleading "unknown · 0.00" against a message the bot understood
  //    perfectly well.
  const pending = FLOWS[sessionFor(s, conv.id).nodeId];
  const nlu = input.type === "text" && pending?.kind !== "prompt"
    ? classify(input.text)
    : null;

  // 2. Record the inbound message and the webhook that delivered it.
  const inboundMessage =
    input.type === "text" ? { dir: "in", type: "text", body: input.text, author: "citizen", wamid: inboundWamid, nlu }
    : input.type === "interactive" ? { dir: "in", type: "interactive", body: input.reply.title, author: "citizen", wamid: inboundWamid, replyId: input.reply.id }
    : { dir: "in", type: "document", body: "", author: "citizen", wamid: inboundWamid,
        attachment: { name: input.file.name, size: bytes(input.file.size), kind: input.file.kind } };

  appendMessages(conv.id, [inboundMessage]);

  const webhook =
    input.type === "text" ? api.inboundText({ from: persona.msisdn, name: persona.name, wamid: inboundWamid, body: input.text, timestamp: t })
    : input.type === "interactive" ? api.inboundInteractive({ from: persona.msisdn, name: persona.name, wamid: inboundWamid, reply: { ...input.reply, type: input.replyKind || "list_reply" }, timestamp: t })
    : api.inboundDocument({ from: persona.msisdn, name: persona.name, wamid: inboundWamid, file: input.file,
        mediaId: mediaId(input.file.id), sha256: fakeHash(`${conv.id}:${input.file.name}`), timestamp: t });

  const wire = [webhook];
  if (nlu) wire.push(api.nluTrace({ text: input.text, result: nlu }));

  // 3. Ask the engine what happens next.
  const after = getState();
  const ctx = buildCtx(after, personaById(after, personaId), conversationFor(after, personaId));
  const session = sessionFor(after, conv.id);
  const turn = runTurn({ session, input, ctx });

  // 4. Apply effects before rendering templates — a template may need the
  //    reference number the effect just created.
  const effectResult = applyEffects(turn.effects || [], { persona, conv });

  // 5. Backend traffic the turn generated.
  const latest = getState();
  wire.push(...respondWire(turn.respond || [], {
    persona: personaById(latest, personaId),
    cases: casesFor(latest, personaId),
    effectResult,
  }));
  (turn.sharepoint || []).forEach((sp) => {
    wire.push(respondApi.sharePointUpload({ ref: sp.ref, file: sp.file }));
  });

  // 6. Templates the turn asked to send (reference issued, document received).
  const templateMessages = (turn.templates || []).map((spec) => {
    const tpl = templateByName(latest.templates, spec.name);
    if (!tpl) return null;
    const params = spec.params || (spec.slotFrom ? [effectResult[spec.slotFrom]] : []);
    return {
      dir: "out", type: "template", author: "bot", templateName: spec.name,
      body: fillTemplate(tpl.body, params),
      _template: { name: spec.name, language: tpl.language, params },
    };
  }).filter(Boolean);

  // 7. The engine's own messages.
  const outMessages = (turn.messages || []).map((m) => ({
    dir: "out",
    author: "bot",
    type: m.type === "interactive" ? "interactive" : "text",
    body: m.body,
    interactive: m.interactive || null,
    attachment: m.attachment || null,
  }));

  const systemNotes = (turn.system || []).map((body) => ({ dir: "system", type: "system", body }));

  setSession(conv.id, turn.session);

  const all = [...templateMessages, ...outMessages, ...systemNotes];
  appendMessages(conv.id, all);

  // 8. Outbound wire records, in the same order as the messages.
  const persisted = getState().conversations.find((c) => c.id === conv.id);
  const justSent = persisted.messages.slice(-all.length).filter((m) => m.dir === "out");
  justSent.forEach((m, i) => {
    const spec = all.filter((x) => x.dir === "out")[i];
    if (spec?._template) {
      wire.push(api.outboundTemplate({ to: persona.msisdn, name: spec._template.name, language: spec._template.language, params: spec._template.params }));
    } else if (m.interactive?.type === "list") {
      wire.push(api.outboundList({ to: persona.msisdn, interactive: m.interactive }));
    } else if (m.interactive?.type === "button") {
      wire.push(api.outboundButtons({ to: persona.msisdn, interactive: m.interactive }));
    } else if (m.attachment) {
      wire.push(api.outboundDocument({
        to: persona.msisdn,
        link: `https://pfa.sharepoint.com/sites/Complaints/${encodeURIComponent(m.attachment.name)}`,
        filename: m.attachment.name,
        caption: m.body,
      }));
    } else {
      wire.push(api.outboundText({ to: persona.msisdn, body: m.body }));
    }
    wire.push(api.sendAccepted({ to: persona.msisdn, wamid: m.wamid }));
  });

  pushWire(wire);
  (turn.audit || []).forEach((a) => pushAudit({ actor: "system", entity: "conversation", entityId: conv.id, ...a }));

  scheduleReceipts(conv.id, justSent.map((m) => m.id), persona.msisdn);

  return { messages: all, nlu: turn.nlu, otp: effectResult.otp };
}

// While a consultant has the conversation, the complainant's message still has
// to reach the console — it just must not get a bot reply. An assistant that
// keeps interjecting through a handover is worse than no assistant.
export function sendInboundDuringHandover(personaId, input) {
  const s = getState();
  const persona = personaById(s, personaId);
  const conv = conversationFor(s, personaId);
  if (!persona || !conv) return;

  const t = now();
  const id = `in:${conv.id}:${conv.messages.length}`;
  const mid = wamid(id);
  const nlu = input.type === "text" ? classify(input.text) : null;

  appendMessages(conv.id, [
    input.type === "document"
      ? { dir: "in", type: "document", body: "", author: "citizen", wamid: mid,
          attachment: { name: input.file.name, size: bytes(input.file.size), kind: input.file.kind } }
      : { dir: "in", type: "text", body: input.text ?? input.reply?.title ?? "", author: "citizen", wamid: mid, nlu },
  ]);

  pushWire(
    input.type === "document"
      ? api.inboundDocument({ from: persona.msisdn, name: persona.name, wamid: mid, file: input.file,
          mediaId: mediaId(input.file.id), sha256: fakeHash(`${conv.id}:${input.file.name}`), timestamp: t })
      : api.inboundText({ from: persona.msisdn, name: persona.name, wamid: mid, body: input.text ?? "", timestamp: t }),
  );
}

// Used by the console when an agent replies. Kept here so all outbound
// messaging — bot or human — goes through one place and emits the same wire
// records.
export function sendAgentMessage(convId, { body, agent, templateName, params }) {
  const s = getState();
  const conv = s.conversations.find((c) => c.id === convId);
  if (!conv) return;
  const persona = personaById(s, conv.personaId);

  const tpl = templateName ? templateByName(s.templates, templateName) : null;
  const text = tpl ? fillTemplate(tpl.body, params || []) : body;

  appendMessages(convId, [{
    dir: "out", type: tpl ? "template" : "text", body: text,
    author: `agent:${agent.id}`, authorName: agent.name,
    templateName: templateName || null,
  }]);

  const sent = getState().conversations.find((c) => c.id === convId).messages.slice(-1)[0];

  pushWire([
    tpl
      ? api.outboundTemplate({ to: persona.msisdn, name: templateName, language: tpl.language, params: params || [] })
      : api.outboundText({ to: persona.msisdn, body: text }),
    api.sendAccepted({ to: persona.msisdn, wamid: sent.wamid }),
  ]);

  if (tpl) {
    set((st) => ({
      ...st,
      templates: st.templates.map((x) =>
        x.name === templateName ? { ...x, lastUsedAt: now(), sent: x.sent + 1 } : x),
    }));
  }

  pushAudit({
    actor: agent.id, action: tpl ? "TEMPLATE_SENT" : "AGENT_REPLY",
    entity: "conversation", entityId: convId,
    detail: tpl ? `Template ${templateName} sent to ${e164(persona.msisdn)}` : text.slice(0, 90),
    severity: "INFO",
  });

  scheduleReceipts(convId, [sent.id], persona.msisdn);
}

// The rejection Meta returns for a free-form send outside the service window.
// Surfacing it is the point: the console must not appear to succeed.
export function rejectOutOfWindow(convId) {
  const s = getState();
  const conv = s.conversations.find((c) => c.id === convId);
  const persona = personaById(s, conv.personaId);
  pushWire([
    api.outboundText({ to: persona.msisdn, body: "(blocked by the console before sending)" }),
    api.sendRejected({ error: api.WINDOW_ERROR }),
  ]);
  pushAudit({
    actor: s.console.userId, action: "SEND_BLOCKED", entity: "conversation", entityId: convId,
    detail: `Meta error ${api.WINDOW_ERROR.code} — 24-hour service window closed`, severity: "NOTICE",
  });
}

export { documentsFor };
