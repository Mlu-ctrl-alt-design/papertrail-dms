// Formatters and derived helpers for the Payroll module.
import { C } from "../components/index.js";
import { TODAY } from "./data.js";

// 38000 -> "R 38,000.00"
export const formatZAR = (n) =>
  "R " + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Whole days from TODAY until an ISO date (min 0).
export const daysFromToday = (iso) => {
  const ms = new Date(iso + "T00:00:00").getTime() - TODAY.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
};

// Status pill colours (bg/fg) keyed by lifecycle phase.
export const phaseStyle = (phase) =>
  ({
    before: { bg: C.surfaceMute, fg: C.muted, label: "Scheduled" },
    ready: { bg: C.successBg, fg: C.success, label: "Ready to run" },
    processing: { bg: C.warningBg, fg: C.warning, label: "Processing" },
    completed: { bg: C.successBg, fg: C.success, label: "Completed" },
    failed: { bg: C.dangerBg, fg: C.danger, label: "Failed" },
  }[phase] || { bg: C.surfaceMute, fg: C.muted, label: phase });

// Exception tone -> {bg, fg}
export const toneStyle = (tone) =>
  ({
    success: { bg: C.successBg, fg: C.success },
    danger: { bg: C.dangerBg, fg: C.danger },
    warning: { bg: C.warningBg, fg: C.warning },
    brand: { bg: C.brandTint, fg: C.brand },
  }[tone] || { bg: C.surfaceMute, fg: C.text });
