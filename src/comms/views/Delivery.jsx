// What the room watches after "Broadcast" is pressed.
//
// A broadcast is one submission, not a progress bar: while the batch is being
// accepted there is genuinely nothing to report, so the whole view sits in a
// loading state. What comes back is a result — a delivery rate, the channel
// split, and a per-message log in the shape a provider console reports it.
// Delivery receipts are reported; read receipts are not, because they can't be
// relied on.
import {
  CheckmarkCircle20Filled, Warning20Filled, Clock20Regular, ArrowSync20Regular,
  ArrowDownload20Regular, Add20Regular, ShieldCheckmark20Regular, Send20Regular,
} from "@fluentui/react-icons";
import {
  ViewHeader, Btn, Pill, AvatarChip, Spinner, Skeleton, I, C, useMaxWidth, BP,
} from "../../components/index.js";
import { useComms } from "../state.js";
import { deptName } from "../data.js";
import { fmt, pct, deliveryStyle } from "../helpers.js";
import { ChannelPreview, Ticks } from "../previews.jsx";
import { ChannelIcon } from "../icons.jsx";
import { exportCsv } from "../csv.js";
import { Card, Stat } from "../ui.jsx";

// ─── Submitting ───────────────────────────────────────────────────────────────
function Submitting({ campaign }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-start", gap: 18, padding: "72px 24px 24px",
      overflow: "hidden",
    }}>
      <Spinner size={30} color={C.brand} />
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>
          Submitting {fmt(campaign?.reach || 0)} messages…
        </div>
        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
          The batch is being accepted by the provider. Delivery receipts come back
          once the carriers have them — nothing is reported until they do.
        </div>
      </div>
      {/* Skeleton of the result that is about to land */}
      <div style={{ width: "100%", maxWidth: 900, display: "flex", gap: 12, marginTop: 6 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            flex: 1, background: "#fff", border: `1px solid ${C.hairline}`,
            borderRadius: 8, padding: "14px 16px",
          }}>
            <Skeleton w="45%" h={9} />
            <Skeleton w="65%" h={22} style={{ marginTop: 10 }} />
            <Skeleton w="80%" h={8} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div style={{ width: "100%", maxWidth: 900, background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 8, padding: 14 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
            <Skeleton w={28} h={28} r={14} />
            <Skeleton w="30%" h={10} />
            <Skeleton w="18%" h={10} style={{ marginLeft: "auto" }} />
            <Skeleton w={70} h={10} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Message log ──────────────────────────────────────────────────────────────
function LogRow({ row, channelById, narrow }) {
  const st = deliveryStyle(row.status);
  const ch = channelById(row.channel);
  const to = ch.id === "email" ? row.person.email : ch.id === "app" ? "App notification" : row.person.mobile;
  const mono = { fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace" };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "9px 14px",
      borderBottom: `1px solid ${C.hairline}`,
      background: row.rerouted ? "rgba(255,244,206,0.35)" : "transparent",
    }}>
      <span style={{ ...mono, fontSize: 10.5, color: C.faint, width: 62, flexShrink: 0 }}>{row.at}</span>
      {!narrow && (
        <span style={{ ...mono, fontSize: 10.5, color: C.muted, width: 132, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
          {row.sid.slice(0, 16)}…
        </span>
      )}
      <AvatarChip initials={row.person.initials} color={row.person.color} size={26} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.person.name}
        </div>
        <div style={{ fontSize: 10.5, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {to} · {deptName(row.person.dept)}
        </div>
      </div>
      {row.error && (
        <span style={{ ...mono, fontSize: 10.5, color: C.danger, flexShrink: 0 }}
              title={row.error.text}>
          {row.error.code} {narrow ? "" : row.error.text.split(" — ")[0].toLowerCase()}
        </span>
      )}
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
        fontSize: 10, fontWeight: 700, color: ch.colour,
        border: `1px solid ${ch.colour}59`, padding: "2px 9px", borderRadius: 100,
      }}>
        <ChannelIcon id={ch.id} size={11} />
        {ch.name}{row.rerouted ? " · retry" : ""}
      </span>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
        <Ticks state={row.status} />
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
          color: st.fg, border: `1px solid ${st.fg}59`, padding: "2px 9px",
          borderRadius: 100, minWidth: 74, textAlign: "center",
        }}>{st.label}</span>
      </div>
    </div>
  );
}

