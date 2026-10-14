"use client";

import { useEffect, useState } from "react";

type BrainNodeView = {
  id: string;
  kind: string;
  label: string;
  refTable: string | null;
  refId: string | null;
  evidence: unknown[];
};

type BrainEdgeView = {
  id: string;
  fromNode: string;
  toNode: string;
  rel: string;
  because: string;
  origin: string;
  status: string;
  pending: boolean;
  evidence: unknown[];
};

type BrainPayload = {
  ok?: boolean;
  brainId?: string | null;
  nodes?: BrainNodeView[];
  edges?: BrainEdgeView[];
};

function evidenceLine(line: unknown) {
  if (!line || typeof line !== "object") return "";
  const row = line as { table?: string; id?: string; label?: string };
  return [row.table, row.id, row.label].filter(Boolean).join(" ");
}

export function LibraryBrainBoard() {
  const [payload, setPayload] = useState<BrainPayload | null>(null);
  const [error, setError] = useState("");

  function load() {
    const params = new URLSearchParams(window.location.search);
    const query = new URLSearchParams();
    const growthUnit = params.get("growthUnit");
    const child = params.get("child");
    if (growthUnit) query.set("growthUnit", growthUnit);
    if (child) query.set("child", child);
    const suffix = query.size ? `?${query.toString()}` : "";
    void fetch(`/api/library/brain${suffix}`, { credentials: "same-origin" })
      .then(async (response) => {
        const data = (await response.json()) as BrainPayload;
        if (!response.ok) {
          setError("This brain is not available.");
          setPayload({ nodes: [], edges: [] });
          return;
        }
        setError("");
        setPayload(data);
      })
      .catch(() => {
        setError("This brain is not available.");
        setPayload({ nodes: [], edges: [] });
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function act(edgeId: string, action: "reject" | "confirm") {
    const response = await fetch("/api/library/brain/edge", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edgeId, action }),
    });
    if (response.ok) load();
  }

  const nodes = payload?.nodes ?? [];
  const edges = payload?.edges ?? [];
  const labels = new Map(nodes.map((node) => [node.id, node.label || node.kind]));

  return (
    <section data-brain-view="m11" className="mt-8" aria-label="Knowledge brain">
      <h2 className="m10-title">Graph</h2>
      <p className="m10-quiet-copy">
        One brain for this org. A growth unit or a desk person is a filter inside it.
      </p>
      {payload?.brainId ? <p data-brain-id={payload.brainId}>Brain {payload.brainId}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <ul data-brain-nodes={nodes.length}>
        {nodes.map((node) => (
          <li key={node.id} data-node={node.id} data-kind={node.kind} data-ref-table={node.refTable || ""} data-ref-id={node.refId || ""}>
            <p>{node.label || node.kind}</p>
            <p>
              {node.refTable || "source"} {node.refId || ""}
            </p>
            <ul>
              {node.evidence.map((line, index) => (
                <li key={index}>{evidenceLine(line)}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {payload && nodes.length === 0 ? <p>No nodes in this brain yet.</p> : null}
      <ul data-brain-edges={edges.length}>
        {edges.map((edge) => (
          <li key={edge.id} data-edge={edge.id} data-origin={edge.origin} data-status={edge.status} data-pending={edge.pending ? "true" : "false"}>
            <p>
              {labels.get(edge.fromNode) || edge.fromNode} {edge.rel} {labels.get(edge.toNode) || edge.toNode}
            </p>
            <p>{edge.because}</p>
            {edge.pending ? <p>Pending</p> : null}
            <button type="button" onClick={() => void act(edge.id, "reject")}>
              Reject
            </button>
            {edge.pending ? (
              <button type="button" onClick={() => void act(edge.id, "confirm")}>
                Confirm
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
