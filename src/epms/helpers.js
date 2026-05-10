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
