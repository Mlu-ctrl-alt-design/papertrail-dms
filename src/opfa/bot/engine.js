// The conversation engine.
//
// One entry point, `step()`, which is a pure function of (session, input,
// ctx). It reads the graph in flows.js, decides what to say, and returns the
// messages, the effects it wants applied and the wire records it generated.
// It never touches the store, React or the network — the caller in
// ../session.js does all of that.
//
// The one deliberate exception is `ctx.verify`: OTP verification is inherently
// stateful (attempt counters, lockouts), so the caller injects a verifier
// function rather than the engine reaching for one. The impurity is a
// parameter, which keeps the engine testable in isolation.
//
// Everything the engine guarantees:
//   · A turn always produces at least one outbound message.
//   · An error always offers at least one way forward. The conversation
//     cannot dead-end.
//   · A prompt retries a bounded number of times, then offers a human.
//   · Sub-menus push their parent, so "Back" works at any depth without a
//     back edge being declared on every node.
import { FLOWS, ESCAPES, ENTRY_NODE } from "./flows.js";
import { renderError } from "./exceptions.js";
import { classify, HIGH, LOW, intentById } from "./nlu.js";
import { searchFaq } from "./faq.js";

const MAX_HOPS = 14;

// Where an error's recovery buttons lead. `null` means "re-ask the node that
// just failed", which is the difference between "try again" and "start over".
const ERROR_ROUTES = {
  menu: "main_menu",
  agent: "handoff",
  lodge: "lodge_link",
  find_by_id: "ask_id_number",
  track: "ask_case_ref",
  consent_yes: "consent_captured",
  consent_info: "consent_detail",
  retry: null,
  resend: null,
};

// `body`, `sections[].rows` and friends may be functions of the context, so
// a node can read the caller's cases without the graph importing anything.
const val = (x, ctx) => (typeof x === "function" ? x(ctx) : x);

// ─── Message construction ─────────────────────────────────────────────────────

function buildList(node, ctx) {
  const options = {};
  const sections = val(node.sections, ctx).map((sec) => ({
    title: val(sec.title, ctx),
    rows: val(sec.rows, ctx).map((row) => {
      options[row.id] = { next: row.next, slot: node.slot, slotFrom: node.slotFrom, title: row.title };
      return {
        id: row.id,
        title: row.title,
        ...(row.description ? { description: row.description } : null),
      };
    }),
  }));

  return {
    options,
    message: {
      type: "interactive",
      body: val(node.body, ctx),
      interactive: {
        type: "list",
        ...(node.header ? { header: { type: "text", text: val(node.header, ctx) } } : null),
        body: { text: val(node.body, ctx) },
        ...(node.footer ? { footer: { text: val(node.footer, ctx) } } : null),
        action: { button: val(node.button, ctx) || "Choose", sections },
      },
    },
  };
}

function buildButtons(node, ctx) {
  const options = {};
  // The platform caps reply buttons at three. Declaring a fourth is a bug in
  // the flow, and silently dropping it here is better than a rejected send.
  const buttons = val(node.buttons, ctx).slice(0, 3).map((b) => {
    options[b.id] = { next: b.next, slot: node.slot, slotFrom: node.slotFrom, title: b.title };
    return { type: "reply", reply: { id: b.id, title: b.title } };
  });

  return {
    options,
    message: {
      type: "interactive",
      body: val(node.body, ctx),
      interactive: {
        type: "button",
        body: { text: val(node.body, ctx) },
        ...(node.footer ? { footer: { text: val(node.footer, ctx) } } : null),
        action: { buttons },
      },
    },
  };
}

// An error is rendered as a buttons message so the recovery options are
// tappable rather than something the user has to retype at the moment they
// are already confused.
function buildError(code, vars, failedNode) {
  const e = renderError(code, vars);
  const options = {};
  const buttons = e.options.map((o) => {
    options[o.id] = { next: ERROR_ROUTES[o.id] ?? failedNode, title: o.title, recovery: o.id };
    return { type: "reply", reply: { id: o.id, title: o.title } };
  });

  return {
    code,
    severity: e.severity,
    options,
    message: {
      type: "interactive",
      body: e.body,
      interactive: {
        type: "button",
        body: { text: e.body },
        action: { buttons },
      },
    },
  };
}

// ─── Advancing through the graph ──────────────────────────────────────────────

