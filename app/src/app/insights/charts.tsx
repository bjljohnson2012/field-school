"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { assistDraft, assistFacts, brainBoard, type BrainBoard } from "@/lib/living-brain/model";
import { lessonSpineConfidence, lessonSpineStep } from "@/lib/player/play-rail-write";
import { EMPTY_COPY, type InsightPerson, type InsightPoint, type InsightsModel } from "./aggregate";

type OpenState = {
  people: InsightPerson[];
  person: InsightPerson | null;
  unitId?: string;
  unitLabel?: string;
};

function Bars({
  points,
  scale,
  onOpen,
}: {
  points: InsightPoint[];
  scale: "count" | "percent";
  onOpen: (point: InsightPoint) => void;
}) {
  const max = scale === "percent" ? 100 : Math.max(1, ...points.map((point) => point.value));
  return (
    <div className="flex flex-col gap-3">
      {points.map((point) => {
        const width = max === 0 ? 0 : Math.max(0, Math.min(100, (point.value / max) * 100));
        return (
          <button
            key={point.id}
            type="button"
            data-point={point.id}
            data-unit={point.unitId || undefined}
            data-value={point.value}
            onClick={() => onOpen(point)}
            className="block w-full rounded-lg px-1 py-1 text-left hover:bg-secondary/60"
          >
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span>{point.label}</span>
              <span className="font-mono text-xs text-muted-foreground">{point.valueLabel}</span>
            </span>
            <span className="mt-1 block h-3 rounded-full bg-secondary">
              <span
                className="block h-3 rounded-full bg-primary"
                style={{ width: `${width}%` }}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ChartFrame({
  id,
  title,
  hint,
  empty,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <section data-chart={id} aria-label={title} className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <div className="mt-4">{empty ? <p>{EMPTY_COPY}</p> : children}</div>
    </section>
  );
}

function PersonCard({ person }: { person: InsightPerson }) {
  const role =
    person.kind === "child" ? "Tracked child" : person.stance === "learner" ? "Login learner" : "Hirer";
  return (
    <article data-person={person.membershipId} data-kind={person.kind} data-login={person.login}>
      <h3 className="font-display text-2xl tracking-tight">{person.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{role}</p>
      <p className="mt-1 text-sm">Login {person.login}</p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">{person.membershipId}</p>
    </article>
  );
}

export function InsightsBoard({ model }: { model: InsightsModel }) {
  const [open, setOpen] = useState<OpenState | null>(null);

  function onOpen(point: InsightPoint) {
    setOpen({
      people: point.people,
      person: point.people[0] ?? null,
      unitId: point.unitId,
      unitLabel: point.unitId ? point.label : undefined,
    });
  }

  function onOpenPerson(person: InsightPerson) {
    setOpen({ people: [person], person });
  }

  const scoreMax = Math.max(
    1,
    ...model.skills.cells.map((cell) => (typeof cell.score === "number" ? cell.score : 0)),
  );

  const [board, setBoard] = useState<BrainBoard | null>(model.brainBoard ?? null);
  const [suggestionSource, setSuggestionSource] = useState<"" | "ai" | "fallback">("");

  async function saveOrgOutcome(outcome: string) {
    if (!board) return;
    const response = await fetch("/api/living-brain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    const data = (await response.json()) as { brain?: BrainBoard };
    if (!response.ok || !data.brain) return;
    setBoard(brainBoard({ room: board.room, brain: data.brain }));
  }

  async function saveFacts() {
    if (!board) return;
    const response = await fetch("/api/living-brain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assistFacts: true }),
    });
    const data = (await response.json()) as { brain?: BrainBoard };
    if (!response.ok || !data.brain) return;
    setBoard(brainBoard({ room: board.room, brain: data.brain }));
  }

  async function saveSuggestion(person: BrainBoard["people"][number]) {
    if (!board) return;
    const response = await fetch("/api/living-brain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        assist: true,
        membershipId: person.membershipId,
        pathTitle: board.facts,
        nextStep: person.outcomes,
      }),
    });
    const data = (await response.json()) as { brain?: BrainBoard; source?: "ai" | "fallback" };
    if (!response.ok || !data.brain) return;
    if (data.source === "ai" || data.source === "fallback") setSuggestionSource(data.source);
    setBoard(brainBoard({ room: board.room, brain: data.brain }));
  }

  async function saveConfidence(person: BrainBoard["people"][number], confidence: string) {
    if (!board) return;
    const response = await fetch("/api/living-brain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ membershipId: person.membershipId, confidence }),
    });
    const data = (await response.json()) as { brain?: BrainBoard };
    if (!response.ok || !data.brain) return;
    setBoard(brainBoard({ room: board.room, brain: data.brain }));
  }

  return (
    <div data-org={model.orgSlug} data-children={model.childrenIncluded} data-sales-diagnostics={model.salesDiagnostics}>
      {board ? (
        <section
          data-chart="org-brain"
          data-brain-room={board.room}
          data-brain-count={board.people.length}
          data-sales-children={board.room === "sales" ? "0" : undefined}
          data-suggestion-source={suggestionSource || undefined}
          aria-label="Org brain"
          className="mb-4 rounded-xl border border-border bg-card p-5"
        >
          <h2 className="font-display text-2xl tracking-tight">Org brain</h2>
          <p className="mt-1 text-sm text-muted-foreground">Facts for this org, what this family or team is aiming for, then each person.</p>
          <p className="mt-4 text-sm" data-brain-facts={board.facts ? "yes" : "no"}>
            {board.facts || "No org facts yet."}
          </p>
          {board.outcome ? (
            <>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em]" data-aim-label="Aim">
                Aim
              </p>
              <p className="mt-1 text-sm font-medium">
                {board.room === "sales" ? "What this team is aiming for" : "What this family is aiming for"}
              </p>
            </>
          ) : board.people.some((person) => lessonSpineStep(person.outcomes)) ? (
            <>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em]" data-aim-label="Aim" data-aim-from="outcomes">
                Aim
              </p>
              <p className="mt-1 text-sm font-medium">
                {board.room === "sales" ? "What this team is aiming for" : "What this family is aiming for"}
              </p>
            </>
          ) : null}
          <p
            className="mt-3 text-sm"
            data-org-outcome={board.outcome ? "yes" : "no"}
            data-org-aim={board.outcome || board.people.some((person) => lessonSpineStep(person.outcomes)) ? "yes" : "no"}
            data-aim-from={!board.outcome && board.people.some((person) => lessonSpineStep(person.outcomes)) ? "outcomes" : undefined}
          >
            {board.outcome ||
              board.people.map((person) => lessonSpineStep(person.outcomes)).find(Boolean) ||
              (board.room === "sales"
                ? "No line for what this team is aiming for yet."
                : "No line for what this family is aiming for yet.")}
          </p>
          <form
            className="mt-2 flex flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const field = new FormData(event.currentTarget).get("outcome");
              void saveOrgOutcome(typeof field === "string" ? field : "");
            }}
          >
            <input
              name="outcome"
              defaultValue={board.outcome}
              aria-label="What this family or team is aiming for"
              className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-sm"
            />
            <button type="submit" className="text-xs underline underline-offset-4" data-save-org-outcome="yes">
              Save what we are aiming for
            </button>
          </form>
          {(() => {
            const suggested = assistFacts(board);
            if (!suggested.ok || !suggested.changed) return null;
            return (
              <p className="mt-2 text-sm" data-facts-assist="yes">
                <span className="text-muted-foreground">Suggested: {suggested.facts}</span>
                <button type="button" className="ml-2 text-xs underline underline-offset-4" data-save-facts="yes" onClick={() => void saveFacts()}>
                  Save org facts
                </button>
              </p>
            );
          })()}
          {board.people.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-2 font-medium text-muted-foreground">Person</th>
                    <th className="px-2 py-2 font-medium text-muted-foreground">Profile</th>
                    <th className="px-2 py-2 font-medium text-muted-foreground">Outcomes</th>
                    <th className="px-2 py-2 font-medium text-muted-foreground">Login</th>
                  </tr>
                </thead>
                <tbody>
                  {board.people.map((person) => {
                    const spine = lessonSpineStep(person.outcomes);
                    const spineConfidence = lessonSpineConfidence(person.outcomes);
                    const suggestion = assistDraft({
                      room: board.room,
                      person,
                      facts: board.facts,
                      context: { pathTitle: board.facts, nextStep: person.outcomes },
                    });
                    const draft = suggestion.ok && suggestion.draft.changed ? suggestion.draft : null;
                    return (
                    <tr
                      key={person.membershipId}
                      className="border-t border-border"
                      data-brain-person={person.membershipId}
                      data-kind={person.kind}
                      data-login={person.login}
                      data-owns-outcomes="false"
                      data-assist={draft ? "yes" : "no"}
                    >
                      <td className="px-2 py-2">{person.name}</td>
                      <td className="px-2 py-2">
                        {person.profile || "—"}
                        <p
                          className="mt-1 text-xs text-muted-foreground"
                          data-confidence={person.membershipId}
                          data-confidence-from={spineConfidence ? "outcomes" : undefined}
                        >
                          {person.confidence ? (
                            <>
                              <span className="block text-xs font-medium uppercase tracking-[0.12em] text-foreground" data-confidence-label="Confidence">
                                Confidence
                              </span>
                              <span className="mt-1 block text-sm font-medium text-foreground">How they are doing</span>
                              <span className="mt-1 block">{spineConfidence || person.confidence}</span>
                            </>
                          ) : spineConfidence ? (
                            <>
                              <span className="block text-xs font-medium uppercase tracking-[0.12em] text-foreground" data-confidence-label="Confidence">
                                Confidence
                              </span>
                              <span className="mt-1 block text-sm font-medium text-foreground">How they are doing</span>
                              <span className="mt-1 block">{spineConfidence}</span>
                            </>
                          ) : (
                            "No note on how they are doing yet."
                          )}
                        </p>
                        <form
                          className="mt-1 flex flex-wrap items-center gap-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const field = new FormData(event.currentTarget).get("confidence");
                            void saveConfidence(person, typeof field === "string" ? field : "");
                          }}
                        >
                          <input
                            name="confidence"
                            defaultValue={person.confidence}
                            aria-label={`How ${person.name} is doing`}
                            className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-xs"
                          />
                          <button type="submit" className="text-xs underline underline-offset-4" data-save-confidence={person.membershipId}>
                            Save how they are doing
                          </button>
                        </form>
                        {spine ? (
                          <p
                            className="mt-1 text-xs text-muted-foreground"
                            data-suggestion-context="living-brain"
                            data-lesson-spine-next={spine}
                            data-confidence-from="outcomes"
                          >
                            Suggestion uses {spine}. {spineConfidence}
                          </p>
                        ) : null}
                        {draft ? <p className="mt-1 text-xs text-muted-foreground">Suggested: {draft.profile}</p> : null}
                      </td>
                      <td className="px-2 py-2">
                        {spine ? (
                          <Link href="/play/lesson-spine" data-lesson-spine-next={spine} data-next-from="outcomes">
                            {spine}
                          </Link>
                        ) : (
                          person.outcomes || "—"
                        )}
                        {person.history.length ? (
                          <ol className="mt-1 space-y-0.5 text-xs text-muted-foreground" data-history={person.membershipId} data-history-count={person.history.length}>
                            {person.history.map((mark, index) => {
                              const past = lessonSpineStep(mark.outcomes);
                              return (
                                <li key={`${index}-${mark.outcomes}`} data-lesson-spine-next={past || undefined}>
                                  {past ? <Link href="/play/lesson-spine">{past}</Link> : mark.outcomes}
                                </li>
                              );
                            })}
                          </ol>
                        ) : null}
                        {draft ? (
                          <button
                            type="button"
                            className="mt-1 block text-xs underline underline-offset-4"
                            data-save-assist={person.membershipId}
                            onClick={() => void saveSuggestion(person)}
                          >
                            Save suggestion
                          </button>
                        ) : null}
                      </td>
                      <td className="px-2 py-2">{person.login === "none" ? "No login" : "May sign in"}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No people on this brain yet.</p>
          )}
        </section>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartFrame id="movement" title="Movement" hint="Moved in the last 7 days, and stalled." empty={model.empty}>
          <Bars points={model.movement} scale="count" onOpen={onOpen} />
        </ChartFrame>
        <ChartFrame id="next-step" title="Next-step" hint="No next portion, or no next unit." empty={model.empty}>
          {model.brainNext ? (
            <p
              className="mb-3 text-sm"
              data-next-from="brain"
              data-login={model.brainNext.login}
              data-lesson-spine-next={lessonSpineStep(model.brainNext.title) || undefined}
            >
              {model.brainNext.name}:{" "}
              {lessonSpineStep(model.brainNext.title) ? (
                <Link href="/play/lesson-spine">{model.brainNext.title}</Link>
              ) : (
                model.brainNext.title
              )}
            </p>
          ) : null}
          <Bars points={model.nextStep} scale="count" onOpen={onOpen} />
        </ChartFrame>
        <ChartFrame id="checks" title="Checks" hint="Quiz pass rate by unit." empty={model.empty}>
          {model.checks.length ? (
            <Bars points={model.checks} scale="percent" onOpen={onOpen} />
          ) : (
            <p className="text-sm text-muted-foreground">No quiz checks in this org.</p>
          )}
        </ChartFrame>
        <ChartFrame id="credits" title="Credits" hint="Platform burn and BYOK usage, in units." empty={model.empty}>
          <Bars points={model.credits} scale="count" onOpen={onOpen} />
        </ChartFrame>
        <ChartFrame id="assignments" title="Assignments" hint="Open and completed." empty={model.empty}>
          <Bars points={model.assignments} scale="count" onOpen={onOpen} />
        </ChartFrame>
        <ChartFrame id="skills" title="Skills" hint="skill_states for this org." empty={model.empty}>
          {model.skills.columns.length && model.skills.people.length ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-2 font-medium text-muted-foreground">Person</th>
                    {model.skills.columns.map((column) => (
                      <th key={column.id} className="px-2 py-2 font-medium text-muted-foreground">
                        {column.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {model.skills.people.map((person) => (
                    <tr key={person.membershipId} className="border-t border-border">
                      <td className="px-2 py-2">{person.name}</td>
                      {model.skills.columns.map((column) => {
                        const cell = model.skills.cells.find(
                          (row) => row.membershipId === person.membershipId && row.skillId === column.id,
                        );
                        const score = cell?.score;
                        const shown = typeof score === "number";
                        const tone = shown ? Math.max(0.15, score / scoreMax) : 0;
                        return (
                          <td key={column.id} className="px-2 py-2">
                            <button
                              type="button"
                              data-point={`skill:${column.id}:${person.membershipId}`}
                              data-score={shown ? String(score) : ""}
                              onClick={() => onOpenPerson(person)}
                              className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 font-mono text-xs"
                              style={{ background: shown ? `color-mix(in srgb, var(--primary) ${Math.round(tone * 100)}%, var(--secondary))` : "var(--secondary)" }}
                            >
                              {shown ? score : "—"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No skill states in this org.</p>
          )}
        </ChartFrame>
      </div>
      <aside className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-2xl tracking-tight">Person</h2>
        {open?.unitId ? (
          <p className="mt-3 text-sm" data-unit={open.unitId}>
            {open.unitLabel}
          </p>
        ) : null}
        {open && open.people.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {open.people.map((person) => (
              <button
                key={person.membershipId}
                type="button"
                data-person={person.membershipId}
                onClick={() => setOpen({ ...open, person })}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary/60"
              >
                {person.name}
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-4">
          {open?.person ? (
            <PersonCard person={open.person} />
          ) : (
            <p className="text-sm text-muted-foreground">Open a point to see a person.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
