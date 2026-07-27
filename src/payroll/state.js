// Payroll module state — cycle type, selected period, and the run lifecycle
// (before -> ready -> processing -> completed). Kept simple: no API calls.
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PERIODS, DEFAULT_PERIOD_ID, TOTAL_IN_RUN, RUN } from "./data.js";

export const PayrollContext = createContext(null);
export const usePayroll = () => useContext(PayrollContext);

const periodById = (id) => PERIODS.find((p) => p.id === id);

export function usePayrollStore() {
  const [cycleType, setCycleType] = useState("Monthly");
  const [periodId, setPeriodIdState] = useState(DEFAULT_PERIOD_ID);
  const [phase, setPhase] = useState(periodById(DEFAULT_PERIOD_ID).phase);
  const [progress, setProgress] = useState(periodById(DEFAULT_PERIOD_ID).phase === "completed" ? 100 : 0);
  const timer = useRef(null);

  useEffect(() => () => timer.current && clearInterval(timer.current), []);

  const period = periodById(periodId);

  const setPeriodId = (id) => {
    if (timer.current) clearInterval(timer.current);
    const p = periodById(id);
    setPeriodIdState(id);
    setPhase(p.phase);
    setProgress(p.phase === "completed" ? 100 : 0);
  };

  const runPayroll = () => {
    if (phase !== "ready") return;
    setPhase("processing");
    setProgress(0);
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 4;
        if (next >= 100) {
          clearInterval(timer.current);
          setPhase("completed");
          return 100;
        }
        return next;
      });
    }, 90);
  };

  const resetRun = () => {
    if (timer.current) clearInterval(timer.current);
    setPhase("ready");
    setProgress(0);
  };

  const processed = phase === "completed" ? TOTAL_IN_RUN : Math.round((progress / 100) * TOTAL_IN_RUN);
  const success = Math.min(processed, RUN.included);
  const failed = Math.min(Math.max(processed - RUN.included, 0), RUN.excluded);

  return useMemo(
    () => ({
      cycleType, setCycleType,
      periodId, setPeriodId, period,
      phase, progress, processed, success, failed,
      runPayroll, resetRun,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cycleType, periodId, phase, progress],
  );
}
