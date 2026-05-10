// Ezra mSCOA — municipal Standard Chart of Accounts performance platform.
// Pilot: Ba-Phalaborwa Local Municipality (LIM334).
// Built on the same Fluent 2 design system as the Ezra360 DMS.

import { useContext, useEffect, useRef, useState } from "react";
import {
  Home20Regular, Flag20Regular, DataHistogram20Regular,
  ContactCard20Regular, ShieldLock20Regular, Document20Regular,
  ChevronDown20Regular, Add20Regular, Alert20Regular,
  Calendar20Regular, ArrowSwap20Regular, Checkmark20Regular,
} from "@fluentui/react-icons";
import {
  GlobalStyles, ToastProvider, Sidebar, TopBar, TopBarIconBtn, AppShellRoot,
  TopProgressBar, AvatarChip,
  I, C,
} from "../components/index.js";
import { EPMSContext } from "./state.js";
import { useEPMSStore } from "./state.js";
import { MUNICIPALITY, DEMO_PERSONAS } from "./data.js";
import { daysFrom } from "./helpers.js";

import { DashboardView } from "./views/Dashboard.jsx";
import { IDPView } from "./views/IDP.jsx";
import { SDBIPView } from "./views/SDBIP.jsx";
import { IPMSView } from "./views/IPMS.jsx";
import { POEView } from "./views/POE.jsx";
import { AuditView } from "./views/Audit.jsx";

const NAV = [
  { id: "dashboard", label: "Dashboard",        icon: Home20Regular },
  { id: "idp",       label: "IDP & Risk",        icon: Flag20Regular },
  { id: "sdbip",     label: "SDBIP & mSCOA",     icon: DataHistogram20Regular },
  { id: "ipms",      label: "IPMS",              icon: ContactCard20Regular },
  { id: "poe",       label: "POE Vault",         icon: Document20Regular },
  { id: "audit",     label: "Audit & Compliance",icon: ShieldLock20Regular },
];

const VIEWS = {
  dashboard: DashboardView,
  idp:       IDPView,
  sdbip:     SDBIPView,
  ipms:      IPMSView,
  poe:       POEView,
  audit:     AuditView,
};

function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
      <img src="/logo.svg" alt="Ezra mSCOA"
           style={{ height: 32, filter: "brightness(0) invert(1)", flexShrink: 0 }}/>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.2px" }}>
          Ezra <span style={{ opacity: 0.85, fontWeight: 600 }}>mSCOA</span>
        </span>
        <span style={{ color: "rgba(255,255,255,0.78)", fontSize: 10, fontWeight: 600 }}>
          {MUNICIPALITY.code} · {MUNICIPALITY.name}
        </span>
      </div>
    </div>
  );
}

