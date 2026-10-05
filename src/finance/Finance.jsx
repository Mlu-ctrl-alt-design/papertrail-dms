// Ezra360 Financials — the accounting module.
//
// Five things the client asked to see, as one story on one set of books: fixed
// assets with automatic depreciation, deferred expenses with automatic
// amortisation, a dollar invoice settled in shillings, consolidated statements
// with eliminations, and a drill from any figure to the document behind it.
//
// Built on the shared Fluent 2 design system, same shell as the other Ezra360
// prototypes. All the accounting is in engine/; the views only arrange it.

import { useEffect, useMemo, useState } from "react";
import {
  Alert20Regular, ArrowReset20Regular, Box20Regular, CalendarClock20Regular,
  Database20Regular, DocumentBulletList20Regular, DocumentTable20Regular,
  Flow20Regular, Home20Regular, LockClosed20Regular, Receipt20Regular,
  Scales20Regular,
} from "@fluentui/react-icons";
import {
  AppShellRoot, AvatarChip, BP, Btn, C, GlobalStyles, I, Modal, Sidebar,
  ToastProvider, TopBar, TopBarIconBtn, TopProgressBar, useMaxWidth,
} from "../components/index.js";
import { FinanceContext, useFinanceStore } from "./state.js";
import { GROUP_NAME, monthEnd, monthLabel, prettyDate } from "./config.js";
import { ScopeSelect } from "./ui.jsx";
import { HomeView } from "./views/Home.jsx";
import { AssetsView } from "./views/Assets.jsx";
import { DeferralsView } from "./views/Deferrals.jsx";
import { PayablesView } from "./views/Payables.jsx";
import { JournalsView } from "./views/Journals.jsx";
import { PeriodCloseView } from "./views/PeriodClose.jsx";
import { ReportsView } from "./views/Reports.jsx";
import { GeneralLedgerView } from "./views/GeneralLedger.jsx";
import { ChartOfAccountsView } from "./views/ChartOfAccounts.jsx";
import { LedgerMappingView } from "./views/LedgerMapping.jsx";

// Grouped the way an accounting menu is grouped: the subledgers that raise
// transactions, the ledger they land in, the reporting on top, and the
// configuration underneath all of it.
const NAV = [
  { id: "home", label: "Home", icon: Home20Regular },
  { section: "Transactions" },
  { id: "assets", label: "Fixed Assets", icon: Box20Regular },
  { id: "deferrals", label: "Deferred Expenses", icon: CalendarClock20Regular },
  { id: "payables", label: "Payables", icon: Receipt20Regular },
  { section: "General ledger" },
  { id: "ledger", label: "General Ledger", icon: Scales20Regular },
  { id: "journals", label: "Journals", icon: DocumentBulletList20Regular },
  { id: "period-close", label: "Period Close", icon: LockClosed20Regular },
  { section: "Reporting" },
  { id: "reports", label: "Reports", icon: DocumentTable20Regular },
  { section: "Setup" },
  { id: "accounts", label: "Chart of Accounts", icon: Database20Regular },
  { id: "mapping", label: "Ledger Mapping", icon: Flow20Regular },
];

const VIEWS = {
  home: HomeView,
  assets: AssetsView,
  deferrals: DeferralsView,
  payables: PayablesView,
  ledger: GeneralLedgerView,
  journals: JournalsView,
  "period-close": PeriodCloseView,
  reports: ReportsView,
  accounts: ChartOfAccountsView,
  mapping: LedgerMappingView,
};

function Brand() {
  const compact = useMaxWidth(BP.md);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, minWidth: 0 }}>
      <img src="/logo.svg" alt="Ezra360" style={{ height: 30, filter: "brightness(0) invert(1)", flexShrink: 0 }} />
      {!compact && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.2px" }}>
            Ezra360 <span style={{ opacity: 0.85, fontWeight: 600 }}>Financials</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.78)", fontSize: 10, fontWeight: 600 }}>
            {GROUP_NAME} · consolidated
          </span>
        </div>
      )}
    </div>
  );
}

