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
  const [selectedMembershipId, setSelectedMembershipId] = useState("");
  const [intentDraft, setIntentDraft] = useState({
    goals: "",
    subjects: "",
    themes: "",
    timeHorizon: "",
    constraints: "",
  });
  const [intentVersions, setIntentVersions] = useState<
    Array<{
      id: string;
      version: number;
      goals: string[];
      subjects: string[];
      themes: string[];
      timeHorizon: string;
      constraints: string[];
      createdAt: string;
    }>
  >([]);

  function lines(value: string) {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n");
  }

  async function loadIntent(membershipId: string) {
    const res = await fetch(
      `/api/intent?child_membership_id=${encodeURIComponent(membershipId)}`,
      { headers: HOUSEHOLD_HEADERS },
    );
    const data = await res.json();
    if (!res.ok) {
      setIntentVersions([]);
      return;
    }
    const current = data.current as
      | {
          goals?: string[];
          subjects?: string[];
          themes?: string[];
          timeHorizon?: string;
          constraints?: string[];
        }
      | null;
    setIntentVersions((data.versions ?? []) as typeof intentVersions);
    setIntentDraft({
      goals: (current?.goals ?? []).join("\n"),
      subjects: (current?.subjects ?? []).join("\n"),
      themes: (current?.themes ?? []).join("\n"),
      timeHorizon: current?.timeHorizon ?? "",
      constraints: (current?.constraints ?? []).join("\n"),
    });
  }

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

  async function selectChild(membershipId: string) {
    setSelectedMembershipId(membershipId);
    await loadIntent(membershipId);
  }

  async function saveIntent() {
    if (!selectedMembershipId) return;
    const res = await fetch("/api/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({
        childMembershipId: selectedMembershipId,
        goals: lines(intentDraft.goals).split("\n").filter(Boolean),
        subjects: lines(intentDraft.subjects).split("\n").filter(Boolean),
        themes: lines(intentDraft.themes).split("\n").filter(Boolean),
        timeHorizon: intentDraft.timeHorizon,
        constraints: lines(intentDraft.constraints).split("\n").filter(Boolean),
      }),
    });
    const data = await res.json();
    setNote(res.ok ? `Intent v${data.version?.version ?? data.current?.version} saved.` : data.error || "Could not save intent.");
    if (res.ok) await loadIntent(selectedMembershipId);
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
                        <Button
                          type="button"
                          variant={selectedMembershipId === row.membershipId ? "default" : "outline"}
                          className="mt-2"
                          onClick={() => void selectChild(row.membershipId)}
                        >
                          {selectedMembershipId === row.membershipId ? "Selected child" : "Select child"}
                        </Button>
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
          {selectedMembershipId ? (
            <div className="mt-6 rounded-xl border border-border px-4 py-4">
              <h3 className="font-display text-xl">Learning intent</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Parent-owned plan seeds for the selected child. This is not a parent note and not Field Pattern.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm">
                  Goals
                  <textarea
                    className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2"
                    value={intentDraft.goals}
                    onChange={(e) =>
                      setIntentDraft((prev) => ({ ...prev, goals: e.target.value }))
                    }
                  />
                </label>
                <label className="text-sm">
                  Subjects
                  <textarea
                    className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2"
                    value={intentDraft.subjects}
                    onChange={(e) =>
                      setIntentDraft((prev) => ({ ...prev, subjects: e.target.value }))
                    }
                  />
                </label>
                <label className="text-sm">
                  Themes
                  <textarea
                    className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2"
                    value={intentDraft.themes}
                    onChange={(e) =>
                      setIntentDraft((prev) => ({ ...prev, themes: e.target.value }))
                    }
                  />
                </label>
                <label className="text-sm">
                  Constraints
                  <textarea
                    className="mt-1 min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2"
                    value={intentDraft.constraints}
                    onChange={(e) =>
                      setIntentDraft((prev) => ({ ...prev, constraints: e.target.value }))
                    }
                  />
                </label>
                <label className="text-sm md:col-span-2">
                  Time horizon
                  <input
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3"
                    value={intentDraft.timeHorizon}
                    onChange={(e) =>
                      setIntentDraft((prev) => ({ ...prev, timeHorizon: e.target.value }))
                    }
                    placeholder="this term"
                  />
                </label>
              </div>
              <div className="mt-4">
                <Button type="button" onClick={() => void saveIntent()}>
                  Save intent version
                </Button>
              </div>
              {intentVersions.length ? (
                <ol className="mt-4 space-y-2 text-sm">
                  {intentVersions.map((row) => (
                    <li key={row.id}>
                      v{row.version} · {row.timeHorizon || "no horizon"} ·{" "}
                      {(row.goals[0] || row.subjects[0] || "empty").slice(0, 80)}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No intent versions yet.</p>
              )}
            </div>
          ) : null}
        </>
      )}
      {note && !blocked ? <p className="mt-4 text-sm text-pass">{note}</p> : null}
    </section>
  );
}
