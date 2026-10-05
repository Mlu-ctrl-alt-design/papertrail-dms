// Presentational vocabulary for the finance module: statement tables, schedules,
// journal entries and the breadcrumb.
//
// Numbers are right-aligned with tabular figures and negatives in brackets, and
// nil is a dash. The audience is finance people; a statement that does not look
// like a statement is a distraction.

import { useState } from "react";
import { ChevronRight20Regular, ChevronDown20Regular } from "@fluentui/react-icons";
import { C, FluentSelect, I, Pill, R } from "../components/index.js";
import {
  BASE_CURRENCY, COMPANIES, GROUP_NAME, branchName, companyName,
  fmtBase, fmtForeign, fmtRate, monthLabel, prettyDate, scopeLabel,
} from "./config.js";
import { accountName } from "./engine/coa.js";
import { NUM, linkBtn } from "./styles.js";

const AMOUNT_WIDTH = 132;

// ─── Numbers ──────────────────────────────────────────────────────────────────

export function Num({ value, weight = 400, size = 12.5, color, blankZero = false, prefix }) {
  const text = fmtBase(value, { blankZero });
  const tone = color || (value < 0 ? C.danger : C.ink);
  return (
    <span style={{ ...NUM, fontSize: size, fontWeight: weight, color: tone, whiteSpace: "nowrap" }}>
      {prefix}{text}
    </span>
  );
}

export const Foreign = ({ value, currency, size = 12.5, weight = 400 }) => (
  <span style={{ ...NUM, fontSize: size, fontWeight: weight, color: C.ink, whiteSpace: "nowrap" }}>
    {currency} {fmtForeign(value, currency)}
  </span>
);

export const Rate = ({ value }) => (
  <span style={{ ...NUM, fontSize: 12.5, color: C.ink }}>{fmtRate(value)}</span>
);

// ─── Page furniture ───────────────────────────────────────────────────────────

export const Page = ({ children, pad = 20 }) => (
  <div style={{ flex: 1, overflow: "auto", minHeight: 0, padding: pad, display: "flex", flexDirection: "column", gap: 16 }}>
    {children}
  </div>
);

export const Row = ({ children, gap = 12, wrap = true, align = "stretch", style = {} }) => (
  <div style={{ display: "flex", gap, flexWrap: wrap ? "wrap" : "nowrap", alignItems: align, minWidth: 0, ...style }}>
    {children}
  </div>
);

export const Hint = ({ children }) => (
  <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.55 }}>{children}</div>
);

export const SubHead = ({ children, right }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>
      {children}
    </div>
    {right}
  </div>
);

// A quiet labelled figure for detail panels.
export function KeyValue({ label, children, width = 150 }) {
  return (
    <div style={{ display: "flex", gap: 10, fontSize: 12.5, lineHeight: 1.6, minWidth: 0 }}>
      <span style={{ width, flexShrink: 0, color: C.muted }}>{label}</span>
      <span style={{ color: C.ink, minWidth: 0, fontWeight: 600 }}>{children}</span>
    </div>
  );
}

export const StatusPill = ({ status }) => {
  const map = {
    open: { fg: C.warning, bg: C.warningBg, label: "Open" },
    "part-paid": { fg: C.info, bg: C.brandTint, label: "Part paid" },
    paid: { fg: C.success, bg: C.successBg, label: "Paid" },
    posted: { fg: C.success, bg: C.successBg, label: "Posted" },
    pending: { fg: C.muted, bg: C.surfaceMute, label: "Pending" },
    closed: { fg: C.success, bg: C.successBg, label: "Closed" },
    "in-service": { fg: C.success, bg: C.successBg, label: "In service" },
    deferred: { fg: "#8764b8", bg: "#f3eefb", label: "Deferred" },
  };
  const s = map[status] || { fg: C.text, bg: C.surfaceMute, label: status };
  return <Pill fg={s.fg} bg={s.bg}>{s.label}</Pill>;
};

