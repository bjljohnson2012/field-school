"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SCOPE_QUESTION } from "@/lib/library/expand-knowledge";
import { layoutRepository, type KnowledgePiece, type RepositoryModel } from "@/lib/library/knowledge-network";
import { NEEDS_MORE } from "@/lib/library/teach-from-knowledge";
import { cn } from "@/lib/utils";

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
        <span className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            Generated
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-foreground/80" aria-hidden="true" />
            Not generated yet
          </span>
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
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
                Add knowledge
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

      <div className="mt-8 grid gap-4" aria-label="All knowledge">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {model.pieces.length === 0 ? "Nothing is stored for this org yet." : "Nothing matches."}
          </p>
        ) : (
          visible.map((piece) => {
            const reading = readings[piece.id];
            return (
              <article key={piece.id} className="rounded-2xl border border-border bg-card p-5 shadow-[0_16px_36px_-24px_rgba(26,25,22,0.55)]">
                <p className="flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <span>{piece.statusLabel}</span>
                  {piece.sourceLabel ? <span>{piece.sourceLabel}</span> : null}
                  <span>{piece.generated ? "Generated" : "Not generated yet"}</span>
                </p>
                <h3 className="mt-2 font-display text-2xl tracking-tight">{piece.title}</h3>
                {piece.excerpt ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{piece.excerpt}</p> : null}
                {piece.units.length ? (
                  <ul className="mt-4 grid gap-3">
                    {piece.units.map((unit) => (
                      <li key={unit.id} className="rounded-xl border border-border px-4 py-3">
                        <p className="text-sm font-medium">{unit.title}</p>
                        {unit.excerpt && unit.excerpt !== unit.title ? (
                          <p className="mt-1 text-sm text-muted-foreground">{unit.excerpt}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">{unit.quizCount > 0 ? "Quiz written" : "No quiz yet"}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">No point is stored on this document yet.</p>
                )}
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
                </div>
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
          })
        )}
      </div>
    </div>
  );
}
