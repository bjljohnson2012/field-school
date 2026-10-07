"use client";

import { useState } from "react";

export type DraftRequirement = {
  label: string;
  kind: "knowledge" | "skill" | "demonstration";
  weight: number;
  doneCondition: { evidenceType: string; text: string };
};

export function RequirementEditor({
  initial,
  busy,
  onConfirm,
}: {
  initial: DraftRequirement[];
  busy: boolean;
  onConfirm: (rows: DraftRequirement[]) => void;
}) {
  const [rows, setRows] = useState(initial);
  function update(index: number, label: string) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, label } : row)));
  }
  return (
    <section aria-label="Requirements" className="rounded-2xl border border-border bg-card px-4 py-4">
      <h2 className="text-sm font-semibold">Confirm the requirements</h2>
      <p className="mt-1 text-sm text-muted-foreground">Scoring starts after you confirm. Keep 3 to 12.</p>
      <ul className="mt-3 space-y-3">
        {rows.map((row, index) => (
          <li key={`${row.kind}-${index}`}>
            <label className="text-xs text-muted-foreground" htmlFor={`req-${index}`}>
              {row.kind} · weight {row.weight}
            </label>
            <input
              id={`req-${index}`}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={row.label}
              onChange={(event) => update(index, event.target.value)}
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-4 rounded-full bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        disabled={busy || rows.length < 3}
        onClick={() => onConfirm(rows)}
      >
        Confirm requirements
      </button>
    </section>
  );
}
