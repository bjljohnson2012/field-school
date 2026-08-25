"use client";

import { useEffect, useMemo, useState } from "react";
import { usePortal } from "@/hooks/use-portal";
import { FORM_LABELS } from "@/lib/members/forms";
import type { FormKind, FormSubmission } from "@/lib/members/types";
import { FORM_KINDS } from "@/lib/members/types";
import { cn, formatDay } from "@/lib/utils";

export default function AdminFormsPage() {
  const { ready, isStaff } = usePortal();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<FormKind>("saturday_note");

  useEffect(() => {
    if (!ready || !isStaff) return;
    let cancelled = false;
    fetch("/api/admin/forms")
      .then(async (res) => {
        const data = (await res.json()) as {
          submissions?: FormSubmission[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Forms require a live staff session.");
          return;
        }
        setSubmissions(data.submissions ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load form submissions.");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, isStaff]);

  const counts = useMemo(() => {
    const next = Object.fromEntries(FORM_KINDS.map((kind) => [kind, 0])) as Record<
      FormKind,
      number
    >;
    for (const row of submissions) next[row.kind] += 1;
    return next;
  }, [submissions]);

  const rows = submissions.filter((row) => row.kind === tab);

  if (!ready || !isStaff) return null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Staff
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Forms</h1>
      <p className="mt-3 text-muted-foreground">
        People who wrote in from fieldschool.ai. One tab per form. The Saturday list
        and shop waitlist keep one row per email. Topic requests keep each ask.
      </p>

      {error ? (
        <p className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div
        role="tablist"
        aria-label="Forms"
        className="mt-8 flex flex-wrap gap-1 border-b border-border pb-1"
      >
        {FORM_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={tab === kind}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
              tab === kind && "bg-secondary text-foreground",
            )}
            onClick={() => setTab(kind)}
          >
            {FORM_LABELS[kind]}
            <span className="font-mono text-xs">{counts[kind]}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4" role="tabpanel">
        {rows.length === 0 && !error ? (
          <p className="rounded-xl border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
            No {FORM_LABELS[tab].toLowerCase()} yet.
          </p>
        ) : null}
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-xl border border-border bg-card px-5 py-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl tracking-tight">
                {row.name || row.email}
              </h2>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {formatDay(row.updatedAt)}
              </p>
            </div>
            <p className="mt-2 text-sm">{row.email}</p>
            {row.source ? (
              <p className="mt-1 text-sm text-muted-foreground">{row.source}</p>
            ) : null}
            {row.message ? (
              <p className="mt-3 text-sm leading-relaxed">{row.message}</p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No note.</p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
