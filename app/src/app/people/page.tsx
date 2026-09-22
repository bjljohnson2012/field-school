"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DESK_COPY,
  JOB_SENTENCE,
  initialDesk,
  peopleForDesk,
  roomsFor,
  type Desk,
  type PersonRow,
} from "./desk";

export default function PeoplePage() {
  const [roster, setRoster] = useState<PersonRow[]>([]);
  const [desk, setDesk] = useState<Desk | null>(null);
  const [choices, setChoices] = useState<Desk[]>([]);
  const [staff, setStaff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

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
        setChoices(roomsFor(slugs, isStaff));
        setDesk(
          initialDesk({
            activeSlug: me.activeOrg?.slug || data.org || "",
            membershipSlugs: slugs,
            staff: isStaff,
          }),
        );
        setRoster(data.people ?? []);
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
      }
    } catch {
      if (!staff) {
        setDesk(previous);
        setError("Could not open that room.");
      }
    }
  }

  const rows = desk ? peopleForDesk(roster, desk) : [];
  const copy = desk ? DESK_COPY[desk] : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12" data-desk={desk ?? "none"}>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">People</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{copy?.title ?? "People"}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{JOB_SENTENCE}</p>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        {copy
          ? copy.lede
          : "This desk shows one room. Sales lists login learners. Household lists tracked children. Login is none for a tracked child. A child is not a buyer."}
      </p>
      {choices.length > 1 ? (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Room">
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
              {choice === "sales" ? "Sales" : "Household"}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <p className="mt-6 text-sm">{error}</p> : null}
      {desk && copy ? (
        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{copy.title}</caption>
            <thead className="bg-card text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Kind</th>
                <th className="px-4 py-3 font-medium">Stance</th>
                <th className="px-4 py-3 font-medium">Org</th>
                <th className="px-4 py-3 font-medium">Login</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && ready && !error ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                    {copy.empty}
                  </td>
                </tr>
              ) : (
                rows.map((person) => (
                  <tr
                    key={`${desk}-${person.membershipId}`}
                    className="border-t border-border"
                    data-room={desk}
                    data-kind={copy.kind}
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : ready && !error ? (
        <p className="mt-8 text-sm text-muted-foreground">Choose Sales or Household.</p>
      ) : null}
    </main>
  );
}
