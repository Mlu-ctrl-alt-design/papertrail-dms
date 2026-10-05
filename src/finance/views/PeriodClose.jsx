// Period close — the "auto" in requests 1 and 2.
//
// Three acts, not one. Depreciation and amortisation are runs owned by their own
// modules and can each be fired on their own, from here or from the screen that
// owns them. Closing is the third act and only locks what the runs produced — it
// refuses while either still owes the period something, which is the rule that
// makes "closed" mean anything.
//
// Every run is idempotent: whatever is already in the ledger is not due, so
// running twice posts nothing the second time.

import { useMemo, useState } from "react";
import {
  CheckmarkCircle20Filled, LockClosed20Regular, Play20Regular,
} from "@fluentui/react-icons";
import {
  Btn, C, Card, I, Modal, Pill, Stat, ViewHeader, useToast,
} from "../../components/index.js";
import {
  FY, addMonths, monthEnd, monthLabel, money, plural, prettyDate,
} from "../config.js";
import { amortisationPlan, depreciationPlan, monthEndPlan } from "../engine/actions.js";
import { useFinance } from "../state.js";
import { Hint, KeyValue, Page, Row, StatusPill, SubHead } from "../ui.jsx";
import { linkBtn } from "../styles.js";
import { RunModal, RunTable } from "./PeriodRun.jsx";

// "1 amortisation journal" rather than "0 depreciation and 1 amortisation
// journals" — a count of nothing is not news.
function outstandingPhrase(dep, amo) {
  const parts = [];
  if (dep.journalCount) parts.push(`${dep.journalCount} depreciation`);
  if (amo.journalCount) parts.push(`${amo.journalCount} amortisation`);
  const n = dep.journalCount + amo.journalCount;
  return `${parts.join(" and ")} ${n === 1 ? "journal" : "journals"}`;
}

