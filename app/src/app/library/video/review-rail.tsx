"use client";

import type { LessonSpec } from "./lesson-spec";
import { renameDraftUnit } from "./draft-units";

export function ReviewRail({
  spec,
  onChange,
}: {
  spec: LessonSpec;
  onChange: (spec: LessonSpec) => void;
}) {
  return (
    <section className="mt-10 rounded-xl border border-border bg-card px-5 py-5">
      <h2 className="font-display text-2xl">Review rail</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Draft units for {spec.org}. Each unit keeps its source unit id. Nothing here plays the take.
      </p>
      <ol className="mt-5 grid gap-4">
        {spec.units.map((unit, index) => (
          <li key={unit.id} className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.12em] text-muted-foreground" htmlFor={unit.id}>
              Unit {index + 1}
            </label>
            <input
              id={unit.id}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm"
              value={unit.title}
              onChange={(event) => {
                const raw = event.target.value.replace(/[ \t]{2,}/g, " ");
                if (!raw.trim()) return;
                const title = raw.length > 80 ? `${raw.slice(0, 77)}...` : raw;
                onChange({
                  ...spec,
                  units: spec.units.map((item, unitIndex) =>
                    unitIndex === index ? { ...item, title } : item,
                  ),
                });
              }}
              onBlur={(event) => onChange(renameDraftUnit(spec, index, event.target.value))}
            />
            <p className="font-mono text-xs text-muted-foreground">{unit.source_unit_id}</p>
          </li>
        ))}
      </ol>
      <pre className="mt-6 overflow-x-auto rounded-xl border border-border bg-background p-4 text-xs">
        {JSON.stringify(spec, null, 2)}
      </pre>
    </section>
  );
}
