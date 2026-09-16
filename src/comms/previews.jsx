// Channel previews — how the same broadcast lands on each channel.
// Each preview shows the recipient's view; the receipt strip underneath is the
// operator's console readout of the delivery webhooks.
import {
  Document20Filled, CheckmarkCircle20Filled, ArrowDownload20Regular,
  Warning20Filled, Mail20Filled, Alert20Filled, Chat20Filled,
} from "@fluentui/react-icons";
import { I, C, SHADOW } from "../components/index.js";
import { renderBody, waTokens, deliveryStyle, nowTime, smsSegments } from "./helpers.js";
import { channelById } from "./data.js";

const WA = {
  header: "#075E54",
  bubble: "#ffffff",
  paper: "#ECE5DD",
  meta: "#667781",
  green: "#25D366",
  blue: "#53BDEB",
};

// Double-tick glyph, drawn rather than composed from icons so it reads as the
// WhatsApp receipt everyone recognises. `read` state renders it blue.
export function Ticks({ state = "sent", size = 16 }) {
  const st = deliveryStyle(state);
  if (state === "failed") return <I as={Warning20Filled} size={size * 0.85} color={C.danger} />;
  if (st.ticks === 0) return <span style={{ width: size, display: "inline-block" }} />;
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

function BodyText({ text }) {
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.45, color: "#111b21", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {text.split("\n").map((line, i) => (
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

function AttachmentCard({ attachment }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "#f5f6f6", borderRadius: 6, padding: "10px 12px", marginBottom: 6,
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 6, background: "#fde7e9", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <I as={Document20Filled} size={18} color={C.danger} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111b21", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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

// Shared phone chassis so WhatsApp and SMS sit in the same handset.
function PhoneFrame({ children, width, headerBg, statusTime }) {
  return (
    <div style={{
      width, border: "9px solid #111b21", borderRadius: 30, overflow: "hidden",
      boxShadow: "0 18px 46px rgba(0,0,0,0.28)", background: "#111b21",
    }}>
      <div style={{
        background: headerBg, color: "rgba(255,255,255,0.9)",
        padding: "5px 14px 2px", fontSize: 10, display: "flex", justifyContent: "space-between",
      }}>
        <span>{statusTime}</span>
        <span style={{ letterSpacing: "1px" }}>▮▮▮ ⌁</span>
      </div>
      {children}
    </div>
  );
}

// ─── Operator-side receipt strip (shared by every channel) ────────────────────
function Receipt({ person, status, channel }) {
  if (!status) return null;
  const st = deliveryStyle(status);
  const ch = channel ? channelById(channel) : null;
  const to = ch?.id === "email" ? person?.email : ch?.id === "app" ? "App notification" : person?.mobile;
  return (
    <div style={{
      marginTop: 10, background: "#fff", border: `1px solid ${C.hairline}`,
      borderRadius: 6, padding: "8px 12px", display: "flex",
      alignItems: "center", justifyContent: "space-between", gap: 8,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {person?.name || "Recipient"}
        </div>
        <div style={{ fontSize: 10, color: C.faint }}>
          {ch ? `${ch.name} · ` : ""}{to}
        </div>
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <Ticks state={status} />
        <span style={{ fontSize: 11, fontWeight: 700, color: st.fg }}>{st.label}</span>
      </div>
    </div>
  );
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────
export function WhatsAppPreview({
  person, body, attachment, time,
  status = null,            // null = composing; otherwise a delivery state
  channelName = "NW Provincial Government",
  width = 300,
}) {
  const clock = time || nowTime();
  const text = renderBody(body, person);
  const empty = !text.trim() && !attachment;

  return (
    <div style={{ width, maxWidth: "100%" }}>
      <PhoneFrame width="100%" headerBg={WA.header} statusTime={clock}>
        {/* Chat header */}
        <div style={{ background: WA.header, padding: "8px 12px 10px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", background: "#101114",
            display: "grid", placeItems: "center", flexShrink: 0, overflow: "hidden",
          }}>
            <img src="/xiquel-mark.png" alt="" style={{ width: 22 }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {channelName}
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
              <I as={CheckmarkCircle20Filled} size={10} color={WA.green} /> Official business account
            </div>
          </div>
        </div>
        {/* Conversation */}
        <div style={{
          background: WA.paper,
          backgroundImage: "radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
          padding: "12px 10px 16px", minHeight: 360, maxHeight: 430, overflowY: "auto",
        }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <span style={{
              background: "#ffffffcc", color: WA.meta, fontSize: 10, fontWeight: 600,
              padding: "3px 10px", borderRadius: 8,
            }}>TODAY</span>
          </div>
          {empty ? (
            <div style={{ textAlign: "center", color: WA.meta, fontSize: 12, marginTop: 90, padding: "0 24px", lineHeight: 1.6 }}>
              Your message preview appears here as the recipient will see it.
            </div>
          ) : (
            <div className="fade-up" style={{
              background: WA.bubble, borderRadius: "0 8px 8px 8px",
              padding: 8, maxWidth: "92%", boxShadow: "0 1px 1px rgba(0,0,0,0.13)",
            }}>
              {attachment && <AttachmentCard attachment={attachment} />}
              <BodyText text={text} />
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 10, color: WA.meta }}>{clock}</span>
              </div>
            </div>
          )}
        </div>
        {/* Composer strip (decorative) */}
        <div style={{ background: "#f0f2f5", padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 18, padding: "7px 12px", fontSize: 11, color: "#9aa4ab" }}>
            Message
          </div>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: WA.green, display: "grid", placeItems: "center", color: "#fff", fontSize: 13 }}>➤</div>
        </div>
      </PhoneFrame>
      <Receipt person={person} status={status} channel="whatsapp" />
    </div>
  );
}

// ─── SMS ──────────────────────────────────────────────────────────────────────
// No formatting, no attachment — the text stands alone and the segment count
// is what the province gets billed for.
export function SmsPreview({ person, text, time, status = null, width = 300 }) {
  const clock = time || nowTime();
  const body = renderBody(text, person);
  const segments = smsSegments(body);

  return (
    <div style={{ width, maxWidth: "100%" }}>
      <PhoneFrame width="100%" headerBg="#1c1c1e" statusTime={clock}>
        <div style={{ background: "#f6f6f6", borderBottom: "1px solid #d8d8dc", padding: "10px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>NWPG</div>
          <div style={{ fontSize: 10, color: "#8a8a8e" }}>Text message · SMS</div>
        </div>
        <div style={{ background: "#fff", padding: "14px 12px", minHeight: 360, maxHeight: 430, overflowY: "auto" }}>
          <div style={{ textAlign: "center", fontSize: 10, color: "#8a8a8e", marginBottom: 12 }}>
            Today {clock}
          </div>
          {body.trim() ? (
            <div className="fade-up" style={{
              background: "#e9e9eb", color: "#111", borderRadius: 18,
              padding: "9px 13px", fontSize: 13, lineHeight: 1.45,
              maxWidth: "88%", whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>{body}</div>
          ) : (
            <div style={{ textAlign: "center", color: "#8a8a8e", fontSize: 12, marginTop: 90, padding: "0 24px", lineHeight: 1.6 }}>
              The SMS version of this message appears here.
            </div>
          )}
        </div>
        <div style={{ background: "#f6f6f6", padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, background: "#fff", border: "1px solid #d8d8dc", borderRadius: 18, padding: "6px 12px", fontSize: 11, color: "#9aa4ab" }}>
            Text message
          </div>
        </div>
      </PhoneFrame>
      <div style={{
        marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 6, padding: "8px 12px",
      }}>
        <span style={{ fontSize: 11, color: C.muted }}>
          {body.length} characters
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: segments > 1 ? C.warning : C.success }}>
          {segments} SMS segment{segments === 1 ? "" : "s"} per recipient
        </span>
      </div>
      <Receipt person={person} status={status} channel="sms" />
    </div>
  );
}

// ─── Email ────────────────────────────────────────────────────────────────────
export function EmailPreview({ person, subject, body, attachment, time, status = null, width = 300 }) {
  const clock = time || nowTime();
  const text = renderBody(body, person);
  return (
    <div style={{ width, maxWidth: "100%" }}>
      <div style={{
        border: `1px solid ${C.hairline}`, borderRadius: 8, overflow: "hidden",
        background: "#fff", boxShadow: SHADOW.md,
      }}>
        <div style={{ background: "#f3f2f1", borderBottom: `1px solid ${C.hairline}`, padding: "8px 12px", display: "flex", alignItems: "center", gap: 7 }}>
          <I as={Mail20Filled} size={14} color={C.muted} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Inbox</span>
        </div>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.hairline}` }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, lineHeight: 1.35 }}>
            {subject || "(no subject)"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#101114", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <img src="/xiquel-mark.png" alt="" style={{ width: 18 }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: C.ink }}>Provincial Communications</div>
              <div style={{ fontSize: 10, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                comms@nwpg.gov.za · to {person?.email || "you"}
              </div>
            </div>
            <span style={{ fontSize: 10, color: C.faint, flexShrink: 0 }}>{clock}</span>
          </div>
        </div>
        <div style={{ padding: "14px", maxHeight: 340, overflowY: "auto" }}>
          {attachment && <AttachmentCard attachment={attachment} />}
          <BodyText text={text} />
        </div>
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.hairline}`, background: C.surfaceAlt, fontSize: 10, color: C.faint, lineHeight: 1.5 }}>
          Sent by the North West Provincial Government · Provincial Communications.
          You are receiving this because you are on the provincial employee register.
        </div>
      </div>
      <Receipt person={person} status={status} channel="email" />
    </div>
  );
}

// ─── App notification ─────────────────────────────────────────────────────────
export function AppPreview({ person, body, attachment, time, status = null, width = 300 }) {
  const clock = time || nowTime();
  const text = renderBody(body, person);
  const firstLine = text.split("\n").find((l) => l.trim()) || "New message";
  return (
    <div style={{ width, maxWidth: "100%" }}>
      <PhoneFrame width="100%" headerBg="#1c1c1e" statusTime={clock}>
        <div style={{
          background: "linear-gradient(160deg,#0f2f45,#123a56)",
          padding: "16px 12px 20px", minHeight: 420, maxHeight: 470, overflowY: "auto",
        }}>
          {/* Lock-screen push */}
          <div className="fade-up" style={{
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
            borderRadius: 14, padding: "10px 12px", marginBottom: 14,
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: C.brand, display: "grid", placeItems: "center" }}>
                <I as={Alert20Filled} size={10} color="#fff" />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Employee Connect · now
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>Provincial Communications</div>
            <div style={{ fontSize: 11.5, color: C.text, lineHeight: 1.4, marginTop: 2 }}>
              {firstLine.slice(0, 90)}{firstLine.length > 90 ? "…" : ""}
            </div>
          </div>
          {/* In-app inbox card */}
          <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.hairline}`, display: "flex", alignItems: "center", gap: 7 }}>
              <I as={Chat20Filled} size={14} color={C.brand} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: C.ink }}>Employee inbox</span>
            </div>
            <div style={{ padding: "12px", maxHeight: 250, overflowY: "auto" }}>
              {attachment && <AttachmentCard attachment={attachment} />}
              <BodyText text={text} />
            </div>
          </div>
        </div>
      </PhoneFrame>
      <Receipt person={person} status={status} channel="app" />
    </div>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────
export function ChannelPreview({ channel, person, body, smsBody, subject, attachment, status, width }) {
  if (channel === "sms") return <SmsPreview person={person} text={smsBody} status={status} width={width} />;
  if (channel === "email") return <EmailPreview person={person} subject={subject} body={body} attachment={attachment} status={status} width={width} />;
  if (channel === "app") return <AppPreview person={person} body={body} attachment={attachment} status={status} width={width} />;
  return <WhatsAppPreview person={person} body={body} attachment={attachment} status={status} width={width} />;
}
