// Fluent 2 tab strip for *parallel* content — several views of the same
// subject, any of which you might want first.
//
// Deliberately not the pattern for sequential content: the IDP screen used
// tabs for a four-step process and was replaced with an accordion, because
// tabs hide the fact that step 3 depends on step 2. Reach for this only when
// the panels are peers.
//
// Under BP.md the strip collapses to a select — a seven-tab row does not wrap
// gracefully, and a horizontally scrolling strip hides its own tail.
import { C, R } from "./tokens.js";
import { FluentSelect } from "./primitives.jsx";
import { useMaxWidth, BP } from "./responsive.jsx";
import { I } from "./Icon.jsx";

export function Tabs({ items, active, onChange, right, collapseAt = BP.md }) {
  const compact = useMaxWidth(collapseAt);
  const current = items.find((t) => t.id === active) || items[0];

  if (compact) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: `1px solid ${C.hairline}`, padding: "8px 0 10px",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FluentSelect
            value={current?.id}
            // FluentSelect hands back an event-like {target:{value}}; Tabs'
            // own onChange takes the id, so normalise here rather than making
            // every call site know which control fired.
            onChange={(e) => onChange(e.target.value)}
            options={items.map((t) => ({
              value: t.id,
              label: t.count != null ? `${t.label} (${t.count})` : t.label,
            }))}
          />
        </div>
        {right}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      gap: 16, borderBottom: `1px solid ${C.hairline}`,
    }}>
      <div role="tablist" style={{ display: "flex", alignItems: "stretch", gap: 2, minWidth: 0, overflowX: "auto" }}>
        {items.map((t) => {
          const on = t.id === current?.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => onChange(t.id)}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: on ? 700 : 600,
                color: on ? C.brand : C.muted,
                padding: "9px 12px 8px", whiteSpace: "nowrap",
                // The underline is a child rather than a border so the inactive
                // tabs reserve the same height and nothing shifts on select.
                display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { if (!on) e.currentTarget.style.color = C.ink; }}
              onMouseLeave={(e) => { if (!on) e.currentTarget.style.color = C.muted; }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {t.icon && <I as={t.icon} size={15} color={on ? C.brand : C.faint} />}
                {t.label}
                {t.count != null && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, borderRadius: R.pill,
                    padding: "1px 6px", background: on ? C.brandTint : C.surfaceMute,
                    color: on ? C.brand : C.muted,
                  }}>{t.count}</span>
                )}
              </span>
              <span style={{
                height: 2, width: "100%", borderRadius: 2,
                background: on ? C.brand : "transparent",
              }} />
            </button>
          );
        })}
      </div>
      {right && <div style={{ paddingBottom: 6, flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

// Thin wrapper so a view reads as tabs + panels rather than tabs + a ternary.
export function TabPanel({ when, active, children, style = {} }) {
  if (when !== active) return null;
  return <div className="fade-up" style={{ minWidth: 0, ...style }}>{children}</div>;
}
