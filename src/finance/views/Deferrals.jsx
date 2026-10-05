// Deferred expenses — request 2.
//
// A prepaid invoice lands on the balance sheet, not in the P&L, and one equal
// slice moves to expense each month with no manual journal. The schedule is
// generated from two dates; the remaining prepaid balance is read back out of the
// ledger, so the list total always equals the Prepayments line on the balance
// sheet.

import { useMemo, useState } from "react";
import { Add20Regular, ArrowLeft20Regular, CalendarClock20Regular } from "@fluentui/react-icons";
import {
  BP, Btn, C, Card, Checkbox, Field, FluentSelect, FormDrawer, I, Pill, Stat,
  TextField, ViewHeader, useMaxWidth, useToast,
} from "../../components/index.js";
import {
  ALL_BRANCHES, branchName, companyShort, monthLabel, monthStart,
  money, plural, prettyDate, scopeLabel,
} from "../config.js";
import { ACCOUNTS, PREPAID_CODES, accountName } from "../engine/coa.js";
import {
  coverMonths, deferralLines, monthlyCharge, postedPeriods, recognised, remaining,
  schedule,
} from "../engine/deferrals.js";
import { journalById } from "../engine/ledger.js";
import { useFinance } from "../state.js";
import {
  Collapse, Hint, JournalEntry, KeyValue, Num, Page, RegisterTable, Row,
  ScheduleTable, StatusPill, SubHead,
} from "../ui.jsx";
import { DEFERRAL_D_INPUT } from "../seed/scripted.js";
import { amortisationPlan } from "../engine/actions.js";
import { RunButton, RunModal } from "./PeriodRun.jsx";

const EXPENSE_OPTIONS = ACCOUNTS
  .filter((a) => a.type === "expense" && a.group === "opex")
  .map((a) => ({ value: a.code, label: `${a.code} · ${a.name}` }));

const PREPAID_OPTIONS = PREPAID_CODES.map((c) => ({ value: c, label: `${c} · ${accountName(c)}` }));

export function DeferralsView() {
  const store = useFinance();
  const id = store.route.rest[0];
  const deferral = id ? store.deferrals.find((d) => d.id === id) : null;
  if (deferral) return <DeferralDetail deferral={deferral} />;
  return <DeferralList />;
}

// ─── List ─────────────────────────────────────────────────────────────────────

