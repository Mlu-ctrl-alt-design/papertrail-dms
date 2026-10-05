// Period close — the "auto" in requests 1 and 2.
//
// A review step that lists everything the run will post before it posts
// anything, then two batches of journals: depreciation for every asset in
// service, amortisation for every active deferral. The run is idempotent: a
// period that has been closed cannot be run again.

import { useMemo, useState } from "react";
import {
  CheckmarkCircle20Filled, LockClosed20Regular, Play20Regular,
} from "@fluentui/react-icons";
import {
  Btn, C, Card, I, Modal, Pill, Stat, ViewHeader, useToast,
} from "../../components/index.js";
import {
  FY, addMonths, branchName, companyShort, monthEnd, monthLabel, money, prettyDate,
} from "../config.js";
import { monthEndPlan } from "../engine/actions.js";
import { useFinance } from "../state.js";
import {
  Hint, KeyValue, Num, Page, RegisterTable, Row, StatusPill, SubHead,
} from "../ui.jsx";
import { linkBtn } from "../styles.js";

export function PeriodCloseView() {
  const store = useFinance();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState(null);

  const period = store.openPeriod;
  const plan = useMemo(() => monthEndPlan(store, period), [store, period]);

  const run = () => {
    const ran = store.runMonthEnd(period);
    setConfirming(false);
    setResult({ period, plan: ran });
    toast(
      `${monthLabel(period)} closed`,
      `${ran.depreciation.length} depreciation and ${ran.amortisation.length} amortisation journals posted`,
      { color: C.success, icon: <I as={CheckmarkCircle20Filled} size={16} color={C.success} /> },
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
          <Btn onClick={() => setConfirming(true)} disabled={plan.journalCount === 0}>
            <I as={Play20Regular} size={14} /> Run {monthLabel(period)} month-end
          </Btn>
        }
      />
      <Page>
        <Row>
          <Stat label="Open period" value={monthLabel(period)}
                icon={<I as={LockClosed20Regular} size={14} color={C.muted} />} basis={190} />
          <Stat label="Depreciation to post" value={money(plan.depreciationTotal)}
                sub={`${plan.depreciation.length} assets in service`} basis={200} />
          <Stat label="Amortisation to post" value={money(plan.amortisationTotal)}
                sub={`${plan.amortisation.length} active deferrals`} basis={200} />
          <Stat label="Journals" value={String(plan.journalCount)}
                sub="One per asset and per deferral, so each balances in its own branch" basis={210} />
        </Row>

        {/* Derived rather than cleared: a Reset reopens the period, and a card
            saying it was posted would then be a lie. */}
        {result && result.period <= store.closedThrough && (
          <RunResult result={result} onDismiss={() => setResult(null)} />
        )}

        {plan.journalCount === 0 ? (
          <Card title={`Nothing to post for ${monthLabel(period)}`} pad={16}>
            <Hint>
              Every asset in service and every active deferral has already been processed for this
              period. The run is idempotent — it will not post a second time.
            </Hint>
          </Card>
        ) : (
          <>
            <Card
              title={`Depreciation — ${monthLabel(period)}`}
              subtitle="One journal per asset: Dr Depreciation / Cr Accumulated depreciation"
              right={<Pill fg={C.warning} bg={C.warningBg}>Pending</Pill>}
              pad={14}
            >
              <RegisterTable
                getKey={(r) => r.asset.id}
                rows={plan.depreciation}
                onRowClick={(r) => store.go(`assets/${r.asset.id}`)}
                columns={[
                  {
                    id: "asset", label: "Asset",
                    render: (r) => (
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.asset.name}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{r.asset.tag}</div>
                      </div>
                    ),
                    total: (rs) => `${rs.length} assets`,
                  },
                  {
                    id: "where", label: "Company · branch",
                    render: (r) => (
                      <span style={{ fontSize: 11.5, color: C.muted }}>
                        {companyShort(r.asset.company)} · {branchName(r.asset.company, r.asset.branch)}
                      </span>
                    ),
                  },
                  { id: "n", label: "Charge", render: (r) => `${r.n} of ${r.of}` },
                  {
                    id: "amount", label: "Amount", align: "right",
                    render: (r) => <Num value={r.amount} weight={600} />,
                    total: () => <Num value={plan.depreciationTotal} weight={700} />,
                  },
                ]}
              />
            </Card>

            <Card
              title={`Amortisation — ${monthLabel(period)}`}
              subtitle="One journal per deferral: Dr Expense / Cr Prepayment"
              right={<Pill fg={C.warning} bg={C.warningBg}>Pending</Pill>}
              pad={14}
            >
              <RegisterTable
                getKey={(r) => r.deferral.id}
                rows={plan.amortisation}
                onRowClick={(r) => store.go(`deferrals/${r.deferral.id}`)}
                columns={[
                  {
                    id: "item", label: "Deferred expense",
                    render: (r) => (
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.deferral.description}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{r.deferral.supplier}</div>
                      </div>
                    ),
                    total: (rs) => `${rs.length} items`,
                  },
                  {
                    id: "where", label: "Company · branch",
                    render: (r) => (
                      <span style={{ fontSize: 11.5, color: C.muted }}>
                        {companyShort(r.deferral.company)} · {branchName(r.deferral.company, r.deferral.branch)}
                      </span>
                    ),
                  },
                  { id: "n", label: "Release", render: (r) => `${r.n} of ${r.of}` },
                  {
                    id: "amount", label: "Amount", align: "right",
                    render: (r) => <Num value={r.amount} weight={600} />,
                    total: () => <Num value={plan.amortisationTotal} weight={700} />,
                  },
                ]}
              />
            </Card>
          </>
        )}

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
            Closing a period posts its depreciation and amortisation and moves the open period on by
            one month. The books cannot be closed twice, and a journal cannot be posted into a
            closed period by the run.
          </Hint>
        </Card>
      </Page>

      {confirming && (
        <Modal
          title={`Run ${monthLabel(period)} month-end`}
          onClose={() => setConfirming(false)}
          width={520}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setConfirming(false)}>Cancel</Btn>
              <Btn onClick={run}>Post {plan.journalCount} journals</Btn>
            </>
          }
        >
          <div style={{ padding: 20 }}>
            <SubHead>This run will post</SubHead>
            <div style={{ marginTop: 10 }}>
              <KeyValue label="Depreciation" width={190}>
                {plan.depreciation.length} journals · {money(plan.depreciationTotal)}
              </KeyValue>
              <KeyValue label="Amortisation" width={190}>
                {plan.amortisation.length} journals · {money(plan.amortisationTotal)}
              </KeyValue>
              <KeyValue label="Dated" width={190}>{prettyDate(monthEnd(period))}</KeyValue>
              <KeyValue label="After the run" width={190}>
                {monthLabel(period)} closed · {monthLabel(addMonths(period, 1))} open
              </KeyValue>
            </div>
            <Hint>
              Nobody calculates anything. Each asset and each deferral already knows what it owes
              this period from its own schedule; the run simply posts it.
            </Hint>
          </div>
        </Modal>
      )}
    </>
  );
}

function RunResult({ result, onDismiss }) {
  const store = useFinance();
  const { period, plan } = result;
  return (
    <Card
      title={`${monthLabel(period)} posted`}
      subtitle="Both batches are in the ledger. The figures below are now what every screen reads."
      right={<StatusPill status="closed" />}
      pad={14}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <KeyValue label="Depreciation posted" width={200}>
          {plan.depreciation.length} journals · {money(plan.depreciationTotal)}
        </KeyValue>
        <KeyValue label="Amortisation posted" width={200}>
          {plan.amortisation.length} journals · {money(plan.amortisationTotal)}
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
