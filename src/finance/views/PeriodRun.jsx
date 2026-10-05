// The period-end runs, shared by the three screens that can fire them.
//
// Depreciation belongs to Fixed Assets, amortisation belongs to Deferred
// Expenses, and Period Close can fire either and then lock the period. All three
// show the same review step first: every line the run will post, before it posts
// anything. Nobody should have to take "it posts automatically" on trust.

import { Btn, C, I, Modal, Pill } from "../../components/index.js";
import { Play20Regular } from "@fluentui/react-icons";
import { branchName, companyShort, monthEnd, monthLabel, money, plural, prettyDate } from "../config.js";
import { mappingName } from "../engine/mapping.js";
import { Hint, KeyValue, Num, RegisterTable, SubHead } from "../ui.jsx";
import { RUNS } from "../runs.js";

export function RunTable({ plan, onPick }) {
  const spec = RUNS[plan.kind];
  return (
    <RegisterTable
      getKey={(r) => spec.subject(r).id}
      rows={plan.rows}
      onRowClick={onPick ? (r) => onPick(spec.link(r)) : undefined}
      columns={[
        {
          id: "subject", label: spec.noun === "asset" ? "Asset" : "Deferred expense",
          render: (r) => (
            <div>
              <div style={{ fontWeight: 600 }}>{spec.title(r)}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{spec.sub(r)}</div>
            </div>
          ),
          total: (rs) => `${rs.length} ${rs.length === 1 ? spec.noun : `${spec.noun}s`}`,
        },
        {
          id: "where", label: "Company · branch",
          render: (r) => {
            const s = spec.subject(r);
            return (
              <span style={{ fontSize: 11.5, color: C.muted }}>
                {companyShort(s.company)} · {branchName(s.company, s.branch)}
              </span>
            );
          },
        },
        { id: "n", label: spec.counter, render: (r) => `${r.n} of ${r.of}` },
        {
          id: "amount", label: "Amount", align: "right",
          render: (r) => <Num value={r.amount} weight={600} />,
          total: () => <Num value={plan.total} weight={700} />,
        },
      ]}
    />
  );
}

// The review step. `plan` comes from depreciationPlan() or amortisationPlan(),
// so what is listed here is exactly what will be posted.
export function RunModal({ plan, onRun, onClose }) {
  const spec = RUNS[plan.kind];
  return (
    <Modal
      title={`Run ${spec.label.toLowerCase()} — ${monthLabel(plan.period)}`}
      onClose={onClose}
      width={720}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={onRun} disabled={plan.journalCount === 0}>
            <I as={Play20Regular} size={14} /> Post {plural(plan.journalCount, "journal")}
          </Btn>
        </>
      }
    >
      <div style={{ padding: 20 }}>
        <SubHead right={<Pill fg={C.warning} bg={C.warningBg}>Nothing posted yet</Pill>}>
          This run will post
        </SubHead>
        <div style={{ marginTop: 10 }}>
          <KeyValue label="Journals" width={150}>
            {plural(plan.journalCount, "journal")} · one per {spec.noun}, so each balances in its own branch
          </KeyValue>
          <KeyValue label="Total" width={150}>{money(plan.total)}</KeyValue>
          <KeyValue label="Dated" width={150}>{prettyDate(monthEnd(plan.period))}</KeyValue>
          <KeyValue label="Posting" width={150}>{spec.posting}</KeyValue>
          <KeyValue label="Ledger mapping" width={150}>{mappingName(spec.mappingId)}</KeyValue>
        </div>
        {plan.journalCount > 0 && (
          <div style={{ marginTop: 16, maxHeight: 320, overflow: "auto" }}>
            <RunTable plan={plan} />
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <Hint>
            Nobody calculates anything. Each {spec.noun} already knows what it owes this period
            from its own schedule; the run posts it. Running it again posts nothing — whatever is
            already in the ledger is not due.
          </Hint>
        </div>
      </div>
    </Modal>
  );
}

// The button, with the count on it, for the screens that own a run.
export function RunButton({ plan, onClick, variant = "primary" }) {
  const spec = RUNS[plan.kind];
  const nothing = plan.journalCount === 0;
  return (
    <Btn variant={nothing ? "secondary" : variant} onClick={onClick} disabled={nothing}>
      <I as={Play20Regular} size={14} />
      {nothing
        ? `${spec.label} posted for ${monthLabel(plan.period).replace(" 2026", "")}`
        : `Run ${spec.label.toLowerCase()} — ${monthLabel(plan.period).replace(" 2026", "")}`}
    </Btn>
  );
}
