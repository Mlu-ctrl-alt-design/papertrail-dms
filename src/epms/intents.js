// Tiny module-level intent store. Used to pass a one-shot cross-view action
// (e.g. "open cascade for sd5 after navigating to SDBIP") without coupling
// views via context or props. Consumed once and cleared.

let pending = null;

export const setIntent  = (i) => { pending = i; };
export const takeIntent = () => { const v = pending; pending = null; return v; };
