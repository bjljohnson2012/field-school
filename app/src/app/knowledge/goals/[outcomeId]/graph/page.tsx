"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GapGraph as GapGraphView } from "@/components/gap-loop/gap-graph";
import type { GapGraph } from "@/lib/gap-loop/graph";

type Payload = GapGraph & { list?: { clusters: GapGraph["clusters"]; gaps: GapGraph["gaps"] } };

export default function GoalGraphPage() {
  const params = useParams<{ outcomeId: string }>();
  const outcomeId = params.outcomeId;
  const [graph, setGraph] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"graph" | "list">("graph");

  useEffect(() => {
    let gone = false;
    fetch(`/api/knowledge/outcomes/${outcomeId}/graph`)
      .then((res) => res.json())
      .then((data: { ok?: boolean; error?: string } & Partial<Payload>) => {
        if (gone) return;
        if (!data.ok || !data.nodes || !data.edges) {
          setError("Could not open this graph.");
          return;
        }
        setGraph(data as Payload);
      })
      .catch(() => {
        if (!gone) setError("Could not open this graph.");
      });
    return () => {
      gone = true;
    };
  }, [outcomeId]);

  const list = graph?.list;
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm">
        <Link href={`/knowledge/goals/${outcomeId}`} className="underline underline-offset-2">
          Back to the goal
        </Link>
      </p>
      <h1 className="mt-3 font-display text-3xl tracking-tight">Graph</h1>
      <div className="mt-4 flex gap-2" role="tablist" aria-label="Graph or list">
        <button type="button" role="tab" aria-selected={tab === "graph"} className={`rounded-full border px-3 py-1 text-sm ${tab === "graph" ? "border-foreground bg-foreground text-background" : "border-border"}`} onClick={() => setTab("graph")}>
          Graph
        </button>
        <button type="button" role="tab" aria-selected={tab === "list"} className={`rounded-full border px-3 py-1 text-sm ${tab === "list" ? "border-foreground bg-foreground text-background" : "border-border"}`} onClick={() => setTab("list")}>
          List
        </button>
      </div>
      {error ? <p className="mt-4 text-sm">{error}</p> : null}
      {!graph && !error ? <p className="mt-4 text-sm text-muted-foreground">Loading the graph…</p> : null}
      {graph && tab === "graph" ? (
        <div className="mt-4">
          <GapGraphView graph={graph} />
        </div>
      ) : null}
      {graph && tab === "list" ? (
        <ul className="mt-4 space-y-2">
          {(list?.clusters || graph.clusters).map((cluster) => (
            <li key={cluster.id} className="rounded-xl border border-border px-3 py-2 text-sm">
              <p className="font-medium">{cluster.label}</p>
              <p className="text-muted-foreground">{cluster.summary}</p>
            </li>
          ))}
          {(list?.gaps || graph.gaps).map((gap) => (
            <li key={gap.id} className="text-sm text-muted-foreground">
              {gap.summary}
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
