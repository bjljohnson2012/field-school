"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { chooseNextStep, type LivingBrain } from "@/lib/living-brain/model";
import {
  DESK_COPY,
  ERROR_COPY,
  GUEST_COPY,
  JOB_SENTENCE,
  LEARNER_COPY,
  PICK_COPY,
  assignedLine,
  peopleOnDesk,
  visibleAssignments,
  type DeskPerson,
  type DeskRoom,
  type OpenAssignment,
} from "./desk";

type UnitDraft = { id: string; title: string; source_unit_id: string };

type DeskBody = {
  ok: true;
  room: DeskRoom | null;
  leader: boolean;
  actorMembershipId: string;
  doors: DeskRoom[];
  people: DeskPerson[];
  assignments: OpenAssignment[];
};

type View =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "child" }
  | { status: "error"; message: string }
  | { status: "pick"; doors: DeskRoom[] }
  | {
      status: "desk";
      room: DeskRoom;
      leader: boolean;
      actorMembershipId: string;
      doors: DeskRoom[];
      people: DeskPerson[];
      assignments: OpenAssignment[];
    };

function freshUnit(): UnitDraft {
  return { id: crypto.randomUUID(), title: "", source_unit_id: "" };
}

function messageFor(code: string) {
  return ERROR_COPY[code] || "This desk could not be reached.";
}

async function fetchDesk(org?: DeskRoom): Promise<View> {
  try {
    const res = await fetch("/assign/desk", {
      headers: org ? { "x-fs-org": org } : undefined,
    });
    const data = (await res.json()) as { ok?: boolean; error?: string } & Partial<DeskBody>;
    if (res.status === 401 || data.error === "sign_in_required") return { status: "guest" };
    if (data.error === "child_has_no_login") return { status: "child" };
    if (!res.ok || !data.ok || data.room === undefined) {
      return { status: "error", message: messageFor(data.error || "") };
    }
    if (!data.room) return { status: "pick", doors: data.doors ?? [] };
    const room = data.room;
    const actorMembershipId = data.actorMembershipId || "";
    return {
      status: "desk",
      room,
      leader: Boolean(data.leader),
      actorMembershipId,
      doors: data.doors ?? [],
      people: peopleOnDesk(room, data.people ?? [], actorMembershipId),
      assignments: visibleAssignments(
        room,
        data.assignments ?? [],
        actorMembershipId,
        Boolean(data.leader),
      ),
    };
  } catch {
    return { status: "error", message: "This desk could not be reached." };
  }
}

