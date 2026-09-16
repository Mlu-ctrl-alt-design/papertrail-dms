// Operator home — reach at a glance, one-click start, recent broadcasts, and
// the two "nice to have" tiles (weather advisory + social sentiment).
import {
  Send20Filled, People20Regular, CheckmarkCircle20Filled,
  Add20Regular, WeatherSunny20Filled, WeatherRain20Filled, WeatherCloudy20Filled,
  ArrowTrending20Regular, ChevronRight20Regular,
} from "@fluentui/react-icons";

// Compact channel chips used on the broadcast rows.
function ChannelChips({ ids = [] }) {
  return (
    <div style={{ display: "inline-flex", gap: 4, flexShrink: 0 }}>
      {ids.map((id) => {
        const ch = channelById(id);
        return (
          <span key={id} title={ch.name} style={{
            width: 20, height: 20, borderRadius: 5, display: "grid", placeItems: "center",
            border: `1px solid ${ch.colour}59`, color: ch.colour,
          }}>
            <ChannelIcon id={id} size={11} />
          </span>
        );
      })}
    </div>
  );
}
import { ViewHeader, Btn, Pill, I, C, useMaxWidth, BP } from "../../components/index.js";
import { useComms } from "../state.js";
import {
  ORG, DEPARTMENTS, SEGMENTS, WEATHER, SENTIMENT, CHANNELS,
  channelReach, combinedReach, channelById,
} from "../data.js";
import { fmt, pct, toneStyle } from "../helpers.js";
import { Card, Stat } from "../ui.jsx";
import { ChannelIcon } from "../icons.jsx";

const WEATHER_ICON = { sun: WeatherSunny20Filled, rain: WeatherRain20Filled, cloud: WeatherCloudy20Filled };

function WeatherTile() {
  return (
    <Card title="Mahikeng today" subtitle={WEATHER.place} style={{ flex: "1 1 320px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <I as={WeatherSunny20Filled} size={44} color="#e8a33d" />
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.ink, lineHeight: 1 }}>{WEATHER.temp}°</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
            {WEATHER.condition} · H {WEATHER.high}° L {WEATHER.low}°
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right", fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
          <div>Wind {WEATHER.wind}</div>
          <div>Humidity {WEATHER.humidity}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {WEATHER.days.map((d) => (
          <div key={d.day} style={{ flex: 1, textAlign: "center", background: C.surfaceAlt, borderRadius: 6, padding: "8px 4px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted }}>{d.day}</div>
            <div style={{ margin: "4px 0" }}>
              <I as={WEATHER_ICON[d.icon]} size={16} color={d.icon === "sun" ? "#e8a33d" : d.icon === "rain" ? C.brand : C.faint} />
            </div>
            <div style={{ fontSize: 10.5, color: C.ink, fontWeight: 600 }}>{d.hi}°</div>
            <div style={{ fontSize: 10, color: C.faint }}>{d.lo}°</div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 12, background: C.warningBg, color: C.warning, borderRadius: 6,
        padding: "9px 11px", fontSize: 11, fontWeight: 600, lineHeight: 1.45,
      }}>{WEATHER.advisory}</div>
    </Card>
  );
}

function SentimentTile() {
  const bars = [
    { label: "Positive", value: SENTIMENT.positive, color: C.success },
    { label: "Neutral", value: SENTIMENT.neutral, color: C.faint },
    { label: "Negative", value: SENTIMENT.negative, color: C.danger },
  ];
  return (
    <Card title="Public sentiment" subtitle={SENTIMENT.window} style={{ flex: "1 1 340px" }}
          right={<Pill outline fg={C.success} bg={C.successBg}><I as={ArrowTrending20Regular} size={11} /> {SENTIMENT.trend}</Pill>}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: C.ink }}>{fmt(SENTIMENT.mentions)}</span>
        <span style={{ fontSize: 11.5, color: C.muted }}>mentions tracked</span>
      </div>
      <div style={{ display: "flex", height: 8, borderRadius: 100, overflow: "hidden", marginBottom: 8 }}>
        {bars.map((b) => <div key={b.label} style={{ width: `${b.value}%`, background: b.color }} />)}
      </div>
      <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        {bars.map((b) => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: b.color }} />
            <span style={{ fontSize: 11.5, color: C.muted }}>{b.label}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.ink }}>{b.value}%</span>
          </div>
        ))}
      </div>
      {SENTIMENT.topics.map((t) => {
        const st = toneStyle(t.tone);
        return (
          <div key={t.topic} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: `1px solid ${C.hairline}` }}>
            <span style={{ fontSize: 12, color: C.ink, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.topic}</span>
            <span style={{ fontSize: 11, color: C.faint }}>{fmt(t.volume)}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: st.fg, background: st.bg,
              padding: "2px 8px", borderRadius: 100, minWidth: 46, textAlign: "center",
            }}>{t.delta}</span>
          </div>
        );
      })}
    </Card>
  );
}

