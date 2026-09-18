import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";

/** Later sibling sits on top. Do not use z-index. */
export function Stack({ children }: { children: ReactNode }) {
  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>{children}</AbsoluteFill>
  );
}

export function Layer({
  name,
  children,
}: {
  name: string;
  children?: ReactNode;
}) {
  return (
    <AbsoluteFill aria-label={name} style={{ pointerEvents: "none" }}>
      {children}
    </AbsoluteFill>
  );
}
