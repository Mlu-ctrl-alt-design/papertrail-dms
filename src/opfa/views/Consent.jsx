// Consent, preferences and POPIA compliance (6.1.9, 6.1.10).
import { ViewHeader } from "../../components/index.js";
import { ComingNext } from "../ui.jsx";

export function ConsentView() {
  return (
    <>
      <ViewHeader title="Consent & POPIA" subtitle="Opt-in register, communication preferences and compliance mapping" />
      <ComingNext
        title="Consent management"
        clause="6.1.9 / 6.1.10"
        bullets={[
          "Opt-in register recording the method, timestamp and policy version for every consent captured.",
          "Per-contact communication preferences across service, reminder and marketing messages.",
          "Opt-out list with reasons, and the full consent audit history for each contact.",
          "POPIA, ECT Act and Meta Business Messaging Policy controls mapped to the clause each answers.",
        ]}
      />
    </>
  );
}
