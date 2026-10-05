// Module state: the ledger, the scope selector, the sub-router, and the live
// actions.
//
// All the accounting lives in engine/; this file is the thin React layer over it.
// Live actions survive navigation between scenes. A refresh rebuilds the opening
// state, which is why the Reset control exists.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { GROUP_SCOPE } from "./config.js";
import * as actions from "./engine/actions.js";
import { buildState } from "./seed/build.js";

export const FinanceContext = createContext(null);
export const useFinance = () => useContext(FinanceContext);

// ─── Routing ──────────────────────────────────────────────────────────────────
// The top-level AppRouter only reads the first hash segment, so everything after
// `#/finance/` is parsed here.

export const SECTIONS = [
  "home", "assets", "deferrals", "payables",
  "ledger", "journals", "period-close", "reports",
  "accounts", "mapping",
];

export function readRoute() {
  const hash = (typeof window !== "undefined" ? window.location.hash : "") || "";
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  // parts[0] is "finance"
  const section = parts[1] ? parts[1].toLowerCase() : "home";
  return {
    section: SECTIONS.includes(section) ? section : "home",
    rest: parts.slice(2),
    path: parts.slice(1).join("/"),
  };
}

export function navigate(path) {
  const next = path ? `#/finance/${path}` : "#/finance";
  if (window.location.hash === next) return;
  window.location.hash = next;
}

export function useFinanceStore() {
  const [state, setState] = useState(buildState);
  const [route, setRoute] = useState(readRoute);
  const [scope, setScope] = useState(GROUP_SCOPE);

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = useCallback((path) => navigate(path), []);

  const reset = useCallback(() => {
    setState(buildState());
    setScope(GROUP_SCOPE);
  }, []);

  // Each action returns the thing it created as well as the new state, so a view
  // can navigate straight to it and the toast can name it.
  const createAsset = useCallback((input) => {
    let created = null;
    setState((s) => {
      const r = actions.createAsset(s, input);
      created = r.asset;
      return r.state;
    });
    return created;
  }, []);

  const createSupplierInvoice = useCallback((input) => {
    let created = null;
    setState((s) => {
      const r = actions.createSupplierInvoice(s, input);
      created = { invoice: r.invoice, deferral: r.deferral };
      return r.state;
    });
    return created;
  }, []);

  const payInvoice = useCallback((input) => {
    let created = null;
    setState((s) => {
      const r = actions.payInvoice(s, input);
      created = { payment: r.payment, calc: r.calc };
      return r.state;
    });
    return created;
  }, []);

  // The three period-end acts, each callable on its own from the screen that
  // owns it, plus the one-click version that does all three in order.
  const runDepreciation = useCallback((period) => {
    let result = null;
    setState((s) => {
      const r = actions.runDepreciation(s, period);
      result = r.plan;
      return r.state;
    });
    return result;
  }, []);

  const runAmortisation = useCallback((period) => {
    let result = null;
    setState((s) => {
      const r = actions.runAmortisation(s, period);
      result = r.plan;
      return r.state;
    });
    return result;
  }, []);

  const closePeriod = useCallback((period) => {
    let result = null;
    setState((s) => {
      const r = actions.closePeriod(s, period);
      result = r.period;
      return r.state;
    });
    return result;
  }, []);

  const runMonthEnd = useCallback((period) => {
    let result = null;
    setState((s) => {
      const r = actions.runMonthEnd(s, period);
      result = r.plan;
      return r.state;
    });
    return result;
  }, []);

  const openPeriod = actions.openPeriod(state);

  return useMemo(
    () => ({
      ...state,
      openPeriod,
      scope, setScope,
      route, go,
      reset,
      createAsset, createSupplierInvoice, payInvoice,
      runDepreciation, runAmortisation, closePeriod, runMonthEnd,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, scope, route, openPeriod],
  );
}
