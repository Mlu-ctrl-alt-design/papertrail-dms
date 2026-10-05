# Demo script: Ezra360 Financials for HUGAMARA

**Audience:** Vince Ssemyalo (HUGAMARA) and the thread.
**Length:** 25–30 minutes, plus an optional 6-minute "under the bonnet" scene.
**Anyone can present this.** It is written click by click, with the line to say and the
number that should be on screen at each step.

---

## Before you start

1. Open the preview URL and go to `#/finance`. Leave it on the Home screen.
2. Check the context bar reads **Scope: Hugamara Group · Open period: October 2026 ·
   Books closed to 30 Sep 2026**. If it does not, click **Reset demo data** and confirm.
3. Share a maximised browser window. The screens are laid out for 1440 × 900.
4. If anything goes sideways mid-demo, **Reset demo data** puts the books back to the
   opening state and you can pick up from any scene.

**One sentence to keep in your pocket, because it is the whole argument:**

> There is one ledger, and nothing else in this system holds a number. Every figure you
> see — the net book value, the prepaid balance, every line of every statement — is
> computed from the journals. That is why you can click any of them.

---

## Scene 0 — Set the scene · `#/finance` · 2 min

**Do:** Land on Home. Point at the context bar, then the group structure card.

**Say:**
> This is one system holding three companies and five branches on one set of books.
> The books are closed to the end of September. October is open — everything I capture
> today lands in October, and at the end I will close it.

**On screen:** Three companies in the Group structure card. Five tiles across the top.
The recap card listing the five things you asked for.

**Point at the recap card:**
> Those five lines are your email. We are going to walk them in order, and each one has
> something I actually do live rather than a screen I prepared earlier.

---

## Scene 1 — Fixed assets · `#/finance/assets` · 5 min

**Do:** Click **Fixed Assets** in the left nav.

**On screen:** Cost UGX 248,400,000 · Accumulated depreciation UGX 41,100,000 ·
**Net book value UGX 207,300,000** · Charge per month UGX 4,900,000.

**Do:** Click the first row, **Delivery vehicle — Toyota Hiace**.

**On screen:**

| | |
|---|---|
| Cost | **UGX 180,000,000** |
| Accumulated depreciation | **UGX 27,000,000** |
| Net book value | **UGX 153,000,000** |
| Months remaining | 51 · 9 of 60 charges posted |

**Say:**
> Somebody entered a cost of 180 million, a date, and a category. That is all. The
> category carries the method and the five-year life, so the system built the sixty-month
> schedule itself and has been posting three million a month since January. Nine are
> posted; the net book value is 153 million, and it is not stored anywhere — it is the
> cost less everything the system has posted against this asset.

**Do:** Scroll the schedule. Point at the September row (Posted) and the October row
(highlighted, **Next run**).

**Do:** Click any **Posted** link in the schedule.

**Say:**
> And that is the journal it posted. Depreciation debited, accumulated depreciation
> credited, in Hospitality, Kampala Central.

Close the panel.

### Now buy one live

**Do:** **Back to register** → **New asset**. Click **Use the demo figures** (or type it:
Commercial kitchen equipment · Plant & Equipment · Hospitality · Entebbe · 48,000,000 ·
1 October 2026 · paid from bank).

**Say, before saving:**
> Watch the panel at the bottom as I fill this in.

**On screen, before saving:** *48 monthly charges of UGX 1,000,000 · First charge October
2026 · Dr 1510 UGX 48,000,000 / Cr 1010 UGX 48,000,000.*

**Do:** **Save and post.**

**On screen:** Cost UGX 48,000,000 · Accumulated UGX 0 · **NBV UGX 48,000,000** · a
48-row schedule, October marked **Next run**.

**Say:**
> Schedule generated, acquisition journal posted, register total moved. Nobody calculated
> anything, and nothing has touched the income statement — the cost is on the balance
> sheet and will reach the P&L one month at a time.

### And run the depreciation, right here

**Do:** **Back to register**, then click **Run depreciation — October** in the header.

**On screen, before anything posts:** 5 journals · **UGX 4,900,000** · dated 31 Oct 2026 ·
*Dr Depreciation / Cr Accumulated depreciation* · posted by *Fixed Assets | Depreciation
Run | Transaction Ledger* — and every asset listed with its charge and which charge of how
many it is (the Hiace at **10 of 60**).

