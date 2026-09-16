// Audiences — the saved segments and the employee directory behind them.
import { useRef, useState } from "react";
import {
  Search20Regular, People20Regular, Add20Regular, Dismiss20Regular, Filter20Regular,
  ArrowDownload20Regular,
} from "@fluentui/react-icons";
import { ViewHeader, Btn, Pill, AvatarChip, I, C, SHADOW } from "../../components/index.js";
import {
  SEGMENTS, DEPARTMENTS, EMPLOYEES, CHANNELS, ORG, deptName, combinedReach,
  employeeChannels, channelReach, channelById, CONSENT_LABEL,
} from "../data.js";
import { segmentMembers } from "../state.js";
import { fmt, pct } from "../helpers.js";
import { Card, Stat } from "../ui.jsx";
import { ChannelIcon } from "../icons.jsx";
import { exportCsv, stamp } from "../csv.js";

// Which channels this employee can be reached on, as a row of small glyphs.
function ChannelDots({ e }) {
  const can = employeeChannels(e);
  return (
    <div style={{ display: "inline-flex", gap: 5 }}>
      {CHANNELS.map((ch) => (
        <span key={ch.id} title={`${ch.name}: ${can[ch.id] ? "reachable" : "not on file"}`} style={{
          width: 22, height: 22, borderRadius: 6, display: "grid", placeItems: "center",
          border: `1px solid ${can[ch.id] ? `${ch.colour}59` : C.hairline}`,
          color: can[ch.id] ? ch.colour : C.faint,
          opacity: can[ch.id] ? 1 : 0.5,
        }}>
          <ChannelIcon id={ch.id} size={12} color={can[ch.id] ? ch.colour : C.faint} />
        </span>
      ))}
    </div>
  );
}

// Every tile on this screen is a filter: clicking one narrows the register
// below to the people it counts. Clicking it again clears the filter.
function matchesFilter(e, filter) {
  if (!filter) return true;
  if (filter.kind === "segment") return filter.ids.has(e.id);
  if (filter.kind === "dept") return e.dept === filter.value;
  if (filter.kind === "consent") {
    if (filter.value === "no_number") return !e.mobile;
    return Boolean(e.mobile) && e.waConsent === filter.value;
  }
  return true;
}

