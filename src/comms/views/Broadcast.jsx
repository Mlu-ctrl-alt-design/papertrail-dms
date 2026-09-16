// The demo's spine: pick an audience → write the message → broadcast.
// Two steps, then the live delivery board takes over the same view.
import { useState } from "react";
import {
  People20Regular, ChevronRight20Regular, ChevronLeft20Regular, Send20Filled,
  Attach20Regular, Dismiss20Regular, Document20Filled, Warning20Filled,
  PhoneLaptop20Regular, ShieldCheckmark20Regular, Clock20Regular,
  CheckmarkCircle20Filled, Prohibited20Filled,
} from "@fluentui/react-icons";
import {
  ViewHeader, Btn, Pill, AvatarChip, FluentSelect, I, C, SHADOW, useMaxWidth, BP,
} from "../../components/index.js";
import { useComms } from "../state.js";
import {
  SEGMENTS, TEMPLATES, CHANNELS, ORG, deptName, channelReach, CONSENT_LABEL,
} from "../data.js";
import { fmt, smsSegments } from "../helpers.js";
import { ChannelPreview } from "../previews.jsx";
import { Card, StepDots, Checkbox, FormGrid, Field, TextField } from "../ui.jsx";
import { ChannelIcon } from "../icons.jsx";
import { DeliveryBoard } from "./Delivery.jsx";

// ─── Step 1: broadcast details ────────────────────────────────────────────────
// Laid out as the Ezra360 campaign record is — labelled fields in two columns,
// audience and channel as selects rather than tiles.
function ConsentChip({ e }) {
  const tone = {
    opted_in: { fg: C.success, bg: C.successBg },
    pending: { fg: C.warning, bg: C.warningBg },
    opted_out: { fg: C.danger, bg: C.dangerBg },
  }[e.waConsent];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
      {e.sessionHours > 0 && (
        <span title="This employee messaged us recently, so free text is allowed" style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          fontSize: 9.5, fontWeight: 700, color: C.brand,
          border: `1px solid ${C.brand}59`, background: "transparent",
          padding: "2px 8px", borderRadius: 100, whiteSpace: "nowrap",
        }}>
          <I as={Clock20Regular} size={10} color={C.brand} /> {e.sessionHours}h window
        </span>
      )}
      <span title={e.consentAt} style={{
        fontSize: 9.5, fontWeight: 700, color: tone.fg,
        border: `1px solid ${tone.fg}59`, background: "transparent",
        padding: "2px 8px", borderRadius: 100, whiteSpace: "nowrap",
      }}>{CONSENT_LABEL[e.waConsent]}</span>
    </span>
  );
}

function RecipientRow({ e, excluded, onToggle }) {
  return (
    <div onClick={() => onToggle(e.id)} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
      borderBottom: `1px solid ${C.hairline}`, cursor: "pointer",
      opacity: excluded ? 0.45 : 1, transition: "opacity 0.15s",
    }}
    onMouseEnter={(ev) => (ev.currentTarget.style.background = C.surfaceAlt)}
    onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
      <Checkbox checked={!excluded} label={`Send to ${e.name}`} />
      <AvatarChip initials={e.initials} color={e.color} size={26} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</div>
        <div style={{ fontSize: 10.5, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {e.role} · {deptName(e.dept)}
        </div>
      </div>
      <ConsentChip e={e} />
      <div style={{ fontSize: 11, color: C.faint, flexShrink: 0 }}>{e.mobile}</div>
    </div>
  );
}

const PURPOSES = [
  { value: "internal", label: "Internal communication" },
  { value: "notice", label: "Operational notice" },
  { value: "newsletter", label: "Newsletter" },
  { value: "payroll", label: "Payroll" },
];

