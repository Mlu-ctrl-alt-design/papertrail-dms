// Page header (Fluent 2). Pair with an optional <CommandBar/> rendered below
// by passing the cmd bar element via the `commandBar` prop.
import { Fragment } from "react";
import { C } from "./tokens.js";

export function ViewHeader({ title, subtitle, action, commandBar }) {
  return (
    <Fragment>
      <div style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${C.hairline}`,
        background: "#fff", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {commandBar}
    </Fragment>
  );
}
