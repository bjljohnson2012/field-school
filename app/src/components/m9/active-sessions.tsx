import { MotionSpan } from "@/components/m9/motion";
import { activeSessionsReady } from "@/lib/shell/m9-shell";

/** Hidden until M8 has a per-device session row. Not mounted by the shell. */
export function ActiveSessions() {
  if (!activeSessionsReady()) return null;
  return <MotionSpan>Active sessions</MotionSpan>;
}
