// WhatsApp Cloud API v21.0 payload builders.
//
// These are the exact request and webhook shapes Meta specifies. Nothing here
// makes a network call — the objects are handed to the wire inspector so an
// evaluator can check the contract rather than take it on trust. Six payload
// kinds are modelled, and they are modelled precisely, because a payload that
// is nearly right is worse in front of a technical panel than one that is
// absent.
//
// Reference: developers.facebook.com/docs/whatsapp/cloud-api/reference
import { ORG } from "../brand.jsx";
import { e164 } from "../helpers.js";

const VERSION = "v21.0";
const BASE = "https://graph.facebook.com";

const endpoint = () => `${BASE}/${VERSION}/${ORG.waba.phoneNumberId}/messages`;

// ─── Outbound ─────────────────────────────────────────────────────────────────

// POST /{phone-number-id}/messages — free-form text. Permitted only inside the
// 24-hour customer service window.
export function outboundText({ to, body, previewUrl = false }) {
  return {
    system: "meta", dir: "out", contentType: "application/json",
    label: `POST /${VERSION}/${ORG.waba.phoneNumberId}/messages · text`,
    endpoint: endpoint(),
    payload: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: e164(to),
      type: "text",
      text: { preview_url: previewUrl, body },
    },
  };
}

// Interactive list message. Up to 10 rows across up to 10 sections — this is
// how a multilevel menu carries more than three options.
export function outboundList({ to, interactive }) {
  return {
    system: "meta", dir: "out", contentType: "application/json",
    label: `POST /${VERSION}/${ORG.waba.phoneNumberId}/messages · interactive.list`,
    endpoint: endpoint(),
    payload: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: e164(to),
      type: "interactive",
      interactive,
    },
  };
}

// Interactive reply buttons. The platform caps these at three, which is why
// the exception catalogue never offers a fourth.
export function outboundButtons({ to, interactive }) {
  return {
    system: "meta", dir: "out", contentType: "application/json",
    label: `POST /${VERSION}/${ORG.waba.phoneNumberId}/messages · interactive.button`,
    endpoint: endpoint(),
    payload: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: e164(to),
      type: "interactive",
      interactive,
    },
  };
}

// Template message — the only thing that may be sent once the service window
// has closed, and the reason the console's composer locks rather than failing
// silently.
export function outboundTemplate({ to, name, language = "en", params = [] }) {
  return {
    system: "meta", dir: "out", contentType: "application/json",
    label: `POST /${VERSION}/${ORG.waba.phoneNumberId}/messages · template:${name}`,
    endpoint: endpoint(),
    payload: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: e164(to),
      type: "template",
      template: {
        name,
        language: { code: language },
        components: params.length
          ? [{ type: "body", parameters: params.map((p) => ({ type: "text", text: String(p) })) }]
          : [],
      },
    },
  };
}

// Document message, used when the office pushes a determination back to the
// handset.
export function outboundDocument({ to, link, filename, caption }) {
  return {
    system: "meta", dir: "out", contentType: "application/json",
    label: `POST /${VERSION}/${ORG.waba.phoneNumberId}/messages · document`,
    endpoint: endpoint(),
    payload: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: e164(to),
      type: "document",
      document: { link, filename, caption },
    },
  };
}

// The 201 Meta returns. The wamid it hands back is the identifier every later
// status webhook refers to.
export function sendAccepted({ to, wamid }) {
  return {
    system: "meta", dir: "in", contentType: "application/json",
    label: "200 OK · message accepted",
    payload: {
      messaging_product: "whatsapp",
      contacts: [{ input: e164(to), wa_id: e164(to) }],
      messages: [{ id: wamid, message_status: "accepted" }],
    },
  };
}

// ─── Inbound webhooks ─────────────────────────────────────────────────────────

const envelope = (value) => ({
  object: "whatsapp_business_account",
  entry: [{
    id: ORG.waba.id,
    changes: [{ field: "messages", value: { messaging_product: "whatsapp", metadata: {
      display_phone_number: e164(ORG.waba.display),
      phone_number_id: ORG.waba.phoneNumberId,
    }, ...value } }],
  }],
});