**Say:**
> This is the "auto" in your first line. It is a run that belongs to the fixed asset
> module, and it tells me exactly what it is about to post before it posts anything. Each
> asset already knows what it owes this month from its own schedule.

**Do:** **Post 5 journals.**

**On screen:** the Hiace's accumulated depreciation goes to **30,000,000** and its net book
value to **150,000,000**; the register total moves to **UGX 202,400,000**; and the button
greys out to **Depreciation posted for October**.

**Say:**
> Run it again and it posts nothing — whatever is already in the ledger is not due. And
> notice the period is still open at the top: running depreciation and closing the month
> are two different things.

> **Presenter note.** Doing it here is the strongest moment for request 1, and scene 4
> then shows step 1 already posted — which is the point, because the run belongs to this
> module rather than to period close. If you would rather keep everything for scene 4,
> skip this beat and use **Run all and close October** there instead.

---

## Scene 2 — Deferred expenses · `#/finance/deferrals` · 4 min

**Do:** Click **Deferred Expenses**.

**On screen:** Invoiced UGX 120,000,000 · Released to expense UGX 90,000,000 ·
**Prepaid balance UGX 30,000,000**.

**Do:** Click **Group medical insurance — 2026 cover**.

**Say:**
> This is your example almost exactly. A medical insurance invoice of 120 million, paid
> in January, covering the calendar year. It did not go to the income statement in
> January. It went to the balance sheet as a prepayment, and ten million has moved to
> expense every month since. Nine months in, 90 million is expensed and 30 million is
> still prepaid.

**On screen:** the twelve-row schedule, nine Posted, October **Next run**.

### Now capture one live

**Do:** **Back to deferrals** → **Supplier invoice** → **Use the demo figures** (Lakeside
Systems · LS-1182 · Annual software licence · Properties · Kampala · 24,000,000 ·
1 October 2026 · cover 1 Oct 2026 – 30 Sep 2027).

**Say:**
> The only thing that makes this a deferral is this toggle and these two dates.

**On screen, before saving:** *Effect on the P&L today: Nil — the cost is a prepayment*,
and a schedule preview of **12 months of UGX 2,000,000** starting October 2026.

**Do:** **Save and post.**

**Say:**
> Two dates in, twelve months out. Nothing in the income statement today.

---

## Scene 3 — A dollar invoice paid in shillings · `#/finance/payables` · 5 min

**Do:** Click **Payables**. Point at the **Foreign-currency exposure** tile:
**USD 10,000.00**.

**Do:** Click the **East Africa Supply Partners · ESP-7741** row.

**On screen:** Invoiced **USD 10,000.00** at 3,700 on the invoice date ·
**UGX 37,000,000** on the books · Still outstanding **USD 10,000.00**.

**Say:**
> This invoice is in dollars and it stays in dollars. The ledger carries it at 37 million
> shillings because that is what it was worth on the 15th of September at 3,700.

**Optional, 20 seconds:** **Exchange rates** on the Payables list shows the rate table the
system reads from.

**Do:** **Pay invoice**.

**On screen, before posting anything:**

| | |
|---|---|
| Pay from | Bank – UGX |
| Payment date | 20 Oct 2026 |
| Amount to settle | USD 10,000.00 |
| Rate | **3,750** — filled from the rate table for 20 Oct, and editable |
| **Realised FX loss** | **UGX 500,000** |
| Payables relieved at 3,700 | UGX 37,000,000 |
| Cash leaving the bank at 3,750 | **UGX 37,500,000** |

**Say:**
> I have not posted anything yet. The shilling has moved from 3,700 to 3,750 since the
> invoice, so settling ten thousand dollars costs 37.5 million, the payable only comes off
> at 37 million, and the half million difference is a realised exchange loss. The system
> worked that out, not me.

**Optional — the two variants, if he asks (and he might):**

- Type **5000** in the amount: the panel re-reads **UGX 18,750,000 paid · 18,500,000
  relieved · FX loss UGX 250,000 · USD 5,000.00 will remain outstanding.** Put 10000 back.
