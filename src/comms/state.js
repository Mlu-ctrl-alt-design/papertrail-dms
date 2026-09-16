// Connect module state: audience + channel selection, message composition, and
// the broadcast delivery simulation.
//
// Routing model (the thing multi-channel actually buys you): channels are
// ordered by priority. Each recipient is sent on the first selected channel
// they are reachable on; if that channel fails, they drop to the next selected
// channel they can be reached on. A recipient only counts as failed once every
// selected channel has been exhausted.
//
// Sending model: a broadcast is a single submission to the provider, not a
// progress bar. The console waits while the batch is accepted, then reports
// what came back — aggregate counters plus a per-message log. Delivery receipts
// are authoritative; read receipts are not reported at all, because WhatsApp
// only returns them when the recipient has them enabled and SMS/email never do.
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  EMPLOYEES, SEGMENTS, TEMPLATES, HISTORY, CHANNELS,
  channelById, combinedReach, channelReach, employeeChannels, broadcastCodeFor,
  sessionOpen, hasWhatsAppConsent, CONSENT_LABEL,
} from "./data.js";
import { ERROR_CODES } from "./helpers.js";

export const CommsContext = createContext(null);
export const useComms = () => useContext(CommsContext);

export function segmentMembers(segment) {
  if (!segment) return [];
  const pool = EMPLOYEES;
  if (segment.kind === "all") return pool;
  if (segment.kind === "department") return pool.filter((e) => e.dept === segment.deptId);
  if (segment.id === "seg-exec") return pool.filter((e) => e.exec);
  if (segment.id === "seg-mgmt") return pool.filter((e) => e.exec || /Director|Head|Manager/.test(e.role));
  if (segment.id === "seg-head") return pool.filter((e) => e.site === "Mahikeng" || e.site === "Mmabatho");
  if (segment.id === "seg-region") return pool.filter((e) => e.site !== "Mahikeng" && e.site !== "Mmabatho");
  return pool;
}

// Channels this employee may lawfully receive *this* message on. WhatsApp adds
// two conditions on top of "has the channel": a recorded opt-in, and — when the
// message is free text rather than an approved template — an open 24-hour
// customer service window.
export function deliverableChannels(employee, freeForm) {
  const can = employeeChannels(employee);
  return { ...can, whatsapp: can.whatsapp && (!freeForm || sessionOpen(employee)) };
}

// First selected channel this employee is reachable on, in priority order.
export function routeFor(employee, channelIds, freeForm = false) {
  const can = deliverableChannels(employee, freeForm);
  return CHANNELS.map((c) => c.id).find((id) => channelIds.includes(id) && can[id]) || null;
}

// The channel a failed send drops to, if any.
export function fallbackFor(employee, channelIds, after, freeForm = false) {
  const can = deliverableChannels(employee, freeForm);
  const order = CHANNELS.map((c) => c.id).filter((id) => channelIds.includes(id));
  return order.slice(order.indexOf(after) + 1).find((id) => can[id]) || null;
}

// Why a recipient can't be reached at all — shown rather than silently dropped,
// because "who didn't get it and why" is the question compliance asks.
export function blockReason(employee, channelIds, freeForm) {
  if (!channelIds.includes("whatsapp")) return "Not reachable on the selected channels";
  if (employee.waConsent === "opted_out") return "Opted out of WhatsApp (STOP received)";
  if (employee.waConsent === "pending") return "WhatsApp opt-in not yet confirmed";
  if (!employee.mobile) return "No mobile number on the register";
  if (freeForm && !sessionOpen(employee)) return "Outside the 24-hour service window";
  return "Not reachable on the selected channels";
}

const SUBMIT_MS = 2400;          // how long the batch takes to be accepted

// Deterministic Twilio-style message SID so replays look identical.
function sid(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  let hex = "";
  for (let i = 0; i < 4; i += 1) {
    h = (h * 1103515245 + 12345) >>> 0;
    hex += h.toString(16).padStart(8, "0");
  }
  return `SM${hex.slice(0, 32)}`;
}

