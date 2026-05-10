// Top-level switcher between the two products that share the design system:
//   - Ezra360 DMS (default — current production prototype)
//   - Ezra mSCOA  (new municipal performance management prototype)
//
// Switching is hash-based for simplicity:
//   #/dms   → DMS   (default)
//   #/epms  → mSCOA
//
// A small floating switcher renders bottom-left so the two prototypes are
// reachable without remembering URLs.

import { useEffect, useState } from "react";
import DMS from "./PaperTrailDMS.jsx";
import EPMS from "./epms/ePMS.jsx";

function readApp() {
  const h = (typeof window !== "undefined" ? window.location.hash : "") || "";
  if (h.includes("epms")) return "epms";
  return "dms";
}

function AppSwitcher({ app, onSwitch }) {
  return (
    <div style={{
      position: "fixed", bottom: 16, left: 16, zIndex: 9000,
      background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
      border: "1px solid rgba(0,0,0,0.1)", borderRadius: 100,
      padding: 4, display: "flex", gap: 2, fontFamily: "'Segoe UI',system-ui,sans-serif",
      boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
    }}>
      {[
        { id: "dms",  label: "DMS"   },
        { id: "epms", label: "mSCOA" },
      ].map((a) => (
        <button key={a.id} onClick={() => onSwitch(a.id)} style={{
          background: app === a.id ? "#219CD6" : "transparent",
          color: app === a.id ? "#fff" : "#605e5c",
          border: "none", borderRadius: 100,
          padding: "6px 14px", fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          transition: "background 0.15s",
        }}>{a.label}</button>
      ))}
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

  const switchTo = (id) => {
    window.location.hash = `#/${id}`;
    setApp(id);
  };

  return (
    <>
      {app === "epms" ? <EPMS/> : <DMS/>}
      <AppSwitcher app={app} onSwitch={switchTo}/>
    </>
  );
}
