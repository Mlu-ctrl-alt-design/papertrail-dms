# PRD: Ezra360 Financials demo for HUGAMARA

**Owner:** Mlu Manda
**Executor:** Conductor (coding agents)
**Date:** 5 October 2026
**Status:** Ready to build
**Target repo:** `Mlu-ctrl-alt-design/papertrail-dms`

---

## 0. Instructions to Conductor (read first)

1. **Clone the repo and work only inside that clone.**
   ```bash
   git clone https://github.com/Mlu-ctrl-alt-design/papertrail-dms.git
   cd papertrail-dms
   npm install
   ```
   This is the Ezra360 prototype repo. It already holds DMS, mSCOA, Payroll, Connect and OPFA as hash-routed apps on a shared design system. (Do not use `papertrail` — it is empty — or `papertrail_`, which is an older private copy.)
2. **Put this document in the repo** at `docs/PRD-ezra360-finance-demo-hugamara.md` as the first commit on your branch. It is the source of truth for the work.
3. **Branch and PR.** Work on `feature/finance-demo-hugamara`. The repo's history is one squash-merged PR per feature; follow that. Do not push to `main`. Atomic commits.
4. **Build a new app, do not modify the existing ones.** Everything goes in `src/finance/`, reached at `#/finance`. The only files outside that folder you may touch are `src/AppRouter.jsx` (register the app), `src/components/` (only if a genuinely shared primitive is missing), `package.json` (scripts only) and `docs/`.
5. **This repo is public.** Do not commit email addresses, phone numbers or any real financial data of the client. Client and contact names appear only where this PRD uses them.
6. **Stop and ask Mlu** if an item in section 9 (Open questions) blocks you. Otherwise use the stated default and keep going.
7. **Done means:** every acceptance criterion in section 6 passes, `npm run lint` and `npm run build` are clean, `npm run check:finance` passes, and the presenter script in section 5 can be walked start to finish without a dead end.

---

## 1. Summary

HUGAMARA's finance lead saw a first Ezra360 ERP demo and sent five specific things he wants to see in the next one. All five are tests of the accounting engine: fixed-asset depreciation, prepaid-expense amortisation, multi-company consolidation with drill-down, the three financial statements, and paying a US-dollar invoice in local currency.

We will build **Ezra360 Financials**, a clickable prototype in the existing Ezra360 prototype repo, that demonstrates all five as one connected finance story on one coherent set of books.

## 2. Background

### 2.1 The client's request (verbatim)

From Vince Ssemyalo (HUGAMARA) to Julius Ahimbisibwe, in the thread "Ezra360 ERP Demo for HUGAMARA", replying to Julius's message of Fri 25 Sep 2026:

> Dear Julius,
>
> Thanks for the call. Please see below what I would be interested in seeing in the next Demo:
> - Purchase of fixed assets depreciated over their useful life with auto depreciation applied to get the NBV of the items
> - An Invoice of expense deferral with auto amortization over a period of time eg a medical insurance invoice that is prepaid at the start of the year but automatically amortized over a 1 year period of cover
> - Business Unit Consolidation of all companies and branch accounting (Financial reports)- Drill down function
> - Financial statements- Balance sheet, PnL, Cash Flow Statement
> - Multi currency application of a local currency payment to a Dollar($) invoice
>
> Looking forward to hearing from you

### 2.2 People on the thread

| Name | Organisation | Role in this work |
|---|---|---|
| Vince Ssemyalo | HUGAMARA | Requester. The audience for the demo. Writes like an accountant; expect him to check the numbers. |
| Julius Ahimbisibwe | (to confirm) | Ran the first call; presenting or co-presenting. |
| Willie K. | Ezra360 | Ezra360 side. |
| Sarel Hlungwani | Xiquel Group | Xiquel side. |
| Ronald Kanyike, Herbert Kayondo, Lynn Nabimanya | HRP Solutions | Partner side. |

### 2.3 What each request really means

