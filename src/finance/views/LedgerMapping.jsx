// Ledger entry mapping.
//
// The configuration that decides what a transaction debits and credits, laid out
// the way the Ezra360 ERP lays it out: a Summary of the module, the entity, what
// it posts to and the condition that selects it, then the GL Mapping Rule grid.
//
// This is not a picture of configuration. Every journal in the module is built
// from these rules, each posted line records which rule posted it, and the
// integrity script asserts that what landed in the ledger is what the rule asked
// for. Change a rule and the books change.

import { useMemo, useState } from "react";
import { ArrowLeft20Regular, Flow20Regular, Open20Regular } from "@fluentui/react-icons";
import {
  BP, Btn, C, Card, FluentSelect, I, Pill, Stat, ViewHeader, useMaxWidth,
} from "../../components/index.js";
import { prettyDate } from "../config.js";
import { accountName } from "../engine/coa.js";
import { LEDGER_MAPPINGS, MODULES, mapping } from "../engine/mapping.js";
import { useFinance } from "../state.js";
import { Hint, Num, Page, RegisterTable, Row, SubHead } from "../ui.jsx";
import { linkBtn } from "../styles.js";

// A field rendered as the ERP renders it: label on the left, a boxed read-only
// value on the right.
function SummaryField({ label, required, children, mono }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "7px 0" }}>
      <label style={{ width: 168, flexShrink: 0, paddingTop: 7, fontSize: 12, color: C.text }}>
        {label}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
      </label>
      <div style={{
        flex: 1, minWidth: 0, border: `1px solid ${C.hairline}`, borderRadius: 4,
        padding: "7px 10px", fontSize: 12.5, background: "#fff", color: C.ink,
        fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit",
        whiteSpace: mono ? "pre" : "normal", overflowX: mono ? "auto" : "visible",
        minHeight: 32, boxSizing: "border-box",
      }}>
        {children}
      </div>
    </div>
  );
}

export function LedgerMappingView() {
  const store = useFinance();
  const selected = store.route.rest[0] ? mapping(store.route.rest[0]) : null;
  if (selected) return <MappingDetail m={selected} />;
  return <MappingList />;
}

// How many journals each mapping has actually posted — configuration with a
// usage count beside it is a great deal easier to trust.
function useUsage() {
  const store = useFinance();
  return useMemo(() => {
    const counts = new Map();
    const latest = new Map();
    for (const j of store.ledger.journals) {
      if (!j.mappingId) continue;
      counts.set(j.mappingId, (counts.get(j.mappingId) || 0) + 1);
      const prev = latest.get(j.mappingId);
      if (!prev || j.date > prev) latest.set(j.mappingId, j.date);
    }
    return { counts, latest };
  }, [store.ledger]);
}

