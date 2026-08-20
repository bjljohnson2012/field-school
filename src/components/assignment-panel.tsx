import { useEffect, useState } from "react";
import type { Module } from "@/lib/course/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AssignmentPanel({
  module,
  assignment,
  notes,
  onSave,
}: {
  module: Module;
  assignment: Record<string, boolean>;
  notes: string;
  onSave: (assignment: Record<string, boolean>, notes: string) => Promise<unknown> | unknown;
}) {
  const [checks, setChecks] = useState(assignment);
  const [text, setText] = useState(notes);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setChecks(assignment);
    setText(notes);
  }, [assignment, notes, module.slug]);

  const required = module.assignment.items.filter((i) => i.required);
  const done = required.filter((i) => checks[i.id]).length;

  async function save() {
    setBusy(true);
    try {
      await onSave(checks, text);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Field work</p>
          <h2 className="mt-1 font-display text-2xl tracking-tight">
            {module.assignment.title}
          </h2>
        </div>
        <span className="text-xs tabular-nums text-muted">
          {done}/{required.length} required
        </span>
      </div>
      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted">
        {module.assignment.brief}
      </p>
      <ul className="space-y-3">
        {module.assignment.items.map((item) => (
          <li key={item.id}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-border bg-raised/50 px-3 py-3">
              <input
                type="checkbox"
                className="mt-1 size-4"
                checked={Boolean(checks[item.id])}
                onChange={(e) => {
                  setSaved(false);
                  setChecks((prev) => ({ ...prev, [item.id]: e.target.checked }));
                }}
              />
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                {item.hint ? (
                  <span className="mt-1 block text-xs text-muted">{item.hint}</span>
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
        <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted">
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
          className="w-full resize-y rounded-md border border-border bg-bg px-3 py-3 font-mono text-sm leading-relaxed text-fg placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </label>
      <div className="mt-4 flex items-center gap-3">
        <Button disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save field work"}
        </Button>
        {saved ? (
          <span className={cn("text-sm text-pass")}>Saved</span>
        ) : null}
      </div>
    </section>
  );
}
