// Chart of accounts.
//
// The account masterfile, the account types behind it, and — because this is a
// live ledger rather than a setup form — the balance and the number of postings
// on each account, with a link straight into its general ledger.

import { useMemo, useState } from "react";
import { Database20Regular, Open20Regular } from "@fluentui/react-icons";
import {
  BP, Btn, C, Card, FluentSelect, I, Pill, Stat, Tabs, ViewHeader, useMaxWidth,
} from "../../components/index.js";
import { BASE_CURRENCY, TODAY, money, prettyDate, scopeLabel } from "../config.js";
import { ACCOUNTS, isContra, naturalSign, normalSide } from "../engine/coa.js";
import { generalLedger } from "../engine/ledger.js";
import { LEDGER_MAPPINGS } from "../engine/mapping.js";
import { useFinance } from "../state.js";
import { Hint, Num, Page, RegisterTable, Row, SubHead } from "../ui.jsx";

const TYPES = [
  { id: "asset", label: "Asset", statement: "Balance sheet", normal: "Debit", tone: C.brand },
  { id: "liability", label: "Liability", statement: "Balance sheet", normal: "Credit", tone: "#8764b8" },
  { id: "equity", label: "Equity", statement: "Balance sheet", normal: "Credit", tone: "#005a9e" },
  { id: "income", label: "Income", statement: "Profit & loss", normal: "Credit", tone: C.success },
  { id: "cos", label: "Cost of sales", statement: "Profit & loss", normal: "Debit", tone: C.warning },
  { id: "expense", label: "Expense", statement: "Profit & loss", normal: "Debit", tone: C.danger },
];

const typeOf = (id) => TYPES.find((t) => t.id === id);

const CF_LABEL = {
  cash: "Cash and equivalents",
  operating: "Operating",
  investing: "Investing",
  financing: "Financing",
};

// Which mappings can post to an account — read off the mapping rules, so a new
// rule shows up here without anyone maintaining a list.
function mappingsTouching(code) {
  return LEDGER_MAPPINGS.filter((m) => m.rules.some((r) => r.account === code));
}