function MappingList() {
  const store = useFinance();
  const compact = useMaxWidth(BP.lg);
  const [module, setModule] = useState("all");
  const { counts, latest } = useUsage();

  const rows = LEDGER_MAPPINGS.filter((m) => module === "all" || m.module === module);
  const used = LEDGER_MAPPINGS.filter((m) => counts.get(m.id)).length;
  const posted = [...counts.values()].reduce((a, b) => a + b, 0);

  return (
    <>
      <ViewHeader
        title="Ledger mapping"
        subtitle={`${LEDGER_MAPPINGS.length} ledger entry mappings · ${posted} journals posted from them`}
      />
      <Page>
        <Row>
          <Stat label="Mappings" value={String(LEDGER_MAPPINGS.length)}
                icon={<I as={Flow20Regular} size={14} color={C.muted} />}
                sub={`${MODULES.length} modules`} basis={180} />
          <Stat label="In use" value={`${used} of ${LEDGER_MAPPINGS.length}`}
                sub="The rest are configured and waiting for a transaction" basis={210} />
          <Stat label="Journals posted from a mapping" value={String(posted)}
                sub="Every journal in the ledger — nothing posts without a rule" basis={240} />
        </Row>

        <Card
          title="Ledger entry mappings"
          subtitle="Module · entity · the condition that selects the rule"
          right={
            <FluentSelect
              size="sm" value={module} style={{ width: 200 }}
              options={[{ value: "all", label: "All modules" }, ...MODULES.map((m) => ({ value: m, label: m }))]}
              onChange={(e) => setModule(String(e.target.value))}
            />
          }
          pad={compact ? 8 : 14}
        >
          <RegisterTable
            totals={false}
            getKey={(m) => m.id}
            rows={rows}
            onRowClick={(m) => store.go(`mapping/${m.id}`)}
            columns={[
              {
                id: "name", label: "Name",
                render: (m) => (
                  <div>
                    <div style={{ fontWeight: 600, color: C.ink }}>{m.name}</div>
                    <div style={{ fontSize: 10.5, color: C.faint }}>{m.id}</div>
                  </div>
                ),
              },
              { id: "module", label: "Module", render: (m) => m.module },
              { id: "entity", label: "Entity", render: (m) => m.entity },
              {
                id: "condition", label: "Condition",
                render: (m) => (
                  <code style={{ fontSize: 11, color: C.muted, fontFamily: "ui-monospace, Menlo, monospace" }}>
                    {m.condition}
                  </code>
                ),
              },
              {
                id: "rules", label: "Rules", align: "right",
                render: (m) => (m.openEnded
                  ? <span style={{ color: C.faint, fontSize: 11.5 }}>open</span>
                  : m.rules.length),
              },
              {
                id: "used", label: "Journals", align: "right",
                render: (m) => (counts.get(m.id)
                  ? <strong>{counts.get(m.id)}</strong>
                  : <span style={{ color: C.faint }}>—</span>),
              },
              {
                id: "last", label: "Last posted",
                render: (m) => (latest.get(m.id)
                  ? prettyDate(latest.get(m.id))
                  : <span style={{ color: C.faint }}>—</span>),
              },
            ]}
          />
        </Card>

        <Card title="The pair worth opening" pad={14}>
          <Hint>
            <strong>Accounts Payable | Invoice</strong> and <strong>Accounts Payable | Deferred
            Invoice</strong> are the same document and the same grid shape. The only difference
            between them is the condition — <code>IsDeferred</code> — and which account field the
            debit line resolves against. That one line of configuration is the whole of the client&rsquo;s
            second request.
          </Hint>
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn variant="ghost" size="sm" onClick={() => store.go("mapping/AP-INV-STD")}>
              Ordinary invoice <I as={Open20Regular} size={13} />
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => store.go("mapping/AP-INV-DEF")}>
              Deferred invoice <I as={Open20Regular} size={13} />
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => store.go("mapping/AP-PAY")}>
              Payment, with the exchange difference <I as={Open20Regular} size={13} />
            </Btn>
          </div>
        </Card>
      </Page>
    </>
  );
}

