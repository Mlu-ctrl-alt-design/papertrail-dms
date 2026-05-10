// Fluent 2 design tokens — the centralized palette/spacing for the app.
// Both the DMS and e-PMS prototypes import from here.

export const C = {
  // Brand
  brand: "#219CD6",
  brandDark: "#1D4FD7",
  brandTint: "#deecf9",
  brandTintSoft: "#e8f4fc",

  // Neutrals
  ink: "#201f1e",
  text: "#323130",
  muted: "#605e5c",
  faint: "#a19f9d",
  hairline: "#e1dfdd",
  hairlineSoft: "#e0dede",
  surface: "#fff",
  surfaceAlt: "#faf9f8",
  surfaceMute: "#f3f2f1",

  // Status (background, text)
  success: "#107c10",
  successBg: "#dff6dd",
  warning: "#7a5700",
  warningBg: "#fff4ce",
  danger: "#a4262c",
  dangerBg: "#fde7e9",
  info: "#0078d4",

  // Accent set used for avatars / category accents
  accents: ["#219CD6", "#107c10", "#8764b8", "#005a9e", "#c8a116", "#a4262c"],
};

export const R = { sm: 4, md: 6, lg: 8, pill: 100 };
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
export const SHADOW = {
  sm: "0 1px 3px rgba(0,0,0,0.08)",
  md: "0 8px 24px rgba(0,0,0,0.15)",
  lg: "0 12px 32px rgba(0,0,0,0.18)",
  xl: "0 32px 80px rgba(0,0,0,0.2)",
  drawer: "-12px 0 32px rgba(0,0,0,0.18)",
};

export const FONT = "'Segoe UI',system-ui,sans-serif";

export const statusStyle = (s) =>
  ({
    approved: { bg: C.successBg, text: C.success },
    pending: { bg: C.warningBg, text: C.warning },
    draft: { bg: "#f3f3f3", text: C.muted },
    archived: { bg: "#f0f0f0", text: C.faint },
  }[s] || { bg: "#f3f3f3", text: C.text });

export const prioStyle = (p) =>
  ({
    urgent: { bg: C.dangerBg, text: C.danger },
    high: { bg: C.warningBg, text: C.warning },
    normal: { bg: "#f3f3f3", text: C.text },
  }[p] || { bg: "#f3f3f3", text: C.text });
