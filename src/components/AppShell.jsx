// Shared app shell: TopBar + Sidebar + main viewport.
// Apps compose their own nav items, brand, and right-cluster actions.

import { LineHorizontal320Regular, Search20Regular } from "@fluentui/react-icons";
import { I } from "./Icon.jsx";
import { Badge } from "./primitives.jsx";
import { C } from "./tokens.js";
import { useMaxWidth, BP } from "./responsive.jsx";

// ─── Sidebar ──────────────────────────────────────────────────────────────────
// nav items: { id, label, icon (ReactNode), badge?: number }
export function Sidebar({ navItems, active, setActive, collapsed, footer }) {
  return (
    <div style={{
      width: collapsed ? 52 : 215,
      background: "rgba(255,255,255,0.78)",
      backdropFilter: "blur(40px) saturate(180%)",
      borderRight: "1px solid rgba(0,0,0,0.08)",
      display: "flex", flexDirection: "column",
      transition: "width 0.25s ease", flexShrink: 0,
      height: "100%", overflow: "hidden",
    }}>
      <nav style={{ flex: 1, padding: "10px 0" }}>
        {navItems.map(item => (
          <div key={item.id} onClick={() => setActive(item.id)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: collapsed ? "9px 14px" : "9px 12px",
            cursor: "pointer", position: "relative", borderRadius: 4, margin: "1px 5px",
            background: active === item.id ? C.brandTint : "transparent",
            color: active === item.id ? C.brand : C.text,
            transition: "background 0.15s", fontWeight: active === item.id ? 600 : 400,
          }}
          onMouseEnter={e => { if (active !== item.id) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
          onMouseLeave={e => { if (active !== item.id) e.currentTarget.style.background = "transparent"; }}>
            <div style={{ flexShrink: 0, color: active === item.id ? C.brand : C.muted }}>{item.icon}</div>
            {!collapsed && <span style={{ fontSize: 13, whiteSpace: "nowrap", flex: 1 }}>{item.label}</span>}
            {!collapsed && item.badge > 0 && <Badge count={item.badge} />}
            {collapsed && item.badge > 0 && (
              <div style={{
                position: "absolute", top: 5, right: 5, width: 7, height: 7,
                background: C.brand, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.8)",
              }}/>
            )}
          </div>
        ))}
      </nav>
      {footer && (
        <div style={{ padding: collapsed ? "10px" : "10px 12px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {typeof footer === "function" ? footer({ collapsed }) : footer}
        </div>
      )}
    </div>
  );
}

// ─── TopBar Icon Button (matches the brand-bar icon-button style) ─────────────
export function TopBarIconBtn({ onClick, title, children, badge }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: "transparent",
      border: "1px solid rgba(255,255,255,0.28)",
      borderRadius: 4, padding: "7px 9px",
      cursor: "pointer", color: "#fff",
      display: "inline-flex", alignItems: "center",
      fontFamily: "inherit", position: "relative",
      transition: "background 0.15s",
    }}
    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      {children}
      {badge > 0 && (
        <div style={{
          position: "absolute", top: -4, right: -4,
          width: 16, height: 16, background: C.danger, borderRadius: "50%",
          display: "grid", placeItems: "center",
          fontSize: 9, fontWeight: 700, color: "#fff",
          border: `2px solid ${C.brand}`,
        }}>{badge}</div>
      )}
    </button>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
// Generic Fluent topbar. Apps pass:
//   brand:  ReactNode (logo / wordmark)
//   onToggleSidebar / onCmdPalette
//   searchPlaceholder
//   right:  ReactNode for the right cluster (quick-add, notif, user menu…)
//   accent: top bar background (default brand)
//   accentDark: subtle bottom border colour (default brandDark)
//
// Below sm (640px) the full search input collapses to an icon button that
// also opens the command palette — keeps the bar usable on phones.
export function TopBar({
  brand, onToggleSidebar, onCmdPalette,
  searchPlaceholder = "Search…", right,
  accent = C.brand, accentDark = C.brandDark,
}) {
  const compactSearch = useMaxWidth(BP.sm);
  const tightPadding  = useMaxWidth(BP.md);
  return (
    <div style={{
      padding: tightPadding ? "8px 12px" : "10px 18px",
      borderBottom: `2px solid ${accentDark}`,
      background: accent, display: "flex", alignItems: "center",
      gap: tightPadding ? 8 : 14, flexShrink: 0, position: "relative", zIndex: 100,
      minHeight: 64, boxSizing: "border-box",
    }}>
      <button onClick={onToggleSidebar} title="Toggle sidebar" style={{
        background: "transparent", border: "1px solid rgba(255,255,255,0.28)",
        borderRadius: 4, padding: "7px 9px", cursor: "pointer", color: "#fff",
        display: "inline-flex", alignItems: "center",
        fontFamily: "inherit", flexShrink: 0,
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <I as={LineHorizontal320Regular} size={16}/>
      </button>
      {brand}
      {compactSearch ? (
        // Icon-only search trigger — opens the same command palette.
        <button onClick={onCmdPalette} title="Search (⌘K)" style={{
          marginLeft: "auto",
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.28)",
          borderRadius: 4, padding: "7px 9px", cursor: "pointer", color: "#fff",
          display: "inline-flex", alignItems: "center",
          fontFamily: "inherit", flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}>
          <I as={Search20Regular} size={16}/>
        </button>
      ) : (
        <div style={{ flex: 1, maxWidth: 560, position: "relative", margin: "0 auto", minWidth: 0 }}>
          <input
            readOnly
            onClick={onCmdPalette}
            placeholder={searchPlaceholder}
            style={{
              width: "100%", padding: "10px 40px 10px 14px",
              border: "1px solid #E1E1E2", borderRadius: 4,
              fontSize: 13, background: "#F8FAFC", color: C.muted,
              cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              fontFamily: "inherit", boxSizing: "border-box",
            }} />
          <div style={{
            position: "absolute", right: 12, top: "50%",
            transform: "translateY(-50%)", color: C.muted,
            pointerEvents: "none", display: "inline-flex",
          }}><I as={Search20Regular} size={16}/></div>
          <kbd style={{
            position: "absolute", right: 38, top: "50%",
            transform: "translateY(-50%)", fontSize: 10, background: "#fff",
            border: `1px solid ${C.hairlineSoft}`, borderRadius: 3,
            padding: "2px 5px", color: C.faint, pointerEvents: "none",
          }}>⌘K</kbd>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center",
                    gap: tightPadding ? 6 : 8, flexShrink: 0 }}>
        {right}
      </div>
    </div>
  );
}

// ─── Layout wrapper ───────────────────────────────────────────────────────────
// Vertical: TopBar (children) above; horizontal split: Sidebar | Main.
export function AppShellRoot({ children, background = "linear-gradient(150deg,#e8f4fc 0%,#f3f3f1 45%,#faf9f8 100%)" }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", overflow: "hidden",
      background, fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>{children}</div>
  );
}