function StepDetails() {
  const s = useComms();
  const narrow = useMaxWidth(BP.md);

  // Option labels stay short so nothing truncates; the counts go in the hint
  // line underneath, where there is room for them.
  const audienceOptions = SEGMENTS.map((seg) => ({ value: seg.id, label: seg.name }));
  const channelOptions = CHANNELS.map((c) => ({ value: c.id, label: c.name }));

  const primaryReach = Math.min(s.reach, channelReach(s.segment.size, s.primaryChannel, s.freeForm));
  const pickedUp = Math.max(0, s.reach - primaryReach);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card title="Broadcast details" subtitle="Who it goes to, how it goes out, and when.">
        <FormGrid columns={narrow ? 1 : 2}>
          <Field label="Broadcast code" hint="Generated when the broadcast is created">
            <TextField value={s.broadcastCode} readOnly />
          </Field>
          <Field label="Status">
            <TextField value="Draft" readOnly />
          </Field>

          <Field label="Name" required>
            <TextField value={s.name} onChange={s.setName} placeholder="Broadcast name" />
          </Field>
          <Field label="Send">
            <FluentSelect
              value={s.scheduleNow ? "now" : "scheduled"}
              onChange={(e) => s.setScheduleNow(e.target.value === "now")}
              options={[
                { value: "now", label: "Immediately" },
                { value: "scheduled", label: "Scheduled" },
              ]}
            />
          </Field>

          <Field label="Purpose">
            <FluentSelect value={s.purpose} onChange={(e) => s.setPurpose(e.target.value)} options={PURPOSES} />
          </Field>
          <Field label="Send date">
            <TextField type="date" value={s.sendDate} onChange={s.setSendDate} disabled={s.scheduleNow} />
          </Field>

          <Field
            label="Audience"
            required
            hint={
              s.fallbackChannel && pickedUp > 0
                ? `${fmt(s.reach)} recipients · ${fmt(primaryReach)} on ${s.channels[0].name}, ${fmt(pickedUp)} picked up by ${s.channels[1].name}`
                : `${fmt(s.reach)} recipients on ${s.channels[0].name}`
            }
          >
            <FluentSelect value={s.segmentId} onChange={(e) => s.selectSegment(e.target.value)} options={audienceOptions} />
          </Field>
          <Field
            label="Channel"
            required
            hint={`${fmt(channelReach(s.segment.size, s.primaryChannel, s.freeForm))} of ${fmt(s.segment.size)} in this audience are reachable on ${s.channels[0].name}`}
          >
            <FluentSelect
              value={s.primaryChannel}
              onChange={(e) => s.selectPrimary(e.target.value)}
              options={channelOptions}
            />
          </Field>

          <Field label="Owner">
            <TextField value="M. Manda · Provincial Communications" readOnly />
          </Field>
          <Field
            label="Fallback channel"
            hint={s.fallbackChannel
              ? `Anyone who can't be reached on ${s.channels[0].name} — or whose message fails — is picked up by ${s.channels[1].name}.`
              : "No fallback: anyone unreachable on the primary channel is skipped."}
          >
            <FluentSelect
              value={s.fallbackChannel}
              onChange={(e) => s.selectFallback(e.target.value)}
              placeholder="None"
              options={[
                { value: "", label: "None" },
                ...channelOptions.filter((c) => c.value !== s.primaryChannel),
              ]}
            />
          </Field>
        </FormGrid>
      </Card>

      <Card
        title="Recipients"
        subtitle={`Showing ${s.members.length} of ${fmt(s.reach)} · untick anyone who should not receive this`}
        pad={0}
        right={<Pill outline fg={C.brand} bg={C.brandTint}>{fmt(s.reach)} selected</Pill>}
      >
        <div style={{ maxHeight: 290, overflowY: "auto" }}>
          {s.members.map((e) => (
            <RecipientRow key={e.id} e={e} excluded={s.excluded.includes(e.id)} onToggle={s.toggleRecipient} />
          ))}
        </div>
        {s.skipped.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
            background: C.warningBg, color: C.warning, fontSize: 11.5, fontWeight: 600,
          }}>
            <I as={Warning20Filled} size={14} color={C.warning} />
            <span>
              {s.skipped.length} employee{s.skipped.length > 1 ? "s" : ""} in this audience will be skipped:{" "}
              {s.skipped.map((e) => `${e.name} (${e.reason.toLowerCase()})`).join("; ")}.
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────
function TemplateChip({ t, selected, onSelect }) {
  return (
    <button onClick={() => onSelect(t.id)} style={{
      cursor: "pointer", fontFamily: "inherit", textAlign: "left",
      border: `1.5px solid ${selected ? C.brand : C.hairline}`,
      background: selected ? C.brandTintSoft : "#fff",
      borderRadius: 8, padding: "10px 12px", flex: "1 1 180px", minWidth: 0,
      transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: selected ? C.brand : C.ink }}>{t.name}</span>
        {t.meta
          ? <Pill outline fg={C.success} bg={C.successBg}>Meta approved</Pill>
          : <Pill outline fg={C.warning} bg={C.warningBg}>Free text</Pill>}
      </div>
      <div style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.4 }}>{t.blurb}</div>
      {/* The registered template is what Meta actually matches on. */}
      <div style={{ fontSize: 9.5, color: C.faint, marginTop: 6, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace" }}>
        {t.meta ? `${t.meta.name} · ${t.meta.category} · ${t.meta.language}` : "no template · 24-hour window only"}
      </div>
    </button>
  );
}

