// Fixed assets — request 1.
//
// The register, the asset record with its full depreciation schedule, and the
// side panel that capitalises a new asset live. Nothing on this screen is stored:
// accumulated depreciation and NBV are read back out of the journals the asset
// has produced, which is why the register total always equals the balance sheet.

import { useMemo, useState } from "react";
import { Add20Regular, ArrowLeft20Regular, Box20Regular } from "@fluentui/react-icons";
import {
  BP, Btn, C, Card, Field, FluentSelect, FormDrawer, I, Pill, Stat,
  TextField, ViewHeader, useMaxWidth, useToast,
} from "../../components/index.js";
import {
  ALL_BRANCHES, branchName, companyShort, monthLabel, monthStart,
  money, prettyDate, scopeLabel,
} from "../config.js";
import { ASSET_CATEGORIES, assetCategory } from "../engine/coa.js";
import {
  accumulated, assetLines, monthlyCharge, monthsRemaining, nbv, postedPeriods,
  schedule,
} from "../engine/assets.js";
import { journalById } from "../engine/ledger.js";
import { useFinance } from "../state.js";
import {
  Collapse, Hint, JournalEntry, KeyValue, Num, Page, RegisterTable, Row,
  ScheduleTable, StatusPill, SubHead,
} from "../ui.jsx";
import { ASSET_B_INPUT } from "../seed/scripted.js";

export function AssetsView() {
  const store = useFinance();
  const selectedId = store.route.rest[0];
  const asset = selectedId ? store.assets.find((a) => a.id === selectedId) : null;
  if (asset) return <AssetDetail asset={asset} />;
  return <AssetRegister />;
}

// ─── Register ─────────────────────────────────────────────────────────────────

