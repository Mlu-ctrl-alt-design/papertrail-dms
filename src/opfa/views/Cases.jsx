// Case register (6.1.2 complaint management, 6.1.4 document management).
import { ViewHeader } from "../../components/index.js";
import { ComingNext } from "../ui.jsx";

export function CasesView() {
  return (
    <>
      <ViewHeader title="Cases" subtitle="Complaints reachable through the WhatsApp channel" />
      <ComingNext
        title="Case register"
        clause="6.1.2 / 6.1.4"
        bullets={[
          "Searchable, filterable register of complaints with stage, fund, employer and adjudicator.",
          "Case record drawer: status timeline, correspondence, and the documents held against the file.",
          "Complainant uploads (ID copies, payslips) arriving from WhatsApp, with the Respond document ID they were filed under.",
          "Determination and correspondence downloads pushed back to the handset.",
          "Settlement confirmation captured from the complainant and written back to Respond.",
        ]}
      />
    </>
  );
}