export function ChartOfAccountsView() {
  const store = useFinance();
  const compact = useMaxWidth(BP.lg);
  const [tab, setTab] = useState("accounts");
  const [type, setType] = useState("all");

  const asAt = TODAY > `${store.closedThrough}-31` ? TODAY : `${store.closedThrough}-31`;

  const balances = useMemo(
    () => new Map(generalLedger(store.ledger, { scope: store.scope, to: asAt }).map((r) => [r.code, r])),
    [store.ledger, store.scope, asAt],
  );

  const rows = useMemo(
    () => ACCOUNTS
      .filter((a) => type === "all" || a.type === type)
      .map((a) => ({ account: a, gl: balances.get(a.code) })),
    [type, balances],
  );

  const byType = TYPES.map((t) => ({
    type: t,
    count: ACCOUNTS.filter((a) => a.type === t.id).length,
  }));

  return (
    <>
      <ViewHeader
        title="Chart of accounts"
        subtitle={`${ACCOUNTS.length} accounts · ${TYPES.length} account types · balances for ${scopeLabel(store.scope)} at ${prettyDate(asAt)}`}
      />
      <div style={{ padding: "0 20px", background: "#fff", borderBottom: `1px solid ${C.hairline}`, flexShrink: 0 }}>
        <Tabs
          items={[
            { id: "accounts", label: "Accounts", count: ACCOUNTS.length },
            { id: "types", label: "Account types", count: TYPES.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <Page>
        {tab === "accounts" ? (
          <>
            <Row>
              {["asset", "liability", "equity"].map((t) => {
                const total = ACCOUNTS.filter((a) => a.type === t)
                  .reduce((sum, a) => sum + (balances.get(a.code)?.closing || 0) * naturalSign(a.code), 0);
                return (
                  <Stat key={t} label={typeOf(t).label} value={money(total)}
                        sub={`${ACCOUNTS.filter((a) => a.type === t).length} accounts`} basis={190} />
                );
              })}
              <Stat
                label="Accounts with postings"
                value={`${ACCOUNTS.filter((a) => (balances.get(a.code)?.entries || 0) > 0).length} of ${ACCOUNTS.length}`}
                icon={<I as={Database20Regular} size={14} color={C.muted} />}
                sub="Every other account is configured and ready" basis={220}
              />
            </Row>

            <Card
              title="Accounts"
              subtitle="Click an account to open its general ledger"
              right={
                <FluentSelect
                  size="sm" value={type} style={{ width: 180 }}
                  options={[{ value: "all", label: "All account types" },
                            ...TYPES.map((t) => ({ value: t.id, label: t.label }))]}
                  onChange={(e) => setType(String(e.target.value))}
                />
              }
              pad={compact ? 8 : 14}
            >
              <RegisterTable
                totals={false}
                getKey={(r) => r.account.code}
                rows={rows}
                onRowClick={(r) => store.go(`ledger/${r.account.code}`)}
                columns={[
                  { id: "code", label: "Code", width: 70, render: (r) => <strong>{r.account.code}</strong> },
                  {
                    id: "name", label: "Account",
                    render: (r) => (
                      <div>
                        <div style={{ fontWeight: 600, color: C.ink }}>{r.account.name}</div>
                        {mappingsTouching(r.account.code).length > 0 && (
                          <div style={{ fontSize: 10.5, color: C.faint }}>
                            Posted to by {mappingsTouching(r.account.code).length} ledger{" "}
                            {mappingsTouching(r.account.code).length === 1 ? "mapping" : "mappings"}
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    id: "type", label: "Type",
                    render: (r) => {
                      const t = typeOf(r.account.type);
                      return <Pill fg={t.tone} bg="#fff" outline>{t.label}</Pill>;
                    },
                  },
                  {
                    id: "normal", label: "Normal", render: (r) => (
                      <span style={{ fontSize: 11.5, color: C.muted }}>
                        {normalSide(r.account.code)}
                        {isContra(r.account.code) && (
                          <span style={{ color: C.faint }}> · contra</span>
                        )}
                      </span>
                    ),
                  },
                  {
                    id: "cf", label: "Cash flow", render: (r) => (
                      <span style={{ fontSize: 11.5, color: C.muted }}>{CF_LABEL[r.account.cf]}</span>
                    ),
                  },
                  {
                    id: "entries", label: "Entries", align: "right",
                    render: (r) => (r.gl.entries
                      ? <span style={{ fontSize: 12 }}>{r.gl.entries}</span>
                      : <span style={{ color: C.faint }}>—</span>),
                  },
                  {
                    // Shown the way a trial balance shows it: a magnitude and the
                    // side it sits on, so a credit balance on an asset account
                    // reads as a credit rather than as a negative asset.
                    id: "balance", label: `Balance (${BASE_CURRENCY})`, align: "right",
                    render: (r) => (r.gl.closing === 0
                      ? <span style={{ color: C.faint }}>—</span>
                      : (
                        <span style={{ whiteSpace: "nowrap" }}>
                          <Num value={Math.abs(r.gl.closing)} weight={600} />
                          <span style={{ fontSize: 10.5, color: C.muted, marginLeft: 5 }}>
                            {r.gl.closing > 0 ? "Dr" : "Cr"}
                          </span>
                        </span>
                      )),
                  },
                  {
                    id: "go", label: "", align: "right",
                    render: () => (
                      <span style={{ color: C.brand, display: "inline-flex" }}>
                        <I as={Open20Regular} size={13} />
                      </span>
                    ),
                  },
                ]}
              />
            </Card>

            <Card title="Why the balance column reads the way it does" pad={14}>
              <Hint>
                Each balance is shown as a magnitude and the side it sits on, the way a trial balance
                shows it — so Accounts Payable of{" "}
                {money(Math.abs(balances.get("2010")?.closing || 0))} reads as a credit, and
                accumulated depreciation reads as a credit on an asset account rather than as a
                negative asset. Underneath, the ledger holds one signed figure per line: debits less
                credits, and nothing else.
              </Hint>
            </Card>
          </>
        ) : (
          <>
            <Card title="Account types" subtitle="What each type means for the statements" pad={14}>
              <RegisterTable
                totals={false}
                getKey={(r) => r.type.id}
                rows={byType}
                onRowClick={(r) => { setType(r.type.id); setTab("accounts"); }}
                columns={[
                  {
                    id: "type", label: "Type",
                    render: (r) => <Pill fg={r.type.tone} bg="#fff" outline>{r.type.label}</Pill>,
                  },
                  { id: "statement", label: "Appears on", render: (r) => r.type.statement },
                  { id: "normal", label: "Normal balance", render: (r) => r.type.normal },
                  {
                    id: "carried", label: "Carried forward",
                    render: (r) => (["asset", "liability", "equity"].includes(r.type.id)
                      ? "Yes — cumulative"
                      : "No — reset each financial year"),
                  },
                  { id: "count", label: "Accounts", align: "right", render: (r) => r.count },
                ]}
              />
            </Card>

            <Card title="Cash-flow classification" pad={14}>
              <Hint>
                Each account also carries where it sits on the cash flow statement. Every account that
                is not a bank account belongs to exactly one line of it, which is what lets the cash
                flow be derived rather than hand-built — and why its closing figure can never drift
                from the bank balance.
              </Hint>
              <div style={{ marginTop: 12 }}>
                <RegisterTable
                  totals={false}
                  getKey={(r) => r.id}
                  rows={Object.entries(CF_LABEL).map(([id, label]) => ({
                    id, label, accounts: ACCOUNTS.filter((a) => a.cf === id),
                  }))}
                  columns={[
                    { id: "label", label: "Classification", render: (r) => <strong>{r.label}</strong> },
                    { id: "count", label: "Accounts", align: "right", render: (r) => r.accounts.length },
                    {
                      id: "which", label: "Which",
                      render: (r) => (
                        <span style={{ fontSize: 11.5, color: C.muted }}>
                          {r.accounts.map((a) => a.code).join(" · ")}
                        </span>
                      ),
                    },
                  ]}
                />
              </div>
            </Card>

            <Card title="Where the accounts are used" pad={14}>
              <SubHead>Ledger entry mappings</SubHead>
              <div style={{ marginTop: 8 }}>
                <Hint>
                  Nothing in this module decides on its own what to debit and what to credit. Every
                  posting comes from a ledger entry mapping, and a mapping names either a fixed
                  account or a field on the document that carries one.
                </Hint>
              </div>
              <div style={{ marginTop: 12 }}>
                <Btn variant="ghost" size="sm" onClick={() => store.go("mapping")}>
                  Open ledger mapping <I as={Open20Regular} size={13} />
                </Btn>
              </div>
            </Card>
          </>
        )}
      </Page>
    </>
  );
}
