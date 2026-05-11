// e-PMS app state (context + reducer). Mirrors the DMS pattern but with
// e-PMS-specific entities. Keeps the prototype simple — no API calls.

import { createContext, useReducer } from "react";
import {
  STRATEGIC_OBJECTIVES, STRATEGIC_RISKS,
  PERFORMANCE_OBJECTIVES, MASTER_KPIS,
  SDBIP_TARGETS, MSCOA_TRANSACTIONS, CAPITAL_PROJECTS,
  PERFORMANCE_AGREEMENTS, INDIVIDUAL_KPIS,
  POE_DOCUMENTS, COMPLIANCE_DEADLINES, ACTIVITY,
  CURRENT_USER,
} from "./data.js";

export const EPMSContext = createContext(null);

export const initialState = {
  objectives: STRATEGIC_OBJECTIVES,
  performanceObjectives: PERFORMANCE_OBJECTIVES,
  masterKpis: MASTER_KPIS,
  risks: STRATEGIC_RISKS,
  sdbipTargets: SDBIP_TARGETS,
  mscoaTx: MSCOA_TRANSACTIONS,
  capitalProjects: CAPITAL_PROJECTS,
  performanceAgreements: PERFORMANCE_AGREEMENTS,
  individualKpis: INDIVIDUAL_KPIS,
  poeDocuments: POE_DOCUMENTS,
  complianceDeadlines: COMPLIANCE_DEADLINES,
  activity: ACTIVITY,
  currentUser: CURRENT_USER,
};

let activityCounter = ACTIVITY.length + 1;
const logActivity = (state, entry) => ({
  ...state,
  activity: [{ id: activityCounter++, time: "Just now", ...entry }, ...state.activity].slice(0, 60),
});

export function epmsReducer(state, action) {
  switch (action.type) {
    case "UPDATE_OBJECTIVE":
      return logActivity({
        ...state,
        objectives: state.objectives.map((o) => o.id === action.id ? { ...o, ...action.patch } : o),
      }, { userId: state.currentUser.id, action: "Updated objective", target: action.id });

    case "UPDATE_SDBIP":
      return logActivity({
        ...state,
        sdbipTargets: state.sdbipTargets.map((t) => t.id === action.id ? { ...t, ...action.patch } : t),
      }, { userId: state.currentUser.id, action: "Updated SDBIP target", target: action.id });

    case "ADD_POE": {
      const doc = action.doc;
      return logActivity({
        ...state,
        poeDocuments: [doc, ...state.poeDocuments],
      }, { userId: state.currentUser.id, action: "Uploaded POE", target: doc.title });
    }

    case "VERIFY_POE":
      return logActivity({
        ...state,
        poeDocuments: state.poeDocuments.map((d) =>
          d.id === action.id ? { ...d, verified: true, verifiedBy: state.currentUser.id } : d),
      }, { userId: state.currentUser.id, action: "Verified POE", target: action.id });

    case "FLAG_TX":
      return logActivity({
        ...state,
        mscoaTx: state.mscoaTx.map((t) => t.id === action.id ? { ...t, status: "Flagged" } : t),
      }, { userId: state.currentUser.id, action: "Flagged transaction", target: action.id });

    case "SIGN_PA":
      return logActivity({
        ...state,
        performanceAgreements: state.performanceAgreements.map((p) =>
          p.id === action.id
            ? { ...p, signed: true, signedDate: new Date("2026-05-10").toISOString().split("T")[0] }
            : p),
      }, { userId: state.currentUser.id, action: "Signed PA", target: action.id });

    case "ADD_PA":
      return logActivity({
        ...state,
        performanceAgreements: [action.pa, ...state.performanceAgreements],
      }, { userId: state.currentUser.id, action: "Created PA", target: action.pa.employee });

    case "ADD_SO":
      return logActivity({
        ...state,
        objectives: [action.so, ...state.objectives],
      }, { userId: state.currentUser.id, action: "Created Strategic Objective", target: action.so.code });

    case "ADD_PO":
      return logActivity({
        ...state,
        performanceObjectives: [action.po, ...state.performanceObjectives],
      }, { userId: state.currentUser.id, action: "Created Performance Objective", target: action.po.code });

    case "ADD_KPI":
      return logActivity({
        ...state,
        masterKpis: [action.kpi, ...state.masterKpis],
      }, { userId: state.currentUser.id, action: "Created Master KPI", target: action.kpi.code });

    // Roll-forward: clone the selected Master KPIs to a target fiscal year.
    // Used at FY changeover to preserve mappings (Munsoft 7.3.2 §E "Copy KPIs").
    case "COPY_KPIS_FY": {
      const clones = action.ids.map((id) => {
        const src = state.masterKpis.find((k) => k.id === id);
        if (!src) return null;
        return { ...src, id: `kpi_${Date.now()}_${src.code.replace(/\s+/g, "")}`, fy: action.targetFy };
      }).filter(Boolean);
      return logActivity({
        ...state,
        masterKpis: [...clones, ...state.masterKpis],
      }, { userId: state.currentUser.id, action: `Rolled ${clones.length} KPIs → ${action.targetFy}`, target: action.targetFy });
    }

    case "MARK_COMPLIANCE":
      return logActivity({
        ...state,
        complianceDeadlines: state.complianceDeadlines.map((c) =>
          c.id === action.id ? { ...c, status: action.status } : c),
      }, { userId: state.currentUser.id, action: `Compliance → ${action.status}`, target: action.id });

    // Persona switcher — used by the demo TopBar to swap which user is "logged
    // in." This affects sidebar nav (row-level access), the dashboard
    // greeting, and the active IPMS scorecard (clerk view).
    case "SWITCH_PERSONA":
      return { ...state, currentUser: action.user };

    default:
      return state;
  }
}

export function useEPMSStore() {
  return useReducer(epmsReducer, initialState);
}