function AssetRegister() {
  const store = useFinance();
  const toast = useToast();
  const compact = useMaxWidth(BP.lg);
  const [category, setCategory] = useState("all");
  const [newOpen, setNewOpen] = useState(false);

  const rows = useMemo(() => {
    const { company, branch } = store.scope;
    return store.assets
      .filter((a) => (!company || a.company === company) && (!branch || a.branch === branch))
      .filter((a) => category === "all" || a.categoryId === category)
      .map((a) => ({
        asset: a,
        cost: a.cost,
        accum: accumulated(store.ledger, a),
        nbv: nbv(store.ledger, a),
        monthly: monthlyCharge(a),
        remaining: monthsRemaining(store.ledger, a),
      }));
  }, [store.assets, store.ledger, store.scope, category]);

  const totals = rows.reduce(
    (a, r) => ({ cost: a.cost + r.cost, accum: a.accum + r.accum, nbv: a.nbv + r.nbv, monthly: a.monthly + r.monthly }),
    { cost: 0, accum: 0, nbv: 0, monthly: 0 },
  );

  const columns = [
    {
      id: "tag", label: "Asset", width: 300,
      render: (r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: C.ink }}>{r.asset.name}</div>
          <div style={{ fontSize: 11, color: C.muted }}>
            {r.asset.tag} · {assetCategory(r.asset.categoryId).name}
            {r.asset.createdLive && <Pill fg={C.brand} bg={C.brandTint} style={{ marginLeft: 6 }}>New</Pill>}
          </div>
        </div>
      ),
      total: (rs) => `${rs.length} ${rs.length === 1 ? "asset" : "assets"}`,
    },
    {
      id: "where", label: "Company · branch",
      render: (r) => (
        <span style={{ color: C.muted, fontSize: 11.5 }}>
          {companyShort(r.asset.company)} · {branchName(r.asset.company, r.asset.branch)}
        </span>
      ),
    },
    { id: "inService", label: "In service", render: (r) => prettyDate(r.asset.inService) },
    { id: "cost", label: "Cost", align: "right", render: (r) => <Num value={r.cost} />, total: () => <Num value={totals.cost} weight={700} /> },
    { id: "monthly", label: "Monthly", align: "right", render: (r) => <Num value={r.monthly} />, total: () => <Num value={totals.monthly} weight={700} /> },
    { id: "accum", label: "Accumulated", align: "right", render: (r) => <Num value={r.accum} />, total: () => <Num value={totals.accum} weight={700} /> },
    { id: "nbv", label: "NBV", align: "right", render: (r) => <Num value={r.nbv} weight={600} />, total: () => <Num value={totals.nbv} weight={700} /> },
    {
      id: "status", label: "Status",
      render: (r) => (r.remaining === 0
        ? <Pill fg={C.muted} bg={C.surfaceMute}>Fully depreciated</Pill>
        : <span style={{ fontSize: 11.5, color: C.muted }}>{r.remaining} months left</span>),
    },
  ];

  return (
    <>
      <ViewHeader
        title="Fixed asset register"
        subtitle={`${scopeLabel(store.scope)} · net book value ${money(totals.nbv)}`}
        action={<Btn onClick={() => setNewOpen(true)}><I as={Add20Regular} size={14} /> New asset</Btn>}
      />
      <Page>
        <Row>
          <Stat label="Cost" value={money(totals.cost)} icon={<I as={Box20Regular} size={14} color={C.muted} />} basis={190} />
          <Stat label="Accumulated depreciation" value={money(totals.accum)} tone={C.danger} basis={190} />
          <Stat label="Net book value" value={money(totals.nbv)} tone={C.brand} basis={190} />
          <Stat label="Charge per month" value={money(totals.monthly)}
                sub={`Posts automatically when ${monthLabel(store.openPeriod)} is closed`} basis={190} />
        </Row>

        <Card
          title="Assets"
          subtitle="Click an asset to see its schedule and every journal it has produced"
          right={
            <FluentSelect
              size="sm" value={category} style={{ width: 190 }}
              options={[{ value: "all", label: "All categories" },
                        ...ASSET_CATEGORIES.map((c) => ({ value: c.id, label: c.name }))]}
              onChange={(e) => setCategory(String(e.target.value))}
            />
          }
          pad={compact ? 8 : 14}
        >
          <RegisterTable
            columns={columns}
            rows={rows}
            getKey={(r) => r.asset.id}
            onRowClick={(r) => store.go(`assets/${r.asset.id}`)}
            emptyMessage="No assets for this scope."
          />
        </Card>

        <Card title="Category defaults" pad={14}>
          <Hint>
            A category carries the method, the useful life and the three accounts an asset posts
            to, so capitalising an asset asks for a cost, a date and a category and works the rest
            out.
          </Hint>
          <div style={{ marginTop: 12 }}>
            <RegisterTable
              totals={false}
              getKey={(c) => c.id}
              rows={ASSET_CATEGORIES}
              columns={[
                { id: "name", label: "Category", render: (c) => <strong>{c.name}</strong> },
                { id: "method", label: "Method", render: () => "Straight line" },
                { id: "life", label: "Useful life", render: (c) => `${c.lifeMonths} months (${c.lifeMonths / 12} years)` },
                { id: "accounts", label: "Posts to", render: (c) => (
                  <span style={{ fontSize: 11.5, color: C.muted }}>
                    {c.costAccount} cost · {c.accumAccount} accumulated · {c.expenseAccount} expense
                  </span>
                ) },
              ]}
            />
          </div>
        </Card>
      </Page>

      {newOpen && (
        <NewAssetPanel
          onClose={() => setNewOpen(false)}
          onSaved={(created) => {
            setNewOpen(false);
            toast("Asset capitalised", `${created.name} · schedule generated, acquisition journal posted`);
            store.go(`assets/${created.id}`);
          }}
        />
      )}
    </>
  );
}

// ─── New asset ────────────────────────────────────────────────────────────────

