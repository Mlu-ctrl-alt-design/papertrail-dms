// OPFA WhatsApp — complainant simulator.
//
// A demo rig, not a product screen: a handset in the middle, the controls for
// driving a demonstration on the left, and the actual API traffic on the
// right. The handset itself is the product; the two rails around it are there
// so an evaluation panel can see what is happening underneath without anyone
// having to open developer tools.
//
// Runs at #/wa. Shares its state with the console at #/opfa, including across
// two browser tabs.
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckmarkCircle20Filled, Code20Regular } from "@fluentui/react-icons";
import {
  GlobalStyles, ToastProvider, PhoneFrame, WA, I, C,
  useMaxWidth, BP,
} from "../components/index.js";
import { OPFA, ORG, PfaMark, PoweredByEzra } from "./brand.jsx";
import { useOpfa, now, activePersona, conversationFor, markConversationRead } from "./store.js";
import { sendInbound, sendInboundDuringHandover } from "./session.js";
import { clockTime, countdown, prettyMsisdn } from "./helpers.js";
import { Conversation, ChatHeader } from "./wa/Conversation.jsx";
import { ListSheet } from "./wa/Interactive.jsx";
import { Composer } from "./wa/Composer.jsx";
import { ScenarioRail } from "./wa/ScenarioRail.jsx";
import { WirePanel } from "./wa/WirePanel.jsx";

// How long the typing indicator holds before the reply lands. Long enough to
// read as a system doing work, short enough not to slow a walkthrough down.
const TYPING_MS = 620;

function Handset() {
  const s = useOpfa();
  const persona = activePersona(s);
  const conv = conversationFor(s, persona.id);
  const [typing, setTyping] = useState(false);
  const [nluOverlay, setNluOverlay] = useState(false);
  const timer = useRef(null);
  const narrow = useMaxWidth(BP.lg);
  const [wireOpen, setWireOpen] = useState(false);
  // The list sheet belongs to the handset, not to the bubble that opened
  // it — inside the transcript it would be clipped by that scroll container.
  const [listSheet, setListSheet] = useState(null);

  // The typing timer must not outlive the component — StrictMode mounts twice
  // in development, and an orphaned timeout would fire against a stale tab.
  useEffect(() => () => clearTimeout(timer.current), []);

  const t = now();
  const windowLeft = conv ? conv.windowExpiresAt - t : 0;
  const withAgent = conv?.mode === "agent";
  const queued = conv?.mode === "queued";

  const messages = useMemo(() => conv?.messages || [], [conv]);

  // Every path into the bot runs through here, so the typing beat and the
  // read-receipt bookkeeping are in one place rather than three.
  const send = (input) => {
    if (typing) return;
    setTyping(true);
    markConversationRead(conv.id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // While a consultant has the conversation, the bot stays out of it —
      // an assistant that keeps interjecting during a handover is worse than
      // no assistant.
      if (withAgent || queued) {
        sendInboundDuringHandover(persona.id, input);
      } else {
        sendInbound(persona.id, input);
      }
      setTyping(false);
    }, TYPING_MS);
  };

  const statusLine = queued
    ? "waiting for a consultant"
    : withAgent
      ? "with an OPFA consultant"
      : "Official business account";

  return (
    <>
      {/* ─ OPFA chrome ─ */}
      <header className="no-print" style={{
        background: OPFA.navy, borderBottom: `2px solid ${OPFA.navyDark}`,
        padding: "9px 16px", display: "flex", alignItems: "center", gap: 12,
        flexShrink: 0, minHeight: 54,
      }}>
        <PfaMark size={26} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            OPFA WhatsApp Business <span style={{ opacity: 0.6, fontWeight: 500 }}>· complainant simulator</span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10 }}>
            {ORG.waba.display} · WABA {ORG.waba.id}
          </div>
        </div>
        {narrow && (
          <button
            onClick={() => setWireOpen(true)}
            style={{
              background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 4, padding: "6px 10px", color: "#fff", cursor: "pointer",
              fontFamily: "inherit", fontSize: 11, fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            <I as={Code20Regular} size={13} /> Wire {s.wire.length}
          </button>
        )}
        <PoweredByEzra />
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <ScenarioRail
          onSend={(text) => send({ type: "text", text })}
          nluOverlay={nluOverlay}
          setNluOverlay={setNluOverlay}
          busy={typing}
        />

        {/* ─ Device stage ─ */}
        <div style={{
          flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "18px 16px",
          background: "linear-gradient(160deg,#eceef3 0%,#f5f6f8 60%,#fafafa 100%)",
          overflow: "auto",
        }}>
          <PhoneFrame width={344} headerBg={WA.header} statusTime={clockTime(t)}>
            {/* The frame is a fixed height so the transcript scrolls inside the
                handset rather than growing the page — a chat that pushes the
                phone off screen stops looking like a phone. */}
            <div style={{ height: 612, display: "flex", flexDirection: "column", position: "relative" }}>
              <ChatHeader
                title={ORG.short}
                subtitle={
                  <>
                    <I as={CheckmarkCircle20Filled} size={10} color={WA.green} /> {statusLine}
                  </>
                }
              />
              <Conversation
                messages={messages}
                variant="device"
                showNlu={nluOverlay}
                typing={typing}
                disabled={typing}
                onInteractive={(reply) => send({ type: "interactive", reply, replyKind: reply.type })}
                onOpenList={setListSheet}
                emptyHint="Send a message to start. Try “where is my complaint”."
              />
              <Composer
                onSend={(text) => send({ type: "text", text })}
                onAttach={(file) => send({ type: "document", file })}
                disabled={typing}
                placeholder={queued ? "Waiting for a consultant…" : "Message"}
              />
              {listSheet && (
                <ListSheet
                  interactive={listSheet}
                  onClose={() => setListSheet(null)}
                  onSelect={(reply) => send({ type: "interactive", reply, replyKind: reply.type })}
                />
              )}
            </div>
          </PhoneFrame>

          {/* Status strip under the handset: the policy state that decides
              what the office is allowed to send back. */}
          <div style={{
            marginTop: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
            justifyContent: "center", fontSize: 11, color: C.muted,
          }}>
            <span><strong style={{ color: C.ink }}>{persona.name}</strong> · {prettyMsisdn(persona.msisdn)}</span>
            <span style={{ color: C.hairline }}>|</span>
            <span>
              Service window{" "}
              <strong style={{ color: windowLeft > 0 ? C.success : C.danger, fontVariantNumeric: "tabular-nums" }}>
                {countdown(windowLeft)}
              </strong>
            </span>
            <span style={{ color: C.hairline }}>|</span>
            <span>Mode <strong style={{ color: C.ink }}>{conv?.mode || "bot"}</strong></span>
          </div>
        </div>

        {(!narrow || wireOpen) && (
          <WirePanel variant="device" onClose={narrow ? () => setWireOpen(false) : undefined} />
        )}
      </div>
    </>
  );
}

export default function OpfaWhatsAppApp() {
  return (
    <>
      <GlobalStyles />
      <ToastProvider>
        <div style={{
          height: "100%", display: "flex", flexDirection: "column",
          overflow: "hidden", fontFamily: "'Segoe UI',system-ui,sans-serif",
        }}>
          <Handset />
        </div>
      </ToastProvider>
    </>
  );
}
