// Ezra OPFA Console — the agent and administrator half of the WhatsApp
// Business solution. Runs at #/opfa, alongside the complainant simulator at
// #/wa; both read and write the same store, so the demo can run them side by
// side in two tabs.
import { useEffect, useMemo, useState } from "react";
import {
  Home20Regular, Chat20Regular, Folder20Regular, DocumentBulletList20Regular,
  DataBarVertical20Regular, ShieldCheckmark20Regular, History20Regular,
  PlugConnected20Regular, Alert20Regular, ArrowClockwise20Regular,
} from "@fluentui/react-icons";
import {
  GlobalStyles, ToastProvider, AppShellRoot, Sidebar, TopBar, TopBarIconBtn,
  TopProgressBar, AvatarChip, Modal, Btn, FluentSelect, I, C,
  useMaxWidth, BP,
} from "../components/index.js";
import { OPFA, OpfaBrand, PoweredByEzra } from "./brand.jsx";
import { ROLES, AGENTS } from "./data.js";
import { useOpfa, navAllowed, signIn, resetDemo, now } from "./store.js";
import { countdown } from "./helpers.js";

import { DashboardView } from "./views/Dashboard.jsx";
import { InboxView } from "./views/Inbox.jsx";
import { CasesView } from "./views/Cases.jsx";
import { TemplatesView } from "./views/Templates.jsx";
import { ReportsView } from "./views/Reports.jsx";
import { ConsentView } from "./views/Consent.jsx";
import { AuditView } from "./views/Audit.jsx";
import { IntegrationsView } from "./views/Integrations.jsx";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: Home20Regular },
  { id: "inbox", label: "Inbox", icon: Chat20Regular },
  { id: "cases", label: "Cases", icon: Folder20Regular },
  { id: "templates", label: "Templates", icon: DocumentBulletList20Regular },
  { id: "reports", label: "Reports", icon: DataBarVertical20Regular },
  { id: "consent", label: "Consent & POPIA", icon: ShieldCheckmark20Regular },
  { id: "audit", label: "Audit & Security", icon: History20Regular },
  { id: "integrations", label: "Integrations", icon: PlugConnected20Regular },
];

const VIEWS = {
  dashboard: DashboardView,
  inbox: InboxView,
  cases: CasesView,
  templates: TemplatesView,
  reports: ReportsView,
  consent: ConsentView,
  audit: AuditView,
  integrations: IntegrationsView,
};

// ─── MFA gate (6.1.8: multi-factor authentication) ────────────────────────────