export function DashboardView({ setActive }) {
  const s = useComms();
  const narrow = useMaxWidth(BP.md);
  const last = s.history[0];

  return (
    <>
      <ViewHeader
        title="Communications dashboard"
        subtitle={`${ORG.name} · ${ORG.unit}`}
        action={<Btn size="lg" onClick={() => setActive("broadcast")}><I as={Add20Regular} size={15} /> New broadcast</Btn>}
      />
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Stat
              label="Employees reachable"
              value={fmt(combinedReach(ORG.headcount, ["whatsapp", "sms"]))}
              sub={`${fmt(channelReach(ORG.headcount, "whatsapp"))} on WhatsApp · the rest picked up by SMS`}
              icon={<I as={People20Regular} size={13} color={C.muted} />}
            />
            <Stat
              label="WhatsApp opt-in"
              value={fmt(channelReach(ORG.headcount, "whatsapp"))}
              sub={`${pct(channelReach(ORG.headcount, "whatsapp"), ORG.headcount)}% consented · the rest go by SMS or email`}
              icon={<I as={Send20Filled} size={13} color={C.muted} />}
            />
            <Stat label="Avg. delivery rate" value="99.1%" sub="Last 30 days" tone={C.success} icon={<I as={CheckmarkCircle20Filled} size={13} color={C.success} />} />
            <Stat label="Messages this month" value="14,286" sub="18 broadcasts · 4 departments" tone={C.ink} icon={<I as={Send20Filled} size={13} color={C.muted} />} />
          </div>

          <Card
            title="Send a message"
            subtitle="Pick the audience, write the message, broadcast. Two steps."
            right={<Btn onClick={() => setActive("broadcast")}>Start <I as={ChevronRight20Regular} size={14} /></Btn>}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {SEGMENTS.slice(0, 3).map((seg) => (
                <div key={seg.id} style={{
                  flex: "1 1 200px", border: `1px solid ${C.hairline}`, borderRadius: 8,
                  padding: "12px 14px", background: C.surfaceAlt,
                }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{seg.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                    {fmt(combinedReach(seg.size, ["whatsapp", "sms"]))} recipients on WhatsApp + SMS
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Recent broadcasts" subtitle="What the provider reported for the last five broadcasts" pad={0}
                right={<Btn variant="secondary" size="sm" onClick={() => setActive("history")}>View all</Btn>}>
            {s.history.slice(0, 5).map((b) => (
              <div key={b.id} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "11px 16px",
                borderTop: `1px solid ${C.hairline}`, flexWrap: narrow ? "wrap" : "nowrap",
              }}>
                <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</div>
                  <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>{b.audience} · {b.at} · {b.by}</div>
                </div>
                <div style={{ width: narrow ? "100%" : 190, flexShrink: 0, fontSize: 11, color: C.muted, textAlign: narrow ? "left" : "right" }}>
                  {fmt(b.delivered)} delivered of {fmt(b.sent)} accepted
                  {b.failed > 0 && (
                    <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>{fmt(b.failed)} failed</div>
                  )}
                </div>
                <ChannelChips ids={b.channels} />
                <Pill outline fg={C.success} bg={C.successBg} style={{ flexShrink: 0 }}>
                  {pct(b.delivered, b.sent)}% delivered
                </Pill>
              </div>
            ))}
          </Card>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <WeatherTile />
            <SentimentTile />
          </div>

          <Card title="Reach by channel" subtitle={`Of ${fmt(ORG.headcount)} employees on the register — consent included`}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {CHANNELS.map((ch) => {
                const r = channelReach(ORG.headcount, ch.id);
                return (
                  <Stat
                    key={ch.id}
                    label={ch.name}
                    value={fmt(r)}
                    share={`${pct(r, ORG.headcount)}%`}
                    sub={ch.consent}
                    icon={<ChannelIcon id={ch.id} size={13} />}
                    basis={190}
                  />
                );
              })}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: C.text, background: C.brandTintSoft, borderRadius: 6, padding: "9px 12px", lineHeight: 1.45 }}>
              WhatsApp counts only employees with a recorded opt-in — Meta requires one before a
              business may message them. With an SMS fallback behind it the chain still reaches{" "}
              <strong>{fmt(combinedReach(ORG.headcount, ["whatsapp", "sms"]))}</strong> of {fmt(ORG.headcount)} employees.
            </div>
          </Card>

          {last && (
            <div style={{ fontSize: 11, color: C.faint, textAlign: "center", paddingBottom: 8 }}>
              Demo data · last broadcast {last.at} by {last.by}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
