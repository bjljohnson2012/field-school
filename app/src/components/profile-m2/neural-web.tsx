import type { PlacementView } from "@/lib/assessments/model";

const STYLE = `
[data-neural-web] .neural-edge {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: neural-draw 1.15s ease forwards;
}
[data-neural-web] .neural-node {
  opacity: 0;
  animation: neural-in 0.5s ease forwards;
}
@keyframes neural-draw { to { stroke-dashoffset: 0; } }
@keyframes neural-in { to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  [data-neural-web] .neural-edge { animation: none; stroke-dashoffset: 0; }
  [data-neural-web] .neural-node { animation: none; opacity: 1; }
  [data-neural-web] .neural-pulse { display: none; }
}
`;

type Point = { x: number; y: number };

const CX = 320;
const CY = 146;

function layout(count: number): Point[] {
  const rx = 200;
  const ry = 92;
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    return { x: CX + Math.cos(angle) * rx, y: CY + Math.sin(angle) * ry };
  });
}

function segment(from: Point, to: Point) {
  return `M${from.x.toFixed(1)} ${from.y.toFixed(1)} L${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

/** The finish frame: categories already at the lock line, drawn as one web. */
export function NeuralWeb({ title, placements }: { title: string; placements: readonly PlacementView[] }) {
  const nodes = placements.filter((placement) => placement.state !== "open");
  if (nodes.length === 0) return null;
  const points = layout(nodes.length);
  const ring =
    points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ") + " Z";
  const summary = nodes.map((node) => `${node.label}: ${node.categoryLabel}, ${node.confidencePct}%`).join(". ");

  return (
    <figure data-neural-web className="overflow-hidden rounded-lg border border-border bg-background">
      <style>{STYLE}</style>
      <figcaption className="px-4 pt-3 text-xs font-semibold text-muted-foreground">{title}</figcaption>
      <svg viewBox="0 0 640 300" role="img" aria-label={summary} className="h-auto w-full text-foreground">
        {points.map((point, index) => (
          <path
            key={`spoke-${nodes[index].taxonomy}`}
            className="neural-edge"
            pathLength={1}
            d={segment({ x: CX, y: CY }, point)}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.35}
            strokeWidth={1.25}
            style={{ animationDelay: `${index * 70}ms` }}
          />
        ))}
        <path
          className="neural-edge"
          pathLength={1}
          d={ring}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.55}
          strokeWidth={1.25}
          style={{ animationDelay: "200ms" }}
        />
        <circle className="neural-pulse" r="4.5" fill="#ff6a1a">
          <animateMotion dur="1.7s" repeatCount="1" path={ring} />
        </circle>
        <g className="neural-node" style={{ animationDelay: "120ms" }}>
          <circle cx={CX} cy={CY} r="26" fill="none" stroke="#ff6a1a" strokeOpacity={0.45} />
          <circle cx={CX} cy={CY} r="16" fill="#ff6a1a" />
          <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="600" fill="#fff">
            You
          </text>
        </g>
        {nodes.map((node, index) => {
          const point = points[index];
          const below = point.y >= CY;
          const titleY = below ? point.y + 22 : point.y - 14;
          const noteY = below ? point.y + 36 : point.y - 28;
          return (
            <g key={node.taxonomy} className="neural-node" style={{ animationDelay: `${320 + index * 90}ms` }}>
              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill={node.state === "locked" ? "#ff6a1a" : "none"}
                stroke="currentColor"
                strokeWidth={1.5}
                strokeDasharray={node.state === "unsettled" ? "2 2" : undefined}
              />
              <text x={point.x} y={titleY} textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">
                {node.categoryLabel}
              </text>
              <text x={point.x} y={noteY} textAnchor="middle" fontSize="10" fill="currentColor" opacity={0.7}>
                {node.state === "unsettled" ? `Best read · ${node.confidencePct}%` : `${node.confidencePct}% sure`}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