const stamp = (base, offsetMs) =>
  new Date(base.getTime() + offsetMs).toLocaleTimeString("en-ZA", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

// Build the message log plus the totals it rolls up to. Every attempt is its
// own record, so a message that failed on WhatsApp and was re-sent over SMS
// appears twice — which is how it looks in a real provider console.
function buildResult({ recipients, reach, channels, channelIds, freeForm }) {
  const hasFallback = channels.length > 1;
  const base = new Date();

  const log = [];
  recipients.forEach((e, i) => {
    const channel = routeFor(e, channelIds, freeForm);
    if (!channel) return;
    const fails = Boolean(e.failsOn === channel);
    const fallback = fails ? fallbackFor(e, channelIds, channel, freeForm) : null;
    // A couple of receipts have not come back yet — normal a minute after send.
    const pendingReceipt = !fails && i % 6 === 5;

    log.push({
      sid: sid(`${e.id}-${channel}`),
      at: stamp(base, i * 700),
      person: e,
      channel,
      status: fails ? "failed" : pendingReceipt ? "sent" : "delivered",
      error: fails ? ERROR_CODES[channel] : null,
    });

    if (fallback) {
      log.push({
        sid: sid(`${e.id}-${fallback}`),
        at: stamp(base, i * 700 + 3400),
        person: e,
        channel: fallback,
        status: "delivered",
        rerouted: true,
      });
    }
  });

  // Totals modelled on the full audience: a small residue fails outright, a
  // slightly larger one is still awaiting a delivery receipt.
  const failed = hasFallback
    ? Math.max(reach >= 100 ? 1 : 0, Math.round(reach * 0.004))
    : Math.max(1, Math.round(reach * 0.012));
  const pending = Math.max(1, Math.round(reach * 0.018));
  const delivered = Math.max(0, reach - failed - pending);
  const rescued = hasFallback ? Math.max(1, Math.round(reach * 0.012)) : 0;

  // Routing split: work down the priority chain, each channel picking up
  // whoever the channels above it could not reach, plus anyone rescued.
  const rows = [];
  channels.reduce((pool, c, i) => {
    const routed = i === channels.length - 1 ? pool : Math.min(pool, Math.round(pool * c.coverage));
    rows.push({ ...c, routed });
    return pool - routed;
  }, reach);
  const moved = rows.length > 1 ? Math.min(rescued, rows[0].routed) : 0;
  const deliveredFraction = reach ? delivered / reach : 0;
  const byChannel = rows.map((r, i) => {
    const routed = r.routed + (i === 0 ? -moved : i === 1 ? moved : 0);
    return { ...r, routed, delivered: Math.round(routed * deliveredFraction) };
  });

  return {
    accepted: reach,
    delivered,
    failed,
    pending,
    rescued,
    byChannel,
    log,
    submittedAt: base.toLocaleString("en-ZA", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }),
  };
}