// ─── Result ───────────────────────────────────────────────────────────────────
export function DeliveryBoard() {
  const s = useComms();
  const narrow = useMaxWidth(BP.lg);
  const c = s.campaign;

  if (s.phase === "submitting") {
    return (
      <>
        <ViewHeader
          title="Broadcasting…"
          subtitle={`${c?.title} · ${c?.audience} · ${fmt(c?.reach || 0)} recipients · ${s.channels.map((ch) => ch.name).join(" → ")}`}
          action={<Pill outline fg={C.warning} bg={C.warningBg}><Spinner size={10} color={C.warning} /> Submitting</Pill>}
        />
        <Submitting campaign={c} />
      </>
    );
  }

  const r = s.result;
  const deliveryRate = pct(r.delivered, r.accepted);

  // One row per send attempt, matching what the log shows on screen.
  const exportLog = () =>
    exportCsv(`${c.code}-message-log.csv`, s.log, [
      { header: "Broadcast code", get: () => c.code },
      { header: "Broadcast", get: () => c.title },
      { header: "Time", get: (row) => row.at },
      { header: "Message SID", get: (row) => row.sid },
      { header: "Recipient", get: (row) => row.person.fullName },
      { header: "PERSAL Number", get: (row) => row.person.persal },
      { header: "Department", get: (row) => deptName(row.person.dept) },
      { header: "Channel", get: (row) => s.channelById(row.channel).name },
      {
        header: "Destination",
        get: (row) => (row.channel === "email" ? row.person.email : row.channel === "app" ? "App notification" : row.person.mobile),
      },
      { header: "Status", get: (row) => deliveryStyle(row.status).label },
      { header: "Error code", get: (row) => row.error?.code || "" },
      { header: "Error", get: (row) => row.error?.text || "" },
      { header: "Retry of failed send", get: (row) => (row.rerouted ? "Yes" : "No") },
    ]);
  const first = s.recipients[0];
  const firstRow = s.log.find((row) => row.person.id === first?.id);

  return (
    <>
      <ViewHeader
        title="Broadcast sent"
        subtitle={
          `${c?.code} · ${c?.title} · ${c?.audience} · ${s.channels.map((ch) => ch.name).join(" → ")} · ` +
          `${c?.meta ? `template ${c.meta.name} (${c.meta.category})` : "free text · 24-hour window"} · ${r.submittedAt}`
        }
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn variant="secondary" onClick={exportLog}><I as={ArrowDownload20Regular} size={15} /> Export log</Btn>
            <Btn onClick={s.archiveAndReset}><I as={Add20Regular} size={15} /> New broadcast</Btn>
          </div>
        }
      />
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Headline result */}
          <div className="fade-up" style={{
            display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap",
            background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 8,
            padding: "18px 22px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "1 1 320px", minWidth: 0 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${C.success}`, display: "grid", placeItems: "center",
              }}>
                <I as={CheckmarkCircle20Filled} size={26} color={C.success} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 34, fontWeight: 700, color: C.ink, lineHeight: 1 }}>{deliveryRate}%</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>delivery rate</span>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 5, lineHeight: 1.5 }}>
                  {fmt(r.delivered)} of {fmt(r.accepted)} messages confirmed delivered
                  {r.pending > 0 && ` · ${fmt(r.pending)} awaiting a receipt`}
                  {r.failed > 0 && ` · ${fmt(r.failed)} failed`}
                </div>
              </div>
            </div>
            {r.rescued > 0 && (
              <div style={{
                flex: "1 1 260px", borderLeft: narrow ? "none" : `1px solid ${C.hairline}`,
                paddingLeft: narrow ? 0 : 20, fontSize: 11.5, color: C.text, lineHeight: 1.5,
              }}>
                <strong>{fmt(r.rescued)} rerouted to {s.channels[1]?.name}</strong> after WhatsApp
                returned an error. Without the fallback those messages would have been lost.
              </div>
            )}
          </div>

          {/* Counters — only what a provider actually reports back */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Stat label="Accepted" value={fmt(r.accepted)} sub="Messages the provider took" icon={<I as={Send20Regular} size={13} color={C.muted} />} />
            <Stat label="Delivered" value={fmt(r.delivered)} sub={`${deliveryRate}% of the batch`} tone={C.success} icon={<I as={CheckmarkCircle20Filled} size={13} color={C.success} />} />
            <Stat label="Awaiting receipt" value={fmt(r.pending)} sub={r.pending ? "Carrier has not confirmed yet" : "All receipts in"} tone={r.pending ? C.warning : C.ink} icon={<I as={Clock20Regular} size={13} color={r.pending ? C.warning : C.faint} />} />
            <Stat label="Failed" value={fmt(r.failed)} sub={r.failed ? "See error codes in the log" : "No failures"} tone={r.failed ? C.danger : C.ink} icon={<I as={Warning20Filled} size={13} color={r.failed ? C.danger : C.faint} />} />
          </div>

          {/* Read receipts are deliberately absent — say why, once */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 8,
            fontSize: 11.5, color: C.muted, lineHeight: 1.5,
          }}>
            <I as={ShieldCheckmark20Regular} size={15} color={C.faint} />
            <span>
              Delivery is confirmed by the carrier. <strong>Opens are not reported</strong> — WhatsApp
              only returns a read receipt when the recipient has them switched on, and SMS and email
              never do, so the console doesn't claim a number it can't stand behind.
            </span>
          </div>

          {/* Consent / policy exclusions */}
          {s.skipped.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
              background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 8,
              fontSize: 11.5, color: C.text, lineHeight: 1.5,
            }}>
              <I as={ShieldCheckmark20Regular} size={15} color={C.muted} />
              <span>
                <strong>{s.skipped.length} excluded before sending</strong> —{" "}
                {s.skipped.map((e) => `${e.name} (${e.reason.toLowerCase()})`).join("; ")}.
                Nobody is messaged on WhatsApp without a recorded opt-in.
              </span>
            </div>
          )}

          {/* Channel split */}
          {s.channels.length > 1 && (
            <Card title="Channel breakdown" subtitle="Each message counted on the channel that carried it">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {s.byChannel.map((ch) => (
                  <Stat
                    key={ch.id}
                    label={ch.name}
                    value={ch.routed ? fmt(ch.delivered) : "—"}
                    share={ch.routed ? `${pct(ch.delivered, ch.routed)}%` : null}
                    sub={ch.routed
                      ? `delivered of ${fmt(ch.routed)} sent on ${ch.name}`
                      : "not needed — everyone was reached higher up the chain"}
                    tone={ch.routed ? C.ink : C.faint}
                    icon={<ChannelIcon id={ch.id} size={13} />}
                    basis={200}
                  />
                ))}
              </div>
            </Card>
          )}

          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: narrow ? "wrap" : "nowrap" }}>
            <Card
              title="Message log"
              subtitle={`Showing ${s.log.length} of ${fmt(r.accepted)} messages · one record per send attempt`}
              pad={0}
              style={{ flex: 1, minWidth: 0 }}
              right={
                <Btn variant="secondary" size="sm" onClick={s.refreshLogs} loading={s.refreshing}>
                  <I as={ArrowSync20Regular} size={13} /> Refresh
                </Btn>
              }
            >
              <div style={{ maxHeight: 460, overflowY: "auto" }}>
                {s.log.map((row) => (
                  <LogRow key={row.sid} row={row} channelById={s.channelById} narrow={narrow} />
                ))}
              </div>
            </Card>

            {!narrow && firstRow && (
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: C.muted, marginBottom: 8 }}>
                  On {first?.name?.split(" ")[0]}'s {s.channelById(firstRow.channel).name}
                </div>
                <ChannelPreview
                  channel={firstRow.channel}
                  person={first}
                  body={c?.body}
                  smsBody={c?.smsBody}
                  subject={c?.subject}
                  attachment={c?.attachment}
                  status={firstRow.status}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
