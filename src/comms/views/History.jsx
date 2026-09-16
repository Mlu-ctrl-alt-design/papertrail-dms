// Broadcast history — every campaign with its delivery receipt totals.
import { useState } from "react";
import { Search20Regular, Add20Regular, ArrowDownload20Regular } from "@fluentui/react-icons";
import { ViewHeader, Btn, Pill, I, C } from "../../components/index.js";
import { useComms } from "../state.js";
import { channelById } from "../data.js";
import { ChannelIcon } from "../icons.jsx";
import { exportCsv, stamp } from "../csv.js";
import { fmt, pct } from "../helpers.js";

function ChannelChips({ ids = [] }) {
  return (
    <div style={{ display: "inline-flex", gap: 5 }}>
      {ids.map((id) => {
        const ch = channelById(id);
        return (
          <span key={id} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 700, color: ch.colour,
            border: `1px solid ${ch.colour}59`, background: "transparent",
            padding: "2px 8px", borderRadius: 100, whiteSpace: "nowrap",
          }}>
            <ChannelIcon id={id} size={11} /> {ch.name}
          </span>
        );
      })}
    </div>
  );
}

export function HistoryView({ setActive }) {
  const s = useComms();
  const [q, setQ] = useState("");
  const rows = s.history.filter((b) =>
    `${b.code} ${b.title} ${b.audience} ${b.by} ${b.template} ${(b.channels || []).join(" ")}`
      .toLowerCase().includes(q.toLowerCase()));

  // Exports whatever the search currently shows.
  const exportBroadcasts = () =>
    exportCsv(`employee-connect-broadcasts-${stamp()}.csv`, rows, [
      { header: "Code", get: (b) => b.code },
      { header: "Broadcast", get: (b) => b.title },
      { header: "Template", get: (b) => b.template },
      { header: "Meta template", get: (b) => b.meta?.name || (b.freeForm ? "free text (24h window)" : "") },
      { header: "Audience", get: (b) => b.audience },
      { header: "Channels", get: (b) => (b.channels || []).map((id) => channelById(id).name).join(" → ") },
      { header: "Sent", get: (b) => b.at },
      { header: "Accepted", get: (b) => b.sent },
      { header: "Delivered", get: (b) => b.delivered },
      { header: "Delivery rate", get: (b) => `${pct(b.delivered, b.sent)}%` },
      { header: "Failed", get: (b) => b.failed },
      { header: "Sent by", get: (b) => b.by },
    ]);

  const th = { padding: "10px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${C.hairline}`, whiteSpace: "nowrap" };
  const td = { padding: "12px 16px", fontSize: 12.5, color: C.text, whiteSpace: "nowrap" };

  return (
    <>
      <ViewHeader title="Broadcasts" subtitle="Every broadcast, with what the provider reported back."
        action={<Btn onClick={() => setActive("broadcast")}><I as={Add20Regular} size={15} /> New broadcast</Btn>} />
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", padding: 16, borderBottom: `1px solid ${C.hairline}`, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint, display: "inline-flex" }}><I as={Search20Regular} size={15} /></span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by code, name or audience"
                style={{ width: 300, padding: "8px 10px 8px 32px", border: `1px solid ${C.hairlineSoft}`, borderRadius: 4, fontSize: 13, background: C.surfaceAlt, color: C.text, fontFamily: "inherit" }} />
            </div>
            <Btn variant="secondary" onClick={exportBroadcasts}>
              <I as={ArrowDownload20Regular} size={15} /> Export receipts
            </Btn>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 1020, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.surfaceAlt, textAlign: "left" }}>
                  <th style={th}>Code</th>
                  <th style={th}>Broadcast</th>
                  <th style={th}>Audience</th>
                  <th style={th}>Channels</th>
                  <th style={th}>Accepted</th>
                  <th style={th}>Delivered</th>
                  <th style={th}>Failed</th>
                  <th style={th}>Sent by</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${C.hairline}` }}>
                    {/* The broadcast reference gets its own column — it is an
                        identifier people quote, not a caption. */}
                    <td style={{ ...td, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 11.5, color: C.muted }}>
                      {b.code}
                    </td>
                    <td style={td}>
                      <div style={{ fontWeight: 600, color: C.ink }}>{b.title}</div>
                      <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>
                        {b.template} · {b.at}
                        {b.meta ? ` · ${b.meta.name}` : b.freeForm ? " · free text (24h window)" : ""}
                      </div>
                    </td>
                    <td style={td}>{b.audience}</td>
                    <td style={td}><ChannelChips ids={b.channels} /></td>
                    <td style={td}>{fmt(b.sent)}</td>
                    <td style={td}>
                      <Pill outline fg={C.success} bg={C.successBg}>{pct(b.delivered, b.sent)}%</Pill>
                      <div style={{ fontSize: 10.5, color: C.faint, marginTop: 3 }}>{fmt(b.delivered)} delivered</div>
                    </td>
                    <td style={td}>
                      {b.failed
                        ? <Pill outline fg={C.danger} bg={C.dangerBg}>{fmt(b.failed)}</Pill>
                        : <span style={{ color: C.faint }}>—</span>}
                    </td>
                    <td style={td}>{b.by}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td style={{ ...td, color: C.faint, textAlign: "center", padding: 40 }} colSpan={8}>No broadcasts match that search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