- Type **3650** in the rate: the panel turns green — **realised FX gain UGX 500,000**.
  Put 3750 back.

**Do:** Scroll to the **Journal preview**. Three lines: Dr Accounts Payable 37,000,000,
Dr Realised FX Gain/Loss 500,000, Cr Bank – UGX 37,500,000.

**Do:** **Post payment.**

**On screen:** Still outstanding **Settled** · Realised FX loss **UGX 500,000** · status
**PAID**.

---

## Scene 4 — Month-end · `#/finance/period-close` · 3 min

**Do:** Click **Period Close**.

**On screen:** three numbered steps.

1. **Depreciation — October 2026** · **Posted**, if you ran it in scene 1. The card says so
   and points at Fixed Assets, "which owns this run".
2. **Amortisation — October 2026** · **2 pending**, listing the medical insurance and the
   software licence you captured in scene 2, **UGX 12,000,000**.
3. **Close October 2026** · disabled, saying in plain words why: *October 2026 cannot be
   closed yet — 2 amortisation journals still to post.*

**Say:**
> Three separate things. Depreciation is a run that belongs to fixed assets. Amortisation
> is a run that belongs to prepayments. Closing is neither — it posts nothing at all, it
> just locks the month. And it will not let me lock a month that is still missing its own
> charges.

**Do:** **Run amortisation — UGX 12,000,000** → **Post 2 journals**.

**Do:** **Close October 2026** → **Close the period**.

**On screen:** the context bar flips to **Open period: November 2026 · Books closed to
31 Oct 2026**.

**Say:**
> Nobody raised a journal. This is the "auto" in your email, and it is auditable — each of
> those runs told me what it would post before it posted it.

**If you skipped the scene 1 run,** use **Run all and close October** in the header
instead: one click does the same three steps in order, and the confirm lists all three.

**Do:** Follow the **See the asset register →** link, then open the Hiace.

**On screen:** Accumulated **UGX 30,000,000** · **NBV UGX 150,000,000**.

**Do:** Go to **Deferred Expenses** and open the insurance.

**On screen:** Recognised **UGX 100,000,000** · **Prepaid balance UGX 20,000,000**.

**Say:**
> 153 became 150. Thirty million prepaid became twenty, across two companies, and I never
> opened a journal.

---

## Scene 5 — The three statements · `#/finance/reports` · 5 min

**Do:** Click **Reports**. Leave it on **Profit & loss**, Group, Year to date, October.

**Point at:**
- **Medical Insurance 100,000,000** — the ten slices, not the 120 million invoice.
- **Software Licences 2,000,000** — one month of the licence you watched him capture.
- **Depreciation 47,000,000** — including the kitchen equipment's first charge.
- **Realised FX Gain/Loss 500,000** — the payment you watched post.

**Say:**
> Every one of those four numbers is a transaction you watched me make in the last twenty
> minutes.

**Do:** Click the **Balance sheet** tab.

**Point at:** the **Balanced ✓** indicator top right, **Property, plant and equipment at
NBV**, and **Prepayments**.

**Say:**
> That tick is not a label. It is the live difference between total assets and total
> liabilities plus equity, and it would show the difference if there were one. The fixed
> asset line is the asset register total, and prepayments is the deferrals list total — the
> same arithmetic read twice.

**Do:** Click the **Cash flow** tab. Scroll to the bottom.

**Point at:** **Purchase of property, plant and equipment** under Investing — the 48
million is in there — and **Cash at the end of the period**, which equals Bank on the
balance sheet.

**Say:**
> Every account that is not a bank account is classified into exactly one line of this
> statement, so the movement on cash is the arithmetic opposite of the movement on
> everything else. It cannot drift.

**Do:** Change **Scope** in the context bar to Hugamara Hospitality Ltd, then to
Hospitality · Kampala Central. The statement reruns for each.

---

## Scene 6 — Consolidation and drill-down · `#/finance/reports/consolidated` · 5 min

**Do:** Set **Scope** back to Hugamara Group. Click the **Reports › Consolidated** link
(or set **View** to *By company*). Go to the **Profit & loss** tab.

**On screen:** a column per company, an **Eliminations** column, a **Group** column.

**Do:** Scroll to **Management Fees** and **Management Fee Income**.