function NewAssetPanel({ onClose, onSaved }) {
  const store = useFinance();
  const [form, setForm] = useState({
    name: "",
    categoryId: "plant",
    unit: `${store.scope.company || "hospitality"}/${store.scope.branch || "entebbe"}`,
    cost: "",
    inService: monthStart(store.openPeriod),
    fundedBy: "bank",
  });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const cat = assetCategory(form.categoryId);
  const cost = Math.round(Number(String(form.cost).replace(/[^\d.-]/g, "")) || 0);
  const perMonth = cost > 0 ? Math.floor(cost / cat.lifeMonths) : 0;
  const valid = form.name.trim().length > 1 && cost > 0 && form.inService;

  const save = () => {
    const [company, branch] = form.unit.split("/");
    const created = store.createAsset({
      name: form.name.trim(),
      categoryId: form.categoryId,
      company, branch,
      cost,
      inService: form.inService,
      fundedBy: form.fundedBy,
    });
    onSaved(created);
  };

  const usePrefill = () => setForm((f) => ({
    ...f,
    name: ASSET_B_INPUT.name,
    categoryId: ASSET_B_INPUT.categoryId,
    unit: `${ASSET_B_INPUT.company}/${ASSET_B_INPUT.branch}`,
    cost: String(ASSET_B_INPUT.cost),
    inService: ASSET_B_INPUT.inService,
    fundedBy: ASSET_B_INPUT.fundedBy,
  }));

  return (
    <FormDrawer
      title="Capitalise a fixed asset"
      onClose={onClose}
      width={560}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} disabled={!valid}>Save and post</Btn>
        </>
      }
    >
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <Btn variant="ghost" size="sm" onClick={usePrefill} style={{ alignSelf: "flex-start" }}>
          Use the demo figures
        </Btn>
        <Field label="Description" required>
          <TextField value={form.name} onChange={set("name")} placeholder="Commercial kitchen equipment" />
        </Field>
        <Field label="Category" required hint={`Straight line over ${cat.lifeMonths} months · posts to ${cat.costAccount}, ${cat.accumAccount} and ${cat.expenseAccount}`}>
          <FluentSelect
            value={form.categoryId}
            options={ASSET_CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(e) => set("categoryId")(String(e.target.value))}
          />
        </Field>
        <Field label="Company · branch" required>
          <FluentSelect
            value={form.unit}
            options={ALL_BRANCHES.map((b) => ({ value: `${b.company}/${b.branch}`, label: b.label }))}
            onChange={(e) => set("unit")(String(e.target.value))}
          />
        </Field>
        <Field label="Cost" required hint="Base currency, no decimals">
          <TextField value={form.cost} onChange={set("cost")} placeholder="48000000" />
        </Field>
        <Field label="In service from" required hint="Depreciation starts in the month the asset enters service">
          <TextField type="date" value={form.inService} onChange={set("inService")} />
        </Field>
        <Field label="Funded by" required>
          <FluentSelect
            value={form.fundedBy}
            options={[{ value: "bank", label: "Paid from bank — Bank – UGX" }, { value: "payables", label: "On credit — Accounts Payable" }]}
            onChange={(e) => set("fundedBy")(String(e.target.value))}
          />
        </Field>

        <div style={{
          border: `1px solid ${C.hairline}`, borderRadius: 8, background: C.surfaceAlt, padding: 14,
        }}>
          <SubHead>What this will do</SubHead>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
            <KeyValue label="Depreciable amount">{cost > 0 ? money(cost) : "—"}</KeyValue>
            <KeyValue label="Schedule">{cost > 0 ? `${cat.lifeMonths} monthly charges of ${money(perMonth)}` : "—"}</KeyValue>
            <KeyValue label="First charge">{cost > 0 ? monthLabel(form.inService.slice(0, 7)) : "—"}</KeyValue>
            <KeyValue label="Acquisition journal">
              {cost > 0
                ? `Dr ${cat.costAccount} ${money(cost)} / Cr ${form.fundedBy === "bank" ? "1010" : "2010"} ${money(cost)}`
                : "—"}
            </KeyValue>
          </div>
          <Hint>
            Capitalising does not touch the income statement. The cost sits on the balance sheet
            and reaches the P&amp;L one month at a time, through the month-end run.
          </Hint>
        </div>
      </div>
    </FormDrawer>
  );
}

// ─── Detail ───────────────────────────────────────────────────────────────────

