"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { DeskPage, DeskTable, EmptyState, KpiStrip } from "@/components/desk/desk";
import { COLLECTIONS, type CollectionSlug } from "@/lib/evolution/collections";
import { peopleKpis } from "@/lib/desk/kpi";
import { peopleContext, type LivingBrain } from "@/lib/living-brain/model";
import { lessonSpineConfidence, lessonSpineStep } from "@/lib/player/play-rail-write";
import {
  DESK_COPY,
  JOB_SENTENCE,
  initialDesk,
  peopleForDesk,
  roomsFor,
  type Desk,
  type PersonRow,
} from "./desk";

type BrainLine = { membershipId: string; confidence: string; nextStep: string };

export default function PeoplePage() {
  const [roster, setRoster] = useState<PersonRow[]>([]);
  const [desk, setDesk] = useState<Desk | null>(null);
  const [choices, setChoices] = useState<Desk[]>([]);
  const [staff, setStaff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState<BrainLine[]>([]);
  const [aim, setAim] = useState("");
  const [childName, setChildName] = useState("");
  const [childNote, setChildNote] = useState<string | null>(null);
  const [collection, setCollection] = useState<CollectionSlug>("families");
  const [canEdit, setCanEdit] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});
  const [nameNote, setNameNote] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);
  const shiftPick = useRef(false);

  async function loadLines(room: Desk) {
    try {
      const response = await fetch("/api/living-brain");
      if (!response.ok) {
        setLines([]);
        setAim("");
        return;
      }
      const data = (await response.json()) as { brain?: LivingBrain };
      const brain = data.brain;
      if (!brain || brain.room !== room) {
        setLines([]);
        setAim("");
        return;
      }
      setAim(brain.outcome || "");
      setLines(peopleContext({ room, brain }));
    } catch {
      setLines([]);
      setAim("");
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [meRes, peopleRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/org/people"),
        ]);
        const me = (await meRes.json()) as {
          activeOrg?: { slug?: string } | null;
          memberships?: { org?: string }[];
        };
        const data = (await peopleRes.json()) as {
          error?: string;
          org?: string;
          staff?: boolean;
          canEdit?: boolean;
          people?: PersonRow[];
        };
        if (cancelled) return;
        if (!peopleRes.ok) {
          setError(
            data.error === "child_cannot_list"
              ? "A child is not a buyer. This list is for the User."
              : data.error || "Could not load people.",
          );
          setReady(true);
          return;
        }
        const slugs = (me.memberships ?? []).map((row) => row.org || "");
        const isStaff = Boolean(data.staff);
        setStaff(isStaff);
        setCanEdit(Boolean(data.canEdit));
        const nextNames: Record<string, string> = {};
        for (const person of data.people ?? []) nextNames[person.membershipId] = person.name;
        setNames(nextNames);
        setChoices(roomsFor(slugs, isStaff));
        const active = initialDesk({
          activeSlug: me.activeOrg?.slug || data.org || "",
          membershipSlugs: slugs,
          staff: isStaff,
        });
        setDesk(active);
        setRoster(data.people ?? []);
        if (active) await loadLines(active);
        if (cancelled) return;
        setReady(true);
      } catch {
        if (!cancelled) {
          setError("Could not load people.");
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshRoster() {
    const peopleRes = await fetch("/api/org/people");
    const data = (await peopleRes.json()) as { people?: PersonRow[] };
    if (peopleRes.ok) setRoster(data.people ?? []);
  }

  async function addChild(event: FormEvent) {
    event.preventDefault();
    setChildNote(null);
    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: childName.trim() }),
      });
      const json = (await res.json()) as { child?: { name?: string } };
      if (!res.ok) {
        setChildNote("Could not add a child.");
        return;
      }
      setChildName("");
      setChildNote(json.child?.name ? `${json.child.name} is in the family.` : "Added to the family.");
      await refreshRoster();
    } catch {
      setChildNote("Could not add a child.");
    }
  }

  async function choose(next: Desk) {
    const previous = desk;
    setDesk(next);
    setError(null);
    try {
      const res = await fetch("/api/org/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: next }),
      });
      if (!res.ok && !staff) {
        setDesk(previous);
        setError("Could not open that room.");
        return;
      }
      await loadLines(next);
    } catch {
      if (!staff) {
        setDesk(previous);
        setError("Could not open that room.");
      }
    }
  }

  const rows = desk ? peopleForDesk(roster, desk) : [];
  const copy = desk ? DESK_COPY[desk] : null;
  const picked = roster.filter((person) => selected.includes(person.membershipId));

  function masterOrgLabel(person: PersonRow) {
    const name = person.orgName || person.org;
    if (person.org === "household" && name === "Family") return "Household";
    return name;
  }

  function pickPerson(id: string, shift: boolean) {
    setSelected((current) => {
      if (shift && anchor) {
        const ids = roster.map((person) => person.membershipId);
        const from = ids.indexOf(anchor);
        const to = ids.indexOf(id);
        if (from >= 0 && to >= 0) {
          const [start, end] = from < to ? [from, to] : [to, from];
          const range = new Set(current);
          for (const item of ids.slice(start, end + 1)) range.add(item);
          return ids.filter((item) => range.has(item));
        }
      }
      return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    });
    setAnchor(id);
  }

  return (
    <DeskPage
      eyebrow="People"
      title={copy?.title ?? "People"}
      width="4xl"
      data-desk={desk ?? "none"}
      lede={
        <>
          <p className="text-base">{JOB_SENTENCE}</p>
          <p className="mt-3">
            {copy
              ? copy.lede
              : "This desk shows one room. Sales lists login learners. Family lists the children in this home. Login is none. A child is not a buyer."}
          </p>
        </>
      }
    >
      <section className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Everyone</p>
        <h2 className="mt-2 font-display text-4xl leading-[1.02] tracking-[-0.035em]">Master view</h2>
        {staff ? (
          <p className="mt-4 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium">
            In super admin view
          </p>
        ) : null}
        <p className="mt-3 max-w-xl text-muted-foreground">
          Each person, and which org they belong to.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_36px_-24px_rgba(26,25,22,0.55)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {canEdit ? (
                  <th className="w-10 px-4 py-3 font-medium">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={roster.length > 0 && picked.length === roster.length}
                      onChange={(event) => {
                        setAnchor(null);
                        setSelected(event.target.checked ? roster.map((person) => person.membershipId) : []);
                      }}
                    />
                  </th>
                ) : null}
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Kind</th>
                <th className="px-4 py-3 font-medium">Org</th>
                <th className="px-4 py-3 font-medium">Login</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((person) => (
                <tr key={`all-${person.membershipId}`} className="border-t border-border">
                  {canEdit ? (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${person.name}`}
                        checked={selected.includes(person.membershipId)}
                        onPointerDown={(event) => {
                          shiftPick.current = event.shiftKey;
                        }}
                        onKeyDown={(event) => {
                          shiftPick.current = event.shiftKey;
                        }}
                        onChange={() => pickPerson(person.membershipId, shiftPick.current)}
                      />
                    </td>
                  ) : null}
                  <td className="px-4 py-3">{person.name}</td>
                  <td className="px-4 py-3">{person.kind === "child" ? "Child" : "Adult"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/o/${person.org}`} className="underline underline-offset-2">
                      {masterOrgLabel(person)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{person.kind === "child" ? "None" : "Member"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {canEdit ? (
          <form
            className="mt-6 rounded-2xl border border-border bg-card p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const updates = picked
                .map((person) => ({ membershipId: person.membershipId, name: (names[person.membershipId] ?? person.name).trim() }))
                .filter((row) => row.name.length >= 2);
              void fetch("/api/org/people", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ updates }),
              })
                .then(async (res) => {
                  const body = (await res.json().catch(() => ({}))) as { saved?: number };
                  setNameNote(res.ok ? `Saved ${body.saved ?? 0} names. People stay in their org.` : "Names could not be saved.");
                })
                .catch(() => setNameNote("Names could not be saved."));
            }}
          >
            <p className="text-sm font-medium">Edit people</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Select people with the checkboxes. Click down the line to select a range. People stay in their org. A family child is not moved onto the sales desk.
            </p>
            {picked.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {picked.map((person) => (
                  <label key={`edit-${person.membershipId}`} className="grid gap-1 text-sm sm:grid-cols-[1fr_8rem] sm:items-center">
                    <input
                      className="h-11 rounded-xl border border-border bg-background px-3"
                      aria-label={`Name for ${person.name}`}
                      value={names[person.membershipId] ?? person.name}
                      onChange={(event) =>
                        setNames((current) => ({ ...current, [person.membershipId]: event.target.value }))
                      }
                    />
                    <span className="text-muted-foreground">{masterOrgLabel(person)}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Select people above to edit their names.</p>
            )}
            {picked.length > 0 ? (
              <button type="submit" className="mt-4 inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm text-primary-foreground">
                Save names
              </button>
            ) : null}
            {nameNote ? <p className="mt-3 text-sm">{nameNote}</p> : null}
          </form>
        ) : null}
      </section>
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Collections">
          <ul className="space-y-1">
            {COLLECTIONS.map((item) => (
              <li key={item.slug}>
                <button
                  type="button"
                  aria-pressed={collection === item.slug}
                  onClick={() => setCollection(item.slug)}
                  className={
                    collection === item.slug
                      ? "flex w-full flex-col rounded-lg bg-secondary px-3 py-2 text-left"
                      : "flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-secondary/70"
                  }
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div>
      {collection === "families" ? (
      <>
      {choices.length > 1 ? (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Room">
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={desk === choice}
              data-room={choice}
              onClick={() => void choose(choice)}
              className={
                desk === choice
                  ? "inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm text-primary-foreground"
                  : "inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm"
              }
            >
              {choice === "sales" ? "Sales" : "Family"}
            </button>
          ))}
        </div>
      ) : null}
      {desk === "household" ? (
        <form
          onSubmit={(event) => void addChild(event)}
          className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_16px_36px_-24px_rgba(26,25,22,0.55)]"
        >
          <label className="grid min-w-48 flex-1 gap-1 text-sm">
            Child name
            <input
              className="h-11 rounded-xl border border-border bg-background px-3"
              value={childName}
              placeholder="Name"
              onChange={(event) => setChildName(event.target.value)}
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm text-primary-foreground shadow-[0_8px_20px_-14px_rgba(26,25,22,0.45)]"
          >
            Add a child
          </button>
          {childNote ? <p className="w-full text-sm">{childNote}</p> : null}
        </form>
      ) : null}
      {error ? <p className="mb-6 text-sm">{error}</p> : null}
      {desk && copy ? <KpiStrip label={`${copy.title} at a glance`} items={peopleKpis({ rows, lines, kindLabel: copy.kind })} /> : null}
      {aim || lines.some((line) => lessonSpineStep(line.nextStep)) ? (
        <p
          className="mb-6 text-sm"
          data-org-aim="yes"
          data-aim-from={!aim && lines.some((line) => lessonSpineStep(line.nextStep)) ? "outcomes" : undefined}
        >
          <span className="text-xs font-medium uppercase tracking-[0.12em]" data-aim-label="Aim">
            Aim
          </span>
          <span className="mt-1 block text-muted-foreground">
            {aim || lines.map((line) => lessonSpineStep(line.nextStep)).find(Boolean)}
          </span>
        </p>
      ) : null}
      {desk && copy ? (
        <DeskTable
          caption={copy.title}
          columns={["Name", "Kind", "Stance", "Org", "Login", "How they are doing", "Next step"]}
          rowCount={rows.length}
          empty={ready && !error ? copy.empty : null}
        >
          {rows.map((person) => {
              const line = lines.find((row) => row.membershipId === person.membershipId);
              const spine = line?.nextStep ? lessonSpineStep(line.nextStep) : null;
              const spineConfidence = line?.nextStep ? lessonSpineConfidence(line.nextStep) : null;
              return (
              <tr
                key={`${desk}-${person.membershipId}`}
                className="border-t border-border"
                data-room={desk}
                data-kind={copy.kind}
                data-sales-children={desk === "sales" ? "0" : undefined}
              >
                <td className="px-4 py-3">{person.name}</td>
                <td className="px-4 py-3">{copy.kind}</td>
                <td className="px-4 py-3">{person.stance}</td>
                <td className="px-4 py-3">
                  <Link href={`/o/${person.org}`} className="underline underline-offset-2">
                    {person.orgName || person.org}
                  </Link>
                </td>
                <td className="px-4 py-3">{copy.login}</td>
                <td
                  className="px-4 py-3 text-muted-foreground"
                  data-confidence={person.membershipId}
                  data-confidence-from={spineConfidence ? "outcomes" : undefined}
                >
                  {line?.confidence || spineConfidence ? (
                    <>
                      <span className="block text-xs font-medium uppercase tracking-[0.12em] text-foreground" data-confidence-label="Confidence">
                        Confidence
                      </span>
                      {spineConfidence || line?.confidence}
                    </>
                  ) : (
                    "No note on how they are doing yet."
                  )}
                </td>
                <td
                  className="px-4 py-3"
                  data-next-step={person.membershipId}
                  data-lesson-spine-next={spine || undefined}
                  data-next-from={spine ? "outcomes" : undefined}
                >
                  {spine ? (
                    <Link href="/play/lesson-spine">{spine}</Link>
                  ) : (
                    line?.nextStep || "No next step yet."
                  )}
                </td>
              </tr>
              );
            })}
        </DeskTable>
      ) : ready && !error ? (
        <EmptyState>Choose Sales or Family.</EmptyState>
      ) : null}
      </>
      ) : null}
      {collection === "profiles" ? (
        <ul className="grid gap-3">
          {(rows.length ? rows : roster).map((person) => (
            <li key={`profile-${person.membershipId}`} className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="font-display text-2xl">{person.name}</p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Family</dt>
                  <dd className="mt-1">{person.orgName || person.org}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Kind</dt>
                  <dd className="mt-1">{person.kind === "child" ? "Child" : "Adult"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Login</dt>
                  <dd className="mt-1">{person.login === "none" ? "None" : "Member"}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      ) : null}
      {collection === "milestones" ? (
        <ul className="grid gap-3">
          {lines.length ? lines.map((line) => {
            const person = roster.find((row) => row.membershipId === line.membershipId);
            return (
              <li key={`mile-${line.membershipId}`} className="rounded-2xl border border-border bg-card px-5 py-4">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{person?.name || "Profile"}</p>
                <p className="mt-1 font-medium">{line.nextStep || "No next step yet."}</p>
                <p className="mt-2 text-sm text-muted-foreground">{line.confidence || "No note yet."}</p>
              </li>
            );
          }) : (
            <li className="text-sm text-muted-foreground">No milestones in this room yet.</li>
          )}
        </ul>
      ) : null}
      {collection === "media" ? (
        <div className="rounded-2xl border border-border bg-card px-5 py-5">
          <p className="text-sm text-muted-foreground">
            Media is a file, a PDF, or a minute of audio. It relates to a profile. Drop it in the wizard and it stays in the knowledge until you generate a lesson.
          </p>
          <p className="mt-4 text-sm">
            <Link href="/library/wizard" className="underline underline-offset-4">Open the wizard</Link>
          </p>
        </div>
      ) : null}
        </div>
      </div>
    </DeskPage>
  );
}
