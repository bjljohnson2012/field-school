"use client";

import { useEffect, useState } from "react";
import { parseEdgeViews, type EdgeView } from "@/lib/knowledge/graph";
import { EdgeList } from "./edge-list";

export function EdgePanel({
  focus,
  title,
  hint,
  empty,
  hideFrom = false,
}: {
  focus: string;
  title: string;
  hint: string;
  empty: string;
  hideFrom?: boolean;
}) {
  const [edges, setEdges] = useState<readonly EdgeView[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/knowledge/edges?focus=${encodeURIComponent(focus)}`)
      .then((res) => res.json())
      .then((json: unknown) => {
        if (!cancelled) setEdges(parseEdgeViews(json) ?? []);
      })
      .catch(() => {
        if (!cancelled) setEdges([]);
      });
    return () => {
      cancelled = true;
    };
  }, [focus]);

  return (
    <section data-edges={focus} aria-label={title} className="mt-10">
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <div className="mt-4">
        {edges ? (
          <EdgeList edges={edges} hideFrom={hideFrom} empty={empty} />
        ) : (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
      </div>
    </section>
  );
}
