import type { ReactNode } from "react";

/** CSS motion only. No springs. Imported by the shell and Active Sessions. */
export function MotionSpan({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`m9-motion ${className}`.trim()}>{children}</span>;
}
