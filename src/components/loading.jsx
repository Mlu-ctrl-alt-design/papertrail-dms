import { useState, useEffect } from "react";
import { C } from "./tokens.js";

// Top-of-viewport indeterminate progress bar — show during nav transitions.
export function TopProgressBar({ active }) {
  if (!active) return null;
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 2,
      background: "transparent", overflow: "hidden", zIndex: 6000, pointerEvents: "none",
    }}>
      <div style={{
        height: "100%", width: "25%",
        background: `linear-gradient(90deg,transparent,${C.brand} 40%,${C.brand} 60%,transparent)`,
        animation: "loadbar 0.9s ease-in-out infinite",
      }}/>
    </div>
  );
}

// Hook: returns `true` for `durationMs` whenever any of `deps` change, so
// tables can show shimmer rows on filter / sort / page change.
export function useSimulatedLoad(deps, durationMs = 400) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), durationMs);
    return () => clearTimeout(t);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return loading;
}

export const simulateLatency = (ms = 700) => new Promise(r => setTimeout(r, ms));