| # | What he asked for | What is being tested | What "pass" looks like to an accountant |
|---|---|---|---|
| 1 | Fixed asset bought, auto-depreciated, NBV shown | Asset register and depreciation | He enters cost and useful life once. The system builds the schedule, posts the monthly journal on its own, and NBV = cost − accumulated depreciation at any date. |
| 2 | Prepaid invoice auto-amortised over the cover period | Deferred expenses | The invoice lands on the balance sheet as a prepayment, not in the P&L. One equal slice moves to expense each month with no manual journal. |
| 3 | Consolidation of all companies, branch accounting, drill-down | Multi-entity ledger | One report shows each company, eliminations and a group total. Any number can be clicked down to the branch, the account, the journal and the source document. |
| 4 | Balance sheet, P&L, cash flow | Reporting | The balance sheet balances. The cash flow closing balance equals the bank balance on the balance sheet. Filters by company, branch and period. |
| 5 | Local-currency payment applied to a dollar invoice | Multi-currency | The invoice stays in USD. A local-currency payment settles it at the payment-date rate, and the difference posts to a realised FX gain/loss account automatically. |

### 2.4 Why now

The next demo decides whether Ezra360 is taken seriously as a finance system rather than an invoicing tool. The request is specific enough that anything vague will read as "it can't do that".

## 3. Objective

**Show HUGAMARA that Ezra360 has a proper accounting engine, by walking all five requests as one story in under 30 minutes, with every number traceable.**

Key results:

- KR1: All five requests are shown end to end, each with at least one **live** action (not just a pre-filled screen).
- KR2: Any figure on any report can be drilled to a source document in **four clicks or fewer**.
- KR3: Zero arithmetic that does not tie. The integrity checks in section 7.3 pass after every action the presenter can take.
- KR4: The presenter can reset to the opening state in one click and repeat the demo identically.

### Non-goals

- No backend, API, auth or database. In-browser state only, like the other apps in this repo.
- Not a full ERP: no inventory, payroll, tax returns, bank reconciliation or budgeting.
- No VAT in the demo dataset. It adds noise to every worked number. (Leave the tax line out, do not show it as zero.)
- No changes to the existing five apps.

## 4. The demo dataset

One group, one set of books, one timeline. Every screen reads from the same ledger.

### 4.1 Setting

- **Base (local) currency: UGX**, shown with no decimals and thousands separators (`UGX 180,000,000`). Foreign currency: **USD**, two decimals. Base currency is one constant in `src/finance/config.js` so it can be switched (see open question Q1).
- **Financial year:** 1 January – 31 December 2026.
- **Books are closed to 30 September 2026. October 2026 is the open period.** Everything the presenter does live happens in October, then they run October month-end.
- Anchor "today" to **20 October 2026** in config. Do not use the real clock.

### 4.2 Group structure (placeholder names — see Q2)

```
Hugamara Group (consolidated)
├── Hugamara Holdings Ltd          — Head Office
├── Hugamara Hospitality Ltd       — Kampala Central, Entebbe
└── Hugamara Properties Ltd        — Kampala, Jinja
```

Every journal line carries `company` and `branch`. Branch is a dimension on the line, not a separate ledger.

### 4.3 Scripted figures (these exact numbers must appear)

**A. Fixed asset already on the books** — Hospitality, Kampala Central

| Field | Value |
|---|---|
| Asset | Delivery vehicle, Toyota Hiace |
| Category | Motor Vehicles |
| Cost | UGX 180,000,000 |
| In service | 1 January 2026 |
| Method / life / residual | Straight line / 5 years (60 months) / nil |
| Monthly depreciation | UGX 3,000,000 |
| At 30 Sep 2026 | Accumulated 27,000,000 · **NBV 153,000,000** |
| After October run | Accumulated 30,000,000 · **NBV 150,000,000** |

**B. Fixed asset bought live** — Hospitality, Entebbe

| Field | Value |
|---|---|
| Asset | Commercial kitchen equipment |
| Category | Plant & Equipment |
| Cost | UGX 48,000,000, paid from bank |
| In service | 1 October 2026 |
| Method / life / residual | Straight line / 4 years (48 months) / nil |
| Monthly depreciation | UGX 1,000,000 |
| After October run | Accumulated 1,000,000 · **NBV 47,000,000** |

**C. Prepaid medical insurance** — Holdings, Head Office

| Field | Value |
|---|---|
| Supplier | Crested Health Assurance (fictional) |
| Invoice | UGX 120,000,000, dated and paid 2 January 2026 |
| Cover period | 1 January – 31 December 2026 |
| Monthly amortisation | UGX 10,000,000 |
| At 30 Sep 2026 | Expensed 90,000,000 · **Prepaid balance 30,000,000** |
| After October run | Expensed 100,000,000 · **Prepaid balance 20,000,000** |