**Say:**
> Holdings charges Hospitality a management fee of fifteen million a month. It is income
> in one company and an expense in another, which is right — and it is nothing at all for
> the group, which is also right. The Eliminations column is derived from the counterparty
> tag on each intercompany line. Nobody types it in.

### Now drill

**Do:** Click the **Group** figure on the **Depreciation** row.

**On screen:** the drawer opens — **41,100,000**, by company: Holdings 3,200,000,
Hospitality 34,400,000, Properties 3,500,000, totalling 41,100,000.

**Do:** Click **Hugamara Hospitality Ltd** → **Kampala Central** → any ledger line.

**On screen:** the journal entry, and under it the **source document** — the asset record,
with cost, in-service date, method and life, and an **Open asset** button.

**Say:**
> Four clicks from a consolidated headline to the document that caused it, and the amount
> at every level is the sum of the level below. Use the breadcrumb to come back up.

**Do, if you have time — the one he will want:** close the drawer, scroll to **Realised FX
Gain/Loss**, click the Group figure, and drill it the same way. It lands on the payment
journal and the dollar invoice you settled in scene 3.

**Do:** Set **View** to *By branch* and pick Hospitality.

**Say:**
> And the same report by branch inside a company. The branch columns add to the company,
> because branch is a dimension on every journal line rather than a separate ledger.

---

## Scene 6b — Under the bonnet · optional · 6 min

Run this when the audience includes anyone who will have to configure or audit the
system, or whenever someone asks "but where does it decide what to debit?". It is the
answer to the question an accountant asks after the first six scenes.

### Chart of accounts · `#/finance/accounts`

**Do:** Click **Chart of Accounts** under Setup.

**Say:**
> Thirty-one accounts. Each one carries its type, the side it normally sits on, and where
> it belongs on the cash flow statement — which is why the cash flow is derived rather
> than drawn by hand.

**Point at** account 1550, Accumulated Depreciation: an asset account whose normal
balance is **Credit · contra**, carrying a credit balance.

**Do:** Open the **Account types** tab.

**Say:**
> Six types. Three of them are carried forward every year and three are reset. That one
> rule is the difference between the balance sheet and the income statement, and it is
> configuration rather than code.

### Ledger mapping · `#/finance/mapping`

**Do:** Click **Ledger Mapping**.

**On screen:** 15 ledger entry mappings, each with its module, entity and condition, and
a count of the journals it has actually posted — **453**, which is every journal in the
ledger.

**Say:**
> Nothing in this system decides on its own what to debit and what to credit. Every
> journal you have seen this morning was posted by one of these rules.

**Do:** Open **Accounts Payable | Payment | Transaction Ledger**.

**Point at the Summary** — Module, Post To, Entity, Transaction Type, Condition and the
Ezra QL — then at the **GL Mapping Rule** grid:

| Name | Entry Type | Account Field Id | Data Field |
|---|---|---|---|
| Debit Payable | Debit | `payablesAccount` | `payablesRelief` |
| Realised Exchange Difference | Debit / Credit | `fxAccount` | `fxDifference` |
| Credit Bank | Credit | `bankAccount` | `cashPaid` |

**Say:**
> This is the payment you watched me post. Three lines. The middle one is signed — it
> posts as a debit when the difference is a loss, as a credit when it is a gain, and
> disappears altogether when there is no difference. One rule, all three outcomes.

**Do, the one worth the trip:** go **Back to mappings** and open **Accounts Payable |
Invoice**, then **Accounts Payable | Deferred Invoice**.

**Say:**
> Same document. Same two-line grid. The only difference between them is the condition —
> `IsDeferred` — and whether the debit resolves to an expense account or a prepaid
> account. That one line of configuration is the whole of your second request.

### General ledger · `#/finance/ledger`

**Do:** Click **General Ledger**.

**On screen:** every account with its opening balance, the period's debits and credits
and its closing balance. Debits and credits for the period are equal.

**Do:** Click **1200 · Prepaid Insurance**.

**On screen:** opening nil, a debit of **120,000,000** on 2 January from the deferred
invoice, then nine credits of **10,000,000**, running down to **30,000,000** — and
against every line, the rule that posted it.

**Say:**
> This is the account an auditor would ask for, and the amortisation story told in one
> column. Each line names the rule that posted it, so you can go from a balance to the
> configuration and back.

