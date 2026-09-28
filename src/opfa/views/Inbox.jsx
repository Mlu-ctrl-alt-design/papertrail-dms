// Agent inbox (6.1.5 escalation, 6.1.7 agent console). Built in a later
// increment — see ComingNext for what lands here.
import { ViewHeader } from "../../components/index.js";
import { ComingNext } from "../ui.jsx";

export function InboxView() {
  return (
    <>
      <ViewHeader title="Inbox" subtitle="Live conversation queue and human handover" />
      <ComingNext
        title="Agent inbox"
        clause="6.1.5 / 6.1.7"
        bullets={[
          "Conversation queue filtered by Bot · Waiting · Mine · Resolved, with a live 24-hour service-window countdown on every row.",
          "Full transcript with each inbound message annotated by the recognised intent and its confidence.",
          "Context panel: masked complainant profile, consent state, linked complaints, documents and case timeline.",
          "Claim, transfer to another consultant, canned replies, hand back to the bot, resolve with a CSAT request.",
          "Composer locks when the service window closes and offers the approved template library instead.",
        ]}
      />
    </>
  );
}
