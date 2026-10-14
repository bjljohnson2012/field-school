import type { GapGraph } from "@/lib/gap-loop/graph";

/** Static SVG. No motion, so reduced-motion stays on the same layout. */
export function GapGraph({ graph }: { graph: GapGraph }) {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  return (
    <figure className="space-y-4">
      <svg role="img" aria-label="Goal graph" viewBox="0 0 400 300" className="h-auto w-full rounded-2xl border border-border bg-card">
        {graph.edges.map((edge) => {
          const from = byId.get(edge.from);
          const to = byId.get(edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={edge.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="currentColor"
              strokeWidth={edge.weight > 0 ? 1.5 : 1}
              strokeDasharray={edge.dashed ? "4 4" : undefined}
              opacity={0.55}
            />
          );
        })}
        {graph.nodes.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={node.kind === "goal" ? 16 : 11} fill="currentColor" opacity={node.kind === "goal" ? 0.9 : 0.35} />
            <text x={node.x} y={node.y + 28} textAnchor="middle" fontSize="10" fill="currentColor">
              {node.label.slice(0, 22)}
            </text>
          </g>
        ))}
      </svg>
      <ul className="space-y-2">
        {graph.clusters.map((cluster) => (
          <li key={cluster.id} className="rounded-xl border border-border px-3 py-2 text-sm">
            <p className="font-medium">{cluster.label}</p>
            <p className="text-muted-foreground">{cluster.summary}</p>
          </li>
        ))}
      </ul>
    </figure>
  );
}