**Do:** Click any **JNL-** reference.

**On screen:** the mapping, the two rule names, the journal entry and the source document
with a link to the deferral.

**Do:** Open the **Trial balance** tab.

**On screen:** total debits, total credits, **Difference: Nil**.

**Say:**
> And it proves itself. Every scope, every date.

---

## Scene 7 — Close · `#/finance` · 1 min

**Do:** Click **Home**.

**Say, pointing at the recap card one line at a time:**
> Fixed assets depreciated over their useful life with the net book value falling out of
> it. A prepaid invoice amortised over its cover period. Consolidation across the
> companies with branch accounting and drill-down. The three statements. And a shilling
> payment applied to a dollar invoice with the exchange difference booked on its own.
>
> All five on one set of books, and every number on every screen traceable to a document.

**If he asks "is this real or a mock-up":** it is a working accounting engine with no
database behind it. Everything you have seen is computed from journals in the browser, and
there is a script in the repository that replays this whole demo and asserts after every
step that the books still balance — at group level, at company level and at branch level.

---

## Numbers that must be on screen

If any of these is different, stop and reset.

| Where | Figure |
|---|---|
| Asset register, opening | NBV **207,300,000** |
| Hiace, opening | Cost 180,000,000 · Accumulated 27,000,000 · **NBV 153,000,000** |
| Hiace, after the depreciation run | Accumulated 30,000,000 · **NBV 150,000,000** |
| Depreciation run, October, before asset B | 5 journals · **UGX 4,900,000** |
| Depreciation run, October, after asset B | 6 journals · **UGX 5,900,000** |
| Kitchen equipment, on save | 48 charges of **1,000,000** · NBV 48,000,000 |
| Kitchen equipment, after the run | Accumulated 1,000,000 · **NBV 47,000,000** |
| Medical insurance, opening | Expensed 90,000,000 · **Prepaid 30,000,000** |
| Medical insurance, after the run | Expensed 100,000,000 · **Prepaid 20,000,000** |
| Software licence, on save | 12 months of **2,000,000**, from October 2026 |
| Dollar invoice | USD 10,000.00 at 3,700 = **UGX 37,000,000** |
| Payment at 3,750 | Cash **37,500,000** · relief 37,000,000 · **FX loss 500,000** |
| Partial, USD 5,000 at 3,750 | Cash 18,750,000 · relief 18,500,000 · **FX loss 250,000** |
| Full at 3,650 | Cash 36,500,000 · **FX gain 500,000** |
| Management fee, consolidated | Holdings 135,000,000 · Eliminations (135,000,000) · **Group nil** |
| Balance sheet, any scope | **Balanced** |
| Ledger mapping | 15 mappings · **453** journals posted from them |
| General ledger, any scope and date | Debits = credits · trial balance difference **Nil** |
| Prepaid Insurance ledger, at 31 Oct opening | Dr 120,000,000 · Cr 90,000,000 · balance **30,000,000** |

---

## Questions he may ask, and the honest answer

**"Can we run depreciation without closing the month?"** Yes — that is the button on the
asset register, and the period stays open. The two runs and the close are three separate
acts; a period will not close while either run still owes it something.

**"Can it do reducing balance?"** The engine takes the method from the asset category;
straight line is what is built. Reducing balance and disposals are the next thing in.

**"What about revaluing the open dollar balances at month end?"** Not in this build. The
realised difference on settlement is here; the unrealised revaluation of open foreign
balances is the next step and uses the same rate table.

**"Where is VAT?"** Deliberately left out of this dataset so that every worked number
above is clean. It is not a limitation of the engine.

**"Can I export it?"** Print / PDF on the statements and on the general ledger renders the
real report through the browser's print pipeline, so you choose the filename. Excel export
is not in this build.

**"Can we change what an invoice posts to?"** That is the Ledger Mapping screen. In this
build the rules are read-only on screen, but they are the live configuration — the engine
builds every journal from them, and the integrity script asserts that what landed in the
ledger is what the rule asked for. Editing them in the UI is the next step, not a rewrite.

**"Does it handle more than three companies?"** The group structure is configuration.
Consolidation is the same statement specification run once per company.
