// WhatsApp interactive messages, rendered from the Cloud API object shape.
//
// The bot emits `interactive` payloads exactly as they would be posted to
// /v21.0/{phone-number-id}/messages, and this file renders them the way the
// client does. That matters for a bid demo: reply buttons and list messages
// are the difference between "a chatbot" and a structured conversation flow,
// and a tap has to come back as an `interactive.list_reply` — not as the user
// typing the option's label.
import { WA, I } from "../../components/index.js";
import { List20Regular, ChevronRight20Regular, Dismiss20Regular } from "@fluentui/react-icons";

// ─── Reply buttons (max 3, per the platform) ──────────────────────────────────

function ReplyButtons({ buttons, onSelect, disabled }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 6 }}>
      {buttons.map((b) => (
        <button
          key={b.reply.id}
          disabled={disabled}
          onClick={() => onSelect?.({ type: "button_reply", id: b.reply.id, title: b.reply.title })}
          style={{
            background: "#fff", border: "none", borderTop: "1px solid #e9edef",
            padding: "9px 8px", cursor: disabled ? "default" : "pointer",
            fontFamily: "inherit", fontSize: 13.5, fontWeight: 500,
            color: disabled ? WA.meta : "#00A5F4", textAlign: "center",
            borderRadius: 0, opacity: disabled ? 0.65 : 1,
          }}
        >{b.reply.title}</button>
      ))}
    </div>
  );
}

// ─── List message ─────────────────────────────────────────────────────────────

// The CTA row inside the bubble. Tapping it opens the sheet — which is how
// WhatsApp actually behaves, and why a list can carry ten options where
// buttons cap at three.
function ListCta({ label, onOpen, disabled }) {
  return (
    <button
      disabled={disabled}
      onClick={onOpen}
      style={{
        width: "100%", marginTop: 6, background: "#fff",
        border: "none", borderTop: "1px solid #e9edef",
        padding: "9px 8px", cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit", fontSize: 13.5, fontWeight: 500,
        color: disabled ? WA.meta : "#00A5F4",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <I as={List20Regular} size={15} color={disabled ? WA.meta : "#00A5F4"} />
      {label}
    </button>
  );
}

// The bottom sheet.
//
// Rendered by the handset rather than by the bubble that opened it. That is
// not a detail: a sheet mounted inside the message would be clipped by the
// transcript's own scroll container, and the options would end up squeezed
// into a few pixels of scrollable strip. Here it fills the screen the way it
// does on a real handset.
export function ListSheet({ interactive, onSelect, onClose }) {
  const { header, sections, button } = interactive;
  const rowCount = sections.reduce((n, sec) => n + sec.rows.length, 0);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 60,
      background: "rgba(0,0,0,0.42)", display: "flex", flexDirection: "column",
      justifyContent: "flex-end",
    }} onClick={onClose}>
      <div
        className="fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "14px 14px 0 0",
          // Tall enough that a nine-row menu is read rather than scrolled
          // through a letterbox, but still clearly a sheet over a chat.
          maxHeight: "86%",
          minHeight: Math.min(rowCount, 4) * 62 + 96,
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 -8px 28px rgba(0,0,0,0.22)",
        }}
      >
        {/* Grab handle — the affordance that says this panel is a sheet. */}
        <div style={{ display: "grid", placeItems: "center", padding: "8px 0 2px", flexShrink: 0 }}>
          <span style={{ width: 38, height: 4, borderRadius: 100, background: "#d5dbdf" }} />
        </div>
        <div style={{
          padding: "8px 16px 12px", borderBottom: "1px solid #e9edef",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#111b21", flex: 1, minWidth: 0 }}>
            {header?.text || button}
          </span>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: WA.meta, display: "inline-flex", padding: 2,
          }}>
            <I as={Dismiss20Regular} size={18} color={WA.meta} />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" }}>
          {sections.map((sec) => (
            <div key={sec.title}>
              <div style={{
                padding: "12px 16px 5px", fontSize: 11.5, fontWeight: 700,
                color: "#008069", textTransform: "uppercase", letterSpacing: "0.4px",
              }}>{sec.title}</div>
              {sec.rows.map((row) => (
                <button
                  key={row.id}
                  onClick={() => { onSelect?.({ type: "list_reply", id: row.id, title: row.title }); onClose(); }}
                  style={{
                    width: "100%", textAlign: "left", background: "transparent",
                    border: "none", borderBottom: "1px solid #f0f2f5",
                    padding: "13px 16px", cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: 13.5, color: "#111b21" }}>{row.title}</span>
                    {row.description && (
                      <span style={{ display: "block", fontSize: 11.5, color: WA.meta, marginTop: 1, lineHeight: 1.4 }}>
                        {row.description}
                      </span>
                    )}
                  </span>
                  <I as={ChevronRight20Regular} size={14} color={WA.meta} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

// `interactive` is the Cloud API object: { type: "list" | "button", header?,
// body, footer?, action: { button, sections } | { buttons } }.
//
// `onOpenList` hands the sheet up to the handset, which owns it — see the
// note on ListSheet. Without it (the console transcript) the CTA is inert,
// which is correct: an agent reading a conversation should not be able to
// answer a menu on the complainant's behalf.
export function InteractiveMessage({ interactive, onSelect, onOpenList, disabled }) {
  if (!interactive) return null;

  const action = interactive.action || {};

  return (
    <>
      {interactive.footer?.text && (
        <div style={{ fontSize: 11, color: WA.meta, marginTop: 5 }}>{interactive.footer.text}</div>
      )}
      {interactive.type === "button" && action.buttons && (
        <ReplyButtons buttons={action.buttons} onSelect={onSelect} disabled={disabled} />
      )}
      {interactive.type === "list" && action.sections && (
        <ListCta
          label={action.button}
          onOpen={() => onOpenList?.({
            header: interactive.header,
            sections: action.sections,
            button: action.button,
          })}
          disabled={disabled || !onOpenList}
        />
      )}
    </>
  );
}
