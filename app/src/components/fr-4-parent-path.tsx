"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type PathItem = {
  sortOrder: number;
  title: string;
  subject: string;
  kind: "station";
  reason: string;
  source: "intent" | "catalog";
  play: string;
};

type PathChild = {
  id: string;
  name: string;
  kind: "child";
  login: "none";
  user: false;
  intent: {
    goals: string[];
    subjects: string[];
    themes: string[];
    timeHorizon: string;
    constraints: string[];
  };
  items: PathItem[];
};

type PathPayload = {
  ok?: boolean;
  launch?: string;
  distribute?: boolean;
  selected_child_id?: string;
  selected?: PathChild | null;
  children?: Array<{ id: string; name: string }>;
};

export function Fr4ParentPath() {
  const search = useSearchParams();
  const childParam = search.get("child")?.trim() || "";
  const [payload, setPayload] = useState<PathPayload | null>(null);
  const [saved, setSaved] = useState("");

  const selected = payload?.selected ?? null;
  const children = payload?.children ?? [];
  const selectedId = selected?.id || childParam;

  useEffect(() => {
    const query = childParam ? `?child=${encodeURIComponent(childParam)}` : "";
    fetch(`/api/progress/path${query}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as PathPayload;
        setPayload(body);
        setSaved("");
      })
      .catch(() => setPayload(null));
  }, [childParam]);

  async function onAssemble() {
    if (!selectedId) return;
    const res = await fetch("/api/progress/path", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ child: selectedId }),
    });
    const body = (await res.json().catch(() => ({}))) as PathPayload & { error?: string };
    if (!res.ok || !body.ok) {
      setSaved(body.error || "assemble_failed");
      return;
    }
    setPayload(body);
    setSaved("assembled");
  }

  return (
    <section data-path="fr-4-fr-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Parent-path assembly
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">
        Path under selected Child
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Parent gets a path assembled under the selected Child from parent-owned
        intent. Curriculum continues from intent, not from a child login. Child
        is not a User. Family LIVE chrome stays untouched.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" data-child-picker="fr-2">
        {children.map((child) => (
          <Link
            key={child.id}
            href={`/path?child=${encodeURIComponent(child.id)}`}
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
          className="mt-8 grid gap-6"
          data-selected-child={selected.id}
          data-child-kind="child"
          data-child-login="none"
          data-child-user="false"
          data-intent-bound="fr-3"
        >
          <p className="text-sm text-muted-foreground">
            Selected Child: {selected.name}. Kind {selected.kind}. Login none.
            Not a User. Bound to parent intent {selected.intent.subjects.join(", ") || "none"}.
          </p>
          <ol className="grid gap-3" data-path-items="true">
            {selected.items.map((item) => (
              <li
                key={`${item.sortOrder}-${item.title}`}
                className="rounded-xl border border-border px-4 py-4"
                data-path-item={item.sortOrder}
                data-path-source={item.source}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Station {item.sortOrder}
                </p>
                <h2 className="mt-2 font-display text-2xl tracking-tight">{item.title}</h2>
                <p className="mt-2 text-sm">{item.subject}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
                <Link href={item.play} className="mt-3 inline-flex text-sm underline">
                  {item.play}
                </Link>
              </li>
            ))}
          </ol>
          <button
            type="button"
            data-path-assemble="true"
            onClick={onAssemble}
            className="inline-flex h-11 w-fit items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Assemble from parent intent
          </button>
          {saved ? (
            <p className="text-sm text-muted-foreground" data-path-saved={saved}>
              {saved === "assembled"
                ? "Path assembled under the selected Child from parent intent."
                : saved}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Select a Child to see the assembled path.
        </p>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        Intent stays at{" "}
        <Link href={selectedId ? `/intent?child=${encodeURIComponent(selectedId)}` : "/intent"} className="underline">
          /intent
        </Link>
        . Progress stays at{" "}
        <Link href={selectedId ? `/progress?child=${encodeURIComponent(selectedId)}` : "/progress"} className="underline">
          /progress
        </Link>
        . Distribute held. Launch closed.
      </p>
    </section>
  );
}