// Walks from `startId` emitting messages until it reaches a node that waits
// for input. Returns everything the caller needs to apply.
function advance(startId, session, ctx) {
  const out = {
    messages: [], effects: [], wire: [], audit: [], system: [],
    templates: [], respond: [], sharepoint: [], faq: null,
  };
  let sess = { ...session, slots: { ...session.slots } };
  let nodeId = startId;
  let hops = 0;

  while (nodeId && hops++ < MAX_HOPS) {
    const node = FLOWS[nodeId];
    if (!node) {
      // An unknown node id is a bug in the graph, not a user error — but the
      // person on the handset must not be the one who pays for it.
      const err = buildError("E_NO_MATCH", {}, "main_menu");
      out.messages.push(err.message);
      out.audit.push({ action: "BOT_FLOW_ERROR", detail: `Unknown node "${nodeId}"`, severity: "ALERT" });
      sess = { ...sess, nodeId: "main_menu", options: err.options, retries: 0 };
      return { session: sess, ...out };
    }

    const localCtx = { ...ctx, slots: sess.slots, session: sess };

    if (node.kind === "say") {
      out.messages.push({ type: "text", body: val(node.body, localCtx) });
      nodeId = node.next;
      continue;
    }

    if (node.kind === "action") {
      const r = node.run(localCtx) || {};
      if (r.slots) sess = { ...sess, slots: { ...sess.slots, ...r.slots } };
      (r.say || []).forEach((m) => out.messages.push({ type: "text", ...m }));
      if (r.effects) out.effects.push(...r.effects);
      if (r.template) out.templates.push(r.template);
      if (r.respond) out.respond.push(r.respond);
      if (r.respondFault) out.respond.push({ kind: "fault", ticket: r.respondFault });
      if (r.sharepoint) out.sharepoint.push(r.sharepoint);
      if (r.system) out.system.push(r.system);
      if (r.faq) out.faq = r.faq;

      if (r.error) {
        const err = buildError(r.error, r.vars, r.next || sess.nodeId || "main_menu");
        out.messages.push(err.message);
        out.audit.push({
          action: "BOT_EXCEPTION", detail: `${r.error} at ${nodeId}`, severity: err.severity,
        });
        sess = { ...sess, nodeId: `error:${nodeId}`, options: err.options, retries: 0 };
        return { session: sess, ...out };
      }

      nodeId = r.next;
      continue;
    }

    if (node.kind === "list") {
      const { options, message } = buildList(node, localCtx);
      out.messages.push(message);
      sess = { ...sess, nodeId, options, retries: 0, stack: pushStack(sess, nodeId) };
      return { session: sess, ...out };
    }

    if (node.kind === "buttons") {
      const { options, message } = buildButtons(node, localCtx);
      out.messages.push(message);
      sess = { ...sess, nodeId, options, retries: 0, stack: pushStack(sess, nodeId) };
      return { session: sess, ...out };
    }

    if (node.kind === "prompt") {
      out.messages.push({ type: "text", body: val(node.body, localCtx) });
      sess = { ...sess, nodeId, options: null, retries: 0 };
      return { session: sess, ...out };
    }

    if (node.kind === "end") {
      sess = { ...sess, nodeId, options: null, retries: 0 };
      return { session: sess, ...out };
    }

    nodeId = null;
  }

  if (hops >= MAX_HOPS) {
    out.audit.push({ action: "BOT_FLOW_ERROR", detail: `Hop limit reached from "${startId}"`, severity: "ALERT" });
  }
  return { session: sess, ...out };
}

// Menus push their parent so "Back" is free at any depth. Only menus push —
// prompts and actions are steps within a journey, not places to return to.
function pushStack(sess, nodeId) {
  const stack = sess.stack || [];
  if (stack[stack.length - 1] === nodeId) return stack;
  return [...stack, nodeId].slice(-6);
}

// ─── The turn ─────────────────────────────────────────────────────────────────