export function PeriodCloseView() {
  const store = useFinance();
  const toast = useToast();
  const [running, setRunning] = useState(null); // "depreciation" | "amortisation"
  const [closing, setClosing] = useState(false);
  const [monthEndConfirm, setMonthEndConfirm] = useState(false);
  // What has actually been posted in this session, recorded as each run happens
  // rather than derived afterwards — once a run is done its plan is empty, so
  // there would be nothing left to derive it from.
  const [log, setLog] = useState(null);

  const period = store.openPeriod;
  const dep = useMemo(() => depreciationPlan(store, period), [store, period]);
  const amo = useMemo(() => amortisationPlan(store, period), [store, period]);
  const plan = useMemo(() => monthEndPlan(store, period), [store, period]);
  const ready = plan.journalCount === 0;

  const announce = (title, msg) =>
    toast(title, msg, { color: C.success, icon: <I as={CheckmarkCircle20Filled} size={16} color={C.success} /> });

  const record = (patch) =>
    setLog((prev) => ({ period, depreciation: null, amortisation: null, closed: false, ...(prev?.period === period ? prev : {}), ...patch }));

  const runOne = (kind) => {
    const ran = kind === "depreciation" ? store.runDepreciation(period) : store.runAmortisation(period);
    setRunning(null);
    record({ [kind]: { count: ran.journalCount, total: ran.total } });
    announce(
      `${kind === "depreciation" ? "Depreciation" : "Amortisation"} posted for ${monthLabel(ran.period)}`,
      `${plural(ran.journalCount, "journal")} · ${money(ran.total)}`,
    );
  };

  const close = () => {
    store.closePeriod(period);
    setClosing(false);
    record({ closed: true });
    announce(`${monthLabel(period)} closed`, `${monthLabel(addMonths(period, 1))} is now the open period`);
  };

  const runMonthEnd = () => {
    const outstanding = { depreciation: dep, amortisation: amo };
    const ran = store.runMonthEnd(period);
    setMonthEndConfirm(false);
    setLog({
      period,
      depreciation: { count: outstanding.depreciation.journalCount, total: outstanding.depreciation.total },
      amortisation: { count: outstanding.amortisation.journalCount, total: outstanding.amortisation.total },
      closed: true,
    });
    announce(
      `${monthLabel(period)} closed`,
      `${ran.depreciation.length} depreciation and ${ran.amortisation.length} amortisation journals posted`,
    );
  };

  const periods = useMemo(() => {
    const out = [];
    for (let m = 0; m < 12; m += 1) {
      const key = addMonths("2026-01", m);
      out.push({ key, closed: key <= store.closedThrough, open: key === store.openPeriod });
    }
    return out;
  }, [store.closedThrough, store.openPeriod]);

  return (
    <>
      <ViewHeader
        title="Period close"
        subtitle={`${FY.label} · books closed to ${prettyDate(monthEnd(store.closedThrough))}`}
        action={
          <Btn onClick={() => setMonthEndConfirm(true)} disabled={ready}>
            <I as={Play20Regular} size={14} /> Run all and close {monthLabel(period).replace(" 2026", "")}
          </Btn>
        }
      />
      <Page>
        <Row>
          <Stat label="Open period" value={monthLabel(period)}
                icon={<I as={LockClosed20Regular} size={14} color={C.muted} />} basis={190} />
          <Stat label="Depreciation to post" value={money(dep.total)}
                sub={dep.journalCount ? `${dep.journalCount} assets in service` : "Run for this period"} basis={200} />
          <Stat label="Amortisation to post" value={money(amo.total)}
                sub={amo.journalCount ? `${amo.journalCount} active deferrals` : "Run for this period"} basis={200} />
          <Stat label="Journals outstanding" value={String(plan.journalCount)}
                sub="One per asset and per deferral, so each balances in its own branch" basis={210} />
        </Row>

        {/* Derived against the books rather than just held in state: a Reset
            reopens the period, and a card saying it was posted would be a lie. */}
        {log && (log.period === period || log.period <= store.closedThrough) && (
          <RunResult log={log} onDismiss={() => setLog(null)} />
        )}

        <StepCard
          step={1}
          title={`Depreciation — ${monthLabel(period)}`}
          subtitle="One journal per asset: Dr Depreciation / Cr Accumulated depreciation"
          plan={dep}
          onRun={() => setRunning("depreciation")}
          onPick={(path) => store.go(path)}
          owner="Fixed Assets"
          ownerLink="assets"
          go={store.go}
        />

        <StepCard
          step={2}
          title={`Amortisation — ${monthLabel(period)}`}
          subtitle="One journal per deferral: Dr Expense / Cr Prepayment"
          plan={amo}
          onRun={() => setRunning("amortisation")}
          onPick={(path) => store.go(path)}
          owner="Deferred Expenses"
          ownerLink="deferrals"
          go={store.go}
        />

        <Card
          title={`3 · Close ${monthLabel(period)}`}
          subtitle="Locks the period and moves the open period on by one month"
          right={ready
            ? <Pill fg={C.success} bg={C.successBg}>Ready to close</Pill>
            : <Pill fg={C.warning} bg={C.warningBg}>{plan.journalCount} outstanding</Pill>}
          pad={14}
        >
          <Hint>
            {ready
              ? `Both runs are done for ${monthLabel(period)}. Closing locks it and makes ${monthLabel(addMonths(period, 1))} the open period.`
              : `${monthLabel(period)} cannot be closed yet — ${outstandingPhrase(dep, amo)} still to post. A period missing its own charges is not closed, it is just ignored.`}
          </Hint>
          <div style={{ marginTop: 12 }}>
            <Btn onClick={() => setClosing(true)} disabled={!ready}>
              <I as={LockClosed20Regular} size={14} /> Close {monthLabel(period)}
            </Btn>
          </div>
        </Card>

        <Card title={`${FY.label} periods`} pad={14}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {periods.map((p) => (
              <div key={p.key} style={{
                border: `1px solid ${p.open ? C.brand : C.hairline}`,
                background: p.closed ? C.successBg : p.open ? C.brandTint : "#fff",
                color: p.closed ? C.success : p.open ? C.brand : C.faint,
                borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {p.closed && <I as={CheckmarkCircle20Filled} size={13} />}
                {monthLabel(p.key).replace(" 2026", "")}
                {p.open && <span style={{ fontSize: 10, fontWeight: 700 }}>OPEN</span>}
              </div>
            ))}
          </div>
          <Hint>
            Closing a period posts nothing on its own — the runs do that. It records that the
            period is finished and moves the open period on, and it cannot be done twice.
          </Hint>
        </Card>
      </Page>

      {running && (
        <RunModal
          plan={running === "depreciation" ? dep : amo}
          onClose={() => setRunning(null)}
          onRun={() => runOne(running)}
        />
      )}

      {closing && (
        <Modal
          title={`Close ${monthLabel(period)}`}
          onClose={() => setClosing(false)}
          width={480}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setClosing(false)}>Cancel</Btn>
              <Btn onClick={close}>Close the period</Btn>
            </>
          }
        >
          <div style={{ padding: 20 }}>
            <SubHead>What closing does</SubHead>
            <div style={{ marginTop: 10 }}>
              <KeyValue label="Posts" width={160}>Nothing — the runs have already posted</KeyValue>
              <KeyValue label="Locks" width={160}>{monthLabel(period)}</KeyValue>
              <KeyValue label="Opens" width={160}>{monthLabel(addMonths(period, 1))}</KeyValue>
            </div>
            <Hint>
              The books are closed to the end of {monthLabel(period)} from here on, and the two runs
              start offering {monthLabel(addMonths(period, 1))} instead.
            </Hint>
          </div>
        </Modal>
      )}

      {monthEndConfirm && (
        <Modal
          title={`Run all and close ${monthLabel(period)}`}
          onClose={() => setMonthEndConfirm(false)}
          width={520}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setMonthEndConfirm(false)}>Cancel</Btn>
              <Btn onClick={runMonthEnd}>Post {plural(plan.journalCount, "journal")} and close</Btn>
            </>
          }
        >
          <div style={{ padding: 20 }}>
            <SubHead>The three steps, in order</SubHead>
            <div style={{ marginTop: 10 }}>
              <KeyValue label="1 · Depreciation" width={170}>
                {plural(dep.journalCount, "journal")} · {money(dep.total)}
              </KeyValue>
              <KeyValue label="2 · Amortisation" width={170}>
                {plural(amo.journalCount, "journal")} · {money(amo.total)}
              </KeyValue>
              <KeyValue label="3 · Close" width={170}>
                {monthLabel(period)} closed · {monthLabel(addMonths(period, 1))} open
              </KeyValue>
              <KeyValue label="Dated" width={170}>{prettyDate(monthEnd(period))}</KeyValue>
            </div>
            <Hint>
              The same three acts you can take one at a time, in one click. Nobody calculates
              anything: each asset and each deferral already knows what it owes this period from
              its own schedule.
            </Hint>
          </div>
        </Modal>
      )}
    </>
  );
}