Journals: on invoice, Dr Prepaid Insurance / Cr Accounts Payable. Each month, Dr Medical Insurance Expense 10,000,000 / Cr Prepaid Insurance 10,000,000.

**D. A second deferral, captured live** — Properties, Kampala

Annual software licence, UGX 24,000,000, cover 1 October 2026 – 30 September 2027, UGX 2,000,000 a month. Used to show the schedule being generated from a start and end date.

**E. Dollar invoice paid in local currency** — Hospitality, Kampala Central

| Step | Value |
|---|---|
| Supplier invoice | USD 10,000.00, dated 15 September 2026, rate 3,700 → UGX 37,000,000 |
| Payment (live) | 20 October 2026, from the UGX bank account, rate 3,750 → **UGX 37,500,000** |
| Result | Invoice fully settled · **Realised FX loss UGX 500,000** |

Journals: on invoice, Dr Kitchen Supplies Expense 37,000,000 / Cr Accounts Payable 37,000,000 (USD 10,000 @ 3,700). On payment, Dr Accounts Payable 37,000,000, Dr Realised FX Loss 500,000 / Cr Bank (UGX) 37,500,000.

The payment screen must also handle, with the same invoice:

- **Partial payment:** UGX 18,750,000 at 3,750 settles USD 5,000.00, relieves UGX 18,500,000 of payables, posts an FX loss of UGX 250,000, and leaves **USD 5,000.00 outstanding**.
- **A gain:** at a rate of 3,650 the full payment is UGX 36,500,000 and the result is a **realised FX gain of UGX 500,000**.

**F. Intercompany elimination**

Holdings charges Hospitality a management fee of UGX 15,000,000 a month. It is income in Holdings and an expense in Hospitality, and it is removed in the Eliminations column so the group total shows neither.

### 4.4 Background activity

Beyond the scripted items, generate plausible January–September trading for all three companies and all branches (sales, cost of sales, salaries, rent, utilities, a few more assets, customer receipts, supplier payments, a bank loan in Properties with repayments, opening share capital). Use a **seeded** generator so the numbers are identical on every load. Aim for 400–800 journals. Realistic magnitudes, non-round where it does not matter, and a group that is modestly profitable.

The generator must never produce a number that contradicts section 4.3.

## 5. How the demo should go (run of show)

One story, in this order. The order matters: scenes 1, 2 and 5 create the postings that scenes 3 and 4 then report on, so the client watches his own transactions arrive in the financial statements.

Target 25–30 minutes. Each scene has its own deep link so the presenter can jump.

| # | Scene | Deep link | Presenter does | Client sees | Time |
|---|---|---|---|---|---|
| 0 | Set the scene | `#/finance` | Opens the Financials home. Points out the group, three companies, branches, open period October 2026. | One system, several companies, one ledger. | 2 min |
| 1 | Fixed assets | `#/finance/assets` | Opens the Hiace: cost 180m, 9 months posted, NBV 153m, full 60-month schedule. Then **buys the kitchen equipment live**: fills cost, in-service date, category (life and method default from the category). Saves. | Schedule appears instantly. Acquisition journal posted. Asset register total moves. No one calculated anything. | 5 min |
| 2 | Deferred expense | `#/finance/deferrals` | Opens the medical insurance invoice: 120m sitting in Prepaid, 90m released, 30m left, 12-row schedule. Then **captures the software licence live**, ticks "Defer this expense", sets start and end date. | Schedule built from two dates. Nothing hits the P&L on day one. | 4 min |
| 3 | Dollar invoice, local payment | `#/finance/payables` | Opens the USD 10,000 invoice. Clicks **Pay**, picks the UGX bank account, date 20 Oct. The rate fills at 3,750 and the screen shows UGX 37,500,000 and "FX loss UGX 500,000" **before posting**. Posts. Optionally shows the partial-payment variant first. | The invoice stayed in dollars. The system did the conversion and booked the difference itself. Journal preview shows three lines. | 5 min |
| 4 | Month-end | `#/finance/period-close` | Clicks **Run October month-end**. A short run lists what it will post: depreciation for every asset, amortisation for every deferral. Confirms. | Two batches of journals post on their own. Back on the asset: NBV 150m. Back on the insurance: prepaid 20m. This is the "auto" in his email. | 3 min |
| 5 | Financial statements | `#/finance/reports` | Opens the P&L, balance sheet and cash flow for the group, year to date October. Points at: Depreciation, Medical Insurance, FX loss on the P&L; Fixed assets at NBV and Prepayments on the balance sheet; the 48m equipment purchase under Investing on the cash flow. Switches the filter to one company, then one branch. | His three statements, with the transactions he just watched. Balance sheet balances; cash flow closes on the bank balance. | 5 min |
| 6 | Consolidation and drill-down | `#/finance/reports/consolidated` | Opens the consolidated P&L: a column per company, an Eliminations column, a Group column. Shows the management fee cancelling. Then **drills**: Group operating expenses → Hospitality → Kampala Central → Realised FX Loss → the journal → the USD invoice and its payment. | The headline number is made of real transactions he can reach in four clicks. | 5 min |
| 7 | Close | `#/finance` | Returns home. Recap card lists the five requests with a tick and a link beside each. | His email, answered point by point. | 1 min |

