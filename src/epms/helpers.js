// Formatters and small derived state helpers used across e-PMS views.

export const formatZAR = (v) => {
  const sign = v < 0 ? "-" : "";
  const n = Math.abs(v);
  if (n >= 1_000_000) return `${sign}R${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000)     return `${sign}R${(n / 1_000).toFixed(0)}k`;
  return `${sign}R${n.toFixed(0)}`;
};

export const formatZARFull = (v) => {
  const sign = v < 0 ? "-" : "";
  const n = Math.abs(v);
  return `${sign}R${n.toLocaleString("en-ZA")}`;
};

// "2026-08-30" → days from `today` (default 2026-05-10).
export const daysFrom = (iso, today = new Date("2026-05-10")) => {
  const d = new Date(iso);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
};

// "2026-08-30" → "Aug 30, 2026"
export const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
};

export const tNote = (days) => {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days <= 7)   return `T-${days}d (urgent)`;
  if (days <= 30)  return `T-${days}d`;
  return `T-${days}d`;
};

export const statusColor = (s) => {
  switch (s) {
    case "On track":    return { bg: "#dff6dd", fg: "#107c10" };
    case "At risk":     return { bg: "#fff4ce", fg: "#7a5700" };
    case "Behind":      return { bg: "#fde7e9", fg: "#a4262c" };
    case "Pending":     return { bg: "#deecf9", fg: "#1D4FD7" };
    case "Posted":      return { bg: "#dff6dd", fg: "#107c10" };
    case "Flagged":     return { bg: "#fff4ce", fg: "#7a5700" };
    default:            return { bg: "#f3f3f3", fg: "#605e5c" };
  }
};

// Risk heat — likelihood × impact (1..5)
export const riskScore = (r) => r.likelihood * r.impact;
export const riskColor = (r) => {
  const s = riskScore(r);
  if (s >= 20) return "#a4262c";
  if (s >= 12) return "#c8a116";
  if (s >= 6)  return "#1D4FD7";
  return "#107c10";
};

// Weighted IPMS score: ∑(wᵢ × rᵢ) / 100
export const weightedScore = (kpis) => {
  if (!kpis || kpis.length === 0) return 0;
  const sum = kpis.reduce((acc, k) => acc + (k.weight * k.rating), 0);
  return sum / 100;
};

// ─── IDP balance helpers ──────────────────────────────────────────────────────
// Total weight allocated to a KPA (sum of SO weights).
export const kpaWeight = (kpaId, objectives, excludeSoId = null) =>
  objectives
    .filter((o) => o.kpaId === kpaId && o.id !== excludeSoId)
    .reduce((acc, o) => acc + (o.weight || 0), 0);

// Total weight allocated under one SO (sum of PO weights).
export const soWeight = (soId, performanceObjectives, excludePoId = null) =>
  performanceObjectives
    .filter((p) => p.soId === soId && p.id !== excludePoId)
    .reduce((acc, p) => acc + (p.weight || 0), 0);

// Per-KPA band status — used by the KPABalanceBar and form validators.
// Returns { kpaId, current, band, projected, state, deltaText }.
//   state: "over" (hard) | "under" (soft) | "ok" | "untargeted"
//   projected = current after the simulated change
export const kpaBandStatus = (kpaId, objectives, bands, simulated = 0, excludeSoId = null) => {
  const band = bands?.[kpaId];
  const current = kpaWeight(kpaId, objectives, excludeSoId);
  const projected = current + simulated;
  if (!band) return { kpaId, current, projected, band: null, state: "untargeted", deltaText: "" };
  let state = "ok";
  if (projected > band.max) state = "over";
  else if (projected < band.min) state = "under";
  return { kpaId, current, projected, band, state, deltaText: `${current}% → ${projected}%` };
};

// ─── IDP readiness — coverage + balance checks ───────────────────────────────
// Produces a flat array of checks the Health tab, the meter and the export
// gate all consume. 28 checks total: 5 KPA coverage + 14 SDO coverage + 4
// IUDF coverage + 5 KPA balance.
//   group: "kpa-cov" | "sdo-cov" | "iudf-cov" | "kpa-balance"
//   status: "ok" | "gap"
//   resolve: { kind: "so-picker" | "kpi-composer", filters: { ... } }
export const idpReadinessChecks = ({ objectives, masterKpis, kpas, sdos, iudfs, bands }) => {
  const checks = [];

  // KPA coverage — each KPA needs ≥1 SO and ≥1 KPI to be considered covered.
  kpas.forEach((k) => {
    const soCount = objectives.filter((o) => o.kpaId === k.id).length;
    const kpiCount = masterKpis.filter((m) => m.kpaId === k.id).length;
    let status = "ok"; let details = `${soCount} SO · ${kpiCount} KPI`;
    if (soCount === 0)       { status = "gap"; details = "No Strategic Objective yet"; }
    else if (kpiCount === 0) { status = "gap"; details = `${soCount} SO · no Master KPI yet`; }
    checks.push({ id: `kpa-cov-${k.id}`, group: "kpa-cov", label: `${k.code} · ${k.label}`, status, details,
                  resolve: { kind: soCount === 0 ? "so-picker" : "kpi-composer", filters: { kpaId: k.id } } });
  });

  // SDO coverage — each Treasury SDO must be referenced by ≥1 Master KPI.
  sdos.forEach((s) => {
    const count = masterKpis.filter((m) => m.sdoId === s.id).length;
    const status = count > 0 ? "ok" : "gap";
    checks.push({ id: `sdo-cov-${s.id}`, group: "sdo-cov", label: `${s.code} · ${s.label}`,
                  status, details: count > 0 ? `${count} KPI` : "No KPI references this outcome",
                  resolve: { kind: "kpi-composer", filters: { sdoId: s.id } } });
  });

  // IUDF coverage — each IUDF priority must be referenced by ≥1 Master KPI.
  iudfs.forEach((u) => {
    const count = masterKpis.filter((m) => m.iudfId === u.id).length;
    const status = count > 0 ? "ok" : "gap";
    checks.push({ id: `iudf-cov-${u.id}`, group: "iudf-cov", label: `${u.code} · ${u.label}`,
                  status, details: count > 0 ? `${count} KPI` : "No KPI references this priority",
                  resolve: { kind: "kpi-composer", filters: { iudfId: u.id } } });
  });

  // KPA balance — each KPA's allocated weight must sit inside its band.
  kpas.forEach((k) => {
    const bs = kpaBandStatus(k.id, objectives, bands);
    const status = bs.state === "ok" ? "ok" : "gap";
    const details = bs.band
      ? bs.state === "over"  ? `${bs.current}% allocated — exceeds max ${bs.band.max}%`
      : bs.state === "under" ? `${bs.current}% allocated — below min ${bs.band.min}%`
      : `${bs.current}% allocated (band ${bs.band.min}–${bs.band.max}%)`
      : `${bs.current}% allocated`;
    checks.push({ id: `kpa-bal-${k.id}`, group: "kpa-balance", label: `${k.code} balance`,
                  status, details,
                  resolve: { kind: "so-picker", filters: { kpaId: k.id } } });
  });

  return checks;
};

export const idpReadinessSummary = (checks) => {
  const total = checks.length;
  const passed = checks.filter((c) => c.status === "ok").length;
  return { total, passed, gaps: total - passed, pct: total === 0 ? 100 : Math.round((passed / total) * 100) };
};
