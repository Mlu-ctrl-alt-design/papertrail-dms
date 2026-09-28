// The conversation transcript.
//
// Rendered twice with different chrome: `device` inside the handset in the
// simulator, `console` in the agent inbox. It stays in src/opfa/ rather than
// the design system because it is OPFA-shaped — intent captions, service
// window markers and handoff dividers are this product's vocabulary, not
// WhatsApp's.
import { useEffect, useMemo, useRef } from "react";
import { I, WA, WaBody, Ticks, AttachmentCard } from "../../components/index.js";
import { Person20Filled, ShieldCheckmark20Filled } from "@fluentui/react-icons";
import { OPFA } from "../brand.jsx";
import { clockTime, confidenceStyle, shortDate } from "../helpers.js";
import { InteractiveMessage } from "./Interactive.jsx";

// ─── Message parts ────────────────────────────────────────────────────────────

// A day separator, as WhatsApp draws it.
function DayChip({ label }) {
  return (
    <div style={{ textAlign: "center", margin: "12px 0 10px" }}>
      <span style={{
        background: "#ffffffcc", color: WA.meta, fontSize: 10, fontWeight: 600,
        padding: "3px 10px", borderRadius: 8,
      }}>{label}</span>
    </div>
  );
}

// System events — handoff, window closure, consent capture. Drawn as a centred
// note rather than a bubble: they did not come from either party.
function SystemNote({ body }) {
  return (
    <div style={{ textAlign: "center", margin: "10px 0" }}>
      <span style={{
        display: "inline-block", maxWidth: "88%",
        background: "rgba(255,241,200,0.92)", color: "#5c4a1a",
        fontSize: 10.5, lineHeight: 1.5, padding: "5px 11px", borderRadius: 7,
      }}>{body}</span>
    </div>
  );
}

// The intent caption under an inbound message. Off by default on the handset
// (it would break the illusion), always on in the console — an agent picking
// up a conversation needs to know what the bot thought it was about.
function NluCaption({ nlu, align }) {
  if (!nlu) return null;
  const st = confidenceStyle(nlu.band);
  return (
    <div style={{
      display: "flex", justifyContent: align, gap: 5, marginTop: 3,
      alignItems: "center", flexWrap: "wrap",
    }}>
      <span style={{
        fontSize: 9, fontWeight: 700, borderRadius: 3, padding: "1px 5px",
        background: st.bg, color: st.fg, fontFamily: "ui-monospace,Menlo,monospace",
      }}>
        {nlu.intent} · {nlu.confidence.toFixed(2)}
      </span>
      {nlu.alternatives?.length > 0 && (
        <span style={{ fontSize: 9, color: WA.meta }}>
          alt: {nlu.alternatives.map((a) => `${a.id} ${a.confidence.toFixed(2)}`).join(", ")}
        </span>
      )}
    </div>
  );
}

