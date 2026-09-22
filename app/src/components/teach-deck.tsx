"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shape copied here. N4 owns the shared module. Do not add app/src/lib/lesson-spec.ts. */
export type LessonSpec = {
  id: string;
  org: string;
  title: string;
  outcome: string;
  units: { id: string; title: string; source_unit_id: string }[];
  mode: "teach" | "assign" | "video";
};

const MODE_LABEL: Record<LessonSpec["mode"], string> = {
  teach: "Teach live",
  assign: "Assign",
  video: "Video",
};

const JOB =
  "When I am accountable for people’s development and for the organization’s success, and I cannot sit with them every hour, I invest in Field School so each person keeps moving on a path fit to who they are now, they get better, the organization gets better, and the learning actually takes.";

export function TeachDeck({ spec }: { spec: LessonSpec }) {
  const count = spec.units.length;
  const [index, setIndex] = useState(0);
  const safeIndex = count === 0 ? 0 : Math.min(index, count - 1);
  const unit = count === 0 ? null : spec.units[safeIndex];

  function step(delta: number) {
    setIndex((current) => {
      if (count === 0) return 0;
      const bounded = Math.min(current, count - 1);
      return Math.max(0, Math.min(count - 1, bounded + delta));
    });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        setIndex((current) => (count === 0 ? 0 : Math.min(count - 1, current + 1)));
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setIndex((current) => (count === 0 ? 0 : Math.max(0, current - 1)));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  return (
    <main
      data-teach-deck={spec.id}
      data-mode={spec.mode}
      data-org={spec.org}
      className="mx-auto max-w-6xl px-4 py-10"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {MODE_LABEL[spec.mode]}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{spec.title}</h1>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
        Team room. Org {spec.org}. The leader presents. The teammate is in
        development, is not the buyer, and does not own the path.
      </p>
      <p data-outcome="" className="mt-6 max-w-3xl text-lg leading-relaxed">
        {spec.outcome}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <nav aria-label="Lesson units">
          {count === 0 ? (
            <p className="text-sm text-muted-foreground">No units on this lesson yet.</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {spec.units.map((item, itemIndex) => {
                const current = itemIndex === safeIndex;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-current={current ? "step" : undefined}
                      onClick={() => setIndex(itemIndex)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm",
                        current
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      <span className="font-mono text-xs opacity-80">
                        {itemIndex + 1}
                      </span>{" "}
                      {item.title}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </nav>

        <section
          aria-live="polite"
          className="flex min-h-80 flex-col justify-between rounded-xl bg-card p-6 ring-1 ring-foreground/10 sm:p-10"
        >
          {unit ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Unit {safeIndex + 1} of {count}
              </p>
              <h2
                data-unit-title=""
                className="mt-4 font-display text-4xl tracking-tight sm:text-5xl"
              >
                {unit.title}
              </h2>
              <p className="mt-8 text-sm text-muted-foreground">
                Source unit{" "}
                <span data-source-unit-id="" className="font-mono text-foreground">
                  {unit.source_unit_id}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-lg">This lesson has no units to present.</p>
          )}
          <p className="mt-8 text-sm text-muted-foreground">
            Arrow keys move between units. This hour is the leader in the room.
            The outcome is what still runs after the leader leaves.
          </p>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 px-4"
          disabled={count === 0 || safeIndex === 0}
          onClick={() => step(-1)}
        >
          Previous unit
        </Button>
        <Button
          type="button"
          size="lg"
          className="h-11 px-4"
          disabled={count === 0 || safeIndex >= count - 1}
          onClick={() => step(1)}
        >
          Next unit
        </Button>
      </div>

      <p data-job="" className="mt-12 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {JOB}
      </p>
    </main>
  );
}
