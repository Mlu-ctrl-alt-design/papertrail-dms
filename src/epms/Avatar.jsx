// e-PMS-specific Avatar wrapper that looks up users by id and delegates
// to the shared <AvatarChip>.
import { AvatarChip } from "../components/index.js";
import { userById } from "./data.js";

export function Avatar({ userId, size = 28 }) {
  const u = userById(userId);
  return <AvatarChip initials={u.initials} color={u.color} size={size} />;
}