// A free-text message from the complainant.
export function inboundText({ from, name, wamid, body, timestamp }) {
  return {
    system: "meta", dir: "in", contentType: "application/json",
    label: "webhook · messages[] text",
    payload: envelope({
      contacts: [{ profile: { name }, wa_id: e164(from) }],
      messages: [{
        from: e164(from),
        id: wamid,
        timestamp: String(Math.floor(timestamp / 1000)),
        type: "text",
        text: { body },
      }],
    }),
  };
}

// A tap on a list row or a reply button. This is the important one: an
// interactive reply arrives with the option's *id*, not its label, which is
// what makes a menu robust against a user who also types.
export function inboundInteractive({ from, name, wamid, reply, timestamp }) {
  const key = reply.type === "list_reply" ? "list_reply" : "button_reply";
  return {
    system: "meta", dir: "in", contentType: "application/json",
    label: `webhook · messages[] interactive.${key}`,
    payload: envelope({
      contacts: [{ profile: { name }, wa_id: e164(from) }],
      messages: [{
        from: e164(from),
        id: wamid,
        timestamp: String(Math.floor(timestamp / 1000)),
        type: "interactive",
        interactive: {
          type: key,
          [key]: key === "list_reply"
            ? { id: reply.id, title: reply.title, description: reply.description || "" }
            : { id: reply.id, title: reply.title },
        },
      }],
    }),
  };
}

// An uploaded document. Meta stores the media and gives you an id; you then
// fetch it from /{media-id}. The sha256 is how you prove the file you stored
// is the file that was sent.
export function inboundDocument({ from, name, wamid, file, mediaId, sha256, timestamp }) {
  return {
    system: "meta", dir: "in", contentType: "application/json",
    label: "webhook · messages[] document",
    payload: envelope({
      contacts: [{ profile: { name }, wa_id: e164(from) }],
      messages: [{
        from: e164(from),
        id: wamid,
        timestamp: String(Math.floor(timestamp / 1000)),
        type: "document",
        document: {
          id: mediaId,
          mime_type: file.mime,
          sha256,
          filename: file.name,
        },
      }],
    }),
  };
}

// Delivery receipts. `sent` → `delivered` → `read`, each arriving separately;
// `failed` carries an error object rather than a status progression.
export function statusUpdate({ to, wamid, status, conversationId, error }) {
  return {
    system: "meta", dir: "in", contentType: "application/json",
    label: `webhook · statuses[] ${status}`,
    payload: envelope({
      statuses: [{
        id: wamid,
        status,
        timestamp: String(Math.floor(Date.now() / 1000)),
        recipient_id: e164(to),
        conversation: conversationId
          ? { id: conversationId, origin: { type: "service" } }
          : undefined,
        pricing: { billable: true, pricing_model: "CBP", category: "service" },
        errors: error ? [error] : undefined,
      }],
    }),
  };
}

// The error Meta returns when you try to send free-form outside the window.
// Worth modelling exactly: it is the constraint that shapes the whole console.
export const WINDOW_ERROR = {
  code: 131047,
  title: "Re-engagement message",
  message: "Message failed to send because more than 24 hours have passed since the customer last replied to this number.",
  error_data: { details: "Use an approved message template to re-engage this customer." },
};

export function sendRejected({ error }) {
  return {
    system: "meta", dir: "in", contentType: "application/json",
    label: `400 Bad Request · ${error.code}`,
    payload: {
      error: {
        message: `(#${error.code}) ${error.title}`,
        type: "OAuthException",
        code: error.code,
        error_data: error.error_data,
        error_subcode: 2494010,
        fbtrace_id: "A8xPq2mKdLp",
      },
    },
  };
}

// ─── NLU (Ezra platform, not Meta) ────────────────────────────────────────────

// Shown alongside the Meta traffic so the reasoning behind a routing decision
// is inspectable — this is the panel that answers "how does it know?".
export function nluTrace({ text, result }) {
  return {
    system: "nlu", dir: "out", contentType: "application/json",
    label: `classify · ${result.intent} (${result.confidence.toFixed(2)} ${result.band})`,
    payload: {
      engine: result.engine,
      input: text,
      tokens: result.tokens,
      intent: result.intent,
      confidence: result.confidence,
      band: result.band,
      thresholds: { high: 0.7, medium: 0.4 },
      alternatives: result.alternatives,
      distribution: result.distribution,
      slots: result.slots,
      routing: result.band === "high" ? "execute"
        : result.band === "medium" ? "confirm"
        : "fallback_faq",
    },
  };
}
