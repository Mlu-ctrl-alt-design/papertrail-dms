// Meta message template library (6.1.7 system notifications).
import { ViewHeader } from "../../components/index.js";
import { ComingNext } from "../ui.jsx";

export function TemplatesView() {
  return (
    <>
      <ViewHeader title="Templates" subtitle="Approved WhatsApp message templates" />
      <ComingNext
        title="Message template library"
        clause="6.1.7"
        bullets={[
          "Template register with Meta category (UTILITY, AUTHENTICATION, MARKETING), language, approval status and quality rating.",
          "Handset preview of each template alongside the exact Cloud API template object it produces.",
          "Submission for Meta approval, with the review lifecycle modelled.",
          "Reference-number, case-status, determination, reminder, OTP and broadcast notifications.",
        ]}
      />
    </>
  );
}