// input:
//   { type: "text",        text }
//   { type: "interactive", reply: { id, title } }
//   { type: "document",    file }
//
// ctx:
//   { persona, conversation, cases, allCases, documents, queuePosition,
//     ticket, verify: { otp(code) -> { ok, code?, remaining? } } }
export function step({ session, input, ctx }) {
  const sess = session?.nodeId
    ? session
    : { nodeId: null, stack: [], slots: {}, retries: 0, options: null };

  // ── Interactive replies ────────────────────────────────────────────────────
  if (input.type === "interactive") {
    const opt = sess.options?.[input.reply.id];

    if (!opt) {
      // A tap on a stale message — the user scrolled up and pressed a button
      // from three turns ago. Re-orienting beats pretending it did not happen.
      const err = buildError("E_MENU_INVALID", { input: input.reply.title }, "main_menu");
      return {
        session: { ...sess, nodeId: "error:stale", options: err.options },
        messages: [err.message],
        effects: [], wire: [], system: [], templates: [], respond: [], sharepoint: [],
        audit: [{ action: "BOT_EXCEPTION", detail: "Reply to a superseded message", severity: "INFO" }],
        nlu: null, faq: null,
      };
    }

    let next = { ...sess, slots: { ...sess.slots } };
    if (opt.slot) {
      next.slots[opt.slot] = opt.slotFrom ? opt.slotFrom(input.reply.id) : input.reply.id;
    }

    // "Send a new code" has to reissue before re-asking, or the user retypes
    // the code that just expired.
    const extraEffects = opt.recovery === "resend" ? [{ type: "reissueOtp" }] : [];
    const target = opt.next ?? sess.nodeId?.replace(/^error:/, "") ?? "main_menu";
    const r = advance(target, next, ctx);
    return { ...r, effects: [...extraEffects, ...r.effects], nlu: null };
  }

  // ── Documents ──────────────────────────────────────────────────────────────
  if (input.type === "document") {
    const node = FLOWS[sess.nodeId];
    if (node?.expects === "document" && node.onDocument) {
      return { ...advance(node.onDocument, sess, { ...ctx, document: input.file }), nlu: null };
    }
    // An unprompted attachment is a reasonable thing for someone to do. Offer
    // to file it rather than telling them they are in the wrong place.
    const r = advance("docs_upload", { ...sess, slots: { ...sess.slots } }, { ...ctx, document: input.file });
    return {
      ...r,
      messages: [
        { type: "text", body: "Thanks — I can file that against one of your complaints." },
        ...r.messages,
      ],
      nlu: null,
    };
  }

  // ── Free text ──────────────────────────────────────────────────────────────
  const raw = String(input.text || "").trim();
  const lower = raw.toLowerCase();

  // Global escapes, honoured from anywhere including mid-prompt. STOP in
  // particular must work at every point in the conversation — that is what an
  // opt-out instruction means.
  if (ESCAPES[lower]) {
    const r = advance(ESCAPES[lower], { ...sess, retries: 0 }, ctx);
    return { ...r, nlu: null };
  }

  const node = FLOWS[sess.nodeId];

  // A pending prompt owns the turn.
  if (node?.kind === "prompt") {
    return handlePrompt({ node, sess, raw, ctx });
  }

  // A pending menu: accept a typed option title as well as a tap, because
  // people type.
  if (sess.options) {
    const typed = Object.entries(sess.options).find(([, o]) =>
      o.title && o.title.toLowerCase() === lower);
    if (typed) {
      return step({ session: sess, input: { type: "interactive", reply: { id: typed[0], title: typed[1].title } }, ctx });
    }
  }

  return handleNatural({ sess, raw, ctx });
}

// ─── Prompt handling ──────────────────────────────────────────────────────────

function handlePrompt({ node, sess, raw, ctx }) {
  const base = { wire: [], system: [], templates: [], respond: [], sharepoint: [], faq: null, nlu: null };
  const value = node.normalise ? node.normalise(raw) : raw;
  const localCtx = { ...ctx, slots: sess.slots, session: sess };

  // Stateful verification (OTP) goes through the injected verifier.
  if (node.verify === "otp") {
    const result = ctx.verify?.otp?.(value) || { ok: false, code: "E_OTP_NONE" };
    if (result.ok) {
      const next = { ...sess, slots: { ...sess.slots, [node.slot]: value }, retries: 0 };
      return { ...base, ...advance(node.onValid, next, ctx) };
    }
    return failPrompt({ node, sess, code: result.code, vars: { remaining: result.remaining ?? 0 }, ctx });
  }

  if (node.expects === "document") {
    // The user typed where an attachment was expected. Not an error worth a
    // catalogue entry — just say what is needed.
    const retries = (sess.retries || 0) + 1;
    if (retries > (node.maxRetries ?? 2)) {
      return { ...base, ...advance(node.onExhausted || "handoff_offer", { ...sess, retries: 0 }, ctx) };
    }
    return {
      ...base,
      session: { ...sess, retries },
      messages: [{
        type: "text",
        body: "I still need the document itself. Tap the 📎 button below the message box and choose a file.\n\nReply *0* to go back to the menu.",
      }],
      effects: [], audit: [],
    };
  }

  const check = node.validate ? node.validate(value, localCtx) : { ok: true, value };
  if (check.ok) {
    const next = { ...sess, slots: { ...sess.slots, [node.slot]: check.value ?? value }, retries: 0 };
    return { ...base, ...advance(node.onValid, next, ctx) };
  }

  return failPrompt({ node, sess, code: check.code, vars: check.vars, ctx });
}