// One run, with its own button. The run can equally be fired from the module
// that owns it, which the card says so that nobody thinks period close is the
// only way in.
function StepCard({ step, title, subtitle, plan, onRun, onPick, owner, ownerLink, go }) {
  const done = plan.journalCount === 0;
  return (
    <Card
      title={`${step} · ${title}`}
      subtitle={subtitle}
      right={done
        ? <Pill fg={C.success} bg={C.successBg}>Posted</Pill>
        : <Pill fg={C.warning} bg={C.warningBg}>{plural(plan.journalCount, "pending", "pending")}</Pill>}
      pad={14}
    >
      {done ? (
        <Hint>
          Nothing outstanding for this period. It was either run from here or from{" "}
          <button onClick={() => go(ownerLink)} style={{ ...linkBtn, fontSize: 11.5 }}>{owner}</button>,
          which owns this run.
        </Hint>
      ) : (
        <>
          <RunTable plan={plan} onPick={onPick} />
          <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Btn onClick={onRun}>
              <I as={Play20Regular} size={14} /> Run {plan.kind} — {money(plan.total)}
            </Btn>
            <span style={{ fontSize: 11.5, color: C.muted }}>
              Or run it from{" "}
              <button onClick={() => go(ownerLink)} style={{ ...linkBtn, fontSize: 11.5 }}>{owner}</button>.
            </span>
          </div>
        </>
      )}
    </Card>
  );
}

function RunResult({ log, onDismiss }) {
  const store = useFinance();
  const { period, depreciation, amortisation, closed } = log;
  return (
    <Card
      title={closed ? `${monthLabel(period)} posted and closed` : `${monthLabel(period)} — posted so far`}
      subtitle="What has gone into the ledger. These figures are now what every screen reads."
      right={closed ? <StatusPill status="closed" /> : <Pill fg={C.brand} bg={C.brandTint}>Still open</Pill>}
      pad={14}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <KeyValue label="Depreciation posted" width={200}>
          {depreciation
            ? `${plural(depreciation.count, "journal")} · ${money(depreciation.total)}`
            : "Not run from here"}
        </KeyValue>
        <KeyValue label="Amortisation posted" width={200}>
          {amortisation
            ? `${plural(amortisation.count, "journal")} · ${money(amortisation.total)}`
            : "Not run from here"}
        </KeyValue>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap" }}>
        <button onClick={() => store.go("assets")} style={linkBtn}>See the asset register →</button>
        <button onClick={() => store.go("deferrals")} style={linkBtn}>See the deferrals →</button>
        <button onClick={() => store.go("reports")} style={linkBtn}>See the statements →</button>
        <button onClick={onDismiss} style={{ ...linkBtn, color: C.muted }}>Dismiss</button>
      </div>
    </Card>
  );
}
