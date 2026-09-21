import type { Metadata } from "next";
import Link from "next/link";
import { readPublishPolish } from "@/lib/player/publish-polish";

export const metadata: Metadata = {
  title: "Publish polish",
  description: "Operator evidence for Ready HLS Publish. Distribute held. Launch closed.",
};

export const dynamic = "force-dynamic";

export default function OperatorPublishPage() {
  const evidence = readPublishPolish();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Operator
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Publish polish</h1>
      <p className="mt-4 text-muted-foreground">
        Cleaning→Publish is real on the Ready LessonSpine play rail. Public
        Distribute stays off. Launch stays closed.
      </p>
      <dl
        className="mt-8 grid gap-3 text-sm"
        data-publish-polish="operator"
        data-published={String(evidence.published)}
        data-distribute={String(evidence.distribute)}
      >
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd>{evidence.status}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Kind</dt>
          <dd>{evidence.kind}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Master sha256</dt>
          <dd className="break-all font-mono text-xs">{evidence.master_sha256}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Distribute</dt>
          <dd>HELD</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Launch</dt>
          <dd>{evidence.launch}</dd>
        </div>
      </dl>
      <h2 className="mt-10 font-display text-2xl tracking-tight">Evidence rows</h2>
      <ul className="mt-4 space-y-3">
        {evidence.rows.map((row) => (
          <li
            key={`${row.at}-${row.actor}`}
            className="rounded-xl border border-border px-4 py-3 text-sm"
            data-publish-row="true"
          >
            <p>
              {row.at} · {row.actor}
            </p>
            <p className="mt-1 text-muted-foreground">{row.note}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted-foreground">
        Parent play stays at{" "}
        <Link href="/play/lesson-spine" className="underline">
          /play/lesson-spine
        </Link>
        . Launch-gate rows:{" "}
        <Link href="/operator/launch-gate" className="underline">
          /operator/launch-gate
        </Link>
        . API:{" "}
        <Link href="/api/media/lesson-spine/publish" className="underline">
          /api/media/lesson-spine/publish
        </Link>
        .
      </p>
    </main>
  );
}
