"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type BrainChild = {
  id: string;
  name: string;
  kind: "child";
  login: "none";
  user: false;
  title: string;
  status: "suggested" | "started" | "updated";
  version: number;
  intent: {
    goals: string[];
    subjects: string[];
    themes: string[];
    timeHorizon: string;
    constraints: string[];
  };
  paths: { items: Array<{ title: string; play: string }> };
  portion: { horizon: string; items: Array<{ title: string; play: string }> };
  progress: {
    now: { title: string; copy: string };
    confidence: { state: string; label: string };
    next: { title: string; copy: string };
  };
  sources: Array<{ title: string; body: string }>;
  notes: Array<{ title: string; body: string }>;
  summary: {
    sources: number;
    notes: number;
    intent_bound: true;
    path_bound: true;
    portion_bound: true;
  };
};

type BrainPayload = {
  ok?: boolean;
  fr?: string[];
  launch?: string;
  distribute?: boolean;
  selected_child_id?: string;
  selected?: BrainChild | null;
  children?: Array<{ id: string; name: string }>;
};

export function FrKb1ParentBrain() {
  const search = useSearchParams();
  const childParam = search.get("child")?.trim() || "";
  const [payload, setPayload] = useState<BrainPayload | null>(null);
  const [title, setTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [saved, setSaved] = useState("");

  const selected = payload?.selected ?? null;
  const children = payload?.children ?? [];
  const selectedId = selected?.id || childParam;

  useEffect(() => {
    const query = childParam ? `?child=${encodeURIComponent(childParam)}` : "";
    fetch(`/api/progress/brain${query}`)
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as BrainPayload;
        setPayload(body);
        setTitle(body.selected?.title || "");
        setSourceText((body.selected?.sources || []).map((source) => source.body || source.title).join("\n"));
        setNoteText((body.selected?.notes || []).map((note) => note.body || note.title).join("\n"));
        setSaved("");
      })
      .catch(() => setPayload(null));
  }, [childParam]);

  async function postAction(action: "start" | "update" | "sync") {
    if (!selectedId) return;
    const sources = sourceText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ title: "Parent source", body: line }));
    const notes = noteText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ title: "Parent note", body: line }));
    const res = await fetch("/api/progress/brain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        child: selectedId,
        action,
        title,
        sources,
        notes,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as BrainPayload & { error?: string };
    if (!res.ok || !body.ok) {
      setSaved(body.error || "brain_failed");
      return;
    }
    setPayload(body);
    setTitle(body.selected?.title || title);
    setSourceText((body.selected?.sources || []).map((source) => source.body || source.title).join("\n"));
    setNoteText((body.selected?.notes || []).map((note) => note.body || note.title).join("\n"));
    setSaved(action === "start" ? "started" : action === "sync" ? "synced" : "updated");
  }

  async function onStart(event: FormEvent) {
    event.preventDefault();
    await postAction("start");
  }

  async function onUpdate(event: FormEvent) {
    event.preventDefault();
    await postAction("update");
  }

  return (
    <section data-brain="fr-kb-1" data-hire-path-sync="fr-kb-2" data-brain-sources-notes="true">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Knowledge brain
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">
        Brain under selected Child
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Parent writes sources and notes into the family hire brain so private
        curriculum and confidence stay on this brain, not a generic catalog.
        Child is not a User. Family LIVE chrome stays untouched.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" data-child-picker="fr-2">
        {children.map((child) => (
          <Link
            key={child.id}
            href={`/brain?child=${encodeURIComponent(child.id)}`}
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
          data-brain-status={selected.status}
          data-intent-bound="fr-3"
          data-path-bound="fr-4"
          data-portion-bound="fr-5"
        >
          <p className="text-sm text-muted-foreground">
            Selected Child: {selected.name}. Kind {selected.kind}. Login none.
            Not a User. Status {selected.status}. Version {selected.version}.
          </p>
          <article className="rounded-xl border border-border px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Parent-owned brain
            </p>
            <h2 className="mt-2 font-display text-2xl tracking-tight">{selected.title}</h2>
            <p className="mt-2 text-sm">
              Bound to FR-3 intent, FR-4 path, and FR-5 portion. Confidence{" "}
              {selected.progress.confidence.label}. Horizon {selected.portion.horizon}.
              Sources {selected.summary.sources}. Notes {selected.summary.notes}.
            </p>
          </article>
          <div
            className="grid gap-4 md:grid-cols-2"
            data-brain-source-count={selected.summary.sources}
            data-brain-note-count={selected.summary.notes}
          >
            <article className="rounded-xl border border-border px-4 py-4">
              <h2 className="font-display text-2xl tracking-tight">Sources</h2>
              <ul className="mt-2 grid gap-2 text-sm">
                {(selected.sources || []).length ? (
                  (selected.sources || []).map((source, index) => (
                    <li key={`${source.title}-${index}`}>{source.body || source.title}</li>
                  ))
                ) : (
                  <li>No sources yet.</li>
                )}
              </ul>
            </article>
            <article className="rounded-xl border border-border px-4 py-4">
              <h2 className="font-display text-2xl tracking-tight">Notes</h2>
              <ul className="mt-2 grid gap-2 text-sm">
                {(selected.notes || []).length ? (
                  (selected.notes || []).map((note, index) => (
                    <li key={`${note.title}-${index}`}>{note.body || note.title}</li>
                  ))
                ) : (
                  <li>No notes yet.</li>
                )}
              </ul>
            </article>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-border px-4 py-4">
              <h2 className="font-display text-2xl tracking-tight">Intent</h2>
              <p className="mt-2 text-sm">{selected.intent.goals.join(", ") || "—"}</p>
            </article>
            <article className="rounded-xl border border-border px-4 py-4">
              <h2 className="font-display text-2xl tracking-tight">Path</h2>
              <p className="mt-2 text-sm">{selected.paths.items[0]?.title || "—"}</p>
            </article>
            <article className="rounded-xl border border-border px-4 py-4">
              <h2 className="font-display text-2xl tracking-tight">Portion</h2>
              <p className="mt-2 text-sm">{selected.portion.items[0]?.title || "—"}</p>
            </article>
          </div>
          <form className="grid gap-3" onSubmit={selected.status === "suggested" ? onStart : onUpdate}>
            <label className="grid gap-2 text-sm">
              Brain title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                data-brain-title="true"
                className="rounded-xl border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="grid gap-2 text-sm">
              Parent sources
              <textarea
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                rows={4}
                data-brain-sources="true"
                className="rounded-xl border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="grid gap-2 text-sm">
              Parent notes
              <textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                rows={4}
                data-brain-notes="true"
                className="rounded-xl border border-border bg-background px-3 py-2"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {selected.status === "suggested" ? (
                <button
                  type="submit"
                  data-brain-start="true"
                  className="inline-flex h-11 w-fit items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                  Start knowledge brain
                </button>
              ) : (
                <button
                  type="submit"
                  data-brain-update="true"
                  className="inline-flex h-11 w-fit items-center rounded-xl border border-border px-4 text-sm"
                >
                  Update knowledge brain
                </button>
              )}
              <button
                type="button"
                data-brain-sync="true"
                onClick={() => void postAction("sync")}
                className="inline-flex h-11 w-fit items-center rounded-xl border border-border px-4 text-sm"
              >
                Sync from hire path
              </button>
            </div>
          </form>
          {saved ? (
            <p className="text-sm text-muted-foreground" data-brain-saved={saved}>
              {saved === "started"
                ? "Knowledge brain started under the selected Child."
                : saved === "updated"
                  ? "Knowledge brain updated under the selected Child."
                  : saved === "synced"
                    ? "Hire path synced into the knowledge brain under the selected Child."
                    : saved}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Select a Child to start or see the knowledge brain.
        </p>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        Portion stays at{" "}
        <Link href={selectedId ? `/portion?child=${encodeURIComponent(selectedId)}` : "/portion"} className="underline">
          /portion
        </Link>
        . Path stays at{" "}
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