// The strip under the top bar: the scope every list and statement is read
// through, and where the books currently stand. Both are always on screen —
// a figure without a scope and a period is not a figure.
function ContextBar({ store, onReset }) {
  const compact = useMaxWidth(BP.lg);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
      padding: "8px 20px", background: "#fff", borderBottom: `1px solid ${C.hairline}`, flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>
          Scope
        </span>
        <ScopeSelect scope={store.scope} onChange={store.setScope} />
      </div>
      <div style={{ width: 1, height: 22, background: C.hairline }} />
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>
          Open period
        </span>
        <span style={{
          fontSize: 12, fontWeight: 700, color: C.brand, background: C.brandTint,
          borderRadius: 100, padding: "3px 11px",
        }}>{monthLabel(store.openPeriod)}</span>
      </div>
      {!compact && (
        <span style={{ fontSize: 11.5, color: C.faint }}>
          Books closed to {prettyDate(monthEnd(store.closedThrough))}
        </span>
      )}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <Btn variant="secondary" size="sm" onClick={onReset}>
          <I as={ArrowReset20Regular} size={13} /> Reset demo data
        </Btn>
      </div>
    </div>
  );
}

function ShellInner() {
  const store = useFinanceStore();
  // The sidebar follows the viewport until someone overrides it, rather than
  // being mirrored into state by an effect.
  const isNarrow = useMaxWidth(BP.lg);
  const [collapseOverride, setCollapseOverride] = useState(null);
  const collapsed = collapseOverride ?? isNarrow;

  const [confirmReset, setConfirmReset] = useState(false);

  // The nav flash is started while rendering the new section and cleared from a
  // timeout, so no state is set synchronously inside an effect.
  const { section } = store.route;
  const [flashedSection, setFlashedSection] = useState(section);
  const [navLoading, setNavLoading] = useState(false);
  if (flashedSection !== section) {
    setFlashedSection(section);
    setNavLoading(true);
  }
  useEffect(() => {
    if (!navLoading) return undefined;
    const t = setTimeout(() => setNavLoading(false), 380);
    return () => clearTimeout(t);
  }, [navLoading]);

  const navItems = useMemo(
    () => NAV.map((n) => (n.section ? n : { ...n, icon: <I as={n.icon} size={18} /> })),
    [],
  );

  const ActiveView = VIEWS[section] || HomeView;

  const sidebarFooter = ({ collapsed: c }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <AvatarChip initials="VS" color={C.brand} size={26} />
      {!c && (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Group Finance
          </div>
          <div style={{ fontSize: 10, color: C.faint }}>Financial Controller</div>
        </div>
      )}
    </div>
  );

  return (
    <FinanceContext.Provider value={store}>
      <AppShellRoot>
        <TopBar
          brand={<Brand />}
          onToggleSidebar={() => setCollapseOverride(!collapsed)}
          onCmdPalette={() => {}}
          searchPlaceholder="Search assets, invoices, journals, accounts…"
          right={
            <>
              <TopBarIconBtn title="Notifications" badge={store.activity.length || undefined}>
                <I as={Alert20Regular} size={16} />
              </TopBarIconBtn>
              <div style={{ borderRadius: "50%", border: "2px solid rgba(255,255,255,0.85)", display: "inline-flex" }}>
                <AvatarChip initials="GF" color={C.brandDark} size={30} />
              </div>
            </>
          }
        />
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          <Sidebar
            navItems={navItems}
            active={section}
            setActive={(id) => store.go(id === "home" ? "" : id)}
            collapsed={collapsed}
            footer={sidebarFooter}
          />
          <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", minWidth: 0 }}>
            <TopProgressBar active={navLoading} />
            <ContextBar store={store} onReset={() => setConfirmReset(true)} />
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
              <ActiveView />
            </div>
          </main>
        </div>
        {confirmReset && (
          <Modal
            title="Reset demo data"
            onClose={() => setConfirmReset(false)}
            width={440}
            footer={
              <>
                <Btn variant="secondary" onClick={() => setConfirmReset(false)}>Cancel</Btn>
                <Btn variant="danger" onClick={() => { store.reset(); setConfirmReset(false); }}>
                  Reset to 30 September
                </Btn>
              </>
            }
          >
            <div style={{ padding: 20, fontSize: 13, color: C.text, lineHeight: 1.65 }}>
              Everything captured in this session is discarded and the books go back to the
              opening state: closed to 30 September 2026, October open, the Hiace at a net book
              value of UGX 153,000,000 and the medical insurance prepayment at UGX 30,000,000.
              <div style={{ marginTop: 10, color: C.muted, fontSize: 12 }}>
                The seed is deterministic, so the figures come back identical and the demo can be
                walked again from the top.
              </div>
            </div>
          </Modal>
        )}
      </AppShellRoot>
    </FinanceContext.Provider>
  );
}

export default function FinanceApp() {
  return (
    <>
      <GlobalStyles />
      <ToastProvider>
        <ShellInner />
      </ToastProvider>
    </>
  );
}