function DeferralList() {
  const store = useFinance();
  const toast = useToast();
  const compact = useMaxWidth(BP.lg);
  const [newOpen, setNewOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);

  // Same shape as the depreciation run on the asset register: this module owns
  // its own period-end run and can fire it without closing the period.
  const plan = useMemo(() => amortisationPlan(store), [store]);

  const rows = useMemo(() => {
    const { company, branch } = store.scope;
    return store.deferrals
      .filter((d) => (!company || d.company === company) && (!branch || d.branch === branch))
      .map((d) => ({
        deferral: d,
        total: d.total,
        done: recognised(store.ledger, d),
        left: remaining(store.ledger, d),
        monthly: monthlyCharge(d),
        months: coverMonths(d.coverStart, d.coverEnd),
      }));
  }, [store.deferrals, store.ledger, store.scope]);

  const totals = rows.reduce(
    (a, r) => ({ total: a.total + r.total, done: a.done + r.done, left: a.left + r.left, monthly: a.monthly + r.monthly }),
    { total: 0, done: 0, left: 0, monthly: 0 },
  );

  const columns = [
    {
      id: "item", label: "Deferred expense", width: 300,
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: C.ink }}>{r.deferral.description}</div>
          <div style={{ fontSize: 11, color: C.muted }}>
            {r.deferral.supplier} · {r.deferral.ref}
            {r.deferral.createdLive && <Pill fg={C.brand} bg={C.brandTint} style={{ marginLeft: 6 }}>New</Pill>}
          </div>
        </div>
      ),
      total: (rs) => `${rs.length} ${rs.length === 1 ? "item" : "items"}`,
    },
    {
      id: "where", label: "Company · branch",
      render: (r) => (
        <span style={{ color: C.muted, fontSize: 11.5 }}>
          {companyShort(r.deferral.company)} · {branchName(r.deferral.company, r.deferral.branch)}
        </span>
      ),
    },
    {
      id: "cover", label: "Cover period",
      render: (r) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {prettyDate(r.deferral.coverStart)} – {prettyDate(r.deferral.coverEnd)}
          <span style={{ color: C.faint }}> · {r.months} mo</span>
        </span>
      ),
    },
    { id: "total", label: "Invoice total", align: "right", render: (r) => <Num value={r.total} />, total: () => <Num value={totals.total} weight={700} /> },
    { id: "monthly", label: "Monthly", align: "right", render: (r) => <Num value={r.monthly} />, total: () => <Num value={totals.monthly} weight={700} /> },
    { id: "done", label: "Recognised", align: "right", render: (r) => <Num value={r.done} />, total: () => <Num value={totals.done} weight={700} /> },
    { id: "left", label: "Prepaid balance", align: "right", render: (r) => <Num value={r.left} weight={600} />, total: () => <Num value={totals.left} weight={700} /> },
  ];

  return (
    <>
      <ViewHeader
        title="Deferred expenses"
        subtitle={`${scopeLabel(store.scope)} · ${money(totals.left)} still prepaid`}
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <RunButton plan={plan} variant="ghost" onClick={() => setRunOpen(true)} />
            <Btn onClick={() => setNewOpen(true)}><I as={Add20Regular} size={14} /> Supplier invoice</Btn>
          </div>
        }
      />
      <Page>
        <Row>
          <Stat label="Invoiced" value={money(totals.total)}
                icon={<I as={CalendarClock20Regular} size={14} color={C.muted} />} basis={190} />
          <Stat label="Released to expense" value={money(totals.done)} basis={190} />
          <Stat label="Prepaid balance" value={money(totals.left)} tone={C.brand}
                sub="Agrees with Prepayments on the balance sheet" basis={190} />
          <Stat label="Releases per month" value={money(totals.monthly)}
                sub={plan.journalCount
                  ? `${money(plan.total)} due for ${monthLabel(store.openPeriod)} across ${plan.journalCount} items`
                  : `${monthLabel(store.openPeriod)} already run`} basis={190} />
        </Row>

        <Card title="Deferrals" subtitle="Click an item to see its schedule and journals" pad={compact ? 8 : 14}>
          <RegisterTable
            columns={columns}
            rows={rows}
            getKey={(r) => r.deferral.id}
            onRowClick={(r) => store.go(`deferrals/${r.deferral.id}`)}
            emptyMessage="No deferred expenses for this scope."
          />
        </Card>
      </Page>

      {runOpen && (
        <RunModal
          plan={plan}
          onClose={() => setRunOpen(false)}
          onRun={() => {
            const ran = store.runAmortisation();
            setRunOpen(false);
            toast(
              `Amortisation posted for ${monthLabel(ran.period)}`,
              `${plural(ran.journalCount, "journal")} · ${money(ran.total)} — prepaid balances have moved`,
              { color: C.success },
            );
          }}
        />
      )}

      {newOpen && (
        <NewDeferredInvoicePanel
          onClose={() => setNewOpen(false)}
          onSaved={({ invoice, deferral }) => {
            setNewOpen(false);
            if (deferral) {
              toast("Deferred to the balance sheet", `${deferral.description} · schedule generated, nothing in the P&L yet`);
              store.go(`deferrals/${deferral.id}`);
            } else {
              toast("Invoice captured", `${invoice.supplier} · ${money(invoice.baseAmount)}`);
              store.go(`payables/${invoice.id}`);
            }
          }}
        />
      )}
    </>
  );
}

// ─── Capture ──────────────────────────────────────────────────────────────────

