// Fluent contextual command bar. Pass `groups` as an array of arrays of items.
// Items with `right: true` float to the right side. Items without a label
// render as an icon-only button.
import { Fragment } from "react";
import { ArrowLeft20Regular } from "@fluentui/react-icons";
import { I } from "./Icon.jsx";
import { C } from "./tokens.js";

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

export function CommandBar({ groups = [], canBack = false, onBack }) {
  if (!groups || groups.length === 0) return null;
  const left = groups.filter((g) => !g[0]?.right);
  const right = groups.filter((g) => g[0]?.right);
  return (
    <div style={{ padding: "8px 16px 12px 16px", background: "transparent", flexShrink: 0 }}>
      <div style={{
        background: "#fff", borderRadius: 4,
        border: "1px solid #E1E1E2", boxShadow: "0 1px 3px rgba(26,26,26,0.06)",
        height: 46, display: "flex", alignItems: "center",
        padding: "0 8px", gap: 0, overflowX: "auto",
      }}>
        <button
          onClick={canBack ? onBack : undefined}
          disabled={!canBack}
          title={canBack ? "Back" : "Nothing to go back to"}
          style={{
            background: "transparent", border: "none",
            padding: "0 8px", height: 42,
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
        {left.map((items, gi) => (
          <Fragment key={"l" + gi}>
            {gi > 0 && <CmdDivider />}
            {items.map((item, ii) => <CommandBtn key={"l" + gi + "-" + ii} {...item} />)}
          </Fragment>
        ))}
        <div style={{ flex: 1 }} />
        {right.map((items, gi) => (
          <Fragment key={"r" + gi}>
            {gi > 0 && <CmdDivider />}
            <CmdDivider />
            {items.map((item, ii) => <CommandBtn key={"r" + gi + "-" + ii} {...item} />)}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
