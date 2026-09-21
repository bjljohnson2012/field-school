import type { Metadata } from "next";
import Link from "next/link";
import { readLaunchGate } from "@/lib/player/launch-gate";

export const metadata: Metadata = {
  title: "Launch gate evidence",
  description: "Honest hire-path evidence rows. Launch closed 0/8. Distribute held.",
};

export const dynamic = "force-dynamic";

export default function OperatorLaunchGatePage() {
  const evidence = readLaunchGate();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Operator
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">
        Launch-gate evidence
      </h1>
      <p className="mt-4 text-muted-foreground">
        Hire-path unlocks are measurable. None of the eight launch nodes are
        PASS. Launch stays closed. Public Distribute stays off.
      </p>
      <dl
        className="mt-8 grid gap-3 text-sm"
        data-launch-gate="operator"
        data-launch={evidence.launch}
        data-pass={String(evidence.pass)}
        data-distribute={String(evidence.distribute)}
        data-product={evidence.product}
      >
        <div>
          <dt className="text-muted-foreground">Launch</dt>
          <dd>{evidence.launch}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">PASS count</dt>
          <dd>
            {evidence.pass}/{evidence.nodes}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Product</dt>
          <dd>{evidence.product}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Distribute</dt>
          <dd>HELD</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Master sha256</dt>
          <dd className="break-all font-mono text-xs">{evidence.master_sha256}</dd>
        </div>
      </dl>
      <h2 className="mt-10 font-display text-2xl tracking-tight">
        Eight nodes (all HELD)
      </h2>
      <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {evidence.nodes_held.map((node) => (
          <li key={node} data-launch-node="held">
            {node} · HELD
          </li>
        ))}
      </ul>
      <h2 className="mt-10 font-display text-2xl tracking-tight">
        Hire-path evidence rows
      </h2>
      <ul className="mt-4 space-y-3">
        {evidence.rows.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-border px-4 py-3 text-sm"
            data-launch-row={row.id}
            data-landed={String(row.landed)}
            data-launch-pass={String(row.launch_pass)}
          >
            <p>
              {row.unlock} · landed · launch node PASS: no
            </p>
            <p className="mt-1 text-muted-foreground">
              {row.cite} · {row.path}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted-foreground">
        Publish polish stays at{" "}
        <Link href="/operator/publish" className="underline">
          /operator/publish
        </Link>
        . API:{" "}
        <Link href="/api/media/lesson-spine/launch-gate" className="underline">
          /api/media/lesson-spine/launch-gate
        </Link>
        .
      </p>
    </main>
  );
}
