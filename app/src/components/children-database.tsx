"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FamilyV1Home } from "@/components/family-v1-home";

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
  const [pathCurrent, setPathCurrent] = useState<{
    id: string;
    version: number;
    status: string;
    items: Array<{
      id: string;
      sortOrder: number;
      title: string;
      subject: string;
      source: string;
      composerLessonId: string | null;
      childMembershipId: string;
    }>;
  } | null>(null);
  const [pathAssigned, setPathAssigned] = useState<typeof pathCurrent>(null);
  const [pathVersions, setPathVersions] = useState<Array<{ id: string; version: number; status: string }>>(
    [],
  );
  const [pathEdit, setPathEdit] = useState("");
  const [pathPrompt, setPathPrompt] = useState("");
  const [portionCurrent, setPortionCurrent] = useState<{
    id: string;
    version: number;
    status: string;
    horizon: string;
    title: string;
    reason: string;
    items: Array<{
      id: string;
      sortOrder: number;
      title: string;
      subject: string;
      childMembershipId: string;
    }>;
  } | null>(null);
  const [portionLocked, setPortionLocked] = useState<typeof portionCurrent>(null);
  const [portionRemaining, setPortionRemaining] = useState<
    Array<{ title: string; subject: string; childMembershipId: string }>
  >([]);
  const [portionVersions, setPortionVersions] = useState<
    Array<{ id: string; version: number; status: string; title: string }>
  >([]);
  const [portionOverride, setPortionOverride] = useState("");
  const [ledgerCurrent, setLedgerCurrent] = useState<{
    id: string;
    version: number;
    summary: { completed?: number; inProgress?: number; recommended?: number; next?: string | null };
    units: Array<{
      id: string;
      sortOrder: number;
      title: string;
      subject: string;
      status: string;
      childMembershipId: string;
    }>;
  } | null>(null);
  const [ledgerCompleted, setLedgerCompleted] = useState<
    Array<{ title: string; subject: string; status: string; confidence?: string; flag?: string }>
  >([]);
  const [ledgerInProgress, setLedgerInProgress] = useState<
    Array<{ title: string; subject: string; status: string; confidence?: string; flag?: string }>
  >([]);
  const [ledgerRecommended, setLedgerRecommended] = useState<
    Array<{ title: string; subject: string; status: string; confidence?: string; flag?: string }>
  >([]);
  const [ledgerNext, setLedgerNext] = useState<{ title: string; subject: string } | null>(null);
  const [ledgerVersions, setLedgerVersions] = useState<
    Array<{ id: string; version: number; status: string }>
  >([]);

  function lines(value: string) {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n");
  }

  async function loadPath(membershipId: string) {
    const res = await fetch(
      `/api/curriculum?child_membership_id=${encodeURIComponent(membershipId)}`,
      { headers: HOUSEHOLD_HEADERS },
    );
    const data = await res.json();
    if (!res.ok) {
      setPathCurrent(null);
      setPathAssigned(null);
      setPathVersions([]);
      setPathEdit("");
      return;
    }
    const current = (data.current ?? null) as typeof pathCurrent;
    setPathCurrent(current);
    setPathAssigned((data.assigned ?? null) as typeof pathCurrent);
    setPathVersions((data.versions ?? []) as typeof pathVersions);
    setPathEdit((current?.items ?? []).map((item) => item.title).join("\n"));
  }

  async function loadPortion(membershipId: string) {
    const res = await fetch(
      `/api/portion?child_membership_id=${encodeURIComponent(membershipId)}`,
      { headers: HOUSEHOLD_HEADERS },
    );
    const data = await res.json();
    if (!res.ok) {
      setPortionCurrent(null);
      setPortionLocked(null);
      setPortionRemaining([]);
      setPortionVersions([]);
      setPortionOverride("");
      return;
    }
    const current = (data.current ?? null) as typeof portionCurrent;
    setPortionCurrent(current);
    setPortionLocked((data.locked ?? null) as typeof portionCurrent);
    setPortionRemaining((data.remaining ?? []) as typeof portionRemaining);
    setPortionVersions((data.versions ?? []) as typeof portionVersions);
    setPortionOverride((current?.items ?? []).map((item) => item.title).join("\n"));
  }

  async function loadLedger(membershipId: string) {
    const res = await fetch(
      `/api/ledger?child_membership_id=${encodeURIComponent(membershipId)}`,
      { headers: HOUSEHOLD_HEADERS },
    );
    const data = await res.json();
    if (!res.ok) {
      setLedgerCurrent(null);
      setLedgerCompleted([]);
      setLedgerInProgress([]);
      setLedgerRecommended([]);
      setLedgerNext(null);
      setLedgerVersions([]);
      return;
    }
    setLedgerCurrent((data.current ?? null) as typeof ledgerCurrent);
    setLedgerCompleted((data.completed ?? []) as typeof ledgerCompleted);
    setLedgerInProgress((data.inProgress ?? []) as typeof ledgerInProgress);
    setLedgerRecommended((data.recommended ?? []) as typeof ledgerRecommended);
    setLedgerNext((data.next ?? null) as typeof ledgerNext);
    setLedgerVersions((data.versions ?? []) as typeof ledgerVersions);
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
    await loadPath(membershipId);
    await loadPortion(membershipId);
    await loadLedger(membershipId);
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
    if (res.ok) {
      await loadIntent(selectedMembershipId);
      await loadPath(selectedMembershipId);
      await loadPortion(selectedMembershipId);
      await loadLedger(selectedMembershipId);
    }
  }

  async function proposePath() {
    if (!selectedMembershipId) return;
    const res = await fetch("/api/curriculum", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ childMembershipId: selectedMembershipId }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? `Path v${data.path?.version ?? data.current?.version} proposed for this child.`
        : data.error === "intent_required"
          ? "Save a learning intent before proposing a path."
          : data.error || "Could not propose path.",
    );
    if (res.ok) {
      await loadPath(selectedMembershipId);
      await loadPortion(selectedMembershipId);
      await loadLedger(selectedMembershipId);
    }
  }

  async function acceptPath() {
    if (!selectedMembershipId) return;
    const res = await fetch("/api/curriculum", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ childMembershipId: selectedMembershipId, action: "accept" }),
    });
    const data = await res.json();
    setNote(res.ok ? `Path v${data.path?.version ?? data.current?.version} assigned to this child.` : data.error || "Could not accept path.");
    if (res.ok) {
      await loadPath(selectedMembershipId);
      await loadPortion(selectedMembershipId);
      await loadLedger(selectedMembershipId);
    }
  }

  async function editPath() {
    if (!selectedMembershipId) return;
    const res = await fetch("/api/curriculum", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({
        childMembershipId: selectedMembershipId,
        action: "edit",
        items: pathEdit.split("\n").map((title) => title.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    setNote(res.ok ? `Path v${data.path?.version ?? data.current?.version} edited for this child.` : data.error || "Could not edit path.");
    if (res.ok) {
      await loadPath(selectedMembershipId);
      await loadPortion(selectedMembershipId);
      await loadLedger(selectedMembershipId);
    }
  }

  async function rePromptPath() {
    if (!selectedMembershipId) return;
    const res = await fetch("/api/curriculum", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({
        childMembershipId: selectedMembershipId,
        action: "re-prompt",
        prompt: pathPrompt,
      }),
    });
    const data = await res.json();
    setNote(res.ok ? `Path v${data.path?.version ?? data.current?.version} re-proposed for this child.` : data.error || "Could not re-prompt path.");
    if (res.ok) {
      setPathPrompt("");
      await loadPath(selectedMembershipId);
      await loadPortion(selectedMembershipId);
      await loadLedger(selectedMembershipId);
    }
  }

  async function suggestPortion() {
    if (!selectedMembershipId) return;
    const res = await fetch("/api/portion", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ childMembershipId: selectedMembershipId }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? `Next portion v${data.portion?.version ?? data.current?.version} suggested for this child.`
        : data.error === "path_required"
          ? "Accept a curriculum path before suggesting a next portion."
          : data.error === "intent_required"
            ? "Save a learning intent before suggesting a next portion."
            : data.error === "remaining_required"
              ? "No remaining stations on the accepted path."
              : data.error || "Could not suggest next portion.",
    );
    if (res.ok) {
      await loadPortion(selectedMembershipId);
      await loadLedger(selectedMembershipId);
    }
  }

  async function lockPortion() {
    if (!selectedMembershipId) return;
    const res = await fetch("/api/portion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ childMembershipId: selectedMembershipId, action: "lock" }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? `Next portion v${data.portion?.version ?? data.current?.version} locked for this child.`
        : data.error === "portion_required"
          ? "Suggest a next portion before locking."
          : data.error || "Could not lock next portion.",
    );
    if (res.ok) {
      await loadPortion(selectedMembershipId);
      await loadLedger(selectedMembershipId);
    }
  }

  async function overridePortion() {
    if (!selectedMembershipId) return;
    const res = await fetch("/api/portion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({
        childMembershipId: selectedMembershipId,
        action: "override",
        items: portionOverride.split("\n").map((title) => title.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? `Next portion v${data.portion?.version ?? data.current?.version} overridden for this child.`
        : data.error || "Could not override next portion.",
    );
    if (res.ok) {
      await loadPortion(selectedMembershipId);
      await loadLedger(selectedMembershipId);
    }
  }

  async function refreshLedger() {
    if (!selectedMembershipId) return;
    const res = await fetch("/api/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({ childMembershipId: selectedMembershipId }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? `Progress ledger v${data.ledger?.version ?? data.current?.version} refreshed for this child.`
        : data.error === "units_required"
          ? "Accept a path or record a unit before refreshing the ledger."
          : data.error || "Could not refresh ledger.",
    );
    if (res.ok) await loadLedger(selectedMembershipId);
  }

  async function markUnit(action: "start" | "complete", title: string) {
    if (!selectedMembershipId || !title) return;
    const res = await fetch("/api/ledger", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({
        childMembershipId: selectedMembershipId,
        action,
        title,
      }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? action === "complete"
          ? `${title} marked complete for this child.`
          : `${title} marked in progress for this child.`
        : data.error === "title_required"
          ? "Pick a unit to record."
          : data.error || "Could not record unit.",
    );
    if (res.ok) {
      await loadLedger(selectedMembershipId);
      await loadPortion(selectedMembershipId);
    }
  }

  async function markConfidence(title: string, confidence: string, flag = "") {
    if (!selectedMembershipId || !title) return;
    const res = await fetch("/api/ledger", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...HOUSEHOLD_HEADERS },
      body: JSON.stringify({
        childMembershipId: selectedMembershipId,
        action: "confidence",
        title,
        confidence,
        flag,
      }),
    });
    const data = await res.json();
    setNote(
      res.ok
        ? `Parent confidence recorded for ${title}.`
        : data.error === "confidence_required"
          ? "Pick Not yet, Getting there, or Ready."
          : data.error || "Could not record confidence.",
    );
    if (res.ok) await loadLedger(selectedMembershipId);
  }

  function confidenceButtons(item: { title: string; confidence?: string; flag?: string }) {
    const current = item.confidence || "";
    return (
      <span className="mt-2 flex flex-wrap gap-2">
        {(
          [
            ["not_yet", "Not yet"],
            ["getting_there", "Getting there"],
            ["ready", "Ready"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={`${item.title}-${value}`}
            type="button"
            variant="outline"
            className={current === value ? "border-primary" : undefined}
            onClick={() => void markConfidence(item.title, value, item.flag || "")}
          >
            {label}
          </Button>
        ))}
      </span>
    );
  }

  return (
    <section className="card p-5">
      <h2 className="h-section">{heading}</h2>
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
              className="input min-w-0 flex-1"
              placeholder="Child name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
            />
            <Button onClick={() => void addChild()}>Add a child</Button>
          </div>
          <div className="card mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50">
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
                          variant="outline"
                          className={
                            selectedMembershipId === row.membershipId
                              ? "mt-2 border-primary"
                              : "mt-2"
                          }
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
                          className="mt-2 inline-flex items-center rounded-brand border border-border px-3 py-1.5 text-xs font-semibold"
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
                            className="input min-h-16"
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
            <FamilyV1Home
              child={children.find((row) => row.membershipId === selectedMembershipId) ?? null}
              household={children}
              onSwitchChild={(membershipId) => void selectChild(membershipId)}
              onChildSaved={() => void loadChildren()}
            />
          ) : null}
          {selectedMembershipId ? (
            <div className="card mt-6 p-4">
              <h3 className="h-card">Learning intent</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Parent-owned plan seeds for the selected child. This is not a parent note and not Field Pattern.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm">
                  Goals
                  <textarea
                    className="input mt-1 min-h-20 w-full"
                    value={intentDraft.goals}
                    onChange={(e) =>
                      setIntentDraft((prev) => ({ ...prev, goals: e.target.value }))
                    }
                  />
                </label>
                <label className="text-sm">
                  Subjects
                  <textarea
                    className="input mt-1 min-h-20 w-full"
                    value={intentDraft.subjects}
                    onChange={(e) =>
                      setIntentDraft((prev) => ({ ...prev, subjects: e.target.value }))
                    }
                  />
                </label>
                <label className="text-sm">
                  Themes
                  <textarea
                    className="input mt-1 min-h-20 w-full"
                    value={intentDraft.themes}
                    onChange={(e) =>
                      setIntentDraft((prev) => ({ ...prev, themes: e.target.value }))
                    }
                  />
                </label>
                <label className="text-sm">
                  Constraints
                  <textarea
                    className="input mt-1 min-h-20 w-full"
                    value={intentDraft.constraints}
                    onChange={(e) =>
                      setIntentDraft((prev) => ({ ...prev, constraints: e.target.value }))
                    }
                  />
                </label>
                <label className="text-sm md:col-span-2">
                  Time horizon
                  <input
                    className="input mt-1 w-full"
                    value={intentDraft.timeHorizon}
                    onChange={(e) =>
                      setIntentDraft((prev) => ({ ...prev, timeHorizon: e.target.value }))
                    }
                    placeholder="this term"
                  />
                </label>
              </div>
              <div className="mt-4">
                <Button type="button" variant="outline" onClick={() => void saveIntent()}>
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
          {selectedMembershipId ? (
            <div className="card mt-6 p-4">
              <h3 className="h-card">Curriculum path</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ordered path bound to the selected child. Household catalog lessons attach here with
                the child membership, not as an org-only catalog.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void proposePath()}>
                  Propose path
                </Button>
                <Button type="button" variant="outline" onClick={() => void acceptPath()}>
                  Accept path
                </Button>
              </div>
              {pathCurrent ? (
                <ol className="mt-4 space-y-2 text-sm">
                  {pathCurrent.items.map((item) => (
                    <li key={item.id}>
                      {item.sortOrder ? `${item.sortOrder}. ` : ""}
                      {item.title}
                      {item.subject ? ` · ${item.subject}` : ""}
                      {item.composerLessonId ? " · catalog bound to this child" : ""}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No path versions yet.</p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                {pathAssigned
                  ? `Assigned v${pathAssigned.version} on this child.`
                  : pathCurrent
                    ? `Proposed v${pathCurrent.version} · ${pathCurrent.status}. Accept to bind it.`
                    : "Accept assigns the path to this child record."}
              </p>
              <label className="mt-4 block text-sm">
                Edit order
                <textarea
                  className="input mt-1 min-h-24 w-full"
                  value={pathEdit}
                  onChange={(e) => setPathEdit(e.target.value)}
                />
              </label>
              <div className="mt-3">
                <Button type="button" variant="outline" onClick={() => void editPath()}>
                  Save edited path
                </Button>
              </div>
              <label className="mt-4 block text-sm">
                Re-prompt
                <input
                  className="input mt-1 w-full"
                  value={pathPrompt}
                  onChange={(e) => setPathPrompt(e.target.value)}
                  placeholder="Add fractions review"
                />
              </label>
              <div className="mt-3">
                <Button type="button" variant="outline" onClick={() => void rePromptPath()}>
                  Re-prompt path
                </Button>
              </div>
              {pathVersions.length ? (
                <ol className="mt-4 space-y-2 text-sm">
                  {pathVersions.map((row) => (
                    <li key={row.id}>
                      v{row.version} · {row.status}
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}
          {selectedMembershipId ? (
            <div className="card mt-6 p-4">
              <h3 className="h-card">Next portion</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Suggested slice of the remaining accepted path for the selected child. Parent can
                lock or override. This is not Pattern chooser and not a child login.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void suggestPortion()}>
                  Suggest next portion
                </Button>
                <Button type="button" variant="outline" onClick={() => void lockPortion()}>
                  Lock portion
                </Button>
              </div>
              {portionCurrent ? (
                <>
                  <p className="mt-4 text-sm">
                    {portionCurrent.title} · {portionCurrent.horizon} · {portionCurrent.status}
                  </p>
                  <ol className="mt-3 space-y-2 text-sm">
                    {portionCurrent.items.map((item) => (
                      <li key={item.id}>
                        {item.sortOrder ? `${item.sortOrder}. ` : ""}
                        {item.title}
                        {item.subject ? ` · ${item.subject}` : ""}
                      </li>
                    ))}
                  </ol>
                  {portionCurrent.reason ? (
                    <p className="mt-3 text-sm text-muted-foreground">{portionCurrent.reason}</p>
                  ) : null}
                </>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No next-portion versions yet.</p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                {portionLocked
                  ? `Locked v${portionLocked.version} on this child.`
                  : portionCurrent
                    ? `Suggested v${portionCurrent.version} · ${portionCurrent.status}. Lock to keep it.`
                    : "Suggest after an accepted path. Remaining stations wait on that path."}
              </p>
              {portionRemaining.length ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Remaining on the accepted path: {portionRemaining.map((row) => row.title).join(", ")}
                </p>
              ) : null}
              <label className="mt-4 block text-sm">
                Override stations
                <textarea
                  className="input mt-1 min-h-24 w-full"
                  value={portionOverride}
                  onChange={(e) => setPortionOverride(e.target.value)}
                />
              </label>
              <div className="mt-3">
                <Button type="button" variant="outline" onClick={() => void overridePortion()}>
                  Override portion
                </Button>
              </div>
              {portionVersions.length ? (
                <ol className="mt-4 space-y-2 text-sm">
                  {portionVersions.map((row) => (
                    <li key={row.id}>
                      v{row.version} · {row.status} · {row.title}
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}
          {selectedMembershipId ? (
            <div className="card mt-6 p-4">
              <h3 className="h-card">Progress ledger</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Parent-supervised unit ledger for the selected child. Completed, in progress,
                recommended next, and parent confidence (Not yet / Getting there / Ready). This is
                not session progress and not Pattern chooser.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void refreshLedger()}>
                  Refresh ledger
                </Button>
              </div>
              {ledgerNext ? (
                <p className="mt-4 text-sm">
                  Recommended next: {ledgerNext.title}
                  {ledgerNext.subject ? ` · ${ledgerNext.subject}` : ""}
                </p>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No recommended next unit yet.</p>
              )}
              {ledgerInProgress.length ? (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">In progress</p>
                  <ol className="mt-2 space-y-2 text-sm">
                    {ledgerInProgress.map((item) => (
                      <li key={`in-${item.title}`}>
                        <p>
                          {item.title}
                          {item.subject ? ` · ${item.subject}` : ""}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2"
                          onClick={() => void markUnit("complete", item.title)}
                        >
                          Complete unit
                        </Button>
                        {confidenceButtons(item)}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
              {ledgerCompleted.length ? (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <ol className="mt-2 space-y-2 text-sm">
                    {ledgerCompleted.map((item) => (
                      <li key={`done-${item.title}`}>
                        <p>
                          {item.title}
                          {item.subject ? ` · ${item.subject}` : ""}
                        </p>
                        {confidenceButtons(item)}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
              {ledgerRecommended.length ? (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">Recommended</p>
                  <ol className="mt-2 space-y-2 text-sm">
                    {ledgerRecommended.map((item) => (
                      <li key={`rec-${item.title}`}>
                        <p>
                          {item.title}
                          {item.subject ? ` · ${item.subject}` : ""}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2"
                          onClick={() => void markUnit("start", item.title)}
                        >
                          Start unit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2 ml-2"
                          onClick={() => void markUnit("complete", item.title)}
                        >
                          Complete unit
                        </Button>
                        {confidenceButtons(item)}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
              <p className="mt-3 text-sm text-muted-foreground">
                {ledgerCurrent
                  ? `Ledger v${ledgerCurrent.version} on this child.`
                  : "Refresh after an accepted path, or start a unit while you sit with this child."}
              </p>
              {ledgerVersions.length ? (
                <ol className="mt-4 space-y-2 text-sm">
                  {ledgerVersions.map((row) => (
                    <li key={row.id}>
                      v{row.version} · {row.status}
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}
        </>
      )}
      {note && !blocked ? <p className="mt-4 text-sm text-pass">{note}</p> : null}
    </section>
  );
}