**Deliverable:** write this up as `docs/DEMO-SCRIPT-hugamara.md` — click-by-click, with the line to say at each step and the number that should be on screen, so someone other than Mlu can present it.

## 6. Requirements and acceptance criteria

Priority: **P0** must be in the demo. **P1** build if P0 is done and verified. **P2** only if time remains.

### 6.1 App shell and navigation — P0

- New app registered in `src/AppRouter.jsx` as `{ id: "finance", label: "Finance", title: "Ezra360 Financials" }`, added to `APPS` and `SCREENS`.
- Left nav: Home, Fixed Assets, Deferred Expenses, Payables, Journals, Period Close, Reports. Sub-routes after `#/finance/…` are parsed inside the finance app (the top-level router only reads the first segment).
- A **company / branch selector** in the top bar scopes every list. Default: Group.
- The open period ("October 2026") is always visible.
- A **Reset demo data** control, behind a confirm, restores the opening state exactly.

*Accept:* every deep link in section 5 loads the right screen on a cold refresh. Reset returns every figure in section 4.3 to its "At 30 Sep 2026" value.

### 6.2 Fixed assets (request 1) — P0

- **Asset register:** table of assets with category, company, branch, cost, accumulated depreciation, NBV, status. Totals row. Filter by company, branch, category.
- **Asset categories** carry defaults: depreciation method, useful life, and the three accounts (asset cost, accumulated depreciation, depreciation expense).
- **Asset detail:** summary tiles (Cost, Accumulated depreciation, NBV, Months remaining), the full depreciation schedule with posted and pending rows clearly different, and links to every journal the asset has produced.
- **New asset (live):** form in a side panel, following the repo's existing pattern. On save: creates the asset, generates the schedule, posts the acquisition journal (Dr asset cost / Cr bank or payables).
- **Depreciation:** straight line, monthly, starting in the month the asset enters service. The final period absorbs any rounding so the schedule sums exactly to cost less residual.

*Accept:* asset A shows NBV 153,000,000 at open and 150,000,000 after the October run. Asset B can be created live in under a minute, shows a 48-row schedule of 1,000,000, and NBV 47,000,000 after the October run. Asset register NBV total equals the balance sheet's fixed-asset line for the same scope.

P1: an "as at" date picker on the asset showing NBV at any month end. Reducing-balance method. Disposal with gain or loss on sale.

### 6.3 Deferred expenses (request 2) — P0

- A supplier invoice form with a **"Defer this expense"** toggle. When on: cover start date, cover end date, prepaid (balance sheet) account, expense account. The schedule previews before saving.
- **Deferral detail:** invoice total, recognised to date, remaining prepaid balance, schedule with posted and pending rows, links to journals.
- Straight-line by month over the cover period; last period absorbs rounding.
- **Deferrals list** with remaining balance per item and a total.

*Accept:* item C shows prepaid 30,000,000 at open and 20,000,000 after the October run, with twelve rows of 10,000,000. Item D can be captured live and shows twelve rows of 2,000,000 from October 2026. At the moment of capture, the P&L does not move. Deferrals list total equals the balance sheet's Prepayments line.

