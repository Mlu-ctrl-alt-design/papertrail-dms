// Employee Connect — internal communications for the North West Provincial
// Government. Composes on the same shared Fluent 2 shell as the DMS, mSCOA
// and Payroll prototypes.
import { useEffect, useState } from "react";
import {
  Home20Regular, Send20Regular, People20Regular, History20Regular,
  Alert20Regular, Add20Regular,
} from "@fluentui/react-icons";
import {
  GlobalStyles, ToastProvider, AppShellRoot, Sidebar, TopBar, TopBarIconBtn,
  TopProgressBar, AvatarChip, I, C, useMaxWidth, BP,
} from "../components/index.js";
import { CommsContext, useCommsStore } from "./state.js";
import { ORG } from "./data.js";
import { DashboardView } from "./views/Dashboard.jsx";
import { BroadcastView } from "./views/Broadcast.jsx";
import { HistoryView } from "./views/History.jsx";
import { AudiencesView } from "./views/Audiences.jsx";

// Connect runs a black top bar rather than the Ezra blue the other prototypes
// use: this is provincial government chrome, and the neutral bar lets the
// channel colours (WhatsApp green, SMS blue) do the signalling.
const BAR = "#101114";
const BAR_EDGE = "#000";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: Home20Regular },
  { id: "broadcast", label: "New Broadcast", icon: Send20Regular },
  { id: "history", label: "Broadcasts", icon: History20Regular },
  { id: "audiences", label: "Audiences", icon: People20Regular },
];

const VIEWS = {
  dashboard: DashboardView,
  broadcast: BroadcastView,
  history: HistoryView,
  audiences: AudiencesView,
};

function Brand() {
  const compact = useMaxWidth(BP.md);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, minWidth: 0 }}>
      {/* The mark ships white on transparent, so it needs no filter on the
          black bar — and no white plate behind it either. */}
      <img src="/xiquel-mark.png" alt="Xiquel Group" style={{ height: 32, flexShrink: 0 }} />
      {!compact && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.2px" }}>
            Employee <span style={{ opacity: 0.85, fontWeight: 600 }}>Connect</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.78)", fontSize: 10, fontWeight: 600 }}>
            {ORG.name} · {ORG.unit}
          </span>
        </div>
      )}
    </div>
  );
}

function ShellInner() {
  const store = useCommsStore();
  const [active, setActive] = useState("dashboard");
  const isNarrow = useMaxWidth(BP.lg);
  const [collapsed, setCollapsed] = useState(isNarrow);
  useEffect(() => { setCollapsed(isNarrow); }, [isNarrow]);

  const [navLoading, setNavLoading] = useState(false);
  useEffect(() => {
    setNavLoading(true);
    const t = setTimeout(() => setNavLoading(false), 450);
    return () => clearTimeout(t);
  }, [active]);

  const navItems = NAV.map((n) => ({ ...n, icon: <I as={n.icon} size={18} /> }));
  const ActiveView = VIEWS[active] || DashboardView;

  const sidebarFooter = ({ collapsed }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <AvatarChip initials="MM" color={C.brand} size={26} />
      {!collapsed && (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Mlu Manda</div>
          <div style={{ fontSize: 10, color: C.faint }}>Director: Communications</div>
        </div>
      )}
    </div>
  );

  return (
    <CommsContext.Provider value={store}>
      {/* Neutral page wash: the default gradient is tinted towards the blue
          bar the other prototypes use, which reads slightly cold under black. */}
      <AppShellRoot background="linear-gradient(150deg,#f2f2f1 0%,#f6f6f5 45%,#faf9f8 100%)">
        <TopBar
          accent={BAR}
          accentDark={BAR_EDGE}
          brand={<Brand />}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onCmdPalette={() => {}}
          searchPlaceholder="Search employees, audiences, broadcasts…"
          right={
            <>
              {/* Files a completed broadcast into history first — starting a new
                  one should never quietly discard the last result. */}
              <button
                onClick={() => { store.archiveAndReset(); setActive("broadcast"); }}
                style={{
                  background: "#fff", border: "none", borderRadius: 4, padding: "8px 12px",
                  cursor: "pointer", color: BAR, fontSize: 13, fontWeight: 600,
                  display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e8e8e8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                <I as={Add20Regular} size={14} /> New broadcast
              </button>
              <TopBarIconBtn title="Notifications" badge={2} accent={BAR}>
                <I as={Alert20Regular} size={16} />
              </TopBarIconBtn>
              <div style={{ borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", display: "inline-flex" }}>
                <AvatarChip initials="MM" color={C.brand} size={30} />
              </div>
            </>
          }
        />
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          <Sidebar navItems={navItems} active={active} setActive={setActive} collapsed={collapsed} footer={sidebarFooter} />
          <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", minWidth: 0 }}>
            <TopProgressBar active={navLoading} />
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
              <ActiveView setActive={setActive} />
            </div>
          </main>
        </div>
      </AppShellRoot>
    </CommsContext.Provider>
  );
}

export default function ConnectApp() {
  return (
    <>
      <GlobalStyles />
      <ToastProvider>
        <ShellInner />
      </ToastProvider>
    </>
  );
}