// Stands in front of the console on first load. Two factors, in the order the
// OPFA's own environment would present them: Entra ID single sign-on, then an
// authenticator code. The code is shown on screen because this is a
// prototype — and saying so on the dialog is better than a silent cheat.
function MfaGate({ onDone }) {
  const [step, setStep] = useState("sso");
  const [code, setCode] = useState("");
  const [err, setErr] = useState(null);
  const [role, setRole] = useState("admin");
  const [busy, setBusy] = useState(false);
  const expected = "418902";

  const submit = () => {
    if (code.trim() !== expected) {
      setErr("That code is not valid. Check your authenticator app and try again.");
      return;
    }
    setBusy(true);
    setTimeout(() => onDone(role), 500);
  };

  return (
    <Modal title="Sign in to the Ezra OPFA Console" onClose={() => {}} width={430}>
      {step === "sso" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
            Console access is federated to <strong>Microsoft Entra ID</strong> with on-premises
            Active Directory sync. Conditional access requires a second factor for
            this application.
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
              Sign in as
            </div>
            <FluentSelect
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={Object.entries(ROLES).map(([id, r]) => ({ value: id, label: r.label }))}
            />
            <div style={{ fontSize: 10.5, color: C.faint, marginTop: 6, lineHeight: 1.5 }}>
              Role-based access control is enforced: the navigation and the actions
              available change with the role selected here.
            </div>
          </div>
          <Btn onClick={() => setStep("mfa")} style={{ background: OPFA.navy }}>
            Continue with Entra ID
          </Btn>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
            Enter the 6-digit code from your authenticator app.
          </div>
          <input
            value={code}
            autoFocus
            inputMode="numeric"
            maxLength={6}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setErr(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="000000"
            style={{
              width: "100%", padding: "12px 14px", boxSizing: "border-box",
              border: `1px solid ${err ? C.danger : C.hairline}`, borderRadius: 4,
              fontSize: 22, letterSpacing: "8px", textAlign: "center",
              fontFamily: "inherit", fontVariantNumeric: "tabular-nums",
            }}
          />
          {err && <div style={{ fontSize: 11.5, color: C.danger }}>{err}</div>}
          <div style={{
            background: C.warningBg, border: "1px solid #f2e2a8", borderRadius: 6,
            padding: "8px 11px", fontSize: 11, color: C.text, lineHeight: 1.5,
          }}>
            Prototype: no authenticator is enrolled, so the expected code is <strong>{expected}</strong>.
          </div>
          <Btn onClick={submit} loading={busy} style={{ background: OPFA.navy }}>
            Verify and sign in
          </Btn>
        </div>
      )}
    </Modal>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function ShellInner() {
  const s = useOpfa();
  const [active, setActive] = useState("dashboard");
  const isNarrow = useMaxWidth(BP.lg);
  const compactBrand = useMaxWidth(BP.md);
  const [collapsed, setCollapsed] = useState(isNarrow);
  const [navLoading, setNavLoading] = useState(false);

  useEffect(() => { setCollapsed(isNarrow); }, [isNarrow]);
  useEffect(() => {
    setNavLoading(true);
    const t = setTimeout(() => setNavLoading(false), 420);
    return () => clearTimeout(t);
  }, [active]);

  // RBAC decides the nav, and the effective role can change mid-session via
  // the top-bar switcher — so a role downgrade must not leave you standing on
  // a view you can no longer see.
  const navItems = useMemo(
    () => NAV.filter((n) => navAllowed(s, n.id)).map((n) => ({
      ...n,
      icon: <I as={n.icon} size={18} />,
      badge: n.id === "inbox"
        ? s.conversations.filter((c) => c.mode === "queued" || c.unread > 0).length
        : undefined,
    })),
    [s],
  );

  // A role downgrade must not leave you standing on a view you can no longer
  // see. Derived rather than corrected in an effect, so there is no frame
  // where the forbidden view is still mounted.
  const effectiveActive = navItems.some((n) => n.id === active)
    ? active
    : (navItems[0]?.id || "dashboard");

  const waiting = s.conversations.filter((c) => c.mode === "queued").length;
  const me = AGENTS.find((a) => a.id === s.console.userId) || AGENTS[0];
  const sessionLeft = s.console.sessionExpiresAt ? s.console.sessionExpiresAt - now() : 0;

  if (!s.console.mfaVerified) {
    return (
      <AppShellRoot background={`linear-gradient(150deg,${OPFA.navyTint} 0%,#f6f7fb 55%,#fafafa 100%)`}>
        <MfaGate onDone={(role) => signIn(role === "admin" ? "AG-01" : role === "supervisor" ? "AG-04" : "AG-02", role)} />
      </AppShellRoot>
    );
  }

  const ActiveView = VIEWS[effectiveActive] || DashboardView;

  const sidebarFooter = ({ collapsed: c }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AvatarChip initials={me.initials} color={OPFA.navy} size={26} />
        {!c && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me.name}</div>
            <div style={{ fontSize: 10, color: C.faint }}>{ROLES[s.console.role].label}</div>
          </div>
        )}
      </div>
      {!c && <PoweredByEzra tone="dark" />}
    </div>
  );

  return (
    <AppShellRoot background={`linear-gradient(150deg,${OPFA.navyTint} 0%,#f6f7fb 55%,#fafafa 100%)`}>
      <TopBar
        accent={OPFA.navy}
        accentDark={OPFA.navyDark}
        brand={<OpfaBrand compact={compactBrand} subtitle="Console" />}
        onToggleSidebar={() => setCollapsed((v) => !v)}
        onCmdPalette={() => {}}
        searchPlaceholder="Search complaints, contacts, references…"
        right={
          <>
            {/* The session chip is not decoration: 6.1.8 asks for session
                management, and an agent should be able to see the clock. */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: 4, padding: "6px 10px", color: "#fff", fontSize: 11, whiteSpace: "nowrap",
            }}>
              <I as={ShieldCheckmark20Regular} size={13} color="#8fe08f" />
              <span style={{ fontWeight: 700 }}>MFA verified</span>
              <span style={{ opacity: 0.7 }}>· session {countdown(sessionLeft)}</span>
            </div>
            <TopBarIconBtn title="Reset demo data" accent={OPFA.navy} onClick={resetDemo}>
              <I as={ArrowClockwise20Regular} size={16} />
            </TopBarIconBtn>
            <TopBarIconBtn title={`${waiting} conversation(s) waiting for an agent`} badge={waiting} accent={OPFA.navy}>
              <I as={Alert20Regular} size={16} />
            </TopBarIconBtn>
            <div style={{ borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", display: "inline-flex" }}>
              <AvatarChip initials={me.initials} color={OPFA.blue} size={30} />
            </div>
          </>
        }
      />
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <Sidebar navItems={navItems} active={effectiveActive} setActive={setActive} collapsed={collapsed} footer={sidebarFooter} />
        <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", minWidth: 0 }}>
          <TopProgressBar active={navLoading} />
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <ActiveView setActive={setActive} />
          </div>
        </main>
      </div>
    </AppShellRoot>
  );
}

export default function OpfaConsoleApp() {
  return (
    <>
      <GlobalStyles />
      <ToastProvider>
        <ShellInner />
      </ToastProvider>
    </>
  );
}
