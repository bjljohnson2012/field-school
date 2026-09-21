"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type PortionItem = {
  sortOrder: number;
  title: string;
  subject: string;
  kind: "station";
  source: "path" | "override";
  play: string;
};

type PortionChild = {
  id: string;
  name: string;
  kind: "child";
  login: "none";
  user: false;
  horizon: string;
  status: "suggested" | "locked" | "overridden";
  items: PortionItem[];
};

type PortionPayload = {
  ok?: boolean;
  launch?: string;
  distribute?: boolean;
  selected_child_id?: string;
  selected?: PortionChild | null;
  children?: Array<{ id: string; name: string }>;
};

export function Fr5ParentPortion() {
  const search = useSearchParams();
  const childParam = search.get("child")?.trim() || "";
  const [payload, setPayload] = useState<PortionPayload | null>(null);
  const [overrideText, setOverrideText] = useState("");
  const [saved, setSaved] = useState("");

  const selected = payload?.selected ?? null;
  const children = payload?.children ?? [];
  const selectedId = selected?.id || childParam;

  useEffect(() => {
    const query = childParam ? `?child=${encodeURIComponent(childParam)}` : "";
    fetch(`/api/progress/portion${query}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as PortionPayload;
        setPayload(body);
        setOverrideText((body.selected?.items || []).map((item) => item.title).join("\n"));
        setSaved("");
      })
      .catch(() => setPayload(null));
  }, [childParam]);

  async function postAction(action: "lock" | "override", items?: string[]) {
    if (!selectedId) return;
    const res = await fetch("/api/progress/portion", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        child: selectedId,
        action,
        items,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as PortionPayload & { error?: string };
    if (!res.ok || !body.ok) {
      setSaved(body.error || "portion_failed");
      return;
    }
    setPayload(body);
    setOverrideText((body.selected?.items || []).map((item) => item.title).join("\n"));
    setSaved(action === "lock" ? "locked" : "overridden");
  }

  async function onLock() {
    await postAction("lock");
  }

  async function onOverride(event: FormEvent) {
    event.preventDefault();
    const items = overrideText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    await postAction("override", items);
  }

  return (
    <section data-portion="fr-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Parent next-portion
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">
        Next slice under selected Child
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Parent sees the next slice of the assembled path, bound to parent-owned
        intent. Lock it or override it. Child is not a User. Family LIVE chrome
        stays untouched.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" data-child-picker="fr-2">
        {children.map((child) => (
          <Link
            key={child.id}
            href={`/portion?child=${encodeURIComponent(child.id)}`}
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
          data-portion-status={selected.status}
          data-intent-bound="fr-3"
          data-path-bound="fr-4"
        >
          <p className="text-sm text-muted-foreground">
            Selected Child: {selected.name}. Kind {selected.kind}. Login none.
            Not a User. Horizon {selected.horizon}. Status {selected.status}.
          </p>
          <ol className="grid gap-3" data-portion-items="true">
            {selected.items.map((item) => (
              <li
                key={`${item.sortOrder}-${item.title}`}
                className="rounded-xl border border-border px-4 py-4"
                data-portion-item={item.sortOrder}
                data-portion-source={item.source}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Slice {item.sortOrder}
                </p>
                <h2 className="mt-2 font-display text-2xl tracking-tight">{item.title}</h2>
                <p className="mt-2 text-sm">{item.subject}</p>
                <Link href={item.play} className="mt-3 inline-flex text-sm underline">
                  {item.play}
                </Link>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              data-portion-lock="true"
              onClick={onLock}
              className="inline-flex h-11 w-fit items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Lock next slice
            </button>
          </div>
          <form className="grid gap-3" onSubmit={onOverride}>
            <label className="grid gap-2 text-sm">
              Override slice
              <textarea
                value={overrideText}
                onChange={(event) => setOverrideText(event.target.value)}
                rows={4}
                data-portion-override="true"
                className="rounded-xl border border-border bg-background px-3 py-2"
              />
            </label>
            <button
              type="submit"
              data-portion-override-save="true"
              className="inline-flex h-11 w-fit items-center rounded-xl border border-border px-4 text-sm"
            >
              Override from parent
            </button>
          </form>
          {saved ? (
            <p className="text-sm text-muted-foreground" data-portion-saved={saved}>
              {saved === "locked"
                ? "Next slice locked under the selected Child."
                : saved === "overridden"
                  ? "Next slice overridden under the selected Child."
                  : saved}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Select a Child to see the next slice.
        </p>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        Path stays at{" "}
        <Link href={selectedId ? `/path?child=${encodeURIComponent(selectedId)}` : "/path"} className="underline">
          /path
        </Link>
        . Intent stays at{" "}
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
