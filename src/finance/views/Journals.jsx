// The general journal — read only.
//
// This is where drill-down lands and the first thing an accountant will ask to
// see. Every entry names its source, and clicking one opens the document behind
// it.

import { useMemo, useState } from "react";
import { DocumentBulletList20Regular } from "@fluentui/react-icons";
import {
  Btn, C, DataTable, Drawer, I, Pill, Stat, ViewHeader,
} from "../../components/index.js";
import { branchName, companyShort, monthLabel, money, prettyDate, scopeLabel } from "../config.js";
import { inScope } from "../engine/ledger.js";
import { useFinance } from "../state.js";
import { JournalEntry, Num, Row, SubHead } from "../ui.jsx";
import { SourceDoc } from "./Drill.jsx";

const SOURCE_LABELS = {
  "opening-balance": "Opening balance",
  "asset-acquisition": "Asset acquisition",
  "asset-depreciation": "Depreciation",
  "supplier-invoice": "Supplier invoice",
  "invoice-payment": "Payment",
  "deferral-amortisation": "Amortisation",
  "intercompany-charge": "Intercompany",
  manual: "Manual",
};

const SOURCE_TONE = {
  "asset-depreciation": { fg: C.info, bg: C.brandTint },
  "deferral-amortisation": { fg: "#8764b8", bg: "#f3eefb" },
  "invoice-payment": { fg: C.success, bg: C.successBg },
  "intercompany-charge": { fg: "#8764b8", bg: "#f3eefb" },
};

export function JournalsView() {
  const store = useFinance();
  const [openId, setOpenId] = useState(null);

  const scope = store.scope;
  const rows = useMemo(() => store.ledger.journals
      .filter((j) => j.lines.some((l) => inScope(l, scope)))
      .map((j) => {
        const relevant = j.lines.filter((l) => inScope(l, scope));
        return {
          journal: j,
          amount: relevant.reduce((a, l) => a + l.debit, 0),
          units: [...new Set(relevant.map((l) => `${companyShort(l.company)} · ${branchName(l.company, l.branch)}`))],
          source: SOURCE_LABELS[j.source?.type] || "Manual",
        };
      })
      .sort((a, b) => b.journal.date.localeCompare(a.journal.date) || b.journal.id.localeCompare(a.journal.id)),
  [store.ledger, scope]);

  const total = rows.reduce((a, r) => a + r.amount, 0);
  const automatic = rows.filter((r) => ["Depreciation", "Amortisation"].includes(r.source)).length;

  const columns = [
    { id: "ref", label: "Reference", get: (r) => r.journal.ref, minWidth: 110 },
    { id: "date", label: "Date", get: (r) => r.journal.date, renderCell: (r) => prettyDate(r.journal.date) },
    {
      id: "source", label: "Source", filterable: true, get: (r) => r.source,
      renderCell: (r) => {
        const tone = SOURCE_TONE[r.journal.source?.type] || { fg: C.muted, bg: C.surfaceMute };
        return <Pill fg={tone.fg} bg={tone.bg}>{r.source}</Pill>;
      },
    },
    {
      id: "memo", label: "Narration", minWidth: 280, get: (r) => r.journal.memo,
      renderCell: (r) => <span style={{ color: C.ink }}>{r.journal.memo}</span>,
    },
    {
      id: "unit", label: "Company · branch", filterable: true, get: (r) => r.units.join(", "),
      renderCell: (r) => (
        <span style={{ fontSize: 11.5, color: C.muted, whiteSpace: "nowrap" }}>{r.units.join(", ")}</span>
      ),
    },
    { id: "lines", label: "Lines", align: "right", get: (r) => r.journal.lines.length },
    { id: "amount", label: "Debit", align: "right", get: (r) => r.amount, renderCell: (r) => <Num value={r.amount} /> },
  ];

  const open = openId ? store.ledger.journals.find((j) => j.id === openId) : null;

  return (
    <>
      <ViewHeader
        title="General journal"
        subtitle={`${scopeLabel(store.scope)} · ${rows.length} entries`}
      />
      <div style={{ padding: "14px 20px 0", flexShrink: 0 }}>
        <Row>
          <Stat label="Entries" value={String(rows.length)}
                icon={<I as={DocumentBulletList20Regular} size={14} color={C.muted} />} basis={170} />
          <Stat label="Total debits" value={money(total)}
                sub="Credits are identical — every entry balances within its own company and branch" basis={250} />
          <Stat label="Posted by the system" value={String(automatic)}
                sub="Depreciation and amortisation journals, from the month-end runs" basis={210} />
          <Stat label="Open period" value={monthLabel(store.openPeriod)} basis={160} />
        </Row>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: "14px 20px 20px" }}>
        <div style={{
          border: `1px solid ${C.hairline}`, borderRadius: 8, overflow: "hidden",
          display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: "#fff",
        }}>
          <DataTable
            rows={rows}
            columns={columns}
            getKey={(r) => r.journal.id}
            searchPlaceholder="Search reference, narration, source…"
            searchKeys={["ref", "memo", "source", "unit"]}
            defaultSort={{ col: "date", dir: "desc" }}
            defaultPageSize={25}
            pageSizeOptions={[25, 50, 100]}
            onRowClick={(r) => setOpenId(r.journal.id)}
            emptyMessage="No journals for this scope."
          />
        </div>
      </div>

      {open && (
        <Drawer onClose={() => setOpenId(null)} width={700}>
          <div style={{
            padding: "14px 20px", borderBottom: `1px solid ${C.hairline}`, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{open.ref}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{prettyDate(open.date)} · {open.memo}</div>
            </div>
            <Btn variant="secondary" size="sm" onClick={() => setOpenId(null)}>Close</Btn>
          </div>
          <div style={{ overflow: "auto", flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <SubHead>Journal entry</SubHead>
              <div style={{ marginTop: 8 }}><JournalEntry journal={open} dense /></div>
            </div>
            <SourceDoc journal={open} onClose={() => setOpenId(null)} />
          </div>
        </Drawer>
      )}
    </>
  );
}
