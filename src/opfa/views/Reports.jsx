// Reporting and analytics (6.1.11).
import { ViewHeader } from "../../components/index.js";
import { ComingNext } from "../ui.jsx";

export function ReportsView() {
  return (
    <>
      <ViewHeader title="Reports" subtitle="Usage, chatbot analytics and message delivery" />
      <ComingNext
        title="Reporting and analytics"
        clause="6.1.11"
        bullets={[
          "Usage and volume reporting across the channel, by hour, day and intent.",
          "Chatbot analytics: containment and deflection rate, top intents, fallback rate, NLU confidence distribution.",
          "Message delivery reporting with the Meta message ID and delivery state for every message sent.",
          "Export to Excel (CSV) and to PDF via the print pipeline.",
        ]}
      />
    </>
  );
}