export function AudiencesView({ setActive }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(null);
  const registerRef = useRef(null);

  // Applying a filter scrolls the register into view — otherwise the result of
  // the click is off-screen and the tile looks inert.
  const apply = (next) => {
    setFilter((current) => {
      const same = current && current.key === next.key;
      if (!same) {
        requestAnimationFrame(() => {
          registerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return same ? null : next;
    });
  };

  const segmentFilter = (seg) => ({
    kind: "segment",
    key: `segment:${seg.id}`,
    label: seg.name,
    total: seg.size,
    ids: new Set(segmentMembers(seg).map((m) => m.id)),
  });

  const rows = EMPLOYEES.filter((e) =>
    matchesFilter(e, filter) &&
    `${e.fullName} ${e.persal} ${e.role} ${deptName(e.dept)} ${e.site} ${e.email} ${e.lineManager}`
      .toLowerCase().includes(q.toLowerCase()));

  const isActive = (key) => filter?.key === key;

  // Shared styling for the clickable tiles.
  const tile = (active) => ({
    textAlign: "left", fontFamily: "inherit", cursor: "pointer", width: "100%",
    border: `1.5px solid ${active ? C.brand : C.hairline}`,
    background: active ? C.brandTintSoft : "#fff",
    boxShadow: active ? "0 2px 10px rgba(33,156,214,0.18)" : "none",
    borderRadius: 8, padding: "12px 14px", transition: "all 0.15s",
  });

  // Exports exactly what is on screen — filter and search included, so an
  // export of "opt-in pending" is the list someone can act on.
  const exportRegister = () => {
    const slug = filter ? filter.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "all";
    exportCsv(`employee-register-${slug}-${stamp()}.csv`, rows, [
      // The contact columns, in the order the provincial schema lists them.
      { header: "Full Name", get: (e) => e.fullName },
      { header: "First Name", get: (e) => e.first },
      { header: "Middle Name", get: (e) => e.middle },
      { header: "Last Name", get: (e) => e.last },
      { header: "PERSAL Number", get: (e) => e.persal },
      { header: "Email", get: (e) => e.email },
      { header: "Mobile Phone", get: (e) => e.mobile },
      { header: "Line Manager", get: (e) => e.lineManager },
      // Operational state the console adds on top of the contact record.
      { header: "Role", get: (e) => e.role },
      { header: "Department", get: (e) => deptName(e.dept) },
      { header: "Office", get: (e) => e.site },
      ...CHANNELS.map((ch) => ({
        header: `${ch.name} reachable`,
        get: (e) => (employeeChannels(e)[ch.id] ? "Yes" : "No"),
      })),
      { header: "WhatsApp consent", get: (e) => CONSENT_LABEL[e.waConsent] },
      { header: "Consent recorded", get: (e) => e.consentAt },
    ]);
  };

  const th = { padding: "10px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${C.hairline}`, whiteSpace: "nowrap" };
  const td = { padding: "11px 16px", fontSize: 12.5, color: C.text, whiteSpace: "nowrap" };

  return (
    <>
      <ViewHeader title="Audiences" subtitle="Saved segments and the provincial employee register."
        action={<Btn onClick={() => setActive("broadcast")}><I as={Add20Regular} size={15} /> New broadcast</Btn>} />
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <Card
            title="Saved segments"
            subtitle="Available to every operator in Provincial Communications · select one to filter the register"
          >
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
              {SEGMENTS.map((seg) => {
                const f = segmentFilter(seg);
                const active = isActive(f.key);
                return (
                  <button key={seg.id} onClick={() => apply(f)} aria-pressed={active} style={tile(active)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <I as={People20Regular} size={15} color={C.brand} />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{seg.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>{seg.desc}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: C.brand, marginTop: 8 }}>
                      {fmt(combinedReach(seg.size, ["whatsapp", "sms"]))} reachable
                    </div>
                    <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>
                      of {fmt(seg.size)} employees · WhatsApp + SMS
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card
            title="WhatsApp consent"
            subtitle="Meta requires a recorded opt-in before a business may message an employee"
          >
            {(() => {
              const withNumber = Math.round(ORG.headcount * channelById("whatsapp").coverage);
              const optedIn = channelReach(ORG.headcount, "whatsapp");
              const consentRows = [
                { label: "Opted in", value: "opted_in", count: optedIn, tone: C.success, note: "Captured at HR onboarding or by reply" },
                { label: "Opt-in pending", value: "pending", count: withNumber - optedIn, tone: C.warning, note: "Invited, not yet confirmed — never messaged on WhatsApp" },
                { label: "No mobile number", value: "no_number", count: ORG.headcount - withNumber, tone: C.muted, note: "Reached on email or app notifications" },
              ];
              return (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {consentRows.map((r) => {
                    const key = `consent:${r.value}`;
                    const active = isActive(key);
                    return (
                      <button
                        key={r.label}
                        onClick={() => apply({ kind: "consent", key, value: r.value, label: r.label, total: r.count })}
                        aria-pressed={active}
                        style={{
                          ...tile(active), flex: "1 1 220px", minWidth: 0, padding: 0,
                          boxShadow: active ? "0 2px 10px rgba(33,156,214,0.18)" : SHADOW.sm,
                          border: `1.5px solid ${active ? C.brand : C.hairline}`,
                        }}
                      >
                        <Stat
                          label={r.label}
                          value={fmt(r.count)}
                          share={`${pct(r.count, ORG.headcount)}%`}
                          sub={r.note}
                          tone={r.tone}
                          basis={220}
                        />
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </Card>

          <Card title="Departments" subtitle="Headcount and WhatsApp reach · select one to filter the register" pad={0}>
            {DEPARTMENTS.map((d, i) => {
              const key = `dept:${d.id}`;
              const active = isActive(key);
              return (
              <div key={d.id}
                onClick={() => apply({ kind: "dept", key, value: d.id, label: d.name, total: d.total })}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                  borderTop: i === 0 ? "none" : `1px solid ${C.hairline}`,
                  background: active ? C.brandTintSoft : "transparent",
                  cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.surfaceAlt; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: 12.5, color: C.ink, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>
                  {fmt(d.reach)} of {fmt(d.total)}
                </span>
                <Pill outline fg={C.success} bg={C.successBg} style={{ flexShrink: 0, minWidth: 54, justifyContent: "center" }}>
                  {pct(d.reach, d.total)}%
                </Pill>
              </div>
              );
            })}
          </Card>

          <div ref={registerRef} style={{ background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", scrollMarginTop: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", padding: 16, borderBottom: `1px solid ${C.hairline}`, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Employee register</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {filter
                    ? `Showing ${rows.length} of ${fmt(filter.total)} in ${filter.label}`
                    : `Showing ${rows.length} of ${fmt(ORG.headcount)} employees`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {filter && (
                  // The active filter is stated and removable — a filtered table
                  // that doesn't say it is filtered is how people misread data.
                  <button onClick={() => setFilter(null)} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    border: `1px solid ${C.brand}59`, background: C.brandTintSoft,
                    color: C.brand, borderRadius: 100, padding: "5px 10px",
                    fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}>
                    <I as={Filter20Regular} size={13} color={C.brand} />
                    {filter.label}
                    <I as={Dismiss20Regular} size={12} color={C.brand} />
                  </button>
                )}
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint, display: "inline-flex" }}><I as={Search20Regular} size={15} /></span>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employees"
                    style={{ width: 260, padding: "8px 10px 8px 32px", border: `1px solid ${C.hairlineSoft}`, borderRadius: 4, fontSize: 13, background: C.surfaceAlt, color: C.text, fontFamily: "inherit" }} />
                </div>
                <Btn variant="secondary" onClick={exportRegister}>
                  <I as={ArrowDownload20Regular} size={15} /> Export
                </Btn>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.surfaceAlt, textAlign: "left" }}>
                    <th style={th}>Employee</th>
                    <th style={th}>PERSAL no.</th>
                    <th style={th}>Department</th>
                    <th style={th}>Line manager</th>
                    <th style={th}>Mobile phone</th>
                    <th style={th}>Channels</th>
                    <th style={th}>WhatsApp consent</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td style={{ ...td, textAlign: "center", color: C.faint, padding: 36 }} colSpan={6}>
                        No employees in this sample match {filter ? filter.label : "that search"}.
                      </td>
                    </tr>
                  )}
                  {rows.map((e) => (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${C.hairline}` }}>
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <AvatarChip initials={e.initials} color={e.color} size={28} />
                          <div>
                            <div style={{ fontWeight: 600, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
                              {e.name}{e.exec && <Pill outline fg={C.brand} bg={C.brandTint}>Exec</Pill>}
                            </div>
                            <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>{e.role}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...td, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 11.5, color: e.persal ? C.muted : C.faint }}>
                        {e.persal || "—"}
                      </td>
                      <td style={td}>{deptName(e.dept)}</td>
                      <td style={{ ...td, color: e.lineManager ? C.text : C.faint }}>
                        {e.lineManager || "—"}
                      </td>
                      <td style={td}>
                        {e.mobile
                          ? <span style={{ color: C.text }}>{e.mobile}</span>
                          : <Pill outline fg={C.warning} bg={C.warningBg}>Not registered</Pill>}
                      </td>
                      <td style={td}><ChannelDots e={e} /></td>
                      <td style={td}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <Pill
                            outline
                            fg={{ opted_in: C.success, pending: C.warning, opted_out: C.danger }[e.waConsent]}
                            bg={{ opted_in: C.successBg, pending: C.warningBg, opted_out: C.dangerBg }[e.waConsent]}
                          >{CONSENT_LABEL[e.waConsent]}</Pill>
                          <span style={{ fontSize: 10, color: C.faint }}>{e.consentAt}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
