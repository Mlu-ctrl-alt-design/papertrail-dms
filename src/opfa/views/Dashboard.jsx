// Console home. Every figure here is derived from live store state rather
// than hard-coded, which is the point: use the bot in the simulator tab and
// the containment rate on this screen moves.
import { useMemo } from "react";
import {
  Chat20Regular, CheckmarkCircle20Regular, Folder20Regular, Timer20Regular,
  Star20Regular, People20Regular, ArrowRight20Regular,
} from "@fluentui/react-icons";
import { ViewHeader, Card, Stat, I, C } from "../../components/index.js";
import { OPFA } from "../brand.jsx";
import { useOpfa, now } from "../store.js";
import { fmt, pct, relTime, caseStyle } from "../helpers.js";
import { StatusPill } from "../ui.jsx";

const DAY = 86_400_000;

export function DashboardView({ setActive }) {
  const s = useOpfa();

  const m = useMemo(() => {
    const t = now();
    const since = t - DAY;

    // Live conversations count alongside the seeded history: a demo that
    // ignores what just happened in the other tab defeats the purpose.
    const liveToday = s.conversations.filter((c) => c.lastInboundAt >= since);
    const histToday = s.history.filter((h) => h.at >= since);
    const total = liveToday.length + histToday.length;

    const escalatedLive = liveToday.filter((c) => c.mode === "queued" || c.mode === "agent" || c.assignedTo).length;
    const escalated = escalatedLive + histToday.filter((h) => h.escalated).length;

    const csats = s.history.filter((h) => h.csat != null).map((h) => h.csat)
      .concat(s.conversations.filter((c) => c.csat != null).map((c) => c.csat));
    const csat = csats.length ? (csats.reduce((a, b) => a + b, 0) / csats.length) : null;

    const responded = s.history.filter((h) => h.escalated);
    const avgFirst = responded.length
      ? Math.round(responded.reduce((a, h) => a + h.firstResponseSec, 0) / responded.length)
      : 0;

    // Volume by hour across the last 24, so the bar chart has a shape rather
    // than a single spike.
    const buckets = Array.from({ length: 12 }, (_, i) => {
      const from = t - (12 - i) * 2 * 3600_000;
      const to = from + 2 * 3600_000;
      return {
        label: new Date(from).toLocaleTimeString("en-ZA", { hour: "2-digit", hour12: false }),
        n: s.history.filter((h) => h.at >= from && h.at < to).length
          + s.conversations.filter((c) => c.lastInboundAt >= from && c.lastInboundAt < to).length,
      };
    });

    const intents = {};
    s.history.forEach((h) => { intents[h.intent] = (intents[h.intent] || 0) + 1; });
    s.conversations.forEach((c) => {
      c.messages.forEach((msg) => {
        if (msg.nlu?.intent) intents[msg.nlu.intent] = (intents[msg.nlu.intent] || 0) + 1;
      });
    });
    const topIntents = Object.entries(intents).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      total,
      containment: total ? pct(total - escalated, total) : 0,
      waiting: s.conversations.filter((c) => c.mode === "queued").length,
      openCases: s.cases.filter((c) => !["Settled", "Closed"].includes(c.stage)).length,
      csat,
      avgFirst,
      agentsOnline: s.agents.filter((a) => a.status === "online").length,
      buckets,
      topIntents,
      maxBucket: Math.max(1, ...buckets.map((b) => b.n)),
    };
  }, [s]);

  // The activity feed is the audit trail, lightly filtered — the thing that
  // visibly moves when the other tab acts.
  const feed = useMemo(() => s.audit.slice(0, 8), [s.audit]);

  return (
    <>
      <ViewHeader
        title="Dashboard"
        subtitle="WhatsApp Business channel · last 24 hours"
      />
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <Stat label="Conversations" value={fmt(m.total)} sub="Started in the last 24 hours"
                icon={<I as={Chat20Regular} size={14} color={OPFA.navy} />} />
          <Stat label="Bot containment" value={`${m.containment}%`} tone={m.containment >= 70 ? C.success : C.warning}
                sub="Resolved without an agent" icon={<I as={CheckmarkCircle20Regular} size={14} color={C.success} />} />
          <Stat label="Waiting for agent" value={fmt(m.waiting)} tone={m.waiting ? C.warning : C.ink}
                sub="In the queue right now" icon={<I as={People20Regular} size={14} color={C.warning} />} />
          <Stat label="Open complaints" value={fmt(m.openCases)} sub="Not yet settled or closed"
                icon={<I as={Folder20Regular} size={14} color={OPFA.purple} />} />
          <Stat label="Avg first response" value={`${m.avgFirst}s`} sub="Agent replies to a queued chat"
                icon={<I as={Timer20Regular} size={14} color={OPFA.blue} />} />
          <Stat label="CSAT" value={m.csat ? m.csat.toFixed(1) : "—"} sub={`Out of 5 · ${m.agentsOnline} agents online`}
                icon={<I as={Star20Regular} size={14} color="#F0B323" />} />
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
          <Card title="Conversation volume" subtitle="Two-hour buckets across the last 24 hours">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 132 }}>
              {m.buckets.map((b, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 0 }}>
                  <div
                    title={`${b.n} conversation${b.n === 1 ? "" : "s"}`}
                    style={{
                      width: "100%", borderRadius: "3px 3px 0 0",
                      height: `${Math.max(3, (b.n / m.maxBucket) * 104)}px`,
                      background: b.n ? OPFA.blue : C.hairline,
                      transition: "height 0.3s ease",
                    }}
                  />
                  <span style={{ fontSize: 9, color: C.faint, whiteSpace: "nowrap" }}>{b.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Top intents" subtitle="What complainants are asking the bot">
            {m.topIntents.length === 0 && (
              <div style={{ fontSize: 12, color: C.faint }}>No classified messages yet.</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {m.topIntents.map(([id, n], i) => {
                const max = m.topIntents[0][1];
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 118, flexShrink: 0, fontSize: 11.5, color: C.text, fontWeight: 600 }}>
                      {id.replaceAll("_", " ")}
                    </span>
                    <div style={{ flex: 1, height: 8, background: C.surfaceMute, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        width: `${(n / max) * 100}%`, height: "100%", borderRadius: 4,
                        background: OPFA.figures[i % OPFA.figures.length], transition: "width 0.3s ease",
                      }} />
                    </div>
                    <span style={{ width: 26, textAlign: "right", fontSize: 11, fontWeight: 700, color: C.muted }}>{n}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card
            title="Complaints by stage"
            subtitle="Cases linked to the WhatsApp channel"
            right={
              <button onClick={() => setActive("cases")} style={linkBtn}>
                All cases <I as={ArrowRight20Regular} size={12} />
              </button>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {Object.entries(
                s.cases.reduce((acc, c) => ({ ...acc, [c.stage]: (acc[c.stage] || 0) + 1 }), {}),
              ).map(([stage, n]) => (
                <div key={stage} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <StatusPill kind="case" value={stage} label={stage} size="sm" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: caseStyle(stage).fg }}>{n}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Recent activity"
            subtitle="Live — moves when the simulator acts"
            right={
              <button onClick={() => setActive("audit")} style={linkBtn}>
                Audit trail <I as={ArrowRight20Regular} size={12} />
              </button>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {feed.map((a, i) => (
                <div key={a.id} className={i === 0 ? "fade-up" : undefined} style={{
                  display: "flex", gap: 10, padding: "7px 0",
                  borderBottom: i === feed.length - 1 ? "none" : `1px solid ${C.hairline}`,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", marginTop: 6, flexShrink: 0,
                    background: a.severity === "ALERT" ? C.danger
                      : a.severity === "SECURITY" ? C.warning
                      : a.severity === "NOTICE" ? OPFA.blue : C.hairline,
                  }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11.5, color: C.ink, fontWeight: 600 }}>
                      {a.action.replaceAll("_", " ").toLowerCase()}
                    </div>
                    <div style={{ fontSize: 10.5, color: C.faint, lineHeight: 1.45 }}>
                      {a.detail}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: C.faint, flexShrink: 0, whiteSpace: "nowrap" }}>
                    {relTime(a.at, now())}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

const linkBtn = {
  background: "transparent", border: "none", cursor: "pointer",
  fontFamily: "inherit", fontSize: 11, fontWeight: 700, color: C.brand,
  display: "inline-flex", alignItems: "center", gap: 4, padding: 0,
};