function NewDeferredInvoicePanel({ onClose, onSaved }) {
  const store = useFinance();
  const [form, setForm] = useState({
    supplier: "",
    ref: "",
    description: "",
    unit: `${store.scope.company || "properties"}/${store.scope.branch || "kla"}`,
    total: "",
    invoiceDate: monthStart(store.openPeriod),
    defer: true,
    coverStart: monthStart(store.openPeriod),
    coverEnd: "",
    prepaidAccount: "1210",
    expenseAccount: "6060",
  });
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const total = Math.round(Number(String(form.total).replace(/[^\d.-]/g, "")) || 0);
  const validDates = form.coverStart && form.coverEnd && form.coverEnd >= form.coverStart;
  const preview = useMemo(() => {
    if (!form.defer || total <= 0 || !validDates) return null;
    return schedule({
      total,
      coverStart: form.coverStart,
      coverEnd: form.coverEnd,
    });
  }, [form.defer, form.coverStart, form.coverEnd, total, validDates]);

  const valid = form.supplier.trim() && form.description.trim() && total > 0
    && form.invoiceDate && (!form.defer || validDates);

  const save = () => {
    const [company, branch] = form.unit.split("/");
    const created = store.createSupplierInvoice({
      supplier: form.supplier.trim(),
      ref: form.ref.trim() || `INV-${form.invoiceDate.replace(/-/g, "")}`,
      description: form.description.trim(),
      company, branch,
      total,
      invoiceDate: form.invoiceDate,
      defer: form.defer,
      coverStart: form.coverStart,
      coverEnd: form.coverEnd,
      prepaidAccount: form.prepaidAccount,
      expenseAccount: form.expenseAccount,
    });
    onSaved(created);
  };

  const usePrefill = () => setForm((f) => ({
    ...f,
    supplier: DEFERRAL_D_INPUT.supplier,
    ref: DEFERRAL_D_INPUT.ref,
    description: DEFERRAL_D_INPUT.description,
    unit: `${DEFERRAL_D_INPUT.company}/${DEFERRAL_D_INPUT.branch}`,
    total: String(DEFERRAL_D_INPUT.total),
    invoiceDate: DEFERRAL_D_INPUT.invoiceDate,
    defer: true,
    coverStart: DEFERRAL_D_INPUT.coverStart,
    coverEnd: DEFERRAL_D_INPUT.coverEnd,
    prepaidAccount: DEFERRAL_D_INPUT.prepaidAccount,
    expenseAccount: DEFERRAL_D_INPUT.expenseAccount,
  }));

  return (
    <FormDrawer
      title="Capture a supplier invoice"
      onClose={onClose}
      width={620}
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
        <Field label="Supplier" required>
          <TextField value={form.supplier} onChange={set("supplier")} placeholder="Lakeside Systems" />
        </Field>
        <Field label="Invoice number">
          <TextField value={form.ref} onChange={set("ref")} placeholder="LS-1182" />
        </Field>
        <Field label="Description" required>
          <TextField value={form.description} onChange={set("description")} placeholder="Annual software licence" />
        </Field>
        <Field label="Company · branch" required>
          <FluentSelect
            value={form.unit}
            options={ALL_BRANCHES.map((b) => ({ value: `${b.company}/${b.branch}`, label: b.label }))}
            onChange={(e) => set("unit")(String(e.target.value))}
          />
        </Field>
        <Field label="Invoice total" required hint="Base currency, no decimals">
          <TextField value={form.total} onChange={set("total")} placeholder="24000000" />
        </Field>
        <Field label="Invoice date" required>
          <TextField type="date" value={form.invoiceDate} onChange={set("invoiceDate")} />
        </Field>

        <div style={{
          border: `1px solid ${form.defer ? C.brand : C.hairline}`, borderRadius: 8,
          background: form.defer ? C.brandTintSoft : "#fff", padding: 14,
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <Checkbox checked={form.defer} onChange={(v) => set("defer")(v)} label="Defer this expense" />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Defer this expense</span>
          </label>
          <Hint>
            On: the cost is held on the balance sheet and released to the income statement in equal
            monthly slices over the cover period. Off: the whole amount hits the P&amp;L on the
            invoice date.
          </Hint>

          {form.defer && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Cover from" required>
                <TextField type="date" value={form.coverStart} onChange={set("coverStart")} />
              </Field>
              <Field label="Cover to" required hint="The schedule is built from these two dates">
                <TextField type="date" value={form.coverEnd} onChange={set("coverEnd")} />
              </Field>
              <Field label="Prepaid account" required>
                <FluentSelect value={form.prepaidAccount} options={PREPAID_OPTIONS}
                              onChange={(e) => set("prepaidAccount")(String(e.target.value))} />
              </Field>
              <Field label="Expense account" required>
                <FluentSelect value={form.expenseAccount} options={EXPENSE_OPTIONS}
                              onChange={(e) => set("expenseAccount")(String(e.target.value))} />
              </Field>
            </div>
          )}
        </div>

        <div style={{ border: `1px solid ${C.hairline}`, borderRadius: 8, background: C.surfaceAlt, padding: 14 }}>
          <SubHead>What this will do</SubHead>
          <div style={{ marginTop: 8 }}>
            <KeyValue label="On capture">
              {total > 0
                ? form.defer
                  ? `Dr ${form.prepaidAccount} ${money(total)} / Cr 2010 ${money(total)}`
                  : `Dr ${form.expenseAccount} ${money(total)} / Cr 2010 ${money(total)}`
                : "—"}
            </KeyValue>
            <KeyValue label="Effect on the P&L today">
              {form.defer ? "Nil — the cost is a prepayment" : total > 0 ? money(total) : "—"}
            </KeyValue>
          </div>
          {preview && (
            <div style={{ marginTop: 12 }}>
              <SubHead>
                Schedule preview — {preview.length} months of {money(preview[0].amount)}
              </SubHead>
              <div style={{ marginTop: 8, maxHeight: 260, overflow: "auto" }}>
                <ScheduleTable rows={preview} posted={new Set()} openPeriod={store.openPeriod}
                               balanceLabel="Prepaid balance" />
              </div>
            </div>
          )}
        </div>
      </div>
    </FormDrawer>
  );
}

// ─── Detail ───────────────────────────────────────────────────────────────────

function DeferralDetail({ deferral }) {
  const store = useFinance();
  const rows = useMemo(() => schedule(deferral), [deferral]);
  const posted = useMemo(() => postedPeriods(store.ledger, deferral.id), [store.ledger, deferral.id]);
  const done = recognised(store.ledger, deferral);
  const left = remaining(store.ledger, deferral);
  const invoice = store.invoices.find((i) => i.id === deferral.invoiceId);

  const journals = useMemo(() => {
    const seen = new Map();
    for (const l of deferralLines(store.ledger, deferral)) {
      if (!seen.has(l.journalId)) seen.set(l.journalId, journalById(store.ledger, l.journalId));
    }
    return [...seen.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [store.ledger, deferral]);

  return (
    <>
      <ViewHeader
        title={deferral.description}
        subtitle={`${deferral.supplier} · ${deferral.ref} · ${companyShort(deferral.company)} · ${branchName(deferral.company, deferral.branch)}`}
        action={
          <Btn variant="secondary" onClick={() => store.go("deferrals")}>
            <I as={ArrowLeft20Regular} size={14} /> Back to deferrals
          </Btn>
        }
      />
      <Page>
        <Row>
          <Stat label="Invoice total" value={money(deferral.total)} basis={180} />
          <Stat label="Recognised to date" value={money(done)} basis={180} />
          <Stat label="Prepaid balance" value={money(left)} tone={C.brand} basis={180} />
          <Stat label="Months remaining" value={String(rows.length - posted.size)}
                sub={`${posted.size} of ${rows.length} released`} basis={180} />
        </Row>

        <Card title="The invoice" pad={14}
              right={<StatusPill status="deferred" />}>
          <div style={{ display: "grid", gap: "2px 28px", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))" }}>
            <KeyValue label="Supplier">{deferral.supplier}</KeyValue>
            <KeyValue label="Invoice number">{deferral.ref}</KeyValue>
            <KeyValue label="Invoice date">{prettyDate(deferral.invoiceDate)}</KeyValue>
            <KeyValue label="Invoice total">{money(deferral.total)}</KeyValue>
            <KeyValue label="Cover period">{prettyDate(deferral.coverStart)} – {prettyDate(deferral.coverEnd)}</KeyValue>
            <KeyValue label="Months">{coverMonths(deferral.coverStart, deferral.coverEnd)}</KeyValue>
            <KeyValue label="Monthly release">{money(monthlyCharge(deferral))}</KeyValue>
            <KeyValue label="Prepaid account">{deferral.prepaidAccount} · {accountName(deferral.prepaidAccount)}</KeyValue>
            <KeyValue label="Expense account">{deferral.expenseAccount} · {accountName(deferral.expenseAccount)}</KeyValue>
            {invoice && (
              <KeyValue label="In payables">
                <button onClick={() => store.go(`payables/${invoice.id}`)} style={{ ...linkStyle }}>
                  {invoice.ref}
                </button>
              </KeyValue>
            )}
          </div>
        </Card>

        <Card
          title="Amortisation schedule"
          subtitle={`${rows.length} periods · ${posted.size} posted · ${rows.length - posted.size} to come`}
          right={<Pill fg={C.muted} bg={C.surfaceMute}>Built from two dates</Pill>}
          pad={14}
        >
          <ScheduleTable rows={rows} posted={posted} openPeriod={store.openPeriod} balanceLabel="Prepaid balance" />
        </Card>

        <Card title={`Journals (${journals.length})`} pad={14}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {journals.map((j) => (
              <Collapse key={j.id} title={`${j.ref} · ${prettyDate(j.date)} · ${j.memo}`}
                        right={<Pill fg={C.success} bg={C.successBg}>Posted</Pill>}>
                <JournalEntry journal={j} dense />
              </Collapse>
            ))}
          </div>
        </Card>
      </Page>
    </>
  );
}

const linkStyle = {
  background: "none", border: "none", padding: 0, color: C.brand,
  fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};