### 6.4 Multi-currency payment (request 5) — P0

- Supplier invoices carry a currency and the rate at invoice date. The list shows the foreign amount, the base amount and the outstanding foreign balance.
- **Pay invoice** panel: choose bank account (which has its own currency), payment date, and amount. When the bank currency differs from the invoice currency, show the rate (pre-filled from a rate table by date, **editable**), the foreign amount being settled, and the **FX gain or loss, calculated live as the user types and labelled gain or loss**.
- A **journal preview** before posting, showing every line.
- On post: payables relieved at the invoice rate, bank credited at the payment rate, difference to Realised FX Gain/Loss. Invoice status becomes Paid or Partly paid.
- An **exchange rates** table (date, currency pair, rate) that the presenter can open to show where 3,750 came from.

*Accept:* all three cases in 4.3 E produce exactly the stated figures. After full payment the invoice shows USD 0.00 outstanding and the payables account for that invoice nets to zero in base currency.

P1: the mirror case on the receivables side — a customer invoiced in USD who pays in UGX — reusing the same allocation panel. The client's wording ("application of a local currency payment to a Dollar invoice") does not say which side he means, so having both ready is cheap insurance. P2: month-end revaluation of open foreign balances (unrealised gain/loss).

### 6.5 Period close (the "auto" in requests 1 and 2) — P0

- **Run month-end** for the open period. A review step lists what will post: one depreciation line per asset, one amortisation line per deferral, with totals. Confirm posts them as two batch journals and marks the schedule rows posted.
- The run is idempotent: a period cannot be run twice. After the run, the period shows as closed and November becomes the open period.

*Accept:* running October posts depreciation for every asset in service (including asset B if it was created) and amortisation for every active deferral (including item D if it was captured). Running before or after the live steps both give correct results.

### 6.6 Financial statements (request 4) — P0

- **Profit & loss**, **Balance sheet**, **Cash flow statement** (indirect method: operating, investing, financing).
- Filters: scope (Group / company / branch), period (month, year to date, custom range). Balance sheet takes an "as at" date.
- Comparative column (prior month, or year to date against the month).
- Every amount is clickable (see 6.8).
- Print / export to PDF using the repo's existing `print.jsx` helper.

*Accept:* for every scope and period the presenter can select — assets equal liabilities plus equity; P&L net profit equals the movement in retained earnings; cash flow net movement equals the change in bank balances, and its closing figure equals Cash on the balance sheet. A visible "Balanced ✓" indicator on the balance sheet is driven by a real check, not hardcoded.

### 6.7 Consolidation and branch accounting (request 3) — P0

- **Consolidated view** of the P&L and balance sheet: one column per company, an **Eliminations** column, a **Group** column.
- **Branch view:** pick a company and see one column per branch plus the company total.
- Intercompany lines are tagged with their counterparty company. Eliminations are derived from those tags, not typed in.

*Accept:* Group = sum of company columns + Eliminations on every row. The management fee appears as income in Holdings, expense in Hospitality, and nets to zero in Group. Branch columns sum to the company column.

### 6.8 Drill-down (request 3) — P0

The path, from any report figure:

`Report line → by company → by branch → account ledger (list of journal lines) → journal entry → source document (asset, invoice, payment, deferral)`

- Levels that do not apply to the current scope are skipped (already filtered to a branch: straight to the ledger).
- A **breadcrumb** shows the path and each crumb is clickable.
- The amount at each level equals the sum of the level below.
- Browser back works.

*Accept:* from the consolidated P&L, the presenter reaches the USD invoice behind the Realised FX Loss line in four clicks. From the balance sheet's fixed-asset line, they reach asset A. No dead ends: every journal line links to a source document or is plainly marked as a manual journal.

### 6.9 Journals — P0

A read-only list of all journal entries with date, reference, source, company, branch, and balanced debit/credit lines. This is the landing point for drill-down and what an accountant will ask to see.

### 6.10 Home — P1

Open period, group cash position, tiles for fixed assets at NBV, prepayments, open foreign-currency payables, and the five-request recap card used in scene 7.

## 7. Technical approach

### 7.1 The one rule that matters

