// WhatsApp rendering kit — the visual language of the platform itself, shared
// by every prototype that shows a handset.
//
// This lives in the design system rather than in one module because two
// products now draw WhatsApp: Employee Connect renders one-way broadcast
// previews, and the OPFA prototype renders a live two-way conversation. Two
// divergent copies of the same brand chrome is exactly the drift you notice in
// a demo and cannot explain away.
//
// Imports resolve to the leaf modules, never to ./index.js — the barrel
// re-exports this file, so going through it would close a cycle.
import { Document20Filled, ArrowDownload20Regular, Warning20Filled } from "@fluentui/react-icons";
import { C } from "./tokens.js";
import { I } from "./Icon.jsx";

// WhatsApp's own palette. Sampled from the client, not approximated.
export const WA = {
  header: "#075E54",   // chat header / status bar
  headerAlt: "#128C7E",
  bubble: "#ffffff",   // inbound bubble
  bubbleOut: "#DCF8C6", // outbound bubble (the green one)
  paper: "#ECE5DD",    // conversation background
  meta: "#667781",     // timestamps, secondary text
  ink: "#111b21",      // message text
  green: "#25D366",    // brand green / send button
  blue: "#53BDEB",     // read receipt
  composer: "#f0f2f5",
};

// ─── Text ─────────────────────────────────────────────────────────────────────

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

