"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Person = {
  membershipId: string;
  name: string;
  kind: string;
  stance: string;
  org: string;
  orgName: string;
  login: string;
};

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/org/people")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not load people.");
          return;
        }
        setPeople(data.people ?? []);
      })
      .catch(() => setError("Could not load people."));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Orgs
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">View all</h1>
      <p className="mt-3 text-muted-foreground">
        Everyone you can see, and which org they belong to. A child has no own
        login.
      </p>
      {error ? <p className="mt-6 text-sm">{error}</p> : null}
      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
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
            {people.length === 0 && !error ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                  No people yet.
                </td>
              </tr>
            ) : (
              people.map((person) => (
                <tr key={person.membershipId} className="border-t border-border">
                  <td className="px-4 py-3">{person.name}</td>
                  <td className="px-4 py-3">
                    {person.kind === "child" ? "Child" : "Adult"}
                  </td>
                  <td className="px-4 py-3">{person.stance}</td>
                  <td className="px-4 py-3">
                    <Link href={`/o/${person.org}`} className="underline underline-offset-2">
                      {person.orgName || person.org}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {person.kind === "child" ? "None" : "Member"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