**There is one ledger and nothing else holds a number.** Every screen — asset NBV, prepaid balance, every line of every statement, every drill-down level — is computed from the same array of posted journal lines. No report total is typed into a data file.

This is what makes the drill-down honest and the statements tie. If the P&L is a hardcoded table, the client's first click breaks the demo. (The existing Payroll app uses hardcoded display strings like `"R 585,000.00"`. That is fine there. Do not copy that pattern here.)

### 7.2 Shape

```
src/finance/
  Finance.jsx          app shell, nav, sub-router
  config.js            base currency, today, open period, formatting
  engine/
    ledger.js          post(journal), balances, queries by scope/period/account
    coa.js             chart of accounts with types and cash-flow classification
    assets.js          schedule generation, depreciation run
    deferrals.js       schedule generation, amortisation run
    fx.js              rate lookup, settlement and gain/loss calculation
    reports.js         P&L, balance sheet, cash flow, consolidation, eliminations
    drill.js           resolves a report cell to the level below
  seed/
    scripted.js        the items in section 4.3, written by hand
    generate.js        seeded background activity
  state.js             store: seed → ledger, live actions, reset
  views/               one file per screen
  check.mjs            integrity checks, runnable from node
```

A journal line is roughly: `{ journalId, date, account, debit, credit, company, branch, currency, fxAmount, fxRate, source: { type, id }, counterparty }`. Amounts in base currency are **integers** (UGX has no minor unit in practice). Never use floats for money; keep USD in cents.

The `engine/` folder must be pure functions with no React imports, so `check.mjs` can run it.

### 7.3 Integrity checks — `npm run check:finance`

A plain Node script using `node:assert`. No test framework and no new dependency. It builds the seed, then replays the full demo script (create asset B, capture deferral D, pay invoice E, run October) and after **each** step asserts:

1. Every journal balances (debits = credits).
2. Trial balance sums to zero for the group and for each company.
3. Assets = liabilities + equity, for the group, each company and each branch. (To make this hold, every journal must balance within a single company and branch. A transaction that crosses companies is two journals joined by the intercompany accounts.)
4. Cash flow net movement = change in bank balances; closing cash = balance sheet cash.
5. Group = companies + eliminations on every report row; branches sum to company.
6. Asset register NBV total = fixed-asset balance sheet line. Deferrals remaining = Prepayments line.
7. Every figure in section 4.3 matches exactly.
8. Each drill level equals the sum of the level below, sampled across at least 20 report cells.
9. The seed is deterministic: two builds produce identical ledgers.

Also replay the three payment variants in 4.3 E from a fresh seed.

### 7.4 Repo conventions to follow

- React 19 + Vite, plain JavaScript (`.jsx`), no TypeScript.
- Import UI from `src/components` (`AppShellRoot`, `TopBar`, `DataTable`, `CommandBar`, `ViewHeader`, `Tabs`, overlays/side panels, `Toast`, tokens `C`, `BP`, `useMaxWidth`). Read `src/payroll/Payroll.jsx` and `src/epms/` first for the shell, nav and side-panel patterns, and match them.
- Icons from `@fluentui/react-icons`. Inline styles using the design tokens, as the rest of the repo does.
- **No new runtime dependencies.** No charting library, no router, no state library. Use context plus hooks like the other apps.
- Responsive down to tablet width, as the existing apps are. The demo will be screen-shared from a laptop; optimise for 1440 × 900.
- Numbers right-aligned, tabular figures, negatives in brackets, as accountants expect.
- State is in memory. Live actions survive navigation between scenes. A page refresh returning to the opening state is acceptable, provided the Reset control exists.

### 7.5 Suggested split for parallel workspaces

| Milestone | Work | Depends on |
|---|---|---|
| M1 | Engine (`ledger`, `coa`), scripted seed, background generator, `check.mjs`, app shell and router registration, Journals view | — |
| M2 | Fixed assets: engine, register, detail, live create | M1 |
| M3 | Deferrals: engine, list, detail, live capture | M1 |
| M4 | Multi-currency: rates, payables list, pay panel with live FX preview | M1 |
| M5 | Reports: three statements, consolidation, branch view, drill-down | M1 |
| M6 | Period close, home and recap card, presenter script, polish pass, full check run | M2–M5 |

M1 must merge first and its ledger API should be agreed before M2–M5 start, since all four build on it. M2–M5 can then run in parallel workspaces.