function Bubble({ m, variant, showNlu, onInteractive, onOpenList, disabled }) {
  const fromOffice = m.dir === "out";

  // Whose screen this is decides which side a message sits on. On the
  // complainant's handset the OPFA's messages are *incoming* — white, left.
  // In the agent console the perspective is the office's, so the same message
  // is outgoing — green, right. Rendering both from one flag is how a
  // simulator ends up showing the business talking to itself.
  const mine = variant === "console" ? fromOffice : !fromOffice;

  const align = mine ? "flex-end" : "flex-start";
  const bg = mine ? WA.bubbleOut : WA.bubble;
  const radius = mine ? "8px 0 8px 8px" : "0 8px 8px 8px";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align, marginBottom: 7 }}>
      {fromOffice && m.author?.startsWith("agent:") && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <I as={Person20Filled} size={10} color={OPFA.navy} />
          <span style={{ fontSize: 9.5, fontWeight: 700, color: OPFA.navy }}>{m.authorName || "OPFA consultant"}</span>
        </div>
      )}
      <div className="fade-up" style={{
        background: bg, borderRadius: radius, padding: 8,
        maxWidth: variant === "console" ? "74%" : "88%",
        boxShadow: "0 1px 1px rgba(0,0,0,0.13)", minWidth: 96,
      }}>
        {m.templateName && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 5,
            fontSize: 8.5, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase",
            color: OPFA.purple, background: "#f0eaf8", borderRadius: 3, padding: "1px 5px",
          }}>
            <I as={ShieldCheckmark20Filled} size={9} color={OPFA.purple} />
            template · {m.templateName}
          </div>
        )}
        {m.attachment && <AttachmentCard attachment={m.attachment} />}
        {m.body && <WaBody text={m.body} />}
        {m.interactive && (
          <InteractiveMessage
            interactive={m.interactive}
            onSelect={onInteractive}
            onOpenList={variant === "console" ? undefined : onOpenList}
            disabled={disabled || variant === "console"}
          />
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, marginTop: 3 }}>
          <span style={{ fontSize: 9.5, color: WA.meta }}>{clockTime(m.at)}</span>
          {mine && <Ticks state={m.status} size={14} />}
        </div>
      </div>
      {showNlu && !fromOffice && <NluCaption nlu={m.nlu} align={align} />}
    </div>
  );
}

// Three dots, the WhatsApp way. Present so a bot reply has a beat before it
// lands — an instant answer reads as a lookup table, not a conversation.
export function TypingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 7 }}>
      <div style={{
        background: WA.bubble, borderRadius: "0 8px 8px 8px", padding: "10px 13px",
        boxShadow: "0 1px 1px rgba(0,0,0,0.13)", display: "flex", gap: 4,
      }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: "50%", background: WA.meta,
            animation: `pulse2 1.1s ${i * 0.18}s infinite ease-in-out`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Transcript ───────────────────────────────────────────────────────────────

export function Conversation({
  messages, variant = "device", showNlu = false, typing = false,
  onInteractive, onOpenList, disabled, emptyHint,
}) {
  const endRef = useRef(null);

  // Autoscroll on new content. This is a DOM side effect keyed to the message
  // count, which is exactly what an effect is for — no state is being set.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typing]);

  const bg = variant === "console"
    ? { background: WA.paper, backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "16px 16px" }
    : { background: WA.paper, backgroundImage: "radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)", backgroundSize: "14px 14px" };

  // Day separators are derived up front rather than by mutating a cursor
  // during the map — the render pass must not carry state between items.
  const withChips = useMemo(() => messages.map((m, i) => {
    const day = shortDate(m.at);
    const prev = i > 0 ? shortDate(messages[i - 1].at) : null;
    return { m, chip: day === prev ? null : day };
  }), [messages]);

  return (
    <div style={{
      ...bg, flex: 1, overflowY: "auto", minHeight: 0,
      padding: variant === "console" ? "14px 18px" : "10px 10px 14px",
    }}>
      {messages.length === 0 && (
        <div style={{ textAlign: "center", color: WA.meta, fontSize: 12, marginTop: 80, padding: "0 30px", lineHeight: 1.65 }}>
          {emptyHint || "No messages yet."}
        </div>
      )}
      {withChips.map(({ m, chip }) => (
          <div key={m.id}>
            {chip && <DayChip label={chip} />}
            {m.dir === "system"
              ? <SystemNote body={m.body} />
              : <Bubble m={m} variant={variant} showNlu={showNlu || variant === "console"}
                        onInteractive={onInteractive} onOpenList={onOpenList}
                        disabled={disabled} />}
          </div>
      ))}
      {typing && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  );
}

// Chat header for the handset: the OPFA's verified business account.
export function ChatHeader({ title, subtitle, right }) {
  return (
    <div style={{ background: WA.header, padding: "8px 12px 10px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%", background: "#fff",
        display: "grid", placeItems: "center", flexShrink: 0, overflow: "hidden",
      }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: OPFA.navy, letterSpacing: "-0.4px" }}>PFA</span>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </div>
        <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
          {subtitle}
        </div>
      </div>
      {right}
    </div>
  );
}
