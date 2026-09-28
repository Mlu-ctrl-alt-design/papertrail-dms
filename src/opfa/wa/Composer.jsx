// The handset composer: text entry and the attachment picker.
//
// The attachment picker offers a fixed catalogue rather than a real file
// input. Two of the entries are deliberately invalid — an unsupported type and
// an oversize scan — because 6.1.5 asks for exception handling and the fastest
// way to demonstrate it is to make the failure one tap away.
import { useState } from "react";
import { Attach20Regular, Send20Filled, Document20Filled } from "@fluentui/react-icons";
import { WA, I, C } from "../../components/index.js";
import { FILE_CATALOGUE } from "../data.js";
import { bytes } from "../helpers.js";

function AttachSheet({ onPick, onClose }) {
  return (
    <div
      style={{
        position: "absolute", inset: 0, zIndex: 40,
        background: "rgba(0,0,0,0.35)", display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        className="fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "12px 12px 0 0", overflow: "hidden" }}
      >
        <div style={{ padding: "12px 16px 8px", fontSize: 13.5, fontWeight: 600, color: "#111b21" }}>
          Send a document
        </div>
        {FILE_CATALOGUE.map((f) => (
          <button
            key={f.id}
            onClick={() => { onPick(f); onClose(); }}
            style={{
              width: "100%", textAlign: "left", background: "transparent", border: "none",
              borderTop: "1px solid #f0f2f5", padding: "10px 16px", cursor: "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 11,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{
              width: 32, height: 32, borderRadius: 6, flexShrink: 0, display: "grid", placeItems: "center",
              background: f.valid ? "#e7f3ff" : C.dangerBg,
            }}>
              <I as={Document20Filled} size={16} color={f.valid ? "#0078d4" : C.danger} />
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "block", fontSize: 13, color: "#111b21", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.name}
              </span>
              <span style={{ display: "block", fontSize: 11, color: WA.meta, marginTop: 1 }}>
                {f.kind} · {bytes(f.size)}
                {!f.valid && <span style={{ color: C.danger, fontWeight: 600 }}> · will be rejected</span>}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Composer({ onSend, onAttach, disabled, placeholder = "Message" }) {
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState(false);

  const submit = () => {
    const t = text.trim();
    if (!t || disabled) return;
    setText("");
    onSend(t);
  };

  return (
    <>
      {sheet && <AttachSheet onPick={onAttach} onClose={() => setSheet(false)} />}
      <div style={{
        background: WA.composer, padding: "7px 9px",
        display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
      }}>
        <button
          onClick={() => setSheet(true)}
          disabled={disabled}
          title="Attach a document"
          style={{
            background: "transparent", border: "none", cursor: disabled ? "default" : "pointer",
            color: WA.meta, display: "inline-flex", padding: 4, flexShrink: 0, opacity: disabled ? 0.4 : 1,
          }}
        >
          <I as={Attach20Regular} size={19} color={WA.meta} />
        </button>
        <input
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder={placeholder}
          style={{
            flex: 1, minWidth: 0, background: "#fff", border: "none", borderRadius: 18,
            padding: "9px 13px", fontSize: 13, fontFamily: "inherit", color: "#111b21",
            opacity: disabled ? 0.6 : 1,
          }}
        />
        <button
          onClick={submit}
          disabled={disabled || !text.trim()}
          title="Send"
          style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0, border: "none",
            background: WA.green, display: "grid", placeItems: "center",
            cursor: disabled || !text.trim() ? "default" : "pointer",
            opacity: disabled || !text.trim() ? 0.45 : 1, transition: "opacity 0.15s",
          }}
        >
          <I as={Send20Filled} size={16} color="#fff" />
        </button>
      </div>
    </>
  );
}
