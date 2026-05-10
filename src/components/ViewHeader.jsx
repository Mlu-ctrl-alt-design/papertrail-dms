// Page header (Fluent 2). Pair with an optional <CommandBar/> rendered below
// by passing the cmd bar element via the `commandBar` prop.
//
// Layout: on wide viewports, title sits left and the action sits right. When
// the available space drops below the action's intrinsic width, the row
// wraps so the action drops below the title at full width — preferred over
// squeezing the title into a one-word-per-line column.
import { Fragment } from "react";
import { C } from "./tokens.js";

export function ViewHeader({ title, subtitle, action, commandBar }) {
  return (
    <Fragment>
      <div style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${C.hairline}`,
        background: "#fff", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ flex: "1 1 240px", minWidth: 200 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.25 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      {commandBar}
    </Fragment>
  );
}