export function AssignDesk() {
  const requestId = useRef(0);
  const [view, setView] = useState<View>({ status: "loading" });
  const [title, setTitle] = useState("");
  const [outcome, setOutcome] = useState("");
  const [units, setUnits] = useState<UnitDraft[]>([
    { id: "unit-1", title: "", source_unit_id: "" },
  ]);
  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [brainNext, setBrainNext] = useState<Record<string, string>>({});

  async function loadBrain(room: DeskRoom) {
    try {
      const res = await fetch("/api/living-brain");
      if (!res.ok) return;
      const data = (await res.json()) as { brain?: LivingBrain };
      const brain = data.brain;
      if (!brain || brain.room !== room) return;
      const map: Record<string, string> = {};
      for (const person of brain.people) {
        const chosen = chooseNextStep({ room, brain, membershipId: person.membershipId });
        if (chosen && chosen.from !== "stored") map[person.membershipId] = chosen.title;
      }
      setBrainNext(map);
    } catch {
      setBrainNext({});
    }
  }

  useEffect(() => {
    const ticket = ++requestId.current;
    void fetchDesk().then((next) => {
      if (ticket !== requestId.current) return;
      setView(next);
      if (next.status === "desk") void loadBrain(next.room);
    });
  }, []);

  async function switchDesk(org: DeskRoom) {
    const ticket = ++requestId.current;
    setNotice("");
    setFormError("");
    setSelectedId("");
    setView({ status: "loading" });
    const switched = await fetch("/api/org/active", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: org }),
    });
    if (ticket !== requestId.current) return;
    if (!switched.ok) {
      setView({ status: "error", message: "This desk could not be reached." });
      return;
    }
    const next = await fetchDesk(org);
    if (ticket !== requestId.current) return;
    setView(next);
    if (next.status === "desk") void loadBrain(next.room);
  }

  async function onAssign() {
    if (view.status !== "desk" || !view.leader) return;
    const roomAtSend = view.room;
    const person = view.people.find((row) => row.membershipId === selectedId);
    if (!person) {
      setFormError("Choose one person on this desk.");
      return;
    }
    const spec = {
      id: crypto.randomUUID(),
      org: view.room,
      title,
      outcome,
      units: units.map((unit) => ({
        id: unit.id,
        title: unit.title,
        source_unit_id: unit.source_unit_id,
      })),
      mode: "assign" as const,
    };
    setPending(true);
    setFormError("");
    setNotice("");
    try {
      const res = await fetch("/assign/save", {
        method: "POST",
        headers: { "content-type": "application/json", "x-fs-org": view.room },
        body: JSON.stringify({ membershipId: person.membershipId, spec }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        assignment?: OpenAssignment;
      };
      if (!res.ok || !data.ok || !data.assignment) {
        setFormError(messageFor(data.error || ""));
        return;
      }
      setView((current) => {
        if (current.status !== "desk" || current.room !== roomAtSend) return current;
        return {
          ...current,
          assignments: visibleAssignments(
            current.room,
            [data.assignment as OpenAssignment, ...current.assignments],
            current.actorMembershipId,
            true,
          ),
        };
      });
      setSelectedId("");
      setNotice(assignedLine(data.assignment.name, data.assignment.nextUnit));
    } catch {
      setFormError("This desk could not be reached.");
    } finally {
      setPending(false);
    }
  }

  const room = view.status === "desk" ? view.room : null;
  const copy = room ? DESK_COPY[room] : null;
  const otherDoor =
    view.status === "desk" ? view.doors.find((door) => door !== view.room) : undefined;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12" data-desk={room ?? view.status}>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {copy?.eyebrow || "Assign"}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Assign</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{JOB_SENTENCE}</p>

      {view.status === "loading" ? <p className="mt-8 text-sm">Loading this desk.</p> : null}

      {view.status === "guest" ? (
        <div className="mt-8">
          <p className="text-sm leading-relaxed">{GUEST_COPY}</p>
          <Link
            href="/login?next=/assign"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      ) : null}

      {view.status === "child" ? <p className="mt-8 text-sm leading-relaxed">{ERROR_COPY.child_has_no_login}</p> : null}

      {view.status === "error" ? <p className="mt-8 text-sm leading-relaxed">{view.message}</p> : null}

      {view.status === "pick" ? (
        <section className="mt-8">
          <p className="text-sm leading-relaxed">{PICK_COPY}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {view.doors.map((door) => (
              <button
                key={door}
                type="button"
                className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
                onClick={() => void switchDesk(door)}
              >
                {door === "sales" ? "Open the sales desk" : "Open the household desk"}
              </button>
            ))}
          </div>
          {view.doors.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No assign desk is open for this org.</p>
          ) : null}
        </section>
      ) : null}

      {view.status === "desk" && copy ? (
        <section className="mt-8">
          <p className="text-sm leading-relaxed">{copy.law}</p>
          {view.leader ? null : <p className="mt-4 text-sm leading-relaxed">{LEARNER_COPY}</p>}

          {view.leader ? (
            <form
              className="mt-8 rounded-xl border border-border bg-card px-4 py-4"
              onSubmit={(event) => {
                event.preventDefault();
                void onAssign();
              }}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Lesson</p>
              <label className="mt-4 block text-sm" htmlFor="assign-title">
                Title
                <input
                  id="assign-title"
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <label className="mt-4 block text-sm" htmlFor="assign-outcome">
                Outcome
                <input
                  id="assign-outcome"
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
                  value={outcome}
                  onChange={(event) => setOutcome(event.target.value)}
                />
              </label>
              <p className="mt-4 text-sm text-muted-foreground">Org {view.room}. Mode assign.</p>
              <div className="mt-4 space-y-3">
                {units.map((unit, index) => (
                  <div key={unit.id} className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm" htmlFor={`unit-title-${unit.id}`}>
                      Unit
                      <input
                        id={`unit-title-${unit.id}`}
                        className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
                        value={unit.title}
                        onChange={(event) => {
                          const next = units.slice();
                          next[index] = { ...unit, title: event.target.value };
                          setUnits(next);
                        }}
                      />
                    </label>
                    <label className="block text-sm" htmlFor={`unit-source-${unit.id}`}>
                      Source unit id
                      <input
                        id={`unit-source-${unit.id}`}
                        className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
                        value={unit.source_unit_id}
                        onChange={(event) => {
                          const next = units.slice();
                          next[index] = { ...unit, source_unit_id: event.target.value };
                          setUnits(next);
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-4 text-sm underline underline-offset-2"
                onClick={() => setUnits([...units, freshUnit()])}
              >
                Add a unit
              </button>

              <fieldset className="mt-8">
                <legend className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {copy.person}
                </legend>
                {view.people.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">{copy.empty}</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {view.people.map((person) => (
                      <label
                        key={person.membershipId}
                        className="flex cursor-pointer gap-3 rounded-xl border border-border px-4 py-3"
                        data-role="assignee"
                        data-kind={person.kind}
                        data-login={person.login}
                      >
                        <input
                          type="radio"
                          name="assignee"
                          className="mt-1"
                          checked={selectedId === person.membershipId}
                          onChange={() => setSelectedId(person.membershipId)}
                        />
                        <span>
                          <span className="block text-sm">{person.name}</span>
                          <span className="mt-1 block text-sm text-muted-foreground">{copy.loginLine}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              {formError ? <p className="mt-4 text-sm">{formError}</p> : null}
              {notice ? (
                <p className="mt-4 text-sm" role="status">
                  {notice}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={pending || view.people.length === 0}
                className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Assign this path
              </button>
            </form>
          ) : null}

          <section className="mt-10">
            <h2 className="font-display text-2xl tracking-tight">Open paths</h2>
            {view.assignments.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No open path on this desk.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {view.assignments.map((row) => (
                  <li key={row.id} className="rounded-xl border border-border px-4 py-4" data-login={row.login}>
                    <p className="text-sm">{row.name}</p>
                    <p className="mt-1 font-display text-xl tracking-tight">{row.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{row.outcome}</p>
                    <p
                      className="mt-2 text-sm"
                      data-next-portion={brainNext[row.membershipId] || row.nextUnit}
                      data-next-from={brainNext[row.membershipId] ? "brain" : "stored"}
                    >
                      Next portion: {brainNext[row.membershipId] || row.nextUnit}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This portion stays when you leave and return. {copy.loginLine}
                    </p>
                    <Link href="/teach-live" className="mt-3 inline-flex text-sm underline underline-offset-2">
                      Teach this path
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {otherDoor ? (
            <button
              type="button"
              className="mt-8 text-sm underline underline-offset-2"
              onClick={() => void switchDesk(otherDoor)}
            >
              {otherDoor === "sales" ? "Open the sales desk" : "Open the household desk"}
            </button>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
