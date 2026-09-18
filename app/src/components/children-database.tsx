"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const HOUSEHOLD_HEADERS = { "x-fs-org": "household" } as const;

export type ChildRow = {
  id: string;
  name: string;
  kind: string;
  membershipId: string;
  login: string;
  welcomeWatched: boolean;
  patternTitle: string | null;
  locked: boolean;
  note: string;
};

export function ChildrenDatabase({
  heading = "Children",
}: {
  heading?: string;
}) {
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [childName, setChildName] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  async function loadChildren() {
    const res = await fetch("/api/children", { headers: HOUSEHOLD_HEADERS });
    const data = await res.json();
    if (!res.ok) {
      setBlocked(true);
      setNote(data.error || "Household guardian only.");
      return;
    }
    setBlocked(false);
    const rows = (data.children ?? []) as ChildRow[];
    setChildren(rows);
    const next: Record<string, string> = {};
    for (const row of rows) next[row.membershipId] = row.note || "";
    setNotes(next);
  }

  useEffect(() => {
    void loadChildren();
  }, []);

  async function addChild() {
    const res = await fetch("/api/children", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ name: childName }),
    });
    const data = await res.json();
    setNote(res.ok ? `Child ${data.child.name} added.` : data.error);
    if (res.ok) {
      setChildName("");
      await loadChildren();
    }
  }

  async function toggleLock(membershipId: string, locked: boolean) {
    const res = await fetch("/api/pattern/lock", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ membership_id: membershipId, locked }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNote(
        data.error === "profile_required"
          ? "Child must take Field Pattern before you can lock the profile."
          : data.error || "Could not lock.",
      );
      return;
    }
    setNote(locked ? "Child profile locked." : "Child profile unlocked.");
    await loadChildren();
  }

  async function saveNote(membershipId: string) {
    const res = await fetch("/api/children", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ membershipId, note: notes[membershipId] || "" }),
    });
    const data = await res.json();
    setNote(res.ok ? "Parent note saved." : data.error || "Could not save note.");
    if (res.ok) await loadChildren();
  }

  async function recordWelcome(membershipId: string) {
    const res = await fetch("/api/children", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ membershipId, welcomeWatched: true }),
    });
    const data = await res.json();
    setNote(res.ok ? "Welcome recorded for this child." : data.error || "Could not record welcome.");
    if (res.ok) await loadChildren();
  }

  return (
    <section className="rounded-xl border border-border bg-card px-5 py-5">
      <h2 className="font-display text-2xl">{heading}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Parent-facing children/subusers database. Say child, not student. Kids have no own login. You record feedback and progress here.
      </p>
      {blocked ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {note || "Open household as a parent to manage children."}
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
              placeholder="Child name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
            />
            <Button onClick={() => void addChild()}>Add a child</Button>
          </div>
          <div className="mt-5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-background text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Child</th>
                  <th className="px-3 py-3 font-medium">Subuser</th>
                  <th className="px-3 py-3 font-medium">Login</th>
                  <th className="px-3 py-3 font-medium">Welcome</th>
                  <th className="px-3 py-3 font-medium">Pattern</th>
                  <th className="px-3 py-3 font-medium">Parent note</th>
                </tr>
              </thead>
              <tbody>
                {children.length === 0 ? (
                  <tr>
                    <td className="px-3 py-5 text-muted-foreground" colSpan={6}>
                      No children yet.
                    </td>
                  </tr>
                ) : (
                  children.map((row) => (
                    <tr key={row.membershipId} className="border-t border-border">
                      <td className="px-3 py-3">
                        <p>{row.name}</p>
                        <p className="text-xs text-muted-foreground">Child</p>
                      </td>
                      <td className="px-3 py-3">Yes · no login</td>
                      <td className="px-3 py-3">None</td>
                      <td className="px-3 py-3">
                        <p>{row.welcomeWatched ? "Watched" : "Not yet"}</p>
                        {row.welcomeWatched ? null : (
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-2"
                            onClick={() => void recordWelcome(row.membershipId)}
                          >
                            Record welcome
                          </Button>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <p>{row.patternTitle || "Not run"}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.locked ? "Locked" : "Open"}
                        </p>
                        <Link
                          href={`/pattern?child=${encodeURIComponent(row.membershipId)}`}
                          className="mt-2 inline-flex h-9 items-center rounded-xl border border-border px-3 text-xs"
                        >
                          {row.patternTitle ? "Review Pattern" : "Record Pattern"}
                        </Link>
                        {row.patternTitle ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-2"
                            onClick={() => void toggleLock(row.membershipId, !row.locked)}
                          >
                            {row.locked ? "Unlock profile" : "Lock profile"}
                          </Button>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex min-w-[14rem] flex-col gap-2">
                          <textarea
                            className="min-h-16 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                            value={notes[row.membershipId] ?? ""}
                            onChange={(e) =>
                              setNotes((prev) => ({
                                ...prev,
                                [row.membershipId]: e.target.value,
                              }))
                            }
                            placeholder="Feedback or progress"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void saveNote(row.membershipId)}
                          >
                            Save note
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      {note && !blocked ? <p className="mt-4 text-sm text-pass">{note}</p> : null}
    </section>
  );
}
