// Print-to-PDF export.
//
// "Export to PDF" in a client-only prototype has exactly one honest answer:
// the browser's own print pipeline. Every desktop browser offers "Save as PDF"
// in the print dialog, it renders the real report rather than a screenshot,
// and it costs no dependency. The trade is that the user picks the filename,
// which is a fair thing to say out loud in a demo.
//
// The mechanism: mount a <PrintSheet> containing the report, hidden on screen
// and revealed only inside @media print, while everything else on the page is
// hidden by .no-print-root. See globalStyles.jsx for the two rules.
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { C, FONT } from "./tokens.js";

// Drives one print run. `prepare` lets a caller stage state (switch to the
// full dataset, expand every row) before the dialog opens.
export function usePrintExport() {
  const [printing, setPrinting] = useState(false);
  const pending = useRef(false);

  const print = useCallback((prepare) => {
    // Guard against a double-fire from an impatient double-click: a second
    // window.print() while the first dialog is modal is silently dropped by
    // some browsers and stacks in others.
    if (pending.current) return;
    pending.current = true;
    if (prepare) prepare();
    setPrinting(true);
    // One frame so the sheet is in the DOM before the dialog snapshots it.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          window.print();
        } finally {
          setPrinting(false);
          pending.current = false;
        }
      });
    });
  }, []);

  return { print, printing };
}

// The printable document. Renders a letterhead, the report body and a footer
// with the generated-at stamp — an audit report with no provenance line is not
// an audit report.
export function PrintSheet({ title, subtitle, org, meta, children, footer }) {
  const stamp = new Date().toLocaleString("en-ZA", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  // Portalled to <body> so it is a sibling of #root: the print rules then need
  // only hide #root and show this, with no chance of an ancestor's `overflow`
  // or `display:flex` clipping the report.
  return createPortal(
    <div className="print-sheet" style={{ fontFamily: FONT, color: C.ink }}>
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 24, borderBottom: `2px solid ${C.ink}`, paddingBottom: 12, marginBottom: 18,
      }}>
        <div style={{ minWidth: 0 }}>
          {org && (
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: C.muted }}>
              {org}
            </div>
          )}
          <div style={{ fontSize: 19, fontWeight: 700, marginTop: 4, lineHeight: 1.25 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{subtitle}</div>}
        </div>
        <div style={{ textAlign: "right", fontSize: 10, color: C.muted, lineHeight: 1.6, flexShrink: 0 }}>
          <div>Generated {stamp}</div>
          {meta?.map((m) => <div key={m}>{m}</div>)}
        </div>
      </div>

      <div>{children}</div>

      <div style={{
        marginTop: 22, paddingTop: 10, borderTop: `1px solid ${C.hairline}`,
        fontSize: 9.5, color: C.faint, lineHeight: 1.6,
      }}>
        {footer || "System-generated report. Figures reflect the state of the platform at the time of generation."}
      </div>
    </div>,
    document.body,
  );
}

// A table that survives a page break: the header repeats on every sheet and
// rows are not split down the middle.
export function PrintTable({ columns, rows }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
      <thead style={{ display: "table-header-group" }}>
        <tr>
          {columns.map((c) => (
            <th key={c.id} style={{
              textAlign: c.align || "left", padding: "6px 8px",
              borderBottom: `1px solid ${C.ink}`, fontWeight: 700,
              fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.4px",
              whiteSpace: "nowrap",
            }}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id ?? i} style={{ breakInside: "avoid" }}>
            {columns.map((c) => (
              <td key={c.id} style={{
                textAlign: c.align || "left", padding: "5px 8px",
                borderBottom: `1px solid ${C.hairline}`, verticalAlign: "top",
              }}>{c.get ? c.get(r) : r[c.id]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