// Persona switcher — top-right of the TopBar. Switches which user is "logged
// in," driving sidebar nav (row-level access), the dashboard greeting, and
// the active IPMS scorecard. The six demo personae match the demo script.
function PersonaSwitcher({ setActive }) {
  const { state, dispatch } = useContext(EPMSContext);
  const me = state.currentUser;
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const switchTo = (u) => {
    dispatch({ type: "SWITCH_PERSONA", user: u });
    setActive(u.nav.includes("dashboard") ? "dashboard" : u.nav[0]);
    setOpen(false);
  };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} title="Switch persona (demo)" style={{
        background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)",
        borderRadius: 100, padding: "4px 10px 4px 4px",
        cursor: "pointer", color: "#fff",
        display: "inline-flex", alignItems: "center", gap: 8,
        fontFamily: "inherit", whiteSpace: "nowrap",
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%", background: me.color,
          color: "#fff", display: "grid", placeItems: "center",
          fontSize: 12, fontWeight: 700, border: "2px solid #fff",
        }}>{me.initials}</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start",
                      lineHeight: 1.1, padding: "2px 0" }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{me.initials} · {me.name.split(" ").slice(-1)[0]}</span>
          <span style={{ fontSize: 9, opacity: 0.82, fontWeight: 600 }}>{me.role}</span>
        </div>
        <I as={ChevronDown20Regular} size={14}
           style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}/>
      </button>
      {open && (
        <div className="scale-in" style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)", width: 320,
          background: "#fff", border: `1px solid ${C.hairline}`,
          borderRadius: 4, boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          zIndex: 1000, padding: 6,
        }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.surfaceMute}`, marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.ink,
                          display: "inline-flex", alignItems: "center", gap: 6 }}>
              <I as={ArrowSwap20Regular} size={13} color={C.brand}/>
              Demo persona switcher
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              Each persona has different sidebar access (row-level RBAC).
            </div>
          </div>
          {DEMO_PERSONAS.map((u) => {
            const sel = u.id === me.id;
            return (
              <div key={u.id} onClick={() => switchTo(u)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", cursor: "pointer", borderRadius: 4,
                background: sel ? C.brandTint : "transparent",
              }}
              onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = C.surfaceMute; }}
              onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}>
                <AvatarChip initials={u.initials} color={u.color} size={32}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: sel ? C.brand : C.ink }}>
                    {u.initials} · {u.name}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{u.role}</div>
                </div>
                {sel && <I as={Checkmark20Regular} size={14} color={C.brand}/>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotificationsBell() {
  const { state } = useContext(EPMSContext);
  const upcoming = state.complianceDeadlines.filter((d) => {
    const days = daysFrom(d.deadline);
    return days >= 0 && days <= 30;
  }).length;
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <TopBarIconBtn onClick={() => setOpen((v) => !v)} title="Notifications" badge={upcoming || undefined}>
        <I as={Alert20Regular} size={16}/>
      </TopBarIconBtn>
      {open && (
        <div className="scale-in" style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: 320, background: "#fff", border: `1px solid ${C.hairline}`,
          borderRadius: 4, boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          zIndex: 1000, padding: 6,
        }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.surfaceMute}`, marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Upcoming statutory deadlines</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{upcoming} due within 30 days</div>
          </div>
          {state.complianceDeadlines
            .map((d) => ({ ...d, days: daysFrom(d.deadline) }))
            .filter((d) => d.days >= -7 && d.days <= 30)
            .sort((a, b) => a.days - b.days)
            .slice(0, 6)
            .map((d) => {
              const past = d.days < 0;
              const urgent = d.days <= 7;
              const colour = past ? C.danger : urgent ? "#7a5700" : "#1D4FD7";
              return (
                <div key={d.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "9px 12px", borderRadius: 4, cursor: "default",
                }}>
                  <div style={{ color: colour, marginTop: 2 }}>
                    <I as={Calendar20Regular} size={14}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, lineHeight: 1.35 }}>
                      {d.title}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                      {d.legalRef} · <span style={{ color: colour, fontWeight: 600 }}>
                        {past ? `${Math.abs(d.days)}d overdue` : `T-${d.days}d`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function QuickAdd({ setActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const items = [
    { label: "Capture mSCOA journal", sub: "7-segment classification at point of entry",
      icon: DataHistogram20Regular, action: () => setActive("sdbip") },
    { label: "Upload POE",            sub: "SHA-256 hashed · immutable", icon: Document20Regular, action: () => setActive("poe") },
    { label: "New Section 56 PA",     sub: "Digital signature · ECTA-compliant", icon: ContactCard20Regular, action: () => setActive("ipms") },
    { label: "Log strategic risk",    sub: "Linked to IDP objective", icon: ShieldLock20Regular, action: () => setActive("idp") },
  ];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={{
        background: C.brandDark, border: "none", borderRadius: 4,
        padding: "8px 14px", cursor: "pointer", color: "#fff",
        fontSize: 13, fontWeight: 600,
        display: "inline-flex", alignItems: "center", gap: 6,
        fontFamily: "inherit", whiteSpace: "nowrap",
      }}>
        <I as={Add20Regular} size={14}/> Quick add{" "}
        <I as={ChevronDown20Regular} size={14}
           style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}/>
      </button>
      {open && (
        <div className="scale-in" style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)", width: 320,
          background: "#fff", border: `1px solid ${C.hairline}`,
          borderRadius: 4, boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          zIndex: 1000, padding: 6,
        }}>
          {items.map((q) => (
            <div key={q.label} onClick={() => { q.action(); setOpen(false); }} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "9px 12px", cursor: "pointer", borderRadius: 4, color: C.ink,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceMute)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <span style={{ display: "inline-flex", color: C.brand, marginTop: 1 }}><I as={q.icon} size={16}/></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{q.label}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{q.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShellChrome({ setActive, setCollapsed, setShowCmd }) {
  const { state } = useContext(EPMSContext);
  const me = state.currentUser;
  const canQuickAdd = !me.readOnly;
  return (
    <TopBar
      brand={<Brand/>}
      onToggleSidebar={() => setCollapsed((c) => !c)}
      onCmdPalette={() => setShowCmd((v) => !v)}
      searchPlaceholder="Search objectives, SDBIP targets, KPIs, evidence…"
      right={
        <>
          {canQuickAdd && <QuickAdd setActive={setActive}/>}
          <NotificationsBell/>
          <PersonaSwitcher setActive={setActive}/>
        </>
      }
    />
  );
}

function CommandPalette({ onClose, setActive }) {
  const items = NAV.map((n) => ({ id: n.id, label: `Go to ${n.label}`, icon: n.icon, action: () => setActive(n.id) }));
  const [q, setQ] = useState("");
  const filtered = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      backdropFilter: "blur(4px)", zIndex: 8000, display: "grid",
      placeItems: "start center", paddingTop: 96,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="scale-in" style={{
        width: 540, maxWidth: "90vw", background: "#fff",
        border: `1px solid ${C.hairline}`, borderRadius: 4,
        boxShadow: "0 32px 80px rgba(0,0,0,0.25)", overflow: "hidden",
      }}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
               placeholder="Jump to a module or action…"
               style={{
                 width: "100%", padding: "14px 18px", border: "none",
                 borderBottom: `1px solid ${C.surfaceMute}`,
                 fontSize: 14, fontFamily: "inherit",
               }}/>
        <div style={{ maxHeight: 400, overflow: "auto", padding: 6 }}>
          {filtered.map((i) => (
            <div key={i.id} onClick={() => { i.action(); onClose(); }} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", cursor: "pointer", borderRadius: 4,
              fontSize: 13, color: C.text,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceMute)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <I as={i.icon} size={16} color={C.brand}/>{i.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NavBadges(state) {
  const upcoming = state.complianceDeadlines.filter((d) => {
    const days = daysFrom(d.deadline);
    return days >= 0 && days <= 7;
  }).length;
  const unsignedPAs = state.performanceAgreements.filter((p) => !p.signed).length;
  const unverifiedPOE = state.poeDocuments.filter((p) => !p.verified).length;
  return { audit: upcoming, ipms: unsignedPAs, poe: unverifiedPOE };
}

function ComplianceStatusFooter({ collapsed }) {
  // Visible to MM, CFO, Auditor — operational personae shouldn't see this.
  // Three statutory checks from the demo script.
  if (collapsed) {
    return (
      <div title="Compliance: 2 attention items" style={{
        width: 20, height: 20, borderRadius: 100,
        background: "#fff4ce", color: "#7a5700",
        display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700,
        border: "1px solid #fde299", margin: "0 auto",
      }}>2</div>
    );
  }
  const items = [
    { label: "MFMA Circular 13",    status: "Compliant",   color: C.success },
    { label: "mSCOA v6.6",          status: "Active",       color: C.success },
    { label: "Staff Regulations 2021", status: "2 reviews due", color: "#7a5700" },
  ];
  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 4,
      padding: "8px 10px", marginBottom: 8,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
        Compliance status
      </div>
      {items.map((x) => (
        <div key={x.label} style={{ display: "flex", justifyContent: "space-between",
                                    alignItems: "center", marginBottom: 3, fontSize: 10 }}>
          <span style={{ color: C.text }}>{x.label}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: x.color, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: x.color, display: "inline-block" }}/>
            {x.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function ShellInner() {
  const [storeState, dispatch] = useEPMSStore();
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [navLoading, setNavLoading] = useState(false);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCmd((v) => !v);
      }
      if (e.key === "Escape") setShowCmd(false);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    setNavLoading(true);
    const t = setTimeout(() => setNavLoading(false), 800);
    return () => clearTimeout(t);
  }, [active]);

  // Row-level access: filter the global nav by the current persona's allowlist.
  const me = storeState.currentUser;
  const allowed = new Set(me.nav || NAV.map((n) => n.id));
  const badges = NavBadges(storeState);
  const navItems = NAV
    .filter((n) => allowed.has(n.id))
    .map((n) => ({
      ...n,
      icon: <I as={n.icon} size={18}/>,
      badge: { audit: badges.audit, ipms: badges.ipms, poe: badges.poe }[n.id] || 0,
    }));

  const ActiveView = (allowed.has(active) ? VIEWS[active] : VIEWS.dashboard) || DashboardView;

  // Compliance status hidden for clerk and revenue manager (operational
  // personae); shown for Mayor / MM / CFO / Auditor.
  const showCompliance = !["u_clerk", "u_revmgr"].includes(me.id);

  const sidebarFooter = ({ collapsed }) => (
    <div>
      {showCompliance && <ComplianceStatusFooter collapsed={collapsed}/>}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AvatarChip initials={me.initials} color={me.color} size={26}/>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me.name}</div>
            <div style={{ fontSize: 10, color: C.faint }}>{me.role}</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <EPMSContext.Provider value={{ state: storeState, dispatch }}>
      <AppShellRoot>
        <ShellChrome setActive={setActive} setCollapsed={setCollapsed} setShowCmd={setShowCmd}/>
        <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative", minHeight: 0 }}>
          <Sidebar navItems={navItems} active={active} setActive={setActive}
                   collapsed={collapsed} footer={sidebarFooter}/>
          <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column",
                         position: "relative", minWidth: 0 }}>
            <TopProgressBar active={navLoading}/>
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <ActiveView setActive={setActive}/>
            </div>
          </main>
        </div>
      </AppShellRoot>
      {showCmd && <CommandPalette onClose={() => setShowCmd(false)} setActive={(v) => { setActive(v); setShowCmd(false); }}/>}
    </EPMSContext.Provider>
  );
}

export default function EPMSApp() {
  return (
    <>
      <GlobalStyles/>
      <ToastProvider>
        <ShellInner/>
      </ToastProvider>
    </>
  );
}
