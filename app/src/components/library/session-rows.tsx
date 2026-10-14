"use client";

import { useEffect, useState } from "react";
import { isM9Leader } from "@/lib/shell/m9-shell";
import { parseShellViewer } from "@/lib/shell/model";
import { sessionCatalog, sessionsForViewer, type LibraryViewer } from "@/lib/library/m10";

export function SessionRows() {
  const [viewer, setViewer] = useState<LibraryViewer>("member");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/me")
      .then((res) => res.json())
      .then((json: unknown) => {
        if (cancelled) return;
        const shell = parseShellViewer(json);
        if (!shell) return;
        if (shell.memberKind === "child") setViewer("child");
        else if (isM9Leader(shell.stance)) setViewer("leader");
        else setViewer("member");
      })
      .catch(() => {
        if (!cancelled) setViewer("member");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = sessionsForViewer(sessionCatalog(), viewer);

  return (
    <section aria-label="Sessions" data-sessions={viewer}>
      {rows.length === 0 ? <p className="m10-quiet-copy">No published sessions.</p> : null}
      <div className="m10-session-list">
        {rows.map((row) => (
          <article key={row.id} className="m10-session-row" data-session={row.id}>
            <div>
              <h3 className="m10-session-title">{row.title}</h3>
              <p className="m10-session-meta">{row.when}</p>
              {row.nextSteps ? <p>{row.nextSteps}</p> : null}
              {row.recap ? <p data-recap="true">{row.recap}</p> : null}
            </div>
            <span className="m10-quiet">Open</span>
          </article>
        ))}
      </div>
    </section>
  );
}
