// Top-level switcher between the two products that share the design system:
//   - Ezra360 DMS (default — current production prototype)
//   - Ezra mSCOA  (new municipal performance management prototype)
//
// Switching is hash-based for simplicity:
//   #/dms     → DMS   (default)
//   #/epms    → mSCOA
//   #/payroll → Payroll
//   #/connect → Connect (WhatsApp internal comms)
//   #/wa      → OPFA WhatsApp complainant simulator
//   #/opfa    → Ezra OPFA Console (the same store, the agent's side)
//   #/finance → Ezra360 Financials (accounting engine demo)
//
// A small floating switcher renders bottom-left so the prototypes are reachable
// without remembering URLs. It collapses to a single button — it is scaffolding
// for us, not part of any of the products, and in a demo it should be able to
// get out of the way. The open/closed choice is remembered between reloads.

import { useEffect, useState } from "react";
import DMS from "./PaperTrailDMS.jsx";
import EPMS from "./epms/ePMS.jsx";
import PAYROLL from "./payroll/Payroll.jsx";
import CONNECT from "./comms/Connect.jsx";
import WA from "./opfa/WhatsApp.jsx";
import OPFA from "./opfa/Console.jsx";
import FINANCE from "./finance/Finance.jsx";

// Exact-segment match rather than a substring chain: with seven apps the chain
// starts colliding, and when it does it fails silently by falling through to
// the DMS.
function readApp() {
  const h = (typeof window !== "undefined" ? window.location.hash : "") || "";
  const id = h.replace(/^#\/?/, "").split(/[/?#]/)[0].toLowerCase();
  return APPS.some((a) => a.id === id) ? id : "dms";
}

const APPS = [
  { id: "dms", label: "DMS", title: "Ezra360 DMS" },
  { id: "epms", label: "mSCOA", title: "Ezra mSCOA" },
  { id: "payroll", label: "Payroll", title: "Ezra360 Payroll" },
  { id: "connect", label: "Connect", title: "Xiquel Employee Comms" },
  { id: "wa", label: "WhatsApp", title: "OPFA WhatsApp — Complainant" },
  { id: "opfa", label: "OPFA", title: "Ezra OPFA Console" },
  { id: "finance", label: "Finance", title: "Ezra360 Financials" },
];

// Seven ternary arms on one line stopped reading a while ago.
const SCREENS = { dms: DMS, epms: EPMS, payroll: PAYROLL, connect: CONNECT, wa: WA, opfa: OPFA, finance: FINANCE };

const STORE_KEY = "ezra360.switcher.open";

const BRAND = "#219CD6";
const SHELL = {
  background: "rgba(255,255,255,0.9)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(0,0,0,0.1)",
  borderRadius: 100,
  boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
  fontFamily: "'Segoe UI',system-ui,sans-serif",
};

// Grid glyph for the collapsed state — drawn inline so this file stays free of
// icon dependencies.
function AppsGlyph({ size = 15, color = BRAND }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden="true" style={{ display: "block" }}>
      <rect x="1" y="1" width="5.5" height="5.5" rx="1.4" />
      <rect x="9.5" y="1" width="5.5" height="5.5" rx="1.4" />
      <rect x="1" y="9.5" width="5.5" height="5.5" rx="1.4" />
      <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1.4" />
    </svg>
  );
}

// Points left: the row collapses back toward its anchor in the corner.
function Chevron({ size = 12, color = "#605e5c" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ display: "block" }}>
      <path d="M8 2.5 4.5 6 8 9.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AppSwitcher({ app, onSwitch }) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORE_KEY) === "open";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORE_KEY, open ? "open" : "closed");
    }
  }, [open]);

  // Escape closes it, so it can be dismissed without aiming at a small target.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const active = APPS.find((a) => a.id === app) || APPS[0];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title={`Prototype switcher — currently ${active.label}`}
        aria-label={`Open prototype switcher. Currently ${active.label}`}
        // Icon only: the app's own top bar already names the prototype, and a
        // smaller footprint keeps this off the sidebar's user footer.
        style={{
          ...SHELL,
          position: "fixed", bottom: 16, left: 16, zIndex: 9000,
          width: 34, height: 34, padding: 0, cursor: "pointer",
          display: "grid", placeItems: "center",
        }}
      >
        <AppsGlyph />
      </button>
    );
  }

  return (
    <div className="scale-in" style={{
      ...SHELL,
      position: "fixed", bottom: 16, left: 16, zIndex: 9000,
      padding: 4, display: "flex", alignItems: "center", gap: 2,
    }}>
      {APPS.map((a) => (
        <button key={a.id} onClick={() => onSwitch(a.id)} style={{
          background: app === a.id ? BRAND : "transparent",
          color: app === a.id ? "#fff" : "#605e5c",
          border: "none", borderRadius: 100,
          padding: "6px 14px", fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          transition: "background 0.15s",
        }}>{a.label}</button>
      ))}
      <button
        onClick={() => setOpen(false)}
        title="Collapse switcher (Esc)"
        aria-label="Collapse prototype switcher"
        style={{
          background: "transparent", border: "none", cursor: "pointer",
          borderRadius: "50%", width: 26, height: 26, marginLeft: 2,
          display: "grid", placeItems: "center", flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Chevron />
      </button>
    </div>
  );
}

export default function AppRouter() {
  const [app, setApp] = useState(readApp);

  useEffect(() => {
    const onHash = () => setApp(readApp());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // The prototypes share one bundle and therefore one index.html, so the tab
  // title is set per app rather than baked into the document head.
  useEffect(() => {
    const entry = APPS.find((a) => a.id === app);
    if (entry) document.title = entry.title;
  }, [app]);

  const switchTo = (id) => {
    window.location.hash = `#/${id}`;
    setApp(id);
  };

  const Screen = SCREENS[app] || DMS;

  return (
    <>
      <Screen/>
      <AppSwitcher app={app} onSwitch={switchTo}/>
    </>
  );
}
