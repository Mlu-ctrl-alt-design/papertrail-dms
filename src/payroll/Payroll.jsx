// Ezra360 Payroll — payroll administration module.
// Built on the shared Fluent 2 design system (same TopBar / Sidebar / AppShell
// as the DMS and e-PMS prototypes).
import { useEffect, useState } from "react";
import {
  Home20Regular, People20Regular, MoneyCalculator20Regular,
  DocumentTable20Regular, Alert20Regular, Add20Regular,
} from "@fluentui/react-icons";
import {
  GlobalStyles, ToastProvider, AppShellRoot, Sidebar, TopBar, TopBarIconBtn,
  TopProgressBar, AvatarChip, I, C, useMaxWidth, BP,
} from "../components/index.js";
import { PayrollContext, usePayrollStore } from "./state.js";
import { SummaryView } from "./views/Summary.jsx";
import { EmployeesView } from "./views/Employees.jsx";

const NAV = [
  { id: "summary", label: "Payroll Cycles", icon: Home20Regular },
  { id: "employees", label: "Employees", icon: People20Regular },
  { id: "runs", label: "Payment Runs", icon: MoneyCalculator20Regular },
  { id: "reports", label: "Reports", icon: DocumentTable20Regular },
];

const VIEWS = {
  summary: SummaryView,
  employees: EmployeesView,
  runs: SummaryView,
  reports: EmployeesView,
};

function Brand() {
  const compact = useMaxWidth(BP.md);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, minWidth: 0 }}>
      <img src="/logo.svg" alt="Ezra360" style={{ height: 30, filter: "brightness(0) invert(1)", flexShrink: 0 }} />
      {!compact && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.2px" }}>
            Ezra360 <span style={{ opacity: 0.85, fontWeight: 600 }}>Payroll</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.78)", fontSize: 10, fontWeight: 600 }}>
            999 · Demo Company
          </span>
        </div>
      )}
    </div>
  );
}

function ShellInner() {
  const store = usePayrollStore();
  const [active, setActive] = useState("summary");
  const isNarrow = useMaxWidth(BP.lg);
  const [collapsed, setCollapsed] = useState(isNarrow);
  useEffect(() => { setCollapsed(isNarrow); }, [isNarrow]);
  const [navLoading, setNavLoading] = useState(false);
  useEffect(() => {
    setNavLoading(true);
    const t = setTimeout(() => setNavLoading(false), 600);
    return () => clearTimeout(t);
  }, [active]);

  const navItems = NAV.map((n) => ({
    ...n,
    icon: <I as={n.icon} size={18} />,
    badge: n.id === "employees" ? store.failed || undefined : undefined,
  }));

  const ActiveView = VIEWS[active] || SummaryView;

  const sidebarFooter = ({ collapsed }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <AvatarChip initials="TM" color={C.brand} size={26} />
      {!collapsed && (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Thapedi Matjila</div>
          <div style={{ fontSize: 10, color: C.faint }}>Payroll Administrator</div>
        </div>
      )}
    </div>
  );

  return (
    <PayrollContext.Provider value={store}>
      <AppShellRoot>
        <TopBar
          brand={<Brand />}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onCmdPalette={() => {}}
          searchPlaceholder="Search employees, pay runs, payslips…"
          right={
            <>
              <button style={{
                background: C.brandDark, border: "none", borderRadius: 4, padding: "8px 12px",
                cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit",
              }}>
                <I as={Add20Regular} size={14} /> Quick add
              </button>
              <TopBarIconBtn title="Notifications" badge={1}>
                <I as={Alert20Regular} size={16} />
              </TopBarIconBtn>
              <div style={{ borderRadius: "50%", border: "2px solid rgba(255,255,255,0.85)", display: "inline-flex" }}>
                <AvatarChip initials="TM" color={C.brandDark} size={30} />
              </div>
            </>
          }
        />
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          <Sidebar navItems={navItems} active={active} setActive={setActive} collapsed={collapsed} footer={sidebarFooter} />
          <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", minWidth: 0 }}>
            <TopProgressBar active={navLoading} />
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <ActiveView setActive={setActive} />
            </div>
          </main>
        </div>
      </AppShellRoot>
    </PayrollContext.Provider>
  );
}

export default function PayrollApp() {
  return (
    <>
      <GlobalStyles />
      <ToastProvider>
        <ShellInner />
      </ToastProvider>
    </>
  );
}