## 8. Assumptions

- **A1.** The local currency is UGX. HUGAMARA appears to be Uganda-based, judging by the contacts and partner on the thread. Not confirmed.
- **A2.** The group structure in 4.2 is invented. The real entities and branches are not known.
- **A3.** The demo is presented from a browser on a deployed preview of this branch (the repo deploys to Vercel).
- **A4.** "Dollar invoice" most likely means a supplier invoice. The receivables mirror is P1 in case it does not.
- **A5.** Straight-line is the only depreciation method the client needs to see.
- **A6.** The audience is finance people. Correct numbers beat visual polish wherever the two compete.

## 9. Open questions for Mlu

| # | Question | Default if unanswered |
|---|---|---|
| Q1 | Confirm base currency: UGX? | UGX. Switchable in `config.js`. |
| Q2 | Real HUGAMARA company and branch names, or keep placeholders? | Placeholders from 4.2. |
| Q3 | Date of the next demo? | Treat as urgent; ship P0 first, P1 only once P0 is verified. |
| Q4 | Who presents — Julius, Mlu, or both? | Write the script so anyone can run it. |
| Q5 | How will this be positioned to the client — as the live product or as a prototype of it? On-screen labelling should match. | No "prototype" or "demo" label in the UI beyond what the other apps in the repo carry. |
| Q6 | Is it acceptable for the client's name to appear in a public repo and a public preview URL? | Keep the name, as the repo already does for other bids. Flag in the PR description. |

## 10. Release

- **First cut (P0):** sections 6.1–6.9, the integrity script, and the presenter script. This is the demo.
- **If time allows (P1):** receivables-side multi-currency, asset "as at" date, reducing balance, disposal, home dashboard.
- **Later (P2):** unrealised FX revaluation, budgets against actuals, Excel export.

**PR checklist**

- [ ] `docs/PRD-ezra360-finance-demo-hugamara.md` and `docs/DEMO-SCRIPT-hugamara.md` committed
- [ ] `npm run lint`, `npm run build`, `npm run check:finance` all pass
- [ ] Every row of the section 5 run of show walked by hand on the preview URL
- [ ] All figures in section 4.3 confirmed on screen
- [ ] Reset tested after a full run-through
- [ ] No existing app changed; no email addresses or real client data committed
- [ ] Screenshots of each scene attached to the PR

---

## Appendix A — Source material

**A.1 Client email** — reproduced in full in section 2.1.

**A.2 Prior analysis.** Before this PRD, Mlu worked through the email in a separate session. Its conclusions, which this PRD adopts:

- The five requests test whether the ERP has a proper accounting engine rather than basic invoicing: asset management and depreciation; deferred expenses and amortisation; multi-entity and consolidated accounting; financial reporting; multi-currency and FX accounting.
- The demo should be **one end-to-end finance story, not five disconnected features**: buy an asset → capture the prepaid insurance → post transactions across branches and companies → produce the statements → settle a USD invoice in local currency, drilling from consolidated figures down to transactions.
- Worked examples there used rand (a R600,000 vehicle over five years; R120,000 insurance over twelve months; a USD 10,000 invoice at 18.00 then paid at 18.50 for an FX loss of R5,000). This PRD keeps the same shapes and re-bases them to UGX, with the scenes reordered so the reports come after the transactions that feed them.

**A.3 Chart of accounts — minimum set**

| Type | Accounts |
|---|---|
| Assets | Bank – UGX; Bank – USD; Accounts Receivable; Prepaid Insurance; Prepaid Software; Motor Vehicles – Cost; Plant & Equipment – Cost; Accumulated Depreciation – Motor Vehicles; Accumulated Depreciation – Plant & Equipment; Intercompany Receivable |
| Liabilities | Accounts Payable; Bank Loan; Intercompany Payable |
| Equity | Share Capital; Retained Earnings |
| Income | Sales; Rental Income; Management Fee Income |
| Cost of sales | Cost of Sales |
| Expenses | Salaries; Rent; Utilities; Kitchen Supplies; Medical Insurance; Software Licences; Depreciation; Management Fees; Interest; Realised FX Gain/Loss |

Each account carries its cash-flow classification (operating, investing, financing) so the cash flow statement is derived, not hand-built.