function PolicyCheck() {
  const s = useComms();
  const p = s.policy;
  if (!p.onWhatsApp) return null;

  const rows = [
    p.freeForm
      ? {
          tone: "warn",
          title: "Free text — no approved template",
          detail: p.fallbackChannel
            ? `Meta only allows free text inside a 24-hour customer service window — i.e. where the employee messaged us first. ${fmt(p.windowOpen)} ${p.windowOpen === 1 ? "employee has" : "employees have"} an open conversation right now; everyone else is routed to ${p.fallbackChannel.name} instead.`
            : "Meta only allows free text inside a 24-hour customer service window. With WhatsApp as the only channel this send can't go out — add a fallback channel or pick an approved template.",
        }
      : {
          tone: "ok",
          title: `Approved template · ${p.meta.category}`,
          detail: `${p.meta.name} (${p.meta.language}) was approved by Meta on ${p.meta.approvedOn}. Business-initiated messages outside the 24-hour window must use it, and this send does.`,
        },
    {
      tone: p.noConsent > 0 ? "warn" : "ok",
      title: `${fmt(p.optedIn)} of ${fmt(p.withNumber)} have opted in to WhatsApp`,
      detail: p.noConsent > 0
        ? `${fmt(p.noConsent)} employees have a number but no recorded opt-in. They are never messaged on WhatsApp${p.fallbackChannel ? ` — they go out on ${p.fallbackChannel.name}` : " and are skipped"}.`
        : "Every recipient has a recorded opt-in captured at HR onboarding.",
    },
    {
      tone: "ok",
      title: "Opt-out is honoured automatically",
      detail: "STOP replies are written back to the employee register within seconds and excluded from every future send. Every approved template carries the opt-out line.",
    },
  ];

  const ICON = { ok: CheckmarkCircle20Filled, warn: Warning20Filled, stop: Prohibited20Filled };
  const COLOUR = { ok: C.success, warn: C.warning, stop: C.danger };

  return (
    <Card
      title="WhatsApp policy check"
      subtitle="Meta's rules for business-initiated messaging, checked against this send"
      right={
        <Pill outline fg={p.blockedSend ? C.danger : p.freeForm ? C.warning : C.success}
              bg={p.blockedSend ? C.dangerBg : p.freeForm ? C.warningBg : C.successBg}>
          <I as={ShieldCheckmark20Regular} size={11}
             color={p.blockedSend ? C.danger : p.freeForm ? C.warning : C.success} />
          {p.blockedSend ? "Blocked" : p.freeForm ? "Restricted" : "Clear to send"}
        </Pill>
      }
    >
      {rows.map((r, i) => {
        const tone = p.blockedSend && i === 0 ? "stop" : r.tone;
        return (
          <div key={r.title} style={{
            display: "flex", gap: 10, padding: "10px 0",
            borderTop: i === 0 ? "none" : `1px solid ${C.hairline}`,
          }}>
            <I as={ICON[tone]} size={16} color={COLOUR[tone]} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{r.title}</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, marginTop: 2 }}>{r.detail}</div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function StepCompose() {
  const s = useComms();
  const [picking, setPicking] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card
        title="Message template"
        subtitle="A Meta-approved template can be sent to any opted-in employee. Free text only reaches conversations opened in the last 24 hours."
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {TEMPLATES.map((t) => (
            <TemplateChip key={t.id} t={t} selected={s.templateId === t.id} onSelect={s.applyTemplate} />
          ))}
        </div>
      </Card>

      <Card
        title="Message"
        subtitle={`Use *bold*, _italic_ and {{name}}, {{fullName}}, {{persal}} or {{lineManager}} for personalisation. Goes out on ${s.channels.filter((c) => c.id !== "sms").map((c) => c.name).join(", ") || "SMS only"}.`}
        right={<span style={{ fontSize: 11, color: C.faint }}>{s.body.length} / 1024</span>}
      >
        {s.channelIds.includes("email") && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Email subject line
            </div>
            <input
              value={s.subject}
              onChange={(e) => s.setSubject(e.target.value)}
              placeholder="Subject line for the email version"
              style={{
                width: "100%", padding: "9px 12px", border: `1px solid ${C.hairlineSoft}`,
                borderRadius: 6, fontSize: 13, background: C.surfaceAlt, color: C.text,
                fontFamily: "inherit",
              }}
              onFocus={(e) => (e.target.style.borderColor = C.brand)}
              onBlur={(e) => (e.target.style.borderColor = C.hairlineSoft)}
            />
          </div>
        )}
        <textarea
          value={s.body}
          onChange={(e) => s.setBody(e.target.value)}
          placeholder="Type the message employees will receive…"
          rows={10}
          style={{
            width: "100%", border: `1px solid ${C.hairlineSoft}`, borderRadius: 6,
            padding: "12px 14px", fontSize: 13, lineHeight: 1.55, color: C.text,
            background: C.surfaceAlt, resize: "vertical", fontFamily: "inherit",
          }}
          onFocus={(e) => (e.target.style.borderColor = C.brand)}
          onBlur={(e) => (e.target.style.borderColor = C.hairlineSoft)}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          {s.attachment ? (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 9,
              border: `1px solid ${C.hairline}`, borderRadius: 6, padding: "7px 10px", background: "#fff",
            }}>
              <I as={Document20Filled} size={16} color={C.danger} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{s.attachment.name}</div>
                <div style={{ fontSize: 10, color: C.faint }}>{s.attachment.size}</div>
              </div>
              <button onClick={() => s.setAttachment(null)} style={{
                background: "none", border: "none", cursor: "pointer", color: C.faint, display: "inline-flex",
              }}><I as={Dismiss20Regular} size={14} /></button>
            </div>
          ) : (
            <Btn variant="secondary" onClick={() => setPicking(true)}>
              <I as={Attach20Regular} size={15} /> Attach document
            </Btn>
          )}
          <span style={{ fontSize: 11, color: C.faint }}>PDF, DOCX or image · max 16 MB</span>
        </div>

        {picking && (
          <div style={{ marginTop: 10, border: `1px solid ${C.hairline}`, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ padding: "8px 12px", background: C.surfaceAlt, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              From the document library
            </div>
            {[
              { name: "NWPG-Newsletter-Sept-2026.pdf", size: "2.4 MB", kind: "pdf", pages: 12 },
              { name: "Office-Closure-Notice-15Sept.pdf", size: "310 KB", kind: "pdf", pages: 1 },
              { name: "Wellness-Week-Programme.pdf", size: "780 KB", kind: "pdf", pages: 4 },
            ].map((doc) => (
              <div key={doc.name} onClick={() => { s.setAttachment(doc); setPicking(false); }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderTop: `1px solid ${C.hairline}`, cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceAlt)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <I as={Document20Filled} size={16} color={C.danger} />
                <span style={{ fontSize: 12.5, color: C.ink, flex: 1 }}>{doc.name}</span>
                <span style={{ fontSize: 11, color: C.faint }}>{doc.size}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {s.channelIds.includes("sms") && (
        <Card
          title="SMS version"
          subtitle="SMS carries no formatting or attachments, so it gets its own short copy with a link."
          right={
            <span style={{ fontSize: 11, fontWeight: 700, color: smsSegments(s.smsBody) > 1 ? C.warning : C.success }}>
              {s.smsBody.length} chars · {smsSegments(s.smsBody)} segment{smsSegments(s.smsBody) === 1 ? "" : "s"}
            </span>
          }
        >
          <textarea
            value={s.smsBody}
            onChange={(e) => s.setSmsBody(e.target.value)}
            placeholder="Short SMS copy — 160 characters keeps it to one billable segment."
            rows={3}
            style={{
              width: "100%", border: `1px solid ${C.hairlineSoft}`, borderRadius: 6,
              padding: "12px 14px", fontSize: 13, lineHeight: 1.55, color: C.text,
              background: C.surfaceAlt, resize: "vertical", fontFamily: "inherit",
            }}
            onFocus={(e) => (e.target.style.borderColor = C.brand)}
            onBlur={(e) => (e.target.style.borderColor = C.hairlineSoft)}
          />
        </Card>
      )}

      <PolicyCheck />

      <Card title="Delivery" subtitle={s.channels.map((c) => `${c.name} · ${c.consent}`).join("  |  ")}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { id: true, label: "Send now", hint: "Delivers immediately" },
            { id: false, label: "Schedule", hint: "Tomorrow, 07:00 SAST" },
          ].map((opt) => (
            <button key={String(opt.id)} onClick={() => s.setScheduleNow(opt.id)} style={{
              cursor: "pointer", fontFamily: "inherit", textAlign: "left",
              border: `1.5px solid ${s.scheduleNow === opt.id ? C.brand : C.hairline}`,
              background: s.scheduleNow === opt.id ? C.brandTintSoft : "#fff",
              borderRadius: 8, padding: "10px 14px", flex: "1 1 160px",
            }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: s.scheduleNow === opt.id ? C.brand : C.ink }}>{opt.label}</div>
              <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>{opt.hint}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── View ─────────────────────────────────────────────────────────────────────
export function BroadcastView() {
  const s = useComms();
  const narrow = useMaxWidth(BP.lg);
  const previewPerson = s.recipients[0] || s.members[0];

  if (s.phase !== "idle") return <DeliveryBoard />;

  const canSend = s.reach > 0 && !s.policy.blockedSend && (s.body.trim().length > 0 || s.attachment);

  return (
    <>
      <ViewHeader
        title="New broadcast"
        subtitle={`${ORG.unit} · ${ORG.name}`}
        action={<StepDots step={s.step} steps={["Broadcast details", "Write message"]} />}
      />
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", maxWidth: 1280, margin: "0 auto" }}>
          <div className="fade-up" style={{ flex: 1, minWidth: 0 }}>
            {s.step === 1 ? <StepDetails /> : <StepCompose />}
          </div>
          {!narrow && (
            <div style={{ position: "sticky", top: 0, flexShrink: 0, width: 300 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: C.muted }}>
                <I as={PhoneLaptop20Regular} size={15} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  Recipient preview
                </span>
              </div>
              {/* One tab per selected channel — the same broadcast, rendered
                  the way each channel will actually deliver it. */}
              <div style={{
                display: "flex", gap: 2, padding: 3, marginBottom: 10,
                background: C.surfaceMute, borderRadius: 6,
              }}>
                {s.channels.map((c) => {
                  const on = s.previewChannel === c.id;
                  return (
                    <button key={c.id} onClick={() => s.setPreviewChannel(c.id)} style={{
                      flex: 1, border: "none", borderRadius: 4, cursor: "pointer",
                      padding: "6px 4px", fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                      background: on ? "#fff" : "transparent", color: on ? C.ink : C.muted,
                      boxShadow: on ? SHADOW.sm : "none",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}>
                      <ChannelIcon id={c.id} size={13} color={on ? c.colour : C.faint} />
                      {c.name}
                    </button>
                  );
                })}
              </div>
              <ChannelPreview
                channel={s.previewChannel}
                person={previewPerson}
                body={s.body}
                smsBody={s.smsBody}
                subject={s.subject}
                attachment={s.attachment}
              />
              <div style={{ fontSize: 10.5, color: C.faint, marginTop: 8, lineHeight: 1.5 }}>
                Preview personalised for {previewPerson?.name?.split(" ")[0] || "the recipient"}. Every recipient gets their own name.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky action bar */}
      <div style={{
        borderTop: `1px solid ${C.hairline}`, background: "#fff", padding: "12px 20px",
        // Right-aligned: keeps the summary and actions clear of the floating
        // prototype switcher pinned bottom-left.
        display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16,
        flexWrap: "wrap", flexShrink: 0, boxShadow: "0 -2px 12px rgba(0,0,0,0.05)",
      }}>
        {!narrow && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, marginRight: "auto", paddingLeft: 280 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%", background: C.brandTint,
            display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            <I as={People20Regular} size={16} color={C.brand} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
              {fmt(s.reach)} recipients · {s.segment.name}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              {s.step === 1
                ? `Step 1 of 2 — details · ${s.channels.map((c) => c.name).join(" → ")}`
                : `${s.template.name}${s.attachment ? ` · ${s.attachment.name}` : ""}`}
            </div>
          </div>
        </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          {s.step === 2 && (
            <Btn variant="secondary" onClick={() => s.setStep(1)}>
              <I as={ChevronLeft20Regular} size={15} /> Back
            </Btn>
          )}
          {s.step === 1 ? (
            <Btn size="lg" onClick={() => s.setStep(2)} disabled={s.reach === 0}>
              Continue to message <I as={ChevronRight20Regular} size={15} />
            </Btn>
          ) : (
            <button onClick={canSend ? s.send : undefined} disabled={!canSend} style={{
              background: "#25D366", color: "#05341c", border: "none", borderRadius: 4,
              padding: "9px 18px", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
              cursor: canSend ? "pointer" : "not-allowed", opacity: canSend ? 1 : 0.5,
              display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
              boxShadow: canSend ? "0 2px 10px rgba(37,211,102,0.4)" : "none",
            }}>
              <I as={Send20Filled} size={15} /> Broadcast to {fmt(s.reach)} on{" "}
              {s.channels.length === 1 ? s.channels[0].name : `${s.channels.length} channels`}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