function AssetDetail({ asset }) {
  const store = useFinance();
  const cat = assetCategory(asset.categoryId);
  const rows = useMemo(() => schedule(asset), [asset]);
  const posted = useMemo(() => postedPeriods(store.ledger, asset.id), [store.ledger, asset.id]);
  const accum = accumulated(store.ledger, asset);
  const current = nbv(store.ledger, asset);
  const remaining = rows.length - posted.size;

  const journals = useMemo(() => {
    const seen = new Map();
    for (const l of assetLines(store.ledger, asset.id)) {
      if (!seen.has(l.journalId)) seen.set(l.journalId, journalById(store.ledger, l.journalId));
    }
    return [...seen.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [store.ledger, asset.id]);

  return (
    <>
      <ViewHeader
        title={asset.name}
        subtitle={`${asset.tag} · ${cat.name} · ${companyShort(asset.company)} · ${branchName(asset.company, asset.branch)}`}
        action={
          <Btn variant="secondary" onClick={() => store.go("assets")}>
            <I as={ArrowLeft20Regular} size={14} /> Back to register
          </Btn>
        }
      />
      <Page>
        <Row>
          <Stat label="Cost" value={money(asset.cost)} basis={180} />
          <Stat label="Accumulated depreciation" value={money(accum)} tone={C.danger} basis={180} />
          <Stat label="Net book value" value={money(current)} tone={C.brand} basis={180} />
          <Stat label="Months remaining" value={String(remaining)}
                sub={`${posted.size} of ${rows.length} charges posted`} basis={180} />
        </Row>

        <Card title="Asset record" pad={14}>
          <div style={{ display: "grid", gap: "2px 28px", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))" }}>
            <KeyValue label="Cost">{money(asset.cost)}</KeyValue>
            <KeyValue label="Residual value">{asset.residual ? money(asset.residual) : "Nil"}</KeyValue>
            <KeyValue label="In service from">{prettyDate(asset.inService)}</KeyValue>
            <KeyValue label="Method">Straight line</KeyValue>
            <KeyValue label="Useful life">{asset.lifeMonths} months ({asset.lifeMonths / 12} years)</KeyValue>
            <KeyValue label="Charge per month">{money(monthlyCharge(asset))}</KeyValue>
            <KeyValue label="Cost account">{cat.costAccount}</KeyValue>
            <KeyValue label="Accumulated depreciation">{cat.accumAccount}</KeyValue>
            <KeyValue label="Depreciation expense">{cat.expenseAccount}</KeyValue>
            <KeyValue label="Status"><StatusPill status={remaining === 0 ? "pending" : "in-service"} /></KeyValue>
          </div>
        </Card>

        <Card
          title="Depreciation schedule"
          subtitle={`${rows.length} periods · ${posted.size} posted · ${remaining} to come`}
          right={<Pill fg={C.muted} bg={C.surfaceMute}>Generated, not entered</Pill>}
          pad={14}
        >
          <ScheduleWithJournals
            rows={rows}
            posted={posted}
            openPeriod={store.openPeriod}
            journalForPeriod={(period) => {
              const line = assetLines(store.ledger, asset.id).find((l) => l.source?.period === period);
              return line ? line.journalId : null;
            }}
          />
        </Card>

        <Card title={`Journals this asset has produced (${journals.length})`} pad={14}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {journals.map((j) => (
              <Collapse
                key={j.id}
                title={`${j.ref} · ${prettyDate(j.date)} · ${j.memo}`}
                right={<Pill fg={C.success} bg={C.successBg}>Posted</Pill>}
              >
                <JournalEntry journal={j} dense />
              </Collapse>
            ))}
          </div>
        </Card>
      </Page>
    </>
  );
}

// The schedule, with each posted row linking to the journal that posted it — the
// client's "auto depreciation applied" is only convincing if you can see the
// journal behind any row of it.
function ScheduleWithJournals({ rows, posted, openPeriod, journalForPeriod }) {
  const store = useFinance();
  const [journalId, setJournalId] = useState(null);
  const journal = journalId ? journalById(store.ledger, journalId) : null;
  return (
    <>
      <ScheduleTable
        rows={rows}
        posted={posted}
        openPeriod={openPeriod}
        onJournal={(r) => setJournalId(journalForPeriod(r.period))}
      />
      {journal && (
        <FormDrawer title={`${journal.ref} · ${journal.memo}`} onClose={() => setJournalId(null)} width={600}>
          <div style={{ padding: 20 }}><JournalEntry journal={journal} /></div>
        </FormDrawer>
      )}
    </>
  );
}