// Message body with WhatsApp markup applied. Blank lines keep their height —
// operators compose with them deliberately.
export function WaBody({ text, size = 13.5, color = WA.ink }) {
  return (
    <div style={{ fontSize: size, lineHeight: 1.45, color, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {String(text || "").split("\n").map((line, i) => (
        <div key={i} style={{ minHeight: line ? undefined : 8 }}>
          {waTokens(line).map((t, j) =>
            t.bold ? <strong key={j}>{t.text}</strong>
            : t.italic ? <em key={j}>{t.text}</em>
            : <span key={j}>{t.text}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Delivery receipts ────────────────────────────────────────────────────────

// Tick counts and colour, owned here rather than derived from any one module's
// status vocabulary. Anything unrecognised renders a spacer, so a bubble never
// jumps width when a status arrives.
const TICKS = {
  sent:      { ticks: 1, blue: false },
  delivered: { ticks: 2, blue: false },
  read:      { ticks: 2, blue: true },
};

// Double-tick glyph, drawn rather than composed from icons so it reads as the
// WhatsApp receipt everyone recognises.
export function Ticks({ state = "sent", size = 16 }) {
  if (state === "failed") return <I as={Warning20Filled} size={size * 0.85} color={C.danger} />;
  const st = TICKS[state];
  if (!st) return <span style={{ width: size, display: "inline-block" }} />;
  const color = st.blue ? WA.blue : WA.meta;
  return (
    <svg width={size} height={size * 0.68} viewBox="0 0 18 12" fill="none"
         style={{ display: "block", flexShrink: 0 }} aria-hidden="true">
      <path d={st.ticks === 2 ? "M1 6.6 L4.4 10 L10.6 1.6" : "M3.5 6.6 L6.9 10 L13.1 1.6"}
            stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      {st.ticks === 2 && (
        <path d="M7.4 10 L13.6 1.6" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export function AttachmentCard({ attachment, onOpen }) {
  if (!attachment) return null;
  return (
    <div
      onClick={onOpen}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#f5f6f6", borderRadius: 6, padding: "10px 12px", marginBottom: 6,
        cursor: onOpen ? "pointer" : "default",
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 6, background: "#fde7e9", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <I as={Document20Filled} size={18} color={C.danger} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: WA.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {attachment.name}
        </div>
        <div style={{ fontSize: 10.5, color: WA.meta, textTransform: "uppercase", letterSpacing: "0.3px" }}>
          {attachment.pages ? `${attachment.pages} pages · ` : ""}{attachment.size} · {attachment.kind}
        </div>
      </div>
      <I as={ArrowDownload20Regular} size={16} color={WA.meta} />
    </div>
  );
}

// ─── Handset chassis ──────────────────────────────────────────────────────────

// Status-bar glyphs. Drawn rather than borrowed from an icon set: at 11px the
// Fluent icons read as smudges, and these are the three shapes everyone
// recognises without looking at them.
function SignalBars({ color }) {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill={color} aria-hidden="true" style={{ display: "block" }}>
      <rect x="0" y="7.5" width="3" height="3.5" rx="1" />
      <rect x="4.6" y="5.2" width="3" height="5.8" rx="1" />
      <rect x="9.2" y="2.7" width="3" height="8.3" rx="1" />
      <rect x="13.8" y="0" width="3" height="11" rx="1" />
    </svg>
  );
}

function Wifi({ color }) {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" fill="none" aria-hidden="true" style={{ display: "block" }}>
      <path d="M1 3.3a9.4 9.4 0 0 1 13 0" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M3.5 6a5.9 5.9 0 0 1 8 0" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7.5 9.4 6 7.9a2.3 2.3 0 0 1 3 0z" fill={color} />
    </svg>
  );
}

function Battery({ color, level = 0.82 }) {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true" style={{ display: "block" }}>
      <rect x="0.6" y="0.6" width="21" height="10.8" rx="3" stroke={color} strokeOpacity="0.45" strokeWidth="1.1" />
      <rect x="2.2" y="2.2" width={17.8 * level} height="7.6" rx="1.8" fill={color} />
      <path d="M23.2 4.3v3.4a2 2 0 0 0 0-3.4z" fill={color} fillOpacity="0.5" />
    </svg>
  );
}

// Shared phone chassis: aluminium rail, dynamic island, iOS status bar and the
// home indicator. `children` supplies everything below the status bar, so the
// same frame carries a WhatsApp chat, an SMS thread or a lock screen.
//
// The device is deliberately detailed. In a bid demo the handset is the thing
// an evaluation panel looks at for the longest, and a flat rounded rectangle
// reads as a wireframe no matter how good the conversation inside it is.
export function PhoneFrame({
  children, width, headerBg, statusTime,
  statusTone = "light",     // colour of the status-bar glyphs
  chrome = "#1f2125",       // the aluminium rail
  style = {},
}) {
  const ink = statusTone === "dark" ? "rgba(0,0,0,0.88)" : "rgba(255,255,255,0.95)";

  return (
    <div style={{ position: "relative", width, flexShrink: 0, ...style }}>
      {/* Side buttons. Drawn on the rail, outside the screen's clip. */}
      <span style={{ ...sideBtn, left: -3, top: "17%", height: 26 }} />
      <span style={{ ...sideBtn, left: -3, top: "25%", height: 44 }} />
      <span style={{ ...sideBtn, left: -3, top: "35%", height: 44 }} />
      <span style={{ ...sideBtn, right: -3, top: "27%", height: 66 }} />

      {/* Rail → inner bezel → screen. Three layers rather than one border, so
          the highlight along the edge catches light the way metal does. */}
      <div style={{
        borderRadius: 46, padding: 3,
        background: `linear-gradient(145deg,#6c7075 0%,${chrome} 22%,#0e0f11 55%,${chrome} 86%,#54585d 100%)`,
        boxShadow: "0 26px 60px rgba(0,0,0,0.34), 0 4px 12px rgba(0,0,0,0.22)",
      }}>
        <div style={{
          borderRadius: 43, padding: 9, background: "#050506",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.09)",
        }}>
          <div style={{
            position: "relative", borderRadius: 34, overflow: "hidden",
            background: headerBg, display: "flex", flexDirection: "column",
          }}>
            {/* Dynamic island, floating over the status bar. */}
            <div style={{
              position: "absolute", top: 9, left: "50%", transform: "translateX(-50%)",
              width: 86, height: 25, borderRadius: 100, background: "#000", zIndex: 30,
              display: "flex", alignItems: "center", justifyContent: "flex-end",
              paddingRight: 9, pointerEvents: "none",
            }}>
              {/* Camera lens, off to one side as on the real thing. */}
              <span style={{
                width: 9, height: 9, borderRadius: "50%",
                background: "radial-gradient(circle at 32% 30%,#2d3a52 0%,#0b1220 62%,#000 100%)",
                boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.14)",
              }} />
            </div>

            {/* Status bar */}
            <div style={{
              background: headerBg, color: ink, flexShrink: 0,
              padding: "13px 20px 7px", display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 8, minHeight: 44, boxSizing: "border-box",
            }}>
              <span style={{
                fontSize: 13, fontWeight: 600, letterSpacing: "0.2px",
                fontVariantNumeric: "tabular-nums", minWidth: 54,
              }}>{statusTime}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, minWidth: 54, justifyContent: "flex-end" }}>
                <SignalBars color={ink} />
                <Wifi color={ink} />
                <Battery color={ink} />
              </span>
            </div>

            {children}

            {/* Home indicator. A real element rather than an overlay, so it
                never sits on top of the composer. */}
            <div style={{
              background: headerBg, flexShrink: 0,
              padding: "7px 0 9px", display: "grid", placeItems: "center",
            }}>
              <span style={{
                width: 128, height: 5, borderRadius: 100,
                background: statusTone === "dark" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.45)",
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const sideBtn = {
  position: "absolute", width: 3, borderRadius: 2, zIndex: 0,
  background: "linear-gradient(90deg,#3c4045,#6a6e73)",
};

// ─── Marks ────────────────────────────────────────────────────────────────────

// Official WhatsApp glyph (24×24 grid). In a room full of people who use it
// daily, a lookalike reads as a mock-up.
export function WhatsAppGlyph({ size = 16, color = WA.green }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}
         style={{ display: "block", flexShrink: 0 }} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

// WhatsApp's mark reversed out of its brand-green circle, for avatars/badges.
export function WhatsAppBadge({ size = 28, bg = WA.green }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      display: "grid", placeItems: "center", flexShrink: 0,
    }}>
      <WhatsAppGlyph size={size * 0.62} color="#fff" />
    </span>
  );
}
