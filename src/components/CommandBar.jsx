// Fluent contextual command bar. Pass `groups` as an array of arrays of items.
// Items with `right: true` float to the right side. Items without a label
// render as an icon-only button.
//
// Progressive truncation as the bar narrows:
//   ≥ lg  → all groups visible
//   < lg  → right-aligned groups hidden first (typically Exports)
//   < md  → secondary left groups also collapse (only the primary action group survives)
// Critical actions live in the first left-side group, so they're never dropped.
// Hidden actions surface in a click-to-open overflow menu (••• +N) on the
// right edge of the bar so they remain reachable on narrow viewports.
import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowLeft20Regular, MoreHorizontal20Regular } from "@fluentui/react-icons";
import { I } from "./Icon.jsx";
import { C, SHADOW } from "./tokens.js";
import { useMaxWidth, BP } from "./responsive.jsx";

export function CommandBtn({ icon, label, onClick, danger, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: "transparent", border: "none",
        padding: "0 12px", height: 42,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit", fontSize: 13,
        color: disabled ? C.faint : danger ? C.danger : "rgba(26,26,26,0.78)",
        display: "inline-flex", alignItems: "center", gap: 7,
        whiteSpace: "nowrap", borderRadius: 4,
        opacity: disabled ? 0.6 : 1, transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = danger ? C.dangerBg : C.surfaceMute; }}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon && <I as={icon} size={15} />}
      {label && <span>{label}</span>}
    </button>
  );
}

export function CmdDivider() {
  return <div style={{ width: 1, alignSelf: "stretch", background: "#E1E1E2", margin: "0 4px" }} />;
}

function OverflowMenu({ groups }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const total = groups.reduce((a, g) => a + g.length, 0);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={`${total} more action${total === 1 ? "" : "s"}`}
        style={{
          background: open ? C.surfaceMute : "transparent", border: "none",
          padding: "0 10px", height: 42, flexShrink: 0,
          cursor: "pointer", color: C.muted,
          display: "inline-flex", alignItems: "center", gap: 4,
          borderRadius: 4, fontFamily: "inherit", fontSize: 11, fontWeight: 600,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = C.surfaceMute; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        <I as={MoreHorizontal20Regular} size={16}/>
        <span>+{total}</span>
      </button>
      {open && (
        <div className="scale-in" style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          minWidth: 240, background: "#fff",
          border: `1px solid ${C.hairline}`, borderRadius: 4,
          boxShadow: SHADOW.lg, zIndex: 1500, padding: 4, overflow: "hidden",
        }}>
          {groups.map((items, gi) => (
            <Fragment key={"og" + gi}>
              {gi > 0 && <div style={{ height: 1, background: C.surfaceMute, margin: "4px 0" }}/>}
              {items.map((item, ii) => (
                <button
                  key={"og" + gi + "-" + ii}
                  onClick={() => {
                    if (!item.disabled && item.onClick) item.onClick();
                    setOpen(false);
                  }}
                  disabled={item.disabled}
                  style={{
                    width: "100%", textAlign: "left",
                    background: "transparent", border: "none",
                    padding: "8px 10px", borderRadius: 4,
                    cursor: item.disabled ? "not-allowed" : "pointer",
                    color: item.disabled ? C.faint : item.danger ? C.danger : C.text,
                    display: "flex", alignItems: "center", gap: 10,
                    fontSize: 13, fontFamily: "inherit",
                    opacity: item.disabled ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = item.danger ? C.dangerBg : C.surfaceMute; }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {item.icon && <I as={item.icon} size={15} color={item.danger ? C.danger : C.muted}/>}
                  <span style={{ flex: 1 }}>{item.label}</span>
                </button>
              ))}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommandBar({ groups = [], canBack = false, onBack }) {
  const isMd = useMaxWidth(BP.md);   // < 768px
  const isLg = useMaxWidth(BP.lg);   // < 1024px

  if (!groups || groups.length === 0) return null;
  const allLeft  = groups.filter((g) => !g[0]?.right);
  const allRight = groups.filter((g) =>  g[0]?.right);

  // Truncate progressively. Below lg drop the right cluster (exports);
  // below md keep only the primary (first) left group.
  const left  = isMd ? allLeft.slice(0, 1) : allLeft;
  const right = isLg ? [] : allRight;

  // Anything we dropped is exposed via the overflow menu so users on narrow
  // screens still have access to every action.
  const overflowGroups = [...allLeft.slice(left.length), ...(isLg ? allRight : [])];

  return (
    <div style={{ padding: "8px 16px 12px 16px", background: "transparent", flexShrink: 0 }}>
      <div style={{
        background: "#fff", borderRadius: 4,
        border: "1px solid #E1E1E2", boxShadow: "0 1px 3px rgba(26,26,26,0.06)",
        height: 46, display: "flex", alignItems: "center",
        padding: "0 8px", gap: 0, overflow: "visible",
      }}>
        <button
          onClick={canBack ? onBack : undefined}
          disabled={!canBack}
          title={canBack ? "Back" : "Nothing to go back to"}
          style={{
            background: "transparent", border: "none",
            padding: "0 8px", height: 42, flexShrink: 0,
            cursor: canBack ? "pointer" : "not-allowed",
            color: canBack ? "#52525B" : "#c8c6c4",
            display: "inline-flex", alignItems: "center",
            borderRadius: 4, opacity: canBack ? 1 : 0.5,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { if (canBack) e.currentTarget.style.background = C.surfaceMute; }}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <I as={ArrowLeft20Regular} size={18} />
        </button>
        <CmdDivider />
        <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, overflow: "hidden" }}>
          {left.map((items, gi) => (
            <Fragment key={"l" + gi}>
              {gi > 0 && <CmdDivider />}
              {items.map((item, ii) => <CommandBtn key={"l" + gi + "-" + ii} {...item} />)}
            </Fragment>
          ))}
        </div>
        {right.map((items, gi) => (
          <Fragment key={"r" + gi}>
            {gi > 0 && <CmdDivider />}
            <CmdDivider />
            {items.map((item, ii) => <CommandBtn key={"r" + gi + "-" + ii} {...item} />)}
          </Fragment>
        ))}
        {overflowGroups.length > 0 && (
          <>
            <CmdDivider />
            <OverflowMenu groups={overflowGroups}/>
          </>
        )}
      </div>
    </div>
  );
}
