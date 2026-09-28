// Channel iconography. WhatsApp is the real mark rather than a generic chat
// bubble — in a room full of people who use it daily, a lookalike reads as a
// mock-up. SMS / email / app stay on the Fluent set the rest of the shell uses.
import { Phone20Regular, Mail20Regular, Apps20Regular } from "@fluentui/react-icons";
import { I, WhatsAppGlyph, WhatsAppBadge } from "../components/index.js";
import { channelById } from "./data.js";

// The WhatsApp marks moved into the design system when a second product needed
// them; call sites in this module keep their import path.
export { WhatsAppGlyph, WhatsAppBadge };

// Outline weights, to sit level with the WhatsApp mark rather than shout over it.
const FLUENT = { sms: Phone20Regular, email: Mail20Regular, app: Apps20Regular };

// One call site for every channel glyph in the module.
export function ChannelIcon({ id, size = 14, color, muted = false }) {
  const ch = channelById(id);
  const tint = color || (muted ? "#a19f9d" : ch.colour);
  if (id === "whatsapp") return <WhatsAppGlyph size={size} color={tint} />;
  return <I as={FLUENT[id] || Phone20Regular} size={size} color={tint} />;
}
