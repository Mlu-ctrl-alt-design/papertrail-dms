// Live wire inspector.
//
// Every bot turn, agent reply and case lookup emits the request and response
// it would have made against the real WhatsApp Cloud API, the Respond case
// management system and Microsoft 365. This panel is where a technical
// evaluation panel can check that the integration is modelled rather than
// mimed — so the payloads have to be right, and they have to be visible
// without leaving the screen you are demonstrating.
import { useMemo, useState } from "react";
import {
  Code20Regular, Dismiss20Regular, Copy20Regular, ArrowDownload20Regular,
} from "@fluentui/react-icons";
import { C, I, useMaxWidth, BP } from "../../components/index.js";
import { OPFA } from "../brand.jsx";
import { useOpfa, now } from "../store.js";
import { clockTime } from "../helpers.js";

const SYSTEMS = {
  meta: { label: "WhatsApp Cloud API", color: "#25D366" },
  respond: { label: "Respond CMS", color: OPFA.navy },
  sharepoint: { label: "SharePoint Online", color: "#038387" },
  entra: { label: "Entra ID", color: OPFA.purple },
  nlu: { label: "Ezra NLU", color: OPFA.blue },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "meta", label: "WhatsApp" },
  { id: "respond", label: "Respond" },
  { id: "other", label: "Other" },
];

// XML arrives pre-formatted as a string from the Respond builders; only JSON
// needs indenting. The entry's contentType is used for the label, not here.
function pretty(payload) {
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function Entry({ e, open, onToggle }) {
  const sys = SYSTEMS[e.system] || { label: e.system, color: C.muted };
  const body = useMemo(() => pretty(e.payload), [e.payload]);
  const inbound = e.dir === "in";

  return (
    <div style={{ borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "inherit", textAlign: "left", padding: "8px 12px",
          display: "flex", alignItems: "flex-start", gap: 8, color: "inherit",
        }}
        onMouseEnter={(ev) => (ev.currentTarget.style.background = "rgba(255,255,255,0.05)")}
        onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
      >
        <span style={{
          width: 3, alignSelf: "stretch", borderRadius: 2, flexShrink: 0,
          background: sys.color, opacity: inbound ? 0.45 : 1,
        }} />
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{
              fontSize: 8.5, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
              color: sys.color,
            }}>{sys.label}</span>
            <span style={{
              fontSize: 8.5, fontWeight: 700, borderRadius: 2, padding: "0 4px",
              background: inbound ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.75)",
            }}>{inbound ? "IN" : "OUT"}</span>
            <span style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,0.4)" }}>
              {clockTime(e.at)}
            </span>
          </span>
          <span style={{
            display: "block", fontSize: 11, color: "rgba(255,255,255,0.92)",
            fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
            wordBreak: "break-all", lineHeight: 1.4,
          }}>{e.label}</span>
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 12px 10px 23px" }}>
          <pre style={{
            margin: 0, background: "rgba(0,0,0,0.35)", borderRadius: 4,
            padding: "9px 10px", fontSize: 10.5, lineHeight: 1.5,
            color: "#d8e6f2", overflowX: "auto", whiteSpace: "pre",
            fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
          }}>{body}</pre>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button
              onClick={() => navigator.clipboard?.writeText(body)}
              style={miniBtn}
            >
              <I as={Copy20Regular} size={10} /> Copy
            </button>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", alignSelf: "center" }}>
              {e.contentType}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function WirePanel({ variant = "device", onClose }) {
  const s = useOpfa();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const narrow = useMaxWidth(BP.lg);
  const [collapsed, setCollapsed] = useState(false);

  const rows = useMemo(() => s.wire.filter((e) =>
    filter === "all" ? true
    : filter === "other" ? !["meta", "respond"].includes(e.system)
    : e.system === filter
  ), [s.wire, filter]);

  const exportLog = () => {
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date(now()).toISOString(), entries: s.wire }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `opfa-wire-log-${new Date(now()).toISOString().slice(0, 19).replaceAll(":", "")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // On a laptop the three-pane rig does not fit; the panel becomes a button.
  if (narrow && collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: "fixed", right: 16, bottom: 16, zIndex: 3000,
          background: "#0d1b2a", color: "#fff", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 100, padding: "9px 15px", cursor: "pointer",
          fontFamily: "inherit", fontSize: 12, fontWeight: 700,
          display: "inline-flex", alignItems: "center", gap: 7,
          boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
        }}
      >
        <I as={Code20Regular} size={14} /> Wire <span style={{ opacity: 0.6 }}>{s.wire.length}</span>
      </button>
    );
  }

  return (
    <aside style={{
      width: narrow ? 320 : 380, flexShrink: 0,
      background: "#0d1b2a",
      borderLeft: "1px solid rgba(255,255,255,0.1)",
      display: "flex", flexDirection: "column", minHeight: 0,
      ...(narrow ? { position: "fixed", right: 0, top: 0, bottom: 0, zIndex: 3000 } : null),
    }}>
      <div style={{
        padding: "11px 12px", borderBottom: "1px solid rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
      }}>
        <I as={Code20Regular} size={15} color="rgba(255,255,255,0.8)" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Wire inspector</div>
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.45)" }}>
            {s.wire.length} record{s.wire.length === 1 ? "" : "s"} · newest first
          </div>
        </div>
        <button onClick={exportLog} title="Download the log as JSON" style={iconBtn}>
          <I as={ArrowDownload20Regular} size={14} />
        </button>
        {(narrow || onClose) && (
          <button onClick={() => (onClose ? onClose() : setCollapsed(true))} title="Collapse" style={iconBtn}>
            <I as={Dismiss20Regular} size={14} />
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 3, padding: "8px 10px", flexShrink: 0 }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              flex: 1, background: filter === f.id ? "rgba(255,255,255,0.16)" : "transparent",
              border: "1px solid rgba(255,255,255,0.14)", borderRadius: 3,
              padding: "4px 0", fontSize: 10, fontWeight: 700, cursor: "pointer",
              color: filter === f.id ? "#fff" : "rgba(255,255,255,0.5)", fontFamily: "inherit",
            }}
          >{f.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {rows.length === 0 ? (
          <div style={{
            padding: "40px 20px", textAlign: "center",
            fontSize: 11.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.7,
          }}>
            No traffic yet.
            <br />
            {variant === "device"
              ? "Send a message on the handset and the Cloud API calls appear here."
              : "Open the WhatsApp simulator and interact — calls appear here live."}
          </div>
        ) : rows.map((e) => (
          <Entry key={e.id} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} />
        ))}
      </div>
    </aside>
  );
}

const iconBtn = {
  background: "transparent", border: "none", cursor: "pointer",
  color: "rgba(255,255,255,0.6)", padding: 3, borderRadius: 3,
  display: "inline-flex", alignItems: "center", flexShrink: 0,
};

const miniBtn = {
  background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 3,
  padding: "3px 7px", fontSize: 9.5, fontWeight: 700, cursor: "pointer",
  color: "rgba(255,255,255,0.75)", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: 4,
};
