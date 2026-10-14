import type { ReactNode } from "react";
import { LibraryTree } from "@/components/library/tree";

export function LibraryWorkspace({ children }: { children: ReactNode }) {
  return (
    <div className="m10-workspace" data-library-workspace="m10">
      <aside className="m10-tree" aria-label="Library sections">
        <LibraryTree />
      </aside>
      <div className="m10-workspace-canvas">{children}</div>
    </div>
  );
}
