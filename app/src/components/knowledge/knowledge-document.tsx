"use client";

import Link from "next/link";
import type { KnowledgePiece } from "@/lib/library/knowledge-network";

export type KnowledgeDraft = {
  title: string;
  body: string;
  units: { id: string; title: string; body: string }[];
};

export type KnowledgeReading = { expansion: string; questions: string[]; note: string };

export function KnowledgeDocument({
  piece,
  editing,
  draft,
  busy,
  reading,
  answers,
  expandLabel,
  onExpand,
  onEdit,
  onSave,
  onDraft,
  onAnswer,
  onSaveAnswer,
}: {
  piece: KnowledgePiece;
  editing: boolean;
  draft: KnowledgeDraft | null;
  busy: string | null;
  reading: KnowledgeReading | null;
  answers: Record<string, string>;
  expandLabel: string;
  onExpand: () => void;
  onEdit: () => void;
  onSave: () => void;
  onDraft: (next: KnowledgeDraft) => void;
  onAnswer: (key: string, value: string) => void;
  onSaveAnswer: (question: string) => void;
}) {
  return (
    <div>
      <div className="flex h-11 items-center gap-2 border-b border-border px-4 text-xs text-muted-foreground">
        <span>Knowledge</span>
        <span aria-hidden="true">/</span>
        <span className="truncate text-foreground">{piece.title}</span>
      </div>
      <article className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary" aria-hidden="true">
            <svg viewBox="0 0 16 16" className="size-6">
              <path
                d="M3.5 1.5h6L13.5 5.5V14a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path d="M9.2 1.8V5.2h3.3" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <h2 className="min-w-0 font-display text-4xl tracking-tight sm:text-5xl">{piece.title}</h2>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-border py-4 sm:grid-cols-4">
          <Field label="Status" value={piece.statusLabel} />
          <Field label="Source" value={piece.sourceLabel || "None"} />
          <Field label="Parts" value={String(piece.units.length)} />
          <Field label="Generated" value={piece.generated ? "Generated" : "Not generated yet"} />
        </dl>
        {piece.excerpt ? <p className="mt-8 text-base leading-relaxed">{piece.excerpt}</p> : null}
        <p className="mt-10 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Subknowledge</p>
        {piece.units.length ? (
          <div className="mt-2">
            {piece.units.map((unit) => (
              <section id={`unit-${unit.id}`} key={unit.id} className="relative scroll-mt-24 border-b border-border py-4 pl-7">
                <span className="absolute left-0 top-6 size-1.5 rounded-full bg-primary/80" aria-hidden="true" />
                <h3 className="text-lg font-medium">{unit.title}</h3>
                {unit.excerpt && unit.excerpt !== unit.title ? (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{unit.excerpt}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">{unit.quizCount > 0 ? "Quiz written" : "No quiz yet"}</p>
              </section>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No point is stored on this document yet.</p>
        )}
        <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Links</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This page links to {piece.units.length} {piece.units.length === 1 ? "point" : "points"}. The map draws those edges.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {piece.href ? (
            <button
              type="button"
              onClick={onExpand}
              disabled={busy === piece.id}
              className="h-9 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              {busy === piece.id ? "Reading" : expandLabel}
            </button>
          ) : null}
          {piece.href ? (
            <Link href={piece.href} className="text-sm font-medium text-primary">
              Open this lesson
            </Link>
          ) : null}
          <button type="button" className="text-sm font-medium text-primary" onClick={onEdit}>
            Edit
          </button>
        </div>
        {editing && draft ? (
          <form
            className="mt-6 grid gap-3 border-t border-border pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSave();
            }}
          >
            <input
              value={draft.title}
              onChange={(event) => onDraft({ ...draft, title: event.target.value })}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
            />
            <textarea
              value={draft.body}
              onChange={(event) => onDraft({ ...draft, body: event.target.value })}
              rows={4}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            {draft.units.map((unit, index) => (
              <label key={unit.id} className="grid gap-1 text-sm">
                Point
                <input
                  value={unit.title}
                  onChange={(event) => {
                    const units = draft.units.slice();
                    units[index] = { ...unit, title: event.target.value };
                    onDraft({ ...draft, units });
                  }}
                  className="h-10 rounded-xl border border-border bg-background px-3"
                />
                <textarea
                  value={unit.body}
                  onChange={(event) => {
                    const units = draft.units.slice();
                    units[index] = { ...unit, body: event.target.value };
                    onDraft({ ...draft, units });
                  }}
                  rows={3}
                  className="rounded-xl border border-border bg-background px-3 py-2"
                />
              </label>
            ))}
            <button
              type="submit"
              disabled={busy === `edit:${piece.id}`}
              className="h-10 justify-self-start rounded-xl bg-primary px-4 text-sm text-primary-foreground"
            >
              Save document
            </button>
          </form>
        ) : null}
        {reading ? (
          <div className="mt-6 border-t border-border pt-4">
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
                      onSaveAnswer(question);
                    }}
                  >
                    <label className="block text-sm font-medium" htmlFor={fieldId}>
                      {question}
                    </label>
                    <textarea
                      id={fieldId}
                      value={answers[key] ?? ""}
                      onChange={(event) => onAnswer(key, event.target.value)}
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
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}
