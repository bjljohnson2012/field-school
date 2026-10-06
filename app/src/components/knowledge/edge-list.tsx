import Link from "next/link";
import { EmptyState } from "@/components/desk/desk";
import type { EdgeEnd, EdgeView } from "@/lib/knowledge/graph";

function EndLabel({ end }: { end: EdgeEnd }) {
  return end.href ? (
    <Link href={end.href} className="underline underline-offset-4">
      {end.label}
    </Link>
  ) : (
    <span>{end.label}</span>
  );
}

/** Every edge says why it exists, and opens to the rows that prove it. */
export function EdgeList({ edges, hideFrom = false, empty }: { edges: readonly EdgeView[]; hideFrom?: boolean; empty: string }) {
  if (!edges.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <ul className="grid gap-2">
      {edges.map((edge) => (
        <li key={edge.key} data-edge={edge.rel} className="rounded-xl border border-border bg-card px-4 py-3">
          <details>
            <summary className="cursor-pointer text-sm">
              {hideFrom ? null : (
                <>
                  <EndLabel end={edge.from} /> <span aria-hidden="true">→</span>{" "}
                </>
              )}
              <EndLabel end={edge.to} />
              <span className="mt-1 block text-xs text-muted-foreground">{edge.because}</span>
            </summary>
            <ul className="mt-2 grid gap-1 border-t border-border pt-2 font-mono text-xs text-muted-foreground">
              {edge.evidence.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </details>
        </li>
      ))}
    </ul>
  );
}
