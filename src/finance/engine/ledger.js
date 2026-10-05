// The ledger.
//
// This is the only thing in the module that holds a number. Asset NBV, prepaid
// balances, every line of every statement and every drill-down level are
// computed from the posted journal lines below. Nothing is typed into a data
// file as a report total.
//
// Pure: no React, no browser APIs. check.mjs runs this file directly.

import { account, naturalSign } from "./coa.js";

export function emptyLedger() {
  return { journals: [], seq: 0 };
}

// A journal line: { account, debit, credit, company, branch, counterparty?, fx? }
// `fx` is { currency, amount (minor units), rate } on lines that originate in a
// foreign currency. `counterparty` names the other company on an intercompany
// line and is what the Eliminations column is derived from.
//
// Every journal must balance *within a single company and branch*. A
// transaction that crosses companies is posted as two journals joined through
// the intercompany accounts — that is what lets the balance sheet balance at
// branch level, not just for the group.
export function validate(entry) {
  if (!entry.date) throw new Error("journal has no date");
  if (!entry.lines || entry.lines.length === 0) throw new Error(`journal ${entry.memo} has no lines`);

  const perUnit = new Map();
  for (const l of entry.lines) {
    if (!account(l.account)) throw new Error(`unknown account ${l.account}`);
    if (!l.company || !l.branch) throw new Error(`line on ${l.account} has no company/branch`);
    const d = l.debit || 0;
    const c = l.credit || 0;
    if (d < 0 || c < 0) throw new Error(`negative amount on ${l.account}`);
    if (d && c) throw new Error(`line on ${l.account} is both a debit and a credit`);
    if (!Number.isInteger(d) || !Number.isInteger(c)) throw new Error(`non-integer amount on ${l.account}`);
    const key = `${l.company}/${l.branch}`;
    const cur = perUnit.get(key) || { d: 0, c: 0 };
    cur.d += d;
    cur.c += c;
    perUnit.set(key, cur);
  }
  for (const [key, { d, c }] of perUnit) {
    if (d !== c) {
      throw new Error(`journal "${entry.memo}" (${entry.date}) does not balance in ${key}: Dr ${d} Cr ${c}`);
    }
  }
  return true;
}

export function post(ledger, entry) {
  validate(entry);
  const seq = ledger.seq + 1;
  const journal = {
    id: `J${String(seq).padStart(5, "0")}`,
    ref: entry.ref || `JNL-${String(seq).padStart(5, "0")}`,
    date: entry.date,
    memo: entry.memo || "",
    source: entry.source || { type: "manual", id: null },
    batch: entry.batch || null,
    lines: entry.lines.map((l) => ({
      account: l.account,
      debit: l.debit || 0,
      credit: l.credit || 0,
      company: l.company,
      branch: l.branch,
      counterparty: l.counterparty || null,
      fx: l.fx || null,
    })),
  };
  return { seq, journals: [...ledger.journals, journal] };
}

export function postMany(ledger, entries) {
  let seq = ledger.seq;
  const added = [];
  for (const entry of entries) {
    validate(entry);
    seq += 1;
    const journal = {
      id: `J${String(seq).padStart(5, "0")}`,
      ref: entry.ref || `JNL-${String(seq).padStart(5, "0")}`,
      date: entry.date,
      memo: entry.memo || "",
      source: entry.source || { type: "manual", id: null },
      batch: entry.batch || null,
      lines: entry.lines.map((l) => ({
        account: l.account,
        debit: l.debit || 0,
        credit: l.credit || 0,
        company: l.company,
        branch: l.branch,
        counterparty: l.counterparty || null,
        fx: l.fx || null,
      })),
    };
    added.push(journal);
  }
  return { seq, journals: [...ledger.journals, ...added] };
}

export const journalById = (ledger, id) => ledger.journals.find((j) => j.id === id);

// ─── Flattened lines ──────────────────────────────────────────────────────────
// Most queries want lines with their journal's header fields attached. The flat
// array is derived once per ledger object and cached, so a screen that asks six
// questions of the ledger walks it once.

const flatCache = new WeakMap();

export function lines(ledger) {
  const hit = flatCache.get(ledger);
  if (hit) return hit;
  const out = [];
  for (const j of ledger.journals) {
    for (let i = 0; i < j.lines.length; i += 1) {
      const l = j.lines[i];
      out.push({
        ...l,
        key: `${j.id}:${i}`,
        journalId: j.id,
        ref: j.ref,
        date: j.date,
        memo: j.memo,
        source: j.source,
        batch: j.batch,
        amount: (l.debit || 0) - (l.credit || 0),
      });
    }
  }
  flatCache.set(ledger, out);
  return out;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export const inScope = (line, scope) => {
  if (!scope || !scope.company) return true;
  if (line.company !== scope.company) return false;
  if (scope.branch && line.branch !== scope.branch) return false;
  return true;
};

export const inPeriod = (date, period) => {
  if (!period) return true;
  if (period.from && date < period.from) return false;
  if (period.to && date > period.to) return false;
  return true;
};

// Every query funnels through here so "scope + period + accounts" means exactly
// one thing across the whole module.
export function query(ledger, { codes, scope, from, to, source, intercompanyOnly } = {}) {
  const set = codes ? new Set(codes) : null;
  const period = { from, to };
  return lines(ledger).filter((l) => {
    if (set && !set.has(l.account)) return false;
    if (!inPeriod(l.date, period)) return false;
    if (!inScope(l, scope)) return false;
    if (intercompanyOnly && !l.counterparty) return false;
    if (source && (l.source?.type !== source.type || (source.id != null && l.source?.id !== source.id))) return false;
    return true;
  });
}

// Signed balance: debits less credits. Report code applies naturalSign where a
// credit-side account should read positive.
export function balance(ledger, opts) {
  let total = 0;
  for (const l of query(ledger, opts)) total += l.amount;
  return total;
}

// Same, read in the accounts' natural direction — a positive number means "more
// of what these accounts are for" (income earned, liabilities owed).
export function naturalBalance(ledger, opts) {
  let total = 0;
  for (const l of query(ledger, opts)) total += l.amount * naturalSign(l.account);
  return total;
}

// Signed balance per account code, for the accounts that actually moved.
export function balancesByAccount(ledger, opts = {}) {
  const map = new Map();
  for (const l of query(ledger, opts)) {
    map.set(l.account, (map.get(l.account) || 0) + l.amount);
  }
  return map;
}

export function balancesByCompany(ledger, opts = {}) {
  const map = new Map();
  for (const l of query(ledger, opts)) {
    map.set(l.company, (map.get(l.company) || 0) + l.amount);
  }
  return map;
}

export function balancesByBranch(ledger, opts = {}) {
  const map = new Map();
  for (const l of query(ledger, opts)) {
    const k = `${l.company}/${l.branch}`;
    map.set(k, (map.get(k) || 0) + l.amount);
  }
  return map;
}

// Trial balance rows for a scope/period, in account-code order.
export function trialBalance(ledger, opts = {}) {
  const map = balancesByAccount(ledger, opts);
  return [...map.entries()]
    .filter(([, v]) => v !== 0)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([code, v]) => ({
      code,
      name: account(code).name,
      type: account(code).type,
      debit: v > 0 ? v : 0,
      credit: v < 0 ? -v : 0,
      signed: v,
    }));
}