// Bounded retries, then a human. This is the guarantee that nobody gets stuck
// in a validation loop with a machine.
function failPrompt({ node, sess, code, vars, ctx }) {
  const retries = (sess.retries || 0) + 1;
  const limit = node.maxRetries ?? 2;

  if (retries > limit) {
    const r = advance(node.onExhausted || "handoff_offer", { ...sess, retries: 0 }, ctx);
    return {
      ...r,
      audit: [
        { action: "BOT_EXCEPTION", detail: `${code} — retry limit reached at ${sess.nodeId}`, severity: "NOTICE" },
        ...r.audit,
      ],
      nlu: null,
    };
  }

  const err = buildError(code, vars, sess.nodeId);
  return {
    session: { ...sess, retries, nodeId: sess.nodeId, options: err.options },
    messages: [err.message],
    effects: [], wire: [], system: [], templates: [], respond: [], sharepoint: [],
    audit: [{ action: "BOT_EXCEPTION", detail: `${code} at ${sess.nodeId} (attempt ${retries})`, severity: err.severity }],
    nlu: null, faq: null,
  };
}

// ─── Natural language routing ─────────────────────────────────────────────────

// The three-band behaviour: act, confirm, or fall back. This is what makes the
// NLU tier read as a real one — an assistant that always takes the argmax is
// confidently wrong at exactly the moments that matter.
function handleNatural({ sess, raw, ctx }) {
  const nlu = classify(raw);
  const base = { wire: [], system: [], templates: [], respond: [], sharepoint: [], faq: null };

  if (nlu.confidence >= HIGH && nlu.node) {
    const slots = { ...sess.slots, ...nlu.slots };
    const intent = intentById(nlu.intent);
    const r = advance(nlu.node, { ...sess, slots, retries: 0 }, ctx);
    return {
      ...base, ...r,
      messages: intent?.ack ? [{ type: "text", body: intent.ack }, ...r.messages] : r.messages,
      nlu,
    };
  }

  if (nlu.confidence >= LOW && nlu.node) {
    // One tap to confirm beats a wrong answer delivered with conviction. The
    // confirmations also feed the "top misclassified" figure in Reports.
    const label = nlu.intent.replaceAll("_", " ");
    const options = {
      confirm_yes: { next: nlu.node, title: "Yes, that's it" },
      confirm_menu: { next: "main_menu", title: "No, show the menu" },
      confirm_agent: { next: "handoff", title: "Talk to a consultant" },
    };
    return {
      ...base,
      session: { ...sess, nodeId: "confirm", options, retries: 0, slots: { ...sess.slots, ...nlu.slots } },
      messages: [{
        type: "interactive",
        body: `I think you'd like to *${label}*. Is that right?`,
        interactive: {
          type: "button",
          body: { text: `I think you'd like to *${label}*. Is that right?` },
          action: {
            buttons: Object.entries(options).map(([id, o]) => ({ type: "reply", reply: { id, title: o.title } })),
          },
        },
      }],
      effects: [],
      audit: [{ action: "NLU_DISAMBIGUATION", detail: `${nlu.intent} at ${nlu.confidence.toFixed(2)} — asked to confirm`, severity: "INFO" }],
      nlu,
    };
  }

  // Low confidence: try the FAQ corpus before admitting defeat. This is the
  // difference between a bot that deflects and one that escalates everything
  // it did not immediately recognise.
  const hit = searchFaq(raw);
  if (hit) {
    const r = advance("faq_lookup", { ...sess, retries: 0 }, { ...ctx, input: { text: raw } });
    return { ...base, ...r, nlu, faq: hit };
  }

  const err = buildError("E_NO_MATCH", {}, "main_menu");
  return {
    ...base,
    session: { ...sess, nodeId: "error:no_match", options: err.options, retries: 0 },
    messages: [err.message],
    effects: [],
    audit: [{ action: "NLU_FALLBACK", detail: `No intent or FAQ match for "${raw.slice(0, 60)}"`, severity: "INFO" }],
    nlu,
  };
}

// Opening turn: a conversation with no session starts at the welcome node.
export function open({ ctx }) {
  return { ...advance(ENTRY_NODE, { nodeId: null, stack: [], slots: {}, retries: 0, options: null }, ctx), nlu: null };
}
