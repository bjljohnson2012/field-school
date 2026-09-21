"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type SupervisedChild = {
  id: string;
  name: string;
  kind: "child";
  login: "none";
  user: false;
  now: { title: string; copy: string };
  confidence: { state: string; label: string };
  next: { title: string; copy: string };
};

type SupervisedPayload = {
  ok?: boolean;
  launch?: string;
  distribute?: boolean;
  selected_child_id?: string;
  selected?: SupervisedChild | null;
  children?: Array<{ id: string; name: string }>;
};

export function Fr6SupervisedProgress() {
  const search = useSearchParams();
  const childParam = search.get("child")?.trim() || "";
  const [payload, setPayload] = useState<SupervisedPayload | null>(null);

  useEffect(() => {
    const query = childParam ? `?child=${encodeURIComponent(childParam)}` : "";
    fetch(`/api/progress/supervised${query}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as SupervisedPayload;
        setPayload(body);
      })
      .catch(() => setPayload(null));
  }, [childParam]);

  const selected = payload?.selected ?? null;
  const children = payload?.children ?? [];

  return (
    <section data-supervised="fr-6-fr-2">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Parent-supervised progress
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">
        Now / Confidence / Next
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Parent sees supervised progress under the selected Child after hire and
        play. Child is not a User. Kids have no own login. Family LIVE chrome
        stays untouched.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" data-child-picker="fr-2">
        {children.map((child) => (
          <Link
            key={child.id}
            href={`/progress?child=${encodeURIComponent(child.id)}`}
            data-child-id={child.id}
            data-child-selected={selected?.id === child.id ? "true" : "false"}
            className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
          >
            {child.name}
          </Link>
        ))}
      </div>

      {selected ? (
        <div
          className="mt-8 grid gap-4 md:grid-cols-3"
          data-selected-child={selected.id}
          data-child-kind="child"
          data-child-login="none"
        >
          <article className="rounded-xl border border-border px-4 py-4" data-now="true">
            <h2 className="font-display text-2xl tracking-tight">Now</h2>
            <p className="mt-2 text-sm">{selected.now.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{selected.now.copy}</p>
          </article>
          <article
            className="rounded-xl border border-border px-4 py-4"
            data-confidence={selected.confidence.state}
          >
            <h2 className="font-display text-2xl tracking-tight">Confidence</h2>
            <p className="mt-2 text-sm">{selected.confidence.label}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Parent-supervised FR-6 confidence for {selected.name}. Not a User
              score.
            </p>
          </article>
          <article className="rounded-xl border border-border px-4 py-4" data-next="true">
            <h2 className="font-display text-2xl tracking-tight">Next</h2>
            <p className="mt-2 text-sm">{selected.next.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{selected.next.copy}</p>
          </article>
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Select a Child to see Now / Confidence / Next.
        </p>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        After hire, return to{" "}
        <Link href="/metering" className="underline">
          /metering
        </Link>{" "}
        and{" "}
        <Link href="/play/lesson-spine" className="underline">
          /play/lesson-spine
        </Link>
        . Distribute held. Launch closed.
      </p>
    </section>
  );
}