// ─── Statement table ──────────────────────────────────────────────────────────
// One column. `onDrill(row)` makes the amount clickable; rows without accounts
// behind them (sections, derived subtotals) stay inert.

const rowChrome = (kind, emphasis) => {
  if (kind === "total") {
    return { borderTop: `1px solid ${C.ink}`, borderBottom: `3px double ${C.ink}`, fontWeight: 700, fontSize: 13 };
  }
  if (kind === "subtotal") {
    return {
      borderTop: `1px solid ${emphasis ? C.ink : C.hairline}`,
      fontWeight: emphasis ? 700 : 600,
      fontSize: emphasis ? 13 : 12.5,
      background: emphasis ? C.surfaceAlt : "transparent",
    };
  }
  return {};
};

export function StatementTable({ report, onDrill, comparative, comparativeLabel, valueLabel = BASE_CURRENCY }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={thLeft}>&nbsp;</th>
          <th style={{ ...thRight, width: AMOUNT_WIDTH }}>{valueLabel}</th>
          {comparative && <th style={{ ...thRight, width: AMOUNT_WIDTH }}>{comparativeLabel}</th>}
        </tr>
      </thead>
      <tbody>
        {report.rows.map((r) => {
          if (r.kind === "section") {
            return (
              <tr key={r.id}>
                <td colSpan={comparative ? 3 : 2} style={{
                  padding: "14px 8px 5px", fontSize: 10.5, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.6px",
                }}>{r.label}</td>
              </tr>
            );
          }
          const chrome = rowChrome(r.kind, r.emphasis);
          const drillable = r.kind === "line" && onDrill && r.amount !== 0;
          return (
            <tr key={r.id} style={{ ...chrome, background: chrome.background }}>
              <td style={{ padding: "5px 8px", fontSize: chrome.fontSize || 12.5, fontWeight: chrome.fontWeight || 400,
                           color: C.ink, paddingLeft: r.kind === "line" ? 18 : 8 }}>
                {r.label}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right" }}>
                {drillable ? (
                  <DrillAmount value={r.amount} weight={chrome.fontWeight || 400} onClick={() => onDrill(r)} />
                ) : (
                  <Num value={r.amount} weight={chrome.fontWeight || 400} size={chrome.fontSize || 12.5} />
                )}
              </td>
              {comparative && (
                <td style={{ padding: "5px 8px", textAlign: "right" }}>
                  <Num value={comparative.byId.get(r.id) ?? 0} weight={chrome.fontWeight || 400}
                       size={chrome.fontSize || 12.5} color={C.muted} />
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const thLeft = {
  textAlign: "left", padding: "8px", fontSize: 10, fontWeight: 700, color: C.faint,
  textTransform: "uppercase", letterSpacing: "0.6px", borderBottom: `1px solid ${C.hairline}`,
};
const thRight = { ...thLeft, textAlign: "right", whiteSpace: "nowrap" };

export function DrillAmount({ value, weight = 400, size = 12.5, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title="Drill into this figure"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => { e.currentTarget.blur(); if (onClick) onClick(e); }}
      style={{
        background: hover ? C.brandTint : "transparent",
        border: "none", borderRadius: R.sm, padding: "2px 5px", margin: "-2px -5px",
        cursor: "pointer", fontFamily: "inherit",
        textDecoration: hover ? "underline" : "none",
        textUnderlineOffset: 3, textDecorationColor: C.brand,
      }}
    >
      <Num value={value} weight={weight} size={size} color={hover ? C.brand : undefined} />
    </button>
  );
}

// ─── Consolidated table ───────────────────────────────────────────────────────
// One column per entity, an Eliminations column derived from the intercompany
// tags, and a Group column that is the sum of the two.

export function ConsolidatedTable({ con, onDrill, totalLabel = "Group" }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
        <thead>
          <tr>
            <th style={{ ...thLeft, minWidth: 220, position: "sticky", left: 0, background: "#fff", zIndex: 1 }}>&nbsp;</th>
            {con.columns.map((c) => <th key={c.id} style={{ ...thRight, minWidth: 110 }}>{c.label}</th>)}
            {con.eliminate && <th style={{ ...thRight, minWidth: 110 }}>Eliminations</th>}
            <th style={{ ...thRight, minWidth: 120, color: C.brand }}>{totalLabel}</th>
          </tr>
        </thead>
        <tbody>
          {con.rows.map((r) => {
            const span = con.columns.length + (con.eliminate ? 2 : 1) + 1;
            if (r.kind === "section") {
              return (
                <tr key={r.id}>
                  <td colSpan={span} style={{
                    padding: "14px 8px 5px", fontSize: 10.5, fontWeight: 700, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.6px",
                  }}>{r.label}</td>
                </tr>
              );
            }
            const chrome = rowChrome(r.kind, r.emphasis);
            const w = chrome.fontWeight || 400;
            const sz = chrome.fontSize || 12.5;
            return (
              <tr key={r.id} style={{ ...chrome }}>
                <td style={{
                  padding: "5px 8px", fontSize: sz, fontWeight: w, color: C.ink,
                  paddingLeft: r.kind === "line" ? 18 : 8,
                  position: "sticky", left: 0, background: chrome.background || "#fff",
                }}>{r.label}</td>
                {con.columns.map((c) => (
                  <td key={c.id} style={{ padding: "5px 8px", textAlign: "right" }}>
                    {r.kind === "line" && onDrill && r.amounts[c.id] !== 0
                      ? <DrillAmount value={r.amounts[c.id]} weight={w} size={sz} onClick={() => onDrill(r, c)} />
                      : <Num value={r.amounts[c.id]} weight={w} size={sz} />}
                  </td>
                ))}
                {con.eliminate && (
                  <td style={{ padding: "5px 8px", textAlign: "right" }}>
                    <Num value={r.elim} weight={w} size={sz} color={r.elim ? C.muted : undefined} />
                  </td>
                )}
                {/* The total column keeps its tint on every row, so it reads as
                    one band rather than as a ragged series of highlights. */}
                <td style={{ padding: "5px 8px", textAlign: "right", background: C.brandTintSoft }}>
                  {r.kind === "line" && onDrill && r.group !== 0
                    ? <DrillAmount value={r.group} weight={w || 600} size={sz} onClick={() => onDrill(r, null)} />
                    : <Num value={r.group} weight={Math.max(w, 600)} size={sz} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Schedules ────────────────────────────────────────────────────────────────
// Posted rows and pending rows must be unmistakably different: the whole point
// of the demo is that the posted ones happened on their own.

export function ScheduleTable({ rows, posted, openPeriod, balanceLabel = "Carrying amount", onJournal }) {
  const [showAll, setShowAll] = useState(false);
  const firstPending = rows.findIndex((r) => !posted.has(r.period));
  const visible = showAll || rows.length <= 16
    ? rows
    : rows.slice(0, Math.max(14, Math.min(rows.length, firstPending + 4)));
  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...thLeft, width: 44 }}>#</th>
            <th style={thLeft}>Period</th>
            <th style={thRight}>Charge</th>
            <th style={thRight}>Cumulative</th>
            <th style={thRight}>{balanceLabel}</th>
            <th style={{ ...thLeft, width: 120 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => {
            const isPosted = posted.has(r.period);
            const isNext = !isPosted && r.period === openPeriod;
            return (
              <tr key={r.n} style={{
                background: isPosted ? "#fff" : isNext ? C.warningBg : C.surfaceAlt,
                color: isPosted ? C.ink : C.muted,
              }}>
                <td style={{ ...td, color: C.faint }}>{r.n}</td>
                <td style={{ ...td, fontWeight: isPosted ? 600 : 400 }}>{monthLabel(r.period)}</td>
                <td style={{ ...td, textAlign: "right" }}><Num value={r.amount} weight={isPosted ? 600 : 400} /></td>
                <td style={{ ...td, textAlign: "right" }}><Num value={r.cumulative} /></td>
                <td style={{ ...td, textAlign: "right" }}>
                  <Num value={r.nbv != null ? r.nbv : r.remaining} />
                </td>
                <td style={td}>
                  {isPosted ? (
                    onJournal ? (
                      <button onClick={() => onJournal(r)} style={linkBtn}>Posted</button>
                    ) : <StatusPill status="posted" />
                  ) : isNext ? <Pill fg={C.warning} bg="#fff">Next run</Pill> : <StatusPill status="pending" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {visible.length < rows.length && (
        <button onClick={() => setShowAll(true)} style={{ ...linkBtn, marginTop: 8, fontSize: 12 }}>
          Show all {rows.length} periods
        </button>
      )}
    </div>
  );
}

const td = { padding: "5px 8px", fontSize: 12.5, borderBottom: `1px solid ${C.surfaceMute}`, verticalAlign: "middle" };

// ─── Journal entry ────────────────────────────────────────────────────────────

export function JournalEntry({ journal, dense = false }) {
  const dr = journal.lines.reduce((a, l) => a + l.debit, 0);
  const cr = journal.lines.reduce((a, l) => a + l.credit, 0);
  return (
    <div>
      {!dense && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
          <KeyValue label="Reference" width={80}>{journal.ref}</KeyValue>
          <KeyValue label="Date" width={50}>{prettyDate(journal.date)}</KeyValue>
        </div>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thLeft}>Account</th>
            <th style={thLeft}>Company · branch</th>
            <th style={thRight}>Debit</th>
            <th style={thRight}>Credit</th>
          </tr>
        </thead>
        <tbody>
          {journal.lines.map((l, i) => (
            <tr key={i}>
              <td style={td}>
                <div style={{ fontWeight: 600 }}>{l.account} · {accountName(l.account)}</div>
                {l.fx && l.fx.currency !== BASE_CURRENCY && (
                  <div style={{ fontSize: 11, color: C.muted, ...NUM }}>
                    {l.fx.currency} {fmtForeign(l.fx.amount, l.fx.currency)} @ {fmtRate(l.fx.rate)}
                  </div>
                )}
              </td>
              <td style={{ ...td, color: C.muted, fontSize: 11.5 }}>
                {companyName(l.company).replace("Hugamara ", "")} · {branchName(l.company, l.branch)}
                {l.counterparty && (
                  <Pill fg="#8764b8" bg="#f3eefb" style={{ marginLeft: 6 }}>IC</Pill>
                )}
              </td>
              <td style={{ ...td, textAlign: "right" }}><Num value={l.debit} blankZero /></td>
              <td style={{ ...td, textAlign: "right" }}><Num value={l.credit} blankZero /></td>
            </tr>
          ))}
          <tr>
            <td style={{ ...td, borderTop: `1px solid ${C.ink}`, fontWeight: 700 }} colSpan={2}>
              {dr === cr ? "Balanced" : "OUT OF BALANCE"}
            </td>
            <td style={{ ...td, borderTop: `1px solid ${C.ink}`, textAlign: "right" }}><Num value={dr} weight={700} /></td>
            <td style={{ ...td, borderTop: `1px solid ${C.ink}`, textAlign: "right" }}><Num value={cr} weight={700} /></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

export function Crumbs({ items, onPick }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", fontSize: 12 }}>
      {items.map((c, i) => (
        <span key={c.key} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {i > 0 && <span style={{ color: C.faint, display: "inline-flex" }}><I as={ChevronRight20Regular} size={12} /></span>}
          {i === items.length - 1 ? (
            <span style={{ fontWeight: 700, color: C.ink }}>{c.label}</span>
          ) : (
            <button onClick={() => onPick(c.index)} style={{ ...linkBtn, fontSize: 12 }}>{c.label}</button>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── Scope selector ───────────────────────────────────────────────────────────
// Group / company / branch in one control: the scope is never ambiguous, so it
// should not take two dropdowns to express.

export function ScopeSelect({ scope, onChange, size = "sm", width = 230 }) {
  const options = [
    { value: "group", label: GROUP_NAME },
    ...COMPANIES.flatMap((c) => [
      { value: c.id, label: c.name },
      ...c.branches.map((b) => ({ value: `${c.id}/${b.id}`, label: `      ${b.name}` })),
    ]),
  ];
  const value = !scope.company ? "group" : scope.branch ? `${scope.company}/${scope.branch}` : scope.company;
  return (
    <FluentSelect
      size={size}
      value={value}
      options={options}
      style={{ width }}
      onChange={(e) => {
        const v = String(e.target.value);
        if (v === "group") return onChange({ company: null, branch: null });
        const [company, branch] = v.split("/");
        return onChange({ company, branch: branch || null });
      }}
    />
  );
}

export const ScopeCaption = ({ scope }) => (
  <span style={{ fontSize: 11.5, color: C.muted }}>{scopeLabel(scope)}</span>
);

// ─── Collapsible ──────────────────────────────────────────────────────────────

export function Collapse({ title, children, open: initial = false, right }) {
  const [open, setOpen] = useState(initial);
  return (
    <div style={{ border: `1px solid ${C.hairline}`, borderRadius: R.lg, background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", cursor: "pointer" }}
           onClick={() => setOpen((o) => !o)}>
        <span style={{ color: C.muted, display: "inline-flex" }}>
          <I as={open ? ChevronDown20Regular : ChevronRight20Regular} size={14} />
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, flex: 1 }}>{title}</span>
        {right}
      </div>
      {open && <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${C.surfaceMute}`, paddingTop: 12 }}>{children}</div>}
    </div>
  );
}

// ─── Register table ───────────────────────────────────────────────────────────
// A short list with a totals row. DataTable is the right tool for hundreds of
// rows; a register of eight assets wants its totals next to it, not a paginator.
//
// columns: { id, label, align?, width?, render(row), total?(rows) }
export function RegisterTable({ columns, rows, getKey, onRowClick, totals = true, emptyMessage = "Nothing here yet." }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.id} style={{
              textAlign: c.align || "left", padding: "8px", fontSize: 10, fontWeight: 700,
              color: C.faint, textTransform: "uppercase", letterSpacing: "0.6px",
              borderBottom: `1px solid ${C.hairline}`, whiteSpace: "nowrap", width: c.width,
            }}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={getKey(r)}
            onClick={onRowClick ? () => onRowClick(r) : undefined}
            style={{
              cursor: onRowClick ? "pointer" : "default",
              background: i % 2 === 0 ? "#fff" : "#fcfcfb",
            }}
            onMouseEnter={(e) => { if (onRowClick) e.currentTarget.style.background = C.surfaceMute; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fcfcfb"; }}
          >
            {columns.map((c) => (
              <td key={c.id} style={{
                padding: "8px", fontSize: 12.5, textAlign: c.align || "left",
                borderBottom: `1px solid ${C.surfaceMute}`, verticalAlign: "middle",
              }}>{c.render(r)}</td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={columns.length} style={{ padding: 36, textAlign: "center", color: C.faint, fontSize: 12.5 }}>
            {emptyMessage}
          </td></tr>
        )}
        {totals && rows.length > 0 && (
          <tr style={{ borderTop: `1px solid ${C.ink}`, background: C.surfaceAlt }}>
            {columns.map((c, i) => (
              <td key={c.id} style={{
                padding: "9px 8px", fontSize: 12.5, fontWeight: 700,
                textAlign: c.align || "left", borderBottom: `3px double ${C.ink}`,
              }}>
                {c.total ? c.total(rows) : i === 0 ? `${rows.length} ${rows.length === 1 ? "record" : "records"}` : null}
              </td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  );
}
