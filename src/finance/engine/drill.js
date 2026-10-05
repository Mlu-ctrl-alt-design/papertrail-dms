// Drill-down: resolving a report figure into the things it is made of.
//
//   report line → by company → by branch → by account → ledger lines → journal
//
// Levels that the current scope already fixes are skipped, and so is the branch
// level for a single-branch company. Every level sums to the level above, which
// is the property check.mjs samples: if a drill level ever disagreed with its
// parent the demo would break on the client's first click.

import { COMPANIES, branchName, companyName, companyShort } from "../config.js";
import { accountName } from "./coa.js";
import { balance, query } from "./ledger.js";

// A drill node describes one level of the path.
// { level, label, scope, codes, sign, from, to, amount }
export function rootNode({ label, codes, sign = 1, scope, from, to, basis = "movement", intercompanyOnly = false }) {
  return { level: "root", label, codes, sign, scope: scope || { company: null, branch: null }, from, to, basis, intercompanyOnly };
}

const branchesOf = (companyId) => COMPANIES.find((c) => c.id === companyId)?.branches || [];

export function nextLevel(node) {
  if (node.level === "ledger") return null;
  if (!node.scope.company) return "company";
  if (!node.scope.branch && branchesOf(node.scope.company).length > 1) return "branch";
  if (node.codes && node.codes.length > 1) return "account";
  return "ledger";
}

const amountOf = (ledger, node, scope, codes) =>
  node.sign * balance(ledger, {
    codes, scope, from: node.from, to: node.to, intercompanyOnly: node.intercompanyOnly,
  }) + 0;

// The rows at the next level down, each already a node you can drill again.
export function drillRows(ledger, node) {
  const level = nextLevel(node);
  if (!level) return { level: null, rows: [] };

  if (level === "company") {
    const rows = COMPANIES.map((c) => {
      const scope = { company: c.id, branch: null };
      return {
        id: c.id,
        label: c.name,
        amount: amountOf(ledger, node, scope, node.codes),
        node: { ...node, level: "company", scope, label: `${node.label} · ${companyShort(c.id)}` },
      };
    });
    return { level, rows };
  }

  if (level === "branch") {
    const rows = branchesOf(node.scope.company).map((b) => {
      const scope = { company: node.scope.company, branch: b.id };
      return {
        id: b.id,
        label: b.name,
        amount: amountOf(ledger, node, scope, node.codes),
        node: { ...node, level: "branch", scope, label: `${node.label} · ${b.name}` },
      };
    });
    return { level, rows };
  }

  if (level === "account") {
    const rows = node.codes.map((code) => ({
      id: code,
      label: `${code} · ${accountName(code)}`,
      amount: amountOf(ledger, node, node.scope, [code]),
      node: { ...node, level: "account", codes: [code], label: accountName(code) },
    }));
    return { level, rows };
  }

  // Ledger: the individual journal lines behind the figure.
  const ls = query(ledger, {
    codes: node.codes, scope: node.scope, from: node.from, to: node.to,
    intercompanyOnly: node.intercompanyOnly,
  }).slice().sort((a, b) => (a.date === b.date ? a.journalId.localeCompare(b.journalId) : a.date.localeCompare(b.date)));
  return { level: "ledger", rows: ls.map((l) => ({ id: l.key, line: l, amount: node.sign * l.amount + 0 })) };
}

// The breadcrumb: the chain of nodes from the report row to where we are now.
export function crumbs(path) {
  return path.map((n, i) => ({
    key: `${i}-${n.level}`,
    label: n.level === "root"
      ? n.label
      : n.level === "company"
        ? companyName(n.scope.company)
        : n.level === "branch"
          ? branchName(n.scope.company, n.scope.branch)
          : accountName(n.codes[0]),
    index: i,
  }));
}

export const nodeAmount = (ledger, node) => amountOf(ledger, node, node.scope, node.codes);
