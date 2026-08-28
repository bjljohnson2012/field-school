"use client";

import { useState } from "react";
import type { Module } from "@/lib/course/types";
import { Button } from "@/components/ui/button";

export function AssignmentPanel({
  module,
  assignment,
  notes,
  onSave,
}: {
  module: Module;
  assignment: Record<string, boolean>;
  notes: string;
  onSave: (assignment: Record<string, boolean>, notes: string) => void;
}) {
  const [draftSlug, setDraftSlug] = useState(module.slug);
  const [checks, setChecks] = useState(assignment);
  const [text, setText] = useState(notes);
  const [saved, setSaved] = useState(false);

  if (draftSlug !== module.slug) {
    setDraftSlug(module.slug);
    setChecks(assignment);
    setText(notes);
    setSaved(false);
  }

  const required = module.assignment.items.filter((i) => i.required);
  const done = required.filter((i) => checks[i.id]).length;

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Field work
          </p>
          <h2 className="mt-1 font-display text-2xl tracking-tight">
            {module.assignment.title}
          </h2>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {done}/{required.length} required
        </span>
      </div>
      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {module.assignment.brief}
      </p>
      <ul className="space-y-3">
        {module.assignment.items.map((item) => (
          <li key={item.id}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border bg-secondary/50 px-3 py-3">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[var(--primary)]"
                checked={Boolean(checks[item.id])}
                onChange={(e) => {
                  setSaved(false);
                  setChecks((prev) => ({ ...prev, [item.id]: e.target.checked }));
                }}
              />
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                {item.hint ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {item.hint}
                  </span>
                ) : null}
                {item.required ? (
                  <span className="mt-1 block text-[11px] uppercase tracking-wider text-faint">
                    Required
                  </span>
                ) : null}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <label className="mt-5 block">
        <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Workbook
        </span>
        <textarea
          value={text}
          onChange={(e) => {
            setSaved(false);
            setText(e.target.value);
          }}
          rows={8}
          placeholder={module.assignment.notesPlaceholder}
          className="w-full resize-y rounded-xl border border-border bg-background px-3 py-3 font-mono text-sm leading-relaxed placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>
      <div className="mt-4 flex items-center gap-3">
        <Button
          className="h-11 rounded-xl px-5"
          onClick={() => {
            onSave(checks, text);
            setSaved(true);
          }}
        >
          Save field work
        </Button>
        {saved ? <span className="text-sm text-pass">Saved to your portal</span> : null}
      </div>
    </section>
  );
}