function MappingDetail({ m }) {
  const store = useFinance();
  const { counts } = useUsage();

  const journals = useMemo(
    () => store.ledger.journals.filter((j) => j.mappingId === m.id).slice(-6).reverse(),
    [store.ledger, m.id],
  );

  return (
    <>
      <ViewHeader
        title={m.name}
        subtitle={`${m.module} · ${m.entity} · ${counts.get(m.id) || 0} journals posted`}
        action={
          <Btn variant="secondary" onClick={() => store.go("mapping")}>
            <I as={ArrowLeft20Regular} size={14} /> Back to mappings
          </Btn>
        }
      />
      <Page>
        <Card title="Summary" pad={16}>
          <SummaryField label="Name" required>{m.name}</SummaryField>
          <SummaryField label="Module">{m.module}</SummaryField>
          <SummaryField label="Post To" required>{m.postTo}</SummaryField>
          <SummaryField label="Entity (Transaction Type)" required>{m.entity}</SummaryField>
          <SummaryField label="Transaction Type">{m.transactionType}</SummaryField>
          <SummaryField label="Sale Type">
            {m.saleType || <span style={{ color: C.faint }}>Choose option</span>}
          </SummaryField>
          <SummaryField label="Condition" required>{m.condition}</SummaryField>
          <SummaryField label="Ezra QL Condition" mono>
            {JSON.stringify(m.ezraQl, null, 2)}
          </SummaryField>
        </Card>

        <Card
          title="GL Mapping Rule"
          subtitle={m.openEnded
            ? "Open-ended: the lines come from the document rather than from a fixed grid"
            : `${m.rules.length} lines · an account is either fixed or resolved from a field on the document`}
          right={<Pill fg={C.muted} bg={C.surfaceMute}>{m.openEnded ? "No grid" : `${m.rules.length} rules`}</Pill>}
          pad={14}
        >
          {m.openEnded ? (
            <Hint>{m.note}</Hint>
          ) : (
            <RegisterTable
              totals={false}
              getKey={(r) => r.name}
              rows={m.rules}
              columns={[
                { id: "name", label: "Name", render: (r) => <strong style={{ color: C.brand }}>{r.name}</strong> },
                { id: "location", label: "MappingLocationId", render: (r) => r.location },
                {
                  id: "entry", label: "Entry Type",
                  render: (r) => (
                    <Pill fg={r.entryType === "Debit" ? C.brand : "#8764b8"} bg="#fff" outline>
                      {r.entryType}{r.signed ? " / Credit" : ""}
                    </Pill>
                  ),
                },
                {
                  id: "account", label: "Account Id",
                  render: (r) => (r.account
                    ? <span>{r.account} · {accountName(r.account)}</span>
                    : <span style={{ color: C.faint }}>—</span>),
                },
                {
                  id: "related", label: "Related Entity",
                  render: (r) => (r.relatedEntity || <span style={{ color: C.faint }}>—</span>),
                },
                {
                  id: "field", label: "Account Field Id",
                  render: (r) => (r.accountField
                    ? <code style={{ fontSize: 11.5, fontFamily: "ui-monospace, Menlo, monospace" }}>{r.accountField}</code>
                    : <span style={{ color: C.faint }}>—</span>),
                },
                {
                  id: "data", label: "Data Field",
                  render: (r) => (
                    <code style={{ fontSize: 11.5, fontFamily: "ui-monospace, Menlo, monospace" }}>{r.dataField}</code>
                  ),
                },
              ]}
            />
          )}
          {!m.openEnded && (
            <div style={{ marginTop: 12 }}>
              <Hint>
                A rule with an <strong>Account Id</strong> always posts to that account. A rule with an{" "}
                <strong>Account Field Id</strong> resolves the account off the document at posting
                time — the asset category&rsquo;s cost account, the invoice&rsquo;s expense account, the bank
                the payment was made from.
                {m.rules.some((r) => r.signed) && (
                  <> One rule here is <strong>signed</strong>: it posts as a debit when the amount is
                  positive and as a credit when it is negative, and drops out entirely when the amount
                  is nil. That is how one rule covers a gain, a loss and no difference at all.</>
                )}
              </Hint>
            </div>
          )}
        </Card>

        {m.note && !m.openEnded && (
          <Card title="What this mapping is for" pad={14}><Hint>{m.note}</Hint></Card>
        )}

        <Card
          title={`Journals posted by this mapping (${counts.get(m.id) || 0})`}
          subtitle={journals.length ? "The six most recent" : undefined}
          pad={14}
        >
          {journals.length === 0 ? (
            <Hint>Nothing has been posted through this mapping yet.</Hint>
          ) : (
            <RegisterTable
              totals={false}
              getKey={(j) => j.id}
              rows={journals}
              columns={[
                {
                  id: "ref", label: "Reference",
                  render: (j) => (
                    <button onClick={() => store.go("journals")} style={{ ...linkBtn, fontSize: 12.5 }}>
                      {j.ref}
                    </button>
                  ),
                },
                { id: "date", label: "Date", render: (j) => prettyDate(j.date) },
                { id: "memo", label: "Narration", render: (j) => j.memo },
                {
                  id: "lines", label: "Lines", align: "right",
                  render: (j) => j.lines.length,
                },
                {
                  id: "amount", label: "Debit", align: "right",
                  render: (j) => <Num value={j.lines.reduce((a, l) => a + l.debit, 0)} />,
                },
              ]}
            />
          )}
          <div style={{ marginTop: 12 }}>
            <SubHead>Rule by rule</SubHead>
            <div style={{ marginTop: 6 }}>
              <Hint>
                Every posted line records the rule that posted it, which is what lets the integrity
                script assert that the account in the ledger is the account the rule asked for. Open
                any journal in the General Ledger to see the rule names against the lines.
              </Hint>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => store.go("ledger")} style={linkBtn}>Open the general ledger →</button>
              <button onClick={() => store.go("accounts")} style={linkBtn}>Open the chart of accounts →</button>
            </div>
          </div>
        </Card>
      </Page>
    </>
  );
}
