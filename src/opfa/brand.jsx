// OPFA identity for the WhatsApp Business prototype.
//
// The Office of the Pension Funds Adjudicator is a statutory body, and its
// chrome is deliberately sober: navy, one purple accent, and the multicolour
// figures from the "Est. 1998" mark used only where a categorical palette is
// genuinely needed (charts, avatars). The Ezra360 lockup sits alongside as the
// platform underneath — it is the backend in this solution, not the brand the
// complainant is talking to.
import { C } from "../components/index.js";

export const OPFA = {
  navy: "#22357A",
  navyDark: "#182752",
  navyTint: "#e8ecf7",
  blue: "#2B5BAE",
  purple: "#6B3FA0",
  purpleTint: "#f0eaf8",
  // The five figures on the 1998 mark. Used for categorical series only.
  figures: ["#D64541", "#F0B323", "#3A9B4A", "#2B7FC4", "#7E4CA8"],
};

export const ORG = {
  name: "Office of the Pension Funds Adjudicator",
  short: "OPFA",
  unit: "Digital Service Channels",
  website: "https://www.pfa.org.za",
  lodgeUrl: "https://www.pfa.org.za/lodge-a-complaint",
  email: "enquiries@pfa.org.za",
  tel: "012 346 1738",
  address: "4th Floor, Riverwalk Office Park, Block A, 41 Matroosberg Road, Ashlea Gardens, Pretoria",
  // WhatsApp Business Account identifiers. Shaped like the real thing so the
  // wire panel reads as a live integration rather than a mock-up.
  waba: { id: "102938475610293", phoneNumberId: "103567891234567", display: "+27 60 011 0998" },
  hours: "Mon–Fri, 08:00–16:30",
};

// The PFA mark. `public/pfa-mark.png` is not in the repo yet — until it is,
// this draws a wordmark that holds the same footprint, so nothing in the
// layout shifts when the real asset lands.
export function PfaMark({ size = 34, onDark = true }) {
  const ink = onDark ? "#fff" : OPFA.navy;
  const swoosh = onDark ? "rgba(255,255,255,0.72)" : OPFA.purple;
  return (
    <svg
      width={size * 1.62} height={size} viewBox="0 0 62 38"
      style={{ display: "block", flexShrink: 0 }}
      role="img" aria-label="Office of the Pension Funds Adjudicator"
    >
      <text
        x="0" y="27" fill={ink}
        style={{ fontFamily: "'Segoe UI',system-ui,sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}
      >PFA</text>
      {/* The bracket that closes the mark in the official logo. */}
      <path d="M46 6 C57 12, 57 26, 46 32" stroke={swoosh} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="55" cy="19" r="2.6" fill={OPFA.figures[1]} />
    </svg>
  );
}

// Top-bar brand block. `compact` drops the wordmark on narrow viewports and
// keeps only the mark.
export function OpfaBrand({ compact = false, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, minWidth: 0 }}>
      <PfaMark size={30} />
      {!compact && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, minWidth: 0 }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.2px", whiteSpace: "nowrap" }}>
            {subtitle ? "OPFA " : ""}<span style={{ opacity: 0.85, fontWeight: 600 }}>{subtitle || ORG.name}</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.72)", fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>
            {subtitle ? ORG.short : ORG.unit} · WhatsApp Business Platform
          </span>
        </div>
      )}
    </div>
  );
}

// "Powered by Ezra360" — the platform credit. Small, quiet, always present:
// the bid is for a solution, and this names what is underneath it.
export function PoweredByEzra({ tone = "light", size = 10 }) {
  const dim = tone === "light" ? "rgba(255,255,255,0.6)" : C.faint;
  const lit = tone === "light" ? "rgba(255,255,255,0.92)" : C.brand;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: size, whiteSpace: "nowrap" }}>
      <span style={{ color: dim, fontWeight: 600 }}>Powered by</span>
      <span style={{ color: lit, fontWeight: 700, letterSpacing: "0.2px" }}>Ezra360</span>
    </span>
  );
}