export function useCommsStore() {
  // ── Composition ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);              // 1 = audience + channels, 2 = compose
  const [segmentId, setSegmentId] = useState("seg-comms");
  const [primaryChannel, setPrimaryChannel] = useState("whatsapp");
  const [fallbackChannel, setFallbackChannel] = useState("sms");
  // Campaign-record fields, mirroring the Ezra360 campaign form.
  const [name, setName] = useState("Provincial Newsletter — September 2026");
  const [purpose, setPurpose] = useState("internal");
  const [sendDate, setSendDate] = useState("2026-09-16");
  const [excluded, setExcluded] = useState([]);     // individually de-selected ids
  const [templateId, setTemplateId] = useState("tpl-newsletter");
  const [body, setBody] = useState(TEMPLATES[0].body);
  const [subject, setSubject] = useState(TEMPLATES[0].subject);
  const [smsBody, setSmsBody] = useState(TEMPLATES[0].sms);
  const [attachment, setAttachment] = useState(TEMPLATES[0].attachment);
  const [scheduleNow, setScheduleNow] = useState(true);
  const [previewChannel, setPreviewChannel] = useState("whatsapp");

  // ── Delivery ───────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState("idle");       // idle | submitting | done
  const [result, setResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [history, setHistory] = useState(HISTORY);
  const timer = useRef(null);

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  // ── Derived composition state ──────────────────────────────────────────────
  // Broadcast reference: the next number in the provincial sequence, generated
  // rather than typed, and read-only to the operator.
  const broadcastCode = broadcastCodeFor(1001 + (history.length - HISTORY.length));

  const segment = SEGMENTS.find((s) => s.id === segmentId) || SEGMENTS[0];
  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  // The send chain, in priority order: primary first, then the fallback.
  const channelIds = [primaryChannel, fallbackChannel].filter(Boolean);
  const channels = channelIds.map((id) => channelById(id));
  const freeForm = Boolean(template.freeForm);

  const members = useMemo(() => segmentMembers(segment), [segment]);
  const recipients = useMemo(
    () => members.filter((m) => !excluded.includes(m.id) && routeFor(m, channelIds, freeForm)),
    [members, excluded, channelIds, freeForm],
  );
  // In the audience but not reachable on any selected channel — each with the
  // reason, so nobody is quietly dropped.
  const skipped = useMemo(
    () => members
      .filter((m) => !excluded.includes(m.id) && !routeFor(m, channelIds, freeForm))
      .map((m) => ({ ...m, reason: blockReason(m, channelIds, freeForm) })),
    [members, excluded, channelIds, freeForm],
  );

  // Audience reach: everyone contactable on at least one selected channel,
  // less anyone de-selected by hand.
  const reach = Math.max(0, combinedReach(segment.size, channelIds, freeForm) - excluded.length);
  const reachByChannel = CHANNELS.map((c) => ({
    ...c,
    reach: channelReach(segment.size, c.id, freeForm),
  }));

  // ── WhatsApp policy check ──────────────────────────────────────────────────
  // Everything the operator has to be right about before Meta will deliver.
  const policy = useMemo(() => {
    const onWhatsApp = channelIds.includes("whatsapp");
    const size = segment.size;
    const withNumber = Math.round(size * channelById("whatsapp").coverage);
    const optedIn = channelReach(size, "whatsapp");
    const windowOpen = Math.max(1, Math.round(optedIn * 0.008));
    const fallbackChannel = channels.find((c) => c.id !== "whatsapp");
    return {
      onWhatsApp,
      freeForm,
      meta: template.meta,
      withNumber,
      optedIn,
      noConsent: withNumber - optedIn,
      windowOpen,
      fallbackChannel,
      // Free text with WhatsApp as the only channel can only reach open
      // conversations — for a province-wide send that is nobody.
      blockedSend: onWhatsApp && freeForm && channels.length === 1,
    };
  }, [channelIds, channels, segment, template, freeForm]);

  // ── Composition actions ────────────────────────────────────────────────────
  const applyTemplate = (id) => {
    const t = TEMPLATES.find((x) => x.id === id) || TEMPLATES[0];
    setTemplateId(id);
    setBody(t.body);
    setSubject(t.subject);
    setSmsBody(t.sms);
    setAttachment(t.attachment);
  };

  const toggleRecipient = (id) =>
    setExcluded((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]));

  const selectSegment = (id) => { setSegmentId(id); setExcluded([]); };

  const selectPrimary = (id) => {
    setPrimaryChannel(id);
    if (fallbackChannel === id) setFallbackChannel("");
    setPreviewChannel(id);
  };

  const selectFallback = (id) => {
    setFallbackChannel(id);
    if (!id && previewChannel === fallbackChannel) setPreviewChannel(primaryChannel);
  };

  // ── Sending ────────────────────────────────────────────────────────────────
  // One submission, then results. Nothing is reported while the batch is in
  // flight because in reality there is nothing to report yet.
  const send = () => {
    if (phase !== "idle") return;
    setPhase("submitting");
    setCampaign({
      id: `bc-${1043 + history.length - HISTORY.length}`,
      code: broadcastCode,
      title: name.trim() || (freeForm ? (body.split("\n")[0] || "Untitled broadcast").slice(0, 60) : template.name),
      template: template.name,
      audience: segment.name,
      channels: channelIds,
      meta: template.meta,
      freeForm,
      reach,
      attachment,
      body,
      subject,
      smsBody,
      by: "M. Manda",
    });
    timer.current = setTimeout(() => {
      setResult(buildResult({ recipients, reach, channels, channelIds, freeForm }));
      setPhase("done");
    }, SUBMIT_MS);
  };

  // Delivery receipts keep arriving after the batch is accepted — refreshing
  // the log settles the outstanding ones.
  const refreshLogs = () => {
    if (refreshing || !result) return;
    setRefreshing(true);
    timer.current = setTimeout(() => {
      setResult((r) => {
        if (!r) return r;
        const settled = r.log.map((row) => (row.status === "sent" ? { ...row, status: "delivered" } : row));
        return {
          ...r,
          log: settled,
          pending: 0,
          delivered: r.delivered + r.pending,
          byChannel: r.byChannel.map((c) => ({
            ...c,
            delivered: Math.round(c.routed * ((r.delivered + r.pending) / (r.accepted || 1))),
          })),
        };
      });
      setRefreshing(false);
    }, 900);
  };

  const resetComposer = () => {
    if (timer.current) clearTimeout(timer.current);
    setPhase("idle");
    setResult(null);
    setCampaign(null);
    setStep(1);
    setExcluded([]);
  };

  const archiveAndReset = () => {
    if (campaign && result) {
      setHistory((h) => [
        {
          ...campaign,
          at: result.submittedAt,
          sent: result.accepted,
          delivered: result.delivered,
          pending: result.pending,
          failed: result.failed,
          status: "completed",
        },
        ...h,
      ]);
    }
    resetComposer();
  };

  const counts = result
    ? {
        accepted: result.accepted,
        delivered: result.delivered,
        failed: result.failed,
        pending: result.pending,
        rescued: result.rescued,
      }
    : { accepted: reach, delivered: 0, failed: 0, pending: 0, rescued: 0 };

  return useMemo(
    () => ({
      step, setStep,
      segment, segmentId, selectSegment,
      channels, channelIds, reachByChannel,
      primaryChannel, fallbackChannel, selectPrimary, selectFallback,
      name, setName, purpose, setPurpose, sendDate, setSendDate, broadcastCode,
      previewChannel, setPreviewChannel,
      template, templateId, applyTemplate,
      body, setBody, subject, setSubject, smsBody, setSmsBody,
      attachment, setAttachment,
      scheduleNow, setScheduleNow,
      members, recipients, excluded, toggleRecipient, reach, skipped,
      freeForm, policy, consentLabel: CONSENT_LABEL, hasWhatsAppConsent, sessionOpen,
      phase, result, counts, log: result?.log || [], byChannel: result?.byChannel || [],
      refreshing, refreshLogs,
      campaign, history,
      send, resetComposer, archiveAndReset,
      channelById,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, segmentId, primaryChannel, fallbackChannel, templateId, body, subject, smsBody,
     attachment, scheduleNow, previewChannel, excluded, name, purpose, sendDate,
     phase, result, refreshing, campaign, history],
  );
}
