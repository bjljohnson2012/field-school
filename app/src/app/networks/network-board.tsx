"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SCOPE_QUESTION } from "@/lib/library/expand-knowledge";
import { layoutRepository, type KnowledgePiece, type RepositoryModel } from "@/lib/library/knowledge-network";
import { NEEDS_MORE } from "@/lib/library/teach-from-knowledge";
import { cn } from "@/lib/utils";
import { KnowledgeTree } from "@/components/knowledge/knowledge-tree";
import { Dialog } from "@/components/saas/dialog";
import { DropWell } from "@/components/workspace/drop-well";

type Filter = "all" | "generated" | "waiting" | "published" | "unpublished";
type Reading = { expansion: string; questions: string[]; note: string };

function matches(piece: KnowledgePiece, filter: Filter, query: string) {
  if (filter === "generated" && !piece.generated) return false;
  if (filter === "waiting" && piece.generated) return false;
  if (filter === "published" && piece.statusLabel !== "Published") return false;
  if (filter === "unpublished" && piece.statusLabel !== "Unpublished") return false;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const hay = `${piece.title} ${piece.excerpt} ${piece.units.map((unit) => unit.title).join(" ")}`.toLowerCase();
  return hay.includes(needle);
}

export function NetworkBoard({ model }: { model: RepositoryModel }) {
  const router = useRouter();
  const [focus, setFocus] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [readings, setReadings] = useState<Record<string, Reading>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [composer, setComposer] = useState(false);
  const [bulk, setBulk] = useState("");
  const [notion, setNotion] = useState("");
  const [addNote, setAddNote] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { title: string; body: string; units: { id: string; title: string; body: string }[] }>
  >({});

  async function addKnowledge(event: { preventDefault: () => void; currentTarget: HTMLFormElement }) {
    event.preventDefault();
    const items = bulk
      .split(/\n---\n/)
      .map((text) => text.trim())
      .filter((text) => text.length >= 12)
      .slice(0, 12)
      .map((text) => ({ text, kind: "text" }));
    const link = notion.trim();
    if (link) {
      items.push({
        text: link,
        kind: /notion\.(so|site)|https?:\/\//i.test(link) ? "link" : "text",
      });
    }
    const form = new FormData(event.currentTarget);
    const files = form.getAll("files").filter((value) => value instanceof File && value.size > 0);
    if (!items.length && !files.length) {
      setAddNote("Paste knowledge, a Notion link, or a file.");
      return;
    }
    setBusy("add");
    setAddNote(null);
    try {
      const payload = new FormData();
      if (items.length) payload.set("items", JSON.stringify(items));
      for (const file of files) payload.append("files", file);
      const response = await fetch("/api/library/intake", { method: "POST", body: payload });
      const data = (await response.json().catch(() => ({}))) as { message?: string; items?: unknown[] };
      if (!response.ok) {
        setAddNote("That knowledge was not stored.");
        return;
      }
      setBulk("");
      setNotion("");
      setAddNote(
        data.message === "needs more information"
          ? "needs more information"
          : `Stored ${Array.isArray(data.items) ? data.items.length : 0} documents.`,
      );
      router.refresh();
    } catch {
      setAddNote("That knowledge was not stored.");
    } finally {
      setBusy(null);
    }
  }

  async function openEdit(piece: KnowledgePiece) {
    if (editing === piece.id) {
      setEditing(null);
      return;
    }
    setEditing(piece.id);
    if (!piece.href) {
      setDrafts((current) => ({
        ...current,
        [piece.id]: {
          title: piece.title,
          body: piece.excerpt,
          units: piece.units.map((unit) => ({ id: unit.id, title: unit.title, body: unit.excerpt })),
        },
      }));
      return;
    }
    const response = await fetch(`/api/composer/lessons?id=${piece.id}`, {
      headers: { "x-fs-org": model.orgSlug },
    });
    const data = (await response.json().catch(() => ({}))) as {
      lesson?: { title?: string; body?: string };
      units?: { id: string; title: string; body: string }[];
    };
    setDrafts((current) => ({
      ...current,
      [piece.id]: {
        title: data.lesson?.title || piece.title,
        body: data.lesson?.body || piece.excerpt,
        units: (data.units ?? piece.units).map((unit) => ({
          id: unit.id,
          title: unit.title,
          body: "body" in unit && unit.body ? unit.body : piece.units.find((row) => row.id === unit.id)?.excerpt || "",
        })),
      },
    }));
  }

  async function saveEdit(piece: KnowledgePiece) {
    const draft = drafts[piece.id];
    if (!draft) return;
    setBusy(`edit:${piece.id}`);
    try {
      const response = await fetch("/api/library/documents", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-fs-org": model.orgSlug },
        body: JSON.stringify({
          lessonId: piece.href ? piece.id : "",
          title: draft.title,
          body: draft.body,
          units: draft.units,
        }),
      });
      if (!response.ok) return;
      setEditing(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function expand(pieceId: string) {
    setBusy(pieceId);
    setFocus(pieceId);
    try {
      const response = await fetch("/api/library/expand", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonId: pieceId }),
      });
      const data = (await response.json()) as { expansion?: string; questions?: string[] };
      setReadings((current) => ({
        ...current,
        [pieceId]: {
          expansion: data.expansion || NEEDS_MORE,
          questions: data.questions?.length ? data.questions : [SCOPE_QUESTION],
          note: response.ok ? "" : NEEDS_MORE,
        },
      }));
    } catch {
      setReadings((current) => ({
        ...current,
        [pieceId]: {
          expansion: NEEDS_MORE,
          questions: [SCOPE_QUESTION],
          note: "",
        },
      }));
    } finally {
      setBusy(null);
    }
  }

  async function saveAnswer(pieceId: string, question: string) {
    const key = `${pieceId}:${question}`;
    const answer = (answers[key] ?? "").trim();
    if (answer.length < 12) return;
    setBusy(key);
    try {
      const response = await fetch("/api/library/expand", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonId: pieceId, question, answer }),
      });
      if (!response.ok) return;
      setAnswers((current) => ({ ...current, [key]: "" }));
      setReadings((current) => ({
        ...current,
        [pieceId]: { ...(current[pieceId] as Reading), note: "Saved into this document." },
      }));
      router.refresh();
    } finally {
      setBusy(null);
    }
  }
  const visible = useMemo(
    () => model.pieces.filter((piece) => matches(piece, filter, query)),
    [model.pieces, filter, query],
  );
  const focusId = visible.some((piece) => piece.id === focus) ? focus : null;
  const map = layoutRepository({ ...model, pieces: visible }, focusId);
  const byId = new Map(map.nodes.map((node) => [node.id, node]));
  const open = visible.find((piece) => piece.id === focusId) ?? null;
  const generated = model.pieces.filter((piece) => piece.generated).length;
  const units = model.pieces.reduce((sum, piece) => sum + piece.units.length, 0);

  return (
    <div data-knowledge-repository="">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <dl className="flex flex-wrap gap-6">
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Pieces</dt>
            <dd className="font-display text-3xl tracking-tight">{model.pieces.length}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Units</dt>
            <dd className="font-display text-3xl tracking-tight">{units}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Generated</dt>
            <dd className="font-display text-3xl tracking-tight">{generated}</dd>
          </div>
        </dl>
        <div className="flex min-w-48 flex-1 flex-wrap items-center justify-end gap-2 sm:max-w-md">
          <button
            type="button"
            onClick={() => setComposer(true)}
            className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Add knowledge
          </button>
          <label className="block min-w-48 flex-1 sm:max-w-xs">
            <span className="sr-only">Find knowledge</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find knowledge"
            className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none ring-primary/30 focus:ring-2"
          />
          </label>
        </div>
      </div>

      {composer ? (
        <Dialog title="Add knowledge" size="lg" onClose={() => setComposer(false)}>
        <form onSubmit={(event) => void addKnowledge(event)}>
          <p className="text-sm text-muted-foreground">
            Paste one document, or several separated by a line that is only ---. A Notion link is stored as a link. Files land as documents too.
          </p>
          <div className="mt-3 grid items-stretch gap-3">
            <div>
          <textarea
            value={bulk}
            onChange={(event) => setBulk(event.target.value)}
            rows={5}
            placeholder="First document&#10;---&#10;Second document"
            className="h-full min-h-36 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
          />
          <label className="mt-3 block text-sm">
            Notion or other link
            <input
              value={notion}
              onChange={(event) => setNotion(event.target.value)}
              placeholder="https://www.notion.so/…"
              className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </label>
            </div>
            <DropWell name="files" multiple retain label="Drop files here" hint="They are stored as documents." className="flex h-full min-h-40 flex-col justify-center" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            A signed-in teacher can also POST documents to <span className="font-mono">/api/library/intake</span> from Grokbot or another MCP tool. Send JSON {"{ items: [{ text, kind }] }"}.
          </p>
          <button type="submit" disabled={busy === "add"} className="mt-3 inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm text-primary-foreground">
            Store knowledge
          </button>
          {addNote ? <p className="mt-3 text-sm">{addNote}</p> : null}
        </form>
        </Dialog>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter knowledge">
        {(
          [
            ["all", "All"],
            ["published", "Published"],
            ["unpublished", "Unpublished"],
            ["generated", "Generated"],
            ["waiting", "Not generated yet"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={cn(
              "h-8 rounded-full border px-3 text-xs",
              filter === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <KnowledgeTree
          pieces={visible}
          focusId={focusId}
          empty={model.pieces.length === 0 ? "Nothing is stored for this org yet." : "Nothing matches."}
          onFocus={setFocus}
        />
        <aside className="rounded-xl border border-border bg-card p-5">
          {open ? (
            <>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {open.statusLabel}
                {open.sourceLabel ? ` · ${open.sourceLabel}` : ""}
                {open.generated ? " · Generated" : " · Not generated yet"}
              </p>
              <h2 className="mt-2 font-display text-2xl tracking-tight">{open.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {open.units.length} {open.units.length === 1 ? "part" : "parts"} of subknowledge
              </p>
              <div className="mt-4 flex flex-col items-start gap-3">
                {open.href ? (
                  <button
                    type="button"
                    onClick={() => void expand(open.id)}
                    disabled={busy === open.id}
                    className="h-9 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
                  >
                    {busy === open.id ? "Reading" : "Expand with AI"}
                  </button>
                ) : null}
                {open.href ? (
                  <Link href={open.href} className="text-sm font-medium text-primary">
                    Open this lesson
                  </Link>
                ) : null}
                <button type="button" className="text-sm font-medium text-primary" onClick={() => void openEdit(open)}>
                  Edit
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">This org</p>
              <h2 className="mt-2 font-display text-2xl tracking-tight">{model.orgName}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {model.pieces.length
                  ? "Open a piece to read its subknowledge. Generated means a quiz was written from that knowledge."
                  : "Drop a file, an idea, or a minute of audio. It lands here once it is stored."}
              </p>
              <Link href="/library/wizard" className="mt-5 inline-flex text-sm font-medium text-primary">
                Open the wizard
              </Link>
            </>
          )}
        </aside>
      </div>

      <details className="mt-6 rounded-xl border border-border bg-card px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">Map</summary>
        <p className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            Generated
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-foreground/80" aria-hidden="true" />
            Not generated yet
          </span>
        </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div
          className="relative h-[28rem] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_36px_-24px_rgba(26,25,22,0.55)] sm:h-[36rem]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 10%, transparent), transparent 58%), radial-gradient(circle, var(--border) 1px, transparent 1px)",
            backgroundSize: "100% 100%, 18px 18px",
          }}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {map.edges.map((edge) => {
              const from = byId.get(edge.from);
              const to = byId.get(edge.to);
              if (!from || !to) return null;
              const live = focusId !== null && (from.pieceId === focusId || to.pieceId === focusId || from.id === "org");
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="currentColor"
                  strokeWidth="1.25"
                  vectorEffect="non-scaling-stroke"
                  className={live ? "text-primary" : "text-primary/35"}
                />
              );
            })}
          </svg>
          {map.nodes.map((node) => {
            const dim = focusId !== null && node.kind === "lesson" && node.pieceId !== focusId;
            return (
              <button
                key={node.id}
                type="button"
                data-node={node.id}
                data-kind={node.kind}
                aria-label={node.title}
                aria-pressed={node.kind === "org" ? focusId === null : focusId === node.pieceId}
                onClick={() => setFocus(node.kind === "lesson" ? node.pieceId : node.kind === "org" ? null : focusId)}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 transition-opacity",
                  node.kind === "org" ? "size-20" : "size-16",
                  dim && "opacity-30",
                )}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <span
                  className={cn(
                    "absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-background shadow-[0_8px_20px_-12px_rgba(26,25,22,0.7)]",
                    node.kind === "org" && "size-20 overflow-hidden bg-primary",
                    node.kind === "lesson" && "size-4",
                    node.kind === "unit" && "size-2.5",
                    node.kind !== "org" && (node.generated ? "bg-primary" : "bg-foreground/80"),
                    focusId === node.pieceId && node.kind === "lesson" && "ring-4 ring-primary/30",
                  )}
                >
                  {node.kind === "org" ? (
                    <span className="line-clamp-2 w-full px-1.5 text-center font-display text-[11px] leading-tight text-primary-foreground">
                      {node.label}
                    </span>
                  ) : null}
                </span>
                {node.kind === "lesson" ? (
                  <span
                    className={cn(
                      "pointer-events-none absolute left-1/2 w-28 -translate-x-1/2 text-center text-[11px] leading-tight text-foreground",
                      node.y < 48 ? "top-1/2 mt-3" : "bottom-1/2 mb-3",
                    )}
                  >
                    {node.label}
                  </span>
                ) : null}
              </button>
            );
          })}
          {visible.length === 0 ? (
            <p className="absolute inset-x-0 bottom-6 text-center text-sm text-muted-foreground">
              {model.pieces.length === 0 ? "Nothing is stored for this org yet." : "Nothing matches."}
            </p>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5 shadow-[0_16px_36px_-24px_rgba(26,25,22,0.55)]">
          {open ? (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {open.statusLabel}
                {open.sourceLabel ? ` · ${open.sourceLabel}` : ""}
                {open.generated ? " · Generated" : " · Not generated yet"}
              </p>
              <h2 className="mt-2 font-display text-2xl tracking-tight">{open.title}</h2>
              {open.excerpt ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{open.excerpt}</p> : null}
              {open.units.length ? (
                <ul className="mt-4 space-y-2">
                  {open.units.map((unit) => (
                    <li key={unit.id} className="text-sm">
                      <span className="font-medium">{unit.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {unit.quizCount > 0 ? "Quiz written" : "No quiz yet"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No unit is stored on this piece.</p>
              )}
              {map.hiddenUnits > 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">{map.hiddenUnits} more units stay in this list.</p>
              ) : null}
              {open.href ? (
                <Link href={open.href} className="mt-5 inline-flex text-sm font-medium text-primary">
                  Open this lesson
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">This org</p>
              <h2 className="mt-2 font-display text-2xl tracking-tight">{model.orgName}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {model.pieces.length
                  ? "Open a piece to see the units stored with it. Generated means a quiz was written from that knowledge."
                  : "Drop a file, an idea, or a minute of audio. It lands here once it is stored."}
              </p>
              <Link href="/library/wizard" className="mt-5 inline-flex text-sm font-medium text-primary">
                Open the wizard
              </Link>
            </>
          )}
        </aside>
      </div>
      {map.hiddenLessons > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {map.shownLessons} of {visible.length} pieces are on the map. The list has every match.
        </p>
      ) : null}
      </details>

      {open ? (
      <div className="mt-6 grid gap-4" aria-label="All knowledge">
          {[open].map((piece) => {
            const reading = readings[piece.id];
            return (
              <article key={piece.id} className="rounded-2xl border border-border bg-card p-5 shadow-[0_16px_36px_-24px_rgba(26,25,22,0.55)]">
                <p className="flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <span>{piece.statusLabel}</span>
                  {piece.sourceLabel ? <span>{piece.sourceLabel}</span> : null}
                  <span>{piece.generated ? "Generated" : "Not generated yet"}</span>
                </p>
                <h3 className="mt-2 font-display text-2xl tracking-tight">{piece.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">The points of this document are in the list above. Expand writes a short reading. Edit changes the document.</p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  {piece.href ? (
                    <button
                      type="button"
                      onClick={() => void expand(piece.id)}
                      disabled={busy === piece.id}
                      className="h-9 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
                    >
                      {busy === piece.id ? "Reading" : "Expand with AI"}
                    </button>
                  ) : null}
                  {piece.href ? (
                    <Link href={piece.href} className="text-sm font-medium text-primary">
                      Open this lesson
                    </Link>
                  ) : null}
                  <button type="button" className="text-sm font-medium text-primary" onClick={() => void openEdit(piece)}>
                    Edit
                  </button>
                </div>
                {editing === piece.id && drafts[piece.id] ? (
                  <form
                    className="mt-4 grid gap-3 border-t border-border pt-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveEdit(piece);
                    }}
                  >
                    <input
                      value={drafts[piece.id]?.title ?? ""}
                      onChange={(event) => {
                        const title = event.target.value;
                        setDrafts((current) => {
                          const row = current[piece.id];
                          if (!row) return current;
                          return { ...current, [piece.id]: { ...row, title } };
                        });
                      }}
                      className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
                    />
                    <textarea
                      value={drafts[piece.id]?.body ?? ""}
                      onChange={(event) => {
                        const body = event.target.value;
                        setDrafts((current) => {
                          const row = current[piece.id];
                          if (!row) return current;
                          return { ...current, [piece.id]: { ...row, body } };
                        });
                      }}
                      rows={4}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                    {(drafts[piece.id]?.units ?? []).map((unit, index) => (
                      <label key={unit.id} className="grid gap-1 text-sm">
                        Point
                        <input
                          value={unit.title}
                          onChange={(event) => {
                            const title = event.target.value;
                            setDrafts((current) => {
                              const row = current[piece.id];
                              if (!row) return current;
                              const next = row.units.slice();
                              next[index] = { ...unit, title };
                              return { ...current, [piece.id]: { ...row, units: next } };
                            });
                          }}
                          className="h-10 rounded-xl border border-border bg-background px-3"
                        />
                        <textarea
                          value={unit.body}
                          onChange={(event) => {
                            const body = event.target.value;
                            setDrafts((current) => {
                              const row = current[piece.id];
                              if (!row) return current;
                              const next = row.units.slice();
                              next[index] = { ...unit, body };
                              return { ...current, [piece.id]: { ...row, units: next } };
                            });
                          }}
                          rows={3}
                          className="rounded-xl border border-border bg-background px-3 py-2"
                        />
                      </label>
                    ))}
                    <button type="submit" disabled={busy === `edit:${piece.id}`} className="h-10 justify-self-start rounded-xl bg-primary px-4 text-sm text-primary-foreground">
                      Save document
                    </button>
                  </form>
                ) : null}
                {reading ? (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-sm leading-relaxed">{reading.expansion}</p>
                    <div className="mt-4 grid gap-4">
                      {reading.questions.map((question, index) => {
                        const key = `${piece.id}:${question}`;
                        const fieldId = `expand-${piece.id}-${index}`;
                        return (
                          <form
                            key={question}
                            onSubmit={(event) => {
                              event.preventDefault();
                              void saveAnswer(piece.id, question);
                            }}
                          >
                            <label className="block text-sm font-medium" htmlFor={fieldId}>
                              {question}
                            </label>
                            <textarea
                              id={fieldId}
                              value={answers[key] ?? ""}
                              onChange={(event) => setAnswers((current) => ({ ...current, [key]: event.target.value }))}
                              rows={3}
                              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
                            />
                            <button type="submit" className="mt-2 text-sm font-medium text-primary" disabled={busy === key}>
                              Save answer
                            </button>
                          </form>
                        );
                      })}
                    </div>
                    {reading.note ? <p className="mt-3 text-sm text-muted-foreground">{reading.note}</p> : null}
                  </div>
                ) : null}
              </article>
            );
          })}
      </div>
      ) : null}
    </div>
  );
}